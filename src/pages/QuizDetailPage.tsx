import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  FileQuestion,
  Timer,
  TimerOff,
  Users,
  AlertCircle,
  Wallet,
  PlayCircle,
  Lock,
  BarChart2,
  Flag,
  Calculator,
  History,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { ReportModal } from "../components/ReportModal";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  courses as allCourses,
  profiles as allProfiles,
  quizAttempts as allAttempts,
} from "../mock";
import { formatNaira } from "../components/QuizCard";

// ─── helpers ────────────────────────────────────────────────────────────────

function fakeAttemptId() {
  return "atmp_" + Math.random().toString(36).slice(2, 10);
}

// ─── Confirm payment step ────────────────────────────────────────────────────

interface ConfirmPaymentProps {
  quizTitle: string;
  price: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmPaymentBanner({
  quizTitle,
  price,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmPaymentProps) {
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm text-text leading-relaxed">
        Confirm payment of{" "}
        <span className="font-heading font-bold text-primary">
          {formatNaira(price)}
        </span>{" "}
        for <span className="font-heading font-semibold">"{quizTitle}"</span>?
        This quiz will be yours to retake anytime after this.
      </p>
      <div className="flex gap-2.5">
        <Button
          variant="primary"
          size="sm"
          isLoading={isLoading}
          onClick={onConfirm}
          className="flex-1 h-10"
        >
          {!isLoading && <CheckCircle2 className="w-4 h-4" />}
          Confirm & Pay
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="h-10"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPurchasedQuiz, purchaseQuiz, walletBalance, currentUser } =
    useAuth();

  // ── mock data look-up ──────────────────────────────────────────────────────
  const quiz = useMemo(() => allQuizzes.find((q) => q.id === id), [id]);
  const course = useMemo(
    () => allCourses.find((c) => c.id === quiz?.course_id),
    [quiz],
  );
  const creator = useMemo(
    () => allProfiles.find((p) => p.id === quiz?.creator_id),
    [quiz],
  );

  // Attempts for the current user on this quiz
  const myAttempts = useMemo(
    () =>
      quiz
        ? allAttempts.filter(
            (a) => a.quiz_id === quiz.id && a.user_id === currentUser.id,
          )
        : [],
    [quiz, currentUser.id],
  );

  const bestScore = useMemo(
    () =>
      myAttempts.length > 0
        ? Math.max(...myAttempts.map((a) => a.score))
        : null,
    [myAttempts],
  );

  const latestAttempt = useMemo(() => {
    if (myAttempts.length === 0) return null;
    return [...myAttempts].sort(
      (a, b) =>
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
    )[0];
  }, [myAttempts]);

  // ── local state ────────────────────────────────────────────────────────────
  const [timingChoice, setTimingChoice] = useState<"timed" | "untimed">(
    "timed",
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  if (!quiz) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-surface flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-muted" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-bold text-xl text-text">
            Quiz not found
          </h2>
          <p className="text-sm text-text-soft">
            This quiz doesn't exist or has been removed.
          </p>
          <Button variant="outline" onClick={() => navigate("/browse")}>
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
        </div>
      </PageContainer>
    );
  }

  const isPurchased = hasPurchasedQuiz(quiz.id);

  async function handlePayAndStart() {
    if (isPurchased) return; // shouldn't happen
    if (walletBalance < quiz.price) {
      setInsufficientFunds(true);
      setShowConfirm(false);
      return;
    }
    if (!showConfirm) {
      setInsufficientFunds(false);
      setShowConfirm(true);
      return;
    }
    // confirm step
    setIsPaying(true);
    await new Promise((r) => setTimeout(r, 1000));
    const ok = await purchaseQuiz(quiz.id, quiz.price);
    setIsPaying(false);
    if (ok) {
      setShowConfirm(false);
      showToast({ message: "Unlocked! You can now retake this quiz anytime." });
    }
  }

  function handleStartAttempt() {
    const attemptId = fakeAttemptId();
    navigate(`/attempt/${attemptId}`, {
      state: { quizId: quiz.id, isTimed: timingChoice === "timed" },
    });
  }

