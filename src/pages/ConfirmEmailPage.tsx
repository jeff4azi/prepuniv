/**
 * ConfirmEmailPage — /confirm-email
 *
 * Handles what happens when a user clicks the link in their confirmation email.
 * Supabase client detects the confirmation token from the URL automatically
 * (detectSessionInUrl: true) and the AuthContext picks up the resulting session.
 *
 * States:
 *   verifying  — spinner on mount (brief delay for URL token detection)
 *   success    — session confirmed with email_confirmed=true, redirect to /home
 *   invalid    — no valid session; show resend form
 */
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  MailOpen,
  ArrowLeft,
  ArrowRight,
  Mail,
} from "lucide-react";
import { AuthShell, AuthCard } from "../components/AuthShell";
import { Button } from "../components/Button";
import { TextInput, validateEmail } from "../components/Form";
import { useAuth } from "../context/AuthContext";
import { useApplyPendingUniversity } from "../hooks/useApplyPendingUniversity";

const RESEND_COOLDOWN = 60;

function ResendForm({ initialEmail }: { initialEmail?: string }) {
  const { resendSignup } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    setSubmitted(true);
    if (err) return;
    setLoading(true);
    const { error: resendError } = await resendSignup(email.trim());
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResent(true);
    setCooldown(RESEND_COOLDOWN);
  }

  return (
    <form onSubmit={handleResend} noValidate className="space-y-3">
      <TextInput
        id="resend-email"
        name="email"
        label="Your email address"
        placeholder="you@school.edu.ng"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (submitted) setError(validateEmail(e.target.value));
        }}
        error={submitted ? (error ?? undefined) : undefined}
      />
      {resent && (
        <p className="text-xs text-success font-heading font-medium flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          Email resent — check your inbox and spam folder.
        </p>
      )}
      <Button
        fullWidth
        size="lg"
        type="submit"
        isLoading={loading}
        disabled={cooldown > 0}
        className="h-12"
      >
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : resent
            ? "Resend again"
            : "Resend confirmation email"}
        {!loading && cooldown === 0 && (
          <ArrowRight className="w-[18px] h-[18px]" />
        )}
      </Button>
    </form>
  );
}

type PageState = "verifying" | "success" | "invalid";

export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const { isLoggedIn, currentUser } = useAuth();

  // This is very often a NEW tab opened from the confirmation email, so
  // SignupPage's own state/effects never ran here — apply whatever
  // university was chosen at signup as soon as this tab gets a session.
  const pendingUniStatus = useApplyPendingUniversity();

  const [state, setState] = useState<PageState>("verifying");
  const [autoRedirectCount, setAutoRedirectCount] = useState(5);

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(() => {
      if (!mounted) return;
      // Still resolving (or saving) the university chosen at signup —
      // wait rather than redirecting on a stale (still-null)
      // university_id; the effect below catches it once it settles.
      if (isLoggedIn && pendingUniStatus !== "done") return;
      if (isLoggedIn && currentUser.email_confirmed) {
        setState("success");
      } else {
        // Either no session at all (an expired/used/invalid link), or a
        // session exists but the email genuinely isn't confirmed (e.g.
        // RequireAuth sent them straight here, with no fresh token in
        // the URL) — either way the next step is the same: offer resend.
        setState("invalid");
      }
    }, 1500);

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [isLoggedIn, currentUser.email_confirmed, pendingUniStatus]);

  useEffect(() => {
    if (
      state === "verifying" &&
      isLoggedIn &&
      currentUser.email_confirmed &&
      pendingUniStatus === "done"
    ) {
      setState("success");
    }
  }, [state, isLoggedIn, currentUser.email_confirmed, pendingUniStatus]);

  useEffect(() => {
    if (state !== "success") return;
    if (autoRedirectCount <= 0) {
      navigate("/home", { replace: true });
      return;
    }
    const t = setTimeout(() => setAutoRedirectCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, autoRedirectCount, navigate]);

  if (state === "verifying") {
    return (
      <AuthShell>
        <AuthCard
          tag="Please wait"
          tagTone="secondary"
          title="Confirming your email…"
        >
          <div className="flex flex-col items-center py-6 gap-4">
            <Loader2
              className="w-10 h-10 text-primary animate-spin"
              strokeWidth={2}
            />
            <p className="text-sm text-muted text-center leading-relaxed">
              Hang tight — we're verifying your link.
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  if (state === "success") {
    return (
      <AuthShell>
        <AuthCard
          tag="Verified"
          tagTone="success"
          title="Email confirmed!"
          subtitle="Your account is now active. Welcome to PrepUniv."
        >
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center py-2">
              <div className="h-20 w-20 rounded-3xl bg-success-bg text-success flex items-center justify-center mb-4 shadow-soft ring-1 ring-success/20">
                <CheckCircle2 className="w-10 h-10" strokeWidth={2} />
              </div>
              {currentUser.email && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 text-text-soft text-sm border border-border/60">
                  <Mail className="w-4 h-4 text-muted" strokeWidth={2} />
                  <span className="font-medium truncate max-w-[260px]">
                    {currentUser.email}
                  </span>
                </div>
              )}
            </div>
            <Button
              fullWidth
              size="lg"
              className="h-12"
              onClick={() => navigate("/home", { replace: true })}
            >
              Continue to PrepUniv
              <ArrowRight className="w-[18px] h-[18px]" />
            </Button>
            <p className="text-center text-xs text-muted">
              Redirecting automatically in {autoRedirectCount}s…
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      crossLink={{ label: "Know your password?", to: "/login", cta: "Log in" }}
    >
      <AuthCard
        tag="Link expired"
        tagTone="secondary"
        title="Email not confirmed"
        subtitle="Your confirmation link may have expired or already been used — or you haven't confirmed yet. Request a new link below."
      >
        <div className="space-y-5">
          <div className="flex justify-center py-2">
            <div className="h-16 w-16 rounded-3xl bg-surface border border-border/50 text-muted flex items-center justify-center shadow-card">
              <MailOpen className="w-8 h-8" strokeWidth={1.8} />
            </div>
          </div>

          <ResendForm initialEmail={currentUser.email ?? undefined} />

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-text-soft hover:text-primary transition-colors pt-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
