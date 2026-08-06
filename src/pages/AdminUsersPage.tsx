/**
 * AdminUsersPage — /admin/users
 *
 * Search, filter, and manage all platform users.
 * Single moderation action: Suspend / Unsuspend with confirm step.
 * Creator rows link to their Creator Profile page.
 * Regular-user rows open a lightweight detail panel.
 */
import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Users,
  Search,
  X,
  ShieldCheck,
  ChevronRight,
  Ban,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  FileQuestion,
  Wallet,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  profiles,
  toggleSuspension,
  quizAttempts as allAttempts,
  walletTransactions as allTxns,
  type Profile,
} from "../mock";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "users" | "creators" | "admins" | "suspended";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "creators", label: "Creators" },
  { value: "admins", label: "Admins" },
  { value: "suspended", label: "Suspended" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RoleBadge({ profile }: { profile: Profile }) {
  if (profile.role === "admin")
    return (
      <Badge variant="warning" size="sm">
        Admin
      </Badge>
    );
  if (profile.role === "creator")
    return (
      <Badge variant="secondary" size="sm">
        Creator
      </Badge>
    );
  return (
    <Badge variant="muted" size="sm">
      User
    </Badge>
  );
}

// ─── Suspend confirm overlay ──────────────────────────────────────────────────

function SuspendConfirm({
  profile,
  onConfirm,
  onCancel,
  loading,
}: {
  profile: Profile;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isSuspended = profile.is_suspended;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm bg-cream rounded-3xl shadow-elevated p-6 space-y-4">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto ${
            isSuspended
              ? "bg-success-bg text-success"
              : "bg-danger-bg text-danger"
          }`}
        >
          {isSuspended ? (
            <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
          ) : (
            <Ban className="w-6 h-6" strokeWidth={2} />
          )}
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="font-heading font-bold text-base text-text">
            {isSuspended
              ? `Unsuspend ${profile.full_name}?`
              : `Suspend ${profile.full_name}?`}
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">
            {isSuspended
              ? "They will be able to log in and use PrepUniv again immediately."
              : "They won't be able to log in or take any actions on PrepUniv until unsuspended."}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={isSuspended ? "primary" : "danger"}
            size="md"
            className={`flex-1 ${!isSuspended ? "bg-danger! text-cream! hover:bg-danger/90!" : ""}`}
            isLoading={loading}
            onClick={onConfirm}
          >
            {!loading &&
              (isSuspended ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Ban className="w-4 h-4" />
              ))}
            {isSuspended ? "Unsuspend" : "Suspend"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── User detail panel ────────────────────────────────────────────────────────

function UserDetailPanel({
  profile,
  onClose,
  onSuspendClick,
}: {
  profile: Profile;
  onClose: () => void;
  onSuspendClick: () => void;
}) {
  const attemptCount = useMemo(
    () => allAttempts.filter((a) => a.user_id === profile.id).length,
    [profile.id],
  );
  const topUpTotal = useMemo(
    () =>
      allTxns
        .filter(
          (t) =>
            t.user_id === profile.id &&
            t.type === "deposit" &&
            t.status === "success",
        )
        .reduce((s, t) => s + t.amount, 0),
    [profile.id],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end p-0">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full sm:max-w-sm sm:h-full bg-cream sm:rounded-l-3xl rounded-t-3xl shadow-elevated flex flex-col max-h-[80dvh] sm:max-h-none overflow-hidden">
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-border/40 shrink-0">
          <h2 className="font-heading font-bold text-base text-text">
            User detail
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <Avatar name={profile.full_name} size="md" />
            <div className="min-w-0">
              <p className="font-heading font-bold text-base text-text leading-tight">
                {profile.full_name}
              </p>
              <p className="text-xs text-muted">{profile.email}</p>
            </div>
          </div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <RoleBadge profile={profile} />
            {profile.is_suspended && (
              <Badge variant="danger" size="sm" dot>
                Suspended
              </Badge>
            )}
          </div>
          {/* Meta */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-soft">
              <Clock className="w-4 h-4 text-muted shrink-0" strokeWidth={2} />
              Joined {formatDate(profile.joined_at)}
            </div>
            <div className="flex items-center gap-2 text-text-soft">
              <FileQuestion
                className="w-4 h-4 text-muted shrink-0"
                strokeWidth={2}
              />
              <span>
                <span className="font-heading font-semibold text-text">
                  {attemptCount}
                </span>{" "}
                quiz attempts
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-soft">
              <Wallet className="w-4 h-4 text-muted shrink-0" strokeWidth={2} />
              <span>
                <span className="font-heading font-semibold text-text">
                  ₦{(topUpTotal / 100).toLocaleString("en-NG")}
                </span>{" "}
                topped up
              </span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border/40 shrink-0 space-y-2">
          <Button
            variant="outline"
            size="md"
            fullWidth
            onClick={onSuspendClick}
            className={
              profile.is_suspended
                ? ""
                : "border-danger/40 text-danger hover:bg-danger-bg"
            }
          >
            {profile.is_suspended ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Unsuspend
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" /> Suspend
              </>
            )}
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  profile,
  onDetail,
  onSuspend,
}: {
  profile: Profile;
  onDetail: () => void;
  onSuspend: () => void;
}) {
  const isCreator = profile.role === "creator";
  const nameCell = isCreator ? (
    <Link
      to={`/profile/creator/${profile.id}`}
      className="font-heading font-semibold text-sm text-primary hover:underline underline-offset-2 flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {profile.full_name}
      <ExternalLink className="w-3 h-3" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={onDetail}
      className="font-heading font-semibold text-sm text-text hover:text-primary transition-colors text-left"
    >
      {profile.full_name}
    </button>
  );

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      {/* Avatar */}
      <button
        type="button"
        onClick={isCreator ? undefined : onDetail}
        className="shrink-0"
      >
        <Avatar name={profile.full_name} size="sm" />
      </button>
      {/* Name + email */}
      <div className="flex-1 min-w-0">
        {nameCell}
        <p className="text-xs text-muted mt-0.5 truncate">{profile.email}</p>
      </div>
      {/* Role */}
      <div className="shrink-0 hidden sm:block">
        <RoleBadge profile={profile} />
      </div>
      {/* Joined */}
      <p className="text-xs text-text-soft shrink-0 hidden md:block w-24 text-right">
        {formatDate(profile.joined_at)}
      </p>
      {/* Suspended */}
      {profile.is_suspended && (
        <Badge
          variant="danger"
          size="sm"
          className="shrink-0 hidden sm:inline-flex"
        >
          Suspended
        </Badge>
      )}
      {/* Actions */}
      <button
        type="button"
        onClick={onSuspend}
        className={`shrink-0 h-8 px-2.5 rounded-xl text-[11px] font-heading font-semibold border transition-all ${
          profile.is_suspended
            ? "border-success/40 text-success hover:bg-success-bg"
            : "border-border/60 text-muted hover:border-danger/40 hover:text-danger hover:bg-danger-bg"
        }`}
      >
        {profile.is_suspended ? "Unsuspend" : "Suspend"}
      </button>
      <button
        type="button"
        onClick={isCreator ? undefined : onDetail}
        className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface/60 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <Users className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        {hasSearch ? "No users match your search" : "No users found"}
      </h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        {hasSearch
          ? "Try adjusting your search or filter."
          : "Users will appear here once they sign up."}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [version, setVersion] = useState(0);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  // Exclude synthetic leaderboard users (no profile entry needed in admin list for them)
  const managedProfiles = useMemo(
    () =>
      profiles.filter((p) => !p.id.startsWith("user_0") || p.id === "user_001"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const filtered = useMemo(() => {
    let list = managedProfiles;
    if (activeTab === "users")
      list = list.filter((p) => p.role === "user" && !p.is_suspended);
    if (activeTab === "creators")
      list = list.filter((p) => p.role === "creator");
    if (activeTab === "admins") list = list.filter((p) => p.role === "admin");
    if (activeTab === "suspended") list = list.filter((p) => p.is_suspended);
    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.joined_at ?? 0).getTime() -
        new Date(a.joined_at ?? 0).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managedProfiles, activeTab, searchInput, version]);

  const counts = useMemo(
    () => ({
      all: managedProfiles.length,
      users: managedProfiles.filter((p) => p.role === "user" && !p.is_suspended)
        .length,
      creators: managedProfiles.filter((p) => p.role === "creator").length,
      admins: managedProfiles.filter((p) => p.role === "admin").length,
      suspended: managedProfiles.filter((p) => p.is_suspended).length,
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    [managedProfiles, version],
  );

  const suspendTarget = suspendId
    ? profiles.find((p) => p.id === suspendId)
    : null;
  const detailTarget = detailId
    ? profiles.find((p) => p.id === detailId)
    : null;

  async function handleSuspendConfirm() {
    if (!suspendId) return;
    setSuspending(true);
    await new Promise((r) => setTimeout(r, 500));
    const nowSuspended = toggleSuspension(suspendId);
    const name = profiles.find((p) => p.id === suspendId)?.full_name ?? "User";
    setSuspending(false);
    setSuspendId(null);
    setDetailId(null);
    setVersion((v) => v + 1);
    showToast({
      message: nowSuspended
        ? `${name} has been suspended.`
        : `${name} has been unsuspended.`,
      variant: nowSuspended ? undefined : "success",
    });
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="max-w-290!">
        <div className="space-y-5 lg:space-y-6">
          {/* Header + search */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="warning" size="sm" dot className="mb-2">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                Users
              </h1>
              <p className="mt-1.5 text-sm text-text-soft">
                {counts.all} total users on the platform.
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full h-11 pl-10 pr-10 rounded-2xl border border-border/60 bg-cream text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg text-muted hover:text-text hover:bg-surface/60 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.value
                    ? "bg-cream shadow-soft text-text"
                    : "text-text-soft hover:text-text"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${
                      tab.value === "suspended" && counts.suspended > 0
                        ? activeTab === "suspended"
                          ? "bg-danger text-cream"
                          : "bg-danger/15 text-danger"
                        : "bg-border text-muted"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <Card padded={false} className="overflow-hidden">
            {/* Desktop column headers */}
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 border-b border-border/40 bg-surface/30">
              <div className="flex-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Name
              </div>
              <div className="w-24 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted hidden sm:block">
                Role
              </div>
              <div className="w-24 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
                Joined
              </div>
              <div className="w-20" />
              <div className="w-8" />
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                hasSearch={searchInput.trim().length > 0 || activeTab !== "all"}
              />
            ) : (
              filtered.map((p) => (
                <UserRow
                  key={p.id}
                  profile={p}
                  onDetail={() => setDetailId(p.id)}
                  onSuspend={() => {
                    if (p.role !== "admin") setSuspendId(p.id);
                  }}
                />
              ))
            )}
          </Card>
          {/* Result count */}
          {filtered.length > 0 && (
            <p className="text-xs text-muted text-right">
              Showing {filtered.length} of {counts.all} users
            </p>
          )}
        </div>
      </PageContainer>

      {/* Detail panel */}
      {detailTarget && (
        <UserDetailPanel
          profile={detailTarget}
          onClose={() => setDetailId(null)}
          onSuspendClick={() => {
            if (detailTarget.role !== "admin") {
              setSuspendId(detailTarget.id);
              setDetailId(null);
            }
          }}
        />
      )}

      {/* Suspend confirm */}
      {suspendTarget && (
        <SuspendConfirm
          profile={suspendTarget}
          onConfirm={handleSuspendConfirm}
          onCancel={() => setSuspendId(null)}
          loading={suspending}
        />
      )}
    </>
  );
}
