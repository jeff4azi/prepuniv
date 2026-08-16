/**
 * AdminQuizContentPage — /admin/quizzes/:id/content
 *
 * Read-only admin content viewer for a single quiz.
 * Shows every question + answer in authored order (NOT shuffled).
 * No payment required, no attempt created, no buyer-facing UI.
 *
 * Context-aware back link: defaults to /admin/quizzes, but if the
 * admin arrived from the Reports page (via router state `from`),
 * the back link returns to /admin/reports.
 */
import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Flag,
  Users,
  Target,
  BookOpen,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCheck,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { MathText } from "../components/MathText";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { DbQuiz, DbCourse, DbProfile, DbQuestion } from "../lib/supabase";
import {
  adminUnpublishQuiz,
  adminRepublishQuiz,
  AdminLoadingState,
} from "../hooks/useAdminData";
import { formatNaira } from "../components/QuizCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuizStatus = "published" | "unpublished_admin" | "unpublished_creator";

interface QuizStats {
  totalAttempts: number;
  avgScore: number | null;
  uniqueLearners: number;
}

interface OpenReportCount {
  count: number;
}

// ─── Status helpers (mirrors AdminQuizzesPage) ────────────────────────────────

function getQuizStatus(q: DbQuiz): QuizStatus {
  if (q.unpublished_by_admin) return "unpublished_admin";
  if (!q.is_published) return "unpublished_creator";
  return "published";
}

function QuizStatusBadge({ quiz }: { quiz: DbQuiz }) {
  const status = getQuizStatus(quiz);
  if (status === "published")
    return (
      <Badge variant="success" size="sm" dot>
        Published
      </Badge>
    );
  if (status === "unpublished_admin")
    return (
      <Badge variant="danger" size="sm" className="gap-1">
        <EyeOff className="w-3 h-3" />
        Unpublished (admin)
      </Badge>
    );
  return (
    <Badge variant="muted" size="sm" className="gap-1">
      <EyeOff className="w-3 h-3" />
      Unpublished (creator)
    </Badge>
  );
}

// ─── Confirm modal (same pattern as AdminQuizzesPage) ─────────────────────────

