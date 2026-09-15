export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar?: string | null;
  created_at: string;
};

export type Company = {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  industry?: string | null;
  owner?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Feedback = {
  id: number;

  title: string;

  content: string;

  company: number;

  company_name?: string;

  company_description?: string | null;

  product: number;

  product_name?: string;

  product_description?: string | null;

  rating?: number | null;

  sentiment?: string | null;

  sentiment_score?: number | null;

  category?: string | null;

  is_processed: boolean;

  created_at: string;

  updated_at: string;
};

export type UserRole =
  | "ADMIN"
  | "OWNER"
  | "ANALYST"
  | "VIEWER";




export type AnalyticsOverview = {
  total_feedback: number;
  positive: number;
  negative: number;
  neutral: number;
  processed: number;
  companies: number;
};

export type SentimentItem = {
  sentiment: string | null;
  total: number;
};

export type IssueItem = {
  category: string | null;
  total: number;
};

export type FeatureRequest = {
  feature_request: string;
  feedback_id: number;
};

export type SummaryResponse = {
  summary: string;
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  recent_count: number;
};


export interface CompanyAnalytics {
  company_id: number;
  company_name: string;

  total_feedback: number;

  positive: number;
  negative: number;
  neutral: number;

  positive_percentage: number;
  negative_percentage: number;
  neutral_percentage: number;

  processed: number;
  pending: number;

  feature_requests: number;

  average_rating: number | null;

  top_issue: string | null;
}

export interface Product {
  id: number;
  company: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}