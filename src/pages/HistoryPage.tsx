import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Clock,
  Search,
  Timer,
  TimerOff,
  ChevronRight,
  Compass,
  X,
  Filter,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FilterSelect } from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import type { Quiz, Course, QuizAttempt } from "../types";
import {
  fetchUserAttempts,
  fetchAllQuizzes,
  fetchCourses,
} from "../lib/queries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Coloured score pill + bar identical to QuizCard's ScoreStrip */
function ScoreStrip({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-success" : score >= 60 ? "bg-primary" : "bg-warning";
  const pillClass =
    score >= 80
      ? "bg-success-bg text-success border-success/20"
      : score >= 60
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-warning-bg text-warning border-warning/20";
  return (
    <div className="flex items-center gap-2.5 w-full sm:w-48 shrink-0">
      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full rounded-full ${tone} transition-all`}
          style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
        />
      </div>
      <span
        className={`shrink-0 inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[11px] font-heading font-semibold ${pillClass}`}
      >
        {score}%
      </span>
    </div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────

type SortKey = "newest" | "oldest" | "highest" | "lowest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest score" },
  { value: "lowest", label: "Lowest score" },
];

function sortAttempts(list: QuizAttempt[], key: SortKey): QuizAttempt[] {
  return [...list].sort((a, b) => {
    if (key === "newest")
      return (
        new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );
    if (key === "oldest")
      return (
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );
    if (key === "highest") return b.score - a.score;
    if (key === "lowest") return a.score - b.score;
    return 0;
  });
}

// ─── Attempt row card ─────────────────────────────────────────────────────────

interface AttemptRowProps {
  attempt: QuizAttempt;
  quizTitle: string;
  course: Course | undefined;
}

function AttemptRow({ attempt, quizTitle, course }: AttemptRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 border-b border-border/40 last:border-b-0">
      {/* Left: title + meta */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {course && (
            <Badge variant="secondary" size="sm">
              {course.code}
            </Badge>
          )}
          {attempt.is_timed ? (
            <Badge variant="muted" size="sm">
              <Timer className="w-3 h-3" /> Timed
            </Badge>
          ) : (
            <Badge variant="muted" size="sm">
              <TimerOff className="w-3 h-3" /> Untimed
            </Badge>
          )}
        </div>
        <p className="font-heading font-semibold text-sm text-text leading-snug line-clamp-2">
          {quizTitle}
        </p>
        <p className="text-xs text-muted">{formatDate(attempt.completed_at)}</p>
      </div>

      {/* Middle: score bar */}
      <ScoreStrip score={attempt.score} />

      {/* Right: CTA */}
      <Link
        to={`/attempt/${attempt.id}/result`}
        state={{ from: "/history" }}
        className="shrink-0 self-start sm:self-auto"
      >
        <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
          View Result
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Chip filter list ─────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center h-9 px-3.5 rounded-2xl border text-xs font-heading font-semibold transition-all duration-150 whitespace-nowrap ${
        active
          ? "bg-primary text-cream border-primary shadow-soft"
          : "bg-cream text-text-soft border-border/60 hover:border-border hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <Card className="bg-surface/30 border-border/40">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 py-4">
        <div className="h-14 w-14 shrink-0 rounded-3xl bg-cream text-secondary shadow-card ring-1 ring-border/50 flex items-center justify-center">
          <Clock className="w-7 h-7" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-lg text-text leading-tight">
            {filtered ? "No matching attempts" : "No attempts yet"}
          </h3>
          <p className="mt-1 text-sm text-text-soft leading-relaxed max-w-lg">
            {filtered
              ? "Try adjusting your filters or search query."
              : "You haven't attempted any quizzes yet. Browse the marketplace to find one that fits your prep goals."}
          </p>
        </div>
        {!filtered && (
          <Link to="/browse" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth>
              <Compass className="w-4 h-4" />
              Browse Quizzes
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-5">
      <Card padded={false}>
        <div className="px-5 py-4 space-y-3 animate-pulse">
          <div className="h-11 w-full rounded-2xl bg-surface" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-20 rounded-2xl bg-surface" />
            ))}
          </div>
        </div>
      </Card>
      <Card padded={false} className="animate-pulse">
        <div className="px-5 divide-y divide-border/0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
            >
              <div className="flex-1 w-full space-y-2">
                <div className="h-4 w-3/4 rounded-lg bg-surface" />
                <div className="h-3 w-1/2 rounded-lg bg-surface" />
              </div>
              <div className="h-2 w-full sm:w-48 rounded-full bg-surface shrink-0" />
              <div className="h-9 w-24 rounded-xl bg-surface shrink-0 self-start sm:self-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { currentUser } = useAuth();

  usePageTitle("History");

  const [loading, setLoading] = useState(true);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchUserAttempts(currentUser.id),
      fetchAllQuizzes(),
      fetchCourses(),
    ]).then(([attempts, quizzes, courses]) => {
      if (cancelled) return;
      setAllAttempts(attempts);
      setAllQuizzes(quizzes);
      setAllCourses(courses);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  // Build lookup maps
  const quizzesById = useMemo(
    () => new Map(allQuizzes.map((q) => [q.id, q])),
    [allQuizzes],
  );
  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [allCourses],
  );

  // All attempts for the current user (already filtered server-side, but keep guard)
  const myAttempts = useMemo(
    () => allAttempts.filter((a) => a.user_id === currentUser.id),
    [allAttempts, currentUser.id],
  );

  // Courses the user has actually attempted quizzes in (for filter chips)
  const attemptedCourses = useMemo<Course[]>(() => {
    const ids = new Set<string>();
    for (const a of myAttempts) {
      const cid = quizzesById.get(a.quiz_id)?.course_id;
      if (cid) ids.add(cid);
    }
    return [...ids]
      .map((id) => coursesById.get(id))
      .filter((c): c is Course => !!c);
  }, [myAttempts, quizzesById, coursesById]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = myAttempts;

    if (courseFilter !== "all") {
      list = list.filter(
        (a) => quizzesById.get(a.quiz_id)?.course_id === courseFilter,
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        (quizzesById.get(a.quiz_id)?.title ?? "").toLowerCase().includes(q),
      );
    }

    return sortAttempts(list, sortKey);
  }, [myAttempts, courseFilter, search, sortKey, quizzesById]);

  // Group by calendar month
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; attempts: QuizAttempt[] }>();
    for (const a of filtered) {
      const key = monthKey(a.completed_at);
      if (!map.has(key)) {
        map.set(key, { label: monthLabel(a.completed_at), attempts: [] });
      }
      map.get(key)!.attempts.push(a);
    }
    const entries = [...map.entries()];
    if (sortKey === "oldest") {
      entries.sort(([a], [b]) => a.localeCompare(b));
    } else if (sortKey === "newest") {
      entries.sort(([a], [b]) => b.localeCompare(a));
    }
    return entries;
  }, [filtered, sortKey]);

  const isFiltered = courseFilter !== "all" || search.trim() !== "";

  return (
    <PageContainer
      title="Attempt History"
      subtitle={
        myAttempts.length
          ? `${myAttempts.length} total attempt${myAttempts.length !== 1 ? "s" : ""} — filtered to ${filtered.length}`
          : undefined
      }
    >
      <div className="space-y-5">
        {loading ? (
          <HistorySkeleton />
        ) : (
          <>
            {/* ── Toolbar ── */}
            <Card padded={false}>
              <div className="px-4 pt-4 pb-3 space-y-3">
                {/* Search + Sort row */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="search"
                      placeholder="Search by quiz title…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-11 pl-10 pr-10 rounded-2xl border border-border bg-cream text-sm text-text placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <FilterSelect
                    value={sortKey}
                    onChange={(v) => setSortKey(v as SortKey)}
                    options={SORT_OPTIONS}
                    leadingIcon={<Filter className="w-4 h-4" />}
                  />
                </div>

                {/* Course chips */}
                {attemptedCourses.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mb-1">
                    <Chip
                      label="All courses"
                      active={courseFilter === "all"}
                      onClick={() => setCourseFilter("all")}
                    />
                    {attemptedCourses.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.code}
                        active={courseFilter === c.id}
                        onClick={() =>
                          setCourseFilter((prev) =>
                            prev === c.id ? "all" : c.id,
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* ── Results ── */}
            {filtered.length === 0 ? (
              <EmptyState filtered={isFiltered} />
            ) : (
              <div className="space-y-5">
                {grouped.map(([key, { label, attempts }]) => (
                  <section key={key}>
                    {/* Sticky month header */}
                    <div className="sticky top-14 lg:top-0 z-10 flex items-center gap-3 py-2 bg-background/90 backdrop-blur-sm border-b border-border/50 mb-0">
                      <h2 className="font-heading font-bold text-sm text-text-soft uppercase tracking-wider">
                        {label}
                      </h2>
                      <span className="ml-auto font-heading text-xs text-muted font-medium">
                        {attempts.length} attempt
                        {attempts.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <Card padded={false} className="overflow-hidden">
                      <div className="px-5 divide-y divide-border/0">
                        {attempts.map((attempt) => {
                          const quiz = quizzesById.get(attempt.quiz_id);
                          const course = quiz
                            ? coursesById.get(quiz.course_id)
                            : undefined;
                          return (
                            <AttemptRow
                              key={attempt.id}
                              attempt={attempt}
                              quizTitle={quiz?.title ?? "Unknown Quiz"}
                              course={course}
                            />
                          );
                        })}
                      </div>
                    </Card>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
