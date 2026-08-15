/**
 * AdminPayoutsPage — /admin/payouts
 *
 * Review, approve/reject, and monitor payout requests.
 * Filter tabs: Pending / Approved / Rejected / Paid / Failed / All
 * Uses backend API for approve/reject operations.
 */
import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  CreditCard,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  Loader2,
  RotateCcw,
  Building2,
  BadgeCheck,
  ExternalLink,
  Info,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { DrawerShell } from "../components/DrawerShell";
import { useAuth } from "../context/AuthContext";
import { formatNaira } from "../components/QuizCard";
import { getBankName } from "../lib/banks";
import type { DbPayoutRequest, DbProfile } from "../lib/supabase";
import {
  usePayoutRequests,
  useProfiles,
  adminApprovePayoutRequest,
  adminRejectPayoutRequest,
  AdminLoadingState,
} from "../hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab =
  | "pending"
  | "approved"
  | "rejected"
  | "paid"
  | "failed"
  | "all";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="warning" size="sm" dot>
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="primary" size="sm" dot>
          Approved
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="success" size="sm" dot>
          Paid
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="danger" size="sm" dot>
          Rejected
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="danger" size="sm" dot>
          Failed
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Review sheet ─────────────────────────────────────────────────────────────

type ProcessingState = "idle" | "processing" | "done";

