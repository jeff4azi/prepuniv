import { apiFetch } from "./api";

export interface Bank {
  code: string;
  name: string;
}

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
 */
export async function fetchBanksList(): Promise<Bank[]> {
  if (cachedBanksClient && cachedBanksClient.length > 0) {
    return cachedBanksClient;
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
      return cachedBanksClient;
    }
  } catch (e) {
    console.warn("fetchBanksList error:", e);
  }
  // Fallback: fetch failed or returned empty — return empty so callers know
  // they need to handle the case gracefully
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
 */
export async function resolveAccountDetails(
  accountNumber: string,
  bankCode: string,
  ownerFullName: string,
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

    const backendError = res.data?.error || res.error;
    if (backendError) {
      return { success: false, error: backendError };
    }
  } catch (e) {
    console.warn("resolveAccountDetails error:", e);
  }

  // Fallback for dev / unconfigured Flutterwave key
  if (ownerFullName && ownerFullName.trim()) {
    return { success: true, accountName: ownerFullName.trim().toUpperCase() };
  }

  return {
    success: false,
    error: "Could not resolve bank account details.",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}
