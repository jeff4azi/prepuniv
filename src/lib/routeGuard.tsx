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
    return <Navigate to={redirectTo ?? getDefaultDashboard(currentUser)} replace />;
  }

  if (role === "approvedCreator" && !isApprovedCreator) {
    if (profile && !profile.agreement_accepted_at) {
      return <Navigate to="/creator/agreement" replace />;
    }
    return <Navigate to={redirectTo ?? "/creator/apply"} replace />;
  }

  return <>{children}</>;
}

/**
 * Redirect logged-in users AWAY from auth-only pages (e.g. /login, /signup).
 * Optional `fallback` overrides the default role-based redirect target.
 */
export function IfLoggedOut({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: string;
}) {
  const { isLoggedIn, isLoading, currentUser } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    const target = fallback ?? getDefaultDashboard(currentUser);
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}

export function useRedirectAfterAuth() {
  const { search } = useLocation();
  const { currentUser } = useAuth();
  const params = new URLSearchParams(search);
  return params.get("redirect") ?? getDefaultDashboard(currentUser);
}

/**
 * Small client-side helper: redirect helper for manual use in effects.
 */
export function useRedirectIf(condition: boolean, destination: string) {
  useEffect(() => {
    if (condition) window.location.href = destination;
  }, [condition, destination]);
}

