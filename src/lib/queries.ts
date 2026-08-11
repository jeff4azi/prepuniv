/**
 * Shared Supabase query helpers.
 *
 * All functions return data shaped like the old mock types so pages that
 * already destructure those shapes need minimal changes.
 */
import { supabase } from "./supabase";
import type {
  Profile,
  Course,
  Quiz,
  Question,
  QuizAttempt,
  AttemptResult,
  AttemptAnswer,
  University,
  CreatorApplication,
  PayoutRequest,
  CreatorReport,
  WalletTransaction,
} from "../mock/types";

// ─── Re-export University type for pages that need it ─────────────────────────
export type { University };

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Map a DB profile row to the mock Profile shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProfile(row: any): Profile {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email ?? "",
    role: row.role,
    is_approved_creator: !!row.is_approved_creator,
    is_suspended: !!row.is_suspended,
    university_id: row.university_id ?? undefined,
    email_confirmed: !!row.email_confirmed_at,
    agreement_accepted_at: row.agreement_accepted_at ?? undefined,
    bank_account_number: row.bank_account_number ?? undefined,
    bank_code: row.bank_code ?? undefined,
    avatar_url: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    joined_at: row.created_at,
  };
}

/** Map a DB course row to the mock Course shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCourse(row: any): Course {
  return {
    id: row.id,
    code: row.code ?? row.name ?? "",
    title: row.name ?? row.code ?? "",
    subject_area: row.subject_area ?? "General Studies",
    level: (row.level as 100 | 200 | 300 | 400) ?? 100,
    is_computational: !!row.is_computational,
    university_id: row.university_id ?? "",
  };
}

/** Map a DB quiz row to the mock Quiz shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuiz(row: any): Quiz {
  return {
    id: row.id,
    creator_id: row.creator_id,
    course_id: row.course_id,
    university_id: row.university_id ?? "",
    title: row.title,
    description: row.description ?? "",
    price: row.price,
    is_published: !!row.is_published,
    unpublished_by_admin: !!row.unpublished_by_admin,
    question_count: row.question_count ?? 0,
    attempt_count: row.attempt_count ?? 0,
    created_at: row.created_at,
    time_limit_seconds: row.time_limit_seconds ?? undefined,
  };
}

/** Map a DB question row to the mock Question shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuestion(row: any): Question {
  const opts = Array.isArray(row.options)
    ? (row.options as string[])
    : typeof row.options === "string"
      ? (JSON.parse(row.options) as string[])
      : undefined;
  const correct =
    typeof row.correct_answer === "string"
      ? row.correct_answer
      : JSON.stringify(row.correct_answer);
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    type: row.type as "mcq" | "fill_blank",
    question_text: row.question_text,
    options: opts,
    correct_answer: correct,
  };
}

/** Map a DB attempt row to the mock QuizAttempt shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAttempt(row: any): QuizAttempt {
  return {
    id: row.id,
    user_id: row.user_id,
    quiz_id: row.quiz_id,
    score: row.score ?? 0,
    is_timed: !!row.is_timed,
    started_at: row.started_at,
    completed_at: row.completed_at ?? row.started_at,
    time_taken_seconds: row.time_taken_seconds ?? undefined,
  };
}

/** Map a DB wallet_transaction row to the mock WalletTransaction shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWalletTxn(row: any): WalletTransaction {
  // DB uses "topup"/"quiz_payment"/"creator_earning"/"platform_revenue"/"payout"
  // mock uses "deposit"/"purchase"/"creator_earning"/"platform_revenue"/"withdrawal"
  const typeMap: Record<string, string> = {
    topup: "deposit",
    quiz_payment: "purchase",
    payout: "withdrawal",
  };
  return {
    id: row.id,
    user_id: row.user_id ?? "",
    amount: row.amount,
    type: (typeMap[row.type] ?? row.type) as WalletTransaction["type"],
    reference: row.reference ?? "",
    related_quiz_id: row.related_quiz_id ?? undefined,
    status: (row.status === "completed"
      ? "success"
      : row.status) as WalletTransaction["status"],
    created_at: row.created_at,
  };
}

/** Map a DB creator_application row to the mock CreatorApplication shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApplication(row: any): CreatorApplication {
  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status as "pending" | "approved" | "rejected",
    courses: row.course_strengths ?? "",
    background: row.background ?? "",
    quiz_plans: row.quiz_plans ?? "",
    links: row.links ?? undefined,
    notes: row.notes ?? undefined,
    submitted_at: row.submitted_at,
  };
}

/** Map a DB payout_request row to the mock PayoutRequest shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPayoutRequest(row: any): PayoutRequest {
  return {
    id: row.id,
    creator_id: row.creator_id,
    amount: row.amount,
    status: row.status as PayoutRequest["status"],
    requested_at: row.requested_at,
    processed_at: row.processed_at ?? undefined,
    notes: row.notes ?? undefined,
    bank_account_number: row.bank_account_number ?? "",
    bank_code: row.bank_code ?? "",
  };
}

/** Map a DB report row to the mock CreatorReport shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toReport(row: any): CreatorReport {
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    quiz_id: row.quiz_id,
    quiz_title: row.quiz_title ?? "",
    reason: row.reason as CreatorReport["reason"],
    other_text: row.other_text ?? undefined,
    details: row.details ?? undefined,
    status: (row.status ?? "open") as CreatorReport["status"],
    created_at: row.created_at,
    resolved_at: row.resolved_at ?? undefined,
  };
}

/** Map a DB university row to the mock University shape */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUniversity(row: any): University {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation ?? row.name,
    state: row.state ?? "",
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** All published quizzes, optionally scoped to a university */
export async function fetchPublishedQuizzes(
  universityId?: string,
): Promise<Quiz[]> {
  let q = supabase.from("quizzes").select("*").eq("is_published", true);
  if (universityId) q = q.eq("university_id", universityId);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []).map(toQuiz);
}

