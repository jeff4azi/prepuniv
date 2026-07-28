export type UserRole = 'user' | 'creator' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_approved_creator: boolean;
  bank_account_number?: string;
  bank_code?: string;
  avatar_url?: string;
}

export interface Course {
  id: string;
  name: string;
  is_computational: boolean;
}

export interface Quiz {
  id: string;
  creator_id: string;
  course_id: string;
  title: string;
  price: number;
  is_published: boolean;
  question_count: number;
  attempt_count: number;
  created_at: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'payout' | 'refund';
export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  reference: string;
  related_quiz_id?: string;
  status: TransactionStatus;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  is_timed: boolean;
  started_at: string;
  completed_at: string;
}
