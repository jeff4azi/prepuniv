/**
 * useNavBadges — single source of truth for sidebar/menu notification counts.
 *
 * Admin badges (pending-action queue — naturally go to zero):
 *   - applications  → creator_applications where status = 'pending'
 *   - payouts       → payout_requests where status = 'pending'
 *   - reports       → reports where status = 'open'
 *
 * Creator badges (unseen-change tracking via user_nav_state):
 *   - creatorReports  → open reports on the creator's quizzes created
 *                       AFTER their last visit to /creator/reports
 *   - creatorPayouts  → payout requests with a resolved status
 *                       (approved/paid/rejected/failed) processed AFTER
 *                       the creator's last visit to /creator/payouts
 *
 * Refreshes on every route change (passed in as `pathname`) plus every
 * 60 seconds while the tab is focused.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { UserRole } from "../context/AuthContext";

export interface NavBadges {
  /** Admin */
  adminApplications: number;
  adminPayouts: number;
  adminReports: number;
  /** Creator */
  creatorPayouts: number;
  creatorReports: number;
}

const EMPTY: NavBadges = {
  adminApplications: 0,
  adminPayouts: 0,
  adminReports: 0,
  creatorPayouts: 0,
  creatorReports: 0,
};

/** Cap displayed number at this value (shows "9+" in UI) */
export const BADGE_CAP = 9;

/** Format a raw count into the display string */
export function formatBadgeCount(n: number): string {
  if (n <= 0) return "";
  return n > BADGE_CAP ? `${BADGE_CAP}+` : String(n);
}

interface UseNavBadgesOptions {
  userId: string;
  role: UserRole;
  isApprovedCreator: boolean;
  /** Current route pathname — triggers a refetch on navigation */
  pathname: string;
}

export function useNavBadges({
  userId,
  role,
  isApprovedCreator,
  pathname,
}: UseNavBadgesOptions): NavBadges {
  const [badges, setBadges] = useState<NavBadges>(EMPTY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!userId) return;

    const isAdmin = role === "admin";
    const isCreator = isApprovedCreator;

    // Nothing to fetch for a plain user with no special roles
    if (!isAdmin && !isCreator) {
      setBadges(EMPTY);
      return;
    }

    // ── Run relevant queries in parallel ─────────────────────────────────────

    const adminPromise = isAdmin
      ? Promise.all([
          // applications pending
          supabase
            .from("creator_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          // payouts pending
          supabase
            .from("payout_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          // reports open
          supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
        ])
      : Promise.resolve(null);

    // Creator: need last-viewed timestamps first, then count against them
    const creatorNavStatePromise = isCreator
      ? supabase
          .from("user_nav_state")
          .select("section, last_viewed_at")
          .eq("user_id", userId)
          .in("section", ["creator_payouts", "creator_reports"])
      : Promise.resolve(null);

    // Creator: need quiz IDs owned by this creator to scope reports query
    const creatorQuizIdsPromise = isCreator
      ? supabase.from("quizzes").select("id").eq("creator_id", userId)
      : Promise.resolve(null);

    const [adminResults, navStateRes, quizIdsRes] = await Promise.all([
      adminPromise,
      creatorNavStatePromise,
      creatorQuizIdsPromise,
    ]);

    // ── Admin counts ──────────────────────────────────────────────────────────

    let adminApplications = 0;
    let adminPayouts = 0;
    let adminReports = 0;

    if (adminResults) {
      const [appRes, payRes, repRes] = adminResults;
      adminApplications = appRes.count ?? 0;
      adminPayouts = payRes.count ?? 0;
      adminReports = repRes.count ?? 0;
    }

    // ── Creator counts ────────────────────────────────────────────────────────

    let creatorPayouts = 0;
    let creatorReports = 0;

    if (isCreator && navStateRes && quizIdsRes) {
      const navRows = navStateRes.data ?? [];
      const quizIds = (quizIdsRes.data ?? []).map((r) => r.id as string);

      // Fallback: if user has never visited a section, treat it as epoch
      const EPOCH = "1970-01-01T00:00:00.000Z";

      const lastViewedPayouts =
        navRows.find((r) => r.section === "creator_payouts")?.last_viewed_at ??
        EPOCH;
      const lastViewedReports =
        navRows.find((r) => r.section === "creator_reports")?.last_viewed_at ??
        EPOCH;

      // Run the two creator count queries in parallel
      const [payoutCountRes, reportCountRes] = await Promise.all([
        // Payouts that moved out of pending after last visit
        supabase
          .from("payout_requests")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", userId)
          .in("status", ["approved", "paid", "rejected", "failed"])
          .gt("processed_at", lastViewedPayouts),

        // Reports that need the creator's attention since their last visit:
        //   1. New open reports filed after last visit, OR
        //   2. Reports that moved to resolved/dismissed (with resolution_notes)
        //      after last visit — i.e. resolved_at > lastViewedReports
        // We run two counts and sum them.
        quizIds.length > 0
          ? Promise.all([
              // New open reports
              supabase
                .from("reports")
                .select("*", { count: "exact", head: true })
                .in("quiz_id", quizIds)
                .eq("status", "open")
                .gt("created_at", lastViewedReports),
              // Resolved/dismissed with feedback since last visit
              supabase
                .from("reports")
                .select("*", { count: "exact", head: true })
                .in("quiz_id", quizIds)
                .in("status", ["resolved", "dismissed"])
                .not("resolution_notes", "is", null)
                .gt("resolved_at", lastViewedReports),
            ])
          : Promise.resolve(null),
      ]);

      creatorPayouts = payoutCountRes.count ?? 0;

      if (reportCountRes) {
        const [openRes, resolvedRes] = reportCountRes;
        creatorReports = (openRes.count ?? 0) + (resolvedRes.count ?? 0);
      }
    }

    setBadges({
      adminApplications,
      adminPayouts,
      adminReports,
      creatorPayouts,
      creatorReports,
    });
  }, [userId, role, isApprovedCreator]);

  // Refetch on route change
  useEffect(() => {
    void fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBadges, pathname]);

  // Also refetch every 60 seconds while mounted
  useEffect(() => {
    intervalRef.current = setInterval(() => void fetchBadges(), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchBadges]);

  return badges;
}

// ─── Read-tracking helper: upsert last_viewed_at for a creator section ────────

export async function markNavSectionViewed(
  userId: string,
  section: "creator_payouts" | "creator_reports",
): Promise<void> {
  if (!userId) return;
  await supabase
    .from("user_nav_state")
    .upsert(
      { user_id: userId, section, last_viewed_at: new Date().toISOString() },
      { onConflict: "user_id,section" },
    );
}
