import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * DrawerShell — reusable right-hand slide-out drawer.
 *
 * Structure (inside children):
 *   <DrawerShell.Header>  — non-scrolling title/meta row
 *   <DrawerShell.Body>    — flex-1 overflow-y-auto (scrolling content)
 *   <DrawerShell.Footer>  — non-scrolling action buttons pinned to bottom
 *
 * Responsive behaviour:
 *   sm+ : right-edge full-height drawer (top:0 → bottom:0 anchored)
 *   <sm : bottom sheet with drag pill, max 92dvh
 */
export function DrawerShell({
  open,
  onClose,
  children,
  ariaLabel,
}: DrawerShellProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", h);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="fixed z-10 flex flex-col bg-cream shadow-elevated overflow-hidden
                   bottom-0 left-0 right-0 w-full rounded-t-3xl max-h-[92dvh]
                   sm:top-0 sm:left-auto sm:right-0 sm:bottom-auto sm:w-full sm:max-w-lg sm:max-h-screen sm:rounded-l-3xl sm:rounded-t-none
                   animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 ease-out"
      >
        {/* Drag pill — mobile only */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {children}
      </div>
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────────────────────── */

interface DrawerHeaderProps {
  icon?: ReactNode;
  iconWrapper?: boolean;
  iconClassName?: string;
  title: ReactNode;
  meta?: ReactNode;
  statusBadge?: ReactNode;
  onClose: () => void;
  className?: string;
}

DrawerShell.Header = function DrawerHeader({
  icon,
  iconWrapper = true,
  iconClassName = "bg-primary/10 text-primary",
  title,
  meta,
  statusBadge,
  onClose,
  className = "",
}: DrawerHeaderProps) {
  return (
    <div
      className={`flex items-start gap-3 px-5 pt-4 sm:pt-5 pb-4 border-b border-border/40 shrink-0 ${className}`}
    >
      {icon &&
        (iconWrapper ? (
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}
          >
            {icon}
          </div>
        ) : (
          <div className="shrink-0">{icon}</div>
        ))}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {typeof title === "string" ? (
            <h2 className="font-heading font-bold text-base text-text leading-tight">
              {title}
            </h2>
          ) : (
            title
          )}
          {statusBadge}
        </div>
        {meta && typeof meta === "string" ? (
          <p className="text-xs text-muted mt-0.5">{meta}</p>
        ) : (
          <div className="text-xs text-muted mt-0.5">{meta}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 hover:text-text transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─── Body ────────────────────────────────────────────────────────────── */

interface DrawerBodyProps {
  children: ReactNode;
  className?: string;
}

DrawerShell.Body = function DrawerBody({
  children,
  className = "",
}: DrawerBodyProps) {
  return (
    <div
      className={`flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0 ${className}`}
    >
      {children}
    </div>
  );
};

/* ─── Footer ──────────────────────────────────────────────────────────── */

interface DrawerFooterProps {
  children: ReactNode;
  className?: string;
}

DrawerShell.Footer = function DrawerFooter({
  children,
  className = "",
}: DrawerFooterProps) {
  return (
    <div
      className={`px-5 pb-5 pt-3 border-t border-border/40 shrink-0 ${className}`}
    >
      {children}
    </div>
  );
};
