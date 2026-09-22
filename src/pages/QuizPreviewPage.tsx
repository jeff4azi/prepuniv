/**
 * QuizPreviewPage — /quiz/:id/preview
 *
 * A restricted, non-persisted sample of up to 5 questions from a paid quiz.
 * - Does NOT grant quiz ownership or access to full quiz content.
 * - Shows immediate per-question answer feedback (correct / incorrect).
 * - Displays a completion screen with the real purchase CTA.
 * - Reuses the same visual patterns as AttemptPage.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  ShoppingCart,
} from "lucide-react";
import { Button } from "../components/Button";
import { MathText } from "../components/MathText";
import { fetchQuiz, fetchPreviewQuestions } from "../lib/queries";
import { useAuth } from "../context/AuthContext";
import { formatNaira } from "../components/QuizCard";
import type { Quiz, Question } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviewQuestion extends Question {
  shuffledOptions: string[];
}

type PreviewPhase = "answering" | "feedback" | "complete";

interface AnsweredQuestion {
  question: PreviewQuestion;
  givenAnswer: string;
  isCorrect: boolean;
}

// ─── Shuffle helper ───────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPreviewQuestions(raw: Question[]): PreviewQuestion[] {
  return raw.map((q) => ({
    ...q,
    shuffledOptions:
      q.type === "mcq" && q.options?.length ? shuffleArray([...q.options]) : [],
  }));
}

function gradeAnswer(given: string, correctAnswer: string): boolean {
  const g = given.trim().toLowerCase();
  const accepted = correctAnswer.split("|").map((a) => a.trim().toLowerCase());
  return accepted.some((a) => a === g);
}

// ─── MCQ Option ───────────────────────────────────────────────────────────────

function McqOption({
  label,
  selected,
  feedbackState,
  onClick,
}: {
  label: string;
  selected: boolean;
  feedbackState: "none" | "correct" | "incorrect" | "reveal";
  onClick: () => void;
}) {
  const isCorrect = feedbackState === "correct";
  const isIncorrect = feedbackState === "incorrect";
  const isReveal = feedbackState === "reveal";
  const disabled = feedbackState !== "none";

  const baseClass =
    "w-full text-left flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150";

  let stateClass = "";
  if (isCorrect) {
    stateClass = "border-success bg-success/8 shadow-soft cursor-default";
  } else if (isIncorrect) {
    stateClass = "border-danger/60 bg-danger-bg/50 cursor-default";
  } else if (isReveal) {
    stateClass = "border-success/50 bg-success/5 cursor-default";
  } else if (selected) {
    stateClass = "border-primary bg-primary/8 shadow-soft";
  } else {
    stateClass =
      "border-border/50 bg-cream hover:border-primary/40 hover:bg-primary/4";
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClass} ${stateClass} active:scale-[0.99]`}
    >
      <div
        className={`h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
          isCorrect || isReveal
            ? "border-success bg-success"
            : isIncorrect
              ? "border-danger bg-danger"
              : selected
                ? "border-primary bg-primary"
                : "border-muted bg-transparent"
        }`}
      >
        {(isCorrect || isReveal) && (
          <div className="h-2 w-2 rounded-full bg-cream" />
        )}
        {isIncorrect && <div className="h-2 w-2 rounded-full bg-cream" />}
        {!isCorrect && !isIncorrect && !isReveal && selected && (
          <div className="h-2 w-2 rounded-full bg-cream" />
        )}
      </div>
      <span
        className={`font-sans text-[15px] leading-snug ${
          isCorrect || isReveal
            ? "text-success font-medium"
            : isIncorrect
              ? "text-danger font-medium"
              : selected
                ? "text-text font-medium"
                : "text-text-soft"
        }`}
      >
        <MathText text={label} />
      </span>
      {isCorrect && (
        <CheckCircle2 className="w-4 h-4 text-success ml-auto shrink-0" />
      )}
      {isIncorrect && (
        <XCircle className="w-4 h-4 text-danger ml-auto shrink-0" />
      )}
    </button>
  );
}

// ─── Feedback Banner ─────────────────────────────────────────────────────────

function FeedbackBanner({
  isCorrect,
  correctAnswer,
  questionType,
  options,
}: {
  isCorrect: boolean;
  correctAnswer: string;
  questionType?: Question["type"];
  /** Displayed (possibly shuffled) MCQ options — used to label the correct
   *  answer with A/B/C/D matching the order the user saw on screen. */
  options?: string[];
}) {
  const displayCorrect = correctAnswer.split("|")[0];

  // Build a lettered label for MCQ — e.g. "B. Cell membrane"
  let labeledCorrect: React.ReactNode = <MathText text={displayCorrect} />;
  if (questionType === "mcq" && Array.isArray(options) && options.length > 0) {
    const idx = options.findIndex(
      (o) => o.trim().toLowerCase() === displayCorrect.trim().toLowerCase(),
    );
    if (idx >= 0) {
      const letter = String.fromCharCode(65 + idx); // 0→A, 1→B, ...
      labeledCorrect = (
        <>
          <span className="tabular-nums">{letter}.</span>{" "}
          <MathText text={displayCorrect} />
        </>
      );
    }
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 flex items-start gap-3 ${
        isCorrect
          ? "border-success/25 bg-success/8"
          : "border-warning/30 bg-warning-bg/60"
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isCorrect ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <XCircle className="w-5 h-5 text-warning" strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`font-heading font-semibold text-sm ${isCorrect ? "text-success" : "text-warning"}`}
        >
          {isCorrect ? "Correct" : "Incorrect"}
        </p>
        <p className="text-sm text-text-soft mt-0.5 leading-snug">
          Correct answer:{" "}
          <span className="font-heading font-semibold text-text">
            {labeledCorrect}
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen({
  quiz,
  totalQuestions,
  onBackToDetail,
}: {
  quiz: Quiz;
  totalQuestions: number;
  onBackToDetail: () => void;
}) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  function handlePurchase() {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(`/quiz/${quiz.id}`)}`;
    } else {
      navigate(`/quiz/${quiz.id}`);
    }
  }

  return (
    <div className="flex flex-col items-center text-center px-4 py-10 gap-6 max-w-sm mx-auto">
      {/* Icon */}
      <div className="h-18 w-18 rounded-3xl bg-primary/10 flex items-center justify-center shadow-card">
        <Eye className="w-9 h-9 text-primary" strokeWidth={1.8} />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h2 className="font-heading font-bold text-2xl text-text tracking-tight">
          Preview complete
        </h2>
        <p className="text-sm text-text-soft leading-relaxed">
          You've tried {totalQuestions}{" "}
          {totalQuestions === 1 ? "question" : "questions"} from this quiz.
          Ready for the full experience?
        </p>
      </div>

      {/* Purchase CTA */}
      <div className="w-full space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={handlePurchase}>
          <ShoppingCart className="w-5 h-5" />
          Buy quiz — {formatNaira(quiz.price)}
        </Button>

        <button
          type="button"
          onClick={onBackToDetail}
          className="w-full h-11 rounded-2xl border border-border/60 bg-cream text-sm font-heading font-semibold text-text hover:bg-surface transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to quiz details
        </button>
      </div>

      {/* Context note */}
      <p className="text-xs text-muted leading-relaxed">
        Pay once and the full {quiz.question_count}-question quiz is yours
        forever — retake it as many times as you need.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function QuizPreviewPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPurchasedQuiz, currentUser } = useAuth();

  // ── Data loading ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);

  // ── Preview state machine ──────────────────────────────────────────────────
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [phase, setPhase] = useState<PreviewPhase>("answering");
  const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);

  // Animation
  const [animPhase, setAnimPhase] = useState<"visible" | "exit" | "enter">(
    "visible",
  );
  const navigatingRef = useRef(false);

  usePageTitle(quiz ? `Preview: ${quiz.title}` : null);

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [q, previewQs] = await Promise.all([
        fetchQuiz(quizId),
        fetchPreviewQuestions(quizId),
      ]);
      if (cancelled) return;

      if (!q) {
        setError("Quiz not found.");
        setLoading(false);
        return;
      }

      setQuiz(q);
      setQuestions(buildPreviewQuestions(previewQs));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalQuestions = questions.length;
  const currentQ = questions[currentIdx];
  const progressPct =
    totalQuestions > 0
      ? phase === "complete"
        ? 100
        : ((currentIdx + (phase === "feedback" ? 1 : 0)) / totalQuestions) * 100
      : 0;

  // The user already owns this quiz — redirect them to the detail page
  const isPurchased =
    quiz && (hasPurchasedQuiz(quiz.id) || currentUser.id === quiz.creator_id);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSelectAnswer(option: string) {
    if (phase !== "answering") return;
    setCurrentAnswer(option);
  }

  function handleSubmitAnswer() {
    if (!currentQ || !currentAnswer.trim()) return;

    const isCorrect = gradeAnswer(currentAnswer, currentQ.correct_answer);
    const answeredQ: AnsweredQuestion = {
      question: currentQ,
      givenAnswer: currentAnswer,
      isCorrect,
    };

    setAnswered((prev) => [...prev, answeredQ]);
    setPhase("feedback");
  }

  const handleNext = useCallback(() => {
    if (navigatingRef.current) return;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= totalQuestions) {
      // All questions answered
      setPhase("complete");
      return;
    }

    // Animate transition
    navigatingRef.current = true;
    setAnimPhase("exit");
    setTimeout(() => {
      setCurrentIdx(nextIdx);
      setCurrentAnswer("");
      setPhase("answering");
      setAnimPhase("enter");
      setTimeout(() => {
        setAnimPhase("visible");
        navigatingRef.current = false;
      }, 160);
    }, 130);
  }, [currentIdx, totalQuestions]);

  function handleBackToDetail() {
    navigate(`/quiz/${quizId}`);
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col animate-pulse">
        <header className="sticky top-0 z-20 bg-background/95 border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-surface shrink-0" />
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="h-3 w-32 rounded-full bg-surface" />
              <div className="w-full max-w-50 h-1.5 rounded-full bg-surface" />
            </div>
            <div className="h-6 w-16 rounded-xl bg-surface shrink-0" />
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full space-y-4">
          <div className="h-6 w-40 rounded-lg bg-surface" />
          <div className="bg-cream rounded-3xl border border-border/40 shadow-card p-6 space-y-5">
            <div className="h-4 w-full rounded-lg bg-surface" />
            <div className="h-4 w-4/5 rounded-lg bg-surface" />
            <div className="space-y-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-2xl bg-surface border-2 border-border/30"
                  style={{ opacity: 1 - i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !quiz || questions.length === 0) {
    const msg = error
      ? error
      : !quiz
        ? "Quiz not found."
        : "No preview questions are available for this quiz.";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 rounded-3xl bg-surface flex items-center justify-center mx-auto">
            <Eye className="w-8 h-8 text-muted" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-bold text-lg text-text">
            Preview unavailable
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">{msg}</p>
          <Button variant="outline" onClick={() => navigate(`/quiz/${quizId}`)}>
            Back to quiz details
          </Button>
        </div>
      </div>
    );
  }

  // ── Already purchased — send them to the real quiz ─────────────────────────
  if (isPurchased) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-3xl bg-success-bg flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h2 className="font-heading font-bold text-lg text-text">
            You already own this quiz
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">
            You don't need the preview — you have full access to all{" "}
            {quiz.question_count} questions.
          </p>
          <Button variant="primary" onClick={() => navigate(`/quiz/${quizId}`)}>
            Start full quiz
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

  // ── COMPLETE STATE ─────────────────────────────────────────────────────────
  if (phase === "complete") {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToDetail}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:bg-surface hover:text-text transition-colors shrink-0"
              aria-label="Back to quiz details"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xs font-heading font-semibold text-text-soft">
                Quiz Preview
              </span>
              <div className="w-full max-w-50 h-1.5 rounded-full bg-surface overflow-hidden">
                <div className="h-full w-full rounded-full bg-primary transition-all duration-500 ease-out" />
              </div>
            </div>
            <div className="shrink-0 w-9" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <CompletionScreen
              quiz={quiz}
              totalQuestions={totalQuestions}
              onBackToDetail={handleBackToDetail}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── ANSWERING / FEEDBACK STATE ─────────────────────────────────────────────
  const displayIdx = currentIdx;
  const isFeedback = phase === "feedback";
  const lastAnswered = answered[answered.length - 1] ?? null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Back */}
          <button
            type="button"
            onClick={handleBackToDetail}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:bg-surface hover:text-text transition-colors shrink-0"
            aria-label="Back to quiz details"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>

          {/* Progress center */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs font-heading font-semibold text-text-soft tabular-nums">
              Question {displayIdx + 1} of {totalQuestions}
            </span>
            <div className="w-full max-w-50 h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Preview badge */}
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-heading font-bold uppercase tracking-wider">
              <Eye className="w-3 h-3" />
              Preview
            </span>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto pb-40 lg:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8 space-y-4">
          {/* Preview label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-heading font-semibold text-muted">
              Quiz Preview
            </span>
            <span className="h-px flex-1 bg-border/40" />
            <span className="text-xs text-muted">
              Try {totalQuestions} questions before you buy
            </span>
          </div>

          {/* Question card */}
          <div className={`transition-all duration-130 ease-out ${animClass}`}>
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
                  {currentQ.shuffledOptions.map((opt) => {
                    let feedbackState:
                      | "none"
                      | "correct"
                      | "incorrect"
                      | "reveal" = "none";
                    if (isFeedback) {
                      const correctOpt = currentQ.correct_answer;
                      if (opt === currentAnswer) {
                        feedbackState = lastAnswered?.isCorrect
                          ? "correct"
                          : "incorrect";
                      } else if (
                        opt === correctOpt &&
                        !lastAnswered?.isCorrect
                      ) {
                        feedbackState = "reveal";
                      }
                    }
                    return (
                      <McqOption
                        key={opt}
                        label={opt}
                        selected={currentAnswer === opt}
                        feedbackState={feedbackState}
                        onClick={() => handleSelectAnswer(opt)}
                      />
                    );
                  })}
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
                      !isFeedback && setCurrentAnswer(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        currentAnswer.trim() &&
                        !isFeedback
                      ) {
                        handleSubmitAnswer();
                      }
                    }}
                    placeholder="Type your answer here…"
                    disabled={isFeedback}
                    className={`w-full h-12 px-4 rounded-2xl border-2 bg-background text-text text-[15px] placeholder:text-muted focus:outline-none transition-all ${
                      isFeedback
                        ? lastAnswered?.isCorrect
                          ? "border-success/50 bg-success/5 text-success"
                          : "border-warning/50 bg-warning-bg/50 text-warning"
                        : "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    }`}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Feedback banner (shown after submission) */}
              {isFeedback && lastAnswered && (
                <FeedbackBanner
                  isCorrect={lastAnswered.isCorrect}
                  correctAnswer={lastAnswered.question.correct_answer}
                  questionType={lastAnswered.question.type}
                  options={
                    lastAnswered.question.type === "mcq"
                      ? lastAnswered.question.shuffledOptions
                      : undefined
                  }
                />
              )}
            </div>
          </div>

          {/* Desktop action button */}
          <div className="hidden lg:flex justify-end">
            {!isFeedback ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim()}
              >
                Check answer
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={handleNext}>
                {currentIdx + 1 < totalQuestions ? (
                  <>
                    Next question
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    See results
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Purchase nudge (shown during preview, not overwhelming) */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/60 border border-border/40 text-xs text-muted">
            <Lock className="w-4 h-4 shrink-0 text-muted" />
            <span>
              Full quiz has{" "}
              <span className="font-semibold text-text">
                {quiz.question_count} questions
              </span>{" "}
              —{" "}
              <Link
                to={`/quiz/${quizId}`}
                className="font-heading font-semibold text-primary hover:underline underline-offset-2"
              >
                buy for {formatNaira(quiz.price)}
              </Link>
            </span>
          </div>
        </div>
      </main>

      {/* ── Mobile sticky bottom CTA — sits above the bottom nav (z-40) ── */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-50 bg-background/96 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {!isFeedback ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmitAnswer}
              disabled={!currentAnswer.trim()}
            >
              Check answer
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
              {currentIdx + 1 < totalQuestions ? (
                <>
                  Next question
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  See results
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
