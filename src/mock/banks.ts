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

/**
 * Mock account verification.
 * Returns a plausible account holder name derived from the owner's full name.
 * Failure condition: all-same-digit account numbers (e.g. "1111111111").
 */
export async function mockVerifyAccount(
  accountNumber: string,
  _bankCode: string,
  ownerFullName: string,
): Promise<{ success: true; accountName: string } | { success: false }> {
  await new Promise((r) => setTimeout(r, 1100));

  // Fail: all same digits
  const allSame = accountNumber.split("").every((c) => c === accountNumber[0]);
  if (allSame) return { success: false };

  // Derive a plausible name from the owner's name
  // Split into parts and reconstruct in a "bank response" style (SURNAME FIRSTNAME)
  const parts = ownerFullName.trim().toUpperCase().split(/\s+/);
  const accountName =
    parts.length >= 2
      ? `${parts[parts.length - 1]} ${parts[0]}${parts.length > 2 ? " " + parts.slice(1, -1).join(" ") : ""}`
      : ownerFullName.toUpperCase();

  return { success: true, accountName };
}

export function getBankName(code: string): string {
  return NIGERIAN_BANKS.find((b) => b.code === code)?.name ?? code;
}

export function maskAccountNumber(acct: string): string {
  if (acct.length <= 4) return acct;
  return "•••• •••• " + acct.slice(-4);
}
