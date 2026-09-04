import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Timer,
  TimerOff,
  BookOpen,
  Flag,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { MathText } from "../components/MathText";
import { ReportModal } from "../components/ReportModal";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import type { AttemptResult, Quiz, Course, QuizAttempt } from "../types";
import {
  fetchQuiz,
  fetchCourse,
  fetchAttemptResult,
  fetchAttemptById,
} from "../lib/queries";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function scoreBand(score: number): {
  heading: string;
  sub: string;
  color: string;
  stroke: string;
  badgeVariant: "success" | "primary" | "warning";
} {
  if (score >= 80)
    return {
      heading: "Excellent work!",
      sub: "You've got a strong grasp of this material. Keep it up.",
      color: "text-success",
      stroke: "#3e6b33",
      badgeVariant: "success",
    };
  if (score >= 50)
    return {
      heading: "Good effort — keep going.",
      sub: "A bit more practice on the missed questions will make a real difference.",
      color: "text-primary",
      stroke: "#44612e",
      badgeVariant: "primary",
    };
  return {
    heading: "Don't give up — every attempt counts.",
    sub: "Review the questions you missed below. Understanding the mistakes is the fastest way to improve.",
    color: "text-warning",
    stroke: "#8a671e",
    badgeVariant: "warning",
  };
}

// ─── Score ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div className="relative h-37 w-37 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-surface"
        />
        {/* Filled arc */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-heading font-bold text-[28px] leading-none text-text">
          {score}%
        </span>
      </div>
    </div>
  );
}

// ─── Filter toggle ────────────────────────────────────────────────────────────

type FilterMode = "all" | "correct" | "incorrect";

