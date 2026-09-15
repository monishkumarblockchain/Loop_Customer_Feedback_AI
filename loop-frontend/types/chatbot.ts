export type ChatRole = "user" | "assistant";
export type Priority = "High" | "Medium" | "Low";

export interface Recommendation {
  insight: string;
  problem: string;
  action: string;
  priority: Priority;
  expected_impact: string;
  evidence: string;
}

/** Matches apps/chatbot/schemas.py FinalAnswer */
export interface FinalAnswer {
  summary: string;
  facts: string[];
  recommendations: Recommendation[];
  data_sufficient: boolean;
}

export interface ChatHistoryTurn {
  role: ChatRole;
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  company_id?: number | null;
  history?: ChatHistoryTurn[];
}

export interface TopIssue {
  category: string;
  total: number;
}

export interface CompanyAnalytics {
  total_feedback: number;
  positive: number;
  negative: number;
  neutral: number;

  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;

  average_rating: number | null;
  processed: number;
  pending: number;
  top_issues: TopIssue[];
}

export interface ChatResponsePayload {
  answer: FinalAnswer;
  analytics: CompanyAnalytics;
}

/** A rendered message in the UI. `data` is only set on assistant
 * messages, holding the full structured answer for rich rendering;
 * `content` alone is what gets sent back as history. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  data?: FinalAnswer;
}
