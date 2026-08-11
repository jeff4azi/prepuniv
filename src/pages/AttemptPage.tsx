import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "../components/Button";
import { MathText } from "../components/MathText";
import type { Question, AttemptResult, Quiz } from "../mock/types";
import { fetchQuiz, fetchQuestions } from "../lib/queries";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Route state shape (from QuizDetailPage) ─────────────────────────────────
interface AttemptLocationState {
  quizId?: string;
  isTimed?: boolean;
}

// ─── Shuffle helper ───────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── A question with its options already shuffled ────────────────────────────
interface ShuffledQuestion extends Question {
  shuffledOptions: string[];
}

function buildShuffledQuestions(raw: Question[]): ShuffledQuestion[] {
  const a = [...raw];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.map((q) => ({
    ...q,
    shuffledOptions:
      q.type === "mcq" && q.options && q.options.length
        ? (() => {
            const opts = [...q.options];
            for (let i = opts.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [opts[i], opts[j]] = [opts[j], opts[i]];
            }
            return opts;
          })()
        : [],
  }));
}

// ─── Timer helpers ────────────────────────────────────────────────────────────
function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Grading ─────────────────────────────────────────────────────────────────
function gradeAnswer(given: string, correct_answer: string): boolean {
  const g = given.trim().toLowerCase();
  const accepted = correct_answer.split("|").map((a) => a.trim().toLowerCase());
  return accepted.some((a) => a === g);
}

// ─── Exit confirm dialog ──────────────────────────────────────────────────────
function ExitDialog({
  onCancel,
  onLeave,
}: {
  onCancel: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-cream shadow-elevated p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-warning-bg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-text text-base leading-tight">
              Leave this attempt?
            </h2>
            <p className="text-sm text-text-soft mt-1 leading-relaxed">
              Your progress will be lost and this attempt won't be saved.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 pt-1">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            onClick={onLeave}
          >
            Leave anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Submit-with-unanswered dialog ────────────────────────────────────────────
function SubmitDialog({
  unansweredCount,
  onCancel,
  onSubmit,
}: {
  unansweredCount: number;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-cream shadow-elevated p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-warning-bg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-text text-base leading-tight">
              {unansweredCount} unanswered{" "}
              {unansweredCount === 1 ? "question" : "questions"}
            </h2>
            <p className="text-sm text-text-soft mt-1 leading-relaxed">
              You haven't answered all questions. Submit anyway? Unanswered
              questions count as incorrect.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 pt-1">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            onClick={onCancel}
          >
            Go back
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={onSubmit}
          >
            Submit anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── MCQ option row ───────────────────────────────────────────────────────────
function McqOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.99] ${
        selected
          ? "border-primary bg-primary/8 shadow-soft"
          : "border-border/50 bg-cream hover:border-primary/40 hover:bg-primary/4"
      }`}
    >
      <div
        className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          selected ? "border-primary bg-primary" : "border-muted bg-transparent"
        }`}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-cream" />}
      </div>
      <span
        className={`font-sans text-[15px] leading-snug ${
          selected ? "text-text font-medium" : "text-text-soft"
        }`}
      >
        <MathText text={label} />
      </span>
    </button>
  );
}

// ─── Question navigator dot ───────────────────────────────────────────────────
function NavDot({
  index,
  answered,
  current,
  onClick,
}: {
  index: number;
  answered: boolean;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to question ${index + 1}`}
      className={`h-8 w-8 rounded-xl text-xs font-heading font-semibold transition-all duration-150 border ${
        current
          ? "bg-primary text-cream border-primary shadow-soft scale-105"
          : answered
            ? "bg-primary/15 text-primary border-primary/30 hover:bg-primary/25"
            : "bg-cream text-muted border-border/50 hover:border-border hover:text-text-soft"
      }`}
    >
      {index + 1}
    </button>
  );
}

// ─── Timer display ────────────────────────────────────────────────────────────
function TimerDisplay({
  seconds,
  total,
  label,
}: {
  seconds: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? seconds / total : 1;
  const isWarning = pct <= 0.15;
  const isCritical = pct <= 0.08;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
        isCritical
          ? "bg-warning-bg border-warning/40 text-warning"
          : isWarning
            ? "bg-warning-bg/60 border-warning/20 text-warning"
            : "bg-surface/50 border-border/40 text-text-soft"
      }`}
    >
      <Timer
        className={`w-3.5 h-3.5 shrink-0 ${isCritical ? "animate-pulse" : ""}`}
        strokeWidth={2.2}
      />
      <span className="font-heading font-semibold text-sm tabular-nums">
        {label && (
          <span className="font-normal opacity-70 mr-1 text-xs">{label}</span>
        )}
        {formatTime(seconds)}
      </span>
    </div>
  );
}

