/**
 * AdminReportsPage — /admin/reports
 *
 * Review, resolve, dismiss, and optionally unpublish quizzes from reports.
 * Filter tabs: Open / Resolved / Dismissed / All
 * Repeat-reporter detection: reporters with 3+ reports this month get a tag.
 */
import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Flag,
  ChevronRight,
  CheckCircle2,
  MinusCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  EyeOff,
  Info,
  BookOpen,
  User,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { DrawerShell } from "../components/DrawerShell";
import { useAuth } from "../context/AuthContext";
import {
  creatorReports,
  updateCreatorReport,
  quizzes as allQuizzes,
  profiles,
  type CreatorReport,
  type Profile,
} from "../mock";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "open" | "resolved" | "dismissed" | "all";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

const REASON_LABELS: Record<string, string> = {
  incorrect_answers: "Incorrect Answers",
  low_quality: "Low Quality",
  inappropriate: "Inappropriate",
  copyright: "Copyright",
  other: "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: CreatorReport["status"] }) {
  if (status === "open")
    return (
      <Badge variant="warning" size="sm" dot>
        Open
      </Badge>
    );
  if (status === "resolved")
    return (
      <Badge variant="success" size="sm" dot>
        Resolved
      </Badge>
    );
  return (
    <Badge variant="muted" size="sm" dot>
      Dismissed
    </Badge>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  const isSevere = reason === "copyright" || reason === "incorrect_answers";
  return (
    <Badge variant={isSevere ? "danger" : "muted"} size="sm">
      {REASON_LABELS[reason] ?? reason}
    </Badge>
  );
}

/** Count how many reports a given user filed in the current month. */
function useRepeatReporterMap(reports: CreatorReport[], versionKey: number) {
  return useMemo(() => {
    const now = new Date("2026-08-06T00:00:00Z");
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const countsByUser: Record<string, number> = {};
    reports.forEach((r) => {
      if (new Date(r.created_at).getTime() >= monthStart) {
        countsByUser[r.reporter_id] = (countsByUser[r.reporter_id] ?? 0) + 1;
      }
    });
    return countsByUser;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionKey]);
}

// ─── Review sheet ─────────────────────────────────────────────────────────────

function ReportReviewSheet({
  report,
  reporter,
  reporterMonthlyCount,
  onClose,
  onResolved,
  onDismissed,
}: {
  report: CreatorReport;
  reporter: Profile | undefined;
  reporterMonthlyCount: number;
  onClose: () => void;
  onResolved: (id: string) => void;
  onDismissed: (id: string) => void;
}) {
  const isOpen = report.status === "open";

  const quiz = useMemo(
    () => allQuizzes.find((q) => q.id === report.quiz_id),
    [report.quiz_id],
  );
  const quizCreator = useMemo(
    () => (quiz ? profiles.find((p) => p.id === quiz.creator_id) : undefined),
    [quiz],
  );

  // Resolve flow
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Dismiss flow
  const [showDismissForm, setShowDismissForm] = useState(false);
  const [dismissNotes, setDismissNotes] = useState("");
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Unpublish flow
  const [showUnpublish, setShowUnpublish] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [unpublished, setUnpublished] = useState(
    quiz ? !quiz.is_published : false,
  );

  async function handleResolve() {
    setResolving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateCreatorReport(
      report.id,
      "resolved",
      resolveNotes.trim() || undefined,
    );
    setResolving(false);
    onResolved(report.id);
  }

  async function handleDismiss() {
    setDismissing(true);
    await new Promise((r) => setTimeout(r, 600));
    updateCreatorReport(
      report.id,
      "dismissed",
      dismissNotes.trim() || undefined,
    );
    setDismissing(false);
    onDismissed(report.id);
  }

  async function handleUnpublish() {
    setUnpublishing(true);
    await new Promise((r) => setTimeout(r, 700));
    if (quiz) quiz.is_published = false;
    setUnpublished(true);
    setUnpublishing(false);
    setShowUnpublish(false);
  }

  const reporterName = reporter?.full_name ?? `User ${report.reporter_id}`;
  const isRepeatReporter = reporterMonthlyCount >= 3;

  return (
    <DrawerShell open={true} onClose={onClose} ariaLabel="Report review">
      <DrawerShell.Header
        icon={<Flag className="w-5 h-5" strokeWidth={2} />}
        iconClassName="bg-danger-bg text-danger"
        title={
          <h2 className="font-heading font-bold text-sm text-text leading-tight line-clamp-1">
            {report.quiz_title}
          </h2>
        }
        statusBadge={<StatusBadge status={report.status} />}
        meta={`Reported ${formatDate(report.created_at)}`}
        onClose={onClose}
      />

      <DrawerShell.Body>
        {/* Reporter */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface/40 border border-border/40">
          <Avatar name={reporterName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-text leading-tight">
              {reporterName}
            </p>
            <p className="text-xs text-muted">
              {reporter?.email ?? report.reporter_id}
            </p>
          </div>
          {isRepeatReporter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-warning-bg border border-warning/20 text-[10px] font-heading font-semibold text-warning shrink-0">
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {reporterMonthlyCount} reports this month
            </span>
          )}
        </div>

        {/* Reason + details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ReasonBadge reason={report.reason} />
            {report.other_text && report.reason === "other" && (
              <span className="text-xs text-text-soft">
                — {report.other_text}
              </span>
            )}
          </div>
          {report.details && (
            <p className="text-sm text-text-soft leading-relaxed bg-surface/40 rounded-xl px-4 py-3 border border-border/40">
              {report.details}
            </p>
          )}
        </div>

        {/* Quiz & creator context */}
        <div className="rounded-2xl border border-border/40 bg-surface/20 divide-y divide-border/30 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <BookOpen
              className="w-4 h-4 text-muted shrink-0"
              strokeWidth={2}
            />
            <span className="text-xs text-muted font-heading font-semibold uppercase tracking-wider w-20 shrink-0">
              Quiz
            </span>
            <Link
              to={`/quiz/${report.quiz_id}`}
              className="text-sm text-primary hover:underline underline-offset-2 font-heading font-medium truncate"
            >
              {report.quiz_title}
            </Link>
          </div>
          {quizCreator && (
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="w-4 h-4 text-muted shrink-0" strokeWidth={2} />
              <span className="text-xs text-muted font-heading font-semibold uppercase tracking-wider w-20 shrink-0">
                Creator
              </span>
              <Link
                to={`/profile/creator/${quizCreator.id}`}
                className="text-sm text-primary hover:underline underline-offset-2 font-heading font-medium"
              >
                {quizCreator.full_name}
              </Link>
            </div>
          )}
          {unpublished && (
            <div className="flex items-center gap-3 px-4 py-3 bg-warning-bg/40">
              <EyeOff
                className="w-4 h-4 text-warning shrink-0"
                strokeWidth={2}
              />
              <span className="text-xs font-heading font-semibold text-warning">
                Quiz was unpublished by admin
              </span>
            </div>
          )}
        </div>

        {/* Resolution notes (decided) */}
        {report.status !== "open" &&
          report.other_text?.startsWith("Admin:") && (
            <div
              className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${
                report.status === "resolved"
                  ? "bg-success-bg border-success/20"
                  : "bg-surface/40 border-border/40"
              }`}
            >
              <Info
                className={`w-4 h-4 shrink-0 mt-0.5 ${report.status === "resolved" ? "text-success" : "text-muted"}`}
                strokeWidth={2}
              />
              <div>
                <p className="text-xs font-heading font-semibold text-muted uppercase tracking-wider mb-0.5">
                  Admin note
                </p>
                <p className="text-sm text-text leading-relaxed">
                  {report.other_text
                    .replace(/^Admin: /, "")
                    .replace(/ \| Admin: .*$/, "")}
                </p>
              </div>
            </div>
          )}
        {report.resolved_at && (
          <p className="text-xs text-muted flex items-center gap-1.5">
            <Clock className="w-3 h-3" strokeWidth={2} />
            {report.status === "resolved" ? "Resolved" : "Dismissed"}{" "}
            {formatDate(report.resolved_at)}
          </p>
        )}

        {/* ── Unpublish confirm ── */}
        {isOpen && !unpublished && showUnpublish && (
          <div className="rounded-2xl border border-warning/25 bg-warning-bg/40 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Unpublish &ldquo;
              <span className="font-heading font-semibold">
                {report.quiz_title}
              </span>
              &rdquo;? It will be hidden from Browse but existing owners keep
              access, per the pay-once policy.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnpublish(false)}
                disabled={unpublishing}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={unpublishing}
                onClick={handleUnpublish}
                className="border-warning/50 text-warning hover:bg-warning-bg"
              >
                {!unpublishing && <EyeOff className="w-3.5 h-3.5" />}
                Confirm unpublish
              </Button>
            </div>
          </div>
        )}

        {/* ── Resolve form ── */}
        {isOpen && showResolveForm && !confirmResolve && (
          <div className="rounded-2xl border border-border/50 bg-surface/30 p-4 space-y-3">
            <p className="text-sm font-heading font-semibold text-text">
              Action taken{" "}
              <span className="text-muted font-normal">(optional)</span>
            </p>
            <textarea
              rows={2}
              placeholder="What action was taken, if any? e.g. Creator notified, quiz corrected…"
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResolveForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmResolve(true)}
                className="border-success/40 text-success hover:bg-success-bg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Continue
              </Button>
            </div>
          </div>
        )}
        {isOpen && showResolveForm && confirmResolve && (
          <div className="rounded-2xl border border-success/25 bg-success-bg p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Mark this report as resolved?
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmResolve(false)}
                disabled={resolving}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={resolving}
                onClick={handleResolve}
              >
                {!resolving && <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm resolve
              </Button>
            </div>
          </div>
        )}

        {/* ── Dismiss form ── */}
        {isOpen && showDismissForm && !confirmDismiss && (
          <div className="rounded-2xl border border-border/50 bg-surface/30 p-4 space-y-3">
            <p className="text-sm font-heading font-semibold text-text">
              Dismissal reason{" "}
              <span className="text-muted font-normal">(optional)</span>
            </p>
            <textarea
              rows={2}
              placeholder="Why is this report being dismissed? e.g. Report not substantiated…"
              value={dismissNotes}
              onChange={(e) => setDismissNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed"
            />
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDismissForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDismiss(true)}
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Continue
              </Button>
            </div>
          </div>
        )}
        {isOpen && showDismissForm && confirmDismiss && (
          <div className="rounded-2xl border border-border/50 bg-surface/30 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Dismiss this report? No action will be taken on the quiz.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDismiss(false)}
                disabled={dismissing}
              >
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={dismissing}
                onClick={handleDismiss}
              >
                {!dismissing && <MinusCircle className="w-3.5 h-3.5" />}
                Confirm dismiss
              </Button>
            </div>
          </div>
        )}
      </DrawerShell.Body>

      {/* Footer */}
      {isOpen && !showResolveForm && !showDismissForm && !showUnpublish && (
        <DrawerShell.Footer className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={() => {
                setShowDismissForm(true);
                setShowResolveForm(false);
              }}
            >
              <MinusCircle className="w-4 h-4" />
              Dismiss
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => {
                setShowResolveForm(true);
                setShowDismissForm(false);
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Resolve
            </Button>
          </div>
          {!unpublished && quiz?.is_published && (
            <button
              type="button"
              onClick={() => setShowUnpublish(true)}
              className="w-full h-9 rounded-xl text-xs font-heading font-semibold border border-warning/40 text-warning hover:bg-warning-bg transition-colors flex items-center justify-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Unpublish quiz
            </button>
          )}
        </DrawerShell.Footer>
      )}
      {!isOpen && (
        <DrawerShell.Footer>
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            Close
          </Button>
        </DrawerShell.Footer>
      )}
    </DrawerShell>
  );
}

// ─── Report row ───────────────────────────────────────────────────────────────

function ReportRow({
  report,
  reporter,
  reporterMonthlyCount,
  onReview,
}: {
  report: CreatorReport;
  reporter: Profile | undefined;
  reporterMonthlyCount: number;
  onReview: () => void;
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3.5 px-5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      {/* Reason icon */}
      <div
        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
          report.reason === "copyright" || report.reason === "incorrect_answers"
            ? "bg-danger-bg text-danger"
            : "bg-surface text-muted"
        }`}
      >
        <Flag className="w-4 h-4" strokeWidth={2} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/quiz/${report.quiz_id}`}
            className="font-heading font-semibold text-sm text-text hover:text-primary hover:underline underline-offset-2 transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {report.quiz_title}
          </Link>
          <StatusBadge status={report.status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <ReasonBadge reason={report.reason} />
          {reporterMonthlyCount >= 3 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-heading font-semibold text-warning bg-warning-bg border border-warning/20 px-1.5 py-0.5 rounded-md">
              <AlertCircle className="w-3 h-3" strokeWidth={2} />
              {reporterMonthlyCount} reports/month
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">
          <Clock className="w-3 h-3 inline-block mr-1" strokeWidth={2} />
          {formatDate(report.created_at)}
          <span className="mx-1">·</span>
          by {reporter?.full_name ?? report.reporter_id}
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onReview}
        className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border border-border/60 bg-cream text-text hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
      >
        Review
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const msgs: Record<FilterTab, { heading: string; sub: string }> = {
    open: {
      heading: "No open reports",
      sub: "All reports have been reviewed — great work.",
    },
    resolved: {
      heading: "No resolved reports yet",
      sub: "Resolved reports will appear here.",
    },
    dismissed: {
      heading: "No dismissed reports",
      sub: "Dismissed reports will appear here.",
    },
    all: {
      heading: "No reports yet",
      sub: "Reports filed by users will appear here.",
    },
  };
  const { heading, sub } = msgs[tab];
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <Flag className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">{heading}</h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        {sub}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminReportsPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("open");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  const profilesById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const repeatMap = useRepeatReporterMap(creatorReports, version);

  const filtered = useMemo(() => {
    const sorted = [...creatorReports].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (activeTab === "all") return sorted;
    return sorted.filter((r) => r.status === activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, version]);

  const counts = useMemo(
    () => ({
      open: creatorReports.filter((r) => r.status === "open").length,
      resolved: creatorReports.filter((r) => r.status === "resolved").length,
      dismissed: creatorReports.filter((r) => r.status === "dismissed").length,
      all: creatorReports.length,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [version],
  );

  const reviewingReport = reviewingId
    ? creatorReports.find((r) => r.id === reviewingId)
    : null;

  function handleResolved(id: string) {
    setVersion((v) => v + 1);
    setReviewingId(null);
    showToast({ message: "Report marked as resolved.", variant: "success" });
  }

  function handleDismissed(id: string) {
    setVersion((v) => v + 1);
    setReviewingId(null);
    showToast({ message: "Report dismissed." });
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

      <PageContainer className="max-w-240!">
        <div className="space-y-5 lg:space-y-6">
          {/* Header */}
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Reports
            </h1>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed">
              {counts.open > 0
                ? `${counts.open} open report${counts.open !== 1 ? "s" : ""} awaiting review.`
                : "No open reports — all clear."}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === tab.value
                    ? "bg-cream shadow-soft text-text"
                    : "text-text-soft hover:text-text"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${
                      tab.value === "open" && activeTab === "open"
                        ? "bg-warning text-cream"
                        : "bg-border text-muted"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <Card padded={false} className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              filtered.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  reporter={profilesById.get(report.reporter_id)}
                  reporterMonthlyCount={repeatMap[report.reporter_id] ?? 0}
                  onReview={() => setReviewingId(report.id)}
                />
              ))
            )}
          </Card>
        </div>
      </PageContainer>

      {reviewingReport && (
        <ReportReviewSheet
          report={reviewingReport}
          reporter={profilesById.get(reviewingReport.reporter_id)}
          reporterMonthlyCount={repeatMap[reviewingReport.reporter_id] ?? 0}
          onClose={() => setReviewingId(null)}
          onResolved={handleResolved}
          onDismissed={handleDismissed}
        />
      )}
    </>
  );
}
