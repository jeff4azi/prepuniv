export type UserRole = "user" | "creator" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_approved_creator: boolean;
  email_confirmed?: boolean;
  is_suspended?: boolean;
  bank_account_number?: string;
  bank_code?: string;
  avatar_url?: string;
  bio?: string;
  joined_at?: string;
  /** The university this user belongs to. Undefined only for platform admins. */
  university_id?: string;
  /** Whether the user has confirmed their email. Undefined = legacy/admin (treated as confirmed). */
  email_confirmed?: boolean;
  /** ISO timestamp of when the creator accepted the Creator Agreement. */
  agreement_accepted_at?: string;
}

export interface Course {
  id: string;
  /** Course code, e.g. "CSC 122" */
  code: string;
  /** Full course title, e.g. "Introduction to Programming" */
  title: string;
  /** Subject Area name, e.g. "Computer Science" */
  subject_area: string;
  /** Academic level: 100 | 200 | 300 | 400 */
  level: 100 | 200 | 300 | 400;
  /** Whether the course requires per-question timing (computational) */
  is_computational: boolean;
  /** University this course belongs to */
  university_id: string;
}

export interface Quiz {
  id: string;
  creator_id: string;
  course_id: string;
  /** The university this quiz belongs to (inherited from the creator at save time) */
  university_id: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  /** Set to true when an admin force-unpublishes. Distinguishes admin action from creator's own choice. */
  unpublished_by_admin?: boolean;
  question_count: number;
  attempt_count: number;
  created_at: string;
  /** Total timed-mode duration in seconds, set by the creator. Undefined means no time limit (always untimed). */
  time_limit_seconds?: number;
}

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "purchase"
  | "payout"
  | "refund"
  | "creator_earning"
  | "platform_revenue";
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
  time_taken_seconds?: number;
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

// ─── Payout requests ──────────────────────────────────────────────────────────

export type PayoutRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "failed";

export interface PayoutRequest {
  id: string;
  creator_id: string;
  amount: number; // kobo — always the full balance at time of request
  status: PayoutRequestStatus;
  requested_at: string; // ISO
  processed_at?: string; // ISO — set when status moves to paid/rejected/failed
  notes?: string; // rejection reason, failure info, etc.
  bank_account_number: string;
  bank_code: string;
}

// ─── Creator reports (reports made against a creator's quizzes) ───────────────

export type CreatorReportStatus = "open" | "resolved" | "dismissed";

export interface CreatorReport {
  id: string;
  reporter_id: string; // the user who filed the report
  quiz_id: string;
  quiz_title: string;
  reason: ReportReason;
  other_text?: string;
  details?: string;
  status: CreatorReportStatus;
  created_at: string;
  resolved_at?: string;
}
