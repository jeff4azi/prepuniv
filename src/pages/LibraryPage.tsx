import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Library,
  Search,
  X,
  SlidersHorizontal,
  PlayCircle,
  RotateCcw,
  Compass,
  Trophy,
  Sparkles,
  BookOpen,
  Target,
  Clock,
  FileQuestion,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { FilterSelect } from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import type { Quiz, Course, Profile, QuizAttempt } from "../mock/types";
import {
  fetchPublishedQuizzes,
  fetchCourses,
  fetchAllProfiles,
  fetchUserAttempts,
} from "../lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "unlocked" | "alpha" | "best-score" | "not-attempted";
type AttemptFilter = "all" | "attempted" | "not-attempted";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "unlocked", label: "Recently Unlocked" },
  { value: "alpha", label: "A → Z" },
  { value: "best-score", label: "Best Score" },
  { value: "not-attempted", label: "Not Yet Attempted First" },
];

// ─── Per-quiz attempt stats ───────────────────────────────────────────────────

interface AttemptStats {
  count: number;
  bestScore: number | null;
  lastAttemptId: string | null;
}

function computeAttemptStats(
  quizId: string,
  userId: string,
  attempts: QuizAttempt[],
): AttemptStats {
  const mine = attempts.filter(
    (a) => a.quiz_id === quizId && a.user_id === userId,
  );
  if (mine.length === 0)
    return { count: 0, bestScore: null, lastAttemptId: null };
  const best = Math.max(...mine.map((a) => a.score));
  const last = [...mine].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  )[0];
  return { count: mine.length, bestScore: best, lastAttemptId: last.id };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fakeAttemptId() {
  return "atmp_" + Math.random().toString(36).slice(2, 10);
}

function shortCourseName(code: string) {
  return code || "Quiz";
}

// ─── Score pill ───────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const cls =
    score >= 80
      ? "bg-success-bg text-success border-success/20"
      : score >= 60
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-warning-bg text-warning border-warning/20";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-[11px] font-heading font-semibold ${cls}`}
    >
      {score}%
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tone =
    score >= 80 ? "bg-success" : score >= 60 ? "bg-primary" : "bg-warning";
  return (
    <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
      />
    </div>
  );
}

// ─── Library card ─────────────────────────────────────────────────────────────

interface LibraryCardProps {
  quiz: Quiz;
  course: Course | undefined;
  creator: Profile | undefined;
  stats: AttemptStats;
}

