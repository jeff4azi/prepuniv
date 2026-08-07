import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
import { UniversitySelect } from "../components/UniversitySelect";
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
  // Errors are only shown after the first submit attempt
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});

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
    await new Promise((r) => setTimeout(r, 650));
    signUp({
      full_name: fullName.trim(),
      email: email.trim(),
      university_id: universityId,
    });
    setLoading(false);
    navigate("/home", { replace: true });
  }

  // Re-validate on every keystroke but only surface errors if submit was attempted
  const live = submitted ? runValidation() : {};

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
                setErrors((prev) => ({
                  ...prev,
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
                setErrors((prev) => ({
                  ...prev,
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
                setErrors((prev) => ({
                  ...prev,
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
                setErrors((prev) => ({
                  ...prev,
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
                setErrors((prev) => ({
                  ...prev,
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
