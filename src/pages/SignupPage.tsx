import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { AuthShell, AuthCard } from "../components/AuthShell";
import { Button } from "../components/Button";
import {
  TextInput,
  PasswordInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from "../components/Form";
import { UniversitySelect, type University } from "../components/UniversitySelect";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

interface SignupErrors {
  full_name?: string | null;
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
  university?: string | null;
  form?: string | null;
}

const RESEND_COOLDOWN = 60;
const PENDING_UNI_KEY = "prepuniv:pending_university_id";

export function SignupPage() {
  const { signUp, resendSignup, isLoggedIn, updateProfilePatch } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [universities, setUniversities] = useState<University[]>([]);

  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("universities")
        .select("id, name, abbreviation, state")
        .order("name");
      if (cancelled || !data) return;
      setUniversities(data as University[]);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const pending = window.localStorage.getItem(PENDING_UNI_KEY);
    if (!pending) return;
    window.localStorage.removeItem(PENDING_UNI_KEY);
    void updateProfilePatch({ university_id: pending } as any);
    setUniversityId(pending);
  }, [isLoggedIn, updateProfilePatch]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function runValidation(): SignupErrors {
    return {
      full_name: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validatePasswordMatch(password, confirm),
      university: universityId ? null : "Please select your university.",
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = runValidation();
    setErrors(errs);
    if (
      errs.full_name ||
      errs.email ||
      errs.password ||
      errs.confirm ||
      errs.university
    )
      return;

    setLoading(true);
    window.localStorage.setItem(PENDING_UNI_KEY, universityId);
    const { error, needsConfirmation } = await signUp({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
    });

    if (error) {
      window.localStorage.removeItem(PENDING_UNI_KEY);
      setLoading(false);
      setErrors({
        ...errs,
        form: error.message,
      });
      return;
    }

    if (!needsConfirmation) {
      const { error: patchErr } = await updateProfilePatch({
        university_id: universityId,
      } as any);
      if (patchErr) {
        console.warn("university_id patch failed:", patchErr);
      }
      window.localStorage.removeItem(PENDING_UNI_KEY);
    }

    setLoading(false);

    if (needsConfirmation) {
      setCooldown(RESEND_COOLDOWN);
      setSignupEmail(email.trim());
    }
  }

  async function handleResend() {
    if (resending || cooldown > 0 || !signupEmail) return;
    setResending(true);
    setResent(false);
    const { error } = await resendSignup(signupEmail);
    setResending(false);
    if (!error) {
      setResent(true);
      setCooldown(RESEND_COOLDOWN);
    }
  }

  const live = submitted ? runValidation() : {};

  // ── "Check your email" screen ─────────────────────────────────────────────
  if (signupEmail) {
    return (
      <AuthShell
        crossLink={{
          label: "Wrong account?",
          to: "/signup",
          cta: "Start over",
        }}
      >
        <AuthCard
          tag="Almost there"
          tagTone="primary"
          title="Check your email"
          subtitle={`We sent a confirmation link to ${signupEmail}`}
        >
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center py-2 gap-4">
              <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-soft ring-1 ring-primary/20">
                <Mail className="w-10 h-10" strokeWidth={1.8} />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 text-text-soft text-sm border border-border/60">
                <Mail className="w-4 h-4 text-muted" strokeWidth={2} />
                <span className="font-medium truncate max-w-[260px]">
                  {signupEmail}
                </span>
              </div>
            </div>

            <p className="text-sm text-text-soft text-center leading-relaxed">
              Click the link in that email to activate your account. Didn't get
              it? Check spam, or resend below.
            </p>

            <div className="space-y-2">
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
                    : "Resend Email"}
              </Button>
            </div>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <AuthShell
      crossLink={{
        label: "Already have an account?",
        to: "/login",
        cta: "Log in",
      }}
    >
      <AuthCard
        tag="Welcome"
        tagTone="primary"
        title="Create your PrepUniv account"
        subtitle="Start practicing smarter — it takes less than 60 seconds to join."
        footer={
          <span>
            By signing up you agree to our{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="font-semibold text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        }
      >
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4 sm:space-y-[18px]"
        >
          <TextInput
            id="full_name"
            name="full_name"
            label="Full name"
            placeholder="e.g. Adebayo Johnson"
            autoComplete="name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (submitted)
                setErrors((p) => ({
                  ...p,
                  full_name: validateFullName(e.target.value),
                }));
            }}
            error={live.full_name ?? undefined}
          />

          <TextInput
            id="email"
            name="email"
            label="Email address"
            placeholder="you@school.edu.ng"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (submitted)
                setErrors((p) => ({
                  ...p,
                  email: validateEmail(e.target.value),
                }));
            }}
            error={live.email ?? undefined}
          />

          <UniversitySelect
            id="university"
            label="University"
            placeholder="Select your university…"
            universities={universities}
            value={universityId}
            onChange={(id) => {
              setUniversityId(id);
              if (submitted)
                setErrors((p) => ({
                  ...p,
                  university: id ? null : "Please select your university.",
                }));
            }}
            error={submitted ? (live.university ?? undefined) : undefined}
            hint="Quizzes and courses are scoped to your university."
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (submitted)
                setErrors((p) => ({
                  ...p,
                  password: validatePassword(e.target.value),
                }));
            }}
            error={live.password ?? undefined}
            hint="We'll never ask you to share this."
          />

          <PasswordInput
            id="confirm"
            name="confirm"
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (submitted)
                setErrors((p) => ({
                  ...p,
                  confirm: validatePasswordMatch(password, e.target.value),
                }));
            }}
            error={live.confirm ?? undefined}
          />

          <Button
            fullWidth
            size="lg"
            isLoading={loading}
            type="submit"
            className="h-12 mt-1"
          >
            Create account
            {!loading && <ArrowRight className="w-[18px] h-[18px]" />}
          </Button>

          <p className="text-center text-xs text-muted pt-1">
            Already on PrepUniv?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
