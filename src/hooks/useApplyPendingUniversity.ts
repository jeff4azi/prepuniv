import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  readPendingUniversity,
  clearPendingUniversity,
} from "../lib/pendingUniversity";

/**
 * Once the user has a session, applies whatever university_id was
 * stashed at signup (if any) and clears it. Call this from both
 * SignupPage and ConfirmEmailPage — a confirmation link very commonly
 * opens in a new tab of the same browser, where SignupPage's own state
 * (and its effect) never mounts, so relying on SignupPage alone missed
 * that case.
 */
export function useApplyPendingUniversity() {
  const { isLoggedIn, updateProfilePatch } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;
    const pending = readPendingUniversity();
    if (!pending) return;
    clearPendingUniversity();
    void updateProfilePatch({ university_id: pending });
  }, [isLoggedIn, updateProfilePatch]);
}
