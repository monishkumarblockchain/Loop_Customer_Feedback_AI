"use client";

import { useEffect, useRef, useState } from "react";

import { useChatbot } from "@/hooks/useChatbot";
import type { ChatMessage, Priority } from "@/types/chatbot";

const SUGGESTED_PROMPTS = [
  "How satisfied are our customers?",
  "Why are customers unhappy?",
  "What are the biggest issues?",
  "What should we improve?",
  "Compare all companies.",
];

const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface AnalyticsChatbotProps {
  /** Restrict the chatbot to one company's feedback. Omit for all companies. */
  companyId?: number | null;
  companyName?: string | null;
}

export default function AnalyticsChatbot({
  companyId = null,
  companyName = null,
}: AnalyticsChatbotProps) {
  const { messages, loading, error, sendMessage, reset } =
    useChatbot(companyId);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function handleSend() {
    if (!input.trim() || loading) return;
    void sendMessage(input);
    setInput("");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            LOOP Analytics AI
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {companyName
              ? `Ask about ${companyName}'s customer feedback.`
              : "Ask about customer satisfaction, sentiment and recommendations."}
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={reset}
            className="text-sm font-medium text-gray-400 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-[520px] min-h-[240px] space-y-4 overflow-y-auto p-6"
      >
        {messages.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-5">
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((item, index) => (
          <ChatBubble key={index} message={item} />
        ))}

        {loading && (
          <div className="max-w-[80%] rounded-xl bg-gray-100 p-4 text-sm text-gray-500">
            Analyzing customer feedback…
          </div>
        )}
      </div>

      {error && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about customer feedback..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-xl bg-black p-4 text-sm text-white">
        {message.content}
      </div>
    );
  }

  const data = message.data;

  return (
    <div className="max-w-[85%] space-y-3 rounded-xl bg-gray-100 p-4 text-sm text-gray-800">
      <p className="whitespace-pre-wrap">{message.content}</p>

      {data && !data.data_sufficient && (
        <p className="text-xs italic text-gray-500">
          Based on limited data — treat this as partial.
        </p>
      )}

      {!!data?.facts.length && (
        <ul className="list-disc space-y-1 pl-4 text-gray-700">
          {data.facts.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
      )}

      {!!data?.recommendations.length && (
        <div className="space-y-2 pt-1">
          {data.recommendations.map((rec, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {rec.action}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[rec.priority]}`}
                >
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs text-gray-600">{rec.problem}</p>
              <p className="mt-1 text-xs text-gray-500">
                Expected impact: {rec.expected_impact}
              </p>
              <p className="mt-1 text-xs italic text-gray-400">
                Evidence: {rec.evidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
