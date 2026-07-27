import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import { AuthShell, AuthCard } from '../components/AuthShell';
import { Button } from '../components/Button';
import {
  PasswordInput,
  validatePassword,
  validatePasswordMatch,
} from '../components/Form';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [touched, setTouched] = useState<{ password: boolean; confirm: boolean }>({
    password: false,
    confirm: false,
  });
  const [success, setSuccess] = useState(false);

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
    if (!validateAll()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    setLoading(false);
    setSuccess(true);
  }

  const liveErrors = touched.password || touched.confirm ? runValidation() : {};
  const finalErrors = {
    password: errors.password ?? liveErrors.password,
    confirm: errors.confirm ?? liveErrors.confirm,
  };

  return (
    <AuthShell
      crossLink={{ label: 'Never mind,', to: '/login', cta: 'Go back to login' }}
    >
      <AuthCard
        tag={success ? 'All set' : 'Choose new password'}
        tagTone={success ? 'success' : 'primary'}
        title={success ? 'Password updated' : 'Set a new password'}
        subtitle={
          success
            ? "Your PrepUniv password has been changed. Log in with your new credentials below to get back to practicing."
            : 'Use at least 8 characters. For extra credit, mix in uppercase, numbers, or symbols.'
        }
      >
        {!success ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-[18px]">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-warning-bg/50 border border-warning/15">
              <div className="h-10 w-10 rounded-xl bg-cream text-warning flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" strokeWidth={2.1} />
              </div>
              <p className="text-xs sm:text-[13px] text-text-soft leading-relaxed">
                This is a simulated password-reset page. No real email link was opened —
                we're just validating the flow so you can preview the UX.
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
                <a href="#" className="font-semibold text-primary hover:underline">
                  support@prepuniv.ng
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
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setPassword('');
                  setConfirm('');
                  setTouched({ password: false, confirm: false });
                }}
                className="w-full text-sm font-semibold text-text-soft hover:text-primary transition-colors pt-1"
              >
                Choose a different password
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
