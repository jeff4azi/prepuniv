import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  readPendingUniversity,
  clearPendingUniversity,
} from "../lib/pendingUniversity";

export type PendingUniversityStatus = "idle" | "applying" | "done";

/**
 * Once the user has a session, applies whatever university_id was
 * stashed at signup (if any) and clears it. Call this from both
 * SignupPage and ConfirmEmailPage — a confirmation link very commonly
 * opens in a new tab of the same browser, where SignupPage's own state
 * (and its effect) never mounts, so relying on SignupPage alone missed
 * that case.
 *
 * Returns a status so callers that redirect based on isLoggedIn (e.g.
 * ConfirmEmailPage) can wait for "done" before navigating — otherwise
 * RequireAuth can win the race, see a still-null university_id, and
 * bounce the user to /select-university even though this write is
 * already in flight and about to succeed a moment later.
 */
export function useApplyPendingUniversity(): PendingUniversityStatus {
  const { isLoggedIn, updateProfilePatch } = useAuth();
  const [status, setStatus] = useState<PendingUniversityStatus>("idle");

  useEffect(() => {
    if (!isLoggedIn) return;
    const pending = readPendingUniversity();
    if (!pending) {
      setStatus("done");
      return;
    }

    let cancelled = false;
    setStatus("applying");
    clearPendingUniversity();
    updateProfilePatch({ university_id: pending }).finally(() => {
      // We resolve to "done" on failure too (not stuck forever waiting) —
      // if the write genuinely failed, RequireAuth's /select-university
      // fallback still catches it, same as it always has.
      if (!cancelled) setStatus("done");
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, updateProfilePatch]);

  return status;
}
