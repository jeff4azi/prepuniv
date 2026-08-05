import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users,
  BarChart2,
  FileQuestion,
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
import {
  profiles as allProfiles,
  quizzes as allQuizzes,
  courses as allCourses,
  quizAttempts as allAttempts,
  type QuizAttempt,
} from "../mock";

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
  const { currentUser, hasPurchasedQuiz } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [],
  );

  // Resolve profile
  const profile = useMemo(() => allProfiles.find((p) => p.id === id), [id]);

  // Gate: only creator/admin profiles are valid here
  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
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

  // Derive stats from live mock data
  const publishedQuizzes = useMemo(
    () =>
      allQuizzes.filter((q) => q.creator_id === profile.id && q.is_published),
    [profile.id],
  );

  const totalAttempts = useMemo(
    () => publishedQuizzes.reduce((sum, q) => sum + q.attempt_count, 0),
    [publishedQuizzes],
  );

  // Average score across all attempts on this creator's quizzes (from mock attempts store)
  const avgScore = useMemo(() => {
    const quizIds = new Set(publishedQuizzes.map((q) => q.id));
    const relevant = allAttempts.filter((a) => quizIds.has(a.quiz_id));
    if (relevant.length === 0) return null;
    const sum = relevant.reduce((s, a) => s + a.score, 0);
    return Math.round(sum / relevant.length);
  }, [publishedQuizzes]);

  // Current user's last attempt per quiz (for variant + retake)
  const lastAttemptByQuizId = useMemo(() => {
    const m = new Map<string, QuizAttempt>();
    const quizIds = new Set(publishedQuizzes.map((q) => q.id));
    const userAttempts = allAttempts
      .filter((a) => a.user_id === currentUser.id && quizIds.has(a.quiz_id))
      .sort(
        (a, b) =>
          new Date(b.completed_at ?? b.started_at).getTime() -
          new Date(a.completed_at ?? a.started_at).getTime(),
      );
    for (const a of userAttempts) {
      if (!m.has(a.quiz_id)) m.set(a.quiz_id, a);
    }
    return m;
  }, [publishedQuizzes, currentUser.id]);

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
          {/* Subtle tinted band at top */}
          <div className="h-20 bg-linear-to-br from-primary/12 via-secondary/8 to-transparent" />

          <div className="px-5 sm:px-7 pb-6 -mt-10 space-y-4">
            {/* Avatar + name row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar
                name={profile.full_name}
                size="xl"
                ring
                className="h-20 w-20 text-xl ring-cream ring-4 shadow-elevated"
              />
              <div className="flex-1 min-w-0 space-y-1.5 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" size="sm" dot>
                    <Sparkles className="w-3 h-3" />
                    Creator
                  </Badge>
                  {profile.joined_at && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted font-heading">
                      <CalendarDays className="w-3.5 h-3.5" />
                      Joined {joinedLabel(profile.joined_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
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
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-text-soft leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>

          {/* ── Stats strip ── */}
          <div className="border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/40">
            <StatChip
              icon={BookOpen}
              label="Quizzes published"
              value={publishedQuizzes.length}
            />
            <StatChip
              icon={Users}
              label="Total attempts"
              value={totalAttempts.toLocaleString()}
            />
            {avgScore !== null ? (
              <StatChip
                icon={BarChart2}
                label="Avg. score on their quizzes"
                value={`${avgScore}%`}
              />
            ) : (
              <StatChip
                icon={FileQuestion}
                label="Total questions"
                value={publishedQuizzes
                  .reduce((s, q) => s + q.question_count, 0)
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
                {publishedQuizzes.length > 0
                  ? `${publishedQuizzes.length} published quiz${publishedQuizzes.length !== 1 ? "zes" : ""}`
                  : "No published quizzes yet"}
              </p>
            </div>
          </div>

          {publishedQuizzes.length === 0 ? (
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
              {publishedQuizzes.map((quiz) => {
                const lastAttempt = lastAttemptByQuizId.get(quiz.id);
                const purchased = hasPurchasedQuiz(quiz.id);
                const variant = lastAttempt
                  ? "attempted"
                  : purchased
                    ? "purchased"
                    : "locked";
                return (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    course={coursesById.get(quiz.course_id)}
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
