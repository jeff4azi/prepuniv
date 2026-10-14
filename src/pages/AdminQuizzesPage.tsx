/**
 * AdminQuizzesPage — /admin/quizzes
 *
 * Platform-wide master list of every quiz, across all creators.
 * Distinct from /creator/quizzes (creator-owned) and /admin/courses (taxonomy).
 *
 * Server-side paginated via /api/admin/quizzes to avoid Supabase's 1000-row cap.
 * Filtering (university, status, dept, search) and sorting are passed as query
 * params to the backend; the frontend only renders the current page's slice.
 *
 * Status distinction:
 *   Published            — is_published && !unpublished_by_admin
 *   Unpublished (admin)  — unpublished_by_admin === true
 *   Unpublished (creator)— !is_published && !unpublished_by_admin
 */
import { useState, useMemo, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  ScrollText,
  Search,
  X,
  ShieldCheck,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { FilterSelect } from "../components/CustomSelect";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { formatNaira } from "../components/QuizCard";
import type { DbQuiz, DbCourse, DbProfile } from "../lib/supabase";
import {
  useAdminQuizzes,
  useCourses,
  useProfiles,
  useUniversities,
  useWalletTransactions,
  adminUnpublishQuiz,
  adminRepublishQuiz,
  AdminLoadingState,
} from "../hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "published" | "unpublished";
type SortKey = "newest" | "attempts" | "revenue" | "price-desc" | "price-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "attempts", label: "Most Attempts" },
  { value: "revenue", label: "Platform Revenue" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
];

const PAGE_SIZE = 25;

// ─── Quiz status helpers ──────────────────────────────────────────────────────

type QuizStatus = "published" | "unpublished_admin" | "unpublished_creator";

function getQuizStatus(q: DbQuiz): QuizStatus {
  if (q.unpublished_by_admin) return "unpublished_admin";
  if (!q.is_published) return "unpublished_creator";
  return "published";
}

function QuizStatusBadge({ quiz }: { quiz: DbQuiz }) {
  const status = getQuizStatus(quiz);
  if (status === "published")
    return (
      <Badge variant="success" size="sm" dot>
        Published
      </Badge>
    );
  if (status === "unpublished_admin")
    return (
      <Badge variant="danger" size="sm" className="gap-1">
        <EyeOff className="w-3 h-3" />
        Unpublished (admin)
      </Badge>
    );
  return (
    <Badge variant="muted" size="sm" className="gap-1">
      <EyeOff className="w-3 h-3" />
      Unpublished (creator)
    </Badge>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  quiz,
  action,
  onConfirm,
  onCancel,
  loading,
}: {
  quiz: DbQuiz;
  action: "unpublish" | "republish";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isUnpublish = action === "unpublish";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm bg-cream rounded-3xl shadow-elevated p-6 space-y-4">
        <div
          className={`h-11 w-11 rounded-2xl flex items-center justify-center mx-auto ${
            isUnpublish
              ? "bg-warning-bg text-warning"
              : "bg-success-bg text-success"
          }`}
        >
          {isUnpublish ? (
            <EyeOff className="w-5 h-5" strokeWidth={2} />
          ) : (
            <Eye className="w-5 h-5" strokeWidth={2} />
          )}
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="font-heading font-bold text-base text-text">
            {isUnpublish ? "Unpublish quiz?" : "Republish quiz?"}
          </h2>
          {isUnpublish ? (
            <p className="text-sm text-text-soft leading-relaxed">
              &ldquo;
              <span className="font-heading font-semibold text-text">
                {quiz.title}
              </span>
              &rdquo; will be hidden from Browse, but existing owners keep
              access per the pay-once policy.
            </p>
          ) : (
            <p className="text-sm text-text-soft leading-relaxed">
              &ldquo;
              <span className="font-heading font-semibold text-text">
                {quiz.title}
              </span>
              &rdquo; will be visible in Browse again. The admin override will
              be cleared.
            </p>
          )}
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={isUnpublish ? "outline" : "primary"}
            size="md"
            className={`flex-1 ${isUnpublish ? "border-warning/50 text-warning hover:bg-warning-bg" : ""}`}
            isLoading={loading}
            onClick={onConfirm}
          >
            {!loading &&
              (isUnpublish ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              ))}
            {isUnpublish ? "Unpublish" : "Republish"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function QuizTableRow({
  quiz,
  courseName,
  creator,
  platformRevenue,
  onAction,
}: {
  quiz: DbQuiz;
  courseName: string;
  creator: DbProfile | undefined;
  platformRevenue: number;
  onAction: (action: "unpublish" | "republish") => void;
}) {
  const status = getQuizStatus(quiz);
  const canUnpublish = status === "published";
  const canRepublish = status === "unpublished_admin";

  return (
    <tr className="hover:bg-surface/20 transition-colors group border-b border-border/30 last:border-0">
      {/* Title + course */}
      <td className="pl-5 pr-3 py-3.5 min-w-55">
        <div className="space-y-1">
          <Link
            to={`/admin/quizzes/${quiz.id}/content`}
            className="font-heading font-semibold text-sm text-text hover:text-primary hover:underline underline-offset-2 transition-colors line-clamp-2 leading-snug block"
          >
            {quiz.title}
          </Link>
          <span className="inline-block text-[10px] font-heading font-semibold text-muted bg-surface border border-border/50 rounded-lg px-1.5 py-0.5">
            {courseName}
          </span>
        </div>
      </td>
      {/* Creator */}
      <td className="px-3 py-3.5 w-36">
        {creator ? (
          <Link
            to={`/profile/creator/${creator.id}`}
            className="flex items-center gap-1.5 group/cr hover:text-primary transition-colors"
          >
            <Avatar
              name={creator.full_name}
              src={creator.avatar_url ?? undefined}
              size="xs"
              enlargeable={false}
            />
            <span className="text-xs font-heading font-medium text-text-soft group-hover/cr:text-primary truncate max-w-24">
              {creator.full_name.split(" ").slice(0, 2).join(" ")}
            </span>
            <ExternalLink className="w-3 h-3 text-muted shrink-0 opacity-0 group-hover/cr:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
      {/* Price */}
      <td className="px-3 py-3.5 w-24 text-right">
        <span className="font-heading font-semibold text-sm text-text">
          {formatNaira(quiz.price)}
        </span>
      </td>
      {/* Status */}
      <td className="px-3 py-3.5 w-44">
        <QuizStatusBadge quiz={quiz} />
      </td>
      {/* Attempts */}
      <td className="px-3 py-3.5 w-20 text-right">
        <span className="text-sm text-text">
          {(quiz.attempt_count ?? 0).toLocaleString()}
        </span>
      </td>
      {/* Platform revenue */}
      <td className="px-3 py-3.5 w-28 text-right">
        <span className="font-heading font-semibold text-sm text-success">
          {platformRevenue > 0 ? formatNaira(platformRevenue) : "—"}
        </span>
      </td>
      {/* Created */}
      <td className="px-3 py-3.5 w-24 text-right">
        <span className="text-xs text-muted">
          {new Date(quiz.created_at).toLocaleDateString("en-NG", {
            month: "short",
            day: "numeric",
            year: "2-digit",
          })}
        </span>
      </td>
      {/* Actions */}
      <td className="pl-3 pr-5 py-3.5 w-36">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/admin/quizzes/${quiz.id}/content`}
            className="h-8 px-2.5 rounded-xl text-[11px] font-heading font-semibold border border-border/50 text-text-soft hover:text-primary hover:bg-primary/8 hover:border-primary/30 transition-colors flex items-center gap-1"
            aria-label="View quiz content"
          >
            <Eye className="w-3.5 h-3.5" />
            Review
          </Link>
          {canUnpublish && (
            <button
              type="button"
              onClick={() => onAction("unpublish")}
              className="h-8 px-2.5 rounded-xl text-[11px] font-heading font-semibold border border-warning/40 text-warning hover:bg-warning-bg transition-colors flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3" />
              Unpublish
            </button>
          )}
          {canRepublish && (
            <button
              type="button"
              onClick={() => onAction("republish")}
              className="h-8 px-2.5 rounded-xl text-[11px] font-heading font-semibold border border-success/40 text-success hover:bg-success-bg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Republish
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function QuizMobileCard({
  quiz,
  courseName,
  creator,
  platformRevenue,
  onAction,
}: {
  quiz: DbQuiz;
  courseName: string;
  creator: DbProfile | undefined;
  platformRevenue: number;
  onAction: (action: "unpublish" | "republish") => void;
}) {
  const status = getQuizStatus(quiz);
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="inline-block text-[10px] font-heading font-semibold text-muted bg-surface border border-border/50 rounded-lg px-1.5 py-0.5">
            {courseName}
          </span>
          <Link
            to={`/admin/quizzes/${quiz.id}/content`}
            className="block font-heading font-semibold text-sm text-text hover:text-primary transition-colors leading-snug"
          >
            {quiz.title}
          </Link>
        </div>
        <QuizStatusBadge quiz={quiz} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-soft">
        {creator && (
          <Link
            to={`/profile/creator/${creator.id}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Avatar
              name={creator.full_name}
              src={creator.avatar_url ?? undefined}
              size="xs"
              enlargeable={false}
            />
            <span>{creator.full_name.split(" ").slice(0, 2).join(" ")}</span>
          </Link>
        )}
        <span>{formatNaira(quiz.price)}</span>
        <span>{(quiz.attempt_count ?? 0).toLocaleString()} attempts</span>
        {platformRevenue > 0 && (
          <span className="text-success font-heading font-semibold">
            {formatNaira(platformRevenue)} rev.
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          to={`/admin/quizzes/${quiz.id}/content`}
          className="h-8 px-3 rounded-xl text-xs font-heading font-semibold border border-border/60 text-text hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          Review
        </Link>
        {status === "published" && (
          <button
            type="button"
            onClick={() => onAction("unpublish")}
            className="h-8 px-3 rounded-xl text-xs font-heading font-semibold border border-warning/40 text-warning hover:bg-warning-bg transition-colors flex items-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5" />
            Unpublish
          </button>
        )}
        {status === "unpublished_admin" && (
          <button
            type="button"
            onClick={() => onAction("republish")}
            className="h-8 px-3 rounded-xl text-xs font-heading font-semibold border border-success/40 text-success hover:bg-success-bg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Republish
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton rows (loading state) ────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="divide-y divide-border/30 animate-pulse">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-48 rounded-lg bg-surface" />
            <div className="h-3 w-24 rounded-lg bg-surface" />
          </div>
          <div className="h-3.5 w-20 rounded-lg bg-surface hidden md:block" />
          <div className="h-3.5 w-16 rounded-lg bg-surface hidden lg:block" />
          <div className="h-5 w-24 rounded-lg bg-surface" />
          <div className="h-8 w-20 rounded-xl bg-surface" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <ScrollText className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        No quizzes match your filters
      </h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        Try adjusting your search or filter options.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminQuizzesPage() {
  const { currentUser } = useAuth();

  usePageTitle("Admin · Quizzes");

  const [toast, showToast, dismissToast] = useToast();

  // ── Filter / sort state ──────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [activeUniId, setActiveUniId] = useState<string>("");
  const [page, setPage] = useState(1);

  // ── Action state ─────────────────────────────────────────────────────────
  const [actionTarget, setActionTarget] = useState<{
    id: string;
    action: "unpublish" | "republish";
    title: string;
  } | null>(null);
  const [acting, setActing] = useState(false);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  // ── Debounce search input (300 ms) ───────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }

  // ── Support data (universities, courses for dept chips, profiles for names,
  //    wallet txns for revenue column) ──────────────────────────────────────
  const { data: allUniversities, loading: unisLoading } = useUniversities();
  const { data: allCourses, loading: coursesLoading } = useCourses();
  const { data: allProfiles, loading: profilesLoading } = useProfiles();
  const { data: allTxns, loading: txnsLoading } = useWalletTransactions();

  const universities = allUniversities || [];
  const courses = allCourses || [];
  const profiles = allProfiles || [];
  const txns = allTxns || [];

  // Set default uni once universities are loaded
  const defaultUniSet = useRef(false);
  if (!defaultUniSet.current && universities.length > 0) {
    defaultUniSet.current = true;
    setActiveUniId(universities[0].id);
  }

  // ── Server-side paginated quizzes ────────────────────────────────────────
  const {
    data: quizzesPage,
    loading: quizzesLoading,
    refetch: refetchQuizzes,
  } = useAdminQuizzes({
    page,
    pageSize: PAGE_SIZE,
    universityId: activeUniId,
    status: statusFilter,
    search: debouncedSearch,
    sort: sortKey,
    department: courseFilter,
  });

  const quizzes = quizzesPage?.quizzes || [];
  const totalQuizzes = quizzesPage?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalQuizzes / PAGE_SIZE));

  // ── Derived maps ──────────────────────────────────────────────────────────
  const coursesById = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses],
  );
  const profilesById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  // Revenue map — already scoped to platform_revenue + completed in the hook
  const revenueMap = useMemo(() => {
    const m: Record<string, number> = {};
    txns.forEach((t) => {
      if (t.related_quiz_id) {
        m[t.related_quiz_id] = (m[t.related_quiz_id] ?? 0) + Number(t.amount);
      }
    });
    return m;
  }, [txns]);

  // Department chips — derived from ALL courses (not just current page)
  const departments = useMemo(() => {
    const s = new Set<string>();
    courses.forEach((c) => {
      if (c.university_id === activeUniId && c.subject_area)
        s.add(c.subject_area);
    });
    return Array.from(s).sort();
  }, [courses, activeUniId]);

  const hasFilters =
    debouncedSearch.trim() !== "" ||
    courseFilter !== "all" ||
    statusFilter !== "all";

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleConfirmAction() {
    if (!actionTarget) return;
    setActing(true);
    if (actionTarget.action === "unpublish") {
      await adminUnpublishQuiz(actionTarget.id);
      showToast({ message: `"${actionTarget.title}" unpublished.` });
    } else {
      await adminRepublishQuiz(actionTarget.id);
      showToast({
        message: `"${actionTarget.title}" republished.`,
        variant: "success",
      });
    }
    setActing(false);
    setActionTarget(null);
    void refetchQuizzes();
  }

  const actionQuiz = actionTarget
    ? quizzes.find((q) => q.id === actionTarget.id)
    : null;

  const supportLoading =
    unisLoading || coursesLoading || profilesLoading || txnsLoading;

  if (supportLoading && !activeUniId) {
    return (
      <PageContainer className="max-w-315!">
        <AdminLoadingState label="Loading quizzes…" />
      </PageContainer>
    );
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

      <PageContainer className="max-w-315!">
        <div className="space-y-5 lg:space-y-6">
          {/* Header */}
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              All Quizzes
            </h1>
            <p className="mt-1.5 text-sm text-text-soft">
              {totalQuizzes > 0
                ? `${totalQuizzes.toLocaleString()} total quizzes.`
                : "No quizzes yet."}
            </p>
          </div>

          {/* University tabs */}
          {universities.length > 0 && (
            <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit max-w-full overflow-x-auto no-scrollbar">
              {universities.map((uni) => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => {
                    setActiveUniId(uni.id);
                    setCourseFilter("all");
                    setStatusFilter("all");
                    setSearchInput("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeUniId === uni.id
                      ? "bg-cream shadow-soft text-text"
                      : "text-text-soft hover:text-text"
                  }`}
                >
                  {uni.abbreviation}
                </button>
              ))}
            </div>
          )}

          {/* Search + sort row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by title or creator…"
                className="w-full h-11 pl-10 pr-10 rounded-2xl border border-border/60 bg-cream text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg text-muted hover:text-text hover:bg-surface/60 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Sort */}
            <FilterSelect
              value={sortKey}
              onChange={(v) => {
                setSortKey(v as SortKey);
                setPage(1);
              }}
              options={SORT_OPTIONS}
              leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Filter chips row */}
          <div className="flex gap-2.5 items-center overflow-x-auto no-scrollbar pb-0.5">
            {/* Status */}
            <div className="flex gap-1 p-0.5 rounded-xl border border-border/60 bg-cream shrink-0">
              {(["all", "published", "unpublished"] as StatusFilter[]).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className={`h-8 px-3 rounded-[10px] text-xs font-heading font-semibold transition-all duration-150 capitalize whitespace-nowrap ${
                      statusFilter === s
                        ? "bg-primary text-cream shadow-soft"
                        : "text-text-soft hover:text-text"
                    }`}
                  >
                    {s === "all"
                      ? "All Status"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ),
              )}
            </div>
            {/* Dept chips */}
            <button
              type="button"
              onClick={() => {
                setCourseFilter("all");
                setPage(1);
              }}
              className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border shrink-0 transition-all ${
                courseFilter === "all"
                  ? "bg-primary text-cream border-primary shadow-soft"
                  : "bg-cream border-border/60 text-text-soft hover:border-border"
              }`}
            >
              All Courses
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  setCourseFilter(dept);
                  setPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border shrink-0 transition-all whitespace-nowrap ${
                  courseFilter === dept
                    ? "bg-primary text-cream border-primary shadow-soft"
                    : "bg-cream border-border/60 text-text-soft hover:border-border"
                }`}
              >
                {dept}
              </button>
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setCourseFilter("all");
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl text-xs font-heading font-semibold text-muted hover:text-text border border-dashed border-border/60 hover:border-border transition-all flex items-center gap-1.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Result count */}
          <p className="text-sm text-text-soft">
            <span className="font-heading font-semibold text-text">
              {totalQuizzes.toLocaleString()}
            </span>{" "}
            {totalQuizzes === 1 ? "quiz" : "quizzes"} found
          </p>

          {/* Table (desktop) */}
          {quizzesLoading ? (
            <Card padded={false} className="overflow-hidden">
              <TableSkeleton />
            </Card>
          ) : quizzes.length === 0 ? (
            <Card padded={false}>
              <EmptyState />
            </Card>
          ) : (
            <>
              <div className="hidden lg:block">
                <Card padded={false} className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 bg-surface/30">
                          {[
                            "Quiz",
                            "Creator",
                            "Price",
                            "Status",
                            "Attempts",
                            "Platform Rev.",
                            "Created",
                            "",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-3 first:pl-5 last:pr-5 py-2.5 text-left text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-muted whitespace-nowrap last:text-right"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quizzes.map((quiz) => {
                          const course = coursesById.get(quiz.course_id);
                          const creator = profilesById.get(quiz.creator_id);
                          return (
                            <QuizTableRow
                              key={quiz.id}
                              quiz={quiz}
                              courseName={course?.code ?? "—"}
                              creator={creator}
                              platformRevenue={revenueMap[quiz.id] ?? 0}
                              onAction={(action) =>
                                setActionTarget({
                                  id: quiz.id,
                                  action,
                                  title: quiz.title,
                                })
                              }
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Cards (mobile) */}
              <div className="lg:hidden">
                <Card padded={false} className="overflow-hidden">
                  {quizzes.map((quiz) => {
                    const course = coursesById.get(quiz.course_id);
                    const creator = profilesById.get(quiz.creator_id);
                    return (
                      <QuizMobileCard
                        key={quiz.id}
                        quiz={quiz}
                        courseName={course?.code ?? "—"}
                        creator={creator}
                        platformRevenue={revenueMap[quiz.id] ?? 0}
                        onAction={(action) =>
                          setActionTarget({
                            id: quiz.id,
                            action,
                            title: quiz.title,
                          })
                        }
                      />
                    );
                  })}
                </Card>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalQuizzes > 0 && (
            <div className="flex items-center justify-between gap-3 text-xs text-muted">
              <p>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalQuizzes)} of{" "}
                {totalQuizzes.toLocaleString()} quizzes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageContainer>

      {actionTarget && actionQuiz && (
        <ConfirmModal
          quiz={actionQuiz}
          action={actionTarget.action}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionTarget(null)}
          loading={acting}
        />
      )}
    </>
  );
}
