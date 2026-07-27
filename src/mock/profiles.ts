import type { Profile } from './types';

export const profiles: Profile[] = [
  {
    id: 'user_001',
    full_name: 'Adebayo Johnson',
    email: 'adebayo.j@example.com',
    role: 'user',
    is_approved_creator: false,
    avatar_url: undefined,
  },
  {
    id: 'creator_001',
    full_name: 'Dr. Amaka Okafor',
    email: 'amaka.okafor@example.com',
    role: 'creator',
    is_approved_creator: true,
    bank_account_number: '0123456789',
    bank_code: '044',
    avatar_url: undefined,
  },
  {
    id: 'admin_001',
    full_name: 'Super Admin',
    email: 'admin@prepuniv.ng',
    role: 'admin',
    is_approved_creator: true,
    bank_account_number: '9876543210',
    bank_code: '011',
    avatar_url: undefined,
  },
];

export const purchasedQuizIdsByUser: Record<string, string[]> = {
  user_001: ['quiz_001', 'quiz_003'],
  creator_001: [],
  admin_001: ['quiz_001', 'quiz_002', 'quiz_003', 'quiz_004'],
};

export const walletBalancesByUser: Record<string, number> = {
  user_001: 12500,
  creator_001: 84500,
  admin_001: 500000,
};
