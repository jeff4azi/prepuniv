import type { PayoutRequest } from "./types";

export const payoutRequests: PayoutRequest[] = [
  // Oldest — paid successfully
  {
    id: "pr_001",
    creator_id: "creator_001",
    amount: 2800000, // ₦28,000
    status: "paid",
    requested_at: "2026-06-01T09:00:00Z",
    processed_at: "2026-06-03T14:00:00Z",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
  // Rejected with a reason
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
  // Failed transfer
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
  // Approved, awaiting disbursement
  {
    id: "pr_004",
    creator_id: "creator_001",
    amount: 4200000, // ₦42,000
    status: "approved",
    requested_at: "2026-07-15T11:00:00Z",
    processed_at: "2026-07-16T09:30:00Z",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
  // Most recent — pending review
  {
    id: "pr_005",
    creator_id: "creator_001",
    amount: 5100000, // ₦51,000
    status: "pending",
    requested_at: "2026-07-20T14:00:00Z",
    bank_account_number: "0123456789",
    bank_code: "044",
  },
];

export function addPayoutRequest(req: PayoutRequest): void {
  payoutRequests.unshift(req);
}
