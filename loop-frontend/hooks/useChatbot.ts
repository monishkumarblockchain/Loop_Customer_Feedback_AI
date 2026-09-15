"use client";

import { useCallback, useState } from "react";

import { sendChatMessage } from "@/services/chatbotService";
import type { ChatMessage, CompanyAnalytics } from "@/types/chatbot";

// How many prior turns to send back as conversational context.
const MAX_HISTORY_TURNS = 6;

export function useChatbot(companyId?: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];

      setMessages(nextMessages);
      setError(null);
      setLoading(true);

      try {
        // History sent to the backend is plain {role, content} - the
        // structured `data` on assistant turns is UI-only.
        const history = nextMessages
          .slice(-MAX_HISTORY_TURNS - 1, -1)
          .map(({ role, content }) => ({ role, content }));

        const response = await sendChatMessage({
          message: trimmed,
          company_id: companyId ?? null,
          history,
        });

        setAnalytics(response.analytics);
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            content: response.answer.summary,
            data: response.answer,
          },
        ]);
      } catch (err) {
        const messageText =
          err instanceof Error ? err.message : "Unable to get AI response.";
        setError(messageText);
        setMessages((previous) => [
          ...previous,
          { role: "assistant", content: messageText },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, companyId]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setAnalytics(null);
    setError(null);
  }, []);

  return { messages, analytics, loading, error, sendMessage, reset };
}