function PayoutReviewSheet({
  req,
  creator,
  onClose,
  onUpdated,
}: {
  req: DbPayoutRequest;
  creator: DbProfile | undefined;
  onClose: () => void;
  onUpdated: (id: string, outcome: "paid" | "failed" | "rejected") => void;
}) {
  const bankName = getBankName(req.bank_code);
  const last4 = req.bank_account_number.slice(-4);
  const creatorName = creator?.full_name ?? "Unknown creator";

  const isPending = req.status === "pending";
  const isFailed = req.status === "failed";
  const canAct = isPending || isFailed;

  // Approve/process flow
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [transferOutcome, setTransferOutcome] = useState<
    "paid" | "failed" | null
  >(null);

  // Reject flow
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectNotesError, setRejectNotesError] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  async function handleProcessTransfer() {
    setProcessingState("processing");
    const { error } = await adminApprovePayoutRequest(req.id);
    if (error) {
      setTransferOutcome("failed");
      setProcessingState("done");
      onUpdated(req.id, "failed");
    } else {
      setTransferOutcome("paid");
      setProcessingState("done");
      onUpdated(req.id, "paid");
    }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) {
      setRejectNotesError("Please provide a reason for the rejection.");
      return;
    }
    setRejecting(true);
    await adminRejectPayoutRequest(req.id, rejectNotes.trim());
    setRejecting(false);
    onUpdated(req.id, "rejected");
  }

  return (
    <DrawerShell open={true} onClose={onClose} ariaLabel="Payout review">
      <DrawerShell.Header
        icon={<CreditCard className="w-5 h-5" strokeWidth={2} />}
        title={formatNaira(Number(req.amount))}
        statusBadge={<StatusBadge status={req.status} />}
        meta={`Requested by ${creatorName} · ${formatDate(req.requested_at)}`}
        onClose={onClose}
      />

      <DrawerShell.Body>
        {/* Creator */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface/40 border border-border/40">
          <Avatar name={creatorName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-text leading-tight">
              {creatorName}
            </p>
          </div>
          {creator && (
            <Link
              to={`/profile/creator/${creator.id}`}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-primary/8 transition-colors"
              aria-label="View creator profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Bank details */}
        <div className="rounded-2xl border border-border/50 bg-surface/20 divide-y divide-border/30 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Building2
              className="w-4 h-4 text-muted shrink-0"
              strokeWidth={2}
            />
            <span className="text-xs text-muted font-heading font-semibold uppercase tracking-wider w-24 shrink-0">
              Bank
            </span>
            <span className="text-sm font-heading font-semibold text-text">
              {bankName}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <CreditCard
              className="w-4 h-4 text-muted shrink-0"
              strokeWidth={2}
            />
            <span className="text-xs text-muted font-heading font-semibold uppercase tracking-wider w-24 shrink-0">
              Account
            </span>
            <span className="text-sm font-mono font-semibold tracking-wider text-text">
              {req.bank_account_number.slice(0, 3)}{" "}
              {req.bank_account_number.slice(3, 6)}{" "}
              {req.bank_account_number.slice(6)}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <BadgeCheck
              className="w-4 h-4 text-muted shrink-0"
              strokeWidth={2}
            />
            <span className="text-xs text-muted font-heading font-semibold uppercase tracking-wider w-24 shrink-0">
              Holder
            </span>
            <span className="text-sm font-heading font-semibold text-text uppercase">
              {creatorName.split(" ").reverse().join(" ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* Amount highlight */}
        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/6 border border-primary/15">
          <span className="text-sm text-text-soft font-heading">
            Transfer amount
          </span>
          <span className="font-heading font-bold text-xl text-primary">
            {formatNaira(Number(req.amount))}
          </span>
        </div>

        {/* Timestamps */}
        {req.processed_at && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span>
              {req.status === "paid"
                ? "Paid"
                : req.status === "failed"
                  ? "Failed"
                  : "Processed"}{" "}
              {formatDateTime(req.processed_at)}
            </span>
          </div>
        )}

        {/* Notes / failure reason */}
        {req.notes && (
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${
              req.status === "paid" || req.status === "approved"
                ? "bg-success-bg border-success/20"
                : "bg-danger-bg/30 border-danger/20"
            }`}
          >
            <Info
              className={`w-4 h-4 shrink-0 mt-0.5 ${req.status === "paid" ? "text-success" : "text-danger"}`}
              strokeWidth={2}
            />
            <p className="text-sm text-text leading-relaxed">{req.notes}</p>
          </div>
        )}

        {/* ── Transfer outcome (after processing) ── */}
        {processingState === "done" && transferOutcome && (
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${
              transferOutcome === "paid"
                ? "bg-success-bg border-success/20"
                : "bg-danger-bg/30 border-danger/20"
            }`}
          >
            {transferOutcome === "paid" ? (
              <CheckCircle2
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                strokeWidth={2}
              />
            ) : (
              <AlertCircle
                className="w-4 h-4 text-danger shrink-0 mt-0.5"
                strokeWidth={2}
              />
            )}
            <div>
              <p
                className={`text-sm font-heading font-semibold leading-tight ${
                  transferOutcome === "paid" ? "text-success" : "text-danger"
                }`}
              >
                {transferOutcome === "paid"
                  ? `${formatNaira(Number(req.amount))} sent successfully`
                  : "Transfer failed"}
              </p>
              {transferOutcome === "failed" && (
                <p className="text-xs text-danger/80 mt-0.5">
                  Receiving bank returned an error. No funds were deducted. The
                  creator can retry.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Confirm approve ── */}
        {canAct && confirmApprove && processingState === "idle" && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Send{" "}
              <span className="font-heading font-bold text-primary">
                {formatNaira(Number(req.amount))}
              </span>{" "}
              to{" "}
              <span className="font-heading font-semibold">{creatorName}</span>
              &apos;s {bankName} account ending{" "}
              <span className="font-mono font-semibold">{last4}</span>? This
              cannot be undone.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmApprove(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcessTransfer}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm & send
              </Button>
            </div>
          </div>
        )}

        {/* ── Processing spinner ── */}
        {processingState === "processing" && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/6 border border-primary/15">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <span className="text-sm font-heading font-medium text-primary">
              Processing transfer…
            </span>
          </div>
        )}

        {/* ── Reject form ── */}
        {canAct && showRejectForm && !confirmReject && (
          <div className="rounded-2xl border border-border/50 bg-surface/30 p-4 space-y-3">
            <p className="text-sm font-heading font-semibold text-text">
              Rejection reason <span className="text-danger">*</span>
            </p>
            <textarea
              rows={3}
              placeholder="Explain why this payout is being rejected — this message is shown to the creator…"
              value={rejectNotes}
              onChange={(e) => {
                setRejectNotes(e.target.value);
                if (e.target.value.trim()) setRejectNotesError("");
              }}
              className={`w-full px-4 py-3 rounded-xl bg-cream border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed ${
                rejectNotesError
                  ? "border-danger/60 focus:ring-danger/30"
                  : "border-border"
              }`}
            />
            {rejectNotesError && (
              <p className="text-xs text-danger flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-danger inline-block" />
                {rejectNotesError}
              </p>
            )}
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
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── Confirm reject ── */}
        {canAct && showRejectForm && confirmReject && (
          <div className="rounded-2xl border border-danger/25 bg-danger-bg/30 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Reject this payout request from{" "}
              <span className="font-heading font-semibold">{creatorName}</span>?
              They will receive your feedback and can resubmit.
            </p>
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
      </DrawerShell.Body>

      {/* Footer */}
      {canAct &&
        processingState === "idle" &&
        !showRejectForm &&
        !confirmApprove && (
          <DrawerShell.Footer>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                className="flex-1 border-danger/40 text-danger hover:bg-danger-bg"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
              {isPending && (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => setConfirmApprove(true)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve &amp; Process
                </Button>
              )}
              {isFailed && (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => setConfirmApprove(true)}
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Transfer
                </Button>
              )}
            </div>
          </DrawerShell.Footer>
        )}
      {(!canAct || processingState === "done") && (
        <DrawerShell.Footer>
          <Button variant="outline" size="md" fullWidth onClick={onClose}>
            Close
          </Button>
        </DrawerShell.Footer>
      )}
    </DrawerShell>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function PayoutRow({
  req,
  creator,
  onReview,
}: {
  req: DbPayoutRequest;
  creator: DbProfile | undefined;
  onReview: () => void;
}) {
  const name = creator?.full_name ?? "Unknown";
  const bankName = getBankName(req.bank_code);
  const acct = req.bank_account_number;
  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3.5 px-5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-semibold text-sm text-text">
            {name}
          </span>
          <StatusBadge status={req.status} />
        </div>
        <p className="text-xs text-muted mt-0.5">
          <Building2
            className="w-3 h-3 inline-block mr-1 -mt-0.5 text-muted/80"
            strokeWidth={2}
          />
          {bankName}
          <span className="mx-1.5 text-border/80">·</span>
          <span className="font-mono tracking-wider text-text-soft">
            {acct.slice(0, 3)} {acct.slice(3, 6)} {acct.slice(6)}
          </span>
        </p>
        <p className="text-xs text-text-soft mt-0.5">
          <Clock
            className="w-3 h-3 inline-block mr-1 text-muted"
            strokeWidth={2}
          />
          {formatDate(req.requested_at)}
        </p>
      </div>
      <p className="font-heading font-bold text-sm text-text shrink-0 hidden sm:block">
        {formatNaira(Number(req.amount))}
      </p>
      <button
        type="button"
        onClick={onReview}
        className="shrink-0 h-9 px-3.5 rounded-xl text-xs font-heading font-semibold border border-border/60 bg-cream text-text hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
      >
        Review <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: FilterTab }) {
  const msgs: Record<FilterTab, string> = {
    pending: "No pending payout requests — all clear.",
    approved: "No approved requests yet.",
    rejected: "No rejected requests.",
    paid: "No completed payouts yet.",
    failed: "No failed transfers — good sign.",
    all: "No payout requests on record yet.",
  };
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <CreditCard className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        {msgs[tab]}
      </h3>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminPayoutsPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  const { data: allPayouts, loading: payoutsLoading, refetch: refetchPayouts } = usePayoutRequests();
  const { data: allProfiles, loading: profilesLoading } = useProfiles();

  const loading = payoutsLoading || profilesLoading;
  const payouts = allPayouts || [];
  const profiles = allProfiles || [];

  const profilesById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const filtered = useMemo(() => {
    const reqs = [...payouts].sort(
      (a, b) =>
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
    );
    if (activeTab === "all") return reqs;
    return reqs.filter((r) => r.status === activeTab);
  }, [payouts, activeTab]);

  const counts = useMemo(
    () => ({
      pending: payouts.filter((r) => r.status === "pending").length,
      approved: payouts.filter((r) => r.status === "approved").length,
      rejected: payouts.filter((r) => r.status === "rejected").length,
      paid: payouts.filter((r) => r.status === "paid").length,
      failed: payouts.filter((r) => r.status === "failed").length,
      all: payouts.length,
    }),
    [payouts],
  );

  const reviewingReq = reviewingId
    ? payouts.find((r) => r.id === reviewingId)
    : null;

  function handleUpdated(id: string, outcome: "paid" | "failed" | "rejected") {
    const req = payouts.find((r) => r.id === id);
    const creator = req ? profilesById.get(req.creator_id) : undefined;
    const name = creator?.full_name ?? "Creator";
    setReviewingId(null);
    if (outcome === "paid") {
      showToast({
        message: `${formatNaira(Number(req?.amount ?? 0))} sent to ${name}.`,
        variant: "success",
      });
    } else if (outcome === "failed") {
      showToast({
        message: `Transfer to ${name} failed. Marked as failed.`,
      });
    } else {
      showToast({ message: `Payout request from ${name} rejected.` });
    }
    void refetchPayouts();
  }

  if (loading) {
    return (
      <PageContainer className="max-w-240!">
        <AdminLoadingState label="Loading payout requests…" />
      </PageContainer>
    );
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
              Payout Requests
            </h1>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed">
              {counts.pending > 0
                ? `${counts.pending} request${counts.pending !== 1 ? "s" : ""} pending review.`
                : "All payout requests are up to date."}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit max-w-full overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-9 px-3 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  activeTab === tab.value
                    ? "bg-cream shadow-soft text-text"
                    : "text-text-soft hover:text-text"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${
                      tab.value === "pending" && activeTab === "pending"
                        ? "bg-warning text-cream"
                        : tab.value === "failed"
                          ? activeTab === "failed"
                            ? "bg-danger text-cream"
                            : "bg-danger/15 text-danger"
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
              filtered.map((req) => (
                <PayoutRow
                  key={req.id}
                  req={req}
                  creator={profilesById.get(req.creator_id)}
                  onReview={() => setReviewingId(req.id)}
                />
              ))
            )}
          </Card>
        </div>
      </PageContainer>

      {reviewingReq && (
        <PayoutReviewSheet
          req={reviewingReq}
          creator={profilesById.get(reviewingReq.creator_id)}
          onClose={() => setReviewingId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}
