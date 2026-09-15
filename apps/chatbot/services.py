"""Plain PostgreSQL analytics queries.

These are the "ground truth" functions - no LLM involved. They are used
in two places:
  1. Directly, to build the `analytics` snapshot returned alongside every
     chat response (for the frontend's stat cards).
  2. Wrapped as LangChain tools in tools.py, so the agent can call them
     on demand instead of everything being stuffed into the prompt.
"""

from typing import List, Optional

from django.db.models import Avg, Count

from apps.companies.models import Company
from apps.feedback.models import Feedback

from .schemas import ChatTurn, FinalAnswer

# NOTE: agent.py imports tools.py, which imports this module (services.py)
# for its Django ORM queries. Importing `agent` lazily inside run_chat()
# below (instead of at module load time) breaks that circular import.


def get_company_analytics(company_id: Optional[int] = None) -> dict:
    """Satisfaction + sentiment analytics, optionally scoped to one company."""

    feedback = Feedback.objects.all()

    if company_id:
        feedback = feedback.filter(company_id=company_id)

    total = feedback.count()

    positive = feedback.filter(sentiment__iexact="POSITIVE").count()
    negative = feedback.filter(sentiment__iexact="NEGATIVE").count()
    neutral = feedback.filter(sentiment__iexact="NEUTRAL").count()

    processed = feedback.filter(is_processed=True).count()
    pending = feedback.filter(is_processed=False).count()

    rating = feedback.aggregate(average=Avg("rating"))["average"]
    if rating is not None:
        rating = round(float(rating), 2)

    if total:
        positive_percentage = round(positive / total * 100, 2)
        negative_percentage = round(negative / total * 100, 2)
        neutral_percentage = round(neutral / total * 100, 2)
    else:
        positive_percentage = 0
        negative_percentage = 0
        neutral_percentage = 0

    top_issues = list(
        feedback.filter(sentiment__iexact="NEGATIVE")
        .exclude(category__isnull=True)
        .exclude(category="")
        .values("category")
        .annotate(total=Count("id"))
        .order_by("-total")[:10]
    )

    return {
        "total_feedback": total,
        "positive": positive,
        "negative": negative,
        "neutral": neutral,
        "positive_percentage": positive_percentage,
        "negative_percentage": negative_percentage,
        "neutral_percentage": neutral_percentage,
        "average_rating": rating,
        "processed": processed,
        "pending": pending,
        "top_issues": top_issues,
    }


def get_all_company_analytics() -> list:
    """Per-company analytics, for company-comparison questions."""

    companies = Company.objects.all().order_by("name")

    return [
        {
            "company_id": company.id,
            "company_name": company.name,
            **get_company_analytics(company.id),
        }
        for company in companies
    ]


def get_feature_requests(company_id: Optional[int] = None, limit: int = 10) -> list:
    """Feedback items categorized as feature requests.

    Assumes 'category' sometimes holds a value like 'Feature Request'.
    Adjust the filter below if your schema tags these differently
    (e.g. a boolean `is_feature_request` field or a separate type enum).
    """

    feedback = Feedback.objects.filter(category__icontains="feature")

    if company_id:
        feedback = feedback.filter(company_id=company_id)

    feedback = feedback.select_related("company", "product").order_by(
        "-created_at"
    )[:limit]

    return [
        {
            "id": item.id,
            "company": item.company.name if item.company else None,
            "product": item.product.name if item.product else None,
            "title": item.title,
            "content": item.content,
            "rating": item.rating,
        }
        for item in feedback
    ]


def _history_to_messages(history: List[ChatTurn]):
    from langchain_core.messages import AIMessage, HumanMessage

    messages = []
    for turn in history or []:
        if not turn.content:
            continue
        if turn.role == "user":
            messages.append(HumanMessage(content=turn.content))
        elif turn.role == "assistant":
            messages.append(AIMessage(content=turn.content))
    return messages


def run_chat(
    message: str,
    company_id: Optional[int] = None,
    history: Optional[List[ChatTurn]] = None,
) -> FinalAnswer:
    """Runs the LangGraph tool-calling agent for one turn and returns its
    validated structured FinalAnswer."""

    from langchain_core.messages import HumanMessage, SystemMessage

    from .agent import run_agent

    messages = _history_to_messages(history or [])

    scope_note = (
        f"Current scope: company_id={company_id}. Use this as the default "
        f"company_id argument for tools unless the user asks about a "
        f"different company or a comparison across companies."
        if company_id
        else "Current scope: all companies (no company filter applied)."
    )
    messages.insert(0, SystemMessage(content=scope_note))
    messages.append(HumanMessage(content=message))

    return run_agent(messages)
