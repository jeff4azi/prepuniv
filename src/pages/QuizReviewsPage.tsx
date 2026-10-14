import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Avatar } from "../components/Avatar";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  fetchQuiz,
  fetchQuizRating,
  fetchAllQuizReviews,
  type QuizRating,
  type QuizReviewItem,
} from "../lib/queries";

const FILTER_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: "All", value: undefined },
  { label: "5 ★", value: 5 },
  { label: "4 ★", value: 4 },
  { label: "3 ★", value: 3 },
  { label: "2 ★", value: 2 },
  { label: "1 ★", value: 1 },
];

export function QuizReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from as string | undefined;

  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [rating, setRating] = useState<QuizRating | null>(null);
  const [reviews, setReviews] = useState<QuizReviewItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<number | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);

  usePageTitle(quizTitle ? `Reviews · ${quizTitle}` : null);

  // Load quiz title + rating once on mount
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [quiz, r] = await Promise.all([fetchQuiz(id), fetchQuizRating(id)]);
      if (cancelled) return;
      setQuizTitle(quiz?.title ?? null);
      setRating(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Reload reviews whenever the filter changes
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const data = await fetchAllQuizReviews(id, activeFilter);
      if (cancelled) return;
      setReviews(data);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, activeFilter]);

  function goBack() {
    if (fromPath) {
      navigate(fromPath);
    } else if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/quiz/${id}`);
    }
  }

  return (
    <PageContainer className="!max-w-[720px]">
      {/* Back nav */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to quiz
      </button>

      <div className="space-y-4 pb-10">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-xl text-text tracking-tight">
            Ratings &amp; Reviews
          </h1>
          {quizTitle && (
            <p className="text-sm text-muted mt-0.5 truncate">{quizTitle}</p>
          )}
        </div>

        {/* Rating summary card */}
        {rating && rating.total_reviews > 0 && (
          <Card>
            <div className="grid sm:grid-cols-12 gap-6 items-center">
              {/* Big number */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center text-center sm:border-r border-border/40 sm:pr-4">
                <span className="font-heading font-bold text-5xl text-text leading-none">
                  {rating.avg_rating.toFixed(1)}
                </span>
                <div className="flex items-center gap-1 text-warning my-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(rating.avg_rating)
                          ? "fill-warning text-warning"
                          : "text-border fill-transparent"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted font-heading">
                  {rating.total_reviews.toLocaleString()} review
                  {rating.total_reviews !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Bar breakdown */}
              <div className="sm:col-span-8 space-y-1.5">
                {[
                  { star: 5, count: rating.r5 },
                  { star: 4, count: rating.r4 },
                  { star: 3, count: rating.r3 },
                  { star: 2, count: rating.r2 },
                  { star: 1, count: rating.r1 },
                ].map(({ star, count }) => {
                  const pct =
                    rating.total_reviews > 0
                      ? Math.round((count / rating.total_reviews) * 100)
                      : 0;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          activeFilter === star ? undefined : star,
                        )
                      }
                      className={`w-full flex items-center gap-2.5 text-xs rounded-lg px-1 py-0.5 transition-colors ${
                        activeFilter === star
                          ? "bg-warning/10"
                          : "hover:bg-surface/50"
                      }`}
                    >
                      <span className="w-3 font-heading font-medium text-right shrink-0 text-text-soft">
                        {star}
                      </span>
                      <Star className="w-3 h-3 text-warning fill-warning shrink-0" />
                      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden border border-border/30">
                        <div
                          className="h-full bg-warning rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono text-muted text-[11px] shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setActiveFilter(opt.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold border transition-all ${
                activeFilter === opt.value
                  ? "bg-primary text-cream border-primary shadow-soft"
                  : "bg-surface/40 text-text-soft border-border/50 hover:border-border hover:bg-surface/70"
              }`}
            >
              {opt.label}
              {opt.value !== undefined && rating && (
                <span className="ml-1 opacity-60">
                  (
                  {opt.value === 5
                    ? rating.r5
                    : opt.value === 4
                      ? rating.r4
                      : opt.value === 3
                        ? rating.r3
                        : opt.value === 2
                          ? rating.r2
                          : rating.r1}
                  )
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border/40 bg-surface/20 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-surface" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 rounded bg-surface" />
                      <div className="h-2.5 w-16 rounded bg-surface/60" />
                    </div>
                  </div>
                  <div className="h-3.5 w-20 rounded bg-surface" />
                </div>
                <div className="space-y-1.5 pl-9">
                  <div className="h-3 w-full rounded bg-surface/70" />
                  <div className="h-3 w-3/4 rounded bg-surface/70" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl border border-border/40 bg-surface/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={r.reviewer_name}
                      src={r.reviewer_avatar_url ?? undefined}
                      size="xs"
                    />
                    <div>
                      <p className="text-xs font-heading font-semibold text-text leading-tight">
                        {r.reviewer_name}
                      </p>
                      <p className="text-[10px] text-muted">
                        {new Date(r.created_at).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-warning shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= r.rating
                            ? "fill-warning text-warning"
                            : "text-border fill-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {r.review_text && (
                  <p className="text-xs text-text-soft leading-relaxed pl-9">
                    {r.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 rounded-2xl bg-surface/20 border border-border/30">
            <Star className="w-6 h-6 text-muted/60 mx-auto mb-2" />
            <p className="text-sm font-heading font-semibold text-text">
              {activeFilter !== undefined
                ? `No ${activeFilter}-star reviews yet`
                : "No reviews yet"}
            </p>
            {activeFilter !== undefined && (
              <button
                type="button"
                onClick={() => setActiveFilter(undefined)}
                className="mt-2 text-xs text-primary font-heading font-semibold hover:underline underline-offset-2"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
