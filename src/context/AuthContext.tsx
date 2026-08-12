import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Session, AuthError, User } from "@supabase/supabase-js";
import {
  supabase,
  type DbProfile,
  type DbCourse,
  type DbQuiz,
  type DbQuizAttempt,
  type DbWalletTxn,
} from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { formatNaira } from "../components/QuizCard";

export type UserRole = "user" | "creator" | "admin";

/**
 * Extended user shape that pages expect. Combines the DB profile
 * (which has role, university_id, bank details) with the session.user
 * info (email, email_confirmed_at) — so the rest of the app can read
 * a single `currentUser` object just like the old mock context.
 */
export interface CurrentUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_approved_creator: boolean;
  is_suspended: boolean;
  university_id: string;
  email_confirmed: boolean;
  agreement_accepted_at?: string;
  bank_account_number?: string;
  bank_code?: string;
  bank_name?: string;
  bank_account_name?: string;
  bio?: string;
  avatar_url?: string;
  joined_at?: string;
}

export interface Profile extends DbProfile {}

interface BankDetails {
  bank_code: string;
  bank_account_number: string;
  bank_name?: string;
  bank_account_name?: string;
}

interface AuthContextValue {
  session: Session | null;
  sessionUser: User | null;
  profile: Profile | null;
  currentUser: CurrentUser;
  isLoading: boolean;
  /** JWT access token from the Supabase session — for authenticated API calls */
  authToken: string | undefined;

  isLoggedIn: boolean;
  isAdmin: boolean;
  isApprovedCreator: boolean;

  walletBalance: number;
  walletTxns: DbWalletTxn[];
  purchasedQuizIds: string[];
  hasPurchasedQuiz: (quizId: string) => boolean;
  purchaseQuiz: (
    quizId: string,
    isTimed: boolean,
    timeLimitSeconds?: number,
  ) => Promise<{ ok: boolean; attempt_id?: string }>;

  creatorEarningsBalance: number;
  creatorLifetimeEarnings: number;
  creatorThisMonthEarnings: number;
  formatNaira: (amount: number) => string;

  signUp: (args: {
    full_name: string;
    email: string;
    password: string;
  }) => Promise<{ error: AuthError | null; needsConfirmation: boolean }>;

  logIn: (args: {
    email: string;
    password: string;
  }) => Promise<{ error: AuthError | null; emailNotConfirmed: boolean }>;

  logOut: () => Promise<void>;

  resendSignup: (email: string) => Promise<{ error: AuthError | null }>;

  resetPasswordRequest: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;

  refreshProfile: () => Promise<void>;
  updateProfilePatch: (
    patch: Partial<Profile>,
  ) => Promise<{ error: Error | null }>;

  acceptCreatorAgreement: () => Promise<{ error: Error | null }>;
  updateBankDetails: (d: BankDetails) => Promise<{ error: Error | null }>;
  resolvedAccountName: string | undefined;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const origin =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "";

/**
 * Fallback currentUser used when there is no session. Pages guarded by
 * RequireAuth will never see this, but destructuring assignments at the
 * top of unguarded pages need a stable shape.
 */
const GUEST_USER: CurrentUser = {
  id: "",
  full_name: "Guest",
  email: "",
  role: "user",
  is_approved_creator: false,
  is_suspended: false,
  university_id: "",
  email_confirmed: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const [walletTxns, setWalletTxns] = useState<DbWalletTxn[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [bankOverrides, setBankOverrides] = useState<
    Record<string, BankDetails & { resolved_account_name?: string }>
  >({});

  const sessionUser = session?.user ?? null;

  /* ---------------------- Fetch profile once authenticated ---------------------- */

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) {
      console.warn("profile fetch failed:", error?.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }, []);

  /* ----------------- Wallet balance + purchased quiz ids loader ----------------- */

  const loadWalletData = useCallback(async (userId: string) => {
    const [txnResult, balanceResult] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    setWalletTxns(txnResult.data ?? []);
    setUserBalance(Math.round(Number(balanceResult.data?.balance ?? 0) * 100));
  }, []);

  /* ----------------------- Derived: currentUser (old mock API shape) ----------------------- */

  const currentUser: CurrentUser = useMemo(() => {
    if (!sessionUser || !profile) return GUEST_USER;
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: sessionUser.email ?? "",
      role: profile.role as UserRole,
      is_approved_creator: !!profile.is_approved_creator,
      is_suspended: !!profile.is_suspended,
      university_id: profile.university_id ?? "",
      email_confirmed: !!sessionUser.email_confirmed_at,
      agreement_accepted_at: profile.agreement_accepted_at ?? undefined,
      bank_account_number: profile.bank_account_number ?? undefined,
      bank_code: profile.bank_code ?? undefined,
      bank_name: profile.bank_name ?? undefined,
      bank_account_name: profile.bank_account_name ?? undefined,
      bio: profile.bio ?? undefined,
      avatar_url: profile.avatar_url ?? undefined,
      joined_at: profile.created_at,
    };
  }, [sessionUser, profile]);

