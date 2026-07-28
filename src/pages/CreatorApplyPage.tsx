/**
 * /creator/apply — Become a Creator application page.
 *
 * Renders one of four states based on the current user's application:
 *   A  No application yet          → show the form
 *   B  Application pending          → status card (clock / amber)
 *   C  Application rejected         → status card (muted / terracotta) + re-apply
 *   D  Already approved creator     → redirect card to /creator dashboard
 *
 * A dev-only state switcher (inline, not the global role switcher) lets
 * you inject pending / rejected / no-app states for user_001 without
 * touching actual profile data.
 */
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  XCircle,
  CheckCircle2,
  LayoutDashboard,
  ArrowRight,
  RotateCcw,
  Terminal,
  ChevronDown,
  BadgeCheck,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  getApplicationByUserId,
  addApplication,
  updateApplicationStatus,
  type CreatorApplication,
  type ApplicationStatus,
} from "../mock";

// ─── Shared input style (mirrors Form.tsx BASE_INPUT) ─────────────────────────

const BASE_INPUT =
  "w-full h-12 px-4 rounded-xl text-sm bg-cream text-text placeholder:text-muted/70 border border-border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

const BASE_TEXTAREA =
  "w-full px-4 py-3 rounded-xl text-sm bg-cream text-text placeholder:text-muted/70 border border-border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150 resize-none";

const ERROR_SUFFIX =
  " border-danger/60 bg-danger-bg/30 focus:ring-danger/30 focus:border-danger";

// ─── Form field helpers ────────────────────────────────────────────────────────

function FormTextarea({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        className={BASE_TEXTAREA + (error ? ERROR_SUFFIX : "")}
      />
    </FieldWrapper>
  );
}

function FormInput({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={BASE_INPUT + (error ? ERROR_SUFFIX : "")}
      />
    </FieldWrapper>
  );
}

// ─── Dev state switcher (inline, apply-page only) ─────────────────────────────

type DevAppState = "none" | "pending" | "rejected" | "approved";

