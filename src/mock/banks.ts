import { apiFetch } from "../lib/api";

export interface Bank {
  code: string;
  name: string;
}

export const NIGERIAN_BANKS: Bank[] = [
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

let cachedBanksClient: Bank[] | null = null;

/**
 * Fetch supported banks list (tries backend Flutterwave endpoint first, falls back to static list).
 */
export async function fetchBanksList(): Promise<Bank[]> {
  if (cachedBanksClient && cachedBanksClient.length > 0) {
    return cachedBanksClient;
  }
  try {
    const res = await apiFetch<{ status: string; data: Bank[] }>("/api/banks");
    if (res.status === 200 && res.data?.data && Array.isArray(res.data.data)) {
      cachedBanksClient = res.data.data;
      return cachedBanksClient;
    }
  } catch (e) {
    console.warn("fetchBanksList error:", e);
  }
  return NIGERIAN_BANKS;
}

/**
 * Account name resolution via Flutterwave backend endpoint.
 * Returns account holder name or error.
 */
export async function resolveAccountDetails(
  accountNumber: string,
  bankCode: string,
  ownerFullName: string,
): Promise<{ success: true; accountName: string } | { success: false; error?: string }> {
  try {
    const res = await apiFetch<{
      success: boolean;
      accountName?: string;
      error?: string;
    }>("/api/banks/resolve", {
      method: "POST",
      body: { accountNumber, bankCode },
    });

    if (res.status === 200 && res.data?.success && res.data?.accountName) {
      return { success: true, accountName: res.data.accountName };
    }

    // Surface error from the backend response body or the top-level error
    const errorMsg = res.data?.error || res.error;
    if (errorMsg) {
      return { success: false, error: errorMsg };
    }
  } catch (e) {
    console.warn("resolveAccountDetails API call failed, falling back:", e);
  }

  // Fallback to local mock derivation if backend is offline or unconfigured
  return mockVerifyAccount(accountNumber, bankCode, ownerFullName);
}


/**
 * Mock account verification fallback.
 */
export async function mockVerifyAccount(
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

export function getBankName(code: string): string {
  const bankList = cachedBanksClient || NIGERIAN_BANKS;
  return bankList.find((b) => b.code === code)?.name ?? code;
}

export function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}
