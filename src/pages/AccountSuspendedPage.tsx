/**
 * AccountSuspendedPage — /account-suspended
 *
 * Standalone screen shown when a user's account is suspended.
 * Reached via:
 *   - Login: logIn() detects is_suspended=true, signs back out, redirects here.
 *   - Mid-session: apiFetch() receives 403 account_suspended, fires
 *     'prepuniv:account_suspended' event, AuthContext signs out + redirects here.
 *
 * No sidebar, no bottom nav — the user has no access to the app.
 * Calm, informative tone. Links only to the public landing page and a mailto.
 */
import { Link } from "react-router-dom";
import { PauseCircle, Mail, ArrowLeft } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const SUPPORT_EMAIL = "support@prepuniv.com";

export function AccountSuspendedPage() {
  usePageTitle("Account Suspended");
  return (
    <div className="min-h-dvh w-full bg-background flex flex-col">
      {/* Minimal header — logo only, no nav links */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 safe-top">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
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
        </div>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          {/* Glow blobs matching other auth pages */}
          <div className="relative">
            <div className="absolute -top-10 -left-8 h-40 w-40 rounded-full bg-muted/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-6 h-48 w-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

            <div className="relative bg-cream/90 rounded-3xl border border-border/60 shadow-elevated overflow-hidden">
              {/* Card body */}
              <div className="px-6 sm:px-8 pt-8 pb-2 flex flex-col items-center text-center">
                {/* Icon — neutral pause, not alarming */}
                <div className="h-16 w-16 rounded-2xl bg-muted/10 border border-border/50 flex items-center justify-center mb-5 shadow-soft">
                  <PauseCircle
                    className="w-9 h-9 text-muted"
                    strokeWidth={1.6}
                  />
                </div>

                {/* Status tag */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full border bg-muted/10 text-muted border-muted/20 mb-4">
                  Account suspended
                </span>

                <h1 className="font-heading font-bold tracking-tight text-text text-2xl sm:text-[26px] leading-tight">
                  Your account has been suspended.
                </h1>

                <p className="mt-3 text-sm sm:text-[15px] text-muted leading-relaxed max-w-sm">
                  Your PrepUniv account is currently suspended and you don't
                  have access to the platform right now.
                </p>

                <p className="mt-2 text-sm sm:text-[15px] text-muted leading-relaxed max-w-sm">
                  This doesn't affect your wallet balance or purchased quizzes —
                  they'll be exactly as you left them if your account is
                  reinstated.
                </p>
              </div>

              {/* Divider */}
              <div className="mx-6 sm:mx-8 my-5 h-px bg-border/50" />

              {/* Contact section */}
              <div className="px-6 sm:px-8 pb-7 space-y-4 text-center">
                <p className="text-sm text-text-soft leading-relaxed">
                  If you believe this was a mistake, or want to know more,
                  contact us:
                </p>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2.5 h-11 px-5 rounded-2xl bg-surface border border-border/60 text-sm font-heading font-semibold text-text hover:bg-surface/80 hover:border-border transition-colors"
                >
                  <Mail
                    className="w-4 h-4 text-muted shrink-0"
                    strokeWidth={2}
                  />
                  {SUPPORT_EMAIL}
                </a>

                {/* Back to landing — not back into the app */}
                <div className="pt-2">
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-soft hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to PrepUniv homepage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
