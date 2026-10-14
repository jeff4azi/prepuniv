/**
 * useAdminData — shared hook for admin page data fetching from Supabase.
 *
 * Provides async fetch functions, loading states, and type-safe data
 * for all admin pages. Replaces mock imports with real Supabase queries.
 */
import { useState, useEffect, useCallback } from "react";
import {
  supabase,
  type DbProfile,
  type DbQuiz,
  type DbCourse,
  type DbUniversity,
  type DbWalletTxn,
  type DbPayoutRequest,
  type DbReport,
  type DbCreatorApplication,
} from "../lib/supabase";
import { apiFetch } from "../lib/api";

// ─── Enriched types (DB types + joined fields) ───────────────────────────────

export type AdminProfile = DbProfile & {
  email: string | null;
  email_confirmed_at: string | null;
};
export type AdminUsersPage = {
  users: AdminProfile[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminReport = DbReport & { quiz_title: string | null };

// ─── Generic fetcher ──────────────────────────────────────────────────────────

export function useSupabaseFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}

// ─── Admin Users (profiles + emails from backend) ────────────────────────────

export function useAdminUsers(params: {
  page: number;
  pageSize: number;
  role: string;
  universityId: string;
  search: string;
}) {
  return useSupabaseFetch<AdminUsersPage>(async () => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      role: params.role,
      universityId: params.universityId,
      search: params.search,
    });
    const res = await apiFetch<AdminUsersPage>(`/api/admin/users?${query}`);
    if (res.error || !res.data?.users)
      throw new Error(res.error || "Failed to fetch users");
    return res.data;
  }, [
    params.page,
    params.pageSize,
    params.role,
    params.universityId,
    params.search,
  ]);
}

// ─── Profiles (direct Supabase — no email needed) ────────────────────────────
// Hard limit raised to 3000: used as a lookup map by Reports & Applications.
// Beyond 3000 users, unknown names would silently show for newer accounts.

