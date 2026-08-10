/**
 * CustomSelect — a fully custom dropdown that replaces all native <select>
 * elements across the app.
 *
 * Two visual variants:
 *   "filter"  — compact h-9, used in filter bars (Browse, Library, History,
 *               AdminQuizzes). Has an optional leading icon slot.
 *   "field"   — full-width h-11, used inside form field wrappers
 *               (QuizBuilder level, AdminCourses level, ReportModal reason).
 *               Integrates with FieldWrapper via the `label`/`error`/`hint` props.
 *
 * Closes on outside click, Escape key, and after a selection.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FieldWrapper } from "./Form";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional icon rendered to the left of the label in the dropdown list */
  icon?: ReactNode;
}

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, wrapRef };
}

// ─── Filter variant ───────────────────────────────────────────────────────────
// Compact, inline — sits inside filter bars alongside chips and toggles.

interface FilterSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Optional leading icon inside the trigger button */
  leadingIcon?: ReactNode;
  "aria-label"?: string;
  className?: string;
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  leadingIcon,
  "aria-label": ariaLabel,
  className = "",
}: FilterSelectProps<T>) {
  const { open, setOpen, wrapRef } = useDropdown();
  const selected = options.find((o) => o.value === value);

  function pick(v: T) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-9 pl-2.5 pr-2.5 rounded-xl border border-border/60 bg-cream text-xs font-heading font-medium text-text hover:border-border hover:bg-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all cursor-pointer select-none"
      >
        {leadingIcon && (
          <span className="text-muted shrink-0">{leadingIcon}</span>
        )}
        <span className="truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 z-50 mt-1.5 min-w-[10rem] rounded-2xl border border-border/60 bg-cream shadow-elevated overflow-hidden py-1"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt.value)}
                className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs font-heading font-medium transition-colors ${
                  active
                    ? "bg-primary/8 text-primary"
                    : "text-text hover:bg-surface/50"
                }`}
              >
                {opt.icon && (
                  <span className="shrink-0 text-muted">{opt.icon}</span>
                )}
                <span className="flex-1">{opt.label}</span>
                {active && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Field variant ────────────────────────────────────────────────────────────
// Full-width, h-11, integrates with FieldWrapper for form use.

interface FieldSelectProps<T extends string> {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function FieldSelect<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Select…",
  label,
  error,
  hint,
  disabled = false,
  className = "",
}: FieldSelectProps<T>) {
  const { open, setOpen, wrapRef } = useDropdown();
  const selected = options.find((o) => o.value === value);

  function pick(v: T) {
    onChange(v);
    setOpen(false);
  }

  const trigger = (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={[
          "w-full h-11 pl-4 pr-10 rounded-xl text-sm text-left font-heading",
          "bg-cream border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
          "transition-all duration-150 cursor-pointer select-none",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          selected ? "text-text" : "text-muted/70",
          error
            ? "border-danger/60 bg-danger-bg/30 focus:ring-danger/30 focus:border-danger"
            : "border-border",
        ].join(" ")}
      >
        {selected?.label ?? placeholder}
      </button>

      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      />

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 rounded-2xl border border-border/60 bg-cream shadow-elevated overflow-hidden py-1"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(opt.value)}
                className={`w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm font-heading font-medium transition-colors ${
                  active
                    ? "bg-primary/8 text-primary"
                    : "text-text hover:bg-surface/50"
                }`}
              >
                {opt.icon && (
                  <span className="shrink-0 text-muted">{opt.icon}</span>
                )}
                <span className="flex-1">{opt.label}</span>
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!label && !error && !hint) return trigger;

  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      {trigger}
    </FieldWrapper>
  );
}
