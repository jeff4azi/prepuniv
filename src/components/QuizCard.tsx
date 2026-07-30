import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  PlayCircle,
  Target,
} from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import type { Quiz, Course, Profile, QuizAttempt } from "../mock";

type QuizCardVariant = "purchased" | "locked" | "attempted";

export interface QuizCardProps {
  quiz: Quiz;
  course?: Course;
  creator?: Profile;
  variant?: QuizCardVariant;
  attempt?: QuizAttempt;
  className?: string;
  /** Pass true when already on the creator's own profile page to avoid a
   *  self-referencing link loop. The creator row still renders, just not
   *  as a clickable link. */
  hideCreatorLink?: boolean;
  /** When set on the `attempted` variant, renders a "Retake" primary CTA
   *  linking to this URL, and moves "View result" to a small secondary link. */
  retakeTo?: string;
}

export function formatNaira(amount: number) {
  const naira = Math.abs(amount) / 100;
  const base =
    "₦" + naira.toLocaleString("en-NG", { maximumFractionDigits: 0 });
  if (amount < 0) return "-" + base;
  return base;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns a short display label for a course — the code if available, otherwise a fallback. */
export function shortCourseName(code: string, fallback?: string) {
  return code || fallback || "Quiz";
}

const VARIANT_BG: Record<QuizCardVariant, string> = {
  purchased: "ring-primary/15 bg-cream",
  locked: "bg-cream",
  attempted: "bg-cream",
};

export function QuizCard({
  quiz,
  course,
  creator,
  variant = "locked",
  attempt,
  className = "",
  hideCreatorLink = false,
  retakeTo,
}: QuizCardProps) {
  const cardClass =
    "group relative overflow-hidden " + VARIANT_BG[variant] + " " + className;

  const ctaRow = (() => {
    if (variant === "purchased") {
      return (
        <Link to={`/quiz/${quiz.id}`} className="block">
          <Button fullWidth variant="primary" size="md" className="h-11">
            <PlayCircle className="w-4.5 h-4.5" />
            Start attempt
            <ArrowRight className="w-4.25 h-4.25" />
          </Button>
        </Link>
      );
    }
    if (variant === "attempted") {
      if (retakeTo) {
        return (
          <div className="space-y-2">
            <Link to={retakeTo} className="block">
              <Button fullWidth variant="primary" size="md" className="h-11">
                <PlayCircle className="w-4.5 h-4.5" />
                Retake
                <ArrowRight className="w-4.25 h-4.25" />
              </Button>
            </Link>
            <Link
              to={`/attempt/${attempt?.id ?? "0"}/result`}
              className="flex items-center justify-center gap-1 text-xs font-heading font-medium text-muted hover:text-text-soft transition-colors py-0.5"
            >
              View last result →
            </Link>
          </div>
        );
      }
      return (
        <Link to={`/attempt/${attempt?.id ?? "0"}/result`} className="block">
          <Button fullWidth variant="secondary" size="md" className="h-11">
            <FileQuestion className="w-4.25 h-4.25" />
            View result
          </Button>
        </Link>
      );
    }
    return (
      <Link to={`/quiz/${quiz.id}`} className="block">
        <Button fullWidth variant="outline" size="md" className="h-11">
          <span className="font-heading font-bold text-text">
            {formatNaira(quiz.price)}
          </span>
          <span className="h-4 w-px bg-border mx-1" />
          <span>Pay &amp; start</span>
          <ArrowRight className="w-4.25 h-4.25" />
        </Button>
      </Link>
    );
  })();

  const topRightBadge = (() => {
    if (variant === "purchased") {
      return (
        <Badge variant="primary" size="md" dot>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Purchased
        </Badge>
      );
    }
    if (variant === "attempted" && attempt) {
      const score = attempt.score;
      const color =
        score >= 80 ? "success" : score >= 60 ? "primary" : "warning";
      const variantBadge = color as "success" | "primary" | "warning";
      return (
        <Badge variant={variantBadge} size="md" dot>
          {score}% score
        </Badge>
      );
    }
    return (
      <Badge variant="muted" size="md" dot>
        New
      </Badge>
    );
  })();

  // ── Creator row: combined avatar + name tap target → /profile/creator/:id ──
  const creatorRow = (() => {
    if (!creator) {
      return <span className="text-[12px] text-muted">Verified creator</span>;
    }

    const inner = (
      <span className="flex items-center gap-2 min-w-0">
        <Avatar name={creator.full_name} size="xs" />
        <span className="text-[12px] text-text-soft truncate max-w-35 group-hover/creator:text-text transition-colors">
          by {creator.full_name.split(" ").slice(0, 2).join(" ")}
        </span>
      </span>
    );

    if (
      hideCreatorLink ||
      (creator.role !== "creator" && creator.role !== "admin")
    ) {
      return <span className="flex items-center gap-2 min-w-0">{inner}</span>;
    }

    return (
      <Link
        to={`/profile/creator/${creator.id}`}
        onClick={(e) => e.stopPropagation()}
        className="group/creator inline-flex items-center min-w-0 rounded-xl -mx-1 px-1 py-0.5 hover:bg-surface/70 active:opacity-70 active:scale-[0.98] transition-all duration-150"
        aria-label={`View ${creator.full_name}'s profile`}
      >
        {inner}
      </Link>
    );
  })();

  return (
    <Card hover padded={false} className={"flex flex-col " + cardClass}>
      <div className="relative px-5 pt-5 pb-4 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <Badge variant="secondary" size="sm">
                <Target className="w-3 h-3" />
                {course ? course.code : "Quiz"}
              </Badge>
              {course && (
                <span className="text-[10px] font-heading font-medium text-muted">
                  {course.subject_area}
                </span>
              )}
            </div>
            <h3 className="font-heading font-semibold text-text text-[15px] leading-snug line-clamp-2">
              {quiz.title}
            </h3>
          </div>
          <div className="shrink-0 translate-y-0.5">{topRightBadge}</div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-soft">
          <FileQuestion className="w-4 h-4 text-muted" />
          <span>{quiz.question_count.toLocaleString()} questions</span>
          {variant === "attempted" && attempt?.completed_at && (
            <>
              <span className="h-1 w-1 rounded-full bg-muted/60" />
              <Clock className="w-4 h-4 text-muted" />
              <span>{formatDate(attempt.completed_at)}</span>
            </>
          )}
        </div>

        {variant === "attempted" && attempt && (
          <ScoreStrip score={attempt.score} />
        )}

        {variant !== "attempted" && (
          <div className="h-1 w-full rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary/60 to-secondary/50"
              style={{
                width:
                  variant === "purchased"
                    ? "100%"
                    : String(
                        Math.min(100, 25 + ((quiz.question_count * 7) % 60)),
                      ) + "%",
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {creatorRow}
          <Badge variant="muted" size="sm">
            {quiz.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">{ctaRow}</div>
    </Card>
  );
}

function ScoreStrip({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-success" : score >= 60 ? "bg-primary" : "bg-warning";
  const toneSoft =
    score >= 80
      ? "bg-success-bg text-success border-success/20"
      : score >= 60
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-warning-bg text-warning border-warning/20";
  return (
    <div className="flex items-center gap-3">
      <div className={"flex-1 h-2.5 rounded-full bg-surface overflow-hidden"}>
        <div
          className={"h-full rounded-full " + tone}
          style={{ width: String(Math.max(4, Math.min(100, score))) + "%" }}
        />
      </div>
      <span
        className={
          "shrink-0 inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] font-heading font-semibold " +
          toneSoft
        }
      >
        {score}%
      </span>
    </div>
  );
}
