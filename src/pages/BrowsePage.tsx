import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  Library,
  Compass,
  GraduationCap,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { QuizCard } from "../components/QuizCard";
import { FilterSelect } from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  courses as allCourses,
  profiles as allProfiles,
  type Quiz,
} from "../mock";

type SortKey = "newest" | "popular" | "price-asc" | "price-desc";
type LibraryFilter = "all" | "library";
type LevelFilter = "all" | "100" | "200" | "300" | "400";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "100", label: "100L" },
  { value: "200", label: "200L" },
  { value: "300", label: "300L" },
  { value: "400", label: "400L" },
];

const LOADING_MS = 500;
const SEARCH_DEBOUNCE_MS = 150;

export function BrowsePage() {
  const navigate = useNavigate();
  const { hasPurchasedQuiz, currentUser } = useAuth();
  const userUniversityId = currentUser.university_id;

  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [],
  );
  const profilesById = useMemo(
    () => new Map(allProfiles.map((p) => [p.id, p])),
    [],
  );

  const publishedQuizzes = useMemo(
    () =>
      allQuizzes.filter(
        (q) =>
          q.is_published &&
          // admins see everything; regular users only see their own university
          (currentUser.role === "admin" ||
            q.university_id === userUniversityId),
      ),
    [userUniversityId, currentUser.role],
  );

  /** Unique subject areas derived from the courses in use */
  const subjectAreas = useMemo(() => {
    const usedCourseIds = new Set(publishedQuizzes.map((q) => q.course_id));
    const areas = new Set<string>();
    allCourses.forEach((c) => {
      if (usedCourseIds.has(c.id)) areas.add(c.subject_area);
    });
    return Array.from(areas).sort();
  }, [publishedQuizzes]);

  /** Popular course codes: top codes by quiz count */
  const popularCourseCodes = useMemo(() => {
    const counts: Record<string, number> = {};
    publishedQuizzes.forEach((q) => {
      const course = coursesById.get(q.course_id);
      if (course) counts[course.code] = (counts[course.code] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code]) => code);
  }, [publishedQuizzes, coursesById]);

  const filteredQuizzes = useMemo(() => {
    let list = publishedQuizzes;

    if (libraryFilter === "library") {
      list = list.filter((q) => hasPurchasedQuiz(q.id));
    }

    if (deptFilter !== "all") {
      list = list.filter((q) => {
        const course = coursesById.get(q.course_id);
        return course?.subject_area === deptFilter;
      });
    }

    if (levelFilter !== "all") {
      const lvl = parseInt(levelFilter, 10) as 100 | 200 | 300 | 400;
      list = list.filter((q) => {
        const course = coursesById.get(q.course_id);
        return course?.level === lvl;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((quiz) => {
        const course = coursesById.get(quiz.course_id);
        const codeMatch = course?.code.toLowerCase().includes(q) ?? false;
        const titleMatch = quiz.title.toLowerCase().includes(q);
        const courseTitleMatch =
          course?.title.toLowerCase().includes(q) ?? false;
        const creator = profilesById.get(quiz.creator_id);
        const creatorMatch =
          creator?.full_name.toLowerCase().includes(q) ?? false;
        return codeMatch || titleMatch || courseTitleMatch || creatorMatch;
      });
    }

    const sorted = [...list];
    switch (sortKey) {
      case "popular":
        sorted.sort((a, b) => b.attempt_count - a.attempt_count);
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return sorted;
  }, [
    publishedQuizzes,
    libraryFilter,
    deptFilter,
    levelFilter,
    searchQuery,
    sortKey,
    hasPurchasedQuiz,
    coursesById,
    profilesById,
  ]);

  const hasActiveFilters =
    searchQuery !== "" ||
    deptFilter !== "all" ||
    levelFilter !== "all" ||
    libraryFilter !== "all" ||
    sortKey !== "newest";

  function clearFilters() {
    setSearchInput("");
    setSearchQuery("");
    setDeptFilter("all");
    setLevelFilter("all");
    setLibraryFilter("all");
    setSortKey("newest");
  }

  function handleCardClick(e: React.MouseEvent, quizId: string) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    navigate(`/quiz/${quizId}`);
  }

  /** Quick-jump to a specific course code via the search bar */
  function jumpToCode(code: string) {
    setSearchInput(code);
    setSearchQuery(code);
  }

  return (
    <PageContainer className="!max-w-[1160px]">
      <div className="space-y-5 lg:space-y-6">
        {/* Page header + search */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Badge variant="secondary" size="sm" dot className="mb-2">
              <Compass className="w-3 h-3" />
              Marketplace
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Browse Quizzes
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-lg leading-relaxed">
              Discover quizzes across every course. Pay once, unlock forever.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course code, title, or creator…"
              aria-label="Search quizzes"
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

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/25 lg:static lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-0">
          <div className="space-y-3">
            {/* Popular course code pills */}
            {popularCourseCodes.length > 0 && !searchQuery && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted shrink-0">
                  Popular:
                </span>
                {popularCourseCodes.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => jumpToCode(code)}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-heading font-bold border border-border/50 bg-surface/40 text-text-soft hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-150"
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {/* Subject Area chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
              <FilterChip
                active={deptFilter === "all"}
                onClick={() => setDeptFilter("all")}
              >
                All Courses
              </FilterChip>
              {subjectAreas.map((area) => (
                <FilterChip
                  key={area}
                  active={deptFilter === area}
                  onClick={() => setDeptFilter(area)}
                >
                  {area}
                </FilterChip>
              ))}
            </div>

            {/* Level filter + Sort + library toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Level dropdown */}
              <FilterSelect
                value={levelFilter}
                onChange={(v) => setLevelFilter(v as LevelFilter)}
                options={LEVEL_OPTIONS}
                leadingIcon={<GraduationCap className="w-3.5 h-3.5" />}
                aria-label="Filter by level"
              />

              {/* Sort */}
              <FilterSelect
                value={sortKey}
                onChange={(v) => setSortKey(v as SortKey)}
                options={SORT_OPTIONS}
                leadingIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                aria-label="Sort quizzes"
              />

              {/* Library toggle */}
              <div className="inline-flex rounded-xl border border-border/60 bg-cream p-0.5">
                <LibraryToggle
                  active={libraryFilter === "all"}
                  onClick={() => setLibraryFilter("all")}
                >
                  All
                </LibraryToggle>
                <LibraryToggle
                  active={libraryFilter === "library"}
                  onClick={() => setLibraryFilter("library")}
                >
                  <Library className="w-3.5 h-3.5" />
                  My Library
                </LibraryToggle>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="!h-9 !px-3 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-sm text-text-soft">
            <span className="font-heading font-semibold text-text">
              {filteredQuizzes.length}
            </span>{" "}
            {filteredQuizzes.length === 1 ? "quiz" : "quizzes"} found
          </p>
        )}

        {/* Grid / skeleton / empty */}
        {loading ? (
          <QuizGridSkeleton count={8} />
        ) : filteredQuizzes.length === 0 ? (
          <BrowseEmptyState onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="cursor-pointer"
                onClick={(e) => handleCardClick(e, quiz.id)}
                role="presentation"
              >
                <QuizCard
                  quiz={quiz}
                  course={coursesById.get(quiz.course_id)}
                  creator={profilesById.get(quiz.creator_id)}
                  variant={hasPurchasedQuiz(quiz.id) ? "purchased" : "locked"}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

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

function LibraryToggle({
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
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-xs font-heading font-semibold transition-all duration-150 " +
        (active
          ? "bg-primary text-cream shadow-soft"
          : "text-text-soft hover:text-text hover:bg-surface/40")
      }
    >
      {children}
    </button>
  );
}

function QuizGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <QuizCardSkeleton key={i} />
      ))}
    </div>
  );
}

