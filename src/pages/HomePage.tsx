import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowRight,
  BookOpenCheck,
  Target,
  Flame,
  Sparkles,
  History,
  Clock,
  Library,
  Wand2,
  Compass,
  Search,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { QuizCard, formatNaira, formatDate } from "../components/QuizCard";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  courses as allCourses,
  profiles as allProfiles,
  quizAttempts as allAttempts,
  walletTransactions as allWalletTxns,
  type Quiz,
  type QuizAttempt,
} from "../mock";

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 16) return "Good afternoon";
  return "Good evening";
}

function firstName(full: string) {
  return full.split(" ")[0] ?? full;
}

function computeWalletBalance(userId: string) {
  return allWalletTxns
    .filter((t) => t.user_id === userId && t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);
}

function attemptDateKey(a: QuizAttempt) {
  return (a.completed_at ?? a.started_at).valueOf
    ? new Date(a.completed_at ?? a.started_at).getTime()
    : 0;
}

export function HomePage() {
  const {
    currentUser,
    purchasedQuizIds,
    walletBalance: cachedBalance,
    hasPurchasedQuiz,
  } = useAuth();

  const walletBalance = useMemo(
    () => computeWalletBalance(currentUser.id),
    [currentUser.id],
  );
  const balanceToShow = walletBalance !== 0 ? walletBalance : cachedBalance;

  const greeting = greetingByTime();
  const userFirst = firstName(currentUser.full_name);
  const todayLabel = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const coursesById = useMemo(() => {
    const m = new Map(allCourses.map((c) => [c.id, c]));
    return m;
  }, []);
  const profilesById = useMemo(() => {
    const m = new Map(allProfiles.map((p) => [p.id, p]));
    return m;
  }, []);
  const quizzesById = useMemo(() => {
    const m = new Map(allQuizzes.map((q) => [q.id, q]));
    return m;
  }, []);

  const publishedQuizzes = useMemo(
    () => allQuizzes.filter((q) => q.is_published),
    [],
  );

  const userAttempts = useMemo(() => {
    return allAttempts
      .filter((a) => a.user_id === currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.completed_at ?? b.started_at).getTime() -
          new Date(a.completed_at ?? a.started_at).getTime(),
      );
  }, [currentUser.id]);

  const recentAttempts = userAttempts.slice(0, 5);

  const purchasedQuizzes: Quiz[] = useMemo(() => {
    const out: Quiz[] = [];
    for (const id of purchasedQuizIds) {
      const q = quizzesById.get(id);
      if (q) out.push(q);
    }
    return out;
  }, [purchasedQuizIds, quizzesById]);

  const attemptedQuizIds = new Set(userAttempts.map((a) => a.quiz_id));
  const attemptedCourseIds = new Set(
    userAttempts
      .map((a) => quizzesById.get(a.quiz_id)?.course_id)
      .filter((id): id is string => !!id),
  );

  const suggestedQuizzes = useMemo(() => {
    const unpurchased = publishedQuizzes.filter((q) => !hasPurchasedQuiz(q.id));
    const sameCourse = unpurchased.filter((q) =>
      attemptedCourseIds.has(q.course_id),
    );
    const ordered = [...sameCourse];
    for (const q of unpurchased) {
      if (!ordered.find((o) => o.id === q.id)) ordered.push(q);
    }
    return ordered.slice(0, 6);
  }, [publishedQuizzes, attemptedCourseIds, hasPurchasedQuiz]);

  const stats = useMemo(() => {
    const total = userAttempts.length;
    const avg = total
      ? Math.round(userAttempts.reduce((s, a) => s + a.score, 0) / total)
      : 0;
    const best = total ? Math.max(...userAttempts.map((a) => a.score)) : 0;
    const streak = computeStreak(userAttempts);
    return { total, avg, best, streak };
  }, [userAttempts]);

  return (
    <PageContainer className="!max-w-[1160px]">
      <div className="space-y-7 lg:space-y-9">
        {/* 1. Greeting header */}
        <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <Avatar name={currentUser.full_name} size="xl" ring />
            <div className="min-w-0">
              <p className="font-heading uppercase tracking-[0.18em] text-[11px] text-muted font-semibold">
                {todayLabel}
              </p>
              <h1 className="mt-1 font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                {greeting}, {userFirst}.
              </h1>
              <p className="mt-1.5 text-sm text-text-soft max-w-md leading-relaxed">
                {stats.total
                  ? `You've attempted ${stats.total} ${stats.total === 1 ? "quiz" : "quizzes"}. Your best score so far is ${stats.best}% — keep that momentum going.`
                  : "You haven't attempted any quizzes yet. Start with one from your library or browse for something new below."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Link to="/browse">
              <Button variant="ghost" size="md">
                <Search className="w-4 h-4" />
                Browse quizzes
              </Button>
            </Link>
            <Link to="/wallet">
              <Button variant="outline" size="md">
                <Plus className="w-4 h-4" />
                Top up
              </Button>
            </Link>
          </div>
        </section>

        {/* 2. Wallet + stats row */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 lg:gap-5">
          <Card
            padded={false}
            className="relative overflow-hidden bg-primary text-cream border-primary/30 shadow-elevated"
          >
            <div className="absolute inset-0 opacity-[0.09] pointer-events-none">
              <div className="absolute -top-14 -right-10 h-56 w-56 rounded-full bg-cream" />
              <div className="absolute -bottom-16 -left-8 h-64 w-64 rounded-full bg-cream" />
            </div>
            <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col gap-5 h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge
                    variant="muted"
                    size="sm"
                    className="!bg-cream/15 !text-cream !border-cream/25 backdrop-blur"
                    dot
                  >
                    <span className="!bg-success h-2 w-2 rounded-full" />
                    Wallet balance
                  </Badge>
                  <p className="mt-3 font-heading font-bold text-[34px] sm:text-4xl leading-none tracking-tight">
                    {formatNaira(balanceToShow)}
                  </p>
                  <p className="mt-1.5 text-[13px] text-cream/75">
                    Ready to spend on any PrepUniv quiz. Pay once, and it's
                    yours forever.
                  </p>
                </div>
                <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-cream/15 border border-cream/20 items-center justify-center shrink-0">
                  <BookOpenCheck className="w-6 h-6" strokeWidth={1.9} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
                <WalletStatChip
                  label="Attempts"
                  value={stats.total}
                  icon={<Target className="w-4 h-4" />}
                />
                <WalletStatChip
                  label="Avg score"
                  value={stats.total ? stats.avg + "%" : "—"}
                  icon={<Flame className="w-4 h-4" />}
                />
                <WalletStatChip
                  label="Day streak"
                  value={stats.streak + (stats.streak === 1 ? " day" : " days")}
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <Link to="/wallet" className="sm:inline-flex sm:w-auto w-full">
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    className="!bg-cream !text-primary hover:!bg-cream/95 !border-cream !shadow-none h-12"
                  >
                    <Plus className="w-[18px] h-[18px]" />
                    Top up wallet
                  </Button>
                </Link>
                <Link to="/browse" className="sm:inline-flex sm:w-auto w-full">
                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    className="!text-cream hover:!bg-cream/10 focus:!ring-cream/30 h-12"
                  >
                    Find a quiz
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:gap-5 lg:h-full">
            <Card padded className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-secondary/12 text-secondary flex items-center justify-center">
                  <Library className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Your library
                  </p>
                  <p className="font-heading font-bold text-2xl text-text leading-none mt-1">
                    {purchasedQuizzes.length}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-soft leading-relaxed">
                  {purchasedQuizzes.length
                    ? "Unlimited retakes, no extra fees. Jump into one whenever you're ready."
                    : "Buy a quiz once, keep it in your library forever. Start by browsing."}
                </p>
              </div>
              <Link to="/library">
                <Button variant="ghost" size="sm" fullWidth>
                  Open library
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>

            <Card padded className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-primary/12 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Next up
                  </p>
                  <p className="font-heading font-semibold text-sm text-text leading-tight mt-1 line-clamp-2">
                    {suggestedQuizzes[0]?.title ?? "Nothing queued yet"}
                  </p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-soft leading-relaxed">
                  {suggestedQuizzes[0]
                    ? "Based on quizzes you already practice — this one fits the pattern."
                    : "Browse a little and PrepUniv will start recommending quizzes for you."}
                </p>
              </div>
              {suggestedQuizzes[0] ? (
                <Link to={`/quiz/${suggestedQuizzes[0].id}`}>
                  <Button variant="primary" size="sm" fullWidth>
                    <Wand2 className="w-4 h-4" />
                    View quiz
                  </Button>
                </Link>
              ) : (
                <Link to="/browse">
                  <Button variant="outline" size="sm" fullWidth>
                    <Compass className="w-4 h-4" />
                    Browse quizzes
                  </Button>
                </Link>
              )}
            </Card>
          </div>
        </section>

        {/* 3. Continue / recently attempted */}
        <SectionHeader
          title="Continue practicing"
          subtitle={
            recentAttempts.length
              ? `Pick up where you left off on ${recentAttempts.length} recent ${recentAttempts.length === 1 ? "attempt" : "attempts"}.`
              : "You haven't attempted any quizzes yet — your last attempts will appear here."
          }
          action={
            recentAttempts.length ? (
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  <History className="w-4 h-4" />
                  See all history
                </Button>
              </Link>
            ) : null
          }
        >
          <Badge variant="secondary" size="sm" dot>
            <History className="w-3 h-3" />
            Recently attempted
          </Badge>
        </SectionHeader>

        {recentAttempts.length ? (
          <QuizGrid rowOnMobile>
            {recentAttempts.map((attempt) => {
              const quiz = quizzesById.get(attempt.quiz_id);
              if (!quiz) return null;
              const retakeId =
                "atmp_" + Math.random().toString(36).slice(2, 10);
              return (
                <QuizCard
                  key={attempt.id}
                  quiz={quiz}
                  course={coursesById.get(quiz.course_id)}
                  creator={profilesById.get(quiz.creator_id)}
                  variant="attempted"
                  attempt={attempt}
                  retakeTo={`/quiz/${quiz.id}`}
                />
              );
            })}
          </QuizGrid>
        ) : (
          <EmptyState
            icon={History}
            title="No attempts yet"
            description="Once you attempt a quiz, it'll show up here so you can review or try again."
            primaryCta={{
              label: "Browse quizzes",
              to: "/browse",
              icon: Compass,
            }}
          />
        )}

        {/* 4. My Quizzes (purchased library) */}
        <SectionHeader
          title="My quizzes"
          subtitle={
            purchasedQuizzes.length
              ? `Purchased once, unlocked forever. Retake any of these ${purchasedQuizzes.length} ${purchasedQuizzes.length === 1 ? "quizzes" : "quiz"} as many times as you want.`
              : "Your purchased library lives here. Buy a quiz once and practice it forever."
          }
          action={
            purchasedQuizzes.length > 4 ? (
              <Link to="/library">
                <Button variant="ghost" size="sm">
                  See all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : null
          }
        >
          <Badge variant="primary" size="sm" dot>
            <Library className="w-3 h-3" />
            {purchasedQuizzes.length} unlocked
          </Badge>
        </SectionHeader>

        {purchasedQuizzes.length ? (
          <QuizGrid>
            {purchasedQuizzes.slice(0, 4).map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                course={coursesById.get(q.course_id)}
                creator={profilesById.get(q.creator_id)}
                variant="purchased"
              />
            ))}
          </QuizGrid>
        ) : (
          <EmptyState
            icon={Library}
            title="Your library is empty"
            description="Every quiz you purchase lives here forever. Find one in the marketplace and unlock it for life."
            primaryCta={{
              label: "Browse quizzes",
              to: "/browse",
              icon: Compass,
            }}
          />
        )}

        {/* 5. Suggested quizzes */}
        <SectionHeader
          title="Suggested for you"
          subtitle={
            suggestedQuizzes.length
              ? "Quizzes you haven't unlocked yet — pay the small fee once and keep them forever."
              : "Everything in the marketplace is already in your library. Nice work!"
          }
          action={
            suggestedQuizzes.length ? (
              <Link to="/browse">
                <Button variant="ghost" size="sm">
                  See all marketplace
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : null
          }
        >
          <Badge variant="muted" size="sm" dot>
            <Compass className="w-3 h-3" />
            Not yet unlocked
          </Badge>
        </SectionHeader>

        {suggestedQuizzes.length ? (
          <QuizGrid>
            {suggestedQuizzes.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                course={coursesById.get(q.course_id)}
                creator={profilesById.get(q.creator_id)}
                variant="locked"
              />
            ))}
          </QuizGrid>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="All caught up"
            description="Every published quiz in the marketplace is already in your library. Retry them in My quizzes above."
            primaryCta={{
              label: "Go to my quizzes",
              to: "/library",
              icon: Library,
            }}
          />
        )}
      </div>
    </PageContainer>
  );
}

function WalletStatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-cream/10 border border-cream/15 p-2 sm:p-3.5 backdrop-blur-sm min-h-0">
      <div className="flex sm:flex-row flex-col items-start sm:items-center gap-1.5 sm:gap-2 text-cream/80 min-w-0">
        <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-xl bg-cream/15 flex items-center justify-center text-cream shrink-0">
          {icon}
        </span>
        <p className="text-[8.5px] sm:text-[10.5px] uppercase tracking-[0.11em] sm:tracking-[0.14em] font-heading font-semibold leading-tight min-w-0 break-words">
          {label}
        </p>
      </div>
      <p className="mt-1.5 sm:mt-2 font-heading font-bold text-[15px] sm:text-xl leading-none text-cream break-words">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  tag,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {children ?? tag}
        </div>
        <h2 className="mt-2 font-heading font-semibold text-xl lg:text-[22px] text-text tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-text-soft leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex sm:pb-0.5">{action}</div>}
    </div>
  );
}

function QuizGrid({
  children,
  rowOnMobile = false,
}: {
  children: React.ReactNode;
  rowOnMobile?: boolean;
}) {
  const desk = "hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5";
  const mob = rowOnMobile
    ? "lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 scroll-pl-4 pb-2 [&>*]:min-w-[78%] [&>*]:snap-start sm:[&>*]:min-w-[calc(50%-0.5rem)] [&>*]:ml-0 first:[&>*]:ml-0"
    : "lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4";
  return (
    <>
      <div className={desk}>{children}</div>
      <div className={mob}>{children}</div>
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  primaryCta,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  primaryCta?: { label: string; to: string; icon?: React.ElementType };
}) {
  return (
    <Card className="bg-surface/35 border-border/40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 py-2">
        <div className="flex items-start gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 rounded-3xl bg-cream text-secondary shadow-card ring-1 ring-border/50 flex items-center justify-center">
            <Icon className="w-7 h-7" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-lg text-text leading-tight">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-lg">
              {description}
            </p>
          </div>
        </div>
        {primaryCta && (
          <Link to={primaryCta.to} className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" fullWidth>
              {primaryCta.icon &&
                (() => {
                  const Ico = primaryCta.icon;
                  return <Ico className="w-4 h-4" />;
                })()}
              {primaryCta.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

function computeStreak(attempts: QuizAttempt[]) {
  if (!attempts.length) return 0;
  const days = new Set(
    attempts.map((a) => {
      const d = new Date(a.completed_at ?? a.started_at);
      return d.getUTCFullYear() + "-" + d.getUTCMonth() + "-" + d.getUTCDate();
    }),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  while (true) {
    const key =
      cursor.getUTCFullYear() +
      "-" +
      cursor.getUTCMonth() +
      "-" +
      cursor.getUTCDate();
    if (days.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
