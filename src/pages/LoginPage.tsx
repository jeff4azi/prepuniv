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
} from "../components/Form";
import { useAuth } from "../context/AuthContext";
import { profiles } from "../mock";

export function LoginPage() {
  const navigate = useNavigate();
  const { logInAsUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
  }>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    {
      email: false,
      password: false,
    },
  );

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
    await new Promise((r) => setTimeout(r, 600));

    // Match email against mock profiles (case-insensitive)
    const matched = profiles.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (matched) {
      logInAsUser(matched.id);
      navigate("/home", { replace: true });
    } else {
      setErrors({ email: "No account found with that email address." });
    }
    setLoading(false);
  }

  const liveErrors = touched.email || touched.password ? runValidation() : {};
  const finalErrors = {
    email: errors.email ?? liveErrors.email,
    password: errors.password ?? liveErrors.password,
  };

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
