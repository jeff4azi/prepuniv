import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  ArrowLeft,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users,
  BarChart2,
  FileQuestion,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { QuizCard } from "../components/QuizCard";
import { ShareIconButton } from "../components/ShareActions";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type {
  DbQuiz,
  DbCourse,
  DbProfile,
  DbQuizAttempt,
  DbUniversity,
} from "../lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function joinedLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-4 flex-1 min-w-0">
      <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
      </div>
      <p className="font-heading font-bold text-xl text-text leading-none">
        {value}
      </p>
      <p className="text-[11px] font-heading font-medium text-muted text-center leading-tight">
        {label}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, hasPurchasedQuiz, isLoggedIn } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DbProfile | null | undefined>(
    undefined,
  );
  const [quizzes, setQuizzes] = useState<DbQuiz[]>([]);
  const [courses, setCourses] = useState<Map<string, DbCourse>>(new Map());
  const [myAttempts, setMyAttempts] = useState<DbQuizAttempt[]>([]);
  const [university, setUniversity] = useState<DbUniversity | null>(null);

  // Dynamic tab title: loading → null, found → name, not found → fallback
  usePageTitle(
    profile === undefined
      ? null
      : profile
        ? `${profile.full_name} on PrepUniv`
        : "Creator not found",
    { full: true },
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      // Fetch profile
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (
        !profileRow ||
        (profileRow.role !== "creator" && profileRow.role !== "admin")
      ) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(profileRow as DbProfile);

      // Fetch the creator's university (if affiliated) — displayed in header
      if (profileRow.university_id) {
        const { data: uniRow } = await supabase
          .from("universities")
          .select("id, name, abbreviation, state")
          .eq("id", profileRow.university_id)
          .maybeSingle();
        if (!cancelled) setUniversity((uniRow as DbUniversity) ?? null);
      } else if (!cancelled) {
        setUniversity(null);
      }

      // Fetch their published quizzes
      const { data: quizRows } = await supabase
        .from("quizzes")
        .select("*")
        .eq("creator_id", id)
        .eq("is_published", true)
        .eq("unpublished_by_admin", false)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      const publishedQuizzes = (quizRows ?? []) as DbQuiz[];
      setQuizzes(publishedQuizzes);

      // Fetch courses for those quizzes
      const courseIds = [
        ...new Set(publishedQuizzes.map((q) => q.course_id).filter(Boolean)),
      ];
      if (courseIds.length) {
        const { data: courseRows } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);
        if (!cancelled) {
          const m = new Map<string, DbCourse>();
          for (const c of (courseRows ?? []) as DbCourse[]) m.set(c.id, c);
          setCourses(m);
        }
      }

      // Fetch current user's attempts on this creator's quizzes (authenticated only)
      if (isLoggedIn && currentUser.id && publishedQuizzes.length) {
        const quizIds = publishedQuizzes.map((q) => q.id);
        const { data: attemptRows } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", currentUser.id)
          .in("quiz_id", quizIds)
          .order("started_at", { ascending: false });
        if (!cancelled) setMyAttempts((attemptRows ?? []) as DbQuizAttempt[]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id, currentUser.id, isLoggedIn]);

  // Best attempt per quiz for the current user
  const lastAttemptByQuizId = useMemo(() => {
    const m = new Map<string, DbQuizAttempt>();
    for (const a of myAttempts) {
      if (!m.has(a.quiz_id)) m.set(a.quiz_id, a);
    }
    return m;
  }, [myAttempts]);

  // Stats
  const totalAttempts = useMemo(
    () => quizzes.reduce((sum, q) => sum + (q.attempt_count ?? 0), 0),
    [quizzes],
  );

  const avgScore = useMemo(() => {
    if (!myAttempts.length) return null;
    const sum = myAttempts.reduce((s, a) => s + (a.score ?? 0), 0);
    return Math.round(sum / myAttempts.length);
  }, [myAttempts]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading || profile === undefined) {
    return (
      <PageContainer className="max-w-290!">
        <div className="space-y-5 animate-pulse">
          {/* Back link */}
          <div className="h-5 w-16 rounded-lg bg-surface" />

          {/* Header card */}
          <Card padded={false} className="overflow-hidden">
            <div className="p-5 sm:p-6">
              {/* Mobile: stack / Desktop: row */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
                {/* Avatar */}
                <div className="h-32 w-32 rounded-2xl bg-surface shrink-0" />

                {/* Info block */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-20 rounded-xl bg-surface" />
                    <div className="h-6 w-24 rounded-xl bg-surface" />
                    <div className="h-6 w-36 rounded-xl bg-surface" />
                  </div>
                  {/* Name */}
                  <div className="h-8 w-3/4 rounded-lg bg-surface" />
                  {/* School / location */}
                  <div className="flex flex-wrap gap-3">
                    <div className="h-4 w-52 rounded-lg bg-surface" />
                    <div className="h-4 w-28 rounded-lg bg-surface" />
                  </div>
                  {/* Bio lines */}
                  <div className="space-y-2 pt-1">
                    <div className="h-3.5 w-full rounded-lg bg-surface" />
                    <div className="h-3.5 w-5/6 rounded-lg bg-surface" />
                    <div className="h-3.5 w-4/6 rounded-lg bg-surface" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/40">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 px-5 py-4"
                >
                  <div className="h-9 w-9 rounded-2xl bg-surface" />
                  <div className="h-5 w-10 rounded-lg bg-surface" />
                  <div className="h-3 w-20 rounded-lg bg-surface" />
                </div>
              ))}
            </div>
          </Card>

          {/* Quizzes section heading */}
          <div className="space-y-1.5">
            <div className="h-6 w-44 rounded-lg bg-surface" />
            <div className="h-4 w-28 rounded-lg bg-surface" />
          </div>

          {/* Quiz card skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {[0, 1, 2].map((i) => (
              <Card key={i} padded={false} className="overflow-hidden">
                <div className="px-5 pt-5 pb-4 space-y-4">
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-16 rounded-lg bg-surface" />
                        <div className="h-3 w-20 rounded-lg bg-surface" />
                      </div>
                      <div className="h-4 w-full rounded-lg bg-surface" />
                      <div className="h-4 w-3/4 rounded-lg bg-surface" />
                    </div>
                    <div className="h-6 w-14 rounded-xl bg-surface shrink-0" />
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
                <div className="px-5 pb-5 pt-1">
                  <div className="h-11 w-full rounded-2xl bg-surface" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-surface flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted" strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-bold text-xl text-text">
            Creator profile not found
          </h2>
          <p className="text-sm text-text-soft max-w-xs leading-relaxed">
            This profile doesn't exist or belongs to a learner account, not a
            creator.
          </p>
          <Button variant="outline" onClick={() => navigate("/browse")}>
            <ArrowLeft className="w-4 h-4" />
            Back to Browse
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-290!">
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}
      <div className="space-y-5 lg:space-y-6">
        {/* ── Back link ── */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* ── Header card ── */}
        <Card padded={false} className="overflow-hidden">
          <div className="p-5 sm:p-6">
            {/* Mobile: vertical stack. Desktop (sm+): avatar left, info right side-by-side */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Avatar */}
              <Avatar
                name={profile.full_name}
                src={profile.avatar_url ?? undefined}
                size="xl"
                ring
                className="h-32 w-32 text-2xl rounded-2xl shadow-card shrink-0"
              />

              {/* Info block */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="sm" dot>
                    <Sparkles className="w-3 h-3" />
                    Creator
                  </Badge>
                  {university && (
                    <Badge variant="tertiary" size="sm">
                      <GraduationCap className="w-3 h-3" />
                      {university.abbreviation || university.name}
                    </Badge>
                  )}
                  {profile.created_at && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted font-heading">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Joined {joinedLabel(profile.created_at)}
                    </span>
                  )}
                </div>

                {/* Name + share */}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="font-heading font-bold text-2xl lg:text-3xl text-text tracking-tight leading-tight">
                    {profile.full_name}
                  </h1>
                  <ShareIconButton
                    url={`${window.location.origin}/profile/creator/${profile.id}`}
                    title={`${profile.full_name} on PrepUniv`}
                    text={`Check out ${profile.full_name}'s quizzes on PrepUniv`}
                    showToast={showToast}
                    label="Share profile"
                    size="sm"
                  />
                </div>

                {/* School / location / bio */}
                {(university || profile.bio) && (
                  <div className="space-y-1.5 max-w-2xl">
                    {university && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-soft font-body">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-muted" />
                          <span className="font-medium">{university.name}</span>
                        </span>
                        {university.state && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted" />
                            {university.state}, Nigeria
                          </span>
                        )}
                      </div>
                    )}
                    {profile.bio && (
                      <p className="text-sm leading-relaxed text-text-soft whitespace-pre-line">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/40">
            <StatChip
              icon={BookOpen}
              label="Quizzes published"
              value={quizzes.length}
            />
            <StatChip
              icon={Users}
              label="Total attempts"
              value={totalAttempts.toLocaleString()}
            />
            {isLoggedIn && avgScore !== null ? (
              <StatChip
                icon={BarChart2}
                label="Your avg. score"
                value={`${avgScore}%`}
              />
            ) : (
              <StatChip
                icon={FileQuestion}
                label="Total questions"
                value={quizzes
                  .reduce((s, q) => s + (q.question_count ?? 0), 0)
                  .toLocaleString()}
              />
            )}
          </div>
        </Card>

        {/* ── Quizzes section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-text tracking-tight">
                Quizzes by {profile.full_name.split(" ")[0]}
              </h2>
              <p className="text-sm text-text-soft mt-0.5">
                {quizzes.length > 0
                  ? `${quizzes.length} published quiz${quizzes.length !== 1 ? "zes" : ""}`
                  : "No published quizzes yet"}
              </p>
            </div>
          </div>

          {quizzes.length === 0 ? (
            <Card className="bg-surface/30 border-border/40">
              <div className="flex flex-col items-center text-center py-10 px-4">
                <div className="h-14 w-14 rounded-3xl bg-cream text-secondary shadow-card ring-1 ring-border/50 flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <h3 className="font-heading font-bold text-base text-text">
                  No quizzes yet
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-sm leading-relaxed">
                  This creator hasn't published any quizzes yet — check back
                  soon.
                </p>
                <Link to="/browse" className="mt-4">
                  <Button variant="outline" size="sm">
                    Browse all quizzes
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {quizzes.map((quiz) => {
                const lastAttempt = lastAttemptByQuizId.get(quiz.id);
                const purchased = isLoggedIn && hasPurchasedQuiz(quiz.id);
                const isOwner = isLoggedIn && currentUser.id === quiz.creator_id;
                const variant = lastAttempt
                  ? "attempted"
                  : isOwner
                    ? "owned"
                    : purchased
                      ? "purchased"
                      : "locked";
                return (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    course={courses.get(quiz.course_id)}
                    creator={profile}
                    variant={variant}
                    attempt={lastAttempt}
                    retakeTo={lastAttempt ? `/quiz/${quiz.id}` : undefined}
                    hideCreatorLink
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
