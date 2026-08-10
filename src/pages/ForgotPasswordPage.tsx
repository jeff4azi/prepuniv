import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthCard } from '../components/AuthShell';
import { Button } from '../components/Button';
import { TextInput, validateEmail } from '../components/Form';
import { useAuth } from '../context/AuthContext';

export function ForgotPasswordPage() {
  const { resetPasswordRequest } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const err = validateEmail(email);
    setError(err);
    if (err) return;
    setLoading(true);
    const result = await resetPasswordRequest(email);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setSent(true);
  }

  function handleBack() {
    setSent(false);
    setTouched(false);
    setError(null);
  }

  return (
    <AuthShell
      crossLink={{ label: 'Remembered it?', to: '/login', cta: 'Log in' }}
    >
      <AuthCard
        tag={sent ? 'Link sent' : 'Reset password'}
        tagTone={sent ? 'success' : 'secondary'}
        title={sent ? 'Check your email' : 'Reset your password'}
        subtitle={
          sent
            ? "If there's a PrepUniv account associated with this email, you'll receive a password reset link shortly."
            : "Enter the email address tied to your account and we'll send you a secure link to choose a new password."
        }
      >
        {!sent ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-[18px]">
            <TextInput
              id="email"
              name="email"
              label="Email address"
              placeholder="you@school.edu.ng"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched ? error ?? undefined : undefined}
              hint="We'll never share this email with anyone."
            />
            <Button fullWidth size="lg" type="submit" isLoading={loading} className="h-12 mt-1">
              Send reset link
              {!loading && <ArrowRight className="w-[18px] h-[18px]" />}
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-text-soft hover:text-primary transition-colors pt-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center py-2">
              <div className="h-20 w-20 rounded-3xl bg-success-bg text-success flex items-center justify-center mb-5 shadow-soft ring-1 ring-success/20">
                <CheckCircle2 className="w-10 h-10" strokeWidth={2} />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/60 text-text-soft text-sm border border-border/60 mb-4">
                <Mail className="w-4 h-4 text-muted" strokeWidth={2} />
                <span className="font-medium truncate max-w-[280px]">{email || 'you@example.com'}</span>
              </div>
              <p className="text-sm text-text-soft max-w-sm leading-relaxed">
                We've sent a password reset link to the email above. It expires in 30
                minutes. If you don't see it, check your spam or promotions folder.
              </p>
            </div>
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="w-full text-sm font-semibold text-text-soft hover:text-primary transition-colors pt-1"
              >
                Try a different email
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}
