import type { WalletTransaction } from './types';

export const walletTransactions: WalletTransaction[] = [
  { id: 'txn_001', user_id: 'user_001', amount: 500000, type: 'deposit', reference: 'FLW-PAY-ABC123', status: 'success', created_at: '2025-07-10T12:30:00Z' },
  { id: 'txn_002', user_id: 'user_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-001', related_quiz_id: 'quiz_001', status: 'success', created_at: '2025-07-12T09:15:00Z' },
  { id: 'txn_003', user_id: 'user_001', amount: -180000, type: 'purchase', reference: 'QUIZ-PAY-003', related_quiz_id: 'quiz_003', status: 'success', created_at: '2025-07-15T14:45:00Z' },
  { id: 'txn_004', user_id: 'user_001', amount: 1000000, type: 'deposit', reference: 'FLW-PAY-XYZ789', status: 'success', created_at: '2025-07-20T08:00:00Z' },
  { id: 'txn_011', user_id: 'user_001', amount: -120000, type: 'purchase', reference: 'QUIZ-PAY-005', related_quiz_id: 'quiz_005', status: 'success', created_at: '2025-07-18T07:10:00Z' },
  { id: 'txn_012', user_id: 'user_001', amount: -50000, type: 'purchase', reference: 'QUIZ-PAY-PENDING', related_quiz_id: 'quiz_002', status: 'pending', created_at: '2025-07-25T10:10:00Z' },

  { id: 'txn_005', user_id: 'creator_001', amount: -3000000, type: 'payout', reference: 'PAYOUT-JUL-2025', status: 'success', created_at: '2025-07-05T10:00:00Z' },
  { id: 'txn_006', user_id: 'creator_001', amount: 5450000, type: 'deposit', reference: 'SALES-AGG-JUL2', status: 'success', created_at: '2025-07-22T11:30:00Z' },
  { id: 'txn_017', user_id: 'creator_001', amount: 4200000, type: 'deposit', reference: 'SALES-AGG-JUL3', status: 'success', created_at: '2025-07-26T09:00:00Z' },
  { id: 'txn_018', user_id: 'creator_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-006', related_quiz_id: 'quiz_006', status: 'success', created_at: '2025-07-19T12:00:00Z' },

  { id: 'txn_013', user_id: 'admin_001', amount: 2000000, type: 'deposit', reference: 'FLW-PAY-ADMIN-TOPUP', status: 'success', created_at: '2025-07-02T09:00:00Z' },
  { id: 'txn_014', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-01', related_quiz_id: 'quiz_001', status: 'success', created_at: '2025-07-12T10:00:00Z' },
  { id: 'txn_015', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-02', related_quiz_id: 'quiz_002', status: 'success', created_at: '2025-07-14T11:00:00Z' },
  { id: 'txn_016', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-03', related_quiz_id: 'quiz_003', status: 'success', created_at: '2025-07-14T11:05:00Z' },
  { id: 'txn_019', user_id: 'admin_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-ADM-06', related_quiz_id: 'quiz_006', status: 'success', created_at: '2025-07-23T13:00:00Z' },
];
