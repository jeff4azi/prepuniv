import { Link, useLocation } from "react-router-dom";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";
import { getDefaultDashboard } from "../lib/routeGuard";

export function LandingTopNav() {
  const loc = useLocation();
  const isLanding = loc.pathname === "/";
  const { isLoggedIn, isLoading, currentUser } = useAuth();

  return (
    <header
      className={`sticky top-0 z-50 w-full safe-top transition-all duration-300 ${
        isLanding
          ? "bg-background/80 backdrop-blur-xl border-b border-border/40"
          : "bg-background border-b border-border/60"
      }`}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 -ml-1 pl-1 pr-2 h-11 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <img
            src={new URL("../assets/prepUniv.png", import.meta.url).href}
            alt="PrepUniv"
            className="h-8 w-8 rounded-xl object-contain"
          />
          <span className="font-heading font-bold text-xl tracking-tight text-primary">
            PrepUniv
          </span>
        </Link>

        {isLanding ? (
          !isLoading && isLoggedIn ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                (window.location.href = getDefaultDashboard(currentUser))
              }
            >
              Go to app
            </Button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/login")}
              >
                Log in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/signup")}
              >
                Sign up
              </Button>
            </div>
          )
        ) : (
          <Link to="/" className="text-primary font-medium hover:underline">
            Back to PrepUniv
          </Link>
        )}
      </div>
    </header>
  );
}