function QuizCardSkeleton() {
  return (
    <Card padded={false} className="bg-cream overflow-hidden">
      <div className="px-5 pt-5 pb-4 space-y-4 animate-pulse">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-lg bg-surface" />
              <div className="h-3 w-24 rounded-lg bg-surface" />
            </div>
            <div className="h-4 w-full rounded-lg bg-surface" />
            <div className="h-4 w-3/4 rounded-lg bg-surface" />
          </div>
          <div className="h-6 w-16 rounded-xl bg-surface shrink-0" />
        </div>
        <div className="h-3.5 w-28 rounded-lg bg-surface" />
        <div className="h-1 w-full rounded-full bg-surface" />
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-surface" />
            <div className="h-3 w-24 rounded-lg bg-surface" />
          </div>
          <div className="h-5 w-14 rounded-lg bg-surface" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 animate-pulse">
        <div className="h-11 w-full rounded-2xl bg-surface" />
      </div>
    </Card>
  );
}

function BrowseEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card className="bg-surface/35 border-border/40">
      <div className="flex flex-col items-center text-center py-10 lg:py-14 px-4">
        <div className="h-16 w-16 rounded-3xl bg-cream text-secondary shadow-card ring-1 ring-border/50 flex items-center justify-center mb-5">
          <Search className="w-8 h-8" strokeWidth={1.8} />
        </div>
        <h3 className="font-heading font-bold text-lg text-text leading-tight">
          No quizzes match your search
        </h3>
        <p className="mt-2 text-sm text-text-soft max-w-md leading-relaxed">
          Try adjusting your filters or search terms to find what you&apos;re
          looking for.
        </p>
        <Button variant="primary" size="md" onClick={onClear} className="mt-6">
          <X className="w-4 h-4" />
          Clear filters
        </Button>
      </div>
    </Card>
  );
}
