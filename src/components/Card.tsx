import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  children,
  padded = true,
  hover = false,
  className = '',
  as: Component = 'div',
  ...props
}: CardProps) {
  return (
    <Component
      className={`bg-cream rounded-2xl border border-border/50 shadow-card ${hover ? 'transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5' : ''} ${padded ? 'p-5' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
