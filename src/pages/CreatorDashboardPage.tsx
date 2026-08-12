import { useMemo, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  Banknote,
  Users,
  BarChart3,
  FileText,
  Plus,
  Star,
  CreditCard,
  Sparkles,
  Clock,
  Activity,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { formatNaira } from "../components/QuizCard";
import { useAuth } from "../context/AuthContext";
import { supabase, type DbQuiz, type DbWalletTxn } from "../lib/supabase";

export { formatNaira };

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function sameMonth(iso: string, refDate: Date) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === refDate.getUTCFullYear() &&
    d.getUTCMonth() === refDate.getUTCMonth()
  );
}

function firstName(full: string) {
  return full.split(" ")[0] ?? full;
}

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function quizRevenue(q: DbQuiz) {
  return Math.round(Number(q.attempt_count || 0) * Number(q.price) * 0.9);
}

export function CreatorDashboardPage() {
  const {
    currentUser,
    walletBalance,
    creatorEarningsBalance,
    creatorLifetimeEarnings,
    creatorThisMonthEarnings,
  } = useAuth();
  const now = useMemo(() => new Date(), []);
  const creatorId = currentUser.id;

  const [myQuizzes, setMyQuizzes] = useState<DbQuiz[]>([]);
  const [walletTxns, setWalletTxns] = useState<DbWalletTxn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.is_approved_creator) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [qRes, tRes] = await Promise.all([
        supabase
          .from("quizzes")
          .select("*")
          .eq("creator_id", creatorId)
          .order("created_at", { ascending: false }),
        supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", creatorId)
          .in("type", ["creator_earning", "payout"])
          .eq("status", "completed")
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setMyQuizzes(qRes.data ?? []);
      setWalletTxns(tRes.data ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [creatorId, currentUser.is_approved_creator]);

  const creatorTxns = walletTxns;

  const fetchedLifetime = useMemo(
    () =>
      Math.round(
        creatorTxns
          .filter((t) => t.type === "creator_earning")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0) * 100,
      ),
    [creatorTxns],
  );

  const fetchedThisMonth = useMemo(
    () =>
      Math.round(
        creatorTxns
          .filter(
            (t) => t.type === "creator_earning" && sameMonth(t.created_at, now),
          )
          .reduce((sum, t) => sum + Number(t.amount || 0), 0) * 100,
      ),
    [creatorTxns, now],
  );

  const lifetimeEarnings = creatorLifetimeEarnings || fetchedLifetime;
  const thisMonthEarnings = creatorThisMonthEarnings || fetchedThisMonth;
  const displayEarningsBalance = creatorEarningsBalance || walletBalance;
  const quizEarningsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of walletTxns) {
      if (
        t.type === "creator_earning" &&
        (t.status === "completed" || t.status === "success") &&
        t.related_quiz_id
      ) {
        const prev = map.get(t.related_quiz_id) ?? 0;
        map.set(
          t.related_quiz_id,
          prev + Math.round(Number(t.amount || 0) * 100),
        );
      }
    }
    return map;
  }, [walletTxns]);

  const totalAttempts = useMemo(
    () => myQuizzes.reduce((sum, q) => sum + Number(q.attempt_count || 0), 0),
    [myQuizzes],
  );

  const bestQuiz = useMemo(
    () =>
      myQuizzes.length
        ? myQuizzes.reduce((best, q) =>
            Number(q.attempt_count || 0) > Number(best.attempt_count || 0)
              ? q
              : best,
          )
        : null,
    [myQuizzes],
  );

  const activityItems = useMemo(() => {
    return creatorTxns.slice(0, 6);
  }, [creatorTxns]);

  const quizzesById = useMemo(
    () => new Map(myQuizzes.map((q) => [q.id, q])),
    [myQuizzes],
  );

  if (!currentUser.is_approved_creator) {
    return <Navigate to="/creator/apply" replace />;
  }

  const userFirst = firstName(currentUser.full_name);
  const publishedCount = myQuizzes.filter((q) => q.is_published).length;
  const draftCount = myQuizzes.filter((q) => !q.is_published).length;

  if (loading) {
    return (
      <PageContainer className="!max-w-[1160px]">
        <div className="space-y-7 lg:space-y-9">
          <div className="h-24 w-full rounded-2xl bg-surface/50 animate-pulse" />
          <div className="h-56 w-full rounded-3xl bg-surface/50 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-surface/50 animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 w-full rounded-3xl bg-surface/50 animate-pulse" />
          <div className="h-72 w-full rounded-3xl bg-surface/50 animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="!max-w-[1160px]">
      <div className="space-y-7 lg:space-y-9">
        <section className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" size="sm" dot>
                <Sparkles className="w-3 h-3" />
                Creator mode
              </Badge>
            </div>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Creator Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-md leading-relaxed">
              {greetingByTime()}, {userFirst}. Here's how your quizzes are
              doing.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end shrink-0">
            <Link to="/creator/quizzes/new">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4" />
                Create quiz
              </Button>
            </Link>
            <Link to="/creator/quizzes">
              <Button variant="outline" size="md">
                <FileText className="w-4 h-4" />
                My quizzes
              </Button>
            </Link>
          </div>
        </section>

        <section>
          <Card
            padded={false}
            className="relative overflow-hidden bg-secondary text-cream border-secondary/40 shadow-elevated"
          >
            <div className="absolute inset-0 opacity-[0.10] pointer-events-none">
              <div className="absolute -top-12 -right-8 h-52 w-52 rounded-full bg-cream" />
              <div className="absolute -bottom-14 -left-6 h-60 w-60 rounded-full bg-cream" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-primary/30" />
            </div>

            <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div className="min-w-0">
                  <Badge
                    variant="muted"
                    size="sm"
                    className="!bg-cream/15 !text-cream !border-cream/25 backdrop-blur"
                    dot
                  >
                    <Banknote className="w-3 h-3" />
                    Earnings balance
                  </Badge>
                  <p className="mt-3 font-heading font-bold text-[34px] sm:text-[40px] lg:text-[44px] leading-none tracking-tight">
                    {formatNaira(displayEarningsBalance)}
                  </p>
                  <p className="mt-2 text-[13px] text-cream/75 max-w-sm leading-relaxed">
                    Accumulated earnings after payouts. Request a payout to
                    transfer to your bank.
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-center">
                  <Link to="/creator/payouts">
                    <button className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-cream text-secondary font-heading font-semibold shadow-card active:scale-[0.98] transition-all hover:bg-cream/95 whitespace-nowrap">
                      <CreditCard
                        className="w-[17px] h-[17px]"
                        strokeWidth={2.2}
                      />
                      Request Payout
                    </button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
                <EarningsStatChip
                  label="Total quizzes"
                  value={String(myQuizzes.length)}
                  icon={<FileText className="w-4 h-4" />}
                />
                <EarningsStatChip
                  label="Total attempts"
                  value={totalAttempts.toLocaleString("en-NG")}
                  icon={<Users className="w-4 h-4" />}
                />
                <EarningsStatChip
                  label="Lifetime earned"
                  value={formatNaira(lifetimeEarnings)}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </div>
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          <Card padded className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-warning/12 text-warning flex items-center justify-center shrink-0">
                <Star className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Best quiz
                </p>
                <p className="font-heading font-bold text-base text-text leading-snug mt-0.5 line-clamp-2">
                  {bestQuiz ? bestQuiz.title : "—"}
                </p>
              </div>
            </div>
            {bestQuiz && (
              <p className="text-xs text-text-soft leading-relaxed">
                {Number(bestQuiz.attempt_count || 0).toLocaleString("en-NG")}{" "}
                attempts&nbsp;·&nbsp;
                {formatNaira(quizEarningsMap.get(bestQuiz.id) ?? 0)} earned
              </p>
            )}
          </Card>

          <Card padded className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-success/12 text-success flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  This month
                </p>
                <p className="font-heading font-bold text-xl text-text leading-none mt-1">
                  {formatNaira(thisMonthEarnings)}
                </p>
              </div>
            </div>
            <p className="text-xs text-text-soft leading-relaxed">
              Earnings credited in{" "}
              {now.toLocaleDateString("en-NG", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </Card>

          <Card padded className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-primary/12 text-primary flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Quiz status
                </p>
                <p className="font-heading font-bold text-xl text-text leading-none mt-1">
                  {publishedCount} published
                </p>
              </div>
            </div>
            <p className="text-xs text-text-soft leading-relaxed">
              {draftCount} draft{draftCount !== 1 ? "s" : ""} waiting to go live
            </p>
          </Card>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm" dot>
                  <FileText className="w-3 h-3" />
                  {myQuizzes.length} quizzes
                </Badge>
              </div>
              <h2 className="mt-2 font-heading font-semibold text-xl lg:text-[22px] text-text tracking-tight leading-tight">
                My quizzes
              </h2>
              <p className="mt-1 text-sm text-text-soft leading-relaxed">
                A quick look at your top quizzes by attempt count.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/creator/quizzes/new">
                <Button variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  New quiz
                </Button>
              </Link>
              <Link to="/creator/quizzes">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <Card
            padded={false}
            className="overflow-hidden divide-y divide-border/40"
          >
            {myQuizzes
              .slice()
              .sort(
                (a, b) =>
                  Number(b.attempt_count || 0) - Number(a.attempt_count || 0),
              )
              .slice(0, 4)
              .map((quiz) => (
                <QuizRow
                  key={quiz.id}
                  quiz={quiz}
                  revenue={quizEarningsMap.get(quiz.id) ?? 0}
                />
              ))}
            {myQuizzes.length === 0 && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-3xl bg-surface/80 text-muted flex items-center justify-center mb-4 shadow-card ring-1 ring-border/50">
                  <FileText className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text">
                  No quizzes yet
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-sm leading-relaxed">
                  Create your first quiz to start seeing stats here.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm" dot>
                  <Activity className="w-3 h-3" />
                  Activity
                </Badge>
              </div>
              <h2 className="mt-2 font-heading font-semibold text-xl lg:text-[22px] text-text tracking-tight leading-tight">
                Recent activity
              </h2>
              <p className="mt-1 text-sm text-text-soft leading-relaxed">
                Latest earnings and payouts across your quizzes.
              </p>
            </div>
            <Link to="/creator/payouts">
              <Button variant="ghost" size="sm">
                Payout history
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <Card
            padded={false}
            className="overflow-hidden divide-y divide-border/40"
          >
            {activityItems.length === 0 ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-3xl bg-surface/80 text-muted flex items-center justify-center mb-4 shadow-card ring-1 ring-border/50">
                  <LayoutDashboard className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text">
                  No activity yet
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-sm leading-relaxed">
                  Earnings and payout activity will appear here once your
                  quizzes start getting attempts.
                </p>
              </div>
            ) : (
              activityItems.map((txn) => (
                <ActivityRow
                  key={txn.id}
                  txn={txn}
                  quizTitle={
                    txn.related_quiz_id
                      ? quizzesById.get(txn.related_quiz_id)?.title
                      : undefined
                  }
                />
              ))
            )}
          </Card>
        </section>
      </div>
    </PageContainer>
  );
}

function EarningsStatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-cream/10 border border-cream/15 p-2.5 sm:p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 sm:gap-2 text-cream/80">
        <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-xl bg-cream/15 flex items-center justify-center text-cream shrink-0">
          {icon}
        </span>
        <p className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.12em] sm:tracking-[0.14em] font-heading font-semibold leading-tight">
          {label}
        </p>
      </div>
      <p className="mt-1.5 sm:mt-2 font-heading font-bold text-base sm:text-xl leading-none text-cream break-words">
        {value}
      </p>
    </div>
  );
}

