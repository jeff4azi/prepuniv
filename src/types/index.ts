export type UserRole = "user" | "creator" | "admin";

export interface University {
  id: string;
  name: string;
  /** Short abbreviation shown in chips / badges */
  abbreviation: string;
  /** State the university is located in */
  state: string;
}

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
  /** The university this quiz belongs to */
  university_id: string;
  title: string;
  description: string;
  price: number;
  is_published: boolean;
  unpublished_by_admin?: boolean;
  question_count: number;
  attempt_count: number;
  created_at: string;
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

export interface QuizVersion {
  id: string;
  quiz_id: string;
  version_number: number;
  questions_snapshot: Question[];
  question_count: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  quiz_version_id?: string;
  answers?: Record<string, string>;
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
  /** The correct answer. For fill_blank, pipe-separated acceptable answers */
  correct_answer: string;
}

export interface AttemptAnswer {
  question_id: string;
  given: string;
  correct: string;
  is_correct: boolean;
}

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

export type PayoutRequestStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "rejected"
  | "reversed";

export type PayoutPaymentMethod = "flutterwave" | "manual";

export interface PayoutRequest {
  id: string;
  creator_id: string;
  amount: number;
  status: PayoutRequestStatus;
  requested_at: string;
  processed_at?: string;
  notes?: string;
  bank_account_number: string;
  bank_code: string;
  flutterwave_reference?: string | null;
  flutterwave_transfer_id?: string | null;
  failure_reason?: string | null;
  payment_method: PayoutPaymentMethod;
  manual_reference?: string | null;
  marked_paid_by?: string | null;
}

export type CreatorReportStatus = "open" | "resolved" | "dismissed";

export interface CreatorReport {
  id: string;
  reporter_id: string;
  quiz_id: string;
  quiz_title: string;
  reason: ReportReason;
  other_text?: string;
  details?: string;
  resolution_notes?: string;
  creator_acknowledged: boolean;
  status: CreatorReportStatus;
  created_at: string;
  resolved_at?: string;
}