function FilterToggle({
  value,
  onChange,
  correctCount,
  incorrectCount,
}: {
  value: FilterMode;
  onChange: (v: FilterMode) => void;
  correctCount: number;
  incorrectCount: number;
}) {
  const opts: { id: FilterMode; label: string; count: number }[] = [
    { id: "all", label: "All", count: correctCount + incorrectCount },
    { id: "correct", label: "Correct only", count: correctCount },
    { id: "incorrect", label: "Incorrect only", count: incorrectCount },
  ];

  return (
    <div className="inline-flex rounded-2xl border border-border/60 bg-cream p-1 gap-0.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 ${
            value === o.id
              ? "bg-primary text-cream shadow-soft"
              : "text-text-soft hover:text-text hover:bg-surface/40"
          }`}
        >
          {o.label}
          <span
            className={`inline-flex items-center justify-center h-4.5 min-w-4.5 px-1 rounded-md text-[10px] font-bold ${
              value === o.id
                ? "bg-cream/20 text-cream"
                : "bg-surface text-muted"
            }`}
          >
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Individual answer card ───────────────────────────────────────────────────

interface GradedAnswer {
  question_id: string;
  question_text?: string;
  given: string;
  correct: string;
  is_correct: boolean;
  type?: string;
}

function AnswerCard({
  item,
  index,
  defaultOpen,
}: {
  item: GradedAnswer;
  index: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const displayCorrect = item.correct.split("|")[0];
  const givenEmpty = !item.given.trim();

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        item.is_correct
          ? "border-success/25 bg-cream"
          : "border-warning/30 bg-cream"
      }`}
    >
      {/* Coloured left strip */}
      <div
        className={`flex ${item.is_correct ? "border-l-4 border-l-success" : "border-l-4 border-l-warning"}`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left flex items-start gap-3 px-4 py-3.5"
        >
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {item.is_correct ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <XCircle className="w-5 h-5 text-warning" strokeWidth={2} />
            )}
          </div>
          {/* Question */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-heading font-semibold text-muted uppercase tracking-wide mb-0.5">
              Q{index + 1}
              {item.type && (
                <span className="ml-2 normal-case">
                  {item.type === "mcq"
                    ? "· Multiple choice"
                    : "· Fill in blank"}
                </span>
              )}
            </p>
            <p className="text-sm text-text leading-snug">
              <MathText text={item.question_text ?? `Question ${index + 1}`} />
            </p>
          </div>
          {/* Chevron */}
          <div className="shrink-0 text-muted mt-0.5 ml-2">
            {open ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-5 pb-4 pt-2 space-y-2 border-t border-border/30 ml-1">
          <div className="flex items-start gap-3 text-sm">
            <span className="font-heading font-semibold text-text-soft w-28 shrink-0 pt-0.5">
              Your answer
            </span>
            <span
              className={`leading-snug ${
                item.is_correct
                  ? "text-success font-medium"
                  : givenEmpty
                    ? "text-muted italic"
                    : "text-warning font-medium"
              }`}
            >
              {givenEmpty ? "No answer given" : <MathText text={item.given} />}
            </span>
          </div>
          {!item.is_correct && (
            <div className="flex items-start gap-3 text-sm">
              <span className="font-heading font-semibold text-text-soft w-28 shrink-0 pt-0.5">
                Correct answer
              </span>
              <span className="text-success font-medium leading-snug">
                <MathText text={displayCorrect} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AttemptResultPage() {
  const { id: attemptId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showReport, setShowReport] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  // ── Load state + result data ───────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  // Safety: ensure we're not loading another user's attempt
  const [wrongOwner, setWrongOwner] = useState(false);

  // Fast-path: attempt result passed via router state (just-completed quiz)
  const stateResult = useMemo<AttemptResult | null>(() => {
    return (
      (location.state as { result?: AttemptResult } | null)?.result ?? null
    );
  }, [location.state]);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    // 1) If route state already has the result for this attempt, trust it and
    //    only fetch related quiz/course for extra metadata.
    if (stateResult && stateResult.attempt_id === attemptId) {
      (async () => {
        setResult(stateResult);
        const q = await fetchQuiz(stateResult.quiz_id);
        setQuiz(q);
        if (q?.course_id) {
          const c = await fetchCourse(q.course_id);
          setCourse(c);
        }
        setLoading(false);
      })();
      return;
    }

    // 2) Standalone load (History click / refresh / shared link).
    //    Load the attempt first to verify ownership before loading answers.
    let cancelled = false;
    (async () => {
      setLoading(true);
      const attempt: QuizAttempt | null = attemptId
        ? await fetchAttemptById(attemptId)
        : null;
      if (cancelled) return;

      if (!attempt) {
        setResult(null);
        setLoading(false);
        return;
      }
      if (attempt.user_id !== currentUser.id) {
        setWrongOwner(true);
        setResult(null);
        setLoading(false);
        return;
      }

      const [dbResult, q] = await Promise.all([
        fetchAttemptResult(attemptId!),
        fetchQuiz(attempt.quiz_id),
      ]);
      if (cancelled) return;

      setResult(dbResult);
      setQuiz(q);
      if (q?.course_id) {
        const c = await fetchCourse(q.course_id);
        if (!cancelled) setCourse(c);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, currentUser.id, stateResult?.attempt_id]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const answers = result?.answers ?? [];
  const correctCount = answers.filter((a) => a.is_correct).length;
  const incorrectCount = answers.length - correctCount;

  // Tab title once result is loaded: "Quiz Title — Your Result (72%) | PrepUniv"
  usePageTitle(
    loading
      ? null
      : result
        ? `${result.quiz_title} — Your Result (${result.score}%)`
        : "Result not found",
  );

  const visibleAnswers = useMemo(() => {
    if (filter === "correct") return answers.filter((a) => a.is_correct);
    if (filter === "incorrect") return answers.filter((a) => !a.is_correct);
    return answers;
  }, [answers, filter]);

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer className="max-w-170!">
        <Card padded={false} className="overflow-hidden mb-4">
          <div className="px-5 pt-6 pb-6 space-y-4 animate-pulse">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-37 w-37 rounded-3xl bg-surface shrink-0" />
              <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                <div className="h-6 w-32 max-w-full rounded-lg bg-surface mx-auto sm:mx-0" />
                <div className="h-5 w-64 max-w-full rounded-lg bg-surface/60 mx-auto sm:mx-0" />
                <div className="h-4 w-56 max-w-full rounded-lg bg-surface/60 mx-auto sm:mx-0" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border/40">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`py-4 flex flex-col items-center gap-2 ${
                  i < 2 ? "border-r border-border/40" : ""
                }`}
              >
                <div className="h-5 w-5 rounded-lg bg-surface" />
                <div className="h-6 w-6 rounded-lg bg-surface" />
                <div className="h-3 w-16 rounded-md bg-surface/60" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-surface" />
          ))}
        </Card>
      </PageContainer>
    );
  }

  // ── No-result fallback ─────────────────────────────────────────────────────
  if (!result) {
    return (
      <PageContainer className="max-w-160!">
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-surface flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-bold text-xl text-text">
            Result not found
          </h2>
          <p className="text-sm text-text-soft max-w-xs leading-relaxed">
            {wrongOwner
              ? "This result belongs to a different account. Please sign in with the account that took the attempt."
              : "This result may have expired or belongs to a different account. Head back to browse and start a fresh attempt."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" /> Go back
            </Button>
            <Button variant="primary" onClick={() => navigate("/browse")}>
              Browse quizzes
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const band = scoreBand(result.score);
  const duration = formatDuration(result.started_at, result.completed_at);

  // Smart back: use explicit `from` state first, then browser history, then quiz detail
  const fromPath = (location.state as { from?: string } | null)?.from;

  function goBack() {
    if (fromPath) {
      navigate(fromPath);
    } else if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse");
    }
  }

  // Label based on where the user came from
  const backLabel = (() => {
    const from = fromPath ?? "";
    if (from.includes("/history")) return "History";
    if (from.includes("/library")) return "Library";
    if (from.includes("/home")) return "Home";
    if (from.includes("/browse")) return "Browse";
    if (from.includes("/quiz/")) return "Quiz";
    if (window.history.state?.idx > 0) return "Back";
    return "Quiz";
  })();

  function handleAttemptAgain() {
    navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse");
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}
      {showReport && (
        <ReportModal
          quizId={result.quiz_id}
          quizTitle={result.quiz_title}
          onClose={() => setShowReport(false)}
          onSuccess={() =>
            showToast({ message: "Report submitted. Our team will review it." })
          }
        />
      )}

      <PageContainer className="max-w-170!">
        {/* ── Back link ── */}
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to {backLabel}
        </button>

        <div className="space-y-4 pb-32 lg:pb-8">
          {/* ── Score header card ── */}
          <Card padded={false}>
            <div className="px-5 pt-6 pb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Score ring */}
              <ScoreRing score={result.score} stroke={band.stroke} />

              {/* Text block */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
                {/* Fraction + mode */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-heading font-bold text-2xl text-text leading-none">
                    {correctCount}/{result.total}
                    <span className="text-base font-medium text-text-soft ml-1">
                      correct
                    </span>
                  </span>
                  <Badge variant={band.badgeVariant} size="sm" dot>
                    {result.score}%
                  </Badge>
                </div>

                {/* Heading */}
                <div>
                  <h1
                    className={`font-heading font-bold text-xl leading-tight ${band.color}`}
                  >
                    {band.heading}
                  </h1>
                  <p className="text-sm text-text-soft mt-1 leading-relaxed max-w-sm">
                    {band.sub}
                  </p>
                </div>

                {/* Quiz title + meta */}
                <div className="space-y-1.5 pt-1">
                  {course && (
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Badge variant="secondary" size="sm">
                        {course.code}
                      </Badge>
                      <Link
                        to={`/quiz/${result.quiz_id}/leaderboard`}
                        className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-primary hover:underline underline-offset-2 transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        View Leaderboard
                      </Link>
                    </div>
                  )}
                  <p className="font-heading font-semibold text-sm text-text leading-snug">
                    {result.quiz_title}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-text-soft">
                    <span>{formatDate(result.completed_at)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="inline-flex items-center gap-1">
                      {result.is_timed ? (
                        <>
                          <Timer className="w-3.5 h-3.5" /> Timed
                        </>
                      ) : (
                        <>
                          <TimerOff className="w-3.5 h-3.5" /> Untimed
                        </>
                      )}
                    </span>
                    {duration !== "—" && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{duration}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 border-t border-border/40">
              <div className="flex flex-col items-center gap-1 py-4 border-r border-border/40">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-heading font-bold text-xl text-success leading-none">
                  {correctCount}
                </span>
                <span className="text-[11px] text-success/70 font-heading font-medium">
                  Correct
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-4 border-r border-border/40">
                <XCircle className="w-5 h-5 text-warning" strokeWidth={2} />
                <span className="font-heading font-bold text-xl text-warning leading-none">
                  {incorrectCount}
                </span>
                <span className="text-[11px] text-warning/70 font-heading font-medium">
                  Incorrect
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-4">
                <span className="font-heading font-bold text-xl text-text leading-none">
                  {result.total}
                </span>
                <span className="text-[11px] text-muted font-heading font-medium">
                  Total Qs
                </span>
              </div>
            </div>
          </Card>

          {/* ── Action row ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleAttemptAgain}
            >
              <RotateCcw className="w-5 h-5" />
              Attempt Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() =>
                navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse")
              }
            >
              <BookOpen className="w-5 h-5" />
              Quiz Details
            </Button>
            <Link to={`/quiz/${result.quiz_id}/leaderboard`} className="flex-1">
              <Button variant="outline" size="lg" fullWidth>
                <Trophy className="w-5 h-5" />
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* ── Answer review ── */}
          <Card>
            <div className="space-y-4">
              {/* Section header + filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-heading font-semibold text-text text-base">
                    Answer Review
                  </h2>
                  <p className="text-xs text-text-soft mt-0.5">
                    {correctCount} correct · {incorrectCount} to review
                  </p>
                </div>
                <FilterToggle
                  value={filter}
                  onChange={setFilter}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                />
              </div>

              {/* Cards */}
              {visibleAnswers.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-soft">
                  No {filter === "correct" ? "correct" : "incorrect"} answers to
                  show.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visibleAnswers.map((a, i) => {
                    // Find the real index in the full answers array for Q numbering
                    const realIndex = answers.indexOf(a);
                    return (
                      <AnswerCard
                        key={a.question_id}
                        item={a as GradedAnswer}
                        index={realIndex >= 0 ? realIndex : i}
                        // Incorrect answers open by default; correct are collapsed
                        defaultOpen={!a.is_correct}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ── Report link ── */}
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text-soft transition-colors font-heading"
            >
              <Flag className="w-3.5 h-3.5" />
              Report this quiz
            </button>
          </div>
        </div>
      </PageContainer>

      {/* ── Mobile sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="px-4 pt-3 pb-4 max-w-170 mx-auto flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={goBack}
          >
            <ArrowLeft className="w-5 h-5" />
            {backLabel}
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleAttemptAgain}
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </Button>
        </div>
      </div>

      {/* ── Desktop floating action (mirrors Quiz Detail pattern) ── */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-30">
        <div className="bg-cream shadow-elevated rounded-3xl border border-border/50 px-5 py-4">
          <button
            onClick={goBack}
            className="text-xs text-text-soft font-heading hover:text-text transition-colors block mb-3"
          >
            ← Back to {backLabel}
          </button>
          <Button variant="primary" size="lg" onClick={handleAttemptAgain}>
            <RotateCcw className="w-5 h-5" />
            Attempt Again
          </Button>
        </div>
      </div>
    </>
  );
}