function QuizRow({ quiz, revenue }: { quiz: DbQuiz; revenue: number }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 min-h-[64px] hover:bg-surface/30 transition-colors">
      <div
        className={`h-2.5 w-2.5 rounded-full shrink-0 mt-0.5 ${
          quiz.is_published ? "bg-success" : "bg-muted/60"
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading font-semibold text-[14px] sm:text-[15px] text-text leading-tight truncate">
            {quiz.title}
          </p>
          <Badge variant={quiz.is_published ? "success" : "muted"} size="sm">
            {quiz.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
        <p className="mt-0.5 text-[12px] sm:text-[13px] text-text-soft">
          {Number(quiz.attempt_count || 0).toLocaleString("en-NG")} attempts
          &nbsp;·&nbsp;
          {formatNaira(Number(quiz.price))} per access
        </p>
      </div>

      <div className="shrink-0 text-right hidden sm:block">
        <p className="font-heading font-bold text-[15px] text-text leading-none">
          {formatNaira(revenue)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted font-heading font-medium">
          revenue
        </p>
      </div>
    </div>
  );
}

function ActivityRow({
  txn,
  quizTitle,
}: {
  txn: DbWalletTxn;
  quizTitle?: string;
}) {
  const isEarning = txn.type === "creator_earning";

  const title = isEarning
    ? `Earning from "${quizTitle ?? "a quiz"}"`
    : "Payout processed";

  const sub = isEarning
    ? `Quiz access purchased · ${relativeTime(txn.created_at)}`
    : `Transferred to bank · ${relativeTime(txn.created_at)}`;

  return (
    <div className="flex items-center gap-3.5 sm:gap-4 px-4 sm:px-5 py-3.5 min-h-[64px] hover:bg-surface/30 transition-colors">
      <div
        className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ring-1 ring-border/40 shadow-card ${
          isEarning
            ? "bg-success/12 text-success"
            : "bg-secondary/12 text-secondary"
        }`}
      >
        {isEarning ? (
          <TrendingUp className="w-5 h-5" strokeWidth={2.1} />
        ) : (
          <CreditCard className="w-5 h-5" strokeWidth={2.1} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-[14px] sm:text-[15px] text-text leading-tight line-clamp-1">
          {title}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] sm:text-[13px] text-text-soft">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{sub}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`font-heading font-bold text-[15px] leading-none ${
            isEarning ? "text-success" : "text-text"
          }`}
        >
          {isEarning ? "+" : "−"}
          {formatNaira(Math.abs(Number(txn.amount)) * 100)}
        </p>
      </div>
    </div>
  );
}
