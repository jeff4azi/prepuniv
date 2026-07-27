import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { profiles, purchasedQuizIdsByUser, walletBalancesByUser, type Profile, type UserRole } from '../mock';

interface AuthContextValue {
  currentUser: Profile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  walletBalance: number;
  purchasedQuizIds: string[];
  hasPurchasedQuiz: (quizId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_TO_PROFILE_ID: Record<UserRole, string> = {
  user: 'user_001',
  creator: 'creator_001',
  admin: 'admin_001',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('user');

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === ROLE_TO_PROFILE_ID[currentRole]) ?? profiles[0],
    [currentRole],
  );

  const walletBalance = useMemo(
    () => walletBalancesByUser[currentUser.id] ?? 0,
    [currentUser.id],
  );

  const purchasedQuizIds = useMemo(
    () => purchasedQuizIdsByUser[currentUser.id] ?? [],
    [currentUser.id],
  );

  const hasPurchasedQuiz = (quizId: string) => purchasedQuizIds.includes(quizId);

  const value: AuthContextValue = {
    currentUser,
    currentRole,
    setCurrentRole,
    walletBalance,
    purchasedQuizIds,
    hasPurchasedQuiz,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
