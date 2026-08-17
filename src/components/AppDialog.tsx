import { useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "./Button";

type DialogVariant = "alert" | "confirm";

interface AppDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

/** Accessible in-app replacement for browser alert() and confirm(). */
export function AppDialog({
  open,
  title,
  message,
  variant = "alert",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: AppDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && variant === "confirm") onCancel?.();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, variant, onCancel]);

  if (!open) return null;
  const isConfirm = variant === "confirm";

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="app-dialog-title">
      <button
        type="button"
        className="absolute inset-0 bg-text/40 backdrop-blur-sm cursor-default"
        aria-label={isConfirm ? "Cancel" : "Close"}
        onClick={isConfirm ? onCancel : onConfirm}
      />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-cream p-6 shadow-elevated">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-danger-bg text-danger">
          {isConfirm ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <h2 id="app-dialog-title" className="text-center font-heading text-lg font-bold text-text">{title}</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-text-soft">{message}</p>
        <div className="mt-6 flex gap-2.5">
          {isConfirm && (
            <Button variant="ghost" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          )}
          <Button variant={isConfirm ? "primary" : "outline"} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
