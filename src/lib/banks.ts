import { apiFetch } from "./api";

export interface Bank {
  code: string;
  name: string;
}

export type BanksFetchResult =
  | { ok: true; banks: Bank[]; cached: boolean }
  | { ok: false; error: string };

// ─── Module-level cache ───────────────────────────────────────────────────────
// Persists for the lifetime of the browser tab — avoids re-fetching on every
// page visit. Populated on first call to fetchBanksList().

let cachedBanksClient: Bank[] | null = null;

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetch the supported banks list from the backend (which in turn caches from
 * Flutterwave for 24 h server-side). Result is cached in-memory for the tab
 * lifetime so subsequent calls are instant.
 *
 * Backend returns: { status: "success", data: Bank[], source: "..." }
 *
 * Returns a discriminated union so callers can distinguish between
 * "successfully loaded empty list" (impossible here but typed) and a
 * network/gateway failure (new behavior — previously silently returned []).
 */
export async function fetchBanksList(): Promise<BanksFetchResult> {
  if (cachedBanksClient && cachedBanksClient.length > 0) {
    return { ok: true, banks: cachedBanksClient, cached: true };
  }
  try {
    const res = await apiFetch<{
      status: string;
      data: Bank[];
      source: string;
    }>("/api/banks");
    if (
      res.status === 200 &&
      res.data?.data &&
      Array.isArray(res.data.data) &&
      res.data.data.length > 0
    ) {
      cachedBanksClient = res.data.data;
      return { ok: true, banks: cachedBanksClient, cached: false };
    }
    const err =
      res.error ||
      (res.status === 502
        ? "Could not load banks from payment gateway. Please try again later."
        : res.status === 503
          ? "Payment gateway not configured — cannot load banks."
          : res.status === 0
            ? "Network error — please check your connection and retry."
            : `Could not load banks (HTTP ${res.status}). Please try again.`);
    return { ok: false, error: err };
  } catch (e) {
    console.warn("fetchBanksList error:", e);
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not load banks. Please try again.",
    };
  }
}

/**
 * Convenience wrapper that returns just an array (for existing callers that
 * don't need retry/error UI). Returns [] on failure. Replaces the old
 * fetchBanksList() signature for backward compatibility in non-critical
 * callers (e.g. AdminPayoutsPage read-only views that just want a display
 * name fallback).
 */
export async function fetchBanksListSimple(): Promise<Bank[]> {
  const res = await fetchBanksList();
  if (res.ok) return res.banks;
  return [];
}

/**
 * Synchronously look up a bank name from the in-memory cache.
 * Returns the code itself as fallback if the list hasn't loaded or the code
 * isn't found — callers should call fetchBanksList() first.
 */
export function getBankName(code: string): string {
  if (!code) return "";
  if (cachedBanksClient && cachedBanksClient.length > 0) {
    const match = cachedBanksClient.find((b) => b.code === code);
    if (match) return match.name;
  }
  return code; // Fallback: show code until list loads
}

/**
 * Returns the full bank list from cache, or empty array if not loaded yet.
 */
export function getCachedBanks(): Bank[] {
  return cachedBanksClient ?? [];
}

// ─── Account resolution ───────────────────────────────────────────────────────

/**
 * Resolve account holder name via backend → Flutterwave.
 * Backend endpoint: POST /api/banks/resolve
 * Body: { accountNumber, bankCode }   (camelCase — matches backend)
 *
 * No fabricated fallback: if the backend can't verify, success=false is
 * returned and the caller must surface the error to the user.
 */
export async function resolveAccountDetails(
  accountNumber: string,
  bankCode: string,
): Promise<
  { success: true; accountName: string } | { success: false; error?: string }
> {
  const cleanAccount = accountNumber.trim().replace(/\D/g, "");

  if (cleanAccount.length !== 10) {
    return {
      success: false,
      error: "Please enter a valid 10-digit NUBAN account number.",
    };
  }

  try {
    const res = await apiFetch<{
      success?: boolean;
      accountName?: string;
      error?: string;
    }>("/api/banks/resolve", {
      method: "POST",
      // Backend expects camelCase: accountNumber + bankCode
      body: { accountNumber: cleanAccount, bankCode },
    });

    if (res.status === 200 && res.data?.accountName) {
      return { success: true, accountName: res.data.accountName };
    }

    const backendError =
      res.data?.error ||
      res.error ||
      (res.status === 503
        ? "Payment gateway not configured — cannot verify account."
        : res.status === 502
          ? "Could not verify — payment gateway unavailable, please try again later."
          : res.status === 0
            ? "Network error — please check your connection."
            : null);
    return {
      success: false,
      error:
        backendError ||
        "Could not verify this account — please check the account number and bank selected.",
    };
  } catch (e) {
    console.warn("resolveAccountDetails error:", e);
    return {
      success: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not verify this account. Please try again.",
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}
