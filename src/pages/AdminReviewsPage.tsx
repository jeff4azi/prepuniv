/**
 * AdminReviewsPage — /admin/reviews
 *
 * Moderate user reviews across quizzes, creators, and platform.
 * Filter tabs: Pending / Approved / Featured / Hidden / All
 * Per-row actions: Approve, Feature, Unfeature, Hide, Delete.
 */
import { useState, useEffect, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Star,
  CheckCircle2,
  Sparkles,
  EyeOff,
  Trash2,
  Clock,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

type ReviewStatusFilter = "pending" | "approved" | "featured" | "hidden" | "all";

interface AdminReviewRow {
  id: string;
  review_target_type: "quiz" | "creator" | "platform";
  target_quiz_id: string | null;
  target_creator_id: string | null;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  reviewer_id: string;
  created_at: string;
  updated_at: string;
  reviewer?: {
    full_name: string;
    avatar_url?: string | null;
  } | null;
  quizzes?: {
    title: string;
  } | null;
  creator?: {
    full_name: string;
  } | null;
}

const TABS: { value: ReviewStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "featured", label: "Featured" },
  { value: "hidden", label: "Hidden" },
];

export function AdminReviewsPage() {
  usePageTitle("Review Moderation — Admin");
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewStatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Admin access guard
  if (currentUser.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  async function loadReviews() {
    setLoading(true);
    const { data, error } = await apiFetch<AdminReviewRow[]>("/api/admin/reviews?status=all&limit=100");
    setLoading(false);
    if (error) {
      showToast({ message: "Failed to load reviews.", variant: "danger" });
    } else {
      setReviews(data ?? []);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/approve`, { method: "POST" });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to approve review.", variant: "danger" });
    } else {
      showToast({ message: "Review approved!" });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_approved: true, is_hidden: false } : r))
      );
    }
  }

  async function handleFeature(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/feature`, { method: "POST" });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to feature review.", variant: "danger" });
    } else {
      showToast({ message: "Review featured on landing page!" });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_featured: true, is_approved: true, is_hidden: false } : r
        )
      );
    }
  }

  async function handleUnfeature(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/unfeature`, { method: "POST" });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to unfeature review.", variant: "danger" });
    } else {
      showToast({ message: "Review unfeatured." });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: false } : r))
      );
    }
  }

  async function handleHide(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/hide`, { method: "POST" });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to hide review.", variant: "danger" });
    } else {
      showToast({ message: "Review hidden from public." });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_hidden: true, is_featured: false } : r))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) {
      return;
    }
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to delete review.", variant: "danger" });
    } else {
      showToast({ message: "Review deleted." });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Tab filter
      if (activeTab === "pending" && (r.is_approved || r.is_hidden)) return false;
      if (activeTab === "approved" && (!r.is_approved || r.is_hidden)) return false;
      if (activeTab === "featured" && (!r.is_featured || r.is_hidden)) return false;
      if (activeTab === "hidden" && !r.is_hidden) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const reviewerName = r.reviewer?.full_name?.toLowerCase() ?? "";
        const text = r.review_text?.toLowerCase() ?? "";
        const quizTitle = r.quizzes?.title?.toLowerCase() ?? "";
        const creatorName = r.creator?.full_name?.toLowerCase() ?? "";
        return (
          reviewerName.includes(q) ||
          text.includes(q) ||
          quizTitle.includes(q) ||
          creatorName.includes(q)
        );
      }
      return true;
    });
  }, [reviews, activeTab, search]);

  const counts = useMemo(() => {
    return {
      all: reviews.length,
      pending: reviews.filter((r) => !r.is_approved && !r.is_hidden).length,
      approved: reviews.filter((r) => r.is_approved && !r.is_hidden).length,
      featured: reviews.filter((r) => r.is_featured && !r.is_hidden).length,
      hidden: reviews.filter((r) => r.is_hidden).length,
    };
  }, [reviews]);

  return (
    <PageContainer>
      {toast && <Toast toast={toast} onDismiss={dismissToast} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-2xl text-text tracking-tight">
              Review Moderation
            </h1>
            <p className="text-sm text-text-soft mt-0.5">
              Curate, approve, feature, or remove ratings across the platform.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReviews}
            isLoading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Filter tabs & Search */}
        <Card padded={false} className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => {
              const count = counts[t.value];
              const isActive = activeTab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setActiveTab(t.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-cream shadow-xs"
                      : "bg-surface/60 text-text-soft hover:bg-surface hover:text-text"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/20 text-cream"
                          : t.value === "pending"
                            ? "bg-warning-bg text-warning font-bold"
                            : "bg-border text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reviewer, quiz title, creator, or text..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/60 bg-surface/40 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 transition"
            />
          </div>
        </Card>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                padded={false}
                className="p-4 sm:p-5 space-y-3 border border-border/60 bg-surface/20"
              >
                {/* Top row: reviewer & target */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-surface shrink-0" />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-28 rounded bg-surface" />
                        <div className="h-5 w-14 rounded-lg bg-surface" />
                      </div>
                      <div className="h-3 w-44 rounded bg-surface/60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-16 rounded-lg bg-surface" />
                    <div className="h-5 w-16 rounded-lg bg-surface" />
                  </div>
                </div>

                {/* Rating & text */}
                <div className="space-y-2 pl-0 sm:pl-11">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-20 rounded bg-surface" />
                    <div className="h-3 w-28 rounded bg-surface/60" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-full rounded bg-surface/70" />
                    <div className="h-3.5 w-3/4 rounded bg-surface/70" />
                  </div>
                </div>

                {/* Actions row */}
                <div className="pl-0 sm:pl-11 pt-2 border-t border-border/30 flex items-center justify-end gap-2">
                  <div className="h-8 w-20 rounded-xl bg-surface" />
                  <div className="h-8 w-20 rounded-xl bg-surface" />
                  <div className="h-8 w-8 rounded-xl bg-surface" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card className="text-center py-12 space-y-2">
            <MessageSquare className="w-8 h-8 text-muted mx-auto" />
            <p className="font-heading font-semibold text-text text-sm">
              No reviews found
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {search
                ? "No reviews match your search query."
                : `There are no reviews in the ${activeTab} queue right now.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((r) => {
              const isBusy = actionLoadingId === r.id;
              return (
                <Card
                  key={r.id}
                  padded={false}
                  className={`p-4 sm:p-5 space-y-3 transition border ${
                    r.is_hidden
                      ? "opacity-60 bg-surface/20 border-border/40"
                      : !r.is_approved
                        ? "border-warning/30 bg-warning-bg/5"
                        : r.is_featured
                          ? "border-secondary/30 bg-secondary/5"
                          : "border-border/60"
                  }`}
                >
                  {/* Top row: reviewer & target */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={r.reviewer?.full_name ?? "User"}
                        src={r.reviewer?.avatar_url ?? undefined}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-heading font-semibold text-sm text-text">
                            {r.reviewer?.full_name ?? "Anonymous Learner"}
                          </p>
                          <Badge
                            variant={
                              r.review_target_type === "platform"
                                ? "secondary"
                                : r.review_target_type === "creator"
                                  ? "primary"
                                  : "muted"
                            }
                            size="sm"
                          >
                            {r.review_target_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted">
                          {r.review_target_type === "quiz" && r.quizzes && (
                            <>
                              Quiz:{" "}
                              <Link
                                to={`/quiz/${r.target_quiz_id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {r.quizzes.title}
                              </Link>
                            </>
                          )}
                          {r.review_target_type === "creator" && r.creator && (
                            <>
                              Creator:{" "}
                              <Link
                                to={`/profile/creator/${r.target_creator_id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {r.creator.full_name}
                              </Link>
                            </>
                          )}
                          {r.review_target_type === "platform" && "PrepUniv Platform Review"}
                        </p>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      {r.is_featured && (
                        <Badge variant="primary" size="sm">
                          <Sparkles className="w-3 h-3 text-secondary" />
                          Featured
                        </Badge>
                      )}
                      {r.is_approved ? (
                        <Badge variant="success" size="sm" dot>
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm" dot>
                          Pending
                        </Badge>
                      )}
                      {r.is_hidden && (
                        <Badge variant="danger" size="sm">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating & text */}
                  <div className="space-y-1.5 pl-0 sm:pl-12">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-warning">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= r.rating
                                ? "fill-warning text-warning"
                                : "text-border fill-transparent"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-heading font-semibold text-text">
                        {r.rating} / 5
                      </span>
                      <span className="text-[11px] text-muted">
                        •{" "}
                        {new Date(r.created_at).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {r.review_text ? (
                      <p className="text-sm text-text leading-relaxed bg-surface/40 p-3 rounded-xl border border-border/30">
                        &ldquo;{r.review_text}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-muted italic">
                        No written review text provided.
                      </p>
                    )}
                  </div>

                  {/* Actions toolbar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border/40">
                    {!r.is_approved && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => handleApprove(r.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </Button>
                    )}

                    {r.is_approved && !r.is_featured && !r.is_hidden && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => handleFeature(r.id)}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-secondary" />
                        Feature on Landing
                      </Button>
                    )}

                    {r.is_featured && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleUnfeature(r.id)}
                      >
                        Unfeature
                      </Button>
                    )}

                    {!r.is_hidden ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleHide(r.id)}
                        className="text-text-soft hover:text-danger"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleApprove(r.id)}
                      >
                        Unhide &amp; Approve
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => handleDelete(r.id)}
                      className="text-muted hover:text-danger hover:bg-danger-bg/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
