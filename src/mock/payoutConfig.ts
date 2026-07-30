/**
 * Payout configuration constants.
 * Centralised here so they're easy to tune — these drive both the UI
 * eligibility logic and any future backend validation.
 */

/** Minimum earnings balance (in kobo) required before a payout can be requested. */
export const MINIMUM_PAYOUT_THRESHOLD = 200000; // ₦2,000

/** Minimum gap in milliseconds between payout requests (7 days). */
export const PAYOUT_FREQUENCY_CAP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
