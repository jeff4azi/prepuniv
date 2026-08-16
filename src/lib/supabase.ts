import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — check frontend/.env.",
  );
}

/**
 * Singleton Supabase browser client.
 * Uses the ANON key only. Money-moving writes go through the Express backend
 * (which holds the service role key), never directly from this client.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type DbProfile = {
  id: string;
  full_name: string;
  role: "user" | "creator" | "admin";
  is_approved_creator: boolean;
  is_suspended: boolean;
  university_id: string | null;
  agreement_accepted_at: string | null;
  bank_account_number: string | null;
  bank_code: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type DbCourse = {
  id: string;
  name: string;
  code: string | null;
  subject_area: string | null;
  level: number | null;
  is_computational: boolean;
  university_id: string | null;
  created_at: string;
};

export type DbUniversity = {
  id: string;
  name: string;
  abbreviation: string;
  state: string | null;
};

export type DbQuiz = {
  id: string;
  creator_id: string;
  course_id: string;
  title: string;
  description: string | null;
  price: number;
  is_published: boolean;
  unpublished_by_admin: boolean;
  version: number;
  time_limit_seconds: number | null;
  question_count: number | null;
  attempt_count: number | null;
  university_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbQuestion = {
  id: string;
  quiz_id: string;
  type: "mcq" | "fill_blank";
  question_text: string;
  options: unknown | null;
  correct_answer: unknown;
  order_index: number;
};

export type DbWalletTxn = {
  id: string;
  user_id: string | null;
  amount: number;
  type:
    | "topup"
    | "quiz_payment"
    | "creator_earning"
    | "platform_revenue"
    | "payout";
  reference: string | null;
  related_quiz_id: string | null;
  related_attempt_id: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
};

export type DbQuizVersion = {
  id: string;
  quiz_id: string;
  version_number: number;
  questions_snapshot: unknown;
  question_count: number;
  created_at: string;
};

export type DbQuizAttempt = {
  id: string;
  user_id: string;
  quiz_id: string;
  quiz_version_id: string | null;
  answers: Record<string, string> | null;
  is_timed: boolean;
  time_allowed_seconds: number | null;
  time_taken_seconds: number | null;
  score: number | null;
  started_at: string;
  completed_at: string | null;
};

export type DbAttemptAnswer = {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_given: unknown | null;
  is_correct: boolean | null;
};

export type DbPayoutRequest = {
  id: string;
  creator_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid" | "failed";
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  bank_account_number: string;
  bank_code: string;
};

export type DbReport = {
  id: string;
  reporter_id: string;
  quiz_id: string;
  quiz_title: string | null;
  reason: string;
  other_text: string | null;
  details: string | null;
  resolution_notes: string | null;
  creator_acknowledged: boolean;
  status: "open" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
};

export type DbCreatorApplication = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  course_strengths: string | null;
  background: string | null;
  quiz_plans: string | null;
  links: string | null;
  copyright_confirmed: boolean;
  notes: string | null;
  submitted_at: string;
  processed_at: string | null;
};

export type DbUserBalance = {
  user_id: string;
  balance: number;
};
