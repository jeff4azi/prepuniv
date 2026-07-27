import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
}

export function PageContainer({ children, title, subtitle, rightSlot, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 ${className}`}>
      {(title || rightSlot) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            {title && (
              <h1 className="text-2xl lg:text-3xl font-heading font-bold text-text tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1.5 text-sm lg:text-base text-muted">{subtitle}</p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
