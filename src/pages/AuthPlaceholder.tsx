import { Link } from 'react-router-dom';
import { LandingTopNav } from '../components/LandingTopNav';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthPlaceholderProps {
  mode: 'login' | 'signup' | 'apply';
}

export function AuthPlaceholderPage({ mode }: AuthPlaceholderProps) {
  const meta = {
    login: {
      eyebrow: 'Welcome back',
      title: 'Log in to PrepUniv',
      sub: 'Pick up right where you left off.',
      tag: 'Auth stub',
      variant: 'primary' as const,
    },
    signup: {
      eyebrow: 'Create your account',
      title: 'Sign up for PrepUniv',
      sub: 'Start practicing smarter in under 60 seconds.',
      tag: 'Auth stub',
      variant: 'success' as const,
    },
    apply: {
      eyebrow: 'Creator onboarding',
      title: 'Apply to become a creator',
      sub: 'Monetize your study content with a 65% revenue share.',
      tag: 'Application stub',
      variant: 'secondary' as const,
    },
  }[mode];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <LandingTopNav />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to PrepUniv
          </Link>

          <div className="mb-6">
            <p className="text-xs font-heading font-semibold uppercase tracking-wider text-primary mb-2">
              {meta.eyebrow}
            </p>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text tracking-tight">
              {meta.title}
            </h1>
            <p className="mt-2 text-muted">{meta.sub}</p>
          </div>

          <Card padded className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface/40 border border-border/50">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {mode === 'apply' ? (
                  <Sparkles className="w-5 h-5" strokeWidth={2.2} />
                ) : (
                  <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
                )}
              </div>
              <div>
                <p className="text-sm font-heading font-semibold text-text">{meta.tag}</p>
                <p className="text-xs text-muted">
                  Full auth flow will be implemented in the next prompt.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {mode !== 'apply' && (
                <>
                  <div>
                    <label className="block text-xs font-heading font-medium text-text-soft mb-1.5">
                      Email address
                    </label>
                    <input
                      disabled
                      placeholder="you@school.edu.ng"
                      className="w-full h-12 px-4 rounded-2xl bg-cream border border-border text-text placeholder:text-muted/70 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-medium text-text-soft mb-1.5">
                      Password
                    </label>
                    <input
                      disabled
                      type="password"
                      placeholder="••••••••"
                      className="w-full h-12 px-4 rounded-2xl bg-cream border border-border text-text placeholder:text-muted/70 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-heading font-medium text-text-soft mb-1.5">
                        Full name
                      </label>
                      <input
                        disabled
                        placeholder="e.g. Adebayo Johnson"
                        className="w-full h-12 px-4 rounded-2xl bg-cream border border-border text-text placeholder:text-muted/70 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  )}
                </>
              )}

              {mode === 'apply' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-heading font-medium text-text-soft mb-1.5">
                      Full name
                    </label>
                    <input disabled className="w-full h-12 px-4 rounded-2xl bg-cream border border-border disabled:opacity-70" />
                  </div>
                  <div>
                    <label className="block text-xs font-heading font-medium text-text-soft mb-1.5">
                      Subjects / courses you create for
                    </label>
                    <textarea
                      disabled
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl bg-cream border border-border text-sm disabled:opacity-70 resize-none"
                      placeholder="e.g. JAMB Use of English, WAEC Literature-in-English"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button fullWidth disabled>
              {mode === 'login' && 'Log in'}
              {mode === 'signup' && 'Create account'}
              {mode === 'apply' && 'Submit application'}
            </Button>

            <div className="text-center text-sm text-muted pt-2">
              {mode === 'login' && (
                <p>
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  Already on PrepUniv?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Log in
                  </Link>
                </p>
              )}
              {mode === 'apply' && (
                <p>
                  Need help? Email{' '}
                  <a href="#" className="font-semibold text-primary hover:underline">
                    creators@prepuniv.ng
                  </a>
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
