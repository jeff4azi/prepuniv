import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { AuthShell, AuthCard } from "../components/AuthShell";
import { Button } from "../components/Button";
import {
  TextInput,
  PasswordInput,
  validateEmail,
  validatePassword,
} from "../components/Form";
import { useAuth } from "../context/AuthContext";
import { useRedirectAfterAuth } from "../lib/routeGuard";

const RESEND_COOLDOWN = 60;

export function LoginPage() {
  const navigate = useNavigate();
  const redirectTarget = useRedirectAfterAuth();
  const { logIn, resendSignup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
    form?: string | null;
  }>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    { email: false, password: false },
  );

  // Unconfirmed-email state
  const [unconfirmedId, setUnconfirmedId] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  // Start disabled — user must wait before they can resend
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function runValidation() {
    return {
      email: validateEmail(email),
      password: validatePassword(password),
    };
  }

  function validateAll(): boolean {
    const e = runValidation();
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);

    const { error, emailNotConfirmed, accountSuspended } = await logIn({
      email: email.trim(),
      password,
    });

    if (accountSuspended) {
      // Use hard redirect instead of React Router navigate to avoid race
      // conditions with onAuthStateChange clearing session state mid-render.
      window.location.replace("/account-suspended");
      return;
    }

    if (emailNotConfirmed) {
      setUnconfirmedId(email.trim());
      setUnconfirmedEmail(email.trim());
      setCooldown(RESEND_COOLDOWN);
      setLoading(false);
      return;
    }

    if (error) {
      setErrors({ form: error.message });
      setLoading(false);
      return;
    }

    navigate(redirectTarget, { replace: true });
    setLoading(false);
  }

  async function handleResend() {
    if (resending || cooldown > 0 || !unconfirmedEmail) return;
    setResending(true);
    setResent(false);
    const { error } = await resendSignup(unconfirmedEmail);
    setResending(false);
    if (!error) {
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
    }
  }

  const liveErrors = touched.email || touched.password ? runValidation() : {};
  const finalErrors = {
    email: errors.email ?? liveErrors.email,
    password: errors.password ?? liveErrors.password,
  };

  // ── Unconfirmed email inline state ────────────────────────────────────────
  if (unconfirmedId) {
    return (
      <AuthShell
        crossLink={{
          label: "Don't have an account?",
          to: "/signup",
          cta: "Sign up",
        }}
      >
        <AuthCard
          tag="Confirm your email"
          tagTone="secondary"
          title="Check your inbox"
          subtitle={`Please confirm your email before logging in. We sent a link to ${unconfirmedEmail}.`}
        >
          <div className="space-y-5">
            <div className="flex justify-center py-2">
              <div className="h-16 w-16 rounded-3xl bg-surface border border-border/50 text-muted flex items-center justify-center shadow-card">
                <Mail className="w-8 h-8" strokeWidth={1.8} />
              </div>
            </div>

            <p className="text-sm text-text-soft text-center leading-relaxed">
              Didn't get it? Check your spam folder, or request a new link
              below.
            </p>

            {resent && (
              <p className="text-xs text-success font-heading font-medium flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Email resent — check your inbox and spam folder.
              </p>
            )}

            <Button
              fullWidth
              variant="outline"
              size="lg"
              className="h-12"
              isLoading={resending}
              disabled={cooldown > 0}
              onClick={handleResend}
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : resent
                  ? "Resend again"
                  : "Resend confirmation email"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setUnconfirmedId(null);
                setUnconfirmedEmail("");
                setResent(false);
                setCooldown(0);
              }}
              className="w-full text-sm font-semibold text-text-soft hover:text-primary transition-colors"
            >
              Try a different account
            </button>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  // ── Normal login form ─────────────────────────────────────────────────────
  return (
    <AuthShell
      crossLink={{
        label: "Don't have an account?",
        to: "/signup",
        cta: "Sign up",
      }}
    >
      <AuthCard
        tag="Welcome back"
        tagTone="success"
        title="Log in to PrepUniv"
        subtitle="Pick up right where you left off — every quiz you've unlocked is still yours."
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:space-y-[18px]"
        >
          <TextInput
            id="email"
            name="email"
            label="Email address"
            placeholder="you@school.edu.ng"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={finalErrors.email ?? undefined}
          />

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={finalErrors.password ?? undefined}
            />
          </div>

          {errors.form && (
            <p className="text-xs text-danger flex items-center gap-1.5 px-1">
              <span className="w-1 h-1 rounded-full bg-danger inline-block shrink-0" />
              {errors.form}
            </p>
          )}

          <Button
            fullWidth
            size="lg"
            isLoading={loading}
            type="submit"
            className="h-12 mt-1"
          >
            Log in
            {!loading && <ArrowRight className="w-[18px] h-[18px]" />}
          </Button>

          <p className="text-center text-xs text-muted pt-1">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
