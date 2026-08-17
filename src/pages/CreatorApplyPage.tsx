/**
 * /creator/apply — Become a Creator application page.
 */
import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Clock,
  XCircle,
  LayoutDashboard,
  ArrowRight,
  RotateCcw,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import type { CreatorApplication, ApplicationStatus } from "../types";
import { supabase } from "../lib/supabase";

const BASE_INPUT =
  "w-full h-12 px-4 rounded-xl text-sm bg-cream text-text placeholder:text-muted/70 border border-border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";

const BASE_TEXTAREA =
  "w-full px-4 py-3 rounded-xl text-sm bg-cream text-text placeholder:text-muted/70 border border-border focus:outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150 resize-none";

const ERROR_SUFFIX =
  " border-danger/60 bg-danger-bg/30 focus:ring-danger/30 focus:border-danger";

function FormTextarea({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  error,
  rows = 3,
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
    <FieldWrapper id={id} label={label} hint={hint} error={error}>
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
    <FieldWrapper id={id} label={label} hint={hint} error={error}>
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

function PendingCard({ submittedAt }: { submittedAt: string }) {
  const date = new Date(submittedAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
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

    const { data, error } = await supabase
      .from("creator_applications")
      .insert({
        user_id: userId,
        course_strengths: values.courses.trim(),
        background: values.background.trim(),
        quiz_plans: values.quiz_plans.trim(),
        links: values.links.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    setSubmitting(false);

    if (error || !data) {
      alert("Failed to submit application: " + (error?.message || "Unknown error"));
      return;
    }

    const app: CreatorApplication = {
      id: data.id,
      user_id: data.user_id,
      status: data.status,
      courses: data.course_strengths || values.courses.trim(),
      background: data.background || values.background.trim(),
      quiz_plans: data.quiz_plans || values.quiz_plans.trim(),
      links: data.links || values.links.trim(),
      submitted_at: data.submitted_at || new Date().toISOString(),
    };

    onSubmitted(app);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
              <span className="font-semibold text-text">₦50 – ₦500</span> per
              quiz. Approval is required before you can publish — we review
              every application personally.
            </p>
          </div>
        </div>
      </Card>

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
              placeholder="e.g. CSC 122 Introduction to Programming, MTH 201 Mathematical Methods"
              hint="Separate multiple courses with commas. Use course codes if you know them."
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
              placeholder="e.g. Full-semester question banks for CSC 122, topic-focused drills for MTH 201, past-question-style sets for GST 121…"
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
                  I confirm that I have read and agree to the{" "}
                  <Link
                    to="/creator/agreement"
                    target="_blank"
                    className="font-semibold text-primary hover:underline underline-offset-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Creator Agreement
                  </Link>
                  , including its requirements regarding original content and
                  copyright.
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

export function CreatorApplyPage() {
  const { currentUser } = useAuth();
  const [realApp, setRealApp] = useState<CreatorApplication | null>(null);
  const [localApp, setLocalApp] = useState<CreatorApplication | null>(null);
  const [reApplying, setReApplying] = useState(false);
  const [toast, showToast, dismissToast] = useToast();

  useEffect(() => {
    if (!currentUser?.id) return;
    supabase
      .from("creator_applications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("submitted_at", { ascending: false })
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRealApp({
            id: data.id,
            user_id: data.user_id,
            status: data.status as ApplicationStatus,
            courses: data.course_strengths || "",
            background: data.background || "",
            quiz_plans: data.quiz_plans || "",
            links: data.links || "",
            notes: data.notes || undefined,
            submitted_at: data.submitted_at,
          });
        }
      });
  }, [currentUser?.id]);

  function effectiveStatus(): ApplicationStatus | "none" {
    if (localApp) return localApp.status;
    if (realApp) return realApp.status;
    if (currentUser.is_approved_creator) return "approved";
    return "none";
  }

  function effectiveApp(): CreatorApplication | null {
    return localApp ?? realApp ?? null;
  }

  const status = effectiveStatus();
  const app = effectiveApp();

  function handleSubmitted(submitted: CreatorApplication) {
    setLocalApp(submitted);
    setReApplying(false);
    showToast({ message: "Application submitted! We'll be in touch soon." });
  }

  function handleReApply() {
    setReApplying(true);
  }

  const prefill =
    (status === "rejected" || reApplying) && app
      ? {
          courses: app.courses,
          background: app.background,
          quiz_plans: app.quiz_plans,
          links: app.links,
        }
      : undefined;

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
          <div>
            <Badge variant="secondary" size="sm" dot className="mb-2">
              <Sparkles className="w-3 h-3" />
              Creator programme
            </Badge>
            <h1 className="font-heading font-bold text-2xl lg:text-[28px] text-text tracking-tight leading-tight">
              Become a Creator
            </h1>
            <p className="mt-1.5 text-sm text-text-soft leading-relaxed max-w-lg">
              Share your expertise and earn from every learner who benefits from
              your quizzes.
            </p>
          </div>

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
