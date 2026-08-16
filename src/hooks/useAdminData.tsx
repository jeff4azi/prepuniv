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

export type AdminProfile = DbProfile & { email: string | null };

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

export function useAdminUsers() {
  return useSupabaseFetch<AdminProfile[]>(async () => {
    const res = await apiFetch<{ users: AdminProfile[] }>("/api/admin/users");
    if (res.error || !res.data?.users)
      throw new Error(res.error || "Failed to fetch users");
    return res.data.users;
  });
}

// ─── Profiles (direct Supabase — no email needed) ────────────────────────────

export function useProfiles() {
  return useSupabaseFetch<DbProfile[]>(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────

export function useQuizzes() {
  return useSupabaseFetch<DbQuiz[]>(async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  });
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useCourses() {
  return useSupabaseFetch<DbCourse[]>(async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
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

export function useWalletTransactions() {
  return useSupabaseFetch<DbWalletTxn[]>(async () => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false });
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
      .order("created_at", { ascending: false });
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
