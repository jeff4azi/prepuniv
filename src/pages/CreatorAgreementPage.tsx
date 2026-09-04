/**
 * CreatorAgreementPage — /creator/agreement
 *
 * Two modes:
 *  - "accept"   — reached from the CreatorApply submission flow;
 *                 shows the sticky acceptance bar.
 *  - "readonly" — visited directly by an already-accepted creator;
 *                 shows an accepted-on banner, no action needed.
 */
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { CheckCircle2, Sparkles, Info, ArrowLeft } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

// ─── Document content ─────────────────────────────────────────────────────────

function AgreementContent() {
  return (
    <div className="prose max-w-none text-base leading-relaxed text-text space-y-8">
      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          1. Purpose
        </h2>
        <p className="text-text-soft leading-relaxed">
          This Agreement governs your participation as a Creator on PrepUniv, in
          addition to (not instead of) the general{" "}
          <Link
            to="/terms"
            className="text-primary font-semibold hover:underline"
          >
            Terms of Service
          </Link>
          . By accepting, you confirm you understand and agree to the terms
          below.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          2. Revenue Share
        </h2>
        <p className="text-text-soft leading-relaxed">
          You earn <strong className="text-text">65%</strong> of every payment
          made by a Learner to attempt one of your quizzes. PrepUniv retains{" "}
          <strong className="text-text">35%</strong> as a platform fee. This
          split applies automatically to every quiz payment and is not
          negotiable per-quiz.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          3. Pricing
        </h2>
        <p className="text-text-soft leading-relaxed">
          You set your own price per quiz, within the platform-defined range of{" "}
          <strong className="text-text">₦50–₦500</strong>. PrepUniv may adjust
          this range in the future with notice.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          4. Content Ownership & Originality
        </h2>
        <p className="text-text-soft leading-relaxed">
          You retain ownership of the quiz content you create. However, you're
          responsible for ensuring it doesn't infringe on anyone else's
          copyright — in particular, do not upload verbatim past exam questions
          belonging to an examining body (e.g. JAMB, WAEC, or a university's own
          past papers) without the right to reuse them. Content should be
          original or your own clear derivative work. PrepUniv may remove
          content and may revoke Creator status for violations of this section.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          5. Editing Published Quizzes
        </h2>
        <p className="text-text-soft leading-relaxed">
          You may edit a published quiz at any time, and edits take effect
          immediately for future attempts. Learners who attempted the quiz
          before your edit will still see their original results and answer
          review exactly as the quiz was when they took it — their past attempts
          are not affected by later edits.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          6. No Refunds Applies to Your Quizzes Too
        </h2>
        <p className="text-text-soft leading-relaxed">
          Learner payments for your quizzes are final, per PrepUniv's no-refund
          policy. If a Learner reports a flawed question, you're expected to fix
          it going forward rather than issue any refund (PrepUniv doesn't
          support Creator-issued refunds).
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          7. Payouts
        </h2>
        <ul className="list-disc list-outside pl-5 space-y-2 text-text-soft leading-relaxed">
          <li>
            Your earnings accumulate as platform credit until you request a
            payout.
          </li>
          <li>
            Payouts require a minimum balance threshold and are subject to a
            request frequency limit, both shown in-app and subject to change
            with notice.
          </li>
          <li>
            Payouts are sent to the bank account you provide and verify in-app.
            You're responsible for keeping these details accurate — PrepUniv is
            not liable for a failed or misdirected transfer caused by incorrect
            bank details you supplied.
          </li>
          <li>
            Payout requests are reviewed and approved manually; approval
            timelines aren't guaranteed.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          8. Reports & Content Removal
        </h2>
        <p className="text-text-soft leading-relaxed">
          Learners can report your quizzes. PrepUniv reviews reports and may
          unpublish a quiz that violates these terms or the general Terms of
          Service, with or without prior notice to you. Existing Learners who
          already purchased an unpublished quiz retain access to it.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          9. Revocation of Creator Status
        </h2>
        <p className="text-text-soft leading-relaxed">
          PrepUniv may revoke your Creator status for repeated content
          violations, fraud, or abuse of the platform, at our discretion.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-text mb-2">
          10. Changes to This Agreement
        </h2>
        <p className="text-text-soft leading-relaxed">
          We may update this Agreement from time to time. Continued use of
          Creator features after an update means you accept the revised terms.
        </p>
      </section>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreatorAgreementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  usePageTitle("Creator Agreement");
  const { currentUser, acceptAgreement } = useAuth();

  // ?mode=accept → called from the apply flow; show sticky acceptance bar
  const isAcceptMode = searchParams.get("mode") === "accept";

  const acceptedAt = currentUser.agreement_accepted_at;
  const formattedDate = acceptedAt
    ? new Date(acceptedAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    if (!checked) return;
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 500));
    acceptAgreement();
    setAccepting(false);
    // Return to the apply page — the application form will now submit
    navigate("/creator/apply?agreed=1", { replace: true });
  }

  return (
    <>
      <PageContainer className="!max-w-[740px] pb-32">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-heading font-medium text-text-soft hover:text-text transition-colors mb-5 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" size="sm" dot>
                <Sparkles className="w-3 h-3" />
                Creator programme
              </Badge>
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-medium text-primary tracking-tight leading-tight">
              Creator Agreement
            </h1>
            <p className="mt-2 text-sm text-text-soft">
              Last updated: August 10, 2026
            </p>
          </div>

          {/* Read-only accepted banner */}
          {!isAcceptMode && formattedDate && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-success-bg border border-success/20">
              <CheckCircle2
                className="w-5 h-5 text-success shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <p className="text-sm text-success font-heading font-medium leading-relaxed">
                You accepted this agreement on <strong>{formattedDate}</strong>.
                This is for your reference — no action needed.
              </p>
            </div>
          )}

          {/* Accept-mode intro note */}
          {isAcceptMode && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-primary/5 border border-primary/20">
              <Info
                className="w-5 h-5 text-primary shrink-0 mt-0.5"
                strokeWidth={2}
              />
              <p className="text-sm text-primary font-heading font-medium leading-relaxed">
                Please read the agreement below before submitting your
                application. You'll need to accept it to continue.
              </p>
            </div>
          )}

          {/* Document body */}
          <AgreementContent />
        </div>
      </PageContainer>

      {/* Sticky acceptance bar — only in accept mode and not yet accepted */}
      {isAcceptMode && (
        <div className="fixed bottom-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 lg:bottom-0 lg:left-65">
          <div className="max-w-[740px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Checkbox */}
            <label
              htmlFor="agree-checkbox"
              className="flex items-start gap-3 cursor-pointer flex-1 group"
            >
              <div
                className={`mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                  checked
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary/50"
                }`}
              >
                {checked && (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-cream"
                    strokeWidth={2.5}
                  />
                )}
              </div>
              <input
                id="agree-checkbox"
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <p className="text-sm text-text leading-snug">
                I have read and agree to the{" "}
                <span className="font-heading font-semibold text-primary">
                  Creator Agreement
                </span>
              </p>
            </label>

            <Button
              variant="primary"
              size="md"
              disabled={!checked || accepting}
              isLoading={accepting}
              onClick={handleAccept}
              className="shrink-0 sm:min-w-[140px]"
            >
              {accepting ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
