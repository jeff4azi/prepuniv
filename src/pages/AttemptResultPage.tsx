import { useState, useMemo } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Timer,
  TimerOff,
  BookOpen,
  Flag,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  courses as allCourses,
  attemptResults as seedResults,
  type AttemptResult,
} from "../mock";

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

// ─── Report modal (placeholder) ───────────────────────────────────────────────

function ReportModal({
  quizTitle,
  onClose,
}: {
  quizTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-cream shadow-elevated p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading font-bold text-lg text-text">
              Report this quiz
            </h2>
            <p className="text-sm text-text-soft mt-0.5">"{quizTitle}"</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-text-soft leading-relaxed">
          The full reporting flow will be built in a future prompt. Your report
          has been noted and the moderation team will review it within 48 hours.
        </p>
        <Button variant="primary" fullWidth onClick={onClose}>
          Got it
        </Button>
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
              {item.question_text ?? `Question ${index + 1}`}
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
              {givenEmpty ? "No answer given" : item.given}
            </span>
          </div>
          {!item.is_correct && (
            <div className="flex items-start gap-3 text-sm">
              <span className="font-heading font-semibold text-text-soft w-28 shrink-0 pt-0.5">
                Correct answer
              </span>
              <span className="text-success font-medium leading-snug">
                {displayCorrect}
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

  // ── Resolve result: route state first, then mock store fallback ────────────
  const result = useMemo<AttemptResult | null>(() => {
    const fromState = (location.state as { result?: AttemptResult } | null)
      ?.result;
    if (fromState) return fromState;

    // Standalone lookup (page refresh / direct link)
    const seed = seedResults.find(
      (r) => r.attempt_id === attemptId && r.user_id === currentUser.id,
    );
    return seed ?? null;
  }, [location.state, attemptId, currentUser.id]);

  // Derive quiz + course for context we don't always have in the result object
  const quiz = useMemo(
    () => allQuizzes.find((q) => q.id === result?.quiz_id),
    [result],
  );
  const course = useMemo(
    () => allCourses.find((c) => c.id === quiz?.course_id),
    [quiz],
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showReport, setShowReport] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const answers = result?.answers ?? [];
  const correctCount = answers.filter((a) => a.is_correct).length;
  const incorrectCount = answers.length - correctCount;

  const visibleAnswers = useMemo(() => {
    if (filter === "correct") return answers.filter((a) => a.is_correct);
    if (filter === "incorrect") return answers.filter((a) => !a.is_correct);
    return answers;
  }, [answers, filter]);

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
            This result may have expired or belongs to a different account. Head
            back to browse and start a fresh attempt.
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

  function handleAttemptAgain() {
    const id = "atmp_" + Math.random().toString(36).slice(2, 10);
    // Quiz is already purchased — go straight to a new attempt
    // (reuse same isTimed as the previous attempt)
    navigate(`/attempt/${id}`, {
      state: { quizId: result.quiz_id, isTimed: result.is_timed },
    });
  }

  return (
    <>
      {showReport && (
        <ReportModal
          quizTitle={result.quiz_title}
          onClose={() => setShowReport(false)}
        />
      )}

      <PageContainer className="max-w-170!">
        {/* ── Back link ── */}
        <button
          onClick={() =>
            navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse")
          }
          className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to quiz
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
                    <Badge variant="secondary" size="sm">
                      {course.name}
                    </Badge>
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
            onClick={() =>
              navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse")
            }
          >
            <ArrowLeft className="w-5 h-5" />
            Quiz Details
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
          <Link
            to={`/quiz/${result.quiz_id}`}
            className="text-xs text-text-soft font-heading hover:text-text transition-colors block mb-3"
          >
            ← Back to quiz details
          </Link>
          <Button variant="primary" size="lg" onClick={handleAttemptAgain}>
            <RotateCcw className="w-5 h-5" />
            Attempt Again
          </Button>
        </div>
      </div>
    </>
  );
}
