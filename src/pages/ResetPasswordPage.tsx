import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Loader2,
  MailOpen,
  ArrowLeft,
} from "lucide-react";
import { AuthShell, AuthCard } from "../components/AuthShell";
import { Button } from "../components/Button";
import {
  PasswordInput,
  validatePassword,
  validatePasswordMatch,
} from "../components/Form";
import { useAuth } from "../context/AuthContext";

type PageState = "verifying" | "ready" | "invalid" | "success";

export function ResetPasswordPage() {
  const { updatePassword, isPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string | null;
    confirm?: string | null;
    submit?: string | null;
  }>({});
  const [touched, setTouched] = useState<{
    password: boolean;
    confirm: boolean;
  }>({
    password: false,
    confirm: false,
  });

  // isPasswordRecovery only flips true once Supabase has processed the
  // recovery token from the URL (an async PASSWORD_RECOVERY auth event) —
  // give it a moment before treating "not recovering yet" as "invalid
  // link". Mirrors ConfirmEmailPage's verifying → ready/invalid pattern.
  const [state, setState] = useState<PageState>(
    isPasswordRecovery ? "ready" : "verifying",
  );

  useEffect(() => {
    if (state !== "verifying") return;
    if (isPasswordRecovery) {
      setState("ready");
      return;
    }
    const t = setTimeout(() => {
      setState((s) => (s === "verifying" ? "invalid" : s));
    }, 1800);
    return () => clearTimeout(t);
  }, [state, isPasswordRecovery]);

  function runValidation() {
    return {
      password: validatePassword(password),
      confirm: validatePasswordMatch(password, confirm),
    };
  }

  function validateAll(): boolean {
    const e = runValidation();
    setErrors(e);
    setTouched({ password: true, confirm: true });
    return !e.password && !e.confirm;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Belt-and-braces: don't even attempt the update outside a genuine
    // recovery session, even if this handler somehow still gets called.
    if (!isPasswordRecovery) {
      setState("invalid");
      return;
    }
    if (!validateAll()) return;
    setLoading(true);
    setErrors((prev) => ({ ...prev, submit: null }));
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) {
      setErrors((prev) => ({ ...prev, submit: result.error!.message }));
      return;
    }
    setState("success");
  }

  const liveErrors =
    touched.password || touched.confirm ? runValidation() : {};
  const finalErrors = {
    password: errors.password ?? liveErrors.password,
    confirm: errors.confirm ?? liveErrors.confirm,
  };

  // ── Verifying the recovery link ─────────────────────────────────────────
  if (state === "verifying") {
    return (
      <AuthShell>
        <AuthCard
          tag="Please wait"
          tagTone="secondary"
          title="Confirming your reset link…"
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

  // ── No valid recovery session — don't show the password form at all ────
  // Reaching /reset-password with an ordinary logged-in session (or no
  // session at all) should never be enough to change a password: this
  // form only unlocks via a fresh link from Forgot Password, which is
  // what establishes isPasswordRecovery.
  if (state === "invalid") {
    return (
      <AuthShell
        crossLink={{ label: "Know your password?", to: "/login", cta: "Log in" }}
      >
        <AuthCard
          tag="Link expired"
          tagTone="secondary"
          title="This link isn't valid"
          subtitle="The reset link has expired, was already used, or wasn't opened from the email we sent. Request a new one below."
        >
          <div className="space-y-5">
            <div className="flex justify-center py-2">
              <div className="h-16 w-16 rounded-3xl bg-surface border border-border/50 text-muted flex items-center justify-center shadow-card">
                <MailOpen className="w-8 h-8" strokeWidth={1.8} />
              </div>
            </div>

            <Link to="/forgot-password">
              <Button fullWidth size="lg" className="h-12">
                Request a new reset link
                <ArrowRight className="w-[18px] h-[18px]" />
              </Button>
            </Link>

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

  return (
    <AuthShell
      crossLink={{ label: "Never mind,", to: "/login", cta: "Go back to login" }}
    >
      <AuthCard
        tag={state === "success" ? "All set" : "Choose new password"}
        tagTone={state === "success" ? "success" : "primary"}
        title={state === "success" ? "Password updated" : "Set a new password"}
        subtitle={
          state === "success"
            ? "Your PrepUniv password has been changed. Log in with your new credentials below to get back to practicing."
            : "Use at least 8 characters. For extra credit, mix in uppercase, numbers, or symbols."
        }
      >
        {state === "ready" ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-[18px]">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/15">
              <div className="h-10 w-10 rounded-xl bg-cream text-primary flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" strokeWidth={2.1} />
              </div>
              <p className="text-xs sm:text-[13px] text-text-soft leading-relaxed">
                Choose a strong password that you don&apos;t use anywhere else.
                We&apos;ll use this to secure your account going forward.
              </p>
            </div>

            <PasswordInput
              id="new-password"
              name="new-password"
              label="New password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={finalErrors.password ?? undefined}
            />
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              label="Confirm new password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              error={finalErrors.confirm ?? undefined}
            />

            {errors.submit && (
              <p className="text-xs text-danger flex items-center gap-1.5 px-1">
                <span className="w-1 h-1 rounded-full bg-danger inline-block shrink-0" />
                {errors.submit}
              </p>
            )}

            <Button fullWidth size="lg" isLoading={loading} type="submit" className="h-12 mt-1">
              Reset password
              {!loading && <ArrowRight className="w-[18px] h-[18px]" />}
            </Button>

            <p className="text-center text-xs text-muted pt-1">
              Found it after all?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Log in instead
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center py-2">
              <div className="h-20 w-20 rounded-3xl bg-success-bg text-success flex items-center justify-center mb-5 shadow-soft ring-1 ring-success/20">
                <CheckCircle2 className="w-10 h-10" strokeWidth={2} />
              </div>
              <h3 className="font-heading font-bold text-text text-xl tracking-tight mb-2">
                Nice work. Your password is updated.
              </h3>
              <p className="text-sm text-text-soft max-w-sm leading-relaxed">
                Use it the next time you log in. If this wasn't you, please reach out to{' '}
                <a href="mailto:support@prepuniv.com" className="font-semibold text-primary hover:underline">
                  support@prepuniv.com
                </a>{' '}
                immediately.
              </p>
            </div>
            <div className="space-y-3 pt-1">
              <Link to="/login">
                <Button fullWidth size="lg" className="h-12">
                  <KeyRound className="w-[18px] h-[18px]" />
                  Continue to login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
