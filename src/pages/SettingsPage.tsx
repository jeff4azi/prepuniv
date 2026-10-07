import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { User, Building2, LogOut, Bell, ChevronRight, Star, Pencil, Trash2, MessageSquare } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TextInput, validateFullName } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { AvatarUpload } from "../components/AvatarUpload";
import { useAuth } from "../context/AuthContext";
import { getBankName } from "../lib/banks";
import { usePushSubscription } from "../hooks/usePushSubscription";
import { useNavBadges, formatBadgeCount } from "../hooks/useNavBadges";
import { apiFetch } from "../lib/api";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-base text-text leading-tight">
            {title}
          </h2>
          <p className="text-sm text-text-soft mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="border-t border-border/40 pt-5 space-y-4">{children}</div>
    </Card>
  );
}

// ─── Profile section ──────────────────────────────────────────────────────────

function ProfileSection({
  onSaved,
  onError,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const { currentUser, updateProfilePatch } = useAuth();
  const isCreator =
    currentUser.is_approved_creator || currentUser.role === "creator";

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [bio, setBio] = useState(currentUser.bio ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateFullName(fullName);
    setNameError(err);
    if (err) return;

    setSaving(true);
    const { error } = await updateProfilePatch({
      full_name: fullName.trim(),
      ...(isCreator ? { bio: bio.trim() } : {}),
    });
    setSaving(false);

    if (error) {
      onError(error.message || "Failed to update profile.");
    } else {
      onSaved();
    }
  }

  return (
    <SettingsSection
      icon={User}
      title="Profile"
      description="Update your display name and creator bio. Email changes require contacting support."
    >
      <div className="flex items-center gap-4 pb-1">
        <AvatarUpload onError={onError} onSuccess={() => onSaved()} />
        <p className="text-xs text-muted leading-relaxed">
          Tap the camera icon to upload a new photo. JPG, PNG, or WEBP — it'll
          be resized and compressed automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextInput
          id="settings-name"
          label="Full Name"
          placeholder="e.g. Adebayo Johnson"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (nameError) setNameError(validateFullName(e.target.value));
          }}
          error={nameError ?? undefined}
          autoComplete="name"
        />

        {isCreator && (
          <div className="w-full">
            <label
              htmlFor="settings-bio"
              className="block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight"
            >
              Creator Bio
            </label>
            <textarea
              id="settings-bio"
              rows={3}
              placeholder="Tell students about yourself, your background, and your courses..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-cream border border-border/60 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
            />
            <p className="mt-1 text-xs text-muted leading-snug">
              Shown on your public creator profile and quizzes.
            </p>
          </div>
        )}

        <div className="w-full">
          <label className="block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight">
            Email address
          </label>
          <div className="w-full h-12 sm:h-12.5 px-4 flex items-center rounded-xl bg-surface/50 border border-border/60 text-sm text-muted cursor-not-allowed select-none">
            {currentUser.email}
          </div>
          <p className="mt-1.5 text-xs text-muted leading-snug">
            Contact{" "}
            <a
              href="mailto:support@prepuniv.com"
              className="font-semibold text-primary hover:underline"
            >
              support@prepuniv.com
            </a>{" "}
            to change your email address.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button type="submit" variant="primary" size="md" isLoading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </SettingsSection>
  );
}

// ─── Creator bank details section ─────────────────────────────────────────────