/** All quizzes (admin view) */
export async function fetchAllQuizzes(): Promise<Quiz[]> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(toQuiz);
}

/** Quizzes by a single creator */
export async function fetchCreatorQuizzes(creatorId: string): Promise<Quiz[]> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toQuiz);
}

/** Single quiz by id */
export async function fetchQuiz(id: string): Promise<Quiz | null> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toQuiz(data) : null;
}

/** Questions for a quiz */
export async function fetchQuestions(quizId: string): Promise<Question[]> {
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });
  return (data ?? []).map(toQuestion);
}

/** All courses, optionally scoped to a university */
export async function fetchCourses(universityId?: string): Promise<Course[]> {
  let q = supabase.from("courses").select("*");
  if (universityId) q = q.eq("university_id", universityId);
  const { data } = await q.order("code", { ascending: true });
  return (data ?? []).map(toCourse);
}

/** Single course by id */
export async function fetchCourse(id: string): Promise<Course | null> {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toCourse(data) : null;
}

/** All universities */
export async function fetchUniversities(): Promise<University[]> {
  const { data } = await supabase
    .from("universities")
    .select("*")
    .order("name");
  return (data ?? []).map(toUniversity);
}

/** All profiles (admin only — service-role query) */
export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(toProfile);
}

/** Single profile by id */
export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? toProfile(data) : null;
}

/** Attempts for the current user */
export async function fetchUserAttempts(
  userId: string,
): Promise<QuizAttempt[]> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
  return (data ?? []).map(toAttempt);
}

/** All attempts for a quiz (leaderboard) */
export async function fetchQuizAttempts(
  quizId: string,
): Promise<QuizAttempt[]> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId);
  return (data ?? []).map(toAttempt);
}

/** Attempt answers for a single attempt (result review) */
export async function fetchAttemptAnswers(
  attemptId: string,
): Promise<AttemptAnswer[]> {
  // Select only columns on attempt_answers — no join to questions.
  // question_text and correct_answer are stored as snapshots on the row
  // (saved by the backend at attempt completion time).
  const { data, error } = await supabase
    .from("attempt_answers")
    .select(
      "question_id, question_text, answer_given, correct_answer, is_correct",
    )
    .eq("attempt_id", attemptId);

  if (error) {
    console.warn("fetchAttemptAnswers error:", error.message);
    return [];
  }
  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    question_id: row.question_id,
    question_text: row.question_text ?? "",
    type: "mcq" as const, // type not stored; mcq is safe default for display
    given:
      typeof row.answer_given === "string"
        ? row.answer_given
        : String(row.answer_given ?? ""),
    correct:
      typeof row.correct_answer === "string"
        ? row.correct_answer
        : String(row.correct_answer ?? ""),
    is_correct: !!row.is_correct,
  }));
}

