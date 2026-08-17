/**
 * AdminPayoutsPage — /admin/payouts
 *
 * Review, approve/reject, and monitor payout requests.
 * Reflects the real async lifecycle: pending → processing → paid (or → failed, or paid → reversed).
 * Uses 5s polling while any row is in 'processing' for live status updates.
 */
import { useState, useMemo, useEffect, useRef } from "react";
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
  AlertTriangle,
  UserCheck,
  FileText,
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
import { getBankName, fetchBanksListSimple } from "../lib/banks";
import type { DbPayoutRequest, DbProfile } from "../lib/supabase";
import {
  usePayoutRequests,
  useProfiles,
  adminApprovePayoutRequest,
  adminRejectPayoutRequest,
  adminMarkPayoutPaidManually,
  AdminLoadingState,
} from "../hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab =
  | "pending"
  | "processing"
  | "rejected"
  | "paid"
  | "failed"
  | "reversed"
  | "all";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "reversed", label: "Reversed" },
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

function StatusBadge({
  status,
  paymentMethod,
}: {
  status: string;
  paymentMethod?: string | null;
}) {
  const badge = (() => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="primary" size="sm" dot>
            <Loader2 className="w-3 h-3 animate-spin inline-block -mt-0.5 mr-1" />
            Processing
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
      case "reversed":
        return (
          <Badge variant="warning" size="sm" dot className="!bg-amber-100 !text-amber-800 !border-amber-200">
            <AlertTriangle className="w-3 h-3 inline-block -mt-0.5 mr-1" />
            Reversed
          </Badge>
        );
      default:
        return null;
    }
  })();

  if (status === "paid" && paymentMethod === "manual") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {badge}
        <Badge variant="muted" size="sm" className="!bg-stone-100 !text-stone-600 !border-stone-200">
          <UserCheck className="w-3 h-3 inline-block -mt-0.5 mr-1" />
          Paid manually
        </Badge>
      </div>
    );
  }

  return badge;
}

// ─── Review sheet ─────────────────────────────────────────────────────────────

type ProcessingState = "idle" | "processing" | "done";