function BankDetailsSection() {
  const { currentUser, resolvedAccountName } = useAuth();
  const hasBankDetails =
    !!currentUser.bank_account_number && !!currentUser.bank_code;

  const bankDisplayName =
    currentUser.bank_name ||
    (currentUser.bank_code ? getBankName(currentUser.bank_code) : "") ||
    currentUser.bank_code;

  const accountName = currentUser.bank_account_name || resolvedAccountName;

  return (
    <SettingsSection
      icon={Building2}
      title="Creator Bank Account"
      description="Your payout destination. Manage your bank details from the Payouts page."
    >
      {hasBankDetails ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-surface/50 border border-border/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted font-heading font-medium">
                Bank Name
              </span>
              <span className="text-[13px] font-heading font-semibold text-text">
                {bankDisplayName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted font-heading font-medium">
                Account Number
              </span>
              <span className="text-[13px] font-mono font-semibold text-text tracking-wider">
                {"•••• •••• " +
                  (currentUser.bank_account_number ?? "").slice(-4)}
              </span>
            </div>
            {accountName && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted font-heading font-medium">
                  Account Name
                </span>
                <span className="text-[13px] font-heading font-semibold text-success">
                  {accountName}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/creator/payouts">
              <Button variant="outline" size="sm">
                Manage bank account in Payouts
              </Button>
            </Link>
            <Link to="/creator/agreement">
              <Button variant="ghost" size="sm" className="text-muted text-xs">
                View Creator Agreement
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-soft leading-relaxed">
            No bank account on file yet. Add one from the Payouts page to enable
            withdrawals.
          </p>
          <Link to="/creator/payouts">
            <Button variant="primary" size="sm">
              <Building2 className="w-4 h-4" />
              Add bank account
            </Button>
          </Link>
        </div>
      )}
    </SettingsSection>
  );
}

// ─── Notifications section ──────────────────────────────────────────────────────

function NotificationsSection() {
  const { currentUser } = useAuth();
  const { pathname } = useLocation();
  const { permission, subscribed, loading, enable, disable } =
    usePushSubscription();
  const [, showToast] = useToast();
  const badges = useNavBadges({
    userId: currentUser.id,
    role: currentUser.role,
    isApprovedCreator: currentUser.is_approved_creator,
    pathname,
  });

  const unreadCount = badges.unreadNotifications;
  const isEnabled = permission === "granted" && subscribed;
  const isBlocked = permission === "denied";

  async function handleEnable() {
    const res = await enable();
    if (!res.ok) {
      showToast({
        message: res.error || "Failed to enable notifications.",
        variant: "danger",
      });
    } else {
      showToast({ message: "Push notifications enabled." });
    }
  }

  async function handleDisable() {
    const res = await disable();
    if (!res.ok) {
      showToast({
        message: res.error || "Failed to disable notifications.",
        variant: "danger",
      });
    } else {
      showToast({ message: "Push notifications disabled." });
    }
  }

  return (
    <SettingsSection
      icon={Bell}
      title="Notifications"
      description="Manage how you receive alerts and view your notification history."
    >
      <Link
        to="/notifications"
        className="inline-flex items-center justify-between h-11 w-full px-3 rounded-2xl bg-surface/50 hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="text-sm font-heading font-medium text-text">
            View all notifications
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[11px] font-bold bg-warning text-cream">
              {formatBadgeCount(unreadCount)}
            </span>
          )}
          <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
        </div>
      </Link>

      <div className="border-t border-border/40 pt-4">
        <p className="text-[12px] font-heading font-semibold text-muted uppercase tracking-wider mb-3">
          Push notifications
        </p>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEnabled ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-heading font-medium text-success">
                  Enabled
                </span>
              </div>
            ) : isBlocked ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  <span className="text-sm font-heading font-medium text-danger">
                    Blocked by browser
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  To re-enable, open your browser settings and allow
                  notifications for this site.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted/50" />
                <span className="text-sm font-heading font-medium text-muted">
                  Disabled
                </span>
              </div>
            )}
          </div>
          {!isBlocked &&
            (isEnabled ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisable}
                disabled={loading}
              >
                Disable
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnable}
                disabled={loading}
              >
                Enable
              </Button>
            ))}
        </div>
      </div>
    </SettingsSection>
  );
}

// ─── Danger zone section ──────────────────────────────────────────────────────

function DangerSection() {
  const { logOut } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  function handleLogOut() {
    logOut();
    navigate("/");
  }

  return (
    <Card className="border-danger/20 bg-danger-bg/10">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-2xl bg-danger-bg text-danger flex items-center justify-center shrink-0">
          <LogOut className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-base text-text leading-tight">
            Sign out
          </h2>
          <p className="text-sm text-text-soft mt-0.5 leading-relaxed">
            You'll need to log back in to access your library and history.
          </p>
        </div>
      </div>

      <div className="border-t border-danger/15 pt-5">
        {confirming ? (
          <div className="flex flex-col sm:flex-row gap-2.5">
            <p className="flex-1 text-sm text-text-soft leading-relaxed self-center">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="bg-danger! text-cream! hover:bg-danger/90!"
                onClick={handleLogOut}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="danger"
            size="md"
            className="bg-danger-bg! text-danger! hover:bg-danger/20! border border-danger/30"
            onClick={() => setConfirming(true)}
          >
            <LogOut className="w-4 h-4" />
            Log out of PrepUniv
          </Button>
        )}
      </div>
    </Card>
  );
}

