import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthShellProps {
  children: ReactNode;
  crossLink?: { to: string; label: ReactNode; cta: string };
  maxWidth?: 'sm' | 'md' | 'split';
  splitDesktop?: boolean;
}

export function AuthShell({
  children,
  crossLink,
  maxWidth = 'sm',
  splitDesktop = false,
}: AuthShellProps) {
  const containerWidth =
    splitDesktop || maxWidth === 'split'
      ? 'max-w-[440px] lg:max-w-[1020px] xl:max-w-[1060px]'
      : maxWidth === 'md'
      ? 'max-w-[520px]'
      : 'max-w-[420px]';

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-background flex flex-col justify-between">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 safe-top">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 -ml-1 pl-1 pr-2 h-11 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <img
              src={new URL('../assets/prepUniv.png', import.meta.url).href}
              alt="PrepUniv"
              className="h-8 w-8 rounded-xl object-contain"
            />
            <span className="font-heading font-bold text-xl tracking-tight text-primary">
              PrepUniv
            </span>
          </Link>
          {crossLink && (
            <p className="text-sm text-text-soft">
              {crossLink.label}{' '}
              <Link
                to={crossLink.to}
                className="font-semibold text-primary hover:underline"
              >
                {crossLink.cta}
              </Link>
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className={`w-full ${containerWidth} transition-all duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}

interface AuthCardProps {
  tag?: string;
  tagTone?: 'primary' | 'success' | 'secondary';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  splitDesktop?: boolean;
  showcaseImage?: string;
  showcaseHeadline?: string;
  showcaseSubline?: string;
}

export function AuthCard({
  tag,
  tagTone = 'primary',
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  splitDesktop = false,
  showcaseImage,
  showcaseHeadline,
  showcaseSubline,
}: AuthCardProps) {
  if (splitDesktop) {
    return (
      <div className="relative">
        <div className="absolute -top-10 -left-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-6 h-56 w-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative bg-cream/95 rounded-[32px] sm:rounded-[36px] border border-border/70 shadow-elevated overflow-hidden p-3.5 sm:p-4 lg:p-5">
          <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
            {/* Left Column: Visual Artwork (Desktop only) */}
            <div className="hidden lg:flex flex-1 relative rounded-[26px] overflow-hidden bg-surface/30 border border-border/40 min-h-[580px] self-stretch">
              <img
                src={
                  showcaseImage ??
                  new URL('../assets/auth_showcase_art.jpg', import.meta.url).href
                }
                alt="PrepUniv"
                className="absolute inset-0 w-full h-full object-cover object-center select-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-cream/90 backdrop-blur-md border border-cream/50 shadow-soft">
                <p className="font-heading font-bold text-sm text-text">
                  {showcaseHeadline ?? 'Master your university courses & exams'}
                </p>
                <p className="text-xs text-text-soft/80 mt-1 leading-relaxed">
                  {showcaseSubline ??
                    'Practice with verified questions created by high-performing university creators.'}
                </p>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex-1 flex flex-col justify-center px-3 sm:px-6 lg:px-8 py-3 sm:py-5 w-full max-w-[440px] mx-auto lg:max-w-none">
              {/* Brand emblem & name header */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <img
                  src={new URL('../assets/prepUniv.png', import.meta.url).href}
                  alt="PrepUniv"
                  className="h-6 w-6 rounded-lg object-contain"
                />
                <span className="font-heading font-bold text-base tracking-tight text-text">
                  PrepUniv
                </span>
              </div>

              {/* Title & subtitle */}
              <div className="text-center mb-5 sm:mb-6">
                <h1 className="font-heading font-bold tracking-tight text-text text-2xl sm:text-[28px] leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1.5 text-xs sm:text-sm text-text-soft/80 leading-relaxed max-w-sm mx-auto">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form Content */}
              <div>{children}</div>

              {footer && (
                <div className="mt-5 pt-4 border-t border-border/50 text-center text-xs text-text-soft">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard non-split card
  const tagClass =
    tagTone === 'success'
      ? 'bg-success-bg text-success border-success/20'
      : tagTone === 'secondary'
      ? 'bg-secondary/10 text-secondary border-secondary/20'
      : 'bg-primary/10 text-primary border-primary/20';

  return (
    <div className="relative">
      <div className="absolute -top-10 -left-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-6 h-48 w-48 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />
      <div className="relative bg-cream/90 rounded-3xl border border-border/60 shadow-elevated overflow-hidden">
        <div className="px-6 sm:px-8 pt-7 sm:pt-8 pb-2 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-soft">
            <img
              src={new URL('../assets/prepUniv.png', import.meta.url).href}
              alt=""
              className="h-8 w-8 object-contain"
            />
          </div>
          {tag && (
            <span
              className={
                'inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-[0.14em] px-3 py-1 rounded-full border mb-4 ' +
                tagClass
              }
            >
              {tag}
            </span>
          )}
          {eyebrow && (
            <p className="text-[11px] font-heading uppercase tracking-wider font-semibold text-muted mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="font-heading font-bold tracking-tight text-text text-2xl sm:text-3xl leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2.5 text-sm sm:text-[15px] text-muted leading-relaxed max-w-sm">
              {subtitle}
            </p>
          )}
        </div>
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 space-y-4 sm:space-y-[18px]">
          {children}
        </div>
        {footer && (
          <div className="px-6 sm:px-8 py-5 border-t border-border/60 text-center text-sm text-text-soft bg-background/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
