/**
 * ConfirmEmailPage — /confirm-email
 *
 * Simulates what happens when a user clicks the link in their confirmation email.
 * Reads ?token= from the URL — any non-empty value is treated as valid in mock mode.
 *
 * States:
 *   verifying  — spinner on mount (~1 s delay)
 *   success    — mark confirmed, log in, redirect to /home
 *   invalid    — bad/missing token; show resend form
 */
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
import { profiles } from "../mock";

// ─── Resend widget (shared by invalid-token state) ────────────────────────────

const RESEND_COOLDOWN = 60;

function ResendForm() {
  const [email, setEmail] = useState("");
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
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
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
        <p className="text-xs text-success font-heading font-medium flex items-center gap-1.5">
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

// ─── Main page ────────────────────────────────────────────────────────────────

type PageState = "verifying" | "success" | "invalid";

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmEmail } = useAuth();

  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<PageState>("verifying");
  const [autoRedirectCount, setAutoRedirectCount] = useState(5);

  // Extract userId from token — format: mock-token-{userId}
  const userId = token.startsWith("mock-token-")
    ? token.slice("mock-token-".length)
    : null;

  useEffect(() => {
    // Simulate server-side token verification
    const t = setTimeout(() => {
      if (token && userId) {
        setState("success");
        confirmEmail(userId);
      } else {
        setState("invalid");
      }
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (state !== "success") return;
    if (autoRedirectCount <= 0) {
      navigate("/home", { replace: true });
      return;
    }
    const t = setTimeout(() => setAutoRedirectCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, autoRedirectCount, navigate]);

  // ── Verifying ──────────────────────────────────────────────────────────────
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

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === "success") {
    const profile = userId ? profiles.find((p) => p.id === userId) : null;
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
              {profile && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 text-text-soft text-sm border border-border/60">
                  <Mail className="w-4 h-4 text-muted" strokeWidth={2} />
                  <span className="font-medium truncate max-w-[260px]">
                    {profile.email}
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

  // ── Invalid token ──────────────────────────────────────────────────────────
  return (
    <AuthShell
      crossLink={{ label: "Know your password?", to: "/login", cta: "Log in" }}
    >
      <AuthCard
        tag="Link expired"
        tagTone="secondary"
        title="This link isn't valid"
        subtitle="The confirmation link has expired or was already used. Request a new one below."
      >
        <div className="space-y-5">
          <div className="flex justify-center py-2">
            <div className="h-16 w-16 rounded-3xl bg-surface border border-border/50 text-muted flex items-center justify-center shadow-card">
              <MailOpen className="w-8 h-8" strokeWidth={1.8} />
            </div>
          </div>

          <ResendForm />

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