// ─── My Reviews section ───────────────────────────────────────────────────────

type MyReview = {
  id: string;
  review_target_type: "quiz" | "creator" | "platform";
  target_quiz_id: string | null;
  target_creator_id: string | null;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  quizzes?: { title: string } | null;
  creator?: { full_name: string } | null;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? "text-warning fill-warning" : "text-border fill-transparent"
          }`}
        />
      ))}
    </span>
  );
}

function MyReviewsSection({
  onToast,
}: {
  onToast: (msg: string, variant?: "danger" | "success") => void;
}) {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<MyReview[]>("/api/reviews/mine").then(({ data }) => {
      if (!cancelled) {
        setReviews(data ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  function startEdit(r: MyReview) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditText(r.review_text ?? "");
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const { error } = await apiFetch(`/api/reviews/${id}`, {
      method: "PATCH",
      body: { rating: editRating, review_text: editText || null },
    });
    setSaving(false);
    if (error) {
      onToast(error, "danger");
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, rating: editRating, review_text: editText || null } : r
        )
      );
      setEditingId(null);
      onToast("Review updated.");
    }
  }

  async function deleteReview(id: string) {
    setDeletingId(id);
    const { error } = await apiFetch(`/api/reviews/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (error) {
      onToast(error, "danger");
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      onToast("Review deleted.");
    }
  }

  function targetLabel(r: MyReview) {
    if (r.review_target_type === "quiz") return r.quizzes?.title ?? "Quiz";
    if (r.review_target_type === "creator") return r.creator?.full_name ?? "Creator";
    return "PrepUniv Platform";
  }

  return (
    <SettingsSection
      icon={MessageSquare}
      title="My Reviews"
      description="Ratings you've left for quizzes, creators, or the platform."
    >
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-surface" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-text-soft text-center py-6">
          You haven't left any reviews yet. After completing a quiz, you'll see a rating prompt on the results page.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border/50 bg-surface/30 px-4 py-3 space-y-2"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted font-heading uppercase tracking-wide mb-0.5">
                    {r.review_target_type}
                  </p>
                  <p className="text-sm font-heading font-semibold text-text leading-snug truncate">
                    {targetLabel(r)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    id={`edit-review-${r.id}`}
                    onClick={() =>
                      editingId === r.id ? setEditingId(null) : startEdit(r)
                    }
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary font-heading font-semibold transition-colors p-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    id={`delete-review-${r.id}`}
                    disabled={deletingId === r.id}
                    onClick={() => deleteReview(r.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger font-heading font-semibold transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Edit mode */}
              {editingId === r.id ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditRating(s)}
                        className="p-0.5 rounded transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            s <= editRating
                              ? "text-warning fill-warning"
                              : "text-border fill-transparent"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value.slice(0, 280))}
                    rows={2}
                    placeholder="Update your review... (optional)"
                    className="w-full resize-none rounded-xl border border-border/60 bg-cream px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={saving}
                      onClick={() => saveEdit(r.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <StarRow rating={r.rating} />
                  {r.review_text && (
                    <p className="text-xs text-text-soft truncate">{r.review_text}</p>
                  )}
                  {!r.is_approved && (
                    <span className="text-[10px] text-muted font-heading bg-surface px-1.5 py-0.5 rounded-md ml-auto shrink-0">
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { currentUser } = useAuth();

  usePageTitle("Settings");

  const isCreator =
    currentUser.is_approved_creator || currentUser.role === "creator";

  const [toast, showToast, dismissToast] = useToast();

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer
        title="Settings"
        subtitle="Manage your profile, creator bio, and account preferences."
      >
        <div className="space-y-5 max-w-2xl">
          <ProfileSection
            onSaved={() =>
              showToast({ message: "Profile updated successfully." })
            }
            onError={(msg) => showToast({ message: msg, variant: "danger" })}
          />
          {isCreator && <BankDetailsSection />}
          <NotificationsSection />
          <MyReviewsSection
            onToast={(msg, variant) =>
              showToast({ message: msg, variant: variant ?? "success" })
            }
          />
          <DangerSection />
        </div>
      </PageContainer>
    </>
  );
}
