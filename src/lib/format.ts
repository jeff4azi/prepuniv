/**
 * Human-friendly compact number formatting - NOT locale currency.
 * Produces the "3k, 3.5k, 3m, 12.4m" look for stat cards.
 *
 * Rules:
 *   < 1,000          -> full number as string ("3", "42", "999")
 *   1,000 - 999,999  -> "Xk"  with 1 decimal when non-zero (3500 -> "3.5k")
 *   >= 1,000,000     -> "Xm"  with 1 decimal when non-zero (3_500_000 -> "3.5m")
 *
 * Edge rules:
 *   - 0 -> "0"
 *   - undefined / null -> "0" (defensive fallback for skeleton renders)
 */
export function formatCompactNumber(raw: number | null | undefined): string {
  if (raw == null || Number.isNaN(raw)) return "0";
  const n = Math.max(0, Math.floor(Number(raw)));

  if (n < 1_000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1_000;
    if (Math.floor(k) === k) return String(Math.floor(k)) + "k";
    const rounded = Math.round(k * 10) / 10;
    return String(rounded) + "k";
  }
  // >= 1m
  const m = n / 1_000_000;
  if (Math.floor(m) === m) return String(Math.floor(m)) + "m";
  const rounded = Math.round(m * 10) / 10;
  return String(rounded) + "m";
}

/**
 * Currency-aware wrapper for Nigerian Naira stat cards.
 * Takes an amount IN NAIRA (NOT kobo) and returns compact strings like:
 *   48_200_000 -> "\u20a648.2m"
 *   500        -> "\u20a6500"
 *
 * IMPORTANT: wallet_transactions.amount is stored in NAIRA (numeric 10,2).
 * For quiz.price (stored in kobo) divide by 100 before passing here.
 */
export function formatCompactNaira(
  nairaAmount: number | null | undefined,
): string {
  if (nairaAmount == null || Number.isNaN(nairaAmount)) return "\u20a60";
  const n = Math.max(0, Math.floor(Number(nairaAmount)));
  if (n < 1_000) return "\u20a6" + n.toLocaleString("en-NG");
  return "\u20a6" + formatCompactNumber(n);
}