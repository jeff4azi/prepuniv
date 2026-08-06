import type { PayoutRequest } from "./types";

export const payoutRequests: PayoutRequest[] = [
  // ── creator_001 (Dr. Amaka Okafor) ────────────────────────────────────────
  {
    id: "pr_001",
    creator_id: "creator_001",
    amount: 2800000, // ₦28,000
    status: "paid",
    requested_at: "2026-06-01T09:00:00Z",
    processed_at: "2026-06-03T14:00:00Z",
    bank_account_number: "0123456789",
    bank_code: "044", // Access Bank
  },
  {
    id: "pr_002",
    creator_id: "creator_001",
    amount: 1500000, // ₦15,000
    status: "rejected",
    requested_at: "2026-06-18T10:30:00Z",
    processed_at: "2026-06-19T09:00:00Z",
    notes:
      "Account name mismatch — the bank account provided does not match the name on your PrepUniv profile. Please update your bank details in Settings and resubmit.",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
  {
    id: "pr_003",
    creator_id: "creator_001",
    amount: 3500000, // ₦35,000
    status: "failed",
    requested_at: "2026-07-05T08:00:00Z",
    processed_at: "2026-07-05T16:45:00Z",
    notes:
      "Transfer failed — the receiving bank returned an error. Please verify your account number in Settings and try again.",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
  {
    id: "pr_004",
    creator_id: "creator_001",
    amount: 4200000, // ₦42,000
    status: "paid",
    requested_at: "2026-07-15T11:00:00Z",
    processed_at: "2026-07-16T09:30:00Z",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
  {
    id: "pr_005",
    creator_id: "creator_001",
    amount: 5100000, // ₦51,000
    status: "pending",
    requested_at: "2026-07-20T14:00:00Z",
    bank_account_number: "0123456789",
    bank_code: "044",
  },

  // ── creator_002 (Prof. Ibrahim Musa) ──────────────────────────────────────
  {
    id: "pr_006",
    creator_id: "creator_002",
    amount: 6200000, // ₦62,000
    status: "paid",
    requested_at: "2026-06-10T08:00:00Z",
    processed_at: "2026-06-12T10:00:00Z",
    bank_account_number: "0234567890",
    bank_code: "058", // GTBank
  },
  {
    id: "pr_007",
    creator_id: "creator_002",
    amount: 8750000, // ₦87,500
    status: "paid",
    requested_at: "2026-07-02T09:30:00Z",
    processed_at: "2026-07-03T11:00:00Z",
    bank_account_number: "0234567890",
    bank_code: "058",
  },
  {
    id: "pr_008",
    creator_id: "creator_002",
    amount: 7300000, // ₦73,000
    status: "pending",
    requested_at: "2026-07-22T10:15:00Z",
    bank_account_number: "0234567890",
    bank_code: "058",
  },

  // ── creator_003 (Chidi Eze) ────────────────────────────────────────────────
  {
    id: "pr_009",
    creator_id: "creator_003",
    amount: 2200000, // ₦22,000
    status: "paid",
    requested_at: "2026-06-20T14:00:00Z",
    processed_at: "2026-06-22T09:00:00Z",
    bank_account_number: "0345678901",
    bank_code: "033", // UBA
  },
  {
    id: "pr_010",
    creator_id: "creator_003",
    amount: 1800000, // ₦18,000
    status: "rejected",
    requested_at: "2026-07-08T11:00:00Z",
    processed_at: "2026-07-09T08:00:00Z",
    notes:
      "Minimum payout threshold not met at time of request. Current balance was below ₦20,000. Please wait until your balance reaches the threshold and resubmit.",
    bank_account_number: "0345678901",
    bank_code: "033",
  },
  {
    id: "pr_011",
    creator_id: "creator_003",
    amount: 3100000, // ₦31,000
    status: "failed",
    requested_at: "2026-07-18T09:00:00Z",
    processed_at: "2026-07-18T14:30:00Z",
    notes:
      "Transfer failed — beneficiary bank timed out. No funds were deducted. Please retry.",
    bank_account_number: "0345678901",
    bank_code: "033",
  },
  {
    id: "pr_012",
    creator_id: "creator_003",
    amount: 4500000, // ₦45,000
    status: "pending",
    requested_at: "2026-07-25T16:00:00Z",
    bank_account_number: "0345678901",
    bank_code: "033",
  },
];

export function addPayoutRequest(req: PayoutRequest): void {
  payoutRequests.unshift(req);
}

/**
 * Update a payout request's status, processed_at timestamp, and optional notes.
 * Used by the admin payout review page.
 */
export function updatePayoutRequest(
  id: string,
  status: PayoutRequest["status"],
  notes?: string,
): void {
  const req = payoutRequests.find((r) => r.id === id);
  if (req) {
    req.status = status;
    req.processed_at = new Date().toISOString();
    if (notes !== undefined) req.notes = notes;
  }
}
