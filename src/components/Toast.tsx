/**
 * Toast — lightweight app-wide toast notification.
 *
 * Usage:
 *   const [toast, setToast] = useToast();
 *   setToast({ message: '...', variant: 'success' });
 *
 * The <Toast> component renders itself fixed at the top of the screen.
 * Auto-dismisses after `duration` ms (default 4000).
 */
import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastVariant = "success" | "danger";

export interface ToastState {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastProps extends ToastState {
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-primary text-cream",
  danger: "bg-danger text-cream",
};

export function Toast({
  message,
  variant = "success",
  duration = 4000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-elevated max-w-sm w-[calc(100%-2rem)] ${VARIANT_STYLES[variant]}`}
      style={{ animation: "toast-in 0.25s cubic-bezier(.16,1,.3,1)" }}
    >
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <Icon className="w-5 h-5 shrink-0" strokeWidth={2.1} />
      <span className="font-heading font-medium text-sm flex-1 leading-snug">
        {message}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Hook that returns [toastState | null, showToast fn, dismissToast fn] */
export function useToast() {
  const [toast, setToastState] = useState<ToastState | null>(null);

  const showToast = useCallback((t: ToastState) => {
    setToastState(null); // reset first so re-triggering same msg still animates
    setTimeout(() => setToastState(t), 10);
  }, []);

  const dismissToast = useCallback(() => setToastState(null), []);

  return [toast, showToast, dismissToast] as const;
}
