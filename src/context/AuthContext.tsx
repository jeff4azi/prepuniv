import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react';
import { profiles, purchasedQuizIdsByUser, walletBalancesByUser, type Profile, type UserRole } from '../mock';

interface SessionUser extends Profile {}

interface AuthContextValue {
  currentUser: Profile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  walletBalance: number;
  purchasedQuizIds: string[];
  hasPurchasedQuiz: (quizId: string) => boolean;

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

  const allProfiles = useMemo(() => [...extraProfiles, ...profiles], [extraProfiles]);

  const currentUser = useMemo(() => {
    if (sessionUserId) {
      const match = allProfiles.find((p) => p.id === sessionUserId);
      if (match) return match;
    }
    return allProfiles.find((p) => p.id === ROLE_TO_PROFILE_ID[currentRole]) ?? profiles[0];
  }, [sessionUserId, currentRole, allProfiles]);

  const walletBalance = useMemo(
    () => walletBalancesByUser[currentUser.id] ?? 2500,
    [currentUser.id],
  );

  const purchasedQuizIds = useMemo(
    () => purchasedQuizIdsByUser[currentUser.id] ?? [],
    [currentUser.id],
  );

  const hasPurchasedQuiz = (quizId: string) => purchasedQuizIds.includes(quizId);

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
