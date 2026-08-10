import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, Navigate } from "react-router-dom";
import {
  Plus,
  Search,
  X,
  Edit2,
  BarChart3,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
  AlertCircle,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { supabase, type DbQuiz, type DbCourse } from "../lib/supabase";
import { formatNaira } from "./CreatorDashboardPage";
import { Toast, useToast } from "../components/Toast";
import {
  handleShareOrCopy,
  ShareActionsMenu,
} from "../components/ShareActions";

type SortKey = "newest" | "attempts" | "revenue" | "price";
type StatusFilter = "all" | "published" | "draft";

interface MutableQuiz extends DbQuiz {}

function creatorRevenue(q: DbQuiz) {
  return Math.round(Number(q.attempt_count || 0) * Number(q.price) * 0.65);
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function publicQuizUrl(quizId: string) {
  const path = `/quiz/${quizId}`;
  if (typeof window !== "undefined" && window.location?.origin)
    return window.location.origin + path;
  return path;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "attempts", label: "Most Attempts" },
  { value: "revenue", label: "Highest Revenue" },
  { value: "price", label: "Price" },
];

export function CreatorQuizzesPage() {
  const { currentUser } = useAuth();
  const creatorId = currentUser.id;
  const [toast, showToast, dismissToast] = useToast();

  const [quizList, setQuizList] = useState<MutableQuiz[]>([]);
  const [allCourses, setAllCourses] = useState<DbCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const [confirmQuiz, setConfirmQuiz] = useState<MutableQuiz | null>(null);

  useEffect(() => {
    if (!currentUser.is_approved_creator) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [qRes, cRes] = await Promise.all([
        supabase
          .from("quizzes")
          .select("*")
          .eq("creator_id", creatorId)
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("*").order("name", { ascending: true }),
      ]);
      if (cancelled) return;
      setQuizList(qRes.data ?? []);
      setAllCourses(cRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [creatorId, currentUser.is_approved_creator]);

  const creatorCourseIds = useMemo(
    () => [...new Set(quizList.map((q) => q.course_id))],
    [quizList],
  );
  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [allCourses],
  );
  const creatorCourses = useMemo(
    () => allCourses.filter((c) => creatorCourseIds.includes(c.id)),
    [allCourses, creatorCourseIds],
  );

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = quizList.slice();

    if (q) list = list.filter((quiz) => quiz.title.toLowerCase().includes(q));
    if (statusFilter === "published")
      list = list.filter((quiz) => quiz.is_published);
    if (statusFilter === "draft")
      list = list.filter((quiz) => !quiz.is_published);
    if (courseFilter !== "all")
      list = list.filter((quiz) => quiz.course_id === courseFilter);

    list.sort((a, b) => {
      if (sortKey === "newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortKey === "attempts")
        return Number(b.attempt_count || 0) - Number(a.attempt_count || 0);
      if (sortKey === "revenue") return creatorRevenue(b) - creatorRevenue(a);
      if (sortKey === "price")
        return Number(b.price) - Number(a.price);
      return 0;
    });
    return list;
  }, [quizList, search, statusFilter, courseFilter, sortKey]);

  const publishedCount = quizList.filter((q) => q.is_published).length;

  function handleTogglePublish(quiz: MutableQuiz) {
    setConfirmQuiz(quiz);
  }

  async function confirmToggle() {
    if (!confirmQuiz) return;
    const newState = !confirmQuiz.is_published;
    const { error } = await supabase
      .from("quizzes")
      .update({ is_published: newState })
      .eq("id", confirmQuiz.id);
    if (!error) {
      setQuizList((prev) =>
        prev.map((q) =>
          q.id === confirmQuiz.id ? { ...q, is_published: newState } : q,
        ),
      );
      showToast({
        message: newState
          ? `Quiz "${confirmQuiz.title}" is now live.`
          : `Quiz "${confirmQuiz.title}" has been unpublished.`,
        variant: "success",
      });
    } else {
      showToast({
        message: "Failed to update quiz status. Please try again.",
        variant: "error",
      });
    }
    setConfirmQuiz(null);
  }

  if (!currentUser.is_approved_creator) {
    return <Navigate to="/creator/apply" replace />;
  }

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || courseFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("all");
  }

  return (
    <>
      <PageContainer className="!max-w-[1200px]">
        <div className="space-y-6 lg:space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" size="sm" dot>
                  <Sparkles className="w-3 h-3" />
                  Creator mode
                </Badge>
              </div>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                My Quizzes
              </h1>
              <p className="mt-1 text-sm text-text-soft">
                {quizList.length} {quizList.length === 1 ? "quiz" : "quizzes"},{" "}
                {publishedCount} published
              </p>
            </div>
            <div className="hidden sm:block shrink-0">
              <Link to="/creator/quizzes/new">
                <Button variant="primary" size="md">
                  <Plus className="w-4 h-4" />
                  Create new quiz
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2.5">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search quizzes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 rounded-2xl bg-cream border border-border/60 text-sm font-heading text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-muted/20 text-muted hover:bg-muted/30 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative shrink-0" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className={`h-11 px-3.5 rounded-2xl border text-sm font-heading font-medium flex items-center gap-2 transition-colors ${
                    sortOpen
                      ? "bg-primary text-cream border-primary"
                      : "bg-cream border-border/60 text-text hover:border-primary/40"
                  }`}
                >
                  <span className="hidden sm:inline">
                    {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
                  </span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      sortOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 rounded-2xl bg-cream border border-border/60 shadow-elevated overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortKey(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-heading font-medium transition-colors ${
                          sortKey === opt.value
                            ? "bg-primary/10 text-primary"
                            : "text-text hover:bg-surface/60"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "published", "draft"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`h-8 px-3 rounded-xl text-[12px] font-heading font-semibold transition-all duration-150 border ${
                    statusFilter === s
                      ? s === "published"
                        ? "bg-success/15 text-success border-success/30"
                        : s === "draft"
                          ? "bg-warning/15 text-warning border-warning/30"
                          : "bg-primary/12 text-primary border-primary/25"
                      : "bg-cream border-border/50 text-text-soft hover:border-primary/30 hover:text-text"
                  }`}
                >
                  {s === "all"
                    ? "All"
                    : s === "published"
                      ? "Published"
                      : "Drafts"}
                </button>
              ))}

              <span className="h-5 w-px bg-border/50 mx-0.5" />

              <button
                onClick={() => setCourseFilter("all")}
                className={`h-8 px-3 rounded-xl text-[12px] font-heading font-semibold transition-all duration-150 border ${
                  courseFilter === "all"
                    ? "bg-secondary/12 text-secondary border-secondary/25"
                    : "bg-cream border-border/50 text-text-soft hover:border-secondary/30 hover:text-text"
                }`}
              >
                All courses
              </button>
              {creatorCourses.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setCourseFilter(courseFilter === c.id ? "all" : c.id)
                  }
                  className={`h-8 px-3 rounded-xl text-[12px] font-heading font-semibold transition-all duration-150 border ${
                    courseFilter === c.id
                      ? "bg-secondary/12 text-secondary border-secondary/25"
                      : "bg-cream border-border/50 text-text-soft hover:border-secondary/30 hover:text-text"
                  }`}
                >
                  {c.code}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-8 px-3 rounded-xl text-[12px] font-heading font-semibold text-danger border border-danger/30 bg-danger-bg/40 hover:bg-danger-bg transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <Card padded={false} className="overflow-hidden">
              <div className="divide-y divide-border/40">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 px-5 py-3.5 bg-surface/30 animate-pulse"
                  />
                ))}
              </div>
            </Card>
          ) : quizList.length === 0 ? (
            <Card padded className="py-12 lg:py-16">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center mb-5 shadow-card">
                  <FileText className="w-10 h-10" strokeWidth={1.8} />
                </div>
                <h2 className="font-heading font-bold text-xl text-text">
                  You haven't created any quizzes yet
                </h2>
                <p className="mt-2 text-sm text-text-soft max-w-sm leading-relaxed">
                  Your quizzes will appear here once you create them. Start with
                  your first quiz and it'll be live for students in minutes.
                </p>
                <Link to="/creator/quizzes/new" className="mt-6">
                  <Button variant="primary" size="lg">
                    <Plus className="w-4 h-4" />
                    Create your first quiz
                  </Button>
                </Link>
              </div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card padded className="py-10">
              <div className="flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-surface/80 text-muted flex items-center justify-center mb-4 shadow-card ring-1 ring-border/50">
                  <Search className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text">
                  No quizzes match
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
                  Try adjusting your search or filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-2xl bg-surface/80 border border-border/50 text-sm font-heading font-medium text-text hover:bg-surface transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </button>
              </div>
            </Card>
          ) : (
            <>
              <div className="hidden lg:block">
                <Card padded={false} className="overflow-hidden">
                  <QuizTable
                    quizzes={filtered}
                    coursesById={coursesById}
                    onTogglePublish={handleTogglePublish}
                    onShowToast={showToast}
                  />
                </Card>
              </div>

              <div className="lg:hidden space-y-3">
                {filtered.map((quiz) => (
                  <QuizMobileCard
                    key={quiz.id}
                    quiz={quiz}
                    course={coursesById.get(quiz.course_id)?.code}
                    shareUrl={publicQuizUrl(quiz.id)}
                    shareTitle={`${
                      coursesById.get(quiz.course_id)?.code ?? "Quiz"
                    } · ${quiz.title}`}
                    onTogglePublish={handleTogglePublish}
                    showToast={showToast}
                  />
                ))}
              </div>
            </>
          )}

          <div className="sm:hidden">
            <Link to="/creator/quizzes/new">
              <Button variant="primary" size="lg" fullWidth>
                <Plus className="w-4 h-4" />
                Create new quiz
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>

      {toast && <Toast toast={toast} onClose={dismissToast} />}

      {confirmQuiz && (
        <PublishConfirmDialog
          quiz={confirmQuiz}
          onConfirm={confirmToggle}
          onCancel={() => setConfirmQuiz(null)}
        />
      )}
    </>
  );
}

