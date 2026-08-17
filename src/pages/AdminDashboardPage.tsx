/**
 * AdminDashboardPage — /admin
 *
 * Platform-wide overview for admin users:
 *   1. Pending Items queue (most important — shown first)
 *   2. Platform-wide stat cards
 *   3. Recent platform activity feed
 *   4. Platform revenue trend chart (last 30 days)
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  Wallet,
  BarChart2,
  FileText,
  ListChecks,
  CreditCard,
  Flag,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Repeat2,
  UserCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { DbProfile, DbQuiz, DbWalletTxn, DbPayoutRequest, DbReport, DbCreatorApplication } from "../lib/supabase";
import { AdminLoadingState } from "../hooks/useAdminData";

// Wallet and payout ledger amounts are stored in naira. Quiz prices use kobo,
// so the shared quiz-price formatter must not be used for these values.
function formatLedgerNaira(amount: number) {
  const base =
    "₦" + Math.abs(amount).toLocaleString("en-NG", { maximumFractionDigits: 2 });
  return amount < 0 ? "-" + base : base;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone?: "primary" | "secondary" | "success" | "warning" | "muted";
}) {
  const toneClass: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    success: "bg-success-bg text-success border-success/20",
    warning: "bg-warning-bg text-warning border-warning/20",
    muted: "bg-surface text-muted border-border/50",
  };
  return (
    <Card padded={false} className="p-5 flex flex-col gap-3">
      <div
        className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${toneClass[tone]}`}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div>
        <p className="font-heading font-bold text-2xl text-text leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-muted font-heading mt-0.5">{sub}</p>}
        <p className="text-xs text-text-soft mt-1">{label}</p>
      </div>
    </Card>
  );
}

// ─── Pending action card ──────────────────────────────────────────────────────

function PendingCard({
  label,
  count,
  to,
  icon: Icon,
  tone = "warning",
}: {
  label: string;
  count: number;
  to: string;
  icon: React.ElementType;
  tone?: "warning" | "danger" | "primary";
}) {
  const toneMap: Record<
    string,
    { bar: string; bg: string; badge: string; text: string; btn: string }
  > = {
    warning: {
      bar: "bg-warning",
      bg: "bg-warning-bg/40 border-warning/20",
      badge: "bg-warning-bg text-warning border-warning/30",
      text: "text-warning",
      btn: "hover:bg-warning-bg/60",
    },
    danger: {
      bar: "bg-danger",
      bg: "bg-danger-bg/30 border-danger/20",
      badge: "bg-danger-bg text-danger border-danger/30",
      text: "text-danger",
      btn: "hover:bg-danger-bg/40",
    },
    primary: {
      bar: "bg-primary",
      bg: "bg-primary/5 border-primary/15",
      badge: "bg-primary/10 text-primary border-primary/20",
      text: "text-primary",
      btn: "hover:bg-primary/8",
    },
  };
  const t = toneMap[tone];

  if (count === 0) {
    return (
      <Card
        padded={false}
        className="p-5 flex items-center gap-4 border-border/40"
      >
        <div className="h-10 w-10 rounded-xl bg-success-bg border border-success/20 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-sm text-text leading-tight">
            All caught up
          </p>
          <p className="text-xs text-muted mt-0.5">{label}</p>
        </div>
      </Card>
    );
  }

  return (
    <Link to={to} className="block group">
      <Card
        padded={false}
        hover
        className={`relative overflow-hidden flex items-center gap-4 p-5 border ${t.bg} transition-colors ${t.btn}`}
      >
        {/* colored left bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.bar}`} />

        <div
          className={`ml-2 h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${t.badge}`}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`font-heading font-bold text-2xl leading-none ${t.text}`}
          >
            {count}
          </p>
          <p className="text-sm font-heading font-medium text-text mt-0.5 leading-snug">
            {label}
          </p>
        </div>

        <ChevronRight
          className={`w-5 h-5 shrink-0 ${t.text} group-hover:translate-x-0.5 transition-transform`}
        />
      </Card>
    </Link>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  icon: React.ElementType;
  iconTone: string;
  label: string;
  meta: string;
  ts: string;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div
        className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${item.iconTone}`}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-medium text-text leading-snug">
          {item.label}
        </p>
        <p className="text-xs text-muted mt-0.5">{item.meta}</p>
      </div>
      <span className="text-[11px] text-muted font-heading shrink-0 mt-0.5">
        {relativeTime(item.ts)}
      </span>
    </div>
  );
}

// ─── Revenue tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cream border border-border/60 rounded-2xl shadow-elevated px-3.5 py-2.5">
      <p className="text-[11px] font-heading font-semibold text-muted uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="font-heading font-bold text-base text-primary">
        {formatLedgerNaira(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Dashboard data shape ─────────────────────────────────────────────────────

interface DashboardData {
  profiles: DbProfile[];
  quizzes: DbQuiz[];
  attemptCount: number;
  txns: DbWalletTxn[];
  payouts: DbPayoutRequest[];
  applications: DbCreatorApplication[];
  reports: DbReport[];
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const { currentUser } = useAuth();

  // Gate: only admin role
  if (currentUser.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  // ── Fetch all dashboard data ───────────────────────────────────────────────

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, quizzesRes, attemptCountRes, txnsRes, payoutsRes, appsRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("quizzes").select("*"),
        supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
        supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("payout_requests").select("*").order("requested_at", { ascending: false }),
        supabase.from("creator_applications").select("*").order("submitted_at", { ascending: false }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
      ]);

      setData({
        profiles: profilesRes.data || [],
        quizzes: quizzesRes.data || [],
        attemptCount: attemptCountRes.count || 0,
        txns: txnsRes.data || [],
        payouts: payoutsRes.data || [],
        applications: appsRes.data || [],
        reports: reportsRes.data || [],
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <PageContainer className="max-w-290!">
        <AdminLoadingState label="Loading dashboard…" />
      </PageContainer>
    );
  }

  const { profiles: allProfiles, quizzes: allQuizzes, attemptCount: totalAttempts, txns: allTxns, payouts: allPayouts, applications: allApplications, reports: allReports } = data;

  // ── Platform stats ──────────────────────────────────────────────────────────

  const totalUsers = allProfiles.filter((p) => p.role === "user").length;
  const totalCreators = allProfiles.filter((p) => p.is_approved_creator && p.role !== "admin").length;
  const publishedQuizzes = allQuizzes.filter((q) => q.is_published).length;

  const platformRevenue = allTxns
    .filter((t) => t.type === "platform_revenue" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalTopUps = allTxns
    .filter((t) => t.type === "topup" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // ── Pending items ──────────────────────────────────────────────────────────

  const pendingApplications = allApplications.filter((a) => a.status === "pending").length;
  const pendingPayouts = allPayouts.filter((p) => p.status === "pending").length;
  const openReports = allReports.filter((r) => r.status === "open").length;

  // ── Revenue trend (last 30 days, grouped by 4-day buckets) ─────────────────

  const now = new Date();
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const byDay: Record<string, number> = {};
  allTxns
    .filter(
      (t) =>
        t.type === "platform_revenue" &&
        t.status === "completed" &&
        new Date(t.created_at) >= cutoff,
    )
    .forEach((t) => {
      const day = t.created_at.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + Number(t.amount);
    });

  const revenueTrendData: { label: string; revenue: number }[] = [];
  for (let i = 0; i < 30; i += 4) {
    const start = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
    const end = new Date(cutoff.getTime() + Math.min(i + 4, 30) * 24 * 60 * 60 * 1000);
    const label = start.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    let total = 0;
    for (const [dayStr, amt] of Object.entries(byDay)) {
      const d = new Date(dayStr);
      if (d >= start && d < end) total += amt;
    }
    revenueTrendData.push({ label, revenue: total });
  }

  // ── Activity feed ──────────────────────────────────────────────────────────

  const activityItems: ActivityItem[] = [];

  // New user signups
  allProfiles
    .filter((p) => p.role === "user" && p.created_at)
    .forEach((p) => {
      activityItems.push({
        id: `signup-${p.id}`,
        icon: Users,
        iconTone: "bg-primary/10 text-primary",
        label: `${p.full_name} joined`,
        meta: "New user sign-up",
        ts: p.created_at,
      });
    });

  // Creator approvals
  allApplications
    .filter((a) => a.status === "approved")
    .forEach((a) => {
      const profile = allProfiles.find((p) => p.id === a.user_id);
      activityItems.push({
        id: `approved-${a.id}`,
        icon: UserCheck,
        iconTone: "bg-success-bg text-success",
        label: `${profile?.full_name ?? "A creator"} approved as creator`,
        meta: "Creator application approved",
        ts: a.submitted_at,
      });
    });

  // Published quizzes
  allQuizzes
    .filter((q) => q.is_published)
    .slice(0, 6)
    .forEach((q) => {
      const creator = allProfiles.find((p) => p.id === q.creator_id);
      activityItems.push({
        id: `quiz-${q.id}`,
        icon: BookOpen,
        iconTone: "bg-secondary/10 text-secondary",
        label: `"${q.title.length > 40 ? q.title.slice(0, 40) + "…" : q.title}" published`,
        meta: `by ${creator?.full_name ?? "Unknown"}`,
        ts: q.created_at,
      });
    });

  // Paid payouts
  allPayouts
    .filter((p) => p.status === "paid" && p.processed_at)
    .forEach((p) => {
      const creator = allProfiles.find((pr) => pr.id === p.creator_id);
      activityItems.push({
        id: `payout-${p.id}`,
        icon: CreditCard,
        iconTone: "bg-success-bg text-success",
        label: `Payout of ${formatLedgerNaira(Number(p.amount))} processed`,
        meta: `to ${creator?.full_name ?? "creator"}`,
        ts: p.processed_at!,
      });
    });

  // Open reports
  allReports
    .filter((r) => r.status === "open")
    .forEach((r) => {
      const quizTitle = (r as unknown as { quiz_title?: string }).quiz_title || "a quiz";
      activityItems.push({
        id: `report-${r.id}`,
        icon: Flag,
        iconTone: "bg-danger-bg text-danger",
        label: `Report filed on "${quizTitle.length > 36 ? quizTitle.slice(0, 36) + "…" : quizTitle}"`,
        meta: `Reason: ${r.reason.replace(/_/g, " ")}`,
        ts: r.created_at,
      });
    });

  // Pending payout requests
  allPayouts
    .filter((p) => p.status === "pending")
    .forEach((p) => {
      const creator = allProfiles.find((pr) => pr.id === p.creator_id);
      activityItems.push({
        id: `payout-req-${p.id}`,
        icon: Wallet,
        iconTone: "bg-warning-bg text-warning",
        label: `Payout request: ${formatLedgerNaira(Number(p.amount))}`,
        meta: `from ${creator?.full_name ?? "creator"} — awaiting review`,
        ts: p.requested_at,
      });
    });

  // Sort by most recent first, take top 9
  const activityFeed = activityItems
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, 9);

  const hasPendingItems =
    pendingApplications > 0 || pendingPayouts > 0 || openReports > 0;

  return (
    <PageContainer className="max-w-290!">
      <div className="space-y-7 lg:space-y-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Admin Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-lg leading-relaxed">
              Platform overview and pending items. All data is live.
            </p>
          </div>
          {hasPendingItems && (
            <div className="shrink-0 hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-warning-bg border border-warning/20">
              <AlertCircle
                className="w-4 h-4 text-warning shrink-0"
                strokeWidth={2}
              />
              <span className="text-xs font-heading font-semibold text-warning">
                {pendingApplications + pendingPayouts + openReports} items need
                attention
              </span>
            </div>
          )}
        </div>

        {/* ── 1. Pending Items (priority section) ──────────────────────────── */}
        <section>
          <h2 className="font-heading font-bold text-base text-text mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-warning inline-block" />
            Action Queue
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <PendingCard
              label="Pending Creator Applications"
              count={pendingApplications}
              to="/admin/applications"
              icon={ListChecks}
              tone="warning"
            />
            <PendingCard
              label="Pending Payout Requests"
              count={pendingPayouts}
              to="/admin/payouts"
              icon={CreditCard}
              tone="primary"
            />
            <PendingCard
              label="Open Reports"
              count={openReports}
              to="/admin/reports"
              icon={Flag}
              tone="danger"
            />
          </div>
        </section>

        {/* ── 2. Platform-wide stats ────────────────────────────────────────── */}
        <section>
          <h2 className="font-heading font-bold text-base text-text mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-primary inline-block" />
            Platform Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            <StatCard
              label="Total Users"
              value={totalUsers}
              icon={Users}
              tone="primary"
            />
            <StatCard
              label="Approved Creators"
              value={totalCreators}
              icon={UserCheck}
              tone="secondary"
            />
            <StatCard
              label="Published Quizzes"
              value={publishedQuizzes}
              sub={`of ${allQuizzes.length} total`}
              icon={BookOpen}
              tone="muted"
            />
            <StatCard
              label="Total Attempts"
              value={totalAttempts}
              icon={Repeat2}
              tone="muted"
            />
            <StatCard
              label="Platform Revenue"
              value={formatLedgerNaira(platformRevenue)}
              sub="PrepUniv's 35% cut"
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Total Top-ups"
              value={formatLedgerNaira(totalTopUps)}
              sub="Gross money in"
              icon={Wallet}
              tone="warning"
            />
          </div>
        </section>

        {/* ── 3. Revenue trend + Activity feed (2-col on lg) ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">
          {/* Revenue chart (spans 3 cols) */}
          <div className="lg:col-span-3">
            <h2 className="font-heading font-bold text-base text-text mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-success inline-block" />
              Revenue Trend — Last 30 Days
            </h2>
            <Card padded={false} className="p-5">
              {revenueTrendData.every((d) => d.revenue === 0) ? (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                  <BarChart2 className="w-8 h-8 text-muted" strokeWidth={1.5} />
                  <p className="text-sm text-muted">No revenue data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={revenueTrendData}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="adminRevGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-success)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-success)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      strokeOpacity={0.5}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 11,
                        fontFamily: "var(--font-heading)",
                        fill: "var(--color-muted)",
                      }}
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fontFamily: "var(--font-heading)",
                        fill: "var(--color-muted)",
                      }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatLedgerNaira(v)}
                      width={64}
                    />
                    <Tooltip
                      content={<RevenueTooltip />}
                      cursor={{
                        stroke: "var(--color-success)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-success)"
                      strokeWidth={2.5}
                      fill="url(#adminRevGrad)"
                      dot={{
                        r: 4,
                        fill: "var(--color-success)",
                        stroke: "var(--color-cream)",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 5,
                        fill: "var(--color-success)",
                        stroke: "var(--color-cream)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Activity feed (spans 2 cols) */}
          <div className="lg:col-span-2">
            <h2 className="font-heading font-bold text-base text-text mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-secondary inline-block" />
              Recent Activity
            </h2>
            <Card padded={false} className="px-5 py-1">
              {activityFeed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <Sparkles className="w-7 h-7 text-muted" strokeWidth={1.5} />
                  <p className="text-sm text-muted">No activity yet</p>
                </div>
              ) : (
                activityFeed.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))
              )}
            </Card>
          </div>
        </div>

        {/* ── 4. Quick links to all admin sections ─────────────────────────── */}
        <section>
          <h2 className="font-heading font-bold text-base text-text mb-3 flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-muted inline-block" />
            Admin Sections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Applications",
                to: "/admin/applications",
                icon: ListChecks,
                count: pendingApplications,
              },
              {
                label: "Payouts",
                to: "/admin/payouts",
                icon: CreditCard,
                count: pendingPayouts,
              },
              {
                label: "Reports",
                to: "/admin/reports",
                icon: Flag,
                count: openReports,
              },
              { label: "Users", to: "/admin/users", icon: Users, count: 0 },
              {
                label: "Courses",
                to: "/admin/courses",
                icon: BookOpen,
                count: 0,
              },
              {
                label: "Quizzes",
                to: "/admin/quizzes",
                icon: FileText,
                count: 0,
              },
            ].map(({ label, to, icon: Icon, count }) => (
              <Link key={to} to={to} className="group">
                <Card
                  hover
                  padded={false}
                  className="p-4 flex flex-col items-center text-center gap-2.5 transition-colors"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center group-hover:bg-primary/8 group-hover:border-primary/20 transition-colors">
                      <Icon
                        className="w-5 h-5 text-text-soft group-hover:text-primary transition-colors"
                        strokeWidth={1.9}
                      />
                    </div>
                    {count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-warning text-cream text-[10px] font-heading font-bold flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-heading font-semibold text-text-soft group-hover:text-text transition-colors">
                    {label}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