/** Creator applications */
export async function fetchApplications(): Promise<CreatorApplication[]> {
  const { data } = await supabase
    .from("creator_applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  return (data ?? []).map(toApplication);
}

/** Application for a specific user */
export async function fetchMyApplication(
  userId: string,
): Promise<CreatorApplication | null> {
  const { data } = await supabase
    .from("creator_applications")
    .select("*")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toApplication(data) : null;
}

/** All payout requests (admin) */
export async function fetchPayoutRequests(): Promise<PayoutRequest[]> {
  const { data } = await supabase
    .from("payout_requests")
    .select("*")
    .order("requested_at", { ascending: false });
  return (data ?? []).map(toPayoutRequest);
}

/** Payout requests for a creator */
export async function fetchCreatorPayouts(
  creatorId: string,
): Promise<PayoutRequest[]> {
  const { data } = await supabase
    .from("payout_requests")
    .select("*")
    .eq("creator_id", creatorId)
    .order("requested_at", { ascending: false });
  return (data ?? []).map(toPayoutRequest);
}

/** All reports (admin) */
export async function fetchAllReports(): Promise<CreatorReport[]> {
  const { data } = await supabase
    .from("reports")
    .select("*, quizzes(title)")
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) =>
    toReport({
      ...row,
      quiz_title: row.quizzes?.title ?? row.quiz_title ?? "",
    }),
  );
}

/** Reports on a creator's quizzes */
export async function fetchCreatorReports(
  creatorId: string,
): Promise<CreatorReport[]> {
  // fetch quiz ids for this creator first, then reports on those quizzes
  const { data: quizData } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("creator_id", creatorId);
  if (!quizData?.length) return [];
  const quizIds = quizData.map((q) => q.id);
  const titleMap = Object.fromEntries(quizData.map((q) => [q.id, q.title]));
  const { data } = await supabase
    .from("reports")
    .select("*")
    .in("quiz_id", quizIds)
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) =>
    toReport({ ...row, quiz_title: titleMap[row.quiz_id] ?? "" }),
  );
}

/** Wallet transactions for a user */
export async function fetchWalletTransactions(
  userId: string,
): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toWalletTxn);
}

/** All wallet transactions (admin) */
export async function fetchAllTransactions(): Promise<WalletTransaction[]> {
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(toWalletTxn);
}

/** Single attempt by id (with quiz snapshot and user ownership check via query client-side) */
export async function fetchAttemptById(
  attemptId: string,
): Promise<QuizAttempt | null> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  return data ? toAttempt(data) : null;
}

/** Full AttemptResult (with answers + quiz metadata) */
export async function fetchAttemptResult(
  attemptId: string,
): Promise<AttemptResult | null> {
  const attempt = await fetchAttemptById(attemptId);
  if (!attempt) return null;

  const [quiz, answers] = await Promise.all([
    fetchQuiz(attempt.quiz_id),
    fetchAttemptAnswers(attemptId),
  ]);
  if (!quiz) return null;

  return {
    attempt_id: attempt.id,
    quiz_id: attempt.quiz_id,
    quiz_title: quiz.title,
    is_timed: attempt.is_timed,
    score: attempt.score ?? 0,
    total: answers.length,
    answers,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
  };
}

/** Profiles for a list of user ids (for leaderboard names) */
export async function fetchProfilesByIds(
  userIds: string[],
): Promise<Map<string, Profile>> {
  if (!userIds.length) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", [...new Set(userIds)]);
  const map = new Map<string, Profile>();
  for (const row of data ?? []) map.set(row.id, toProfile(row));
  return map;
}
