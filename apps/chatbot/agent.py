"""LangGraph agent: a single tool-calling loop against Groq that ends by
calling the FinalAnswer pseudo-tool, giving a validated Pydantic
structured response directly from tool-calling.

Why NOT a two-phase design (research loop, then a second unbound call
asking the model to freehand JSON): some Groq-served models keep
routing their output through a tool-call channel even with no tools
bound, inventing a never-registered tool name and getting rejected by
Groq's own API (tool_use_failed). A two-phase split also means the
"final" prompt needs to duplicate every conversational/behavioral rule
from the main system prompt (casual greetings, follow-up context,
etc.) - easy to get out of sync, as happened here (a plain "hello" was
answered with "no database evidence" because the second-phase prompt
didn't know how to just say hi). Keeping FinalAnswer as one real tool,
bound for the whole conversation, avoids both problems and is faster
(one LLM round trip for anything that doesn't need tools, instead of
always paying for two).

Graph shape:

    START -> agent -+-> (FinalAnswer called, or no tool_calls) -> END
                     |
                     +-> (a domain tool called) -> tools -> agent (loop)
"""

import os
from typing import Annotated, List, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, SystemMessage
from langgraph.errors import GraphRecursionError
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from .prompts import SYSTEM_PROMPT
from .schemas import FinalAnswer
from .tools import DOMAIN_TOOLS

# llama-3.3-70b-versatile has proven reliable for tool calling on Groq.
# Reasoning-style / "harmony"-format models (e.g. openai/gpt-oss-*) are
# more prone to emitting malformed or unregistered tool calls under
# heavy tool use - if you want to try one, test it against several
# multi-tool questions (including a plain "hello") before relying on it.
DEFAULT_MODEL = "llama-3.3-70b-versatile"
RECURSION_LIMIT = 20

_RECURSION_FALLBACK_SUMMARY = (
    "I gathered some information but couldn't finish analyzing it in "
    "time. Try asking a more specific question (e.g. name one company, "
    "or one metric)."
)
_ERROR_FALLBACK_SUMMARY = (
    "I ran into a problem generating a response to that. Could you try "
    "rephrasing the question, or asking something more specific?"
)


class AgentState(TypedDict):
    messages: Annotated[List[AnyMessage], add_messages]


def _get_llm():
    from langchain_groq import ChatGroq

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY environment variable is not set. Add it to .env."
        )

    model = os.environ.get("GROQ_MODEL", DEFAULT_MODEL)
    return ChatGroq(model=model, temperature=0.2, api_key=api_key)


def _fallback_final_answer_message(summary: str) -> AIMessage:
    """A synthetic AIMessage carrying a FinalAnswer tool call. Used when
    the underlying model call itself fails (e.g. Groq rejects a
    malformed tool call the model generated). This routes straight to
    END with a graceful answer instead of the exception surfacing as a
    502 to the user."""

    return AIMessage(
        content="",
        tool_calls=[
            {
                "name": "FinalAnswer",
                "args": {
                    "summary": summary,
                    "facts": [],
                    "recommendations": [],
                    "data_sufficient": False,
                },
                "id": "fallback-final-answer",
            }
        ],
    )


def _call_model(state: AgentState):
    # FinalAnswer is bound alongside the domain tools for the entire
    # conversation, not swapped in later - that's what makes the "call
    # FinalAnswer as your last step" instruction in the system prompt
    # (section 6A) actually work, and avoids ever needing a second,
    # unbound LLM call.
    llm = _get_llm().bind_tools(DOMAIN_TOOLS + [FinalAnswer])

    try:
        response = llm.invoke(state["messages"])
    except Exception:
        # The model produced something Groq's API itself rejected, or
        # the request otherwise failed - nothing to repair here since
        # LangChain never got a usable response. Fail soft.
        response = _fallback_final_answer_message(_ERROR_FALLBACK_SUMMARY)

    return {"messages": [response]}


def _route(state: AgentState):
    last = state["messages"][-1]
    tool_calls = getattr(last, "tool_calls", None) or []

    if not tool_calls:
        return END

    if any(call["name"] == "FinalAnswer" for call in tool_calls):
        return END

    return "tools"


_compiled_graph = None


def get_graph():
    global _compiled_graph

    if _compiled_graph is None:
        graph = StateGraph(AgentState)
        graph.add_node("agent", _call_model)
        graph.add_node("tools", ToolNode(DOMAIN_TOOLS))
        graph.set_entry_point("agent")
        graph.add_conditional_edges(
            "agent", _route, {"tools": "tools", END: END}
        )
        graph.add_edge("tools", "agent")
        _compiled_graph = graph.compile()

    return _compiled_graph


def run_agent(messages: List[AnyMessage]) -> FinalAnswer:
    """Runs the graph to completion and returns its structured FinalAnswer.

    `messages` is the conversation so far (scope note + history + the
    latest HumanMessage) - the main system prompt is added here.
    """

    graph = get_graph()
    full_messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    try:
        result = graph.invoke(
            {"messages": full_messages},
            config={"recursion_limit": RECURSION_LIMIT},
        )
    except GraphRecursionError:
        return FinalAnswer(
            summary=_RECURSION_FALLBACK_SUMMARY,
            facts=[],
            recommendations=[],
            data_sufficient=False,
        )

    final_message = result["messages"][-1]
    tool_calls = getattr(final_message, "tool_calls", None) or []

    for call in tool_calls:
        if call["name"] == "FinalAnswer":
            return FinalAnswer.model_validate(call["args"])

    # The model stopped without calling FinalAnswer (e.g. answered in
    # plain text). Wrap whatever it said so the API response shape
    # stays consistent.
    content = final_message.content if isinstance(final_message, AIMessage) else ""

    return FinalAnswer(
        summary=content or "I wasn't able to generate an answer for that.",
        facts=[],
        recommendations=[],
        data_sufficient=bool(content),
    )