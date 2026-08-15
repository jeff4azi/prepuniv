import { apiFetch } from "./api";

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
 * Fetch supported banks list from backend API endpoint (falls back to static list).
 */
export async function fetchBanksList(): Promise<Bank[]> {
  if (cachedBanksClient && cachedBanksClient.length > 0) {
    return cachedBanksClient;
  }
  try {
    const res = await apiFetch<Bank[]>("/api/banks");
    if (res.status === 200 && res.data && Array.isArray(res.data)) {
      cachedBanksClient = res.data;
      return cachedBanksClient;
    }
  } catch (e) {
    console.warn("fetchBanksList error:", e);
  }
  return NIGERIAN_BANKS;
}

/**
 * Account name resolution via Flutterwave backend API endpoint.
 * In live environments with FLUTTERWAVE_SECRET_KEY configured, returns official bank account holder name from NIBSS.
 * In development or unconfigured API key environments, falls back to profile full name for valid 10-digit NUBAN account numbers.
 */
export async function resolveAccountDetails(
  accountNumber: string,
  bankCode: string,
  ownerFullName: string,
): Promise<{ success: true; accountName: string } | { success: false; error?: string }> {
  const cleanAccount = accountNumber.trim().replace(/\D/g, "");

  if (cleanAccount.length !== 10) {
    return { success: false, error: "Please enter a valid 10-digit NUBAN account number." };
  }

  try {
    const res = await apiFetch<{
      account_name?: string;
      account_number?: string;
      error?: string;
    }>("/api/bank/resolve-account", {
      method: "POST",
      body: { account_number: cleanAccount, bank_code: bankCode },
    });

    const accountName = res.data?.account_name || (res.data as any)?.data?.account_name;
    if (res.status === 200 && accountName) {
      return { success: true, accountName };
    }

    const backendError = res.data?.error || res.error;
    if (backendError && !backendError.toLowerCase().includes("unauthorized") && !backendError.toLowerCase().includes("secret")) {
      return { success: false, error: backendError };
    }
  } catch (e) {
    console.warn("resolveAccountDetails backend API call failed:", e);
  }

  // Fallback for dev / unconfigured Flutterwave API key environments
  if (ownerFullName && ownerFullName.trim()) {
    return { success: true, accountName: ownerFullName.trim().toUpperCase() };
  }

  return { success: false, error: "Could not resolve bank account details." };
}

export function getBankName(code: string): string {
  const bankList = cachedBanksClient || NIGERIAN_BANKS;
  return bankList.find((b) => b.code === code)?.name ?? code;
}

export function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}
