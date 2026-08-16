/**
 * ReportModal — shared "Report this quiz" modal / bottom-sheet.
 *
 * Desktop: centred modal (flex items-center)
 * Mobile:  bottom sheet (items-end → slides up from bottom)
 *
 * Uses React Portal with z-[100] to sit above sticky mobile bars and navigation.
 */
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, Flag } from "lucide-react";
import { Button } from "./Button";
import { FieldWrapper } from "./Form";
import { FieldSelect } from "./CustomSelect";
import type { ReportReason } from "../types";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// ─── Reason options ───────────────────────────────────────────────────────────

interface ReasonOption {
  value: ReportReason;
  label: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: "incorrect_answers", label: "Incorrect answers" },
  { value: "low_quality", label: "Low quality / lazy content" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "copyright", label: "Copyright concern" },
  { value: "other", label: "Other" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportModalProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Select ───────────────────────────────────────────────────────────────────

function ReasonSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: ReportReason | "") => void;
  error?: string;
}) {
  return (
    <FieldSelect
      id="report-reason"
      label="Reason"
      error={error}
      value={value}
      onChange={(v) => onChange(v as ReportReason | "")}
      placeholder="Select a reason…"
      options={REASON_OPTIONS}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

const BASE_TEXTAREA = [
  "w-full px-4 py-3 rounded-xl text-sm resize-none",
  "bg-cream text-text placeholder:text-muted/70",
  "border border-border focus:outline-none",
  "ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
  "transition-all duration-150",
].join(" ");
const ERROR_TEXTAREA =
  "border-danger/60 bg-danger-bg/30 focus:ring-danger/30 focus:border-danger";

function Textarea({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
  rows = 3,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <FieldWrapper id={id} label={label} error={error}>
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        className={BASE_TEXTAREA + " " + (error ? ERROR_TEXTAREA : "")}
      />
    </FieldWrapper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportModal({
  quizId,
  quizTitle,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const { currentUser } = useAuth();

  const [reason, setReason] = useState<ReportReason | "">("");
  const [otherText, setOtherText] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ reason?: string; otherText?: string }>(
    {},
  );

  function validate(): boolean {
    const e: typeof errors = {};
    if (!reason) e.reason = "Please select a reason";
    if (reason === "other" && !otherText.trim())
      e.otherText = "Please describe the issue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUser.id,
      quiz_id: quizId,
      quiz_title: quizTitle,
      reason: reason as ReportReason,
      other_text: reason === "other" ? otherText.trim() || null : null,
      details: details.trim() || null,
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      console.error("Report submit error:", error.message);
      setSubmitError("Failed to submit report. Please try again.");
    } else {
      onSuccess();
      onClose();
    }
  }

  return createPortal(
    /* Overlay with z-[100] to sit above all sticky footers and bottom nav */
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — bottom sheet on mobile, modal on sm+ */}
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-cream shadow-elevated flex flex-col max-h-[90vh] overflow-hidden z-[101]">
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 sm:pt-5 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-danger-bg text-danger flex items-center justify-center shrink-0">
              <Flag className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-text leading-tight">
                Report this quiz
              </h2>
              <p className="text-xs text-text-soft mt-0.5 leading-snug line-clamp-1">
                &ldquo;{quizTitle}&rdquo;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 hover:text-text transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="overflow-y-auto no-scrollbar flex-1"
        >
          <div className="px-5 py-4 space-y-4">
            {submitError && (
              <div className="p-3 rounded-xl bg-danger-bg/50 border border-danger/30 text-xs text-danger font-medium">
                {submitError}
              </div>
            )}

            {/* Reason */}
            <ReasonSelect
              value={reason}
              onChange={(v) => {
                setReason(v);
                if (v) setErrors((prev) => ({ ...prev, reason: undefined }));
              }}
              error={errors.reason}
            />

            {/* "Other" text — only when reason === 'other' */}
            {reason === "other" && (
              <Textarea
                id="report-other"
                label="Describe the issue"
                placeholder="Tell us what's wrong…"
                value={otherText}
                onChange={(v) => {
                  setOtherText(v);
                  if (v.trim())
                    setErrors((prev) => ({ ...prev, otherText: undefined }));
                }}
                error={errors.otherText}
                required
                rows={3}
              />
            )}

            {/* Optional extra details */}
            <Textarea
              id="report-details"
              label="Additional details (optional)"
              placeholder="Question numbers, specific wording, or any other context that helps our team review faster…"
              value={details}
              onChange={setDetails}
              rows={3}
            />

            <p className="text-xs text-text-soft leading-relaxed">
              Reports are reviewed within 48 hours. Submitting false reports may
              affect your account standing.
            </p>
          </div>

          {/* Sticky footer */}
          <div className="px-5 pb-5 sm:pb-5 pt-3 border-t border-border/40 flex gap-2.5 shrink-0 bg-cream">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="md"
              className="flex-1 bg-danger! text-cream! hover:bg-danger/90!"
              isLoading={submitting}
            >
              {!submitting && <Flag className="w-4 h-4" />}
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
