import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const BASE_STYLES =
  'inline-flex items-center justify-center gap-2 font-heading font-medium rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none';

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-primary text-cream hover:bg-primary-hover focus:ring-primary shadow-soft',
  secondary:
    'bg-secondary text-cream hover:bg-secondary/90 focus:ring-secondary shadow-soft',
  ghost:
    'bg-transparent text-text hover:bg-surface focus:ring-surface',
  outline:
    'bg-transparent border border-border text-text hover:bg-surface focus:ring-border',
  danger:
    'bg-danger-bg text-danger hover:bg-danger-bg/80 focus:ring-danger',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 h-9',
  md: 'text-sm px-4 py-2 h-11',
  lg: 'text-base px-6 py-3 h-12',
  icon: 'h-11 w-11',
};

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading,
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${BASE_STYLES} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        leftIcon
      )}
      {size !== 'icon' && children}
      {!isLoading && rightIcon}
    </button>
  );
}
