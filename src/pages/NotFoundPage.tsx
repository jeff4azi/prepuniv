import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { getDefaultDashboard } from "../lib/routeGuard";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser } = useAuth();

  usePageTitle("Page Not Found");

  const homeTarget = isLoggedIn ? getDefaultDashboard(currentUser) : "/";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background">
      {/* Large number treatment */}
      <div className="relative mb-8 select-none" aria-hidden>
        <span className="font-heading font-bold text-[160px] sm:text-[200px] lg:text-[240px] leading-none tracking-tighter text-primary/8">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-1">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-soft ring-1 ring-primary/20">
              <img
                src={new URL("../assets/prepUniv.png", import.meta.url).href}
                alt=""
                className="h-9 w-9 object-contain opacity-70"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className="text-center max-w-md space-y-3 mb-8">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text tracking-tight leading-tight">
          Page not found
        </h1>
        <p className="text-base text-text-soft leading-relaxed">
          The page you're looking for doesn't exist or may have moved. It might
          have been a bad link, or maybe it was never here to begin with.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(homeTarget)}
          className="min-w-[160px]"
        >
          <Home className="w-5 h-5" />
          Go to Home
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate(-1)}
          className="min-w-[160px]"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