export function useProfiles() {
  return useSupabaseFetch<DbProfile[]>(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Scoped profiles — fetch only the specific IDs you need ──────────────────
// Use this instead of useProfiles() on pages that have a bounded list of rows
// (Reports, Applications, Payouts). Scales perfectly regardless of total users.

export function useScopedProfiles(ids: string[]) {
  return useSupabaseFetch<DbProfile[]>(async () => {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, role, is_approved_creator, bio, bank_account_name",
      )
      .in("id", ids);
    if (error) throw new Error(error.message);
    return data || [];
  }, [ids.join(",")]);
}

// ─── Quizzes (all — for pages that need the full list, e.g. Courses) ─────────
// Hard limit of 2000 for pages that need every quiz (e.g. course quiz-counts).
// The main admin quizzes listing uses useAdminQuizzes (server-side paginated).

export function useQuizzes() {
  return useSupabaseFetch<DbQuiz[]>(async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Quizzes (server-side paginated — AdminQuizzesPage) ───────────────────────

export type AdminQuizzesPage = {
  quizzes: DbQuiz[];
  total: number;
  page: number;
  pageSize: number;
};

export function useAdminQuizzes(params: {
  page: number;
  pageSize: number;
  universityId: string;
  status: string;
  search: string;
  sort: string;
  department: string;
}) {
  return useSupabaseFetch<AdminQuizzesPage>(async () => {
    const query = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      universityId: params.universityId,
      status: params.status,
      search: params.search,
      sort: params.sort,
      department: params.department,
    });
    const res = await apiFetch<AdminQuizzesPage>(`/api/admin/quizzes?${query}`);
    if (res.error || !res.data?.quizzes)
      throw new Error(res.error || "Failed to fetch quizzes");
    return res.data;
  }, [
    params.page,
    params.pageSize,
    params.universityId,
    params.status,
    params.search,
    params.sort,
    params.department,
  ]);
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCourses() {
  return useSupabaseFetch<DbCourse[]>(async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Universities ─────────────────────────────────────────────────────────────

export function useUniversities() {
  return useSupabaseFetch<DbUniversity[]>(async () => {
    const { data, error } = await supabase
      .from("universities")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Wallet Transactions ──────────────────────────────────────────────────────
// Scoped to platform_revenue + completed only — all other types are irrelevant
// for admin revenue calculations, and this cuts volume dramatically.
// The 5000 limit is a safety ceiling; revenue rows grow 1-per-purchase.

export function useWalletTransactions() {
  return useSupabaseFetch<DbWalletTxn[]>(async () => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("type", "platform_revenue")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Quiz Attempts count ──────────────────────────────────────────────────────

export function useQuizAttemptCount() {
  return useSupabaseFetch<number>(async () => {
    const { count, error } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count || 0;
  });
}

// ─── Payout Requests ──────────────────────────────────────────────────────────

export function usePayoutRequests() {
  return useSupabaseFetch<DbPayoutRequest[]>(async () => {
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .order("requested_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Creator Applications ─────────────────────────────────────────────────────

export function useCreatorApplications() {
  return useSupabaseFetch<DbCreatorApplication[]>(async () => {
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useReports() {
  return useSupabaseFetch<AdminReport[]>(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw new Error(error.message);
    return (data || []) as AdminReport[];
  });
}

// ─── Admin mutation helpers ───────────────────────────────────────────────────

export async function adminSuspendUser(userId: string, suspend: boolean) {
  return apiFetch("/api/admin/users/" + userId + "/suspend", {
    method: "POST",
    body: { suspend },
  });
}

export async function adminDeleteUnconfirmedUser(userId: string) {
  return apiFetch("/api/admin/users/" + userId, {
    method: "DELETE",
  });
}

export async function adminUnpublishQuiz(quizId: string) {
  return apiFetch("/api/admin/quizzes/" + quizId + "/unpublish", {
    method: "POST",
  });
}

export async function adminRepublishQuiz(quizId: string) {
  return apiFetch("/api/admin/quizzes/" + quizId + "/republish", {
    method: "POST",
  });
}

export async function adminResolveReport(reportId: string, notes?: string) {
  return apiFetch("/api/admin/reports/" + reportId + "/resolve", {
    method: "POST",
    body: { notes },
  });
}

export async function adminDismissReport(reportId: string, notes?: string) {
  return apiFetch("/api/admin/reports/" + reportId + "/dismiss", {
    method: "POST",
    body: { notes },
  });
}

export async function adminApproveApplication(applicationId: string) {
  return apiFetch(
    "/api/admin/creator-applications/" + applicationId + "/approve",
    {
      method: "POST",
    },
  );
}

export async function adminRejectApplication(
  applicationId: string,
  notes?: string,
) {
  return apiFetch(
    "/api/admin/creator-applications/" + applicationId + "/reject",
    {
      method: "POST",
      body: { notes },
    },
  );
}

export async function adminApprovePayoutRequest(payoutId: string) {
  return apiFetch("/api/admin/payout-requests/" + payoutId + "/approve", {
    method: "POST",
  });
}

export async function adminRejectPayoutRequest(
  payoutId: string,
  notes?: string,
) {
  return apiFetch("/api/admin/payout-requests/" + payoutId + "/reject", {
    method: "POST",
    body: { notes },
  });
}

export async function adminMarkPayoutPaidManually(
  payoutId: string,
  reference: string,
) {
  return apiFetch(
    "/api/admin/payout-requests/" + payoutId + "/mark-paid-manually",
    {
      method: "POST",
      body: { reference },
    },
  );
}

export async function adminUpdateCourse(
  courseId: string,
  updates: Partial<{
    code: string;
    name: string;
    subject_area: string;
    level: number;
  }>,
) {
  return apiFetch("/api/admin/courses/" + courseId, {
    method: "PUT",
    body: updates,
  });
}

export async function adminAddUniversity(uni: {
  name: string;
  abbreviation: string;
  state?: string;
}) {
  return apiFetch<{ university: DbUniversity }>("/api/admin/universities", {
    method: "POST",
    body: uni,
  });
}

export async function adminUpdateUniversity(
  id: string,
  updates: Partial<{ name: string; abbreviation: string; state: string }>,
) {
  return apiFetch("/api/admin/universities/" + id, {
    method: "PUT",
    body: updates,
  });
}

export async function adminDeleteUniversity(id: string) {
  return apiFetch("/api/admin/universities/" + id, {
    method: "DELETE",
  });
}

// ─── Loading spinner component ────────────────────────────────────────────────

export function AdminLoadingState({
  label = "Loading\u2026",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
        <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <p className="text-sm text-muted font-heading">{label}</p>
    </div>
  );
}
