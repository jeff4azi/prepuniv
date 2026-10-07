import { useState, useEffect } from "react";
import { Star, X, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";

const STORAGE_KEY = "prepuniv_platform_review_prompted";

export function PlatformReviewModal() {
  const { currentUser, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !currentUser.id) return;

    // Check if already prompted/dismissed
    const alreadyPrompted = localStorage.getItem(STORAGE_KEY);
    if (alreadyPrompted) return;

    // Check if user has >= 3 completed quiz payments
    let cancelled = false;
    (async () => {
      const { count, error } = await supabase
        .from("wallet_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("type", "quiz_payment")
        .eq("status", "completed");

      if (cancelled || error || (count ?? 0) < 3) return;

      // Also verify they haven't already submitted a platform review
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", currentUser.id)
        .eq("review_target_type", "platform")
        .maybeSingle();

      if (cancelled) return;
      if (existing) {
        localStorage.setItem(STORAGE_KEY, "true");
        return;
      }

      // Eligible & not yet reviewed: trigger modal
      setIsOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, currentUser.id]);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    const { error, status } = await apiFetch("/api/reviews", {
      method: "POST",
      body: {
        target_type: "platform",
        rating,
        review_text: text ? text.slice(0, 140) : null,
      },
    });
    setSubmitting(false);

    if (!error || status === 201 || status === 200 || status === 409) {
      setSubmitted(true);
      localStorage.setItem(STORAGE_KEY, "true");
      setTimeout(() => {
        setIsOpen(false);
      }, 2400);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        <Card
          padded={false}
          className="relative rounded-t-3xl sm:rounded-3xl p-6 bg-cream border-primary/20 shadow-elevated"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-text hover:bg-surface/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-success-bg text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text">
                Thank you for your feedback!
              </h3>
              <p className="text-xs text-text-soft max-w-xs mx-auto leading-relaxed">
                Your review helps other Nigerian students and makes PrepUniv better for everyone.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-text leading-tight">
                    Quick question!
                  </h3>
                  <p className="text-xs text-text-soft">
                    How is your PrepUniv experience so far?
                  </p>
                </div>
              </div>

              {/* Star selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    id={`platform-review-star-${s}`}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 rounded-xl transition-transform hover:scale-115 active:scale-95"
                    aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        s <= (hover || rating)
                          ? "text-warning fill-warning"
                          : "text-border fill-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <p className="text-center text-xs font-heading font-semibold text-text">
                  {["Poor", "Fair", "Good", "Great!", "Excellent!"][rating - 1]}
                </p>
              )}

              {/* Optional short blurb */}
              {rating > 0 && (
                <div className="space-y-1">
                  <textarea
                    id="platform-review-text"
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 140))}
                    placeholder="Tell us what you love or what we could improve (optional)"
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-border/60 bg-surface/50 px-3.5 py-2.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  <div className="flex justify-end">
                    <span className="text-[10px] text-muted">{text.length}/140</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="flex-1 text-muted"
                >
                  Maybe later
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={rating === 0}
                  isLoading={submitting}
                  onClick={handleSubmit}
                  className="flex-1"
                  id="platform-review-submit"
                >
                  {!submitting && <Send className="w-3.5 h-3.5" />}
                  Submit feedback
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