function QuizTable({
  quizzes,
  coursesById,
  onTogglePublish,
  onShowToast,
}: {
  quizzes: MutableQuiz[];
  coursesById: Map<string, DbCourse>;
  onTogglePublish: (q: MutableQuiz) => void;
  onShowToast: (t: {
    message: string;
    variant?: "success" | "info" | "error" | "warning";
  }) => void;
}) {
  const COL_HDR =
    "px-4 py-3 text-left text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-muted whitespace-nowrap";

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border/50 bg-surface/30">
          <th className={`${COL_HDR} pl-5 min-w-[260px]`}>Quiz</th>
          <th className={`${COL_HDR} w-24`}>Price</th>
          <th className={`${COL_HDR} w-28`}>Status</th>
          <th className={`${COL_HDR} w-24 text-right`}>Attempts</th>
          <th className={`${COL_HDR} w-32 text-right`}>Your earnings</th>
          <th className={`${COL_HDR} w-28`}>Created</th>
          <th className={`${COL_HDR} w-36 pr-5 text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/40">
        {quizzes.map((quiz) => (
          <QuizTableRow
            key={quiz.id}
            quiz={quiz}
            courseCode={coursesById.get(quiz.course_id)?.code}
            shareUrl={publicQuizUrl(quiz.id)}
            shareTitle={`${
              coursesById.get(quiz.course_id)?.code ?? "Quiz"
            } · ${quiz.title}`}
            onTogglePublish={onTogglePublish}
            showToast={onShowToast}
          />
        ))}
      </tbody>
    </table>
  );
}

function QuizTableRow({
  quiz,
  courseCode,
  shareUrl,
  shareTitle,
  onTogglePublish,
  showToast,
}: {
  quiz: MutableQuiz;
  courseCode?: string;
  shareUrl: string;
  shareTitle: string;
  onTogglePublish: (q: MutableQuiz) => void;
  showToast: (t: {
    message: string;
    variant?: "success" | "info" | "error" | "warning";
  }) => void;
}) {
  return (
    <tr className="hover:bg-surface/20 transition-colors group">
      <td className="pl-5 pr-3 py-3.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
              quiz.is_published ? "bg-success" : "bg-muted/50"
            }`}
          />
          <div className="min-w-0">
            <p className="font-heading font-semibold text-[14px] text-text leading-snug line-clamp-2">
              {quiz.title}
            </p>
            {courseCode && (
              <p className="mt-0.5 text-[12px] text-muted font-medium">
                {courseCode} · {quiz.question_count ?? 0}q
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <span className="font-heading font-semibold text-[13px] text-text">
          {formatNaira(Number(quiz.price))}
        </span>
      </td>

      <td className="px-4 py-3.5">
        <Badge
          variant={quiz.is_published ? "success" : "warning"}
          size="sm"
          dot
        >
          {quiz.is_published ? "Published" : "Draft"}
        </Badge>
      </td>

      <td className="px-4 py-3.5 text-right">
        <span className="font-heading font-semibold text-[13px] text-text">
          {Number(quiz.attempt_count || 0).toLocaleString("en-NG")}
        </span>
      </td>

      <td className="px-4 py-3.5 text-right">
        <span className="font-heading font-bold text-[13px] text-success">
          {formatNaira(creatorRevenue(quiz))}
        </span>
        <p className="text-[10px] text-muted font-medium">65% share</p>
      </td>

      <td className="px-4 py-3.5">
        <span className="text-[12px] text-text-soft font-medium">
          {formatShortDate(quiz.created_at)}
        </span>
      </td>

      <td className="pl-2 pr-5 py-3.5">
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/creator/quizzes/${quiz.id}/edit`}>
            <button className="h-8 px-3 rounded-xl text-[12px] font-heading font-semibold bg-surface/60 border border-border/50 text-text hover:bg-surface hover:border-primary/30 hover:text-primary transition-all flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </Link>
          <Link to={`/creator/quizzes/${quiz.id}/analytics`}>
            <button className="h-8 px-3 rounded-xl text-[12px] font-heading font-semibold bg-surface/60 border border-border/50 text-text hover:bg-surface hover:border-secondary/30 hover:text-secondary transition-all flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </Link>
          <QuizRowMenu
            quiz={quiz}
            shareUrl={shareUrl}
            shareTitle={shareTitle}
            onTogglePublish={onTogglePublish}
            showToast={showToast}
          />
        </div>
      </td>
    </tr>
  );
}

function QuizRowMenu({
  quiz,
  shareUrl,
  shareTitle,
  onTogglePublish,
  showToast,
}: {
  quiz: MutableQuiz;
  shareUrl: string;
  shareTitle: string;
  onTogglePublish: (q: MutableQuiz) => void;
  showToast: (t: {
    message: string;
    variant?: "success" | "info" | "error" | "warning";
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 9999,
            }}
            className="min-w-52 rounded-2xl bg-cream shadow-elevated ring-1 ring-border/40 p-1.5 animate-in fade-in zoom-in-95 duration-120"
          >
            {canShare && (
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  await handleShareOrCopy(shareUrl, {
                    title: shareTitle,
                    showToast,
                    preferred: "share",
                  });
                }}
                className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
              >
                <Share2
                  className="w-4 h-4 text-secondary shrink-0"
                  strokeWidth={2}
                />
                Share via…
                <span className="ml-auto text-[10px] font-heading font-bold uppercase tracking-wider text-muted">
                  Mobile
                </span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                const res = await handleShareOrCopy(shareUrl, {
                  title: shareTitle,
                  showToast,
                  preferred: "copy",
                });
                if (res === "copied") {
                  setJustCopied(true);
                  window.setTimeout(() => setJustCopied(false), 1500);
                }
                window.setTimeout(() => setOpen(false), 250);
              }}
              className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
            >
              {justCopied ? (
                <Check
                  className="w-4 h-4 text-success shrink-0"
                  strokeWidth={2.4}
                />
              ) : (
                <Copy
                  className="w-4 h-4 text-primary shrink-0"
                  strokeWidth={2}
                />
              )}
              {justCopied ? "Copied!" : "Copy link"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                window.open(shareUrl, "_blank", "noopener,noreferrer");
              }}
              className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
            >
              <ExternalLink
                className="w-4 h-4 text-muted shrink-0"
                strokeWidth={2}
              />
              Preview public page
            </button>

            <div className="h-px my-1 bg-border/40 -mx-1" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onTogglePublish(quiz);
              }}
              className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 hover:bg-surface/70 active:scale-[0.99] transition-all"
            >
              {quiz.is_published ? (
                <>
                  <EyeOff
                    className="w-4 h-4 text-warning shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-warning">Unpublish</span>
                </>
              ) : (
                <>
                  <Eye
                    className="w-4 h-4 text-success shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-success">Publish</span>
                </>
              )}
            </button>

            <div className="h-px my-1 bg-border/40 -mx-1" />

            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="w-full h-9 px-3 rounded-xl text-[12px] font-heading font-medium flex items-center gap-2 text-muted hover:bg-surface/50 active:scale-[0.99] transition-all"
            >
              <X className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              Dismiss
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all ${
          open
            ? "bg-surface border-border text-text"
            : "bg-surface/60 border-border/50 text-muted hover:bg-surface hover:text-text"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={2.2} />
      </button>
      {menu}
    </>
  );
}

function QuizMobileCard({
  quiz,
  course,
  shareUrl,
  shareTitle,
  onTogglePublish,
  showToast,
}: {
  quiz: MutableQuiz;
  course?: string;
  shareUrl: string;
  shareTitle: string;
  onTogglePublish: (q: MutableQuiz) => void;
  showToast: (t: {
    message: string;
    variant?: "success" | "info" | "error" | "warning";
  }) => void;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={quiz.is_published ? "success" : "warning"}
              size="sm"
              dot
            >
              {quiz.is_published ? "Published" : "Draft"}
            </Badge>
            {course && (
              <Badge variant="muted" size="sm">
                {course}
              </Badge>
            )}
          </div>
          <span className="font-heading font-bold text-[14px] text-text shrink-0">
            {formatNaira(Number(quiz.price))}
          </span>
        </div>

        <h3 className="font-heading font-semibold text-[15px] text-text leading-snug mb-1">
          {quiz.title}
        </h3>
        <p className="text-xs text-muted mb-3">
          {quiz.question_count ?? 0} questions · Created{" "}
          {formatShortDate(quiz.created_at)}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3.5">
          <div className="rounded-xl bg-surface/50 border border-border/40 px-3 py-2">
            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted mb-0.5">
              Attempts
            </p>
            <p className="font-heading font-bold text-[15px] text-text leading-none">
              {Number(quiz.attempt_count || 0).toLocaleString("en-NG")}
            </p>
          </div>
          <div className="rounded-xl bg-surface/50 border border-border/40 px-3 py-2">
            <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted mb-0.5">
              Your earnings
            </p>
            <p className="font-heading font-bold text-[15px] text-success leading-none">
              {formatNaira(creatorRevenue(quiz))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/creator/quizzes/${quiz.id}/edit`} className="flex-1">
            <button className="w-full h-9 rounded-xl text-[12px] font-heading font-semibold bg-surface/60 border border-border/50 text-text hover:bg-surface transition-colors flex items-center justify-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          </Link>
          <Link to={`/creator/quizzes/${quiz.id}/analytics`} className="flex-1">
            <button className="w-full h-9 rounded-xl text-[12px] font-heading font-semibold bg-surface/60 border border-border/50 text-text hover:bg-surface transition-colors flex items-center justify-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </Link>
          <button
            onClick={() => onTogglePublish(quiz)}
            className={`h-9 px-3 rounded-xl text-[12px] font-heading font-semibold border transition-colors flex items-center gap-1.5 ${
              quiz.is_published
                ? "bg-warning/10 border-warning/30 text-warning hover:bg-warning/15"
                : "bg-success/10 border-success/30 text-success hover:bg-success/15"
            }`}
          >
            {quiz.is_published ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Unpublish
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Publish
              </>
            )}
          </button>
          <ShareActionsMenu
            url={shareUrl}
            title={shareTitle}
            showToast={showToast}
            label={`Share ${quiz.title}`}
          />
        </div>
      </div>
    </Card>
  );
}

