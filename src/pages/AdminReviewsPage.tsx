/**
 * AdminReviewsPage — /admin/reviews
 *
 * Moderate user reviews across quizzes, creators, and platform.
 * Filter tabs: Pending / Approved / Featured / Hidden / All
 * Per-row actions via slide-in drawer: Approve, Feature, Unfeature, Hide, Delete.
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
  MessageSquare,
  Search,
  ShieldCheck,
  ChevronRight,
  Clock,
  Eye,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { DrawerShell } from "../components/DrawerShell";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewStatusFilter =
  | "pending"
  | "approved"
  | "featured"
  | "hidden"
  | "all";

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
  reviewer?: { full_name: string; avatar_url?: string | null } | null;
  quizzes?: { title: string } | null;
  creator?: { full_name: string } | null;
}

const TABS: { value: ReviewStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "featured", label: "Featured" },
  { value: "hidden", label: "Hidden" },
  { value: "pending", label: "Pending" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${
            s <= rating
              ? "fill-warning text-warning"
              : "text-border fill-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function TargetLabel({ review }: { review: AdminReviewRow }) {
  if (review.review_target_type === "quiz" && review.quizzes) {
    return (
      <Link
        to={`/quiz/${review.target_quiz_id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:underline underline-offset-2 font-medium"
      >
        {review.quizzes.title}
      </Link>
    );
  }
  if (review.review_target_type === "creator" && review.creator) {
    return (
      <Link
        to={`/profile/creator/${review.target_creator_id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-primary hover:underline underline-offset-2 font-medium"
      >
        {review.creator.full_name}
      </Link>
    );
  }
  return <span className="text-muted">PrepUniv Platform</span>;
}

function StatusBadge({ review }: { review: AdminReviewRow }) {
  if (review.is_hidden)
    return (
      <Badge variant="danger" size="sm">
        <EyeOff className="w-3 h-3" />
        Hidden
      </Badge>
    );
  if (review.is_featured)
    return (
      <Badge variant="secondary" size="sm">
        <Sparkles className="w-3 h-3" />
        Featured
      </Badge>
    );
  if (review.is_approved)
    return (
      <Badge variant="success" size="sm" dot>
        Approved
      </Badge>
    );
  return (
    <Badge variant="warning" size="sm" dot>
      Pending
    </Badge>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  tab,
  search,
}: {
  tab: ReviewStatusFilter;
  search: string;
}) {
  const msgs: Record<ReviewStatusFilter, { heading: string; sub: string }> = {
    pending: {
      heading: "No pending reviews",
      sub: "All reviews have been moderated — great work.",
    },
    approved: {
      heading: "No approved reviews",
      sub: "Approved reviews will appear here.",
    },
    featured: {
      heading: "No featured reviews",
      sub: "Feature approved reviews to show them on the landing page.",
    },
    hidden: {
      heading: "No hidden reviews",
      sub: "Reviews you hide will appear here.",
    },
    all: {
      heading: "No reviews yet",
      sub: "User reviews will appear here once submitted.",
    },
  };
  const { heading, sub } = msgs[tab];
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <MessageSquare className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        {search ? "No reviews match your search" : heading}
      </h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        {search ? "Try a different search term." : sub}
      </p>
    </div>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({
  review,
  onReview,
}: {
  review: AdminReviewRow;
  onReview: () => void;
}) {
  const targetTypeLabel =
    review.review_target_type === "quiz"
      ? "Quiz"
      : review.review_target_type === "creator"
        ? "Creator"
        : "Platform";

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 py-3.5 px-5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors cursor-pointer"
      onClick={onReview}
    >
      {/* Avatar */}
      <Avatar
        name={review.reviewer?.full_name ?? "User"}
        src={review.reviewer?.avatar_url ?? undefined}
        size="sm"
        className="shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-semibold text-sm text-text truncate max-w-[160px] sm:max-w-none">
            {review.reviewer?.full_name ?? "Anonymous Learner"}
          </span>
          <StatusBadge review={review} />
          <Badge variant="muted" size="sm">
            {targetTypeLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRow rating={review.rating} />
          <span className="text-[11px] text-muted">
            <Clock className="w-3 h-3 inline-block mr-0.5" strokeWidth={2} />
            {formatDate(review.created_at)}
          </span>
        </div>
        {review.review_text && (
          <p className="text-xs text-text-soft mt-0.5 line-clamp-1">
            {review.review_text}
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReview();
        }}
        className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border border-border/60 bg-cream text-text hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
      >
        Review
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Review drawer ────────────────────────────────────────────────────────────

function ReviewDrawer({
  review,
  onClose,
  onApprove,
  onFeature,
  onUnfeature,
  onHide,
  onUnhide,
  onDelete,
  isBusy,
}: {
  review: AdminReviewRow;
  onClose: () => void;
  onApprove: () => void;
  onFeature: () => void;
  onUnfeature: () => void;
  onHide: () => void;
  onUnhide: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <DrawerShell open={true} onClose={onClose} ariaLabel="Review moderation">
      <DrawerShell.Header
        icon={<MessageSquare className="w-5 h-5" strokeWidth={2} />}
        iconClassName="bg-surface text-muted"
        title={
          <h2 className="font-heading font-bold text-sm text-text leading-tight line-clamp-1">
            {review.reviewer?.full_name ?? "Anonymous Learner"}
          </h2>
        }
        statusBadge={<StatusBadge review={review} />}
        meta={`Submitted ${formatDate(review.created_at)}`}
        onClose={onClose}
      />

      <DrawerShell.Body>
        {/* Reviewer */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface/40 border border-border/40">
          <Avatar
            name={review.reviewer?.full_name ?? "User"}
            src={review.reviewer?.avatar_url ?? undefined}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-text leading-tight">
              {review.reviewer?.full_name ?? "Anonymous Learner"}
            </p>
            <p className="text-xs text-muted truncate">{review.reviewer_id}</p>
          </div>
          <Badge
            variant={
              review.review_target_type === "platform"
                ? "secondary"
                : review.review_target_type === "creator"
                  ? "primary"
                  : "muted"
            }
            size="sm"
          >
            {review.review_target_type.toUpperCase()}
          </Badge>
        </div>

        {/* Target */}
        <div className="rounded-2xl border border-border/40 bg-surface/20 px-4 py-3">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
            {review.review_target_type === "quiz"
              ? "Quiz"
              : review.review_target_type === "creator"
                ? "Creator"
                : "Platform"}
          </p>
          <p className="text-sm">
            <TargetLabel review={review} />
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/20 border border-border/40">
          <StarRow rating={review.rating} />
          <span className="font-heading font-bold text-sm text-text">
            {review.rating} / 5
          </span>
        </div>

        {/* Review text */}
        {review.review_text ? (
          <div className="rounded-2xl border border-border/40 bg-surface/20 px-4 py-3">
            <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1.5">
              Review text
            </p>
            <p className="text-sm text-text leading-relaxed">
              &ldquo;{review.review_text}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted italic px-1">
            No written review text provided — rating only.
          </p>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="rounded-2xl border border-danger/25 bg-danger-bg/40 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Permanently delete this review? This cannot be undone.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isBusy}
                onClick={onDelete}
              >
                {!isBusy && <Trash2 className="w-3.5 h-3.5" />}
                Confirm delete
              </Button>
            </div>
          </div>
        )}
      </DrawerShell.Body>

      <DrawerShell.Footer className="space-y-2">
        {/* Primary action row */}
        <div className="flex items-center gap-2">
          {!review.is_approved && (
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              isLoading={isBusy}
              onClick={onApprove}
            >
              {!isBusy && <CheckCircle2 className="w-4 h-4" />}
              Approve
            </Button>
          )}

          {review.is_approved && !review.is_featured && !review.is_hidden && (
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              disabled={isBusy}
              onClick={onFeature}
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              Feature on Landing
            </Button>
          )}

          {review.is_featured && (
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              disabled={isBusy}
              onClick={onUnfeature}
            >
              Unfeature
            </Button>
          )}

          {!review.is_hidden ? (
            <Button
              variant="ghost"
              size="md"
              className={`${!review.is_approved ? "" : "flex-1"} text-text-soft hover:text-danger`}
              disabled={isBusy}
              onClick={onHide}
            >
              <EyeOff className="w-4 h-4" />
              Hide
            </Button>
          ) : (
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              disabled={isBusy}
              onClick={onUnhide}
            >
              <Eye className="w-4 h-4" />
              Unhide &amp; Approve
            </Button>
          )}
        </div>

        {/* Delete — separate, destructive */}
        {!confirmDelete && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setConfirmDelete(true)}
            className="w-full h-9 rounded-xl text-xs font-heading font-semibold border border-danger/30 text-danger hover:bg-danger-bg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete review
          </button>
        )}
      </DrawerShell.Footer>
    </DrawerShell>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="animate-pulse divide-y divide-border/30">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3.5 px-5">
          <div className="h-8 w-8 rounded-full bg-surface shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-28 rounded bg-surface" />
              <div className="h-5 w-16 rounded-lg bg-surface" />
              <div className="h-5 w-14 rounded-lg bg-surface" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded bg-surface/70" />
              <div className="h-3 w-24 rounded bg-surface/60" />
            </div>
            <div className="h-3 w-3/4 rounded bg-surface/60" />
          </div>
          <div className="h-9 w-20 rounded-xl bg-surface shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminReviewsPage() {
  usePageTitle("Review Moderation — Admin");
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  async function loadReviews() {
    setLoading(true);
    const { data, error } = await apiFetch<AdminReviewRow[]>(
      "/api/admin/reviews?status=all&limit=200",
    );
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
    const { error } = await apiFetch(`/api/admin/reviews/${id}/approve`, {
      method: "POST",
    });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to approve review.", variant: "danger" });
    } else {
      showToast({ message: "Review approved." });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_approved: true, is_hidden: false } : r,
        ),
      );
      setReviewingId(null);
    }
  }

  async function handleFeature(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/feature`, {
      method: "POST",
    });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to feature review.", variant: "danger" });
    } else {
      showToast({ message: "Review featured on landing page." });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, is_featured: true, is_approved: true, is_hidden: false }
            : r,
        ),
      );
      setReviewingId(null);
    }
  }

  async function handleUnfeature(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/unfeature`, {
      method: "POST",
    });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to unfeature review.", variant: "danger" });
    } else {
      showToast({ message: "Review unfeatured." });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: false } : r)),
      );
      setReviewingId(null);
    }
  }

  async function handleHide(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}/hide`, {
      method: "POST",
    });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to hide review.", variant: "danger" });
    } else {
      showToast({ message: "Review hidden from public." });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_hidden: true, is_featured: false } : r,
        ),
      );
      setReviewingId(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoadingId(id);
    const { error } = await apiFetch(`/api/admin/reviews/${id}`, {
      method: "DELETE",
    });
    setActionLoadingId(null);
    if (error) {
      showToast({ message: "Failed to delete review.", variant: "danger" });
    } else {
      showToast({ message: "Review deleted." });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setReviewingId(null);
    }
  }

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((r) => !r.is_approved && !r.is_hidden).length,
      approved: reviews.filter((r) => r.is_approved && !r.is_hidden).length,
      featured: reviews.filter((r) => r.is_featured && !r.is_hidden).length,
      hidden: reviews.filter((r) => r.is_hidden).length,
    }),
    [reviews],
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeTab === "pending" && (r.is_approved || r.is_hidden))
        return false;
      if (activeTab === "approved" && (!r.is_approved || r.is_hidden))
        return false;
      if (activeTab === "featured" && (!r.is_featured || r.is_hidden))
        return false;
      if (activeTab === "hidden" && !r.is_hidden) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (r.reviewer?.full_name?.toLowerCase() ?? "").includes(q) ||
          (r.review_text?.toLowerCase() ?? "").includes(q) ||
          (r.quizzes?.title?.toLowerCase() ?? "").includes(q) ||
          (r.creator?.full_name?.toLowerCase() ?? "").includes(q)
        );
      }
      return true;
    });
  }, [reviews, activeTab, search]);

  const reviewingRow = reviewingId
    ? (reviews.find((r) => r.id === reviewingId) ?? null)
    : null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="max-w-240!">
        <div className="space-y-5 lg:space-y-6">
          {/* ── Header ── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="warning" size="sm" dot className="mb-2">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                Review Moderation
              </h1>
              <p className="mt-1.5 text-sm text-text-soft leading-relaxed">
                {counts.hidden > 0
                  ? `${counts.hidden} review${counts.hidden !== 1 ? "s" : ""} currently hidden.`
                  : `${counts.all} review${counts.all !== 1 ? "s" : ""} on the platform.`}
              </p>
            </div>
            {/* Search + Refresh */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-xs shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reviews…"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border/60 bg-cream text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadReviews}
                isLoading={loading}
                className="shrink-0 h-11"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit max-w-full overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-cream shadow-soft text-text"
                    : "text-text-soft hover:text-text"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${
                      tab.value === "pending" && activeTab === "pending"
                        ? "bg-warning text-cream"
                        : "bg-border text-muted"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── List ── */}
          <Card padded={false} className="overflow-hidden">
            {loading ? (
              <SkeletonRows />
            ) : filteredReviews.length === 0 ? (
              <EmptyState tab={activeTab} search={search} />
            ) : (
              filteredReviews.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  onReview={() => setReviewingId(r.id)}
                />
              ))
            )}
          </Card>
        </div>
      </PageContainer>

      {/* ── Review drawer ── */}
      {reviewingRow && (
        <ReviewDrawer
          review={reviewingRow}
          onClose={() => setReviewingId(null)}
          onApprove={() => handleApprove(reviewingRow.id)}
          onFeature={() => handleFeature(reviewingRow.id)}
          onUnfeature={() => handleUnfeature(reviewingRow.id)}
          onHide={() => handleHide(reviewingRow.id)}
          onUnhide={() => handleApprove(reviewingRow.id)}
          onDelete={() => handleDelete(reviewingRow.id)}
          isBusy={actionLoadingId === reviewingRow.id}
        />
      )}
    </>
  );
}
