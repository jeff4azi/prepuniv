import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  ArrowUpRight,
  Receipt,
  Wallet as WalletIcon,
  X,
  CheckCircle2,
  Loader2,
  Info,
  Inbox,
  ArrowLeft,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { formatNaira, formatDate } from "../components/QuizCard";
import { useAuth, type DbWalletTxn, type DbQuiz } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import {
  trackBeginCheckout,
  trackTopupCompleted,
  trackTopupFailed,
  trackTopupPartial,
} from "../lib/analytics";

type FilterKey = "all" | "topups" | "payments";
type TopUpStep = "amount" | "processing" | "success";
type VerifyState =
  | "idle"
  | "verifying"
  | "success"
  | "failed"
  | "pending"
  | "partial";

const PRESET_AMOUNTS_KOBO = [50000, 100000, 200000, 500000];

function isTopupTxn(t: DbWalletTxn) {
  return t.type === "topup";
}

function isPaymentTxn(t: DbWalletTxn) {
  return t.type === "quiz_payment";
}

function sameMonth(iso: string, refDate: Date) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === refDate.getUTCFullYear() &&
    d.getUTCMonth() === refDate.getUTCMonth()
  );
}

function monthHeaderLabel(iso: string, now: Date) {
  const d = new Date(iso);
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  if (d.getUTCFullYear() === nowYear && d.getUTCMonth() === nowMonth)
    return "This month";
  const lastMonth = new Date(Date.UTC(nowYear, nowMonth - 1, 1));
  if (
    d.getUTCFullYear() === lastMonth.getUTCFullYear() &&
    d.getUTCMonth() === lastMonth.getUTCMonth()
  )
    return "Last month";
  return d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

function kobo(nairaAmount: number): number {
  return Math.round(nairaAmount * 100);
}

export function WalletPage() {
  const { currentUser, walletBalance, walletTxns, refreshProfile } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [successAmount, setSuccessAmount] = useState(0);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [quizzesById, setQuizzesById] = useState<Map<string, DbQuiz>>(
    new Map(),
  );

  // ── Redirect-back verification state ─────────────────────────────────────
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [redirectTxRef, setRedirectTxRef] = useState<string | null>(null);
  // amounts are naira (same unit wallet_transactions stores amounts in —
  // see the comment on formatLedgerNaira in AdminDashboardPage.tsx; only
  // quiz prices are kobo). Run through kobo() below before formatNaira().
  const [partialAmounts, setPartialAmounts] = useState<{
    expected: number;
    received: number;
  } | null>(null);

  /**
   * Auto-open Top Up overlay if navigated from a dedicated "Top Up" button
   * (e.g. ?action=topup or ?topup=true or location.state.openTopup)
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const topup = params.get("topup");
    const state = (window.history.state as { usr?: { openTopup?: boolean } })
      ?.usr;

    if (action === "topup" || topup === "true" || state?.openTopup) {
      setSheetOpen(true);
      setTopUpStep("amount");

      if (action || topup) {
        const cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete("action");
        cleanParams.delete("topup");
        const newSearch = cleanParams.toString();
        const newUrl =
          window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState(window.history.state, "", newUrl);
      }
    }
  }, []);

  /**
   * On mount: if Flutterwave redirected back with ?tx_ref=..., call our
   * verify endpoint so the pending transaction gets completed even when the
   * webhook hasn't fired (e.g. local dev without a public URL).
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref");
    if (!txRef) return;

    window.history.replaceState({}, "", window.location.pathname);

    setRedirectTxRef(txRef);
    setVerifyState("verifying");

    let cancelled = false;

    const verifyWithPolling = async () => {
      const maxAttempts = 15;
      const delayMs = 3000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { data, error } = await apiFetch<{
          status: string;
          amount_expected?: number;
          amount_received?: number;
        }>("/api/wallet/topup/verify", {
          method: "POST",
          body: { tx_ref: txRef },
        });

        if (cancelled) return;

        if (error) {
          setVerifyState("pending");
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        const status = data?.status;

        if (status === "completed") {
          await refreshProfile();
          if (cancelled) return;
          trackTopupCompleted({
            value_naira: Number(
              data?.amount_received ?? data?.amount_expected ?? 0,
            ),
            tx_ref: txRef,
          });
          setVerifyState("success");
          return;
        } else if (status === "failed") {
          await refreshProfile();
          if (cancelled) return;
          trackTopupFailed({ tx_ref: txRef });
          setVerifyState("failed");
          return;
        } else if (status === "partial") {
          await refreshProfile();
          if (cancelled) return;
          trackTopupPartial({
            expected_naira: Number(data?.amount_expected ?? 0),
            received_naira: Number(data?.amount_received ?? 0),
            tx_ref: txRef,
          });
          setPartialAmounts({
            expected: Number(data?.amount_expected ?? 0),
            received: Number(data?.amount_received ?? 0),
          });
          setVerifyState("partial");
          return;
        } else {
          setVerifyState("pending");
          await refreshProfile();
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      if (!cancelled) setVerifyState("pending");
    };

    void verifyWithPolling();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pendingTopups = walletTxns.filter(
      (t) => t.type === "topup" && t.status === "pending",
    );
    if (pendingTopups.length === 0) return;

    let cancelled = false;
    let stopped = false;

    const tick = async () => {
      while (!stopped && !cancelled) {
        await new Promise((r) => setTimeout(r, 8000));
        if (stopped || cancelled) break;

        let allResolved = true;
        for (const tx of pendingTopups) {
          if (cancelled || stopped) break;
          const { data } = await apiFetch<{ status: string }>(
            "/api/wallet/topup/verify",
            { method: "POST", body: { tx_ref: tx.reference } },
          );
          if (data?.status === "pending") allResolved = false;
        }

        if (!cancelled && !stopped) await refreshProfile();
        if (allResolved) break;
      }
    };

    void tick();
    return () => {
      cancelled = true;
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletTxns.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const quizIds = new Set<string>();
      for (const t of walletTxns) {
        if (t.related_quiz_id) quizIds.add(t.related_quiz_id);
      }
      if (quizIds.size === 0) return;
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .in("id", Array.from(quizIds));
      if (cancelled || !data) return;
      const m = new Map<string, DbQuiz>();
      for (const q of data) m.set(q.id, q as DbQuiz);
      setQuizzesById(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [walletTxns]);

  const walletBalanceKobo = walletBalance;

  const allRelevantTxns = useMemo(() => {
    return walletTxns
      .filter((t) => isTopupTxn(t) || isPaymentTxn(t))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [walletTxns]);

  const filteredTxns = useMemo(() => {
    if (filter === "topups") return allRelevantTxns.filter(isTopupTxn);
    if (filter === "payments") return allRelevantTxns.filter(isPaymentTxn);
    return allRelevantTxns;
  }, [allRelevantTxns, filter]);

  const groups = useMemo(() => {
    const now = new Date();
    const out: { label: string; items: DbWalletTxn[] }[] = [];
    for (const t of filteredTxns) {
      const label = monthHeaderLabel(t.created_at, now);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(t);
      else out.push({ label, items: [t] });
    }
    return out;
  }, [filteredTxns]);

  const selectedAmountKobo = selectedPreset ?? Number(customAmount) * 100;
  const selectedAmountNaira = selectedAmountKobo / 100;
  const canContinue = selectedAmountKobo >= 10000;

  const openSheet = () => {
    setTopUpStep("amount");
    setSelectedPreset(null);
    setCustomAmount("");
    setSuccessAmount(0);
    setTopupError(null);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
  };

  const pollForCompletion = async (txRef: string, maxPolls = 20) => {
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      await refreshProfile();
      const found = walletTxns.find((t) => t.reference === txRef);
      if (found && found.status === "completed") return true;
      if (found && found.status === "failed") return false;
    }
    await refreshProfile();
    const final = walletTxns.find((t) => t.reference === txRef);
    return final?.status === "completed";
  };

  const handleContinue = async () => {
    if (!canContinue) return;
    setTopupError(null);
    setTopUpStep("processing");

    const { data, error } = await apiFetch<{
      payment_link: string;
      tx_ref: string;
    }>("/api/wallet/topup/initiate", {
      method: "POST",
      body: { amount: selectedAmountNaira },
    });

    if (error || !data) {
      setTopupError(error ?? "Failed to initiate top-up");
      setTopUpStep("amount");
      return;
    }

    const { payment_link, tx_ref } = data;
    if (!payment_link) {
      setTopupError("Unable to start payment, please try again");
      setTopUpStep("amount");
      return;
    }
    // Fire begin_checkout just before the redirect — this is the last
    // JS execution point before the page navigates away to Flutterwave.
    trackBeginCheckout({ value_naira: selectedAmountNaira, tx_ref });
    window.location.href = payment_link;
  };

  const handleSuccessClose = () => {
    void refreshProfile();
    closeSheet();
  };

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  return (
    <>
      <PageContainer className="!max-w-[1100px]">
        <div className="space-y-6 lg:space-y-7">
          {/* === REDIRECT-BACK VERIFICATION BANNER === */}
          {verifyState === "verifying" && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20">
              <Loader2
                className="w-5 h-5 text-primary shrink-0 animate-spin"
                strokeWidth={2.2}
              />
              <div>
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  Confirming your payment…
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  Checking with Flutterwave — this only takes a moment.
                </p>
              </div>
            </div>
          )}

          {verifyState === "success" && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-success-bg border border-success/25">
              <CheckCircle2
                className="w-5 h-5 text-success shrink-0"
                strokeWidth={2.2}
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  Top-up confirmed!
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  Your wallet has been credited. Your new balance is shown
                  below.
                  {redirectTxRef && (
                    <>
                      {" "}
                      · <span className="font-mono">{redirectTxRef}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setVerifyState("idle")}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface active:scale-95 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {verifyState === "pending" && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-bg border border-warning/25">
              <Info
                className="w-5 h-5 text-warning shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  Payment is being processed
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  We haven't received confirmation yet. Your balance will update
                  automatically once Flutterwave confirms the payment — usually
                  within a minute.
                </p>
              </div>
              <button
                onClick={() => setVerifyState("idle")}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface active:scale-95 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {verifyState === "partial" && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-warning-bg border border-warning/25">
              <Info
                className="w-5 h-5 text-warning shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  We received less than expected
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  {partialAmounts ? (
                    <>
                      You transferred{" "}
                      <span className="font-semibold text-text">
                        {formatNaira(kobo(partialAmounts.received))}
                      </span>{" "}
                      of the{" "}
                      <span className="font-semibold text-text">
                        {formatNaira(kobo(partialAmounts.expected))}
                      </span>{" "}
                      expected. Your wallet hasn't been credited yet — this
                      wasn't enough to complete the top-up.
                    </>
                  ) : (
                    "The amount received was less than what you set out to pay, so your wallet hasn't been credited yet."
                  )}
                </p>
                <p className="mt-1.5 text-xs text-text-soft">
                  You can start a new top-up for the remaining balance, or
                  contact support with your reference
                  {redirectTxRef && (
                    <>
                      {" "}
                      (<span className="font-mono">{redirectTxRef}</span>)
                    </>
                  )}{" "}
                  if you believe this is a mistake.
                </p>
              </div>
              <button
                onClick={() => setVerifyState("idle")}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface active:scale-95 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {verifyState === "failed" && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-danger-bg border border-danger/25">
              <Info
                className="w-5 h-5 text-danger shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-text leading-tight">
                  Payment failed
                </p>
                <p className="mt-0.5 text-xs text-text-soft">
                  Flutterwave reported that this payment did not go through. No
                  funds were deducted. Please try again.
                </p>
              </div>
              <button
                onClick={() => setVerifyState("idle")}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface active:scale-95 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )}

          {/* === 1. BALANCE HEADER === */}
          <Card
            padded={false}
            className="relative overflow-hidden bg-primary text-cream border-primary/30 shadow-elevated"
          >
            <div className="absolute inset-0 opacity-[0.09] pointer-events-none">
              <div className="absolute -top-14 -right-10 h-56 w-56 rounded-full bg-cream" />
              <div className="absolute -bottom-16 -left-8 h-64 w-64 rounded-full bg-cream" />
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
                    <span className="!bg-success h-2 w-2 rounded-full" />
                    Wallet balance
                  </Badge>
                  <p className="mt-3 font-heading font-bold text-[38px] sm:text-[44px] lg:text-[48px] leading-none tracking-tight">
                    {formatNaira(walletBalanceKobo)}
                  </p>
                  <p className="mt-2 text-[13px] text-cream/80 max-w-md leading-relaxed">
                    Ready to spend on any PrepUniv quiz. Pay once, and it's
                    yours to retake forever.
                  </p>
                </div>
                <button
                  onClick={openSheet}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-cream text-primary font-heading font-semibold shadow-card active:scale-[0.98] transition-all hover:bg-cream/95 shrink-0 self-start sm:self-center"
                >
                  <Plus className="w-[18px] h-[18px]" strokeWidth={2.3} />
                  Top up wallet
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
                <MiniStat
                  label="Inflow"
                  value={formatNaira(
                    allRelevantTxns
                      .filter(
                        (t) =>
                          isTopupTxn(t) &&
                          t.status === "completed" &&
                          sameMonth(t.created_at, new Date()),
                      )
                      .reduce((s, t) => s + kobo(t.amount), 0),
                  )}
                  icon={<ArrowUpRight className="w-4 h-4" />}
                  tone="pos"
                />
                <MiniStat
                  label="Spent"
                  value={formatNaira(
                    Math.abs(
                      allRelevantTxns
                        .filter(
                          (t) =>
                            isPaymentTxn(t) &&
                            t.status === "completed" &&
                            sameMonth(t.created_at, new Date()),
                        )
                        .reduce((s, t) => s + kobo(t.amount), 0),
                    ),
                  )}
                  icon={<Receipt className="w-4 h-4" />}
                  tone="neu"
                />
                <MiniStat
                  label="Activity"
                  value={String(
                    allRelevantTxns.filter((t) =>
                      sameMonth(t.created_at, new Date()),
                    ).length,
                  )}
                  icon={<Sparkles className="w-4 h-4" />}
                  tone="neu"
                />
              </div>
            </div>
          </Card>

          {/* === PAY-ONCE REMINDER BANNER === */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-secondary/10 border border-secondary/15">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <Info className="w-[18px] h-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold text-[13px] text-text leading-tight">
                Pay once, keep it forever
              </p>
              <p className="mt-1 text-sm text-text-soft leading-relaxed">
                Once you pay for a quiz, it stays unlocked in your library
                permanently. Retake it anytime — no repeat charges, no
                expirations.
              </p>
            </div>
          </div>

          {/* === 3. TRANSACTION HISTORY === */}
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border/50">
              <div>
                <Badge variant="secondary" size="sm" dot>
                  <WalletIcon className="w-3 h-3" />
                  Activity
                </Badge>
                <h2 className="mt-2 font-heading font-semibold text-xl lg:text-[22px] text-text tracking-tight leading-tight">
                  Transaction history
                </h2>
                <p className="mt-1 text-sm text-text-soft">
                  Every top-up and quiz payment, newest first.
                </p>
              </div>
              <div className="inline-flex items-center p-1 rounded-2xl bg-surface/60 border border-border/50 w-full sm:w-auto">
                {(["all", "topups", "payments"] as FilterKey[]).map((k) => {
                  const active = filter === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`flex-1 sm:flex-none h-9 px-3.5 rounded-xl text-sm font-heading font-medium transition-all duration-150 ${
                        active
                          ? "bg-primary text-cream shadow-soft"
                          : "text-text-soft hover:text-text"
                      }`}
                    >
                      {k === "all"
                        ? "All"
                        : k === "topups"
                          ? "Top-ups"
                          : "Payments"}
                    </button>
                  );
                })}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-3xl bg-surface/80 text-muted flex items-center justify-center mb-4 shadow-card ring-1 ring-border/50">
                  <Inbox className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text leading-tight">
                  No transactions yet
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-sm leading-relaxed">
                  {filter === "topups"
                    ? "You haven't made any top-ups yet. Add some funds to get started."
                    : filter === "payments"
                      ? "You haven't purchased any quizzes yet. Your quiz payments will appear here."
                      : "Your wallet activity will appear here once you top up or buy a quiz."}
                </p>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-surface/80 text-text font-heading font-medium text-sm border border-border/50 active:scale-95 transition-transform"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Show all transactions
                  </button>
                )}
                {filter === "all" && (
                  <button
                    onClick={openSheet}
                    className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-primary text-cream font-heading font-semibold text-sm shadow-soft active:scale-95 transition-transform"
                  >
                    <Plus className="w-[17px] h-[17px]" />
                    Top up wallet
                  </button>
                )}
              </div>
            ) : (
              <div>
                {groups.map((g) => (
                  <div key={g.label}>
                    <div className="px-5 sm:px-6 py-2.5 flex items-center gap-2 bg-surface/30 border-b border-border/40">
                      <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.16em] text-muted">
                        {g.label}
                      </p>
                      <span className="h-px flex-1 bg-border/40" />
                      <p className="text-[11px] font-heading font-semibold text-muted">
                        {g.items.length}{" "}
                        {g.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <ul className="divide-y divide-border/40 last:border-b-0">
                      {g.items.map((t) => (
                        <TxnRow
                          key={t.id}
                          txn={t}
                          quizTitle={
                            t.related_quiz_id
                              ? quizzesById.get(t.related_quiz_id)?.title
                              : undefined
                          }
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageContainer>

      {createPortal(
        <>
          {/* === 2. TOP UP FLOW: Modal (desktop) + Sheet (mobile) === */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-200 ${
              sheetOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!sheetOpen}
          >
            <div
              className="absolute inset-0 bg-text/40 backdrop-blur-sm"
              onClick={topUpStep === "processing" ? undefined : closeSheet}
            />
            <div
              className={`absolute left-0 right-0 lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 bottom-0 lg:bottom-auto
            lg:max-w-lg lg:w-[92%] lg:rounded-3xl rounded-t-3xl
            bg-cream shadow-elevated
            transition-all duration-300
            safe-bottom
            ${
              sheetOpen
                ? "translate-y-0 lg:-translate-y-1/2"
                : "translate-y-full lg:-translate-y-[calc(50%-16px)] lg:opacity-0"
            }
          `}
              style={{
                transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              <div className="lg:hidden pt-2 pb-1 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              <div className="px-5 sm:px-6 lg:px-7 pt-2 lg:pt-5 pb-3 flex items-center justify-between">
                <p className="font-heading font-bold text-lg text-text">
                  {topUpStep === "amount"
                    ? "Top up wallet"
                    : topUpStep === "processing"
                      ? "Processing payment"
                      : "Top-up successful"}
                </p>
                {topUpStep !== "processing" && (
                  <button
                    onClick={
                      topUpStep === "success" ? handleSuccessClose : closeSheet
                    }
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface active:scale-95 transition-colors shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-[18px] h-[18px]" strokeWidth={2.2} />
                  </button>
                )}
              </div>

              <div className="px-5 sm:px-6 lg:px-7 pb-6 lg:pb-7">
                {topUpStep === "amount" && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.16em] text-muted mb-2.5">
                        Quick amounts
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PRESET_AMOUNTS_KOBO.map((amtKobo) => {
                          const active = selectedPreset === amtKobo;
                          return (
                            <button
                              key={amtKobo}
                              onClick={() => {
                                setSelectedPreset(amtKobo);
                                setCustomAmount("");
                              }}
                              className={`h-12 rounded-2xl font-heading font-semibold text-[15px] transition-all duration-150 active:scale-[0.98] border ${
                                active
                                  ? "bg-primary text-cream border-primary shadow-soft"
                                  : "bg-surface/40 text-text border-border/60 hover:border-primary/40 hover:bg-surface"
                              }`}
                            >
                              {formatNaira(amtKobo)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-heading font-semibold uppercase tracking-[0.16em] text-muted mb-2.5">
                        Or enter custom amount
                      </p>
                      <div
                        className={`flex items-center h-12 rounded-2xl border transition-colors ${
                          customAmount
                            ? "bg-surface/40 border-primary/40"
                            : "bg-surface/40 border-border/60 focus-within:border-primary/40"
                        }`}
                      >
                        <span className="pl-4 pr-2 font-heading font-semibold text-lg text-text-soft">
                          ₦
                        </span>
                        <input
                          type="number"
                          min={100}
                          step={100}
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setSelectedPreset(null);
                          }}
                          placeholder="e.g. 3,500"
                          className="flex-1 bg-transparent outline-none font-heading font-semibold text-lg text-text placeholder:text-muted/60 pr-4 h-full w-full rounded-2xl"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface/50 border border-border/50 p-3.5 flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-primary/12 text-primary flex items-center justify-center">
                        <CreditCard
                          className="w-[18px] h-[18px]"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-semibold text-[13px] text-text leading-tight">
                          Payment via Flutterwave
                        </p>
                        <p className="mt-0.5 text-xs text-text-soft leading-relaxed">
                          Card, bank transfer, or USSD — all secured by
                          Flutterwave.
                        </p>
                      </div>
                    </div>

                    {topupError && (
                      <div className="rounded-2xl bg-danger-bg border border-danger/20 p-3 text-xs text-danger font-heading">
                        {topupError}
                      </div>
                    )}

                    <div className="pt-1">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!canContinue}
                        onClick={handleContinue}
                        className="h-13 !h-12"
                        rightIcon={
                          <ArrowUpRight
                            className="w-[18px] h-[18px]"
                            strokeWidth={2.2}
                          />
                        }
                      >
                        Continue to payment
                        {canContinue ? (
                          <span className="ml-1.5 font-bold bg-cream/15 rounded-xl px-2.5 py-0.5 -mr-1">
                            {formatNaira(selectedAmountKobo)}
                          </span>
                        ) : null}
                      </Button>
                    </div>
                  </div>
                )}

                {topUpStep === "processing" && (
                  <div className="py-8 sm:py-10 flex flex-col items-center text-center">
                    <div className="relative h-16 w-16 mb-5 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-3xl bg-primary/10 animate-pulse" />
                      <div className="relative h-14 w-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                        <Loader2
                          className="w-7 h-7 animate-spin"
                          strokeWidth={2.2}
                        />
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-text leading-tight">
                      Processing payment
                    </h3>
                    <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-xs">
                      Confirming{" "}
                      <span className="font-semibold text-text">
                        {formatNaira(selectedAmountKobo)}
                      </span>{" "}
                      top-up with your payment provider…
                    </p>
                    <div className="mt-5 h-1.5 w-48 rounded-full bg-surface overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary/60 via-primary to-secondary/50 animate-pulse" />
                    </div>
                  </div>
                )}

                {topUpStep === "success" && (
                  <div className="py-6 sm:py-7 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                      <div
                        className="absolute inset-0 rounded-full bg-success/15 animate-ping opacity-60"
                        style={{ animationDuration: "1.8s" }}
                      />
                      <div className="relative h-20 w-20 rounded-full bg-success/12 ring-1 ring-success/25 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-success text-cream flex items-center justify-center shadow-card animate-[pop_0.45s_cubic-bezier(0.34,1.56,0.64,1)]">
                          <CheckCircle2 className="w-8 h-8" strokeWidth={2.6} />
                        </div>
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-text leading-tight">
                      {formatNaira(successAmount)} added
                    </h3>
                    <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-xs">
                      Your wallet has been topped up successfully. The funds are
                      ready to spend on any quiz.
                    </p>

                    <div className="mt-5 w-full rounded-2xl bg-surface/50 border border-border/50 divide-y divide-border/40">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-text-soft">
                          New balance
                        </span>
                        <span className="font-heading font-bold text-[15px] text-text">
                          {formatNaira(walletBalance)}
                        </span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-text-soft">
                          Reference
                        </span>
                        <span className="font-mono text-[12px] text-text font-semibold">
                          {walletTxns[0]?.reference ?? "—"}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="mt-5 h-12"
                      onClick={handleSuccessClose}
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes pop {
              0% { transform: scale(0.3); opacity: 0; }
              60% { transform: scale(1.08); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </>,
        document.body,
      )}
    </>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "pos" | "neu";
}) {
  return (
    <div className="rounded-2xl bg-cream/10 border border-cream/15 p-2.5 sm:p-3.5 backdrop-blur-sm min-h-0">
      <div className="flex items-center gap-2 text-cream/80">
        <span className="h-6 w-6 sm:h-7 sm:w-7 rounded-xl bg-cream/15 flex items-center justify-center text-cream shrink-0">
          {icon}
        </span>
        <p className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.12em] sm:tracking-[0.14em] font-heading font-semibold leading-tight">
          {label}
        </p>
      </div>
      <p
        className={`mt-1.5 sm:mt-2 font-heading font-bold text-base sm:text-xl leading-none text-cream break-words`}
      >
        {tone === "pos" ? "+" : ""}
        {value}
      </p>
    </div>
  );
}

function TxnRow({ txn, quizTitle }: { txn: DbWalletTxn; quizTitle?: string }) {
  const topup = isTopupTxn(txn);
  const amountKobo = kobo(Math.abs(txn.amount));
  const positive = txn.amount > 0;

  const desc = topup ? "Wallet Top-up" : (quizTitle ?? "Quiz payment");
  const sub = topup
    ? "Reference: " + (txn.reference ?? "—")
    : "Purchased from marketplace";

  const statusBadge =
    txn.status === "pending" ? (
      <Badge variant="warning" size="sm" dot>
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Pending
      </Badge>
    ) : txn.status === "partial" ? (
      <Badge variant="warning" size="sm" dot>
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Partial payment
      </Badge>
    ) : txn.status === "failed" ? (
      <Badge variant="danger" size="sm" dot>
        <span className="w-1.5 h-1.5 rounded-full bg-danger" />
        Failed
      </Badge>
    ) : null;

  return (
    <li className="px-5 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3.5 sm:gap-4 min-h-[64px] active:bg-surface/40 transition-colors">
      <div
        className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center shadow-card ring-1 ring-border/40 ${
          topup
            ? "bg-primary/12 text-primary"
            : "bg-secondary/12 text-secondary"
        }`}
      >
        {topup ? (
          <ArrowUpRight className="w-[20px] h-[20px]" strokeWidth={2.2} />
        ) : (
          <Receipt className="w-[20px] h-[20px]" strokeWidth={2.1} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-heading font-semibold text-[14px] sm:text-[15px] text-text leading-tight truncate min-w-0">
            {desc}
          </p>
          {statusBadge}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[12px] sm:text-[13px] text-text-soft">
          <span>{formatDate(txn.created_at)}</span>
          <span className="h-1 w-1 rounded-full bg-muted/50" />
          <span className="truncate">{sub}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-heading font-bold text-[15px] sm:text-base leading-none ${
            positive
              ? "text-success"
              : txn.status === "failed"
                ? "text-muted"
                : "text-text"
          }`}
        >
          {txn.status === "partial" && txn.amount_received != null ? (
            // What actually arrived — not the originally requested amount,
            // since the wallet was NOT credited that full amount.
            <>+{formatNaira(kobo(txn.amount_received))}</>
          ) : (
            <>
              {positive ? "+" : "−"}
              {formatNaira(amountKobo)}
            </>
          )}
        </p>
        {txn.status === "completed" && (
          <p className="mt-1 text-[11px] font-heading font-medium text-muted">
            {topup ? "Completed" : "Paid"}
          </p>
        )}
        {txn.status === "partial" && (
          <p className="mt-1 text-[11px] font-heading font-medium text-warning">
            of {formatNaira(amountKobo)} requested — not credited
          </p>
        )}
      </div>
    </li>
  );
}
