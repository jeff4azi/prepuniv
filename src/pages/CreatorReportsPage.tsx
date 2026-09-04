import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Flag,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Sparkles,
  MessageSquare,
  Wrench,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import type {
  CreatorReport,
  CreatorReportStatus,
  ReportReason,
} from "../types";
import {
  useReports,
  useQuizzes,
  useCourses,
  AdminLoadingState,
} from "../hooks/useAdminData";
import { markNavSectionViewed } from "../hooks/useNavBadges";
import { apiFetch } from "../lib/api";

// ─── Config ───────────────────────────────────────────────────────────────────

type FilterTab = "all" | CreatorReportStatus;

const REASON_LABELS: Record<ReportReason, string> = {
  incorrect_answers: "Incorrect answers",
  low_quality: "Low quality",
  inappropriate: "Inappropriate content",
  copyright: "Copyright issue",
  other: "Other",
};

const STATUS_CONFIG: Record<
  CreatorReportStatus,
  {
    label: string;
    variant: "warning" | "success" | "muted";
    icon: React.ElementType;
  }
> = {
  open: { label: "Open", variant: "warning", icon: AlertCircle },
  resolved: { label: "Resolved", variant: "success", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", variant: "muted", icon: XCircle },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// A resolved report with resolution_notes is "actionable" — the creator needs
// to read the admin's feedback and fix their quiz.
function isActionable(r: CreatorReport) {
  return (
    r.status === "resolved" && !!r.resolution_notes && !r.creator_acknowledged
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreatorReportsPage() {
  const { currentUser } = useAuth();

  usePageTitle("Reports");

  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // All hooks before gate
  const {
    data: rawReports,
    loading: reportsLoading,
    refetch: refetchReports,
  } = useReports();
  const { data: rawQuizzes, loading: quizzesLoading } = useQuizzes();
  const { data: rawCourses, loading: coursesLoading } = useCourses();

  // Local optimistic acknowledge state: reportId → true
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set(),
  );

  // Mark this section as viewed on mount so the nav badge clears
  useEffect(() => {
    void markNavSectionViewed(currentUser.id, "creator_reports");
  }, [currentUser.id]);

  const allQuizzes = rawQuizzes || [];
  const allCourses = rawCourses || [];
  const reports = rawReports || [];

  const creatorQuizIds = useMemo(
    () =>
      new Set(
        allQuizzes
          .filter((q) => q.creator_id === currentUser.id)
          .map((q) => q.id),
      ),
    [allQuizzes, currentUser.id],
  );

  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [allCourses],
  );
  const quizzesById = useMemo(
    () => new Map(allQuizzes.map((q) => [q.id, q])),
    [allQuizzes],
  );

  const myReports = useMemo(
    () =>
      reports
        .filter((r) => creatorQuizIds.has(r.quiz_id))
        .map((r) => ({
          id: r.id,
          reporter_id: r.reporter_id || "",
          quiz_id: r.quiz_id,
          quiz_title:
            r.quiz_title ||
            quizzesById.get(r.quiz_id)?.title ||
            "Untitled Quiz",
          reason: (r.reason as ReportReason) || "other",
          other_text: r.other_text || undefined,
          details: r.details || undefined,
          resolution_notes:
            (r as unknown as CreatorReport).resolution_notes || undefined,
          creator_acknowledged:
            !!(r as unknown as CreatorReport).creator_acknowledged ||
            acknowledgedIds.has(r.id),
          status: (r.status as CreatorReportStatus) || "open",
          created_at: r.created_at,
          resolved_at: r.resolved_at || undefined,
        }))
        .sort((a, b) => {
          // Actionable reports float to the top within their group
          if (isActionable(a) && !isActionable(b)) return -1;
          if (!isActionable(a) && isActionable(b)) return 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }),
    [reports, creatorQuizIds, quizzesById, acknowledgedIds],
  );

  const filtered = useMemo(
    () =>
      activeTab === "all"
        ? myReports
        : myReports.filter((r) => r.status === activeTab),
    [myReports, activeTab],
  );

  const counts = useMemo(
    () => ({
      all: myReports.length,
      open: myReports.filter((r) => r.status === "open").length,
      resolved: myReports.filter((r) => r.status === "resolved").length,
      dismissed: myReports.filter((r) => r.status === "dismissed").length,
    }),
    [myReports],
  );

  const actionableCount = useMemo(
    () => myReports.filter(isActionable).length,
    [myReports],
  );

  const handleAcknowledge = useCallback(
    async (reportId: string) => {
      // Optimistic update
      setAcknowledgedIds((prev) => new Set([...prev, reportId]));
      const { error } = await apiFetch(
        `/api/creator/reports/${reportId}/acknowledge`,
        {
          method: "POST",
        },
      );
      if (error) {
        // Roll back on failure
        setAcknowledgedIds((prev) => {
          const next = new Set(prev);
          next.delete(reportId);
          return next;
        });
      } else {
        // Soft-refresh in the background to sync server state
        void refetchReports();
      }
    },
    [refetchReports],
  );

  if (!currentUser.is_approved_creator)
    return <Navigate to="/creator/apply" replace />;

  if (reportsLoading || quizzesLoading || coursesLoading) {
    return (
      <PageContainer className="max-w-225!">
        <AdminLoadingState label="Loading reports…" />
      </PageContainer>
    );
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "resolved", label: "Resolved", count: counts.resolved },
    { key: "dismissed", label: "Dismissed", count: counts.dismissed },
  ];

  return (
    <PageContainer className="max-w-225!">
      <div className="space-y-6 lg:space-y-7">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" size="sm" dot>
              <Sparkles className="w-3 h-3" />
              Creator mode
            </Badge>
          </div>
          <h1 className="font-heading font-bold text-2xl lg:text-[28px] text-text tracking-tight leading-tight">
            Reports on My Quizzes
          </h1>
          <p className="mt-1.5 text-sm text-text-soft max-w-lg leading-relaxed">
            Feedback and flags from learners, so you can review and improve.
          </p>
        </div>

        {/* ── Policy + role reminder ──────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-primary/8 border border-primary/15">
          <Info
            className="w-4 h-4 text-primary shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <div className="space-y-1">
            <p className="text-sm text-text leading-relaxed">
              <span className="font-semibold">
                Reports are for you to review and fix.
              </span>{" "}
              PrepUniv doesn't refund learners for flawed content, so keeping
              your quizzes accurate matters — every report is an opportunity to
              improve your quiz before more learners are affected.
            </p>
            <p className="text-sm text-text-soft leading-relaxed">
              Our team reviews and resolves reports. You can't change statuses
              here, but when we leave feedback you'll see it below — use the
              Edit button to fix any flagged issues directly.
            </p>
          </div>
        </div>

        {/* ── Actionable banner ───────────────────────────────────── */}
        {actionableCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/8 border border-secondary/20">
            <Wrench
              className="w-4 h-4 text-secondary shrink-0"
              strokeWidth={2}
            />
            <p className="text-sm font-heading font-semibold text-secondary flex-1">
              {actionableCount} report{actionableCount !== 1 ? "s" : ""} need
              {actionableCount === 1 ? "s" : ""} your attention — scroll down to
              see admin feedback and fix the flagged quizzes.
            </p>
          </div>
        )}

        {/* ── Filter tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-9 px-3.5 rounded-xl text-[12px] font-heading font-semibold border transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? tab.key === "open"
                    ? "bg-warning/15 text-warning border-warning/30"
                    : tab.key === "resolved"
                      ? "bg-success/12 text-success border-success/25"
                      : tab.key === "dismissed"
                        ? "bg-muted/10 text-muted border-muted/25"
                        : "bg-primary/12 text-primary border-primary/25"
                  : "bg-cream border-border/50 text-text-soft hover:border-primary/30 hover:text-text"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-md text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-current/15 text-current"
                      : "bg-muted/15 text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Report list or empty state ──────────────────────────── */}
        {filtered.length === 0 ? (
          <Card padded className="py-12 text-center">
            <div className="h-16 w-16 rounded-3xl bg-success/10 text-success flex items-center justify-center mb-4 shadow-card mx-auto">
              <Flag className="w-8 h-8" strokeWidth={1.8} />
            </div>
            <h2 className="font-heading font-bold text-xl text-text">
              {activeTab === "all"
                ? "No reports on your quizzes"
                : `No ${activeTab} reports`}
            </h2>
            <p className="mt-2 text-sm text-text-soft max-w-xs mx-auto leading-relaxed">
              {activeTab === "all"
                ? "Nothing flagged so far — keep publishing quality quizzes."
                : `No ${activeTab} reports to show right now.`}
            </p>
          </Card>
        ) : (
          <Card
            padded={false}
            className="overflow-hidden divide-y divide-border/40"
          >
            {filtered.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                quiz={quizzesById.get(report.quiz_id)}
                courseCode={
                  coursesById.get(
                    quizzesById.get(report.quiz_id)?.course_id ?? "",
                  )?.code ?? undefined
                }
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

// ─── ReportRow ────────────────────────────────────────────────────────────────

function ReportRow({
  report,
  quiz,
  courseCode,
  onAcknowledge,
}: {
  report: CreatorReport;
  quiz: { id: string; title: string; course_id: string } | undefined;
  courseCode?: string;
  onAcknowledge: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(() => isActionable(report));
  const [acknowledging, setAcknowledging] = useState(false);

  const cfg = STATUS_CONFIG[report.status];
  const StatusIcon = cfg.icon;
  const actionable = isActionable(report);

  async function handleAcknowledge() {
    setAcknowledging(true);
    await onAcknowledge(report.id);
    setAcknowledging(false);
  }

  return (
    <div
      className={`px-5 py-4 transition-colors ${
        actionable
          ? "bg-secondary/4 hover:bg-secondary/6"
          : "hover:bg-surface/20"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Status icon */}
          <div
            className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-card ring-1 ring-border/40 mt-0.5 ${
              report.status === "open"
                ? "bg-warning/10 text-warning"
                : report.status === "resolved"
                  ? actionable
                    ? "bg-secondary/12 text-secondary"
                    : "bg-success/10 text-success"
                  : "bg-muted/10 text-muted"
            }`}
          >
            {actionable ? (
              <Wrench className="w-5 h-5" strokeWidth={2} />
            ) : (
              <StatusIcon className="w-5 h-5" strokeWidth={2} />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Quiz title + course */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-heading font-semibold text-[14px] text-text leading-snug line-clamp-1">
                {report.quiz_title}
              </p>
              {courseCode && (
                <Badge variant="muted" size="sm">
                  {courseCode}
                </Badge>
              )}
            </div>

            {/* Reason + status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-heading font-semibold text-text-soft">
                {REASON_LABELS[report.reason]}
                {report.reason === "other" && report.other_text
                  ? `: ${report.other_text}`
                  : ""}
              </span>

              {/* Status badge — override to "Feedback from review" when actionable */}
              {actionable ? (
                <Badge variant="secondary" size="sm" className="gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Feedback from review
                </Badge>
              ) : report.status === "resolved" &&
                report.creator_acknowledged ? (
                <Badge variant="success" size="sm" className="gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Fixed by creator
                </Badge>
              ) : (
                <Badge variant={cfg.variant} size="sm" dot>
                  {cfg.label}
                </Badge>
              )}
            </div>

            {/* Reporter's original details — always shown */}
            {report.details && (
              <p className="text-[12px] text-text-soft leading-relaxed line-clamp-2">
                "{report.details}"
              </p>
            )}

            {/* Dates */}
            <p className="text-[11px] text-muted">
              Reported {formatDate(report.created_at)}
              {report.resolved_at &&
                ` · ${report.status === "resolved" ? "Resolved" : "Dismissed"} ${formatDate(report.resolved_at)}`}
            </p>
          </div>
        </div>

        {/* Right-hand actions */}
        <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
          {/* Edit quiz — always shown when quiz exists, primary on actionable */}
          {quiz && (
            <Link to={`/creator/quizzes/${quiz.id}/edit`}>
              <button
                className={`h-8 px-3 rounded-xl text-[12px] font-heading font-semibold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  actionable
                    ? "bg-secondary text-cream border-secondary hover:bg-secondary/90"
                    : "bg-surface/60 border-border/50 text-text hover:bg-surface hover:border-primary/30 hover:text-primary"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit quiz
              </button>
            </Link>
          )}

          {/* Expand / collapse toggle for resolution notes */}
          {(report.resolution_notes || report.status !== "open") && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 w-8 rounded-xl flex items-center justify-center border border-border/50 bg-surface/60 text-muted hover:text-text hover:bg-surface transition-colors"
              aria-label={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded detail section ─────────────────────────────── */}
      {expanded && (
        <div className="mt-4 ml-13.5 space-y-3">
          {/* Resolution notes from admin */}
          {report.resolution_notes ? (
            <div
              className={`rounded-2xl p-4 space-y-2 border ${
                actionable
                  ? "bg-secondary/8 border-secondary/20"
                  : "bg-surface/40 border-border/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare
                  className={`w-3.5 h-3.5 shrink-0 ${actionable ? "text-secondary" : "text-muted"}`}
                  strokeWidth={2}
                />
                <p
                  className={`text-[11px] font-heading font-semibold uppercase tracking-wider ${
                    actionable ? "text-secondary" : "text-muted"
                  }`}
                >
                  Admin feedback
                </p>
              </div>
              <p className="text-sm text-text leading-relaxed">
                {report.resolution_notes}
              </p>
            </div>
          ) : report.status !== "open" ? (
            <p className="text-[12px] text-muted italic">
              {report.status === "dismissed"
                ? "Report was dismissed — no action needed on your end."
                : "Report resolved — no specific feedback was left."}
            </p>
          ) : null}

          {/* "Mark as addressed" — only on actionable resolved-with-feedback */}
          {actionable && !report.creator_acknowledged && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-cream border border-border/50">
              <CheckCheck
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                strokeWidth={2.2}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-heading font-semibold text-text leading-tight">
                  Fixed the issue?
                </p>
                <p className="text-[12px] text-text-soft leading-relaxed mt-0.5">
                  Once you've edited your quiz to address the feedback above,
                  mark it as addressed so our team has visibility.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                isLoading={acknowledging}
                onClick={handleAcknowledge}
                className="shrink-0 border-success/40 text-success hover:bg-success-bg"
              >
                {!acknowledging && <CheckCheck className="w-3.5 h-3.5" />}
                Mark as addressed
              </Button>
            </div>
          )}

          {/* Already acknowledged indicator */}
          {report.creator_acknowledged && report.status === "resolved" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success-bg/60 border border-success/20">
              <CheckCheck
                className="w-3.5 h-3.5 text-success shrink-0"
                strokeWidth={2.2}
              />
              <p className="text-[12px] font-heading font-semibold text-success">
                You marked this as addressed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
