export type UserRole = "user" | "creator" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_approved_creator: boolean;
  bank_account_number?: string;
  bank_code?: string;
  avatar_url?: string;
  bio?: string;
  joined_at?: string;
}

export interface Course {
  id: string;
  name: string;
  is_computational: boolean;
}

export interface Quiz {
  id: string;
  creator_id: string;
  course_id: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  question_count: number;
  attempt_count: number;
  created_at: string;
}

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "purchase"
  | "payout"
  | "refund";
export type TransactionStatus = "pending" | "success" | "failed";

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  reference: string;
  related_quiz_id?: string;
  status: TransactionStatus;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  is_timed: boolean;
  started_at: string;
  completed_at: string;
}

export type QuestionType = "mcq" | "fill_blank";

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  type: QuestionType;
  /** MCQ only: list of answer choices */
  options?: string[];
  /** The correct answer. For fill_blank, pipe-separated acceptable answers: "answer1|answer2" */
  correct_answer: string;
}

/** A graded answer within a completed attempt result */
export interface AttemptAnswer {
  question_id: string;
  given: string;
  correct: string;
  is_correct: boolean;
}

/** The full result object passed to the result page via route state */
export interface AttemptResult {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  is_timed: boolean;
  score: number;
  total: number;
  answers: AttemptAnswer[];
  started_at: string;
  completed_at: string;
}

/**
 * A persisted attempt result record used for standalone page lookups
 * (e.g. revisiting /attempt/:id/result from History after a page refresh).
 */
export interface AttemptResultRecord extends AttemptResult {
  user_id: string;
}

export type ReportReason =
  | "incorrect_answers"
  | "low_quality"
  | "inappropriate"
  | "copyright"
  | "other";

export interface QuizReport {
  id: string;
  user_id: string;
  quiz_id: string;
  quiz_title: string;
  reason: ReportReason;
  other_text?: string;
  details?: string;
  created_at: string;
}

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface CreatorApplication {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  courses: string;
  background: string;
  quiz_plans: string;
  links?: string;
  notes?: string;
  submitted_at: string;
}