  const purchasedQuizIds = useMemo<string[]>(() => {
    const ids = new Set<string>();
    for (const t of walletTxns) {
      if (
        t.type === "quiz_payment" &&
        t.status === "completed" &&
        t.related_quiz_id
      ) {
        ids.add(t.related_quiz_id);
      }
    }
    return Array.from(ids);
  }, [walletTxns]);

  const hasPurchasedQuiz = useCallback(
    (quizId: string) => purchasedQuizIds.includes(quizId),
    [purchasedQuizIds],
  );

  const purchaseQuiz = useCallback(
    async (
      quizId: string,
      isTimed: boolean,
      timeLimitSeconds?: number,
    ): Promise<{ ok: boolean; attempt_id?: string }> => {
      const { data, error, status } = await apiFetch<{ attempt_id: string }>(
        `/api/quiz/${quizId}/attempt`,
        {
          method: "POST",
          body: {
            is_timed: isTimed,
            time_allowed_seconds: isTimed ? timeLimitSeconds : undefined,
          },
        },
      );
      if (error) {
        console.warn("purchaseQuiz failed:", error, "status:", status);
        return { ok: false };
      }
      if (!data) return { ok: false };
      if (session?.user?.id) {
        await loadWalletData(session.user.id);
      }
      return { ok: true, attempt_id: data.attempt_id };
    },
    [loadWalletData, session],
  );