function ConfirmModal({
  quiz,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  quiz: DbQuiz;
  action: "unpublish" | "republish";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isUnpublish = action === "unpublish";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm bg-cream rounded-3xl shadow-elevated p-6 space-y-4">
        <div
          className={`h-11 w-11 rounded-2xl flex items-center justify-center mx-auto ${
            isUnpublish
              ? "bg-warning-bg text-warning"
              : "bg-success-bg text-success"
          }`}
        >
          {isUnpublish ? (
            <EyeOff className="w-5 h-5" strokeWidth={2} />
          ) : (
            <Eye className="w-5 h-5" strokeWidth={2} />
          )}
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="font-heading font-bold text-base text-text">
            {isUnpublish ? "Unpublish quiz?" : "Republish quiz?"}
          </h2>
          {isUnpublish ? (
            <p className="text-sm text-text-soft leading-relaxed">
              &ldquo;
              <span className="font-heading font-semibold text-text">
                {quiz.title}
              </span>
              &rdquo; will be hidden from Browse, but existing owners keep
              access per the pay-once policy.
            </p>
          ) : (
            <p className="text-sm text-text-soft leading-relaxed">
              &ldquo;
              <span className="font-heading font-semibold text-text">
                {quiz.title}
              </span>
              &rdquo; will be visible in Browse again. The admin override will
              be cleared.
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={isUnpublish ? "outline" : "primary"}
            size="md"
            className={`flex-1 ${
              isUnpublish
                ? "border-warning/50 text-warning hover:bg-warning-bg"
                : ""
            }`}
            isLoading={loading}
            onClick={onConfirm}
          >
            {!loading &&
              (isUnpublish ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              ))}
            {isUnpublish ? "Unpublish" : "Republish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat mini-card ───────────────────────────────────────────────────────────

function StatMini({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface/40 border border-border/40">
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted leading-tight">
          {label}
        </p>
        <p className="font-heading font-bold text-[15px] text-text leading-none mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── MCQ option display (read-only) ──────────────────────────────────────────

function McqOptionRow({
  label,
  isCorrect,
  index,
}: {
  label: string;
  isCorrect: boolean;
  index: number;
}) {
  const letter = String.fromCharCode(65 + index); // A, B, C, D…
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border-2 transition-colors ${
        isCorrect
          ? "border-success/40 bg-success-bg/60"
          : "border-border/40 bg-surface/20"
      }`}
    >
      <div
        className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-heading font-bold ${
          isCorrect
            ? "bg-success text-cream"
            : "bg-surface border border-border/60 text-muted"
        }`}
      >
        {isCorrect ? (
          <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          letter
        )}
      </div>
      <span
        className={`text-[14px] leading-snug flex-1 ${
          isCorrect ? "font-semibold text-success" : "text-text-soft"
        }`}
      >
        <MathText text={label} />
      </span>
      {isCorrect && (
        <span className="shrink-0 text-[10px] font-heading font-bold uppercase tracking-wider text-success bg-success/12 border border-success/25 px-2 py-0.5 rounded-lg">
          Correct
        </span>
      )}
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
}: {
  question: DbQuestion;
  index: number;
}) {
  const isMcq = question.type === "mcq";

  // Parse options (stored as JSONB — could be array or stringified array)
  const options: string[] = (() => {
    if (!question.options) return [];
    if (Array.isArray(question.options)) return question.options as string[];
    if (typeof question.options === "string") {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  // Parse correct_answer (could be string, stringified value, or array via pipe)
  const correctAnswerRaw = (() => {
    const ca = question.correct_answer;
    if (typeof ca === "string") return ca;
    if (ca !== null && ca !== undefined) return String(ca);
    return "";
  })();

  // For fill_blank, correct_answer may be pipe-separated alternatives
  const fillBlankAnswers = correctAnswerRaw
    .split("|")
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <div className="px-5 py-4 border-b border-border/40 last:border-0">
      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="h-7 w-7 rounded-xl bg-primary/10 text-primary text-[12px] font-heading font-bold flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant={isMcq ? "primary" : "secondary"} size="sm">
              {isMcq ? "MCQ" : "Fill-in-Blank"}
            </Badge>
          </div>
          <p className="font-sans text-[15px] text-text leading-relaxed font-medium">
            <MathText text={question.question_text} />
          </p>
        </div>
      </div>

      {/* Answer area */}
      {isMcq && options.length > 0 ? (
        <div className="ml-10 space-y-2">
          {options.map((opt, i) => (
            <McqOptionRow
              key={i}
              label={opt}
              isCorrect={
                opt.trim().toLowerCase() ===
                correctAnswerRaw.trim().toLowerCase()
              }
              index={i}
            />
          ))}
        </div>
      ) : isMcq && options.length === 0 ? (
        <div className="ml-10 px-4 py-3 rounded-2xl bg-surface/40 border border-border/40">
          <p className="text-xs text-muted italic">
            No options stored for this question.
          </p>
          {correctAnswerRaw && (
            <p className="text-xs text-text-soft mt-1">
              <span className="font-heading font-semibold text-success">
                Correct answer:{" "}
              </span>
              {correctAnswerRaw}
            </p>
          )}
        </div>
      ) : (
        /* Fill-in-blank */
        <div className="ml-10 space-y-2">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
            Accepted answer{fillBlankAnswers.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {fillBlankAnswers.map((ans, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-success-bg border border-success/30 text-[13px] font-heading font-semibold text-success"
              >
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  strokeWidth={2.2}
                />
                {ans}
              </span>
            ))}
            {fillBlankAnswers.length === 0 && (
              <span className="text-xs text-muted italic">
                No answer stored.
              </span>
            )}
          </div>
          {fillBlankAnswers.length > 1 && (
            <p className="text-[11px] text-muted leading-relaxed">
              Any of the above (case-insensitive, exact match) is accepted.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminQuizContentPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  // Context-aware back link — detect if arrived from /admin/reports via state
  const fromReports =
    (location.state as { from?: string } | null)?.from === "reports";
  const backTo = fromReports ? "/admin/reports" : "/admin/quizzes";
  const backLabel = fromReports ? "Back to Reports" : "Back to Quizzes";

  // ── Data state ─────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<DbQuiz | null>(null);
  const [course, setCourse] = useState<DbCourse | null>(null);
  const [creator, setCreator] = useState<DbProfile | null>(null);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [stats, setStats] = useState<QuizStats>({
    totalAttempts: 0,
    avgScore: null,
    uniqueLearners: 0,
  });
  const [openReports, setOpenReports] = useState<OpenReportCount>({ count: 0 });
  const [notFound, setNotFound] = useState(false);

  // ── Action state ────────────────────────────────────────────────────────────
  const [actionTarget, setActionTarget] = useState<
    "unpublish" | "republish" | null
  >(null);
  const [acting, setActing] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);

    // 1. Quiz
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .maybeSingle();

    if (quizError || !quizData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setQuiz(quizData as DbQuiz);

    // 2. Parallel: course, creator profile, questions, attempts, reports
    const [courseRes, creatorRes, questionsRes, attemptsRes, reportsRes] =
      await Promise.all([
        supabase
          .from("courses")
          .select("*")
          .eq("id", quizData.course_id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("*")
          .eq("id", quizData.creator_id)
          .maybeSingle(),
        supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true }),
        supabase
          .from("quiz_attempts")
          .select("user_id, score")
          .eq("quiz_id", quizId)
          .not("completed_at", "is", null),
        supabase
          .from("reports")
          .select("id", { count: "exact" })
          .eq("quiz_id", quizId)
          .eq("status", "open"),
      ]);

    setCourse((courseRes.data as DbCourse) ?? null);
    setCreator((creatorRes.data as DbProfile) ?? null);
    setQuestions((questionsRes.data ?? []) as DbQuestion[]);

    // Compute stats from attempts
    const attempts = attemptsRes.data ?? [];
    const totalAttempts = attempts.length;
    const uniqueLearners = new Set(attempts.map((a) => a.user_id)).size;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            attempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts,
          )
        : null;
    setStats({ totalAttempts, avgScore, uniqueLearners });

    setOpenReports({ count: reportsRes.count ?? 0 });
    setLoading(false);
  }, [quizId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ── Action handlers ────────────────────────────────────────────────────────
  async function handleConfirmAction() {
    if (!actionTarget || !quiz) return;
    setActing(true);
    if (actionTarget === "unpublish") {
      await adminUnpublishQuiz(quiz.id);
      showToast({
        message: `"${quiz.title}" unpublished.`,
        variant: "success",
      });
    } else {
      await adminRepublishQuiz(quiz.id);
      showToast({
        message: `"${quiz.title}" republished.`,
        variant: "success",
      });
    }
    setActing(false);
    setActionTarget(null);
    void fetchAll(); // Refresh quiz status
  }

  // ── Gate: admin only ───────────────────────────────────────────────────────
  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer className="max-w-290!">
        <AdminLoadingState label="Loading quiz content…" />
      </PageContainer>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !quiz) {
    return (
      <PageContainer className="max-w-290!">
        <div className="flex flex-col items-center text-center py-16 gap-4">
          <div className="h-14 w-14 rounded-3xl bg-surface border border-border/50 flex items-center justify-center">
            <FileText className="w-7 h-7 text-muted" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-heading font-semibold text-text mb-1">
              Quiz not found
            </p>
            <p className="text-sm text-text-soft">
              It may have been deleted or the ID is invalid.
            </p>
          </div>
          <Link to="/admin/quizzes">
            <Button variant="outline" size="md">
              <ArrowLeft className="w-4 h-4" />
              Back to All Quizzes
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const status = getQuizStatus(quiz);
  const canUnpublish = status === "published";
  const canRepublish = status === "unpublished_admin";

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="max-w-290!">
        <div className="space-y-5 lg:space-y-6">
          {/* ── 1. Back link + Admin badge ──────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Link to={backTo}>
              <button
                type="button"
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-cream border border-border/50 text-text-soft hover:text-text hover:bg-surface transition-colors"
                aria-label={backLabel}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <span className="text-sm font-heading font-medium text-text-soft">
              <Link
                to={backTo}
                className="hover:text-primary transition-colors"
              >
                {backLabel}
              </Link>
            </span>
          </div>

          {/* ── 2. Header card ──────────────────────────────────────────── */}
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              {/* Admin mode badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="warning" size="sm" dot>
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </Badge>
                <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-heading font-semibold text-primary">
                  <Eye className="w-3 h-3" />
                  Admin View — Content Preview
                </span>
                {course && (
                  <Badge variant="muted" size="sm">
                    {course.code}
                  </Badge>
                )}
                <QuizStatusBadge quiz={quiz} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-heading font-bold text-xl lg:text-2xl text-text tracking-tight leading-tight">
                    {quiz.title}
                  </h1>

                  {/* Creator */}
                  {creator && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar
                        name={creator.full_name}
                        size="xs"
                        src={creator.avatar_url ?? undefined}
                      />
                      <Link
                        to={`/profile/creator/${creator.id}`}
                        className="text-sm font-heading font-medium text-text-soft hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {creator.full_name}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </div>
                  )}

                  {/* Price */}
                  <p className="mt-1.5 text-sm text-muted font-heading">
                    {formatNaira(quiz.price)} per access
                    <span className="mx-1.5 text-border">·</span>
                    {quiz.question_count ?? questions.length} questions
                  </p>
                </div>

                {/* Publish action */}
                <div className="shrink-0 flex items-center gap-2">
                  {canUnpublish && (
                    <button
                      type="button"
                      onClick={() => setActionTarget("unpublish")}
                      className="h-9 px-3.5 rounded-xl text-[12px] font-heading font-semibold border border-warning/40 text-warning hover:bg-warning-bg transition-colors flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Unpublish
                    </button>
                  )}
                  {canRepublish && (
                    <button
                      type="button"
                      onClick={() => setActionTarget("republish")}
                      className="h-9 px-3.5 rounded-xl text-[12px] font-heading font-semibold border border-success/40 text-success hover:bg-success-bg transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Republish
                    </button>
                  )}
                  <Link
                    to={`/quiz/${quiz.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3.5 rounded-xl text-[12px] font-heading font-semibold border border-border/60 text-text-soft hover:text-text hover:border-border transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buyer page
                  </Link>
                </div>
              </div>
            </div>

            {/* Open reports banner */}
            {openReports.count > 0 && (
              <div className="mx-5 mb-4 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-danger-bg/50 border border-danger/20">
                <AlertCircle
                  className="w-4 h-4 text-danger shrink-0"
                  strokeWidth={2}
                />
                <p className="text-sm font-heading font-medium text-danger flex-1 leading-snug">
                  {openReports.count} open report
                  {openReports.count !== 1 ? "s" : ""} on this quiz
                </p>
                <Link
                  to="/admin/reports"
                  className="text-[12px] font-heading font-semibold text-danger underline underline-offset-2 hover:opacity-80 transition-opacity shrink-0"
                >
                  View reports
                </Link>
              </div>
            )}
          </Card>

          {/* ── 3. Meta + Stats row ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Description + dates */}
            <Card padded className="lg:col-span-2 space-y-3">
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Quiz details
              </p>
              {quiz.description ? (
                <p className="text-sm text-text-soft leading-relaxed">
                  {quiz.description}
                </p>
              ) : (
                <p className="text-sm text-muted italic">
                  No description provided.
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-soft pt-1 border-t border-border/40">
                <span>
                  <span className="font-heading font-semibold text-text">
                    {quiz.question_count ?? questions.length}
                  </span>{" "}
                  questions
                </span>
                <span>
                  Created{" "}
                  <span className="font-heading font-semibold text-text">
                    {new Date(quiz.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span>
                  Last updated{" "}
                  <span className="font-heading font-semibold text-text">
                    {new Date(quiz.updated_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                {quiz.version != null && (
                  <span>
                    Version{" "}
                    <span className="font-heading font-semibold text-text">
                      {quiz.version}
                    </span>
                  </span>
                )}
                {quiz.time_limit_seconds && (
                  <span>
                    Time limit{" "}
                    <span className="font-heading font-semibold text-text">
                      {Math.floor(quiz.time_limit_seconds / 60)} min
                    </span>
                  </span>
                )}
              </div>
            </Card>

            {/* Quick stats */}
            <div className="space-y-2.5">
              <StatMini
                icon={<Users className="w-4 h-4" strokeWidth={2} />}
                label="Total attempts"
                value={stats.totalAttempts.toLocaleString("en-NG")}
                iconBg="bg-primary/10 text-primary"
              />
              <StatMini
                icon={<Target className="w-4 h-4" strokeWidth={2} />}
                label="Average score"
                value={stats.avgScore !== null ? `${stats.avgScore}%` : "—"}
                iconBg="bg-secondary/10 text-secondary"
              />
              <StatMini
                icon={<BookOpen className="w-4 h-4" strokeWidth={2} />}
                label="Unique learners"
                value={stats.uniqueLearners.toLocaleString("en-NG")}
                iconBg="bg-success/10 text-success"
              />
            </div>
          </div>

          {/* ── 4. Full question list ────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-heading font-bold text-base text-text flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary inline-block" />
                Questions &amp; Answers
              </h2>
              <span className="inline-flex h-6 min-w-6 px-2 items-center justify-center rounded-full text-[11px] font-heading font-bold bg-primary/10 text-primary">
                {questions.length}
              </span>
            </div>

            <Card padded={false} className="overflow-hidden">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center text-center py-14 px-4 gap-3">
                  <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center shadow-card">
                    <FileText className="w-7 h-7" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-text">
                      No questions yet
                    </p>
                    <p className="mt-1 text-sm text-text-soft max-w-xs leading-relaxed">
                      This quiz has no questions authored yet. The creator may
                      still be building it.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Column header strip */}
                  <div className="px-5 py-2.5 border-b border-border/50 bg-surface/30">
                    <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-muted">
                      Showing all {questions.length} question
                      {questions.length !== 1 ? "s" : ""} in authored order —
                      correct answers highlighted
                    </p>
                  </div>
                  {questions.map((q, i) => (
                    <QuestionCard key={q.id} question={q} index={i} />
                  ))}
                </>
              )}
            </Card>
          </div>

          {/* ── 5. Inline admin action (bottom) — mirrors top controls ──── */}
          {(canUnpublish || canRepublish) && (
            <Card
              padded
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  {canUnpublish
                    ? "Remove this quiz from Browse?"
                    : "Restore this quiz to Browse?"}
                </p>
                <p className="text-xs text-text-soft mt-0.5 leading-relaxed">
                  {canUnpublish
                    ? "Unpublishing hides the quiz from new buyers. Existing owners keep access."
                    : "Republishing clears the admin unpublish override and makes it visible again."}
                </p>
              </div>
              <div className="shrink-0">
                {canUnpublish && (
                  <button
                    type="button"
                    onClick={() => setActionTarget("unpublish")}
                    className="h-9 px-4 rounded-xl text-[12px] font-heading font-semibold border border-warning/40 text-warning hover:bg-warning-bg transition-colors flex items-center gap-1.5"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    Unpublish quiz
                  </button>
                )}
                {canRepublish && (
                  <button
                    type="button"
                    onClick={() => setActionTarget("republish")}
                    className="h-9 px-4 rounded-xl text-[12px] font-heading font-semibold border border-success/40 text-success hover:bg-success-bg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Republish quiz
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>
      </PageContainer>

      {/* Confirm modal */}
      {actionTarget && quiz && (
        <ConfirmModal
          quiz={quiz}
          action={actionTarget}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionTarget(null)}
          loading={acting}
        />
      )}
    </>
  );
}
