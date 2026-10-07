import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireAuthProps {
  children: ReactNode;
  role?: "admin" | "approvedCreator";
  redirectTo?: string;
}

/**
 * Resolves the role-specific dashboard path for a user:
 * - Admin -> /admin
 * - Creator (or approved creator) -> /creator
 * - Regular user / Learner -> /home
 */
export function getDefaultDashboard(
  user?: { role?: string; is_approved_creator?: boolean } | null,
): string {
  if (!user) return "/home";
  if (user.role === "admin") return "/admin";
  if (user.role === "creator" || user.is_approved_creator) return "/creator";
  return "/home";
}

/**
 * Reusable route guard wrapper.
 *
 *   <RequireAuth><HomePage /></RequireAuth>             → must be logged in
 *   <RequireAuth role="admin"><AdminPage /></RequireAuth> → must be admin
 *   <RequireAuth role="approvedCreator"><CreatorXPage /></RequireAuth>
 */
export function RequireAuth({ children, role, redirectTo }: RequireAuthProps) {
  const {
    isLoggedIn,
    isLoading,
    isAdmin,
    isApprovedCreator,
    profile,
    currentUser,
  } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    const fallback =
      redirectTo ?? `/login?redirect=${encodeURIComponent(pathname)}`;
    return <Navigate to={fallback} replace />;
  }

  // Suspended users have no access to the app at all — hard redirect so it
  // can't be bypassed by React Router's in-memory navigation.
  if (currentUser.is_suspended) {
    window.location.replace("/account-suspended");
    return null;
  }

  // Enforce email confirmation ourselves rather than relying solely on the
  // Supabase project's "Confirm email" setting: if that's ever off (or a
  // session is otherwise granted pre-confirmation), a session existing is
  // NOT the same thing as the email actually being confirmed. Admins are
  // provisioned directly (seed script) and don't go through this flow.
  if (
    currentUser.role !== "admin" &&
    !currentUser.email_confirmed &&
    pathname !== "/confirm-email"
  ) {
    return <Navigate to="/confirm-email" replace />;
  }

  // Non-admin users must select a university before accessing the app
  if (
    currentUser.role !== "admin" &&
    !currentUser.university_id &&
    pathname !== "/select-university"
  ) {
    return <Navigate to="/select-university" replace />;
  }

  if (role === "admin" && !isAdmin) {
    return (
      <Navigate to={redirectTo ?? getDefaultDashboard(currentUser)} replace />
    );
  }

  if (role === "approvedCreator" && !isApprovedCreator) {
    if (profile && !profile.agreement_accepted_at) {
      return <Navigate to="/creator/agreement" replace />;
    }
    return <Navigate to={redirectTo ?? "/creator/apply"} replace />;
  }

  return <>{children}</>;
}

// v2: uses localStorage instead of sessionStorage so the redirect
// survives a magic-link email being opened in a new tab (same browser).
export const AUTH_REDIRECT_KEY = "prepuniv:auth_redirect_v2";

/**
 * Validates that a redirect path is a safe internal application route
 * and not an auth loop (like /login or /signup).
 */
export function sanitizeAuthRedirect(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  // Must be an internal path starting with / but not protocol-relative //
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  // Disallow auth pages that would cause infinite loops
  if (
    trimmed === "/login" ||
    trimmed === "/signup" ||
    trimmed.startsWith("/login?") ||
    trimmed.startsWith("/signup?")
  ) {
    return null;
  }
  return trimmed;
}

export function getSavedAuthRedirect(): string | null {
  try {
    const val = localStorage.getItem(AUTH_REDIRECT_KEY);
    return sanitizeAuthRedirect(val);
  } catch {
    return null;
  }
}

export function saveAuthRedirect(url: string) {
  try {
    const sanitized = sanitizeAuthRedirect(url);
    if (!sanitized) return;
    localStorage.setItem(AUTH_REDIRECT_KEY, sanitized);
  } catch {
    // no-op
  }
}

export function clearSavedAuthRedirect() {
  try {
    localStorage.removeItem(AUTH_REDIRECT_KEY);
    // Also clear any stale v1 sessionStorage entry from the old implementation
    try { sessionStorage.removeItem("prepuniv:auth_redirect"); } catch { /* no-op */ }
  } catch {
    // no-op
  }
}

/**
 * Redirect logged-in users AWAY from auth-only pages (e.g. /login, /signup).
 * If a valid redirect target exists (e.g. /quiz/123 or /profile/creator/456),
 * it ALWAYS takes precedence over role-based default dashboards.
 */
export function IfLoggedOut({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: string;
}) {
  const { isLoggedIn, isLoading, currentUser } = useAuth();
  const { search } = useLocation();

  // Keep any explicit ?redirect= query param cached in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      saveAuthRedirect(redirectParam);
    }
  }, [search]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    const params = new URLSearchParams(search);
    const validRedirect =
      sanitizeAuthRedirect(fallback) ??
      sanitizeAuthRedirect(params.get("redirect")) ??
      getSavedAuthRedirect();

    clearSavedAuthRedirect();

    // If a valid redirect path exists, go there! Only fallback to role dashboard if no redirect exists.
    const target = validRedirect ?? getDefaultDashboard(currentUser);
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}

export function useRedirectAfterAuth() {
  const { search } = useLocation();
  const { currentUser } = useAuth();
  const params = new URLSearchParams(search);
  const validRedirect =
    sanitizeAuthRedirect(params.get("redirect")) ?? getSavedAuthRedirect();

  if (validRedirect) {
    return validRedirect;
  }
  return getDefaultDashboard(currentUser);
}

/**
 * Small client-side helper: redirect helper for manual use in effects.
 */
export function useRedirectIf(condition: boolean, destination: string) {
  useEffect(() => {
    if (condition) window.location.href = destination;
  }, [condition, destination]);
}
