import { api } from "@/lib/api";
import type {
  ChatRequestPayload,
  ChatResponsePayload,
} from "@/types/chatbot";

/**
 * Sends a message (plus optional company scope and recent history) to
 * POST /api/v1/chatbot/chat/. The response's `answer` is now a
 * structured FinalAnswer object (summary/facts/recommendations), not a
 * plain string - see types/chatbot.ts.
 */
export async function sendChatMessage(
  payload: ChatRequestPayload
): Promise<ChatResponsePayload> {
  return api<ChatResponsePayload>("/chatbot/chat/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
