import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  dot?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  default: 'bg-surface text-text-soft border-border/60',
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  success: 'bg-success-bg text-success border-success/20',
  warning: 'bg-warning-bg text-warning border-warning/20',
  danger: 'bg-danger-bg text-danger border-danger/20',
  muted: 'bg-muted/10 text-muted border-muted/20',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded-lg font-medium',
  md: 'text-xs px-2.5 py-1 rounded-xl font-medium',
};

const DOT_COLORS: Record<Variant, string> = {
  default: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-muted',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className} font-heading tracking-tight`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[variant]}`} />}
      {children}
    </span>
  );
}