// ─── Main AttemptPage ─────────────────────────────────────────────────────────
export function AttemptPage() {
  const { id: attemptId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as AttemptLocationState;
  const { authToken } = useAuth();

  // ── Load quiz + questions from Supabase on mount ───────────────────────────
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Session init — tracks startedAt and the stable shuffled question list ──
  const sessionRef = useRef<{
    questions: ShuffledQuestion[];
    startedAt: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Resolve quizId: prefer router state, fall back to DB lookup via attemptId
      let quizId = state.quizId;

      if (!quizId && attemptId) {
        // Page was refreshed or navigated to directly — fetch quizId from DB
        const { data } = await supabase
          .from("quiz_attempts")
          .select("quiz_id")
          .eq("id", attemptId)
          .maybeSingle();
        quizId = data?.quiz_id ?? undefined;
      }

      if (!quizId) {
        if (!cancelled) {
          setError("Could not find this attempt. Please start a new one.");
          setLoading(false);
        }
        return;
      }

      const [q, qs] = await Promise.all([
        fetchQuiz(quizId),
        fetchQuestions(quizId),
      ]);
      if (cancelled) return;

      if (!q) {
        setError("Quiz not found. It may have been removed.");
        setLoading(false);
        return;
      }
      if (qs.length === 0) {
        setError("This quiz has no questions yet.");
        setLoading(false);
        return;
      }

      const shuffled = buildShuffledQuestions(qs);
      sessionRef.current = {
        questions: shuffled,
        startedAt: new Date().toISOString(),
      };
      setQuiz(q);
      setQuestions(shuffled);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const isTimed = (state.isTimed ?? false) && !!quiz?.time_limit_seconds;
  const isOverall = isTimed;

  const total = questions.length;

  // ── Answer state: map from question id → user's answer string ─────────────
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  // ── Question transition animation ─────────────────────────────────────────
  const [animPhase, setAnimPhase] = useState<"visible" | "exit" | "enter">(
    "visible",
  );
  const [displayIdx, setDisplayIdx] = useState(0);

  const navigatingRef = useRef(false);
  const navigateTo = useCallback((nextIdx: number) => {
    if (navigatingRef.current) return;
    setCurrentIdx((prev) => {
      if (nextIdx === prev) return prev;
      navigatingRef.current = true;
      setAnimPhase("exit");
      setTimeout(() => {
        setDisplayIdx(nextIdx);
        setAnimPhase("enter");
        setTimeout(() => {
          setAnimPhase("visible");
          navigatingRef.current = false;
        }, 160);
      }, 130);
      return nextIdx;
    });
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // ── Grading + navigation to result ────────────────────────────────────────
  // Use a ref so timer effects always call the latest version without
  // needing to be in their dependency arrays (avoids stale closures).
  const handleFinalSubmitRef = useRef<() => Promise<void>>(async () => {});

  const handleFinalSubmit = useCallback(async () => {
    if (!attemptId || !quiz) return;

    const completedAt = new Date().toISOString();
    const startedAt = sessionRef.current?.startedAt ?? completedAt;

    const gradedAnswers = (sessionRef.current?.questions ?? []).map((q) => {
      const given = (answers[q.id] ?? "").trim();
      return {
        question_id: q.id,
        question_text: q.question_text,
        given,
        correct: q.correct_answer,
        is_correct: gradeAnswer(given, q.correct_answer),
        type: q.type,
        options: q.shuffledOptions,
      };
    });

    const t = gradedAnswers.length;
    const correctCount = gradedAnswers.filter((a) => a.is_correct).length;
    const score = t > 0 ? Math.round((correctCount / t) * 100) : 0;

    // ── Persist to backend BEFORE navigating so History sees the score ─────
    setSaving(true);
    try {
      const timeTakenMs =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();
      const timeTakenSeconds = Math.max(0, Math.round(timeTakenMs / 1000));

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/attempt/${attemptId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
          body: JSON.stringify({
            score,
            started_at: startedAt,
            completed_at: completedAt,
            time_taken_seconds: timeTakenSeconds,
            answers: gradedAnswers.map((a) => ({
              question_id: a.question_id,
              question_text: a.question_text,
              given: a.given,
              correct: a.correct,
              is_correct: a.is_correct,
            })),
          }),
        },
      );
      if (!res.ok) {
        // Log but don't block navigation — user still needs to see their result
        // eslint-disable-next-line no-console
        console.warn("Persisting attempt returned", res.status);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Persisting attempt failed:", e);
    } finally {
      setSaving(false);
    }

    const result: AttemptResult = {
      attempt_id: attemptId ?? "atmp_unknown",
      quiz_id: quiz?.id ?? "",
      quiz_title: quiz?.title ?? "Quiz",
      is_timed: isTimed,
      score,
      total: t,
      answers: gradedAnswers,
      started_at: startedAt,
      completed_at: completedAt,
    };

    navigate(`/attempt/${attemptId}/result`, { state: { result } });
  }, [answers, quiz, isTimed, attemptId, navigate, authToken]);

  // Keep ref in sync so timer effects always have latest
  handleFinalSubmitRef.current = handleFinalSubmit;

  // ── Overall timer (uses creator-set time_limit_seconds) ───────────────────
  const overallTotal = quiz?.time_limit_seconds ?? 0;
  const [overallSecs, setOverallSecs] = useState(overallTotal);
  const overallExpiredRef = useRef(false);

  useEffect(() => {
    // Reset timer when the quiz loads (we didn't know overallTotal at mount)
    if (overallTotal > 0) setOverallSecs(overallTotal);
  }, [overallTotal]);

  useEffect(() => {
    if (!isOverall || overallExpiredRef.current) return;
    if (overallSecs <= 0) {
      overallExpiredRef.current = true;
      void handleFinalSubmitRef.current();
      return;
    }
    const t = setTimeout(() => setOverallSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }); // no dep array — runs as a heartbeat, guarded by the ref flag

  function trySubmit() {
    const unanswered = (sessionRef.current?.questions ?? []).filter(
      (q) => !answers[q.id]?.trim(),
    ).length;
    if (unanswered > 0) {
      setShowSubmitDialog(true);
    } else {
      void handleFinalSubmit();
    }
  }

  // ── Derived per-render values ──────────────────────────────────────────────
  const currentQ = questions[displayIdx];
  const currentAnswer = answers[currentQ?.id ?? ""] ?? "";
  const answeredCount = Object.values(answers).filter((v) => v.trim()).length;
  const progressPct = total > 0 ? ((displayIdx + 1) / total) * 100 : 0;

  // ── Loading / error fallback ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 w-full max-w-sm">
          <div className="h-16 w-16 rounded-3xl bg-surface animate-pulse mx-auto" />
          <div className="h-5 w-48 rounded-xl bg-surface animate-pulse mx-auto" />
          <div className="h-4 w-64 rounded-lg bg-surface/60 animate-pulse mx-auto" />
          <div className="h-64 rounded-3xl bg-surface/50 animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 rounded-3xl bg-warning-bg flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="font-heading font-bold text-lg text-text">
            Something went wrong
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">{error}</p>
          <Button variant="outline" onClick={() => navigate("/browse")}>
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  // ── No quiz / no questions fallback ──────────────────────────────────────
  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-text-soft font-heading">
            {!quiz
              ? "Quiz not found."
              : "No questions available for this quiz."}
          </p>
          <Button variant="outline" onClick={() => navigate("/browse")}>
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const animClass =
    animPhase === "exit"
      ? "opacity-0 translate-x-4"
      : animPhase === "enter"
        ? "opacity-0 -translate-x-2"
        : "opacity-100 translate-x-0";

  return (
    <>
      {showExitDialog && (
        <ExitDialog
          onCancel={() => setShowExitDialog(false)}
          onLeave={() => navigate(quiz ? `/quiz/${quiz.id}` : "/browse")}
        />
      )}
      {showSubmitDialog && (
        <SubmitDialog
          unansweredCount={
            questions.filter((q) => !answers[q.id]?.trim()).length
          }
          onCancel={() => setShowSubmitDialog(false)}
          onSubmit={() => {
            setShowSubmitDialog(false);
            void handleFinalSubmit();
          }}
        />
      )}

      {/* ── Full-screen attempt shell ── */}
      <div className="min-h-dvh bg-background flex flex-col">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            {/* Exit */}
            <button
              type="button"
              onClick={() => setShowExitDialog(true)}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:bg-surface hover:text-text transition-colors shrink-0"
              aria-label="Exit attempt"
            >
              <X className="w-5 h-5" strokeWidth={2.2} />
            </button>

            {/* Progress center */}
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xs font-heading font-semibold text-text-soft tabular-nums">
                Question {displayIdx + 1} of {total}
              </span>
              <div className="w-full max-w-50 h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Timer right */}
            <div className="shrink-0">
              {isOverall && (
                <TimerDisplay seconds={overallSecs} total={overallTotal} />
              )}
              {!isTimed && (
                <span className="text-xs font-heading text-muted px-2">
                  Untimed
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto pb-40 lg:pb-8">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
            {/* Question card */}
            <div
              className={`transition-all duration-130 ease-out ${animClass}`}
            >
              <div className="bg-cream rounded-3xl border border-border/40 shadow-card p-6 lg:p-8 space-y-6">
                {/* Question number chip */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-primary/10 text-primary text-xs font-heading font-bold">
                    {displayIdx + 1}
                  </span>
                  <span className="text-xs font-heading text-muted capitalize">
                    {currentQ?.type === "mcq"
                      ? "Multiple choice"
                      : "Fill in the blank"}
                  </span>
                </div>

                {/* Question text */}
                <p className="font-sans text-[17px] lg:text-lg text-text leading-relaxed font-medium">
                  <MathText text={currentQ?.question_text ?? ""} />
                </p>

                {/* Answer area */}
                {currentQ?.type === "mcq" ? (
                  <div className="space-y-2.5">
                    {currentQ.shuffledOptions.map((opt) => (
                      <McqOption
                        key={opt}
                        label={opt}
                        selected={currentAnswer === opt}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQ.id]: opt,
                          }))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-semibold text-muted uppercase tracking-wider">
                      Your answer
                    </label>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQ.id]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer here…"
                      className="w-full h-12 px-4 rounded-2xl border-2 border-border/50 bg-background text-text text-[15px] placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <p className="text-xs text-muted leading-relaxed">
                      Spelling matters — keep it concise and accurate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Question navigator strip ── */}
            <div className="mt-5">
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {questions.map((q, i) => (
                  <NavDot
                    key={q.id}
                    index={i}
                    answered={!!answers[q.id]?.trim()}
                    current={i === displayIdx}
                    onClick={() => navigateTo(i)}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted mt-2 font-heading">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  {answeredCount} answered
                </span>
                {total - answeredCount > 0 && (
                  <span className="inline-flex items-center gap-1 ml-3">
                    <Circle className="w-3 h-3 text-muted" />
                    {total - answeredCount} remaining
                  </span>
                )}
              </p>
            </div>

            {/* ── Desktop nav buttons (inlined below navigator on large screens) ── */}
            <div className="hidden lg:flex items-center justify-between gap-3 mt-6">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigateTo(currentIdx - 1)}
                disabled={currentIdx === 0 || saving}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              {currentIdx < total - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigateTo(currentIdx + 1)}
                  disabled={saving}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={trySubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Quiz
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* ── Mobile sticky bottom nav ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-background/96 backdrop-blur-xl border-t border-border/40 safe-bottom">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => navigateTo(currentIdx - 1)}
              disabled={currentIdx === 0 || saving}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            {currentIdx < total - 1 ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => navigateTo(currentIdx + 1)}
                disabled={saving}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={trySubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