function DevAppSwitcher({
  currentState,
  onChange,
}: {
  currentState: DevAppState;
  onChange: (s: DevAppState) => void;
}) {
  const [open, setOpen] = useState(false);

  const OPTIONS: { value: DevAppState; label: string }[] = [
    { value: "none", label: "No application" },
    { value: "pending", label: "Pending review" },
    { value: "rejected", label: "Rejected" },
    { value: "approved", label: "Approved creator" },
  ];

  const current = OPTIONS.find((o) => o.value === currentState)!;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-3 pr-3 h-9 rounded-xl bg-cream border border-border shadow-soft hover:shadow-elevated transition-all text-xs font-heading font-semibold text-text-soft"
      >
        <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="hidden sm:inline">Dev:</span>
        <span className="text-text">{current.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-11 right-0 z-50 w-52 rounded-2xl bg-cream border border-border shadow-elevated p-1.5">
          <p className="px-3 pt-1.5 pb-2 text-[10px] font-heading font-semibold uppercase tracking-wider text-muted">
            Simulate application state
          </p>
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-heading font-medium transition-colors ${
                currentState === o.value
                  ? "bg-primary/10 text-primary"
                  : "text-text-soft hover:bg-surface/60 hover:text-text"
              }`}
            >
              {currentState === o.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
              {currentState !== o.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
              )}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status cards ─────────────────────────────────────────────────────────────

function PendingCard({ submittedAt }: { submittedAt: string }) {
  const date = new Date(submittedAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start gap-5 py-2">
        <div className="h-14 w-14 shrink-0 rounded-3xl bg-warning-bg text-warning flex items-center justify-center shadow-soft">
          <Clock className="w-7 h-7" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <Badge variant="warning" size="sm" dot className="mb-3">
            Under review
          </Badge>
          <h2 className="font-heading font-bold text-xl text-text leading-tight">
            Application under review
          </h2>
          <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-lg">
            We&apos;ve received your application and our team is reviewing it.
            This usually takes a few days. We&apos;ll notify you once a decision
            has been made.
          </p>
          <p className="mt-3 text-xs text-muted font-heading">
            Submitted on {date}
          </p>
        </div>
      </div>
    </Card>
  );
}

function RejectedCard({
  notes,
  onReApply,
}: {
  notes?: string;
  onReApply: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start gap-5 py-2">
        <div className="h-14 w-14 shrink-0 rounded-3xl bg-danger-bg text-danger flex items-center justify-center shadow-soft">
          <XCircle className="w-7 h-7" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <Badge variant="danger" size="sm" dot className="mb-3">
            Not approved
          </Badge>
          <h2 className="font-heading font-bold text-xl text-text leading-tight">
            Application not approved this time
          </h2>
          <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-lg">
            Unfortunately your application wasn&apos;t approved in this round.
            You&apos;re welcome to strengthen your submission and reapply — many
            creators are approved on their second attempt.
          </p>
          {notes && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-surface/60 border border-border/50">
              <p className="text-xs font-heading font-semibold text-text-soft uppercase tracking-wider mb-1">
                Reviewer feedback
              </p>
              <p className="text-sm text-text leading-relaxed">{notes}</p>
            </div>
          )}
          <div className="mt-5">
            <Button variant="primary" size="md" onClick={onReApply}>
              <RotateCcw className="w-4 h-4" />
              Re-apply
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ApprovedCard() {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row items-start gap-5 py-2">
        <div className="h-14 w-14 shrink-0 rounded-3xl bg-success-bg text-success flex items-center justify-center shadow-soft">
          <BadgeCheck className="w-7 h-7" strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0">
          <Badge variant="success" size="sm" dot className="mb-3">
            Approved creator
          </Badge>
          <h2 className="font-heading font-bold text-xl text-text leading-tight">
            You&apos;re already an approved creator
          </h2>
          <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-lg">
            Your creator account is active. Head to your Creator Dashboard to
            create quizzes, track earnings, and manage payouts.
          </p>
          <div className="mt-5">
            <Link to="/creator">
              <Button variant="primary" size="md">
                <LayoutDashboard className="w-4 h-4" />
                Creator Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Application form (State A) ───────────────────────────────────────────────

interface FormValues {
  courses: string;
  background: string;
  quiz_plans: string;
  links: string;
  agreed: boolean;
}

interface FormErrors {
  courses?: string;
  background?: string;
  quiz_plans?: string;
  agreed?: string;
}

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (!v.courses.trim())
    e.courses = "Please list at least one course or subject.";
  if (v.background.trim().length < 20)
    e.background = "Please provide a bit more detail (at least 20 characters).";
  if (v.quiz_plans.trim().length < 20)
    e.quiz_plans = "Please describe your plans in a bit more detail.";
  if (!v.agreed)
    e.agreed = "You must confirm your content is original before submitting.";
  return e;
}

function ApplicationForm({
  prefill,
  userId,
  onSubmitted,
}: {
  prefill?: Partial<FormValues>;
  userId: string;
  onSubmitted: (app: CreatorApplication) => void;
}) {
  const [values, setValues] = useState<FormValues>({
    courses: prefill?.courses ?? "",
    background: prefill?.background ?? "",
    quiz_plans: prefill?.quiz_plans ?? "",
    links: prefill?.links ?? "",
    agreed: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((p) => ({ ...p, [key]: val }));
    if (errors[key as keyof FormErrors]) {
      setErrors((p) => ({ ...p, [key]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const app: CreatorApplication = {
      id: "app_" + Math.random().toString(36).slice(2, 10),
      user_id: userId,
      status: "pending",
      courses: values.courses.trim(),
      background: values.background.trim(),
      quiz_plans: values.quiz_plans.trim(),
      links: values.links.trim() || undefined,
      submitted_at: new Date().toISOString(),
    };

    addApplication(app);
    setSubmitting(false);
    onSubmitted(app);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Revenue pitch card */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-heading font-bold text-base text-text leading-tight">
              Earn from quizzes you already know
            </h3>
            <p className="text-sm text-text-soft leading-relaxed">
              You keep{" "}
              <span className="font-heading font-bold text-primary">65%</span>{" "}
              of every sale. Set your own price between{" "}
              <span className="font-semibold text-text">₦500 – ₦5,000</span> per
              quiz. Approval is required before you can publish — we review
              every application personally.
            </p>
          </div>
        </div>
      </Card>

      {/* Form fields card */}
      <Card>
        <div className="space-y-5">
          <div>
            <h2 className="font-heading font-bold text-base text-text leading-tight">
              Your application
            </h2>
            <p className="text-sm text-text-soft mt-0.5">
              Take your time — a thoughtful application gets approved faster.
            </p>
          </div>

          <div className="border-t border-border/40 pt-5 space-y-5">
            <FormInput
              id="apply-courses"
              label="Which course(s) are you strong in?"
              placeholder="e.g. JAMB Use of English, WAEC Mathematics, Physics"
              hint="Separate multiple subjects with commas."
              value={values.courses}
              onChange={(v) => set("courses", v)}
              error={errors.courses}
              required
            />

            <FormTextarea
              id="apply-background"
              label="Tell us about your background"
              placeholder="Are you a student, graduate, or tutor in this subject? How long have you been working with it?"
              hint="The more context you give, the easier it is for our team to approve you quickly."
              value={values.background}
              onChange={(v) => set("background", v)}
              error={errors.background}
              rows={4}
              required
            />

            <FormTextarea
              id="apply-plans"
              label="What kind of quizzes do you plan to create?"
              placeholder="e.g. Full JAMB mock exams, topic-focused drills, WAEC past question-style sets…"
              value={values.quiz_plans}
              onChange={(v) => set("quiz_plans", v)}
              error={errors.quiz_plans}
              rows={4}
              required
            />

            <FormInput
              id="apply-links"
              label="Any relevant links? (optional)"
              placeholder="Portfolio, social profile, teaching page, past materials…"
              hint="Not required, but a link to previous work speeds up review."
              value={values.links}
              onChange={(v) => set("links", v)}
            />

            {/* Copyright checkbox */}
            <div className="space-y-1.5">
              <label
                htmlFor="apply-agree"
                className={`flex items-start gap-3 cursor-pointer group rounded-2xl border p-4 transition-colors ${
                  values.agreed
                    ? "border-primary/40 bg-primary/5"
                    : errors.agreed
                      ? "border-danger/40 bg-danger-bg/20"
                      : "border-border/60 bg-surface/30 hover:border-border hover:bg-surface/50"
                }`}
              >
                {/* Custom checkbox */}
                <div
                  className={`mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                    values.agreed
                      ? "bg-primary border-primary"
                      : errors.agreed
                        ? "border-danger bg-danger-bg/30"
                        : "border-border group-hover:border-primary/50"
                  }`}
                >
                  {values.agreed && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-cream"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <input
                  id="apply-agree"
                  type="checkbox"
                  checked={values.agreed}
                  onChange={(e) => set("agreed", e.target.checked)}
                  className="sr-only"
                />
                <p className="text-sm text-text leading-relaxed">
                  I confirm that the quizzes I create will be{" "}
                  <span className="font-semibold">original content</span>{" "}
                  written by me, and will not be copied or reproduced from
                  copyrighted past examination papers or third-party materials.
                </p>
              </label>
              {errors.agreed && (
                <p className="text-xs text-danger flex items-center gap-1.5 px-1">
                  <span className="w-1 h-1 rounded-full bg-danger inline-block shrink-0" />
                  {errors.agreed}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={submitting}
        >
          {!submitting && <Sparkles className="w-5 h-5" />}
          Submit Application
        </Button>
      </div>
    </form>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function CreatorApplyPage() {
  const { currentUser } = useAuth();

  // ── Resolve real application from mock store ───────────────────────────────
  const realApp = getApplicationByUserId(currentUser.id);

  // ── Dev-only state override ────────────────────────────────────────────────
  // Maps to the four UI states; "none" means fall back to real data.
  const [devState, setDevState] = useState<DevAppState>("none");

  // Local app override (set after a live submit or dev switcher change)
  const [localApp, setLocalApp] = useState<CreatorApplication | null>(null);

  // Whether to show the re-apply form after a rejection
  const [reApplying, setReApplying] = useState(false);

  const [toast, showToast, dismissToast] = useToast();

  // ── Determine effective application state ──────────────────────────────────
  // Priority: devState override > localApp > realApp > profile flag
  function effectiveStatus(): ApplicationStatus | "none" {
    if (devState !== "none") {
      if (devState === "none") return "none";
      return devState as ApplicationStatus;
    }
    if (localApp) return localApp.status;
    if (realApp) return realApp.status;
    if (currentUser.is_approved_creator) return "approved";
    return "none";
  }

  function effectiveApp(): CreatorApplication | null {
    if (devState !== "none") {
      // Return a synthetic app for the dev state
      if (devState === "pending") {
        return {
          id: "dev_app",
          user_id: currentUser.id,
          status: "pending",
          courses: "Mathematics, Physics",
          background: "Dev preview — pending state",
          quiz_plans: "Dev preview",
          submitted_at: new Date().toISOString(),
        };
      }
      if (devState === "rejected") {
        return {
          id: "dev_app",
          user_id: currentUser.id,
          status: "rejected",
          courses: "Mathematics",
          background: "Dev preview — rejected state",
          quiz_plans: "Dev preview",
          notes:
            "Please provide more detail on your subject background and teaching experience.",
          submitted_at: new Date().toISOString(),
        };
      }
      if (devState === "approved") {
        return {
          id: "dev_app",
          user_id: currentUser.id,
          status: "approved",
          courses: "English",
          background: "Dev preview",
          quiz_plans: "Dev preview",
          submitted_at: new Date().toISOString(),
        };
      }
      return null;
    }
    return localApp ?? realApp ?? null;
  }

  const status = effectiveStatus();
  const app = effectiveApp();

  function handleDevChange(s: DevAppState) {
    setDevState(s);
    setReApplying(false);
    setLocalApp(null);
  }

  function handleSubmitted(submitted: CreatorApplication) {
    setLocalApp(submitted);
    setDevState("none");
    setReApplying(false);
    showToast({ message: "Application submitted! We'll be in touch soon." });
  }

  function handleReApply() {
    setReApplying(true);
    // Clear the dev override so the form renders cleanly
    if (devState === "rejected") setDevState("none");
  }

  // Pre-fill values from the previous rejected application
  const prefill =
    (status === "rejected" || reApplying) && app
      ? {
          courses: app.courses,
          background: app.background,
          quiz_plans: app.quiz_plans,
          links: app.links,
        }
      : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────
  const showForm = status === "none" || reApplying;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer>
        <div className="max-w-2xl space-y-5">
          {/* ── Page heading + dev switcher ── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="secondary" size="sm" dot className="mb-2">
                <Sparkles className="w-3 h-3" />
                Creator programme
              </Badge>
              <h1 className="font-heading font-bold text-2xl lg:text-[28px] text-text tracking-tight leading-tight">
                Become a Creator
              </h1>
              <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-lg">
                Share your expertise and earn from every learner who benefits
                from your quizzes.
              </p>
            </div>

            {/* Dev-only tool */}
            <div className="shrink-0 flex flex-col items-end gap-1 pt-1">
              <DevAppSwitcher
                currentState={devState}
                onChange={handleDevChange}
              />
              <p className="text-[10px] text-muted font-heading">
                Dev preview only
              </p>
            </div>
          </div>

          {/* ── State-driven content ── */}
          {showForm && (
            <ApplicationForm
              key={reApplying ? "reapply" : "fresh"}
              prefill={prefill}
              userId={currentUser.id}
              onSubmitted={handleSubmitted}
            />
          )}

          {!showForm && status === "pending" && app && (
            <PendingCard submittedAt={app.submitted_at} />
          )}

          {!showForm && status === "rejected" && app && !reApplying && (
            <RejectedCard notes={app.notes} onReApply={handleReApply} />
          )}

          {!showForm && status === "approved" && <ApprovedCard />}
        </div>
      </PageContainer>
    </>
  );
}
