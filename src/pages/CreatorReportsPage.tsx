import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Flag,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  creatorReports,
  quizzes as allQuizzes,
  courses as allCourses,
  type CreatorReport,
  type CreatorReportStatus,
  type ReportReason,
} from "../mock";

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

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreatorReportsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // All hooks before gate
  const creatorQuizIds = useMemo(
    () =>
      new Set(
        allQuizzes
          .filter((q) => q.creator_id === currentUser.id)
          .map((q) => q.id),
      ),
    [currentUser.id],
  );

  const coursesById = useMemo(
    () => new Map(allCourses.map((c) => [c.id, c])),
    [],
  );
  const quizzesById = useMemo(
    () => new Map(allQuizzes.map((q) => [q.id, q])),
    [],
  );

  // Filter reports for this creator's quizzes
  const myReports = useMemo(
    () =>
      creatorReports
        .filter((r) => creatorQuizIds.has(r.quiz_id))
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [creatorQuizIds],
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

  if (!currentUser.is_approved_creator)
    return <Navigate to="/creator/apply" replace />;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "open", label: "Open", count: counts.open },
    { key: "resolved", label: "Resolved", count: counts.resolved },
    { key: "dismissed", label: "Dismissed", count: counts.dismissed },
  ];

  return (
    <PageContainer className="!max-w-[900px]">
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

        {/* ── Read-only info banner ───────────────────────────────── */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-primary/8 border border-primary/15">
          <Info
            className="w-4 h-4 text-primary shrink-0 mt-0.5"
            strokeWidth={2}
          />
          <p className="text-sm text-text leading-relaxed">
            <span className="font-semibold">
              This list is for your awareness.
            </span>{" "}
            Our team reviews and resolves reports — you can't change statuses
            here, but you can use the Edit button to fix any flagged issues in
            your quizzes directly.
          </p>
        </div>

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
                  className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-md text-[10px] font-bold ${
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
                ? "Nice — nothing flagged so far. Keep publishing quality quizzes and it'll stay that way."
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
                  )?.code
                }
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
}: {
  report: CreatorReport;
  quiz: ReturnType<typeof allQuizzes.find>;
  courseCode?: string;
}) {
  const cfg = STATUS_CONFIG[report.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:bg-surface/20 transition-colors">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Status icon */}
        <div
          className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-card ring-1 ring-border/40 mt-0.5 ${
            report.status === "open"
              ? "bg-warning/10 text-warning"
              : report.status === "resolved"
                ? "bg-success/10 text-success"
                : "bg-muted/10 text-muted"
          }`}
        >
          <StatusIcon className="w-5 h-5" strokeWidth={2} />
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

          {/* Reason + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-heading font-semibold text-text-soft">
              {REASON_LABELS[report.reason]}
              {report.reason === "other" && report.other_text
                ? `: ${report.other_text}`
                : ""}
            </span>
            <Badge variant={cfg.variant} size="sm" dot>
              {cfg.label}
            </Badge>
          </div>

          {/* Details text */}
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

      {/* Edit action */}
      {quiz && (
        <div className="shrink-0 self-start sm:self-center">
          <Link to={`/creator/quizzes/${quiz.id}/edit`}>
            <button className="h-8 px-3 rounded-xl text-[12px] font-heading font-semibold bg-surface/60 border border-border/50 text-text hover:bg-surface hover:border-primary/30 hover:text-primary transition-all flex items-center gap-1.5 whitespace-nowrap">
              <Edit2 className="w-3.5 h-3.5" />
              Edit quiz
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