function LibraryCard({ quiz, course, creator, stats }: LibraryCardProps) {
  const navigate = useNavigate();
  const attempted = stats.count > 0;

  function handleStartAttempt() {
    const id = fakeAttemptId();
    navigate(`/attempt/${id}`, {
      state: { quizId: quiz.id, isTimed: true },
    });
  }

  return (
    <Card
      hover
      padded={false}
      className="group relative overflow-hidden bg-cream flex flex-col"
    >
      {/* Body */}
      <div className="relative px-5 pt-5 pb-4 flex flex-col gap-3.5 flex-1">
        {/* Course + attempt status badge row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Badge variant="secondary" size="sm">
              <Target className="w-3 h-3" />
              {course ? shortCourseName(course.code) : "Quiz"}
            </Badge>
            <h3 className="font-heading font-semibold text-text text-[15px] leading-snug line-clamp-2">
              {quiz.title}
            </h3>
          </div>

          {/* Attempt status badge */}
          <div className="shrink-0 translate-y-0.5">
            {attempted ? (
              <Badge variant="success" size="md" dot>
                <Trophy className="w-3 h-3" />
                Attempted
              </Badge>
            ) : (
              <Badge variant="muted" size="md">
                <Sparkles className="w-3 h-3" />
                Not started
              </Badge>
            )}
          </div>
        </div>

        {/* Questions meta */}
        <div className="flex items-center gap-2 text-xs text-text-soft">
          <FileQuestion className="w-4 h-4 text-muted shrink-0" />
          <span>{quiz.question_count.toLocaleString()} questions</span>
        </div>

        {/* Attempt stats or "not started yet" hint */}
        {attempted && stats.bestScore !== null ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <ScoreBar score={stats.bestScore} />
              <ScorePill score={stats.bestScore} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Best:{" "}
                <span className="font-semibold text-text ml-0.5">
                  {stats.bestScore}%
                </span>
              </span>
              <span className="h-3 w-px bg-border/60" />
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {stats.count} attempt{stats.count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/50 border border-border/40">
            <BookOpen className="w-4 h-4 text-muted shrink-0" />
            <p className="text-xs text-text-soft leading-snug">
              You own this quiz — start whenever you're ready, no time pressure.
            </p>
          </div>
        )}

        {/* Creator row */}
        <div className="flex items-center justify-between pt-0.5">
          {creator ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={creator.full_name} size="xs" />
              <span className="text-[12px] text-text-soft truncate max-w-35">
                by {creator.full_name.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-muted">Verified creator</span>
          )}
          <Link
            to={`/quiz/${quiz.id}`}
            state={{ from: "/library" }}
            className="text-[11px] font-heading font-medium text-muted hover:text-primary transition-colors"
          >
            Details →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-1">
        {attempted ? (
          <Button
            fullWidth
            variant="primary"
            size="md"
            className="h-11"
            onClick={handleStartAttempt}
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </Button>
        ) : (
          <Button
            fullWidth
            variant="primary"
            size="md"
            className="h-11"
            onClick={handleStartAttempt}
          >
            <PlayCircle className="w-4 h-4" />
            Start Attempt
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function LibraryCardSkeleton() {
  return (
    <Card padded={false} className="bg-cream overflow-hidden">
      <div className="px-5 pt-5 pb-4 space-y-4 animate-pulse">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-20 rounded-lg bg-surface" />
            <div className="h-4 w-full rounded-lg bg-surface" />
            <div className="h-4 w-3/4 rounded-lg bg-surface" />
          </div>
          <div className="h-6 w-20 rounded-xl bg-surface shrink-0" />
        </div>
        <div className="h-3.5 w-28 rounded-lg bg-surface" />
        <div className="h-2 w-full rounded-full bg-surface" />
        <div className="h-7 w-48 rounded-xl bg-surface" />
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-surface" />
            <div className="h-3 w-24 rounded-lg bg-surface" />
          </div>
          <div className="h-3 w-14 rounded-lg bg-surface" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 animate-pulse">
        <div className="h-11 w-full rounded-2xl bg-surface" />
      </div>
    </Card>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "shrink-0 h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border transition-all duration-150 " +
        (active
          ? "bg-primary text-cream border-primary shadow-soft"
          : "bg-cream text-text-soft border-border/60 hover:border-border hover:bg-surface/30")
      }
    >
      {children}
    </button>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: AttemptFilter;
  onChange: (v: AttemptFilter) => void;
  options: { value: AttemptFilter; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/60 bg-cream p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={
            "h-8 px-3 rounded-[10px] text-xs font-heading font-semibold transition-all duration-150 whitespace-nowrap " +
            (value === opt.value
              ? "bg-primary text-cream shadow-soft"
              : "text-text-soft hover:text-text hover:bg-surface/40")
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <Card className="bg-surface/30 border-border/40">
      <div className="flex flex-col items-center text-center py-10 lg:py-14 px-4">
        <div className="h-16 w-16 rounded-3xl bg-cream text-secondary shadow-card ring-1 ring-border/50 flex items-center justify-center mb-5">
          {isFiltered ? (
            <Search className="w-8 h-8" strokeWidth={1.8} />
          ) : (
            <Library className="w-8 h-8" strokeWidth={1.8} />
          )}
        </div>
        <h3 className="font-heading font-bold text-lg text-text leading-tight">
          {isFiltered
            ? "No quizzes match your filters"
            : "Your library is empty"}
        </h3>
        <p className="mt-2 text-sm text-text-soft max-w-md leading-relaxed">
          {isFiltered
            ? "Try adjusting your search or filter options."
            : "Once you pay for a quiz, it lives here forever — go find one to unlock."}
        </p>
        {!isFiltered && (
          <Link to="/browse" className="mt-6">
            <Button variant="primary" size="md">
              <Compass className="w-4 h-4" />
              Browse Quizzes
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 150;

const ATTEMPT_FILTER_OPTIONS: { value: AttemptFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attempted", label: "Attempted" },
  { value: "not-attempted", label: "Not Started" },
];

export function LibraryPage() {
  const { currentUser, purchasedQuizIds } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("unlocked");
  const [attemptFilter, setAttemptFilter] = useState<AttemptFilter>("all");

  // Load all data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchPublishedQuizzes(currentUser.university_id || undefined),
      fetchCourses(currentUser.university_id || undefined),
      fetchAllProfiles(),
      fetchUserAttempts(currentUser.id),
    ]).then(([quizzes, courses, profiles, attempts]) => {
      if (cancelled) return;
      setAllQuizzes(quizzes);
      setAllCourses(courses);
      setAllProfiles(profiles);
      setAllAttempts(attempts);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, currentUser.university_id]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Lookup maps
  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [allCourses],
  );
  const profilesById = useMemo(
    () => new Map(allProfiles.map((p) => [p.id, p])),
    [allProfiles],
  );

  // Purchased quizzes in the order they appear in purchasedQuizIds
  const purchasedQuizzes = useMemo<Quiz[]>(() => {
    return purchasedQuizIds
      .map((id) => allQuizzes.find((q) => q.id === id))
      .filter((q): q is Quiz => q !== undefined);
  }, [purchasedQuizIds, allQuizzes]);

  // Precompute attempt stats for every purchased quiz
  const statsMap = useMemo<Map<string, AttemptStats>>(() => {
    const m = new Map<string, AttemptStats>();
    for (const q of purchasedQuizzes) {
      m.set(q.id, computeAttemptStats(q.id, currentUser.id, allAttempts));
    }
    return m;
  }, [purchasedQuizzes, currentUser.id, allAttempts]);

  // Subject areas that actually appear in the library
  const librarySubjectAreas = useMemo<string[]>(() => {
    const areas = new Set<string>();
    purchasedQuizzes.forEach((q) => {
      const course = coursesById.get(q.course_id);
      if (course?.subject_area) areas.add(course.subject_area);
    });
    return Array.from(areas).sort();
  }, [purchasedQuizzes, coursesById]);

  // Filter → sort
  const displayQuizzes = useMemo<Quiz[]>(() => {
    let list = purchasedQuizzes;

    if (attemptFilter === "attempted") {
      list = list.filter((q) => (statsMap.get(q.id)?.count ?? 0) > 0);
    } else if (attemptFilter === "not-attempted") {
      list = list.filter((q) => (statsMap.get(q.id)?.count ?? 0) === 0);
    }

    if (subjectFilter !== "all") {
      list = list.filter((q) => {
        const course = coursesById.get(q.course_id);
        return course?.subject_area === subjectFilter;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((quiz) => {
        if (quiz.title.toLowerCase().includes(q)) return true;
        const course = coursesById.get(quiz.course_id);
        if (course?.code.toLowerCase().includes(q)) return true;
        if (course?.title.toLowerCase().includes(q)) return true;
        const creator = profilesById.get(quiz.creator_id);
        return creator?.full_name.toLowerCase().includes(q) ?? false;
      });
    }

    const sorted = [...list];
    switch (sortKey) {
      case "alpha":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "best-score": {
        sorted.sort((a, b) => {
          const sa = statsMap.get(a.id)?.bestScore ?? -1;
          const sb = statsMap.get(b.id)?.bestScore ?? -1;
          return sb - sa;
        });
        break;
      }
      case "not-attempted":
        sorted.sort((a, b) => {
          const ca = statsMap.get(a.id)?.count ?? 0;
          const cb = statsMap.get(b.id)?.count ?? 0;
          return ca - cb;
        });
        break;
      case "unlocked":
      default:
        break;
    }
    return sorted;
  }, [
    purchasedQuizzes,
    statsMap,
    attemptFilter,
    subjectFilter,
    searchQuery,
    sortKey,
    profilesById,
    coursesById,
  ]);

  const isFiltered =
    searchQuery !== "" || subjectFilter !== "all" || attemptFilter !== "all";

  const attemptedCount = useMemo(
    () => [...statsMap.values()].filter((s) => s.count > 0).length,
    [statsMap],
  );
  const notAttemptedCount = purchasedQuizzes.length - attemptedCount;

  return (
    <PageContainer className="max-w-290!">
      <div className="space-y-5 lg:space-y-6">
        {/* ── Page header ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Badge variant="primary" size="sm" dot className="mb-2">
              <Library className="w-3 h-3" />
              Your collection
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Your Library
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-lg leading-relaxed">
              {purchasedQuizzes.length > 0
                ? `${purchasedQuizzes.length} quiz${purchasedQuizzes.length !== 1 ? "zes" : ""} unlocked — retake any of them anytime, no extra cost.`
                : "Quizzes you purchase live here forever — pay once, practice for life."}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-sm shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title or creator…"
              aria-label="Search your library"
              className="w-full h-11 pl-10 pr-10 rounded-2xl border border-border/60 bg-cream text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg text-muted hover:text-text hover:bg-surface/60 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ── Filter / sort bar ── */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/25 lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="space-y-3">
            {/* Subject area chips */}
            {librarySubjectAreas.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
                <FilterChip
                  active={subjectFilter === "all"}
                  onClick={() => setSubjectFilter("all")}
                >
                  All Courses
                </FilterChip>
                {librarySubjectAreas.map((area) => (
                  <FilterChip
                    key={area}
                    active={subjectFilter === area}
                    onClick={() =>
                      setSubjectFilter((prev) => (prev === area ? "all" : area))
                    }
                  >
                    {area}
                  </FilterChip>
                ))}
              </div>
            )}

            {/* Sort + attempted toggle row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <FilterSelect
                value={sortKey}
                onChange={(v) => setSortKey(v as SortKey)}
                options={SORT_OPTIONS}
                leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                aria-label="Sort library"
              />

              <SegmentedControl
                value={attemptFilter}
                onChange={setAttemptFilter}
                options={ATTEMPT_FILTER_OPTIONS}
              />

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    setSubjectFilter("all");
                    setAttemptFilter("all");
                  }}
                  className="h-9! px-3! text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!loading && purchasedQuizzes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <p className="text-sm text-text-soft">
              <span className="font-heading font-semibold text-text">
                {displayQuizzes.length}
              </span>{" "}
              {displayQuizzes.length === 1 ? "quiz" : "quizzes"} in your library
            </p>
            <span className="hidden sm:inline h-3.5 w-px bg-border/60" />
            <p className="text-sm text-text-soft">
              <span className="font-heading font-semibold text-success">
                {attemptedCount}
              </span>{" "}
              attempted
            </p>
            <span className="hidden sm:inline h-3.5 w-px bg-border/60" />
            <p className="text-sm text-text-soft">
              <span className="font-heading font-semibold text-muted">
                {notAttemptedCount}
              </span>{" "}
              not yet started
            </p>
          </div>
        )}

        {/* ── Grid / skeleton / empty ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <LibraryCardSkeleton key={i} />
            ))}
          </div>
        ) : displayQuizzes.length === 0 ? (
          <EmptyState isFiltered={isFiltered || purchasedQuizzes.length > 0} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {displayQuizzes.map((quiz) => (
              <LibraryCard
                key={quiz.id}
                quiz={quiz}
                course={coursesById.get(quiz.course_id)}
                creator={profilesById.get(quiz.creator_id)}
                stats={
                  statsMap.get(quiz.id) ?? {
                    count: 0,
                    bestScore: null,
                    lastAttemptId: null,
                  }
                }
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
