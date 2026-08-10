/**
 * UniversitySelect — custom dropdown for picking a university.
 *
 * Used on the Signup page (required, no "All" option) and the Admin
 * Users page (optional filter, includes an "All Universities" option).
 *
 * Styled to match the existing Form.tsx input conventions and the
 * course-autocomplete dropdown in QuizBuilderPage.
 */
import { useEffect, useRef, useState } from "react";
import { GraduationCap, Check, ChevronDown } from "lucide-react";
import { FieldWrapper } from "./Form";

export interface University {
  id: string;
  name: string;
  abbreviation: string;
  state: string;
}

interface UniversitySelectProps {
  /** All available universities to show */
  universities: University[];
  /** Currently selected university id, or "" for none */
  value: string;
  onChange: (universityId: string) => void;
  /** If true, prepends an "All Universities" option (value = "all") */
  includeAll?: boolean;
  /** Label text shown above the input */
  label?: string;
  /** Hint text shown below */
  hint?: string;
  /** Validation error message */
  error?: string;
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function UniversitySelect({
  universities,
  value,
  onChange,
  includeAll = false,
  label,
  hint,
  error,
  placeholder = "Select your university…",
  id = "university-select",
  disabled = false,
}: UniversitySelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selected = universities.find((u) => u.id === value);
  const isAll = includeAll && value === "all";

  const displayLabel = isAll
    ? "All Universities"
    : selected
      ? selected.name
      : null;

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <div ref={wrapRef} className="relative">
        {/* Trigger button — styled to match BASE_INPUT */}
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={[
            "w-full h-12 sm:h-[50px] pl-10 pr-10 rounded-xl text-sm text-left",
            "bg-cream border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
            "font-heading",
            displayLabel ? "text-text" : "text-muted/70",
            error
              ? "border-danger/60 bg-danger-bg/30 focus:ring-danger/30 focus:border-danger"
              : "border-border",
          ].join(" ")}
        >
          {displayLabel ?? placeholder}
        </button>

        {/* Leading icon */}
        <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />

        {/* Trailing chevron */}
        <ChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />

        {/* Dropdown panel */}
        {open && (
          <div
            role="listbox"
            aria-label="Universities"
            className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-border/60 bg-cream shadow-elevated overflow-hidden divide-y divide-border/30"
          >
            {/* "All" option */}
            {includeAll && (
              <button
                type="button"
                role="option"
                aria-selected={isAll}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick("all")}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                  isAll ? "bg-primary/5" : "hover:bg-surface/40"
                }`}
              >
                <div
                  className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                    isAll
                      ? "bg-primary/10 text-primary"
                      : "bg-surface/60 text-muted"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" strokeWidth={2} />
                </div>
                <span
                  className={`flex-1 font-heading font-semibold text-sm ${
                    isAll ? "text-primary" : "text-text"
                  }`}
                >
                  All Universities
                </span>
                {isAll && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            )}

            {universities.map((uni) => {
              const active = value === uni.id;
              return (
                <button
                  key={uni.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(uni.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                    active ? "bg-primary/5" : "hover:bg-surface/40"
                  }`}
                >
                  <div
                    className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-surface/60 text-muted"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-heading font-semibold text-sm leading-tight ${
                        active ? "text-primary" : "text-text"
                      }`}
                    >
                      {uni.name}
                    </p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {uni.abbreviation} · {uni.state}
                    </p>
                  </div>
                  {active && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