function PublishConfirmDialog({
  quiz,
  onConfirm,
  onCancel,
}: {
  quiz: MutableQuiz;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isPublished = quiz.is_published;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative z-10 w-full sm:max-w-md bg-cream rounded-3xl shadow-elevated p-6 sm:p-7">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${
            isPublished
              ? "bg-warning/12 text-warning"
              : "bg-success/12 text-success"
          }`}
        >
          {isPublished ? (
            <EyeOff className="w-6 h-6" strokeWidth={2} />
          ) : (
            <Eye className="w-6 h-6" strokeWidth={2} />
          )}
        </div>

        <h2 className="font-heading font-bold text-lg text-text leading-tight mb-2">
          {isPublished ? "Unpublish this quiz?" : "Publish this quiz?"}
        </h2>

        <p className="text-sm text-text-soft leading-relaxed mb-1.5">
          {isPublished ? (
            <>
              <span className="font-semibold text-text">{quiz.title}</span> will
              be hidden from Browse and won't be available to new buyers.
            </>
          ) : (
            <>
              <span className="font-semibold text-text">{quiz.title}</span> will
              go live in the marketplace and be available for students to
              purchase.
            </>
          )}
        </p>

        {isPublished && (
          <div className="flex items-start gap-2.5 mt-3 mb-1 p-3 rounded-2xl bg-primary/8 border border-primary/15">
            <AlertCircle
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[12px] text-text leading-relaxed">
              Existing owners keep full access — unpublishing only prevents new
              purchases.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-2xl border border-border/60 bg-surface/40 text-sm font-heading font-semibold text-text hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-2xl text-sm font-heading font-semibold text-cream shadow-soft transition-all active:scale-[0.98] ${
              isPublished
                ? "bg-warning hover:bg-warning/90"
                : "bg-success hover:bg-success/90"
            }`}
          >
            {isPublished ? "Yes, unpublish" : "Yes, publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
