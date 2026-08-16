import { type ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireAuthProps {
  children: ReactNode;
  role?: "admin" | "approvedCreator";
  redirectTo?: string;
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

  // Non-admin users must select a university before accessing the app
  if (
    currentUser.role !== "admin" &&
    !currentUser.university_id &&
    pathname !== "/select-university"
  ) {
    return <Navigate to="/select-university" replace />;
  }

  if (role === "admin" && !isAdmin) {
    return <Navigate to={redirectTo ?? "/home"} replace />;
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
 * Optional `fallback` overrides the default redirect target of "/home".
 */
export function IfLoggedOut({
  children,
  fallback = "/home",
}: {
  children: ReactNode;
  fallback?: string;
}) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}

export function useRedirectAfterAuth() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get("redirect") ?? "/home";
}

/**
 * Small client-side helper: redirect helper for manual use in effects.
 */
export function useRedirectIf(condition: boolean, destination: string) {
  useEffect(() => {
    if (condition) window.location.href = destination;
  }, [condition, destination]);
}
