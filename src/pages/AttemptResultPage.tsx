import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Trophy,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import type { AttemptResult } from "../mock";

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 80
      ? "text-success"
      : score >= 60
        ? "text-primary"
        : "text-warning";
  const stroke = score >= 80 ? "#3e6b33" : score >= 60 ? "#44612e" : "#8a671e";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good effort" : "Keep practising";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-36 w-36">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-heading font-bold text-3xl leading-none ${color}`}
          >
            {score}%
          </span>
        </div>
      </div>
      <span className={`font-heading font-semibold text-sm ${color}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Answer review row ────────────────────────────────────────────────────────

interface GradedAnswer {
  question_id: string;
  question_text: string;
  given: string;
  correct: string;
  is_correct: boolean;
  type?: string;
  options?: string[];
}

function AnswerRow({ item, index }: { item: GradedAnswer; index: number }) {
  const [open, setOpen] = useState(false);
  // Show first acceptable answer (before first pipe)
  const displayCorrect = item.correct.split("|")[0];

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all ${
        item.is_correct
          ? "border-success/30 bg-success-bg/40"
          : "border-danger/20 bg-danger-bg/30"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3 px-4 py-3.5"
      >
        <div className="shrink-0 mt-0.5">
          {item.is_correct ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <XCircle className="w-5 h-5 text-danger" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-xs font-heading font-semibold text-muted uppercase tracking-wide">
            Q{index + 1}
          </p>
          <p className="text-sm text-text leading-snug line-clamp-2">
            {item.question_text}
          </p>
        </div>
        <div className="shrink-0 text-muted mt-1">
          {open ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
          <div className="flex items-start gap-2 text-sm">
            <span className="font-heading font-semibold text-text-soft w-20 shrink-0">
              Your answer:
            </span>
            <span
              className={`font-sans ${
                item.is_correct
                  ? "text-success font-medium"
                  : "text-danger font-medium"
              }`}
            >
              {item.given || (
                <em className="text-muted font-normal">No answer</em>
              )}
            </span>
          </div>
          {!item.is_correct && (
            <div className="flex items-start gap-2 text-sm">
              <span className="font-heading font-semibold text-text-soft w-20 shrink-0">
                Correct:
              </span>
              <span className="text-success font-medium">{displayCorrect}</span>
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
  const result = (location.state as { result?: AttemptResult })?.result;

  const [showReview, setShowReview] = useState(false);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <Trophy className="w-12 h-12 text-muted" strokeWidth={1.5} />
        <h2 className="font-heading font-bold text-xl text-text">
          No result found
        </h2>
        <p className="text-sm text-text-soft max-w-xs">
          This result may have expired. Start a new attempt from the quiz page.
        </p>
        <Button variant="outline" onClick={() => navigate("/browse")}>
          Back to Browse
        </Button>
      </div>
    );
  }

  const correct = result.answers.filter((a) => a.is_correct).length;
  const wrong = result.total - correct;
  const duration = formatDuration(result.started_at, result.completed_at);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Result header ── */}
      <div className="bg-cream border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-8 lg:py-10 flex flex-col items-center gap-5 text-center">
          <Badge variant="primary" size="md" dot>
            <Trophy className="w-3.5 h-3.5" />
            Attempt complete
          </Badge>

          <ScoreRing score={result.score} />

          <div>
            <h1 className="font-heading font-bold text-xl lg:text-2xl text-text leading-tight tracking-tight">
              {result.quiz_title}
            </h1>
            <p className="text-sm text-text-soft mt-1">
              Attempt #{attemptId?.slice(-6)}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-success-bg border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-heading font-bold text-lg text-success leading-none">
                {correct}
              </span>
              <span className="text-[11px] text-success/70 font-heading font-medium">
                Correct
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-danger-bg border border-danger/20">
              <XCircle className="w-5 h-5 text-danger" />
              <span className="font-heading font-bold text-lg text-danger leading-none">
                {wrong}
              </span>
              <span className="text-[11px] text-danger/70 font-heading font-medium">
                Wrong
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl bg-surface/60 border border-border/40">
              <Clock className="w-5 h-5 text-text-soft" />
              <span className="font-heading font-bold text-base text-text leading-none">
                {duration}
              </span>
              <span className="text-[11px] text-muted font-heading font-medium">
                Time
              </span>
            </div>
          </div>

          {/* Mode badge */}
          <div className="flex items-center gap-2">
            <Badge variant={result.is_timed ? "warning" : "muted"} size="sm">
              <Target className="w-3 h-3" />
              {result.is_timed ? "Timed mode" : "Untimed mode"}
            </Badge>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() =>
              navigate(result.quiz_id ? `/quiz/${result.quiz_id}` : "/browse")
            }
          >
            <RotateCcw className="w-5 h-5" />
            Retake Quiz
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => navigate("/home")}
          >
            <Home className="w-5 h-5" />
            Go Home
          </Button>
        </div>

        {/* ── Answer review toggle ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowReview((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-cream border border-border/50 hover:bg-surface/30 transition-colors"
          >
            <span className="font-heading font-semibold text-text text-sm">
              Review answers ({result.total} questions)
            </span>
            {showReview ? (
              <ChevronUp className="w-5 h-5 text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted" />
            )}
          </button>

          {showReview && (
            <div className="mt-3 space-y-2.5">
              {result.answers.map((a, i) => (
                <AnswerRow
                  key={a.question_id}
                  item={a as GradedAnswer}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
