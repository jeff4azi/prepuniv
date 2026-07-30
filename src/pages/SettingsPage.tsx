import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Building2, LogOut } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  TextInput,
  PasswordInput,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

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

function ProfileSection({ onSaved }: { onSaved: () => void }) {
  const { currentUser } = useAuth();
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateFullName(fullName);
    setNameError(err);
    if (err) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    // mock update — in a real app this would patch the profile
    setSaving(false);
    onSaved();
  }

  return (
    <SettingsSection
      icon={User}
      title="Profile"
      description="Update your display name. Email changes require contacting support."
    >
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

// ─── Password section ─────────────────────────────────────────────────────────

function PasswordSection({ onSaved }: { onSaved: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{
    current?: string;
    newPw?: string;
    confirm?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!current.trim()) e.current = "Enter your current password";
    const newErr = validatePassword(newPw);
    if (newErr) e.newPw = newErr;
    const matchErr = validatePasswordMatch(newPw, confirm);
    if (matchErr) e.confirm = matchErr;
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setCurrent("");
    setNewPw("");
    setConfirm("");
    onSaved();
  }

  return (
    <SettingsSection
      icon={Lock}
      title="Password"
      description="Use a strong password of at least 8 characters. We'll never ask for it by email."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordInput
          id="settings-current-pw"
          label="Current Password"
          placeholder="Enter your current password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            if (errors.current)
              setErrors((p) => ({ ...p, current: undefined }));
          }}
          error={errors.current}
          autoComplete="current-password"
        />
        <PasswordInput
          id="settings-new-pw"
          label="New Password"
          placeholder="At least 8 characters"
          value={newPw}
          onChange={(e) => {
            setNewPw(e.target.value);
            if (errors.newPw) setErrors((p) => ({ ...p, newPw: undefined }));
          }}
          error={errors.newPw}
          autoComplete="new-password"
        />
        <PasswordInput
          id="settings-confirm-pw"
          label="Confirm New Password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm)
              setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <div className="flex justify-end pt-1">
          <Button type="submit" variant="primary" size="md" isLoading={saving}>
            Update password
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
                Bank
              </span>
              <span className="text-[13px] font-heading font-semibold text-text">
                {currentUser.bank_code}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted font-heading font-medium">
                Account
              </span>
              <span className="text-[13px] font-mono font-semibold text-text tracking-wider">
                {"•••• •••• " +
                  (currentUser.bank_account_number ?? "").slice(-4)}
              </span>
            </div>
            {resolvedAccountName && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted font-heading font-medium">
                  Verified name
                </span>
                <span className="text-[13px] font-heading font-semibold text-success">
                  {resolvedAccountName}
                </span>
              </div>
            )}
          </div>
          <Link to="/creator/payouts">
            <Button variant="outline" size="sm">
              Manage bank account in Payouts
            </Button>
          </Link>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { currentUser } = useAuth();
  const isCreator = currentUser.is_approved_creator;

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
        subtitle="Manage your profile, security, and account preferences."
      >
        <div className="space-y-5 max-w-2xl">
          <ProfileSection
            onSaved={() =>
              showToast({ message: "Profile updated successfully." })
            }
          />
          <PasswordSection
            onSaved={() =>
              showToast({ message: "Password updated successfully." })
            }
          />
          {isCreator && <BankDetailsSection />}
          <DangerSection />
        </div>
      </PageContainer>
    </>
  );
}