  const creatorEarningsBalance = useMemo(() => {
    if (!sessionUser?.id) return 0;
    const uid = sessionUser.id;
    const sumNaira = walletTxns
      .filter(
        (t) =>
          t.user_id === uid &&
          (t.type === "creator_earning" || t.type === "payout" || t.type === "withdrawal") &&
          (t.status === "completed" || t.status === "success"),
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return Math.round(sumNaira * 100);
  }, [sessionUser?.id, walletTxns]);

  const creatorLifetimeEarnings = useMemo(() => {
    if (!sessionUser?.id) return 0;
    const uid = sessionUser.id;
    const sumNaira = walletTxns
      .filter(
        (t) =>
          t.user_id === uid &&
          t.type === "creator_earning" &&
          (t.status === "completed" || t.status === "success"),
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return Math.round(sumNaira * 100);
  }, [sessionUser?.id, walletTxns]);

  const creatorThisMonthEarnings = useMemo(() => {
    if (!sessionUser?.id) return 0;
    const uid = sessionUser.id;
    const now = new Date();
    const sumNaira = walletTxns
      .filter(
        (t) =>
          t.user_id === uid &&
          t.type === "creator_earning" &&
          (t.status === "completed" || t.status === "success") &&
          new Date(t.created_at).getUTCFullYear() === now.getUTCFullYear() &&
          new Date(t.created_at).getUTCMonth() === now.getUTCMonth(),
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return Math.round(sumNaira * 100);
  }, [sessionUser?.id, walletTxns]);

  /* ---------------------- Session listener (the primary driver) ---------------------- */

  useEffect(() => {
    let mounted = true;
    let activeUserId: string | null = null;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      const uid = s?.user?.id ?? null;
      activeUserId = uid;
      if (uid) {
        Promise.all([fetchProfile(uid), loadWalletData(uid)]).finally(() =>
          setInitialLoad(false),
        );
      } else {
        setProfile(null);
        setWalletTxns([]);
        setUserBalance(0);
        setInitialLoad(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      const uid = s?.user?.id ?? null;
      activeUserId = uid;
      if (uid) {
        await Promise.all([fetchProfile(uid), loadWalletData(uid)]);
      } else {
        setProfile(null);
        setWalletTxns([]);
        setUserBalance(0);
      }
    });

    /**
     * Real-time listener for wallet_transactions on the current user —
     * so top-up webhooks and quiz payments reflect instantly without
     * a full reload.
     */
    const channelName = `wallet-${activeUserId ?? "guest"}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (activeUserId) {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wallet_transactions",
            filter: `user_id=eq.${activeUserId}`,
          },
          () => {
            void loadWalletData(activeUserId!);
          },
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [fetchProfile, loadWalletData]);

  /* ----------------------------- Public auth actions ----------------------------- */

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
      await loadWalletData(session.user.id);
    }
  }, [session, fetchProfile, loadWalletData]);

  const signUp = useCallback(
    async (args: { full_name: string; email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({
        email: args.email,
        password: args.password,
        options: {
          data: { full_name: args.full_name },
          emailRedirectTo: `${origin}/confirm-email`,
        },
      });
      return { error, needsConfirmation: true };
    },
    [],
  );

  const logIn = useCallback(
    async (args: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: args.email,
        password: args.password,
      });
      const emailNotConfirmed =
        !!error &&
        (error.message.toLowerCase().includes("email not confirmed") ||
          error?.code === "email_not_confirmed");
      return { error, emailNotConfirmed: !!emailNotConfirmed };
    },
    [],
  );

  const logOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resendSignup = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    return { error };
  }, []);

  const resetPasswordRequest = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  }, []);

  const updateProfilePatch = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user) return { error: new Error("Not logged in") };
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);
      if (!error) await fetchProfile(session.user.id);
      return { error };
    },
    [session, fetchProfile],
  );

  const acceptCreatorAgreement = useCallback(async () => {
    return updateProfilePatch({
      agreement_accepted_at: new Date().toISOString(),
    } as Partial<Profile>);
  }, [updateProfilePatch]);

  const updateBankDetails = useCallback(
    async (d: BankDetails) => {
      if (!session?.user) return { error: new Error("Not logged in") };
      setBankOverrides((prev) => ({
        ...prev,
        [session.user!.id]: {
          ...d,
          resolved_account_name: d.bank_account_name,
        },
      }));
      return updateProfilePatch({
        bank_code: d.bank_code,
        bank_account_number: d.bank_account_number,
        bank_name: d.bank_name ?? null,
        bank_account_name: d.bank_account_name ?? null,
      } as Partial<Profile>);
    },
    [session, updateProfilePatch],
  );

  /* ----------------------------- Memoized value ----------------------------- */

  const value: AuthContextValue = useMemo(
    () => ({
      session,
      sessionUser,
      profile,
      currentUser,
      isLoading: initialLoad,
      authToken: session?.access_token,
      isLoggedIn: !!session?.user && !!profile,
      isAdmin: profile?.role === "admin",
      isApprovedCreator: !!profile?.is_approved_creator,

      walletBalance: userBalance,
      walletTxns,
      purchasedQuizIds,
      hasPurchasedQuiz,
      purchaseQuiz,

      creatorEarningsBalance,
      creatorLifetimeEarnings,
      creatorThisMonthEarnings,
      formatNaira,

      signUp,
      logIn,
      logOut,
      resendSignup,
      resetPasswordRequest,
      updatePassword,

      refreshProfile,
      updateProfilePatch,
      acceptCreatorAgreement,
      updateBankDetails,
      resolvedAccountName:
        profile?.bank_account_name ??
        (session?.user
          ? bankOverrides[session.user.id]?.resolved_account_name
          : undefined),
    }),
    [
      session,
      sessionUser,
      profile,
      currentUser,
      initialLoad,
      userBalance,
      walletTxns,
      purchasedQuizIds,
      hasPurchasedQuiz,
      purchaseQuiz,
      creatorEarningsBalance,
      creatorLifetimeEarnings,
      creatorThisMonthEarnings,
      signUp,
      logIn,
      logOut,
      resendSignup,
      resetPasswordRequest,
      updatePassword,
      refreshProfile,
      updateProfilePatch,
      acceptCreatorAgreement,
      updateBankDetails,
      bankOverrides,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/**
 * Convenience re-export of the Supabase DB-shape types so page files
 * don't have to import from two places.
 */
export type { DbCourse, DbQuiz, DbQuizAttempt, DbWalletTxn };