function PayoutReviewSheet({
  req,
  creator,
  profiles,
  onClose,
  onUpdated,
}: {
  req: DbPayoutRequest;
  creator: DbProfile | undefined;
  profiles: DbProfile[];
  onClose: () => void;
  onUpdated: (
    id: string,
    outcome: "processing" | "paid" | "failed" | "rejected" | "reversed",
    message?: string,
  ) => void;
}) {
  const bankName = getBankName(req.bank_code);
  const last4 = req.bank_account_number.slice(-4);
  const creatorName = creator?.full_name ?? "Unknown creator";

  const isPending = req.status === "pending";
  const isFailed = req.status === "failed";
  const isReversed = req.status === "reversed";
  const canAct = isPending || isFailed || isReversed;

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [lastInitiateResult, setLastInitiateResult] = useState<
    "processing" | "failed" | null
  >(null);
  const [initiateMessage, setInitiateMessage] = useState<string>("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectNotesError, setRejectNotesError] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [confirmManual, setConfirmManual] = useState(false);
  const [manualReference, setManualReference] = useState("");
  const [manualReferenceError, setManualReferenceError] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);

  async function handleProcessTransfer() {
    setProcessingState("processing");
    setLastInitiateResult(null);
    setInitiateMessage("");
    const result = await adminApprovePayoutRequest(req.id);
    const respData = (result?.data as Record<string, unknown>) || {};
    const returnedStatus = (respData.status as string) || null;

    if (result.error) {
      if (result.error.includes("already been processed") || result.error.includes("409")) {
        setInitiateMessage("This payout was already processed — try refreshing.");
      } else {
        setInitiateMessage(result.error);
      }
      setLastInitiateResult("failed");
      setProcessingState("done");
      onUpdated(req.id, "failed", result.error);
    } else if (returnedStatus === "processing") {
      setLastInitiateResult("processing");
      setProcessingState("done");
      onUpdated(req.id, "processing");
    } else if (returnedStatus === "failed") {
      const msg = (respData.message as string) || "Transfer initiation failed";
      setInitiateMessage(msg);
      setLastInitiateResult("failed");
      setProcessingState("done");
      onUpdated(req.id, "failed", msg);
    } else {
      setLastInitiateResult("processing");
      setProcessingState("done");
      onUpdated(req.id, "processing");
    }
  }

  async function handleReject() {
    if (!rejectNotes.trim()) {
      setRejectNotesError("Please provide a reason for the rejection.");
      return;
    }
    setRejecting(true);
    const result = await adminRejectPayoutRequest(req.id, rejectNotes.trim());
    setRejecting(false);
    if (result.error) {
      if (
        result.status === 409 ||
        result.error.includes("Cannot reject") ||
        result.error.includes("already")
      ) {
        setInitiateMessage(
          result.error ||
            "This payout has already been processed — try refreshing.",
        );
        setLastInitiateResult("failed");
        setProcessingState("done");
      } else {
        setInitiateMessage(result.error);
        setLastInitiateResult("failed");
        setProcessingState("done");
      }
      return;
    }
    onUpdated(req.id, "rejected");
  }

  async function handleMarkPaidManually() {
    if (!manualReference.trim()) {
      setManualReferenceError(
        "Reference / proof of transfer is required.",
      );
      return;
    }
    setSubmittingManual(true);
    const result = await adminMarkPayoutPaidManually(
      req.id,
      manualReference.trim(),
    );
    setSubmittingManual(false);
    if (result.error) {
      if (
        result.status === 409 ||
        result.error.includes("Cannot mark") ||
        result.error.includes("already")
      ) {
        setInitiateMessage(
          result.error ||
            "This payout has already been processed — try refreshing.",
        );
        setLastInitiateResult("failed");
        setProcessingState("done");
      } else {
        setInitiateMessage(result.error);
        setLastInitiateResult("failed");
        setProcessingState("done");
      }
      return;
    }
    onUpdated(req.id, "paid");
  }

  return (
    <DrawerShell open={true} onClose={onClose} ariaLabel="Payout review">
      <DrawerShell.Header
        icon={<CreditCard className="w-5 h-5" strokeWidth={2} />}
        title={formatNaira(Math.round(Number(req.amount) * 100))}
        statusBadge={
          <StatusBadge status={req.status} paymentMethod={req.payment_method} />
        }
        meta={`Requested by ${creatorName} · ${formatDate(req.requested_at)}`}
        onClose={onClose}
      />

      <DrawerShell.Body>
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
              {creator?.bank_account_name ||
                (creator
                  ? creatorName.split(" ").reverse().join(" ").toUpperCase()
                  : "—")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-primary/6 border border-primary/15">
          <span className="text-sm text-text-soft font-heading">
            Transfer amount
          </span>
          <span className="font-heading font-bold text-xl text-primary">
            {formatNaira(Math.round(Number(req.amount) * 100))}
          </span>
        </div>

        {req.processed_at && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span>
              {req.status === "paid"
                ? "Paid"
                : req.status === "failed"
                  ? "Failed"
                  : req.status === "reversed"
                    ? "Reversed"
                    : req.status === "processing"
                      ? "Initiated"
                      : "Processed"}{" "}
              {formatDateTime(req.processed_at)}
            </span>
          </div>
        )}

        {req.status === "paid" && req.payment_method === "manual" && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 divide-y divide-stone-200/70 overflow-hidden">
            {req.manual_reference && (
              <div className="flex items-start gap-3 px-4 py-3">
                <FileText
                  className="w-4 h-4 text-stone-500 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-stone-500 block">
                    Admin proof of transfer
                  </span>
                  <span className="text-sm font-mono font-semibold text-stone-700 mt-1 block break-all">
                    {req.manual_reference}
                  </span>
                </div>
              </div>
            )}
            {req.marked_paid_by && (
              <div className="flex items-start gap-3 px-4 py-3">
                <UserCheck
                  className="w-4 h-4 text-stone-500 shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-stone-500 block">
                    Recorded by admin
                  </span>
                  <span className="text-sm font-heading font-semibold text-stone-700 mt-1 block">
                    {profiles?.find((p) => p.id === req.marked_paid_by)
                      ?.full_name ?? "Unknown admin"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {(req.failure_reason || req.notes) && (
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl border ${
              req.status === "paid" || req.status === "rejected"
                ? req.status === "paid"
                  ? "bg-success-bg border-success/20"
                  : "bg-danger-bg/30 border-danger/20"
                : req.status === "reversed"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-danger-bg/30 border-danger/20"
            }`}
          >
            <Info
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                req.status === "paid"
                  ? "text-success"
                  : req.status === "reversed"
                    ? "text-amber-600"
                    : "text-danger"
              }`}
              strokeWidth={2}
            />
            <div className="space-y-1 flex-1 min-w-0">
              {req.failure_reason && (
                <p
                  className={`text-sm font-heading font-semibold leading-tight ${
                    req.status === "reversed" ? "text-amber-800" : "text-danger"
                  }`}
                >
                  {req.status === "reversed"
                    ? "This payout was later reversed"
                    : "Transfer failed"}
                </p>
              )}
              {req.failure_reason && (
                <p className="text-sm text-text leading-relaxed">
                  {req.failure_reason}
                </p>
              )}
              {req.notes && (
                <p className="text-sm text-text leading-relaxed">{req.notes}</p>
              )}
            </div>
          </div>
        )}

        {req.status === "processing" && !lastInitiateResult && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5">
            <Loader2
              className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-spin"
              strokeWidth={2}
            />
            <div>
              <p className="text-sm font-heading font-semibold leading-tight text-primary">
                Transfer initiated — awaiting confirmation
              </p>
              <p className="text-xs text-text-soft mt-0.5 leading-relaxed">
                The transfer is being processed by the bank. This page will
                auto-update once it completes.
              </p>
            </div>
          </div>
        )}

        {processingState === "processing" && (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/6 border border-primary/15">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <span className="text-sm font-heading font-medium text-primary">
              Processing transfer…
            </span>
          </div>
        )}

        {processingState === "done" && lastInitiateResult === "processing" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5">
            <Clock
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="text-sm font-heading font-semibold leading-tight text-primary">
                Transfer initiated — awaiting confirmation
              </p>
              <p className="text-xs text-text-soft mt-0.5 leading-relaxed">
                {formatNaira(Math.round(Number(req.amount) * 100))} has been
                queued for sending. Status will update live once the bank
                confirms it.
              </p>
            </div>
          </div>
        )}

        {processingState === "done" && lastInitiateResult === "failed" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-danger/25 bg-danger-bg/30">
            <AlertCircle
              className="w-4 h-4 text-danger shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="text-sm font-heading font-semibold leading-tight text-danger">
                Transfer could not be initiated
              </p>
              {initiateMessage && (
                <p className="text-xs text-danger/80 mt-0.5 leading-relaxed">
                  {initiateMessage}
                </p>
              )}
              <p className="text-xs text-text-soft mt-1 leading-relaxed">
                No funds were deducted. You can retry.
              </p>
            </div>
          </div>
        )}

        {canAct && confirmApprove && processingState === "idle" && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Send{" "}
              <span className="font-heading font-bold text-primary">
                {formatNaira(Math.round(Number(req.amount) * 100))}
              </span>{" "}
              to{" "}
              <span className="font-heading font-semibold">{creatorName}</span>
              &apos;s {bankName} account ending{" "}
              <span className="font-mono font-semibold">{last4}</span>? The
              transfer will be queued immediately — final outcome will arrive
              from the bank asynchronously.
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
                {isFailed || isReversed
                  ? "Confirm retry &amp; send"
                  : "Confirm &amp; send"}
              </Button>
            </div>
          </div>
        )}

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

        {canAct && showManualForm && !confirmManual && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-stone-600 shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <p className="text-sm text-text leading-relaxed">
                <span className="font-heading font-semibold text-stone-800">
                  Only use this if you&apos;ve already sent the money yourself
                  outside PrepUniv
                </span>{" "}
                (e.g. directly via your banking app). This will mark the payout
                as paid and cannot be undone from here.
              </p>
            </div>
            <div>
              <p className="text-sm font-heading font-semibold text-text mb-1.5">
                Reference / proof of transfer{" "}
                <span className="text-danger">*</span>
              </p>
              <input
                type="text"
                placeholder="e.g. bank transaction reference, transfer ID, screenshot note…"
                value={manualReference}
                onChange={(e) => {
                  setManualReference(e.target.value);
                  if (e.target.value.trim()) setManualReferenceError("");
                }}
                className={`w-full px-4 py-3 rounded-xl bg-cream border text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all ${
                  manualReferenceError
                    ? "border-danger/60 focus:ring-danger/30"
                    : "border-border"
                }`}
              />
              {manualReferenceError && (
                <p className="text-xs text-danger mt-1.5 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-danger inline-block" />
                  {manualReferenceError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowManualForm(false);
                  setManualReference("");
                  setManualReferenceError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmManual(true)}
                disabled={!manualReference.trim() || submittingManual}
                className="border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {canAct && showManualForm && confirmManual && (
          <div className="rounded-2xl border border-stone-300 bg-stone-100 p-4 space-y-3">
            <p className="text-sm text-text leading-relaxed">
              Permanently mark{" "}
              <span className="font-heading font-bold text-stone-800">
                {formatNaira(Math.round(Number(req.amount) * 100))}
              </span>{" "}
              to{" "}
              <span className="font-heading font-semibold">{creatorName}</span>{" "}
              as paid manually? This action will record the wallet debit and
              cannot be undone.
            </p>
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmManual(false)}
                disabled={submittingManual}
              >
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={submittingManual}
                onClick={handleMarkPaidManually}
                className="bg-stone-700! text-cream! border-stone-700! hover:bg-stone-800!"
              >
                {!submittingManual && (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Confirm — Mark as Paid
              </Button>
            </div>
          </div>
        )}
      </DrawerShell.Body>

      {canAct &&
        processingState === "idle" &&
        !showRejectForm &&
        !confirmApprove &&
        !showManualForm && (
          <DrawerShell.Footer>
            <div className="space-y-2.5 w-full">
              <div className="flex items-center gap-2.5 w-full">
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
                {(isFailed || isReversed) && (
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
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="w-full h-10 rounded-xl text-xs font-heading font-semibold text-muted hover:text-stone-700 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-all flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Mark as Paid Manually (sent outside platform)
              </button>
            </div>
          </DrawerShell.Footer>
        )}
      {(!canAct || processingState !== "idle") && (
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
          <StatusBadge status={req.status} paymentMethod={req.payment_method} />
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
        {formatNaira(Math.round(Number(req.amount) * 100))}
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
    processing: "No in-flight transfers right now.",
    rejected: "No rejected requests.",
    paid: "No completed payouts yet.",
    failed: "No failed transfers — good sign.",
    reversed: "No reversed payouts — good sign.",
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

  const [banksReady, setBanksReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchBanksListSimple().then((banks) => {
      if (!cancelled && banks.length > 0) setBanksReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    data: allPayouts,
    loading: payoutsLoading,
    refetch: refetchPayouts,
    setData: setPayoutsData,
  } = usePayoutRequests();
  const { data: allProfiles, loading: profilesLoading } = useProfiles();

  const loading = payoutsLoading || profilesLoading;
  const payouts = allPayouts || [];
  const profiles = allProfiles || [];

  const anyProcessing = useMemo(
    () => payouts.some((r) => r.status === "processing"),
    [payouts],
  );

  // ── Live polling: while any payout is 'processing', refetch every 5s ──
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!anyProcessing) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current === null) {
      pollRef.current = window.setInterval(() => {
        void refetchPayouts();
      }, 5000);
    }
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [anyProcessing, refetchPayouts]);

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
      processing: payouts.filter((r) => r.status === "processing").length,
      rejected: payouts.filter((r) => r.status === "rejected").length,
      paid: payouts.filter((r) => r.status === "paid").length,
      failed: payouts.filter((r) => r.status === "failed").length,
      reversed: payouts.filter((r) => r.status === "reversed").length,
      all: payouts.length,
    }),
    [payouts],
  );

  const reviewingReq = reviewingId
    ? payouts.find((r) => r.id === reviewingId)
    : null;

  function handleUpdated(
    id: string,
    outcome: "processing" | "paid" | "failed" | "rejected" | "reversed",
    message?: string,
  ) {
    const req = payouts.find((r) => r.id === id);
    const creator = req ? profilesById.get(req.creator_id) : undefined;
    const name = creator?.full_name ?? "Creator";
    setReviewingId(null);
    if (outcome === "processing") {
      showToast({
        message: `${formatNaira(Math.round(Number(req?.amount ?? 0) * 100))} transfer to ${name} initiated — awaiting bank confirmation.`,
        variant: "success",
      });
    } else if (outcome === "paid") {
      showToast({
        message: `${formatNaira(Math.round(Number(req?.amount ?? 0) * 100))} sent to ${name}.`,
        variant: "success",
      });
    } else if (outcome === "failed") {
      showToast({
        message: message
          ? `Transfer to ${name} failed: ${message}`
          : `Transfer to ${name} failed — marked as failed.`,
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
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Payout Requests
            </h1>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed">
              {counts.pending > 0 || counts.processing > 0
                ? `${counts.pending} pending, ${counts.processing} in flight.`
                : "All payout requests are up to date."}
              {anyProcessing && (
                <span className="block mt-1 text-xs text-primary font-heading font-medium">
                  <Loader2 className="w-3 h-3 inline-block mr-1.5 -mt-0.5 animate-spin" />
                  Auto-updating live until all transfers complete.
                </span>
              )}
            </p>
          </div>

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
                        : tab.value === "processing"
                          ? activeTab === "processing"
                            ? "bg-primary text-cream"
                            : "bg-primary/15 text-primary"
                          : tab.value === "failed"
                            ? activeTab === "failed"
                              ? "bg-danger text-cream"
                              : "bg-danger/15 text-danger"
                            : tab.value === "reversed"
                              ? activeTab === "reversed"
                                ? "bg-amber-500 text-cream"
                                : "bg-amber-100 text-amber-700"
                              : "bg-border text-muted"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

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
          profiles={profiles}
          onClose={() => setReviewingId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}
