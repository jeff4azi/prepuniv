/**
 * AdminApplicationsPage — /admin/applications
 *
 * Review, approve, and reject creator applications.
 * Filter tabs: Pending / Approved / Rejected / All
 * Each application opens a side-sheet with full detail + action buttons.
 */
import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  ListChecks,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  UserCheck,
  BookOpen,
  FileText,
  Link as LinkIcon,
  ShieldCheck,
  AlertCircle,
  Info,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  creatorApplications,
  updateApplicationStatus,
  profiles,
  approveCreator,
  type CreatorApplication,
  type Profile,
} from "../mock";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "pending" | "approved" | "rejected" | "all";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: CreatorApplication["status"] }) {
  if (status === "approved")
    return (
      <Badge variant="success" size="sm" dot>
        Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge variant="danger" size="sm" dot>
        Rejected
      </Badge>
    );
  return (
    <Badge variant="warning" size="sm" dot>
      Pending
    </Badge>
  );
}

// ─── Detail section ───────────────────────────────────────────────────────────

function DetailSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted shrink-0" strokeWidth={2} />
        <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}

// ─── Review sheet ─────────────────────────────────────────────────────────────

function ReviewSheet({
  app,
  profile,
  onClose,
  onApproved,
  onRejected,
}: {
  app: CreatorApplication;
  profile: Profile | undefined;
  onClose: () => void;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}) {
  const isPending = app.status === "pending";

  // Approve flow state
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approving, setApproving] = useState(false);

  // Reject flow state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape key
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  async function handleApprove() {
    setApproving(true);
    await new Promise((r) => setTimeout(r, 700));
    updateApplicationStatus(app.user_id, "approved", "Approved by admin.");
    approveCreator(app.user_id);
    setApproving(false);
    onApproved(app.id);
  }

  async function handleReject() {
    setRejecting(true);
    await new Promise((r) => setTimeout(r, 700));
    updateApplicationStatus(
      app.user_id,
      "rejected",
      rejectNotes.trim() || undefined,
    );
    setRejecting(false);
    onRejected(app.id);
  }

  const name = profile?.full_name ?? "Unknown applicant";
  const email = profile?.email ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet — full-height right panel on sm+, bottom sheet on mobile */}
      <div className="relative z-10 w-full sm:max-w-lg sm:h-full bg-cream sm:rounded-3xl rounded-t-3xl shadow-elevated flex flex-col max-h-[92dvh] sm:max-h-none overflow-hidden">
        {/* Drag pill (mobile) */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-4 sm:pt-5 pb-4 border-b border-border/40 shrink-0">
          <Avatar name={name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading font-bold text-base text-text leading-tight">
                {name}
              </h2>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-muted mt-0.5">{email}</p>
            <p className="text-xs text-text-soft mt-0.5">
              Submitted {formatDate(app.submitted_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 hover:text-text transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
          {/* Courses */}
          <DetailSection icon={BookOpen} label="Course strengths">
            <p className="text-sm text-text leading-relaxed">{app.courses}</p>
          </DetailSection>

          {/* Background */}
          <DetailSection icon={UserCheck} label="Background">
            <p className="text-sm text-text-soft leading-relaxed whitespace-pre-line">
              {app.background}
            </p>
          </DetailSection>

          {/* Quiz plans */}
          <DetailSection icon={FileText} label="Quiz plans">
            <p className="text-sm text-text-soft leading-relaxed whitespace-pre-line">
              {app.quiz_plans}
            </p>
          </DetailSection>

          {/* Links */}
          <DetailSection icon={LinkIcon} label="Links">
            {app.links ? (
              <a
                href={app.links}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2 break-all"
              >
                {app.links}
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ) : (
              <p className="text-sm text-muted italic">No links provided</p>
            )}
          </DetailSection>

          {/* Copyright acknowledgement */}
          <DetailSection icon={ShieldCheck} label="Content originality">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-success-bg border border-success/20 text-xs font-heading font-semibold text-success">
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0"
                strokeWidth={2.5}
              />
              Confirmed: content will be original
            </div>
          </DetailSection>

          {/* Admin notes (approved/rejected) */}
          {app.status !== "pending" && app.notes && (
            <div
              className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${
                app.status === "approved"
                  ? "bg-success-bg border-success/20"
                  : "bg-danger-bg/30 border-danger/20"
              }`}
            >
              <Info
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  app.status === "approved" ? "text-success" : "text-danger"
                }`}
                strokeWidth={2}
              />
              <div>
                <p
                  className={`text-xs font-heading font-semibold uppercase tracking-wider mb-1 ${
                    app.status === "approved" ? "text-success" : "text-danger"
                  }`}
                >
                  {app.status === "approved"
                    ? "Approval note"
                    : "Rejection reason"}
                </p>
                <p className="text-sm text-text leading-relaxed">{app.notes}</p>
              </div>
            </div>
          )}

          {/* ── Reject form (inline) ── */}
          {isPending && showRejectForm && !confirmReject && (
            <div className="rounded-2xl border border-border/50 bg-surface/30 p-4 space-y-3">
              <p className="text-sm font-heading font-semibold text-text">
                Rejection feedback{" "}
                <span className="text-muted font-normal">
                  (optional but helpful)
                </span>
              </p>
              <textarea
                rows={3}
                placeholder="Explain why this application isn't approved this round, and what the applicant can do to strengthen a reapplication…"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-cream border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectNotes("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReject(true)}
                  className="border-danger/40 text-danger hover:bg-danger-bg"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Continue to confirm
                </Button>
              </div>
            </div>
          )}

          {/* ── Confirm reject ── */}
          {isPending && showRejectForm && confirmReject && (
            <div className="rounded-2xl border border-danger/25 bg-danger-bg/30 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="w-4 h-4 text-danger shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm text-text leading-relaxed">
                  Reject{" "}
                  <span className="font-heading font-semibold">{name}</span>
                  &apos;s application? They will be able to reapply after
                  reviewing your feedback.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmReject(false)}
                  disabled={rejecting}
                >
                  Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={rejecting}
                  onClick={handleReject}
                  className="bg-danger! text-cream! hover:bg-danger/90!"
                >
                  {!rejecting && <XCircle className="w-3.5 h-3.5" />}
                  Confirm rejection
                </Button>
              </div>
            </div>
          )}

          {/* ── Confirm approve ── */}
          {isPending && confirmApprove && (
            <div className="rounded-2xl border border-success/25 bg-success-bg p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm text-text leading-relaxed">
                  Approve{" "}
                  <span className="font-heading font-semibold">{name}</span> as
                  a creator? This will give them access to publish quizzes
                  immediately.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmApprove(false)}
                  disabled={approving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={approving}
                  onClick={handleApprove}
                >
                  {!approving && <CheckCircle2 className="w-3.5 h-3.5" />}
                  Yes, approve
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — action buttons for pending only */}
        {isPending && !showRejectForm && !confirmApprove && (
          <div className="px-5 pb-5 pt-3 border-t border-border/40 flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="md"
              className="flex-1 border-danger/40 text-danger hover:bg-danger-bg"
              onClick={() => setShowRejectForm(true)}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => setConfirmApprove(true)}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </Button>
          </div>
        )}

        {/* Footer — close for non-pending */}
        {!isPending && (
          <div className="px-5 pb-5 pt-3 border-t border-border/40 shrink-0">
            <Button variant="outline" size="md" fullWidth onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application row ──────────────────────────────────────────────────────────

function ApplicationRow({
  app,
  profile,
  onReview,
}: {
  app: CreatorApplication;
  profile: Profile | undefined;
  onReview: () => void;
}) {
  const name = profile?.full_name ?? "Unknown";
  const email = profile?.email ?? "";

  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3.5 px-5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      {/* Avatar */}
      <Avatar name={name} size="sm" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-semibold text-sm text-text">
            {name}
          </span>
          <StatusBadge status={app.status} />
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{email}</p>
        <p className="text-xs text-text-soft mt-0.5">
          <Clock
            className="w-3 h-3 inline-block mr-1 text-muted"
            strokeWidth={2}
          />
          {formatDate(app.submitted_at)}
        </p>
      </div>

      {/* Courses preview */}
      <p className="hidden sm:block text-xs text-text-soft truncate max-w-36 shrink-0">
        {app.courses}
      </p>

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
    pending: {
      heading: "All caught up",
      sub: "No pending applications right now — check back later.",
    },
    approved: {
      heading: "No approved creators yet",
      sub: "Approved applications will appear here.",
    },
    rejected: {
      heading: "No rejected applications",
      sub: "Rejected applications will appear here.",
    },
    all: {
      heading: "No applications yet",
      sub: "Creator applications will appear here once submitted.",
    },
  };
  const { heading, sub } = msgs[tab];
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <ListChecks className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">{heading}</h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        {sub}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminApplicationsPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  // Local version counter — bump on approve/reject to force re-render
  const [version, setVersion] = useState(0);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  const profilesById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const filtered = useMemo(() => {
    const apps = [...creatorApplications].sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
    );
    if (activeTab === "all") return apps;
    return apps.filter((a) => a.status === activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, version]);

  const counts = useMemo(
    () => ({
      pending: creatorApplications.filter((a) => a.status === "pending").length,
      approved: creatorApplications.filter((a) => a.status === "approved")
        .length,
      rejected: creatorApplications.filter((a) => a.status === "rejected")
        .length,
      all: creatorApplications.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const reviewingApp = reviewingId
    ? creatorApplications.find((a) => a.id === reviewingId)
    : null;

  function handleApproved(id: string) {
    const app = creatorApplications.find((a) => a.id === id);
    const profile = app ? profilesById.get(app.user_id) : undefined;
    setVersion((v) => v + 1);
    setReviewingId(null);
    showToast({
      message: `${profile?.full_name ?? "Applicant"} approved as a creator.`,
      variant: "success",
    });
  }

  function handleRejected(id: string) {
    const app = creatorApplications.find((a) => a.id === id);
    const profile = app ? profilesById.get(app.user_id) : undefined;
    setVersion((v) => v + 1);
    setReviewingId(null);
    showToast({
      message: `${profile?.full_name ?? "Applicant"}'s application rejected.`,
    });
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
          {/* ── Header ── */}
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Creator Applications
            </h1>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed">
              {counts.pending > 0
                ? `${counts.pending} application${counts.pending !== 1 ? "s" : ""} pending review.`
                : "All applications are up to date."}
            </p>
          </div>

          {/* ── Filter tabs ── */}
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
                      tab.value === "pending"
                        ? activeTab === "pending"
                          ? "bg-warning text-cream"
                          : "bg-warning/20 text-warning"
                        : activeTab === tab.value
                          ? "bg-border text-muted"
                          : "bg-border/60 text-muted"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Applications list ── */}
          <Card padded={false} className="overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <div className="divide-y divide-border/30">
                {filtered.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    profile={profilesById.get(app.user_id)}
                    onReview={() => setReviewingId(app.id)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageContainer>

      {/* ── Review sheet ── */}
      {reviewingApp && (
        <ReviewSheet
          app={reviewingApp}
          profile={profilesById.get(reviewingApp.user_id)}
          onClose={() => setReviewingId(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
    </>
  );
}
