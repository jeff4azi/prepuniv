import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  WifiOff,
  RefreshCw,
  ArrowLeft,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { useNetwork } from "../context/NetworkContext";
import { getDefaultDashboard } from "../lib/routeGuard";

interface ConnectionLostPageProps {
  /** Optional override action when connection is restored inline */
  onRetrySuccess?: () => void;
}

export function ConnectionLostPage({ onRetrySuccess }: ConnectionLostPageProps) {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useAuth();
  const { isOnline, isChecking, checkConnection } = useNetwork();

  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  const dashboardTarget = isLoggedIn ? getDefaultDashboard(currentUser) : "/";

  async function handleTryAgain() {
    setRetryAttempted(true);
    setRetryFailed(false);
    const success = await checkConnection();
    if (success) {
      if (onRetrySuccess) {
        onRetrySuccess();
      } else {
        navigate(dashboardTarget, { replace: true });
      }
    } else {
      setRetryFailed(true);
    }
  }

  function handleGoBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(dashboardTarget, { replace: true });
    }
  }

  return (
    <div className="min-h-dvh w-full bg-background text-text flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar / Branding */}
      <header className="w-full max-w-[1100px] mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <img
            src={new URL("../assets/prepUniv.png", import.meta.url).href}
            alt="PrepUniv"
            className="h-8 w-8 rounded-xl object-contain"
          />
          <span className="font-heading font-bold text-xl tracking-tight text-primary">
            PrepUniv
          </span>
        </div>

        {/* Dynamic Live Status Indicator */}
        <div>
          {isOnline ? (
            <Badge variant="success" size="md" className="gap-1.5 shadow-soft">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Back online
            </Badge>
          ) : (
            <Badge variant="warning" size="md" className="gap-1.5 shadow-soft">
              <AlertTriangle className="w-3.5 h-3.5" />
              Connection lost
            </Badge>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg mx-auto my-auto py-8">
        <Card className="relative overflow-hidden p-6 sm:p-8 shadow-elevated border-border/60 text-center">
          {/* Subtle ambient lighting effects */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-warning/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          {/* Offline Illustration / Icon */}
          <div className="relative flex justify-center mb-6">
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-warning-bg border border-warning/20 text-warning flex items-center justify-center shadow-card ring-8 ring-warning/5">
                <WifiOff className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={1.8} />
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-warning border-2 border-surface animate-ping" />
            </div>
          </div>

          {/* Headline & Supporting Copy */}
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text tracking-tight mb-2">
            You’re offline
          </h1>
          <p className="text-sm sm:text-base text-text-soft leading-relaxed mb-6">
            We’ve lost connection to the internet. Please check your network and
            try again.
          </p>

          {/* Session Safety Reassurance */}
          <div className="mb-6 p-3.5 rounded-2xl bg-primary/8 border border-primary/15 text-left flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs sm:text-[13px] text-text-soft leading-snug">
              <span className="font-heading font-semibold text-text block mb-0.5">
                Session Active &bull; Progress Saved
              </span>
              Your account session is completely intact. You will return to your
              work as soon as you reconnect.
            </div>
          </div>

          {/* Error alert if manual retry failed */}
          {retryFailed && (
            <div className="mb-5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Still unable to reach the server. Please check your connection.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              fullWidth
              size="lg"
              variant="primary"
              isLoading={isChecking}
              onClick={handleTryAgain}
              className="h-12 text-sm font-semibold shadow-soft"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              />
              {isChecking ? "Testing connection…" : "Try Again"}
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                fullWidth
                size="md"
                variant="outline"
                onClick={handleGoBack}
                className="h-11 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>

              <Button
                fullWidth
                size="md"
                variant="ghost"
                onClick={() => navigate(dashboardTarget, { replace: true })}
                className="h-11 text-xs sm:text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
          </div>

          {/* Troubleshooting Section */}
          <div className="mt-7 pt-6 border-t border-border/50 text-left">
            <button
              type="button"
              onClick={() => setTroubleshootOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs sm:text-sm font-heading font-semibold text-text-soft hover:text-text transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" />
                Still having trouble?
              </span>
              {troubleshootOpen ? (
                <ChevronUp className="w-4 h-4 text-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" />
              )}
            </button>

            {troubleshootOpen && (
              <ul className="mt-3.5 space-y-2.5 text-xs text-text-soft bg-surface/60 p-4 rounded-2xl border border-border/50">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    Check your Wi-Fi or mobile data settings to verify connection.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Try switching to a different Wi-Fi network or hotspot.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Disable and re-enable Airplane Mode on your device.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>Wait a few moments and click <strong>Try Again</strong>.</span>
                </li>
              </ul>
            )}
          </div>
        </Card>
      </main>

      {/* Footer / Discreet Support Link */}
      <footer className="w-full max-w-lg mx-auto text-center py-3 text-xs text-muted">
        <p className="flex items-center justify-center gap-1.5">
          <span>Persistent connection issues?</span>
          <a
            href="mailto:support@prepuniv.edu.ng?subject=Connection%20Issue%20Report"
            className="font-medium text-primary hover:underline flex items-center gap-1 inline-flex"
          >
            <Mail className="w-3.5 h-3.5" />
            Contact PrepUniv Support
          </a>
        </p>
      </footer>
    </div>
  );
}
