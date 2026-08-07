import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
import { AuthShell, AuthCard } from "../components/AuthShell";
import { Button } from "../components/Button";
import {
  TextInput,
  PasswordInput,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
  FieldWrapper,
} from "../components/Form";
import { useAuth } from "../context/AuthContext";
import { universities } from "../mock";

interface SignupErrors {
  full_name?: string | null;
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
  university?: string | null;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [touched, setTouched] = useState<Record<keyof SignupErrors, boolean>>({
    full_name: false,
    email: false,
    password: false,
    confirm: false,
    university: false,
  });

  function runValidation(): SignupErrors {
    return {
      full_name: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validatePasswordMatch(password, confirm),
      university: universityId ? null : "Please select your university.",
    };
  }

  function validateAll(): boolean {
    const e = runValidation();
    setErrors(e);
    setTouched({
      full_name: true,
      email: true,
      password: true,
      confirm: true,
      university: true,
    });
    return (
      !e.full_name && !e.email && !e.password && !e.confirm && !e.university
    );
  }

  function onBlur(key: keyof SignupErrors) {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((prev) => ({ ...prev, ...runValidation() }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    signUp({
      full_name: fullName.trim(),
      email: email.trim(),
      university_id: universityId,
    });
    setLoading(false);
    navigate("/home", { replace: true });
  }

  const liveErrors = touched ? runValidation() : {};
  const finalErrors = {
    full_name: errors.full_name ?? liveErrors.full_name,
    email: errors.email ?? liveErrors.email,
    password: errors.password ?? liveErrors.password,
    confirm: errors.confirm ?? liveErrors.confirm,
    university: errors.university ?? liveErrors.university,
  };

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
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => onBlur("full_name")}
            error={finalErrors.full_name ?? undefined}
          />
          <TextInput
            id="email"
            name="email"
            label="Email address"
            placeholder="you@school.edu.ng"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => onBlur("email")}
            error={finalErrors.email ?? undefined}
          />

          {/* University selector */}
          <FieldWrapper
            id="university"
            label="University"
            error={
              touched.university && finalErrors.university
                ? finalErrors.university
                : undefined
            }
            hint="Quizzes and courses are scoped to your university."
          >
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <select
                id="university"
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  if (touched.university)
                    setErrors((prev) => ({
                      ...prev,
                      university: e.target.value
                        ? null
                        : "Please select your university.",
                    }));
                }}
                onBlur={() => onBlur("university")}
                className={`w-full h-11 pl-10 pr-10 rounded-xl bg-cream border text-sm font-heading text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none cursor-pointer transition-all ${
                  touched.university && finalErrors.university
                    ? "border-danger/60"
                    : "border-border"
                } ${!universityId ? "text-muted" : ""}`}
              >
                <option value="" disabled>
                  Select your university…
                </option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </FieldWrapper>

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => onBlur("password")}
            error={finalErrors.password ?? undefined}
            hint="We'll never ask you to share this."
          />
          <PasswordInput
            id="confirm"
            name="confirm"
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => onBlur("confirm")}
            error={finalErrors.confirm ?? undefined}
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
