import { useMemo, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Building2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Banknote,
  Sparkles,
  XCircle,
  Info,
} from "lucide-react";
import { createPortal } from "react-dom";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  walletTransactions as allWalletTxns,
  payoutRequests as basePayoutRequests,
  addPayoutRequest,
  MINIMUM_PAYOUT_THRESHOLD,
  PAYOUT_FREQUENCY_CAP_MS,
  type PayoutRequest,
  type PayoutRequestStatus,
} from "../mock";
import { formatNaira } from "./CreatorDashboardPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeEarningsBalance(userId: string): number {
  return allWalletTxns
    .filter(
      (t) =>
        t.user_id === userId &&
        (t.type === "creator_earning" || t.type === "payout") &&
        t.status === "success",
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function addDays(iso: string, ms: number): Date {
  return new Date(new Date(iso).getTime() + ms);
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PayoutRequestStatus,
  {
    label: string;
    variant: "warning" | "primary" | "danger" | "success" | "muted";
    icon: React.ElementType;
  }
> = {
  pending: { label: "Pending review", variant: "warning", icon: Clock },
  approved: { label: "Approved", variant: "primary", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "danger", icon: XCircle },
  paid: { label: "Paid", variant: "success", icon: CheckCircle2 },
  failed: { label: "Transfer failed", variant: "danger", icon: AlertCircle },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreatorPayoutsPage() {
  const { currentUser } = useAuth();

  // All hooks first — gate after
  const earningsBalance = useMemo(
    () => computeEarningsBalance(currentUser.id),
    [currentUser.id],
  );

  // Local payout list so new requests appear immediately
  const [payoutList, setPayoutList] = useState<PayoutRequest[]>(() =>
    basePayoutRequests
      .filter((p) => p.creator_id === currentUser.id)
      .sort(
        (a, b) =>
          new Date(b.requested_at).getTime() -
          new Date(a.requested_at).getTime(),
      ),
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  // ── Eligibility logic ───────────────────────────────────────────────────
  const meetsThreshold = earningsBalance >= MINIMUM_PAYOUT_THRESHOLD;

  const mostRecentRequest = payoutList[0];
  const nextEligibleDate =
    mostRecentRequest &&
    (mostRecentRequest.status === "pending" ||
      mostRecentRequest.status === "approved")
      ? null // blocked until resolved
      : mostRecentRequest
        ? addDays(mostRecentRequest.requested_at, PAYOUT_FREQUENCY_CAP_MS)
        : null;

  const now = new Date();
  const frequencyCapped = nextEligibleDate !== null && nextEligibleDate > now;

  const hasBankDetails =
    !!currentUser.bank_account_number && !!currentUser.bank_code;

  const hasPendingRequest =
    mostRecentRequest?.status === "pending" ||
    mostRecentRequest?.status === "approved";

  const canRequest =
    meetsThreshold && !frequencyCapped && hasBankDetails && !hasPendingRequest;

  // ── Submit handler ──────────────────────────────────────────────────────
  async function handleConfirmRequest() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    const newReq: PayoutRequest = {
      id: "pr_new_" + Math.random().toString(36).slice(2, 9),
      creator_id: currentUser.id,
      amount: earningsBalance,
      status: "pending",
      requested_at: new Date().toISOString(),
      bank_account_number: currentUser.bank_account_number ?? "",
      bank_code: currentUser.bank_code ?? "",
    };
    addPayoutRequest(newReq);
    setPayoutList((prev) => [newReq, ...prev]);
    setSubmitting(false);
    setSheetOpen(false);
    showToast({
      message:
        "Payout request submitted — our team will review within 2 business days.",
      variant: "success",
    });
  }

  if (!currentUser.is_approved_creator)
    return <Navigate to="/creator/apply" replace />;

  const thresholdPct = Math.min(
    100,
    Math.round((earningsBalance / MINIMUM_PAYOUT_THRESHOLD) * 100),
  );

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="!max-w-[900px]">
        <div className="space-y-6 lg:space-y-7">
          {/* ── Header ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" size="sm" dot>
                  <Sparkles className="w-3 h-3" />
                  Creator mode
                </Badge>
              </div>
              <h1 className="font-heading font-bold text-2xl lg:text-[28px] text-text tracking-tight leading-tight">
                Payout Requests
              </h1>
              <p className="mt-1 text-sm text-text-soft">
                Request transfers of your earnings to your bank account.
              </p>
            </div>
          </div>

          {/* ── Earnings balance mini-card ─────────────────────── */}
          <Card
            padded={false}
            className="relative overflow-hidden bg-secondary text-cream border-secondary/40"
          >
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
              <div className="absolute -top-10 -right-8 h-44 w-44 rounded-full bg-cream" />
              <div className="absolute -bottom-12 -left-6 h-48 w-48 rounded-full bg-cream" />
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Banknote className="w-4 h-4 text-cream/70" />
                  <span className="text-[12px] font-heading font-semibold uppercase tracking-wider text-cream/70">
                    Earnings balance
                  </span>
                </div>
                <p className="font-heading font-bold text-[32px] sm:text-[36px] leading-none tracking-tight">
                  {formatNaira(earningsBalance)}
                </p>
                <p className="mt-1.5 text-[12px] text-cream/70 leading-relaxed max-w-xs">
                  Net of paid-out amounts. This is what's available to withdraw.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => canRequest && setSheetOpen(true)}
                  disabled={!canRequest}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-cream text-secondary font-heading font-semibold text-sm shadow-card transition-all active:scale-[0.98] hover:bg-cream/95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4" strokeWidth={2.2} />
                  Request Payout
                </button>
              </div>
            </div>
          </Card>

          {/* ── Eligibility card ───────────────────────────────── */}
          <EligibilityCard
            earningsBalance={earningsBalance}
            meetsThreshold={meetsThreshold}
            thresholdPct={thresholdPct}
            hasBankDetails={hasBankDetails}
            hasPendingRequest={hasPendingRequest}
            frequencyCapped={frequencyCapped}
            nextEligibleDate={nextEligibleDate}
            canRequest={canRequest}
            onRequest={() => setSheetOpen(true)}
          />

          {/* ── History ────────────────────────────────────────── */}
          <div>
            <div className="mb-3">
              <h2 className="font-heading font-semibold text-lg text-text">
                Request history
              </h2>
              <p className="text-sm text-text-soft mt-0.5">
                {payoutList.length} past request
                {payoutList.length !== 1 ? "s" : ""}
              </p>
            </div>

            {payoutList.length === 0 ? (
              <Card padded className="py-10 text-center">
                <div className="h-14 w-14 rounded-3xl bg-surface/80 text-muted flex items-center justify-center mb-3 shadow-card ring-1 ring-border/50 mx-auto">
                  <CreditCard className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <p className="font-heading font-semibold text-text">
                  No requests yet
                </p>
                <p className="mt-1 text-sm text-text-soft max-w-xs mx-auto leading-relaxed">
                  Your payout history will appear here once you make your first
                  request.
                </p>
              </Card>
            ) : (
              <Card
                padded={false}
                className="overflow-hidden divide-y divide-border/40"
              >
                {payoutList.map((req) => (
                  <PayoutRow key={req.id} request={req} />
                ))}
              </Card>
            )}
          </div>
        </div>
      </PageContainer>

      {/* ── Request sheet ──────────────────────────────────────────────── */}
      {sheetOpen &&
        createPortal(
          <RequestSheet
            amount={earningsBalance}
            hasBankDetails={hasBankDetails}
            submitting={submitting}
            onConfirm={handleConfirmRequest}
            onClose={() => !submitting && setSheetOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}

// ─── EligibilityCard ─────────────────────────────────────────────────────────

function EligibilityCard({
  earningsBalance,
  meetsThreshold,
  thresholdPct,
  hasBankDetails,
  hasPendingRequest,
  frequencyCapped,
  nextEligibleDate,
  canRequest,
  onRequest,
}: {
  earningsBalance: number;
  meetsThreshold: boolean;
  thresholdPct: number;
  hasBankDetails: boolean;
  hasPendingRequest: boolean;
  frequencyCapped: boolean;
  nextEligibleDate: Date | null;
  canRequest: boolean;
  onRequest: () => void;
}) {
  // No bank details — blocking guard
  if (!hasBankDetails) {
    return (
      <Card padded className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-2xl bg-warning/12 text-warning flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[15px] text-text leading-tight">
            Bank details required
          </p>
          <p className="mt-1 text-sm text-text-soft leading-relaxed">
            You need to add your bank account before you can request a payout.
            Your earnings are safe — add your details and come back here.
          </p>
          <Link to="/settings" className="inline-block mt-3">
            <Button variant="primary" size="sm">
              <Building2 className="w-4 h-4" />
              Add bank details in Settings
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Has a pending/approved request in flight
  if (hasPendingRequest) {
    return (
      <Card padded className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[15px] text-text">
            Request in progress
          </p>
          <p className="mt-1 text-sm text-text-soft leading-relaxed">
            You have a payout request being reviewed. You can submit another
            once this one is processed.
          </p>
        </div>
      </Card>
    );
  }

  // Frequency capped
  if (frequencyCapped && nextEligibleDate) {
    return (
      <Card padded className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-2xl bg-muted/10 text-muted flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[15px] text-text">
            Next request available {formatDate(nextEligibleDate.toISOString())}
          </p>
          <p className="mt-1 text-sm text-text-soft leading-relaxed">
            Payouts are capped to once every 7 days. Keep earning — your balance
            will be ready when the window reopens.
          </p>
        </div>
      </Card>
    );
  }

  // Below threshold
  if (!meetsThreshold) {
    return (
      <Card padded className="space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-[15px] text-text">
              Keep earning — almost there
            </p>
            <p className="mt-1 text-sm text-text-soft leading-relaxed">
              You need{" "}
              <span className="font-semibold text-text">
                {formatNaira(MINIMUM_PAYOUT_THRESHOLD)}
              </span>{" "}
              to request a payout. You currently have{" "}
              <span className="font-semibold text-text">
                {formatNaira(earningsBalance)}
              </span>
              .
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-heading font-semibold text-muted">
            <span>{formatNaira(earningsBalance)}</span>
            <span>{formatNaira(MINIMUM_PAYOUT_THRESHOLD)} minimum</span>
          </div>
          <div className="h-2 rounded-full bg-border/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{ width: `${thresholdPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted text-right">
            {thresholdPct}% of minimum threshold
          </p>
        </div>
      </Card>
    );
  }

  // All clear — eligible
  return (
    <Card padded className="flex items-start gap-3.5">
      <div className="h-10 w-10 rounded-2xl bg-success/12 text-success flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-[15px] text-text">
          You're eligible to request a payout
        </p>
        <p className="mt-1 text-sm text-text-soft leading-relaxed">
          Your balance of{" "}
          <span className="font-semibold text-text">
            {formatNaira(earningsBalance)}
          </span>{" "}
          meets the minimum threshold and no request is pending.
        </p>
        <button
          onClick={onRequest}
          className="mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-2xl bg-success text-cream text-sm font-heading font-semibold hover:bg-success/90 transition-colors active:scale-[0.98]"
        >
          <CreditCard className="w-3.5 h-3.5" strokeWidth={2.2} />
          Request payout now
        </button>
      </div>
    </Card>
  );
}

// ─── PayoutRow ────────────────────────────────────────────────────────────────

function PayoutRow({ request }: { request: PayoutRequest }) {
  const cfg = STATUS_CONFIG[request.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-card ring-1 ring-border/40 ${
            request.status === "paid"
              ? "bg-success/10 text-success"
              : request.status === "pending" || request.status === "approved"
                ? "bg-primary/10 text-primary"
                : "bg-danger-bg text-danger"
          }`}
        >
          <StatusIcon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-[15px] text-text leading-tight">
              {formatNaira(request.amount)}
            </p>
            <Badge variant={cfg.variant} size="sm" dot>
              {cfg.label}
            </Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-text-soft">
            Requested {formatDate(request.requested_at)}
            {request.processed_at &&
              ` · Processed ${formatDate(request.processed_at)}`}
          </p>
          {/* Failed / rejected notes */}
          {(request.status === "failed" || request.status === "rejected") &&
            request.notes && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-danger-bg/40 border border-danger/20">
                <AlertTriangle
                  className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-[12px] text-danger leading-relaxed flex-1">
                  {request.notes}
                  {request.status === "failed" && (
                    <>
                      {" "}
                      <Link
                        to="/settings"
                        className="underline font-semibold hover:opacity-80"
                      >
                        Fix in Settings
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ─── RequestSheet ─────────────────────────────────────────────────────────────

function RequestSheet({
  amount,
  hasBankDetails,
  submitting,
  onConfirm,
  onClose,
}: {
  amount: number;
  hasBankDetails: boolean;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />

      {/* Sheet */}
      <div className="absolute left-0 right-0 bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:max-w-md lg:w-[92%] lg:rounded-3xl rounded-t-3xl bg-cream shadow-elevated safe-bottom">
        {/* Drag pill */}
        <div className="lg:hidden pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 lg:px-7 pt-3 lg:pt-5 pb-3 flex items-center justify-between">
          <p className="font-heading font-bold text-lg text-text">
            Request payout
          </p>
          {!submitting && (
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <X className="w-[17px] h-[17px]" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 lg:px-7 pb-6 lg:pb-7 space-y-4">
          {/* Amount display */}
          <div className="rounded-2xl bg-surface/50 border border-border/50 p-4 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Amount to withdraw
              </p>
              <p className="font-heading font-bold text-2xl text-text leading-tight mt-0.5">
                {formatNaira(amount)}
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-primary/8 border border-primary/15">
            <Info
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[12px] text-text leading-relaxed">
              Your full available earnings balance will be transferred to your
              registered bank account. Processing typically takes{" "}
              <span className="font-semibold">1–2 business days</span>.
            </p>
          </div>

          {/* Bank details missing warning */}
          {!hasBankDetails && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-warning-bg border border-warning/25">
              <AlertTriangle
                className="w-4 h-4 text-warning shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div>
                <p className="text-[12px] font-heading font-semibold text-warning leading-tight">
                  Bank details missing
                </p>
                <p className="text-[12px] text-warning/80 mt-0.5 leading-relaxed">
                  You need to save your bank details before a transfer can be
                  made.{" "}
                  <Link
                    to="/settings"
                    className="font-semibold underline hover:opacity-80"
                  >
                    Go to Settings
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-2xl border border-border/60 bg-surface/40 text-sm font-heading font-semibold text-text hover:bg-surface transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting || !hasBankDetails}
              className="flex-1 h-11 rounded-2xl bg-secondary text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" strokeWidth={2.2} />
                  Confirm request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
