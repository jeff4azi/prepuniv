/**
 * Tiny localStorage wrapper for handing the university chosen at signup
 * across the email-confirmation gap. Shared by SignupPage (which stashes
 * it) and both ConfirmEmailPage + SignupPage (which apply it once a
 * session exists) — see useApplyPendingUniversity.
 *
 * This is a best-effort UX nicety, not a safety mechanism: if it's ever
 * unavailable (different browser/device, storage cleared, etc.) the
 * RequireAuth route guard still forces a university pick at
 * /select-university before the user can reach the rest of the app.
 */
const PENDING_UNI_KEY = "prepuniv:pending_university_id";

export function stashPendingUniversity(universityId: string) {
  try {
    window.localStorage.setItem(PENDING_UNI_KEY, universityId);
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — the
    // /select-university guard covers this case, so just move on.
  }
}

export function readPendingUniversity(): string | null {
  try {
    return window.localStorage.getItem(PENDING_UNI_KEY);
  } catch {
    return null;
  }
}

export function clearPendingUniversity() {
  try {
    window.localStorage.removeItem(PENDING_UNI_KEY);
  } catch {
    // no-op
  }
}
