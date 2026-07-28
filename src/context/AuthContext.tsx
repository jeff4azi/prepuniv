import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import {
  profiles,
  purchasedQuizIdsByUser,
  walletTransactions as baseWalletTransactions,
  type Profile,
  type UserRole,
  type WalletTransaction,
} from '../mock';

interface SessionUser extends Profile {}

function computeWalletBalance(userId: string, extraTxns: WalletTransaction[]) {
  const fromTxns = [...baseWalletTransactions, ...extraTxns]
    .filter((t) => t.user_id === userId && t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);
  return fromTxns;
}

interface AuthContextValue {
  currentUser: Profile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  walletBalance: number;
  purchasedQuizIds: string[];
  hasPurchasedQuiz: (quizId: string) => boolean;
  extraTransactions: WalletTransaction[];
  addWalletTransaction: (txn: WalletTransaction) => void;
  purchaseQuiz: (quizId: string, price: number) => Promise<boolean>;

  sessionUser: SessionUser | null;
  isLoggedIn: boolean;
  logInAsUser: (userId: string) => void;
  logInAsRole: (role: UserRole) => void;
  signUp: (data: { full_name: string; email: string }) => SessionUser;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_TO_PROFILE_ID: Record<UserRole, string> = {
  user: 'user_001',
  creator: 'creator_001',
  admin: 'admin_001',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<UserRole>('user');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [extraProfiles, setExtraProfiles] = useState<Profile[]>([]);
  const [extraTransactions, setExtraTransactions] = useState<WalletTransaction[]>([]);
  const [sessionPurchasedIds, setSessionPurchasedIds] = useState<string[]>([]);

  const allProfiles = useMemo(() => [...extraProfiles, ...profiles], [extraProfiles]);

  const currentUser = useMemo(() => {
    if (sessionUserId) {
      const match = allProfiles.find((p) => p.id === sessionUserId);
      if (match) return match;
    }
    return allProfiles.find((p) => p.id === ROLE_TO_PROFILE_ID[currentRole]) ?? profiles[0];
  }, [sessionUserId, currentRole, allProfiles]);

  useEffect(() => {
    setExtraTransactions([]);
    setSessionPurchasedIds([]);
  }, [currentUser.id]);

  const walletBalance = useMemo(
    () => computeWalletBalance(currentUser.id, extraTransactions),
    [currentUser.id, extraTransactions],
  );

  const purchasedQuizIds = useMemo(() => {
    const base = purchasedQuizIdsByUser[currentUser.id] ?? [];
    const merged = [...base, ...sessionPurchasedIds];
    return [...new Set(merged)];
  }, [currentUser.id, sessionPurchasedIds]);

  const hasPurchasedQuiz = useCallback(
    (quizId: string) => purchasedQuizIds.includes(quizId),
    [purchasedQuizIds],
  );

  const addWalletTransaction = useCallback((txn: WalletTransaction) => {
    setExtraTransactions((prev) => [txn, ...prev]);
  }, []);

  const purchaseQuiz = useCallback(
    async (quizId: string, price: number): Promise<boolean> => {
      const balance = computeWalletBalance(currentUser.id, extraTransactions);
      if (balance < price) return false;

      const txn: WalletTransaction = {
        id: 'txn_new_' + Math.random().toString(36).slice(2, 9),
        user_id: currentUser.id,
        amount: -price,
        type: 'purchase',
        reference: 'QUIZ-PAY-' + quizId.replace('quiz_', '').toUpperCase(),
        related_quiz_id: quizId,
        status: 'success',
        created_at: new Date().toISOString(),
      };
      setExtraTransactions((prev) => [txn, ...prev]);
      setSessionPurchasedIds((prev) => [...prev, quizId]);
      return true;
    },
    [currentUser.id, extraTransactions],
  );

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role);
    setSessionUserId(null);
  }, []);

  const logInAsUser = useCallback((userId: string) => {
    setSessionUserId(userId);
  }, []);

  const logInAsRole = useCallback((role: UserRole) => {
    setSessionUserId(null);
    setCurrentRoleState(role);
    const match = profiles.find((p) => p.id === ROLE_TO_PROFILE_ID[role]);
    if (match) {
      setSessionUserId(match.id);
    }
  }, []);

  const signUp = useCallback((data: { full_name: string; email: string }) => {
    const id = 'user_new_' + Math.random().toString(36).slice(2, 9);
    const newProfile: Profile = {
      id,
      full_name: data.full_name,
      email: data.email,
      role: 'user',
      is_approved_creator: false,
    };
    setExtraProfiles((prev) => [...prev, newProfile]);
    setSessionUserId(id);
    return newProfile;
  }, []);

  const logOut = useCallback(() => {
    setSessionUserId(null);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    currentRole: currentUser.role,
    setCurrentRole,
    walletBalance,
    purchasedQuizIds,
    hasPurchasedQuiz,
    extraTransactions,
    addWalletTransaction,
    purchaseQuiz,

    sessionUser: sessionUserId ? currentUser : null,
    isLoggedIn: !!sessionUserId,
    logInAsUser,
    logInAsRole,
    signUp,
    logOut,
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
