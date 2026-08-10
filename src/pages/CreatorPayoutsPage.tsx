import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
  Banknote,
  Sparkles,
  XCircle,
  Info,
  Search,
  ChevronDown,
  Edit2,
  Shield,
} from "lucide-react";
import { createPortal } from "react-dom";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { supabase, type DbPayoutRequest } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { formatNaira } from "./CreatorDashboardPage";

const MINIMUM_PAYOUT_THRESHOLD = 200000;
const PAYOUT_FREQUENCY_CAP_MS = 7 * 24 * 60 * 60 * 1000;

type PayoutRequestStatus = DbPayoutRequest["status"];
type PayoutRequest = DbPayoutRequest;

interface Bank {
  code: string;
  name: string;
}

const NIGERIAN_BANKS: Bank[] = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "EcoBank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank (FCMB)" },
  { code: "058", name: "GTBank (Guaranty Trust)" },
  { code: "030", name: "Heritage Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "999992", name: "OPay" },
  { code: "50211", name: "Kuda Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "039", name: "Stanbic IBTC Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

function getBankName(code: string): string {
  return NIGERIAN_BANKS.find((b) => b.code === code)?.name ?? code;
}

function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}

async function mockVerifyAccount(
  accountNumber: string,
  _bankCode: string,
  ownerFullName: string,
): Promise<{ success: true; accountName: string } | { success: false }> {
  await new Promise((r) => setTimeout(r, 1100));
  const allSame = accountNumber.split("").every((c) => c === accountNumber[0]);
  if (allSame) return { success: false };
  const parts = ownerFullName.trim().toUpperCase().split(/\s+/);
  const accountName =
    parts.length >= 2
      ? `${parts[parts.length - 1]} ${parts[0]}${parts.length > 2 ? " " + parts.slice(1, -1).join(" ") : ""}`
      : ownerFullName.toUpperCase();
  return { success: true, accountName };
}

function computeEarningsBalance(userId: string, walletTxns: { user_id: string | null; type: string; status: string; amount: number }[]): number {
  return walletTxns
    .filter(
      (t) =>
        t.user_id === userId &&
        (t.type === "creator_earning" || t.type === "payout") &&
        t.status === "completed",
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

function addMs(iso: string, ms: number): Date {
  return new Date(new Date(iso).getTime() + ms);
}

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

export function CreatorPayoutsPage() {
  const { currentUser, updateBankDetails, resolvedAccountName, walletTxns, refreshProfile } = useAuth();

  const earningsBalance = useMemo(
    () => computeEarningsBalance(currentUser.id, walletTxns),
    [currentUser.id, walletTxns],
  );

  const [payoutList, setPayoutList] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  const loadPayoutRequests = useCallback(async () => {
    if (!currentUser.id) return;
    setLoadingPayouts(true);
    const { data } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("creator_id", currentUser.id)
      .order("requested_at", { ascending: false });
    setPayoutList((data as PayoutRequest[]) ?? []);
    setLoadingPayouts(false);
  }, [currentUser.id]);

  useEffect(() => {
    void loadPayoutRequests();
  }, [loadPayoutRequests]);

  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [payoutSheetOpen, setPayoutSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  const hasBankDetails =
    !!currentUser.bank_account_number && !!currentUser.bank_code;

  const mostRecentRequest = payoutList[0];
  const nextEligibleDate =
    mostRecentRequest &&
    (mostRecentRequest.status === "pending" ||
      mostRecentRequest.status === "approved")
      ? null
      : mostRecentRequest
        ? addMs(mostRecentRequest.requested_at, PAYOUT_FREQUENCY_CAP_MS)
        : null;

  const now = new Date();
  const meetsThreshold = earningsBalance >= MINIMUM_PAYOUT_THRESHOLD;
  const frequencyCapped = nextEligibleDate !== null && nextEligibleDate > now;
  const hasPendingRequest =
    mostRecentRequest?.status === "pending" ||
    mostRecentRequest?.status === "approved";
  const canRequest =
    meetsThreshold && !frequencyCapped && hasBankDetails && !hasPendingRequest;

  const thresholdPct = Math.min(
    100,
    Math.round((earningsBalance / MINIMUM_PAYOUT_THRESHOLD) * 100),
  );

  function handleBankSaved(
    bankCode: string,
    accountNumber: string,
    resolvedName: string,
  ) {
    updateBankDetails({
      bank_code: bankCode,
      bank_account_number: accountNumber,
      bank_name: getBankName(bankCode),
      bank_account_name: resolvedName,
    }).then(({ error }) => {
      if (error) {
        showToast({ message: "Failed to update bank details.", variant: "danger" });
        return;
      }
      setBankSheetOpen(false);
      showToast({
        message: hasBankDetails
          ? "Bank account updated successfully."
          : "Bank account added. You can now request payouts.",
        variant: "success",
      });
    });
  }

  async function handleConfirmPayout(requestedAmountKobo: number) {
    if (
      requestedAmountKobo < MINIMUM_PAYOUT_THRESHOLD ||
      requestedAmountKobo > earningsBalance ||
      !Number.isFinite(requestedAmountKobo)
    )
      return;
    setSubmitting(true);
    const { data, error } = await apiFetch<{ payout_request: PayoutRequest }>(
      "/api/creator/payout-request",
      {
        method: "POST",
        body: { amount: requestedAmountKobo },
      },
    );
    setSubmitting(false);
    if (error) {
      showToast({
        message: error || "Failed to submit payout request.",
        variant: "danger",
      });
      return;
    }
    if (data?.payout_request) {
      setPayoutList((prev) => [data.payout_request, ...prev]);
    } else {
      await loadPayoutRequests();
    }
    await refreshProfile();
    setPayoutSheetOpen(false);
    showToast({
      message: `Payout request for ${formatNaira(requestedAmountKobo)} submitted — our team will review within 2 business days.`,
      variant: "success",
    });
  }

  if (!currentUser.is_approved_creator)
    return <Navigate to="/creator/apply" replace />;

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
                  Net of paid-out amounts. Request a partial payout or withdraw
                  everything — minimum is {formatNaira(MINIMUM_PAYOUT_THRESHOLD)}.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => canRequest && setPayoutSheetOpen(true)}
                  disabled={!canRequest}
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-cream text-secondary font-heading font-semibold text-sm shadow-card transition-all active:scale-[0.98] hover:bg-cream/95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4" strokeWidth={2.2} />
                  Request Payout
                </button>
              </div>
            </div>
          </Card>

          <BankAccountCard
            bankCode={currentUser.bank_code}
            accountNumber={currentUser.bank_account_number}
            resolvedName={resolvedAccountName}
            onAdd={() => setBankSheetOpen(true)}
            onEdit={() => setBankSheetOpen(true)}
          />

          <EligibilityCard
            earningsBalance={earningsBalance}
            meetsThreshold={meetsThreshold}
            thresholdPct={thresholdPct}
            hasBankDetails={hasBankDetails}
            hasPendingRequest={hasPendingRequest}
            frequencyCapped={frequencyCapped}
            nextEligibleDate={nextEligibleDate}
            canRequest={canRequest}
            onRequest={() => setPayoutSheetOpen(true)}
            onAddBank={() => setBankSheetOpen(true)}
          />

          <div>
            <div className="mb-3">
              <h2 className="font-heading font-semibold text-lg text-text">
                Request history
              </h2>
              <p className="text-sm text-text-soft mt-0.5">
                {payoutList.length} past request
                {payoutList.length !== 1 ? "s" : ""}
                {loadingPayouts && " — loading…"}
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

      {bankSheetOpen &&
        createPortal(
          <BankAccountSetupSheet
            currentBankCode={currentUser.bank_code}
            currentAccountNumber={currentUser.bank_account_number}
            ownerName={currentUser.full_name}
            onSave={handleBankSaved}
            onClose={() => setBankSheetOpen(false)}
          />,
          document.body,
        )}

      {payoutSheetOpen &&
        createPortal(
          <PayoutRequestSheet
            maxEarningsKobo={earningsBalance}
            bankCode={currentUser.bank_code ?? ""}
            accountNumber={currentUser.bank_account_number ?? ""}
            resolvedName={resolvedAccountName}
            submitting={submitting}
            onConfirm={handleConfirmPayout}
            onClose={() => !submitting && setPayoutSheetOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}

function BankAccountCard({
  bankCode,
  accountNumber,
  resolvedName,
  onAdd,
  onEdit,
}: {
  bankCode?: string;
  accountNumber?: string;
  resolvedName?: string;
  onAdd: () => void;
  onEdit: () => void;
}) {
  const hasBankDetails = !!bankCode && !!accountNumber;

  if (!hasBankDetails) {
    return (
      <Card
        padded
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-muted/10 text-muted flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-[15px] text-text leading-tight">
              No bank account on file
            </p>
            <p className="mt-1 text-sm text-text-soft leading-relaxed">
              Add your bank account to receive payouts. Your earnings are held
              safely until you do.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onAdd}
          className="shrink-0 self-start sm:self-center"
        >
          <Building2 className="w-4 h-4" />
          Add bank account
        </Button>
      </Card>
    );
  }

  const bankName = getBankName(bankCode);
  const masked = maskAccountNumber(accountNumber);
  const bankInitial = bankName.charAt(0).toUpperCase();

  return (
    <Card padded>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-secondary" strokeWidth={2} />
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
            Bank account
          </p>
        </div>
        <button
          onClick={onEdit}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-primary hover:bg-primary/8 transition-colors shrink-0"
          aria-label="Edit bank account"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="h-12 w-12 rounded-2xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0 font-heading font-bold text-lg shadow-card ring-1 ring-border/40">
          {bankInitial}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-semibold text-[15px] text-text leading-tight">
            {bankName}
          </p>
          <p className="text-[13px] text-text-soft mt-0.5 font-mono tracking-wider">
            {masked}
          </p>
          {resolvedName && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield
                className="w-3 h-3 text-success shrink-0"
                strokeWidth={2.5}
              />
              <p className="text-[12px] text-success font-heading font-semibold">
                {resolvedName}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

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
  onAddBank,
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
  onAddBank: () => void;
}) {
  if (!hasBankDetails) {
    return (
      <Card padded className="flex items-start gap-3.5">
        <div className="h-10 w-10 rounded-2xl bg-warning/12 text-warning flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-[15px] text-text leading-tight">
            Add a bank account to continue
          </p>
          <p className="mt-1 text-sm text-text-soft leading-relaxed">
            Payout requests are blocked until you verify a bank account above.
          </p>
          <button
            onClick={onAddBank}
            className="mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-2xl bg-warning text-cream text-sm font-heading font-semibold hover:bg-warning/90 transition-colors active:scale-[0.98]"
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={2.2} />
            Add bank account
          </button>
        </div>
      </Card>
    );
  }

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
            once it's processed.
          </p>
        </div>
      </Card>
    );
  }

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
            Payouts are capped to once every 7 days. Your balance will be ready
            when the window reopens.
          </p>
        </div>
      </Card>
    );
  }

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
          meets the minimum — request any amount up to the total above.
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

function PayoutRow({ request }: { request: PayoutRequest }) {
  const cfg = STATUS_CONFIG[request.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="px-5 py-4 flex items-start gap-3.5 min-w-0">
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
      <div className="min-w-0 flex-1">
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
        {(request.status === "failed" || request.status === "rejected") &&
          request.notes && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-danger-bg/40 border border-danger/20">
              <AlertTriangle
                className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <p className="text-[12px] text-danger leading-relaxed flex-1">
                {request.notes}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

type PayoutStep = "amount" | "confirm";

const PAYOUT_PRESETS_KOBO = [200000, 500000, 1000000, 2500000];

function PayoutRequestSheet({
  maxEarningsKobo,
  bankCode,
  accountNumber,
  resolvedName,
  submitting,
  onConfirm,
  onClose,
}: {
  maxEarningsKobo: number;
  bankCode: string;
  accountNumber: string;
  resolvedName?: string;
  submitting: boolean;
  onConfirm: (requestedKobo: number) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<PayoutStep>("amount");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    setStep("amount");
    setSelectedPreset(null);
    setCustomAmount("");
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        if (step === "confirm") setStep("amount");
        else onClose();
      }
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose, submitting, step]);

  const maxNaira = maxEarningsKobo / 100;
  const minNaira = MINIMUM_PAYOUT_THRESHOLD / 100;

  const customKobo = Number(customAmount) * 100;
  const selectedKobo: number =
    selectedPreset ?? (customAmount ? customKobo : 0);

  const meetsMin = selectedKobo >= MINIMUM_PAYOUT_THRESHOLD;
  const withinMax = selectedKobo > 0 && selectedKobo <= maxEarningsKobo;
  const validSelection = meetsMin && withinMax;

  function handleContinue() {
    if (!validSelection) return;
    setStep("confirm");
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />
      <div className="absolute left-0 right-0 bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:max-w-md lg:w-[92%] lg:rounded-3xl rounded-t-3xl bg-cream shadow-elevated safe-bottom">
        <div className="lg:hidden pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="px-5 sm:px-6 lg:px-7 pt-3 lg:pt-5 pb-3 flex items-center justify-between">
          <p className="font-heading font-bold text-lg text-text">
            {step === "amount"
              ? "Request payout"
              : "Review & confirm payout"}
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
        <div className="px-5 sm:px-6 lg:px-7 pb-6 lg:pb-7 space-y-4">
          {step === "amount" && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-secondary/10 border border-secondary/15 p-4 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-2xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Available to withdraw
                  </p>
                  <p className="font-heading font-bold text-2xl text-text leading-tight mt-0.5">
                    {formatNaira(maxEarningsKobo)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.16em] text-muted mb-2.5">
                  Quick amounts
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PAYOUT_PRESETS_KOBO.map((amtKobo) => {
                    const presetDisabled = amtKobo > maxEarningsKobo;
                    const active = selectedPreset === amtKobo;
                    return (
                      <button
                        key={amtKobo}
                        disabled={presetDisabled}
                        onClick={() => {
                          setSelectedPreset(amtKobo);
                          setCustomAmount("");
                        }}
                        className={`h-12 rounded-2xl font-heading font-semibold text-[15px] transition-all duration-150 active:scale-[0.98] border disabled:opacity-40 disabled:cursor-not-allowed ${
                          active
                            ? "bg-secondary text-cream border-secondary shadow-soft"
                            : presetDisabled
                              ? "bg-surface/20 text-muted border-border/30"
                              : "bg-surface/40 text-text border-border/60 hover:border-secondary/40 hover:bg-surface"
                        }`}
                      >
                        {formatNaira(amtKobo)}
                      </button>
                    );
                  })}
                </div>
                {maxEarningsKobo < PAYOUT_PRESETS_KOBO[0] ? null : (
                  <button
                    onClick={() => {
                      setSelectedPreset(maxEarningsKobo);
                      setCustomAmount("");
                    }}
                    className={`mt-2.5 w-full h-10 px-3 rounded-xl text-[12px] font-heading font-semibold transition-all duration-150 active:scale-[0.98] border ${
                      selectedPreset === maxEarningsKobo
                        ? "bg-secondary text-cream border-secondary"
                        : "bg-surface/40 text-text-soft border-border/50 hover:border-secondary/30 hover:text-text"
                    }`}
                  >
                    Withdraw all ({formatNaira(maxEarningsKobo)})
                  </button>
                )}
              </div>

              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.16em] text-muted mb-2.5">
                  Or enter custom amount
                </p>
                <div
                  className={`flex items-center h-12 rounded-2xl border transition-colors ${
                    customAmount
                      ? "bg-surface/40 border-secondary/40"
                      : "bg-surface/40 border-border/60 focus-within:border-secondary/40"
                  }`}
                >
                  <span className="pl-4 pr-2 font-heading font-semibold text-lg text-text-soft">
                    ₦
                  </span>
                  <input
                    type="number"
                    min={minNaira}
                    max={maxNaira}
                    step={100}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPreset(null);
                    }}
                    placeholder={`e.g. ${formatNaira(MINIMUM_PAYOUT_THRESHOLD)}`}
                    className="flex-1 bg-transparent outline-none font-heading font-semibold text-lg text-text placeholder:text-muted/60 pr-4 h-full w-full rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {!withinMax && selectedKobo > 0 ? (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-danger-bg/40 border border-danger/20">
                    <AlertTriangle
                      className="w-4 h-4 text-danger shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <p className="text-[12px] text-danger leading-relaxed">
                      Amount exceeds your available balance of{" "}
                      <span className="font-semibold">
                        {formatNaira(maxEarningsKobo)}
                      </span>
                      .
                    </p>
                  </div>
                ) : null}
                {!meetsMin && selectedKobo > 0 ? (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-warning/12 border border-warning/20">
                    <AlertTriangle
                      className="w-4 h-4 text-warning shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <p className="text-[12px] text-warning leading-relaxed">
                      Minimum payout is{" "}
                      <span className="font-semibold">
                        {formatNaira(MINIMUM_PAYOUT_THRESHOLD)}
                      </span>
                      .
                    </p>
                  </div>
                ) : selectedKobo === 0 ? (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-primary/8 border border-primary/15">
                    <Info
                      className="w-4 h-4 text-primary shrink-0 mt-0.5"
                      strokeWidth={2}
                    />
                    <p className="text-[12px] text-text leading-relaxed">
                      Choose an amount between{" "}
                      <span className="font-semibold">
                        {formatNaira(MINIMUM_PAYOUT_THRESHOLD)}
                      </span>{" "}
                      and{" "}
                      <span className="font-semibold">
                        {formatNaira(maxEarningsKobo)}
                      </span>
                      . Processing typically takes 1–2 business days.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-success/12 border border-success/20">
                    <CheckCircle2
                      className="w-4 h-4 text-success shrink-0 mt-0.5"
                      strokeWidth={2.4}
                    />
                    <p className="text-[12px] text-text leading-relaxed">
                      <span className="font-semibold">
                        {formatNaira(selectedKobo)}
                      </span>{" "}
                      ready to send —{" "}
                      <span className="font-semibold">
                        {formatNaira(maxEarningsKobo - selectedKobo)}
                      </span>{" "}
                      will remain in your earnings balance.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-1">
                <button
                  onClick={handleContinue}
                  disabled={!validSelection}
                  className="w-full h-12 rounded-2xl bg-secondary text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  {validSelection ? (
                    <span className="ml-1.5 font-bold bg-cream/15 rounded-xl px-2.5 py-0.5 -mr-1">
                      {formatNaira(selectedKobo)}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-surface/50 border border-border/50 p-4 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Banknote className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Amount to withdraw
                  </p>
                  <p className="font-heading font-bold text-2xl text-text leading-tight mt-0.5">
                    {formatNaira(selectedKobo)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-surface/50 border border-border/50 p-4 space-y-1.5">
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Transfer to
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0 font-heading font-bold text-sm">
                    {getBankName(bankCode).charAt(0)}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-[14px] text-text leading-tight">
                      {getBankName(bankCode)}
                    </p>
                    <p className="text-[12px] text-text-soft font-mono tracking-wider">
                      {maskAccountNumber(accountNumber)}
                    </p>
                  </div>
                </div>
                {resolvedName && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Shield
                      className="w-3 h-3 text-success shrink-0"
                      strokeWidth={2.5}
                    />
                    <p className="text-[12px] text-success font-heading font-semibold">
                      {resolvedName}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-primary/8 border border-primary/15 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Info
                    className="w-4 h-4 text-primary shrink-0"
                    strokeWidth={2}
                  />
                  <p className="text-[12px] text-text leading-relaxed">
                    Remaining in earnings after this request
                  </p>
                </div>
                <p className="font-heading font-bold text-[15px] text-text">
                  {formatNaira(maxEarningsKobo - selectedKobo)}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={() => setStep("amount")}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-2xl border border-border/60 bg-surface/40 text-sm font-heading font-semibold text-text hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={() => onConfirm(selectedKobo)}
                  disabled={submitting || !validSelection}
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
          )}
        </div>
      </div>
    </div>
  );
}

type SetupStep = "entry" | "verifying" | "confirm";

function BankAccountSetupSheet({
  currentBankCode,
  currentAccountNumber,
  ownerName,
  onSave,
  onClose,
}: {
  currentBankCode?: string;
  currentAccountNumber?: string;
  ownerName: string;
  onSave: (
    bankCode: string,
    accountNumber: string,
    resolvedName: string,
  ) => void;
  onClose: () => void;
}) {
  const isEdit = !!currentBankCode && !!currentAccountNumber;

  const [step, setStep] = useState<SetupStep>("entry");
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropOpen, setBankDropOpen] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState(
    currentBankCode ?? "",
  );
  const [accountNumber, setAccountNumber] = useState(
    currentAccountNumber ?? "",
  );
  const [verifyError, setVerifyError] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const bankDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step !== "verifying") onClose();
      }
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  useEffect(() => {
    if (!bankDropOpen) return;
    const h = (e: MouseEvent) => {
      if (
        bankDropRef.current &&
        !bankDropRef.current.contains(e.target as Node)
      )
        setBankDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [bankDropOpen]);

  const filteredBanks = useMemo(
    () =>
      bankSearch.trim()
        ? NIGERIAN_BANKS.filter((b) =>
            b.name.toLowerCase().includes(bankSearch.toLowerCase()),
          )
        : NIGERIAN_BANKS,
    [bankSearch],
  );

  const accountValid = /^\d{10}$/.test(accountNumber);
  const canVerify = selectedBankCode !== "" && accountValid;

  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);

  async function handleVerify() {
    if (!canVerify) return;
    setVerifyError("");
    setStep("verifying");
    const result = await mockVerifyAccount(
      accountNumber,
      selectedBankCode,
      ownerName,
    );
    if (result.success) {
      setResolvedName(result.accountName);
      setStep("confirm");
    } else {
      setVerifyError(
        "Couldn't verify this account — check the number and try again.",
      );
      setStep("entry");
    }
  }

  function handleConfirmSave() {
    onSave(selectedBankCode, accountNumber, resolvedName);
  }

  const inputBase =
    "w-full h-11 px-4 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all";

  const title =
    step === "entry"
      ? isEdit
        ? "Update bank account"
        : "Add bank account"
      : step === "verifying"
        ? "Verifying…"
        : "Confirm account";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={step === "verifying" ? undefined : onClose}
      />
      <div className="absolute left-0 right-0 bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:max-w-[480px] lg:w-[92%] lg:rounded-3xl rounded-t-3xl bg-cream shadow-elevated safe-bottom flex flex-col max-h-[90dvh]">
        <div className="lg:hidden pt-2 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="px-5 sm:px-6 lg:px-7 pt-3 lg:pt-5 pb-3 flex items-center justify-between shrink-0">
          <div>
            <p className="font-heading font-bold text-lg text-text">{title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {(["entry", "verifying", "confirm"] as SetupStep[]).map(
                (s, i) => (
                  <span
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      step === s
                        ? "w-5 bg-primary"
                        : i < ["entry", "verifying", "confirm"].indexOf(step)
                          ? "w-1.5 bg-primary/40"
                          : "w-1.5 bg-border"
                    }`}
                  />
                ),
              )}
            </div>
          </div>
          {step !== "verifying" && (
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <X className="w-[17px] h-[17px]" />
            </button>
          )}
        </div>

        <div className="px-5 sm:px-6 lg:px-7 pb-6 lg:pb-7 overflow-y-auto flex-1">
          {step === "entry" && (
            <div className="space-y-4">
              <p className="text-sm text-text-soft leading-relaxed">
                Enter your bank details below. We'll verify the account before
                saving.
              </p>

              {verifyError && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-danger-bg/40 border border-danger/25">
                  <AlertCircle
                    className="w-4 h-4 text-danger shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <p className="text-[12px] text-danger leading-relaxed">
                    {verifyError}
                  </p>
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight">
                  Bank
                </label>
                <div className="relative" ref={bankDropRef}>
                  <button
                    type="button"
                    onClick={() => setBankDropOpen((v) => !v)}
                    className={`${inputBase} text-left flex items-center justify-between pr-10 ${selectedBank ? "text-text" : "text-muted"}`}
                  >
                    <span>
                      {selectedBank ? selectedBank.name : "Select your bank…"}
                    </span>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none transition-transform ${bankDropOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {bankDropOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-cream border border-border/60 rounded-2xl shadow-elevated overflow-hidden">
                      <div className="px-3 pt-3 pb-2 border-b border-border/40">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search banks…"
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            autoFocus
                            className="w-full h-9 pl-8 pr-3 rounded-xl bg-surface/60 border border-border/50 text-sm font-heading text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                      <ul className="max-h-44 overflow-y-auto">
                        {filteredBanks.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-muted text-center">
                            No banks found
                          </li>
                        ) : (
                          filteredBanks.map((b) => (
                            <li key={b.code}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBankCode(b.code);
                                  setBankDropOpen(false);
                                  setBankSearch("");
                                  setVerifyError("");
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-heading font-medium transition-colors hover:bg-surface/60 ${selectedBankCode === b.code ? "bg-primary/10 text-primary" : "text-text"}`}
                              >
                                {b.name}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight">
                  Account number (NUBAN)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit account number"
                  value={accountNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setAccountNumber(v);
                    setVerifyError("");
                  }}
                  className={`${inputBase} font-mono tracking-widest ${accountNumber.length > 0 && !accountValid ? "border-danger/60 focus:ring-danger/30" : ""}`}
                />
                {accountNumber.length > 0 && !accountValid && (
                  <p className="mt-1.5 text-xs text-danger font-heading font-medium">
                    Account number must be exactly 10 digits.
                  </p>
                )}
                <p className="mt-1.5 text-xs text-muted">
                  Standard 10-digit NUBAN format used by all Nigerian banks.
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={!canVerify}
                className="w-full h-11 rounded-2xl bg-primary text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <Shield className="w-4 h-4" strokeWidth={2.2} />
                Verify account
              </button>
            </div>
          )}

          {step === "verifying" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="relative h-16 w-16 mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-pulse" />
                <div className="relative h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin" strokeWidth={2.2} />
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg text-text leading-tight">
                Verifying account details
              </h3>
              <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-xs">
                Checking{" "}
                <span className="font-semibold text-text font-mono tracking-widest">
                  {maskAccountNumber(accountNumber)}
                </span>{" "}
                at{" "}
                <span className="font-semibold text-text">
                  {selectedBank?.name ?? "your bank"}
                </span>
                …
              </p>
              <div className="mt-5 h-1.5 w-48 rounded-full bg-surface overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary/60 via-primary to-secondary/50 animate-pulse" />
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-16 w-16 rounded-3xl bg-success/10 text-success flex items-center justify-center mb-4 shadow-card ring-1 ring-success/20">
                  <Shield className="w-8 h-8" strokeWidth={2} />
                </div>
                <p className="text-[12px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
                  Account verified
                </p>
                <h2 className="font-heading font-bold text-2xl text-text leading-tight">
                  {resolvedName}
                </h2>
                <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-xs">
                  Confirm this is you. Payouts will be sent to this account.
                  Make sure the name matches yours.
                </p>
              </div>

              <div className="rounded-2xl bg-surface/50 border border-border/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted font-heading font-medium">
                    Bank
                  </span>
                  <span className="text-[13px] font-heading font-semibold text-text">
                    {selectedBank?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted font-heading font-medium">
                    Account
                  </span>
                  <span className="text-[13px] font-mono font-semibold text-text tracking-wider">
                    {maskAccountNumber(accountNumber)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted font-heading font-medium">
                    Name
                  </span>
                  <span className="text-[13px] font-heading font-semibold text-text">
                    {resolvedName}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleConfirmSave}
                  className="w-full h-11 rounded-2xl bg-success text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-success/90 transition-colors active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                  Confirm & save
                </button>
                <button
                  onClick={() => {
                    setStep("entry");
                    setVerifyError("");
                  }}
                  className="w-full h-10 rounded-2xl text-sm font-heading font-medium text-text-soft hover:text-text transition-colors"
                >
                  Change details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
