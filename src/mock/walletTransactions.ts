import type { WalletTransaction } from './types';

export const walletTransactions: WalletTransaction[] = [
  { id: 'txn_001', user_id: 'user_001', amount: 500000, type: 'deposit', reference: 'FLW-PAY-ABC123', status: 'success', created_at: '2026-07-10T12:30:00Z' },
  { id: 'txn_002', user_id: 'user_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-001', related_quiz_id: 'quiz_001', status: 'success', created_at: '2026-07-12T09:15:00Z' },
  { id: 'txn_003', user_id: 'user_001', amount: -180000, type: 'purchase', reference: 'QUIZ-PAY-003', related_quiz_id: 'quiz_003', status: 'success', created_at: '2026-07-15T14:45:00Z' },
  { id: 'txn_004', user_id: 'user_001', amount: 1000000, type: 'deposit', reference: 'FLW-PAY-XYZ789', status: 'success', created_at: '2026-07-20T08:00:00Z' },
  { id: 'txn_011', user_id: 'user_001', amount: -120000, type: 'purchase', reference: 'QUIZ-PAY-005', related_quiz_id: 'quiz_005', status: 'success', created_at: '2026-07-18T07:10:00Z' },
  { id: 'txn_012', user_id: 'user_001', amount: -50000, type: 'purchase', reference: 'QUIZ-PAY-PENDING', related_quiz_id: 'quiz_002', status: 'pending', created_at: '2026-07-25T10:10:00Z' },

  { id: 'txn_u01', user_id: 'user_001', amount: 200000, type: 'deposit', reference: 'FLW-PAY-JUL27A', status: 'success', created_at: '2026-07-27T06:22:00Z' },
  { id: 'txn_u02', user_id: 'user_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-006-U1', related_quiz_id: 'quiz_006', status: 'success', created_at: '2026-07-26T11:05:00Z' },
  { id: 'txn_u03', user_id: 'user_001', amount: 100000, type: 'deposit', reference: 'FLW-PAY-JUL25', status: 'success', created_at: '2026-07-25T16:40:00Z' },
  { id: 'txn_u04', user_id: 'user_001', amount: -200000, type: 'purchase', reference: 'QUIZ-PAY-002-U1', related_quiz_id: 'quiz_002', status: 'failed', created_at: '2026-07-24T09:55:00Z' },
  { id: 'txn_u05', user_id: 'user_001', amount: 500000, type: 'deposit', reference: 'FLW-PAY-JUL22', status: 'success', created_at: '2026-07-22T13:18:00Z' },
  { id: 'txn_u06', user_id: 'user_001', amount: 20000, type: 'deposit', reference: 'FLW-PAY-PENDING-JUL21', status: 'pending', created_at: '2026-07-21T19:03:00Z' },
  { id: 'txn_u07', user_id: 'user_001', amount: -170000, type: 'purchase', reference: 'QUIZ-PAY-004-U1', related_quiz_id: 'quiz_004', status: 'success', created_at: '2026-07-16T15:22:00Z' },

  { id: 'txn_u08', user_id: 'user_001', amount: 100000, type: 'deposit', reference: 'FLW-PAY-JUN28', status: 'success', created_at: '2026-06-28T10:10:00Z' },
  { id: 'txn_u09', user_id: 'user_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-JUN27-1', related_quiz_id: 'quiz_001', status: 'success', created_at: '2026-06-27T14:30:00Z' },
  { id: 'txn_u10', user_id: 'user_001', amount: 200000, type: 'deposit', reference: 'FLW-PAY-JUN25', status: 'success', created_at: '2026-06-25T08:05:00Z' },
  { id: 'txn_u11', user_id: 'user_001', amount: -120000, type: 'purchase', reference: 'QUIZ-PAY-JUN22-5', related_quiz_id: 'quiz_005', status: 'success', created_at: '2026-06-22T17:48:00Z' },
  { id: 'txn_u12', user_id: 'user_001', amount: -180000, type: 'purchase', reference: 'QUIZ-PAY-JUN20-3', related_quiz_id: 'quiz_003', status: 'success', created_at: '2026-06-20T11:33:00Z' },
  { id: 'txn_u13', user_id: 'user_001', amount: 50000, type: 'deposit', reference: 'FLW-PAY-JUN18', status: 'failed', created_at: '2026-06-18T20:15:00Z' },
  { id: 'txn_u14', user_id: 'user_001', amount: 2000000, type: 'deposit', reference: 'FLW-PAY-JUN15', status: 'success', created_at: '2026-06-15T07:00:00Z' },
  { id: 'txn_u15', user_id: 'user_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-JUN12-6', related_quiz_id: 'quiz_006', status: 'success', created_at: '2026-06-12T13:22:00Z' },
  { id: 'txn_u16', user_id: 'user_001', amount: -200000, type: 'purchase', reference: 'QUIZ-PAY-JUN08-2', related_quiz_id: 'quiz_002', status: 'success', created_at: '2026-06-08T10:05:00Z' },
  { id: 'txn_u17', user_id: 'user_001', amount: 100000, type: 'deposit', reference: 'FLW-PAY-JUN05', status: 'success', created_at: '2026-06-05T16:40:00Z' },

  { id: 'txn_005', user_id: 'creator_001', amount: -3000000, type: 'payout', reference: 'PAYOUT-JUL-2026', status: 'success', created_at: '2026-07-05T10:00:00Z' },
  { id: 'txn_006', user_id: 'creator_001', amount: 5450000, type: 'deposit', reference: 'SALES-AGG-JUL2', status: 'success', created_at: '2026-07-22T11:30:00Z' },
  { id: 'txn_017', user_id: 'creator_001', amount: 4200000, type: 'deposit', reference: 'SALES-AGG-JUL3', status: 'success', created_at: '2026-07-26T09:00:00Z' },
  { id: 'txn_018', user_id: 'creator_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-006', related_quiz_id: 'quiz_006', status: 'success', created_at: '2026-07-19T12:00:00Z' },
  { id: 'txn_c01', user_id: 'creator_001', amount: 500000, type: 'deposit', reference: 'FLW-PAY-CREATOR-JUL27', status: 'success', created_at: '2026-07-27T08:30:00Z' },
  { id: 'txn_c02', user_id: 'creator_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-CR-001', related_quiz_id: 'quiz_001', status: 'success', created_at: '2026-06-20T14:00:00Z' },

  { id: 'txn_013', user_id: 'admin_001', amount: 2000000, type: 'deposit', reference: 'FLW-PAY-ADMIN-TOPUP', status: 'success', created_at: '2026-07-02T09:00:00Z' },
  { id: 'txn_014', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-01', related_quiz_id: 'quiz_001', status: 'success', created_at: '2026-07-12T10:00:00Z' },
  { id: 'txn_015', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-02', related_quiz_id: 'quiz_002', status: 'success', created_at: '2026-07-14T11:00:00Z' },
  { id: 'txn_016', user_id: 'admin_001', amount: -150000, type: 'purchase', reference: 'QUIZ-PAY-ADM-03', related_quiz_id: 'quiz_003', status: 'success', created_at: '2026-07-14T11:05:00Z' },
  { id: 'txn_019', user_id: 'admin_001', amount: -80000, type: 'purchase', reference: 'QUIZ-PAY-ADM-06', related_quiz_id: 'quiz_006', status: 'success', created_at: '2026-07-23T13:00:00Z' },
  { id: 'txn_a01', user_id: 'admin_001', amount: 1000000, type: 'deposit', reference: 'FLW-PAY-ADM-JUL26', status: 'success', created_at: '2026-07-26T10:00:00Z' },
  { id: 'txn_a02', user_id: 'admin_001', amount: -180000, type: 'purchase', reference: 'QUIZ-PAY-ADM-JUL05', related_quiz_id: 'quiz_003', status: 'success', created_at: '2026-07-05T09:00:00Z' },
];