  const scoreColor =
    bestScore === null
      ? ""
      : bestScore >= 80
        ? "text-success"
        : bestScore >= 60
          ? "text-primary"
          : "text-warning";

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
          quizId={quiz.id}
          quizTitle={quiz.title}
          onClose={() => setShowReport(false)}
          onSuccess={() =>
            showToast({ message: "Report submitted. Our team will review it." })
          }
        />
      )}

      <PageContainer className="!max-w-[720px]">
        {/* ── Back nav ── */}
        <button
          onClick={() => navigate("/browse")}
          className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Browse
        </button>

        <div className="space-y-4 pb-32 lg:pb-8">
          {/* ── Quiz header ── */}
          <Card padded={false}>
            <div className="px-5 pt-5 pb-5 space-y-4">
              {/* course + title */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  {course && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" size="sm">
                        {course.code}
                      </Badge>
                      <span className="text-xs text-muted font-heading">
                        {course.department}
                      </span>
                    </div>
                  )}
                  <h1 className="font-heading font-bold text-xl sm:text-2xl text-text leading-tight tracking-tight">
                    {quiz.title}
                  </h1>
                </div>

                {/* STATE INDICATOR — visible immediately at header */}
                {isPurchased ? (
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge variant="success" size="md" dot>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked
                    </Badge>
                  </div>
                ) : (
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge variant="muted" size="md" dot>
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </Badge>
                  </div>
                )}
              </div>

              {/* meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-soft">
                <span className="inline-flex items-center gap-1.5">
                  <FileQuestion className="w-4 h-4 text-muted" />
                  {quiz.question_count} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted" />
                  {quiz.attempt_count.toLocaleString()} attempts
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-muted" />
                  Timed or untimed — your choice
                </span>
                <Link
                  to={`/quiz/${quiz.id}/leaderboard`}
                  className="inline-flex items-center gap-1.5 text-primary font-heading font-semibold hover:underline underline-offset-2 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  View Leaderboard
                </Link>
              </div>

              {/* computational note */}
              {course?.is_computational && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning-bg border border-warning/20 text-xs text-warning font-heading font-medium">
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  Timed mode uses per-question timing for this subject
                </div>
              )}

              {/* creator */}
              {creator && (
                <Link
                  to={`/profile/creator/${creator.id}`}
                  className="group/creator inline-flex items-center gap-2.5 pt-1 rounded-xl -mx-1 px-1 py-1 hover:bg-surface/60 active:opacity-70 transition-all duration-150 w-fit"
                >
                  <Avatar name={creator.full_name} size="xs" />
                  <span className="text-sm text-text-soft">
                    by{" "}
                    <span className="font-heading font-semibold text-text group-hover/creator:underline underline-offset-2">
                      {creator.full_name}
                    </span>
                  </span>
                </Link>
              )}

              {/* ── STATE SPLIT: purchased vs not ── */}
              <div className="border-t border-border/40 pt-4 space-y-4">
                {isPurchased ? (
                  /* ─── STATE B: Purchased ─────────────────────────────── */
                  <div className="space-y-3">
                    {/* reassurance */}
                    <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-success-bg border border-success/20">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <p className="text-sm text-success leading-relaxed font-heading font-medium">
                        You&apos;ve already paid for this quiz — retake it as
                        many times as you like, anytime.
                      </p>
                    </div>

                    {/* best / last attempt stats */}
                    {latestAttempt && (
                      <div className="flex flex-wrap items-center gap-3">
                        {bestScore !== null && (
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/60 border border-border/40">
                            <BarChart2 className="w-4 h-4 text-muted" />
                            <span className="text-xs text-text-soft font-heading">
                              Best score:{" "}
                              <span className={`font-bold ${scoreColor}`}>
                                {bestScore}%
                              </span>
                            </span>
                          </div>
                        )}
                        <Link
                          to="/history"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-semibold text-primary hover:bg-primary/8 transition-colors border border-primary/20"
                        >
                          <History className="w-3.5 h-3.5" />
                          View Past Results
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ─── STATE A: Not purchased ─────────────────────────── */
                  <div className="space-y-3">
                    {/* big price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading font-bold text-3xl text-primary leading-none">
                        {formatNaira(quiz.price)}
                      </span>
                      <span className="text-sm text-text-soft">one-time</span>
                    </div>
                    <p className="text-sm text-text-soft leading-relaxed">
                      Pay once and this quiz is yours forever — retake it as
                      many times as you need.
                    </p>

                    {/* insufficient funds warning */}
                    {insufficientFunds && !showConfirm && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-danger-bg border border-danger/20">
                        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1.5">
                          <p className="text-sm text-danger font-heading font-medium leading-snug">
                            Insufficient balance — top up to continue
                          </p>
                          <p className="text-xs text-danger/80">
                            You need{" "}
                            <span className="font-semibold">
                              {formatNaira(quiz.price - walletBalance)}
                            </span>{" "}
                            more in your wallet.
                          </p>
                          <Button
                            variant="danger"
                            size="sm"
                            className="mt-1"
                            onClick={() => navigate("/wallet")}
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            Top Up Wallet
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* confirm step (inline) */}
                    {showConfirm && (
                      <ConfirmPaymentBanner
                        quizTitle={quiz.title}
                        price={quiz.price}
                        onConfirm={handlePayAndStart}
                        onCancel={() => setShowConfirm(false)}
                        isLoading={isPaying}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Timed / Untimed choice ── */}
          <Card>
            <div className="space-y-3">
              <h2 className="font-heading font-semibold text-text text-base">
                Choose attempt mode
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Timed */}
                <button
                  type="button"
                  onClick={() => setTimingChoice("timed")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all duration-150 ${
                    timingChoice === "timed"
                      ? "border-primary bg-primary/6 shadow-soft"
                      : "border-border/60 bg-surface/20 hover:border-border hover:bg-surface/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        timingChoice === "timed"
                          ? "bg-primary text-cream"
                          : "bg-surface text-muted"
                      }`}
                    >
                      <Timer className="w-4 h-4" />
                    </div>
                    <span
                      className={`font-heading font-semibold text-sm ${
                        timingChoice === "timed" ? "text-primary" : "text-text"
                      }`}
                    >
                      Timed
                    </span>
                    {timingChoice === "timed" && (
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-text-soft leading-relaxed pl-[2.75rem]">
                    Platform sets a time limit based on question count
                    {course?.is_computational && (
                      <span className="block text-warning font-medium mt-0.5">
                        Per-question timing for this course
                      </span>
                    )}
                  </p>
                </button>

                {/* Untimed */}
                <button
                  type="button"
                  onClick={() => setTimingChoice("untimed")}
                  className={`text-left rounded-2xl border-2 p-4 transition-all duration-150 ${
                    timingChoice === "untimed"
                      ? "border-primary bg-primary/6 shadow-soft"
                      : "border-border/60 bg-surface/20 hover:border-border hover:bg-surface/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        timingChoice === "untimed"
                          ? "bg-primary text-cream"
                          : "bg-surface text-muted"
                      }`}
                    >
                      <TimerOff className="w-4 h-4" />
                    </div>
                    <span
                      className={`font-heading font-semibold text-sm ${
                        timingChoice === "untimed"
                          ? "text-primary"
                          : "text-text"
                      }`}
                    >
                      Untimed
                    </span>
                    {timingChoice === "untimed" && (
                      <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-text-soft leading-relaxed pl-[2.75rem]">
                    Take as long as you need — no pressure, no clock
                  </p>
                </button>
              </div>
            </div>
          </Card>

          {/* ── About this quiz ── */}
          <Card>
            <div className="space-y-3">
              <h2 className="font-heading font-semibold text-text text-base">
                About this quiz
              </h2>
              <p className="text-sm text-text-soft leading-relaxed">
                {quiz.description}
              </p>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface/50 border border-border/40 text-xs text-muted font-heading">
                <FileQuestion className="w-4 h-4 shrink-0" />
                Preview: this quiz has{" "}
                <span className="font-semibold text-text mx-1">
                  {quiz.question_count} questions
                </span>{" "}
                covering{" "}
                <span className="font-semibold text-text ml-1">
                  {course ? `${course.code} — ${course.title}` : "this course"}
                </span>
              </div>
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

      {/* ── Sticky CTA bar (mobile) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <div className="px-4 pt-3 pb-4 max-w-[720px] mx-auto">
          {isPurchased ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartAttempt}
            >
              <PlayCircle className="w-5 h-5" />
              Start Attempt{" "}
              <span className="font-normal opacity-75 text-sm">
                ({timingChoice === "timed" ? "Timed" : "Untimed"})
              </span>
            </Button>
          ) : showConfirm ? (
            <div className="space-y-2.5">
              <p className="text-xs text-text-soft text-center leading-relaxed">
                Confirm payment of{" "}
                <span className="font-heading font-bold text-primary">
                  {formatNaira(quiz.price)}
                </span>{" "}
                for "{quiz.title}"?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  isLoading={isPaying}
                  onClick={handlePayAndStart}
                >
                  {!isPaying && <CheckCircle2 className="w-5 h-5" />}
                  Confirm & Pay
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowConfirm(false)}
                  disabled={isPaying}
                  className="!w-auto px-4"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handlePayAndStart}
              disabled={isPaying}
            >
              <Lock className="w-5 h-5" />
              Pay &amp; Start — {formatNaira(quiz.price)}
            </Button>
          )}
        </div>
      </div>

      {/* ── Desktop inline CTA (below mode selector, above about) ── */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-30">
        <div className="bg-cream shadow-elevated rounded-3xl border border-border/50 px-5 py-4 flex items-center gap-4 min-w-[320px]">
          {isPurchased ? (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleStartAttempt}
            >
              <PlayCircle className="w-5 h-5" />
              Start Attempt
              <span className="font-normal opacity-75 text-sm">
                ({timingChoice === "timed" ? "Timed" : "Untimed"})
              </span>
            </Button>
          ) : showConfirm ? (
            <div className="flex-1 flex gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={isPaying}
                onClick={handlePayAndStart}
              >
                {!isPaying && <CheckCircle2 className="w-4 h-4" />}
                Confirm & Pay {formatNaira(quiz.price)}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowConfirm(false)}
                disabled={isPaying}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handlePayAndStart}
            >
              <Lock className="w-5 h-5" />
              Pay &amp; Start — {formatNaira(quiz.price)}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
