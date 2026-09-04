/**
 * AdminNotificationsPage — /admin/notifications
 *
 * Admin broadcast composer: build, preview, and send in-app + push
 * notifications to either every registered user or a single specific user.
 * Tracks broadcast progress via polling and shows a recent broadcasts table.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Megaphone,
  Bell,
  Users,
  Search,
  X,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  Send,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { AppDialog } from "../components/AppDialog";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { AdminLoadingState } from "../hooks/useAdminData";

// ─── Types ────────────────────────────────────────────────────────────────────

type AudienceTarget = "all" | "user";

interface SelectedUser {
  id: string;
  full_name: string;
  email: string;
}

type BroadcastStatus = "pending" | "processing" | "done" | "failed";

interface Broadcast {
  id: string;
  title: string;
  body: string;
  target: AudienceTarget;
  target_user_id?: string | null;
  data?: { url?: string } | null;
  status: BroadcastStatus;
  total_recipients: number;
  processed_count: number;
  push_enabled_count?: number | null;
  created_at: string;
  updated_at?: string | null;
  target_user_name?: string | null;
  target_user_email?: string | null;
}

interface RecentBroadcastRow {
  id: string;
  title: string;
  target: AudienceTarget;
  target_user_name?: string | null;
  total_recipients: number;
  status: BroadcastStatus;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-NG");
}

function statusBadgeVariant(
  status: BroadcastStatus,
): "warning" | "success" | "danger" {
  if (status === "done") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

function statusLabel(status: BroadcastStatus): string {
  if (status === "pending") return "Pending";
  if (status === "processing") return "Processing";
  if (status === "done") return "Sent";
  return "Failed";
}

// ─── User search picker (inline Supabase, independent of hook shapes) ─────────

interface UserSearchMatch {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

// ─── Selected user pill ───────────────────────────────────────────────────────

function SelectedUserPill({
  user,
  onRemove,
}: {
  user: SelectedUser;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-2xl bg-primary/10 border border-primary/20">
      <div className="h-6 w-6 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
        <Users className="w-3.5 h-3.5" strokeWidth={2} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[12px] font-heading font-semibold text-text">
          {user.full_name}
        </span>
        <span className="text-[10px] text-muted truncate max-w-[200px]">
          {user.email}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove selected user"
        className="h-6 w-6 rounded-lg text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── User search dropdown ─────────────────────────────────────────────────────

function UserSearchResultItem({
  match,
  onPick,
}: {
  match: UserSearchMatch;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-surface/60 transition-colors border-b border-border/30 last:border-0"
    >
      <div className="h-8 w-8 rounded-xl bg-surface border border-border/50 flex items-center justify-center text-muted shrink-0">
        <Users className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-semibold text-text truncate">
          {match.full_name}
        </p>
        <p className="text-[11px] text-muted truncate">{match.email}</p>
      </div>
      <Check className="w-4 h-4 text-muted shrink-0 opacity-0 group-hover:opacity-100" />
    </button>
  );
}

// ─── Preview box ──────────────────────────────────────────────────────────────

function NotificationPreview({
  title,
  body,
  url,
}: {
  title: string;
  body: string;
  url: string;
}) {
  const displayTitle = title.trim() || "Notification title";
  const displayBody = body.trim() || "Your message will appear here.";
  const displayUrl = url.trim() || "/";

  return (
    <Card padded={false} className="bg-surface/30 border-border/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-lg bg-surface border border-border/50 flex items-center justify-center text-muted shrink-0">
          <Eye className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
          Preview
        </p>
      </div>

      <div className="rounded-2xl bg-cream border border-border/50 p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold text-text leading-snug">
              {displayTitle}
            </p>
            <p className="mt-1 text-[13px] text-text-soft leading-relaxed">
              {displayBody}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface/50 text-[11px] font-heading text-muted">
              <ExternalLink className="w-3 h-3" strokeWidth={2} />
              Taps → {displayUrl}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Broadcast status card ────────────────────────────────────────────────────

function BroadcastStatusCard({
  broadcast,
  onContinue,
  continuing,
}: {
  broadcast: Broadcast;
  onContinue: () => void;
  continuing: boolean;
}) {
  const progress =
    broadcast.total_recipients > 0
      ? Math.min(
          100,
          (broadcast.processed_count / broadcast.total_recipients) * 100,
        )
      : 0;

  const isTerminal =
    broadcast.status === "done" || broadcast.status === "failed";
  const isStuckProcessing =
    broadcast.status === "processing" &&
    broadcast.processed_count < broadcast.total_recipients;

  return (
    <Card padded={false} className="p-5 border-primary/20 bg-primary/[0.03]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            {broadcast.status === "done" ? (
              <Check className="w-5 h-5" strokeWidth={2} />
            ) : broadcast.status === "failed" ? (
              <AlertCircle className="w-5 h-5" strokeWidth={2} />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-base text-text leading-snug">
              {broadcast.title}
            </p>
            <p className="mt-0.5 text-xs text-text-soft leading-relaxed max-w-md">
              {broadcast.body}
            </p>
          </div>
        </div>
        <Badge variant={statusBadgeVariant(broadcast.status)} size="md" dot>
          {statusLabel(broadcast.status)}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <Badge variant="muted" size="sm">
            <Users className="w-3 h-3" />
            Audience:{" "}
            {broadcast.target === "all"
              ? "Everyone"
              : broadcast.target_user_name ||
                broadcast.target_user_email ||
                "Specific user"}
          </Badge>
          <Badge variant="muted" size="sm">
            <Clock className="w-3 h-3" />
            Created {relativeTime(broadcast.created_at)}
          </Badge>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[12px] font-heading font-semibold text-text">
              Delivery progress
            </p>
            <p className="text-[12px] font-heading font-semibold text-text">
              {formatNumber(broadcast.processed_count)} /{" "}
              {formatNumber(broadcast.total_recipients)} processed
            </p>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface border border-border/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                broadcast.status === "failed"
                  ? "bg-danger"
                  : broadcast.status === "done"
                    ? "bg-success"
                    : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Done summary */}
        {broadcast.status === "done" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-success-bg border border-success/20">
            <Check
              className="w-4 h-4 text-success shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[13px] text-text leading-relaxed">
              Broadcast complete. Sent to{" "}
              <span className="font-heading font-semibold">
                {formatNumber(broadcast.total_recipients)}
              </span>{" "}
              users.
              {broadcast.push_enabled_count != null && (
                <>
                  {" "}
                  <span className="font-heading font-semibold">
                    {formatNumber(broadcast.push_enabled_count)}
                  </span>{" "}
                  users with push enabled received a system notification — only
                  logged-in users see in-app.
                </>
              )}
            </p>
          </div>
        )}

        {/* Failed */}
        {broadcast.status === "failed" && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-danger-bg border border-danger/20">
            <AlertCircle
              className="w-4 h-4 text-danger shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[13px] text-text leading-relaxed">
              Broadcast stopped before completing. You can resume processing
              below or start a new broadcast.
            </p>
          </div>
        )}

        {/* Resume button (external backstop + manual trigger) */}
        {!isTerminal && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted">
              Processing runs in the background. Stuck? Trigger a manual push.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onContinue}
              disabled={continuing}
              isLoading={continuing}
            >
              {!continuing && <ExternalLink className="w-3.5 h-3.5" />}
              Resume processing
            </Button>
          </div>
        )}

        {isStuckProcessing && !isTerminal && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-warning-bg border border-warning/20">
            <Clock
              className="w-4 h-4 text-warning shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-[13px] text-text leading-relaxed">
              Taking longer than expected. Use{" "}
              <span className="font-heading font-semibold">
                Resume processing
              </span>{" "}
              to nudge the queue along.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Recent broadcasts table ──────────────────────────────────────────────────

function RecentBroadcastsTable({
  rows,
  loading,
}: {
  rows: RecentBroadcastRow[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card padded={false} className="p-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-xl bg-surface border border-border/50 flex items-center justify-center mb-2 animate-pulse">
            <Loader2 className="w-4 h-4 text-muted animate-spin" />
          </div>
          <p className="text-xs text-muted font-heading">Loading broadcasts…</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="hidden md:flex items-center gap-3 px-5 py-2.5 border-b border-border/40 bg-surface/30">
        <div className="flex-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
          Title
        </div>
        <div className="w-28 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
          Audience
        </div>
        <div className="w-24 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
          Recipients
        </div>
        <div className="w-24 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
          Status
        </div>
        <div className="w-24 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
          Sent
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center text-center py-14 px-4">
          <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
            <Megaphone className="w-7 h-7" strokeWidth={1.8} />
          </div>
          <h3 className="font-heading font-bold text-base text-text">
            No broadcasts yet
          </h3>
          <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
            Send your first broadcast using the composer above.
          </p>
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold text-text truncate">
                {row.title}
              </p>
              <p className="md:hidden text-[11px] text-muted mt-0.5">
                {row.target === "all"
                  ? "Everyone"
                  : row.target_user_name || "Specific user"}
                {" · "}
                {relativeTime(row.created_at)}
              </p>
            </div>
            <div className="hidden md:block w-28 shrink-0">
              <Badge variant="muted" size="sm">
                {row.target === "all" ? (
                  <>
                    <Users className="w-3 h-3" /> Everyone
                  </>
                ) : (
                  row.target_user_name || "Specific user"
                )}
              </Badge>
            </div>
            <div className="hidden md:block w-24 shrink-0 text-right">
              <p className="text-sm font-heading font-semibold text-text">
                {formatNumber(row.total_recipients)}
              </p>
            </div>
            <div className="w-24 shrink-0">
              <Badge variant={statusBadgeVariant(row.status)} size="sm" dot>
                {statusLabel(row.status)}
              </Badge>
            </div>
            <div className="hidden md:block w-24 shrink-0 text-right">
              <p className="text-[11px] text-muted font-heading">
                {relativeTime(row.created_at)}
              </p>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminNotificationsPage() {
  const { currentUser } = useAuth();

  usePageTitle("Admin · Notifications");

  const [toast, showToast, dismissToast] = useToast();

  // ─── Composer state ────────────────────────────────────────────────────────

  const [target, setTarget] = useState<AudienceTarget>("all");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");

  // ─── User search state ─────────────────────────────────────────────────────

  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchMatch[]>(
    [],
  );
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const userSearchDebounce = useRef<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ─── Confirm dialog state ──────────────────────────────────────────────────

  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── Sending state ─────────────────────────────────────────────────────────

  const [sending, setSending] = useState(false);
  const [broadcastId, setBroadcastId] = useState<string | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<Broadcast | null>(
    null,
  );
  const [continuing, setContinuing] = useState(false);
  const pollTimerRef = useRef<number | null>(null);
  const processingStartRef = useRef<number | null>(null);
  const STUCK_THRESHOLD_MS = 20000;

  // ─── Recent broadcasts state ───────────────────────────────────────────────

  const [recentBroadcasts, setRecentBroadcasts] = useState<
    RecentBroadcastRow[]
  >([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // ─── Helpers: validity ─────────────────────────────────────────────────────

  const canSend = useMemo(() => {
    if (!title.trim()) return false;
    if (target === "user" && !selectedUser) return false;
    return true;
  }, [title, target, selectedUser]);

  // ─── Gate: admin only ──────────────────────────────────────────────────────

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  // ─── User search (inline Supabase with ilike) ─────────────────────────────

  const runUserSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      return;
    }
    setUserSearchLoading(true);
    try {
      const pattern = `%${trimmed}%`;
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .or(`full_name.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (profilesError) throw profilesError;

      const profileIds = (profilesData || []).map((p) => p.id);

      let emailMap: Record<string, string> = {};
      if (profileIds.length > 0) {
        const idsJoined = profileIds.join(",");
        const escapedPattern = pattern.replace(/'/g, "''");
        const { data: authUsers, error: authError } = await supabase.rpc(
          "get_user_emails_by_ids",
          { user_ids: profileIds },
        );
        if (!authError && Array.isArray(authUsers)) {
          (authUsers as Array<{ id: string; email?: string }>).forEach((u) => {
            if (u.email) emailMap[u.id] = u.email;
          });
        } else {
          const { data: emailMatchProfiles } = await supabase
            .from("profiles")
            .select("id")
            .textSearch("full_name", trimmed)
            .limit(20);
          void emailMatchProfiles;
          void idsJoined;
          void escapedPattern;
        }
      }

      const combined: UserSearchMatch[] = (profilesData || []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: emailMap[p.id] || "no-email@prepuniv.ng",
        avatar_url: p.avatar_url,
      }));

      setUserSearchResults(combined);
    } catch (err) {
      console.warn("User search failed:", err);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  }, []);

  // Debounced user search input
  useEffect(() => {
    if (target !== "user") return;
    if (userSearchDebounce.current) {
      window.clearTimeout(userSearchDebounce.current);
    }
    const q = userSearchInput;
    if (!q.trim()) {
      setUserSearchResults([]);
      setUserSearchLoading(false);
      return;
    }
    setUserSearchOpen(true);
    setUserSearchLoading(true);
    userSearchDebounce.current = window.setTimeout(() => {
      void runUserSearch(q);
    }, 250);
    return () => {
      if (userSearchDebounce.current) {
        window.clearTimeout(userSearchDebounce.current);
      }
    };
  }, [userSearchInput, target, runUserSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(e.target as Node)) {
        setUserSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ─── Load recent broadcasts ────────────────────────────────────────────────

  const loadRecentBroadcasts = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await apiFetch<{ broadcasts: RecentBroadcastRow[] }>(
        "/api/admin/notifications/broadcasts?limit=10",
      );
      if (res.data?.broadcasts) {
        setRecentBroadcasts(res.data.broadcasts);
      } else {
        const { data, error } = await supabase
          .from("notification_broadcasts")
          .select(
            "id, title, target, target_user_name, total_recipients, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(10);
        if (!error && data) {
          setRecentBroadcasts(
            (data as unknown as RecentBroadcastRow[]).map((r) => ({
              ...r,
              target: (r.target === "all" || r.target === "user"
                ? r.target
                : "all") as AudienceTarget,
              status: (["pending", "processing", "done", "failed"].includes(
                r.status as string,
              )
                ? r.status
                : "pending") as BroadcastStatus,
            })),
          );
        }
      }
    } catch (err) {
      console.warn("Recent broadcasts load failed:", err);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentBroadcasts();
  }, [loadRecentBroadcasts]);

  // ─── Active broadcast polling ──────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    processingStartRef.current = null;
  }, []);

  const pollBroadcast = useCallback(
    async (id: string) => {
      try {
        const res = await apiFetch<{ broadcast: Broadcast }>(
          `/api/admin/notifications/broadcasts/${id}`,
        );
        if (res.data?.broadcast) {
          const b = res.data.broadcast;
          setActiveBroadcast(b);

          if (b.status === "processing" && processingStartRef.current == null) {
            processingStartRef.current = Date.now();
          }

          if (b.status === "done" || b.status === "failed") {
            stopPolling();
            void loadRecentBroadcasts();
          }
        }
      } catch (err) {
        console.warn("Broadcast poll failed:", err);
      }
    },
    [stopPolling, loadRecentBroadcasts],
  );

  // Start polling when broadcastId is set
  useEffect(() => {
    if (!broadcastId) return;
    processingStartRef.current = null;
    void pollBroadcast(broadcastId);
    pollTimerRef.current = window.setInterval(() => {
      void pollBroadcast(broadcastId);
    }, 2000);
    return () => stopPolling();
  }, [broadcastId, pollBroadcast, stopPolling]);

  // ─── Send handlers ─────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setTitle("");
    setBody("");
    setUrl("/");
    setSelectedUser(null);
    setUserSearchInput("");
    setTarget("all");
  }, []);

  const performSend = useCallback(async () => {
    setSending(true);
    try {
      const data =
        url.trim() && url.trim() !== "/" ? { url: url.trim() } : undefined;
      const payload: {
        title: string;
        body: string;
        target: AudienceTarget;
        targetUserId?: string;
        data?: { url?: string };
      } = {
        title: title.trim(),
        body: body.trim(),
        target,
        data,
      };
      if (target === "user" && selectedUser) {
        payload.targetUserId = selectedUser.id;
      }

      const res = await apiFetch<{ broadcast: Broadcast }>(
        "/api/admin/notifications/broadcast",
        {
          method: "POST",
          body: payload,
        },
      );
      if (res.error || !res.data?.broadcast) {
        throw new Error(res.error || "Failed to create broadcast");
      }
      setBroadcastId(res.data.broadcast.id);
      setActiveBroadcast(res.data.broadcast);
      showToast({
        message:
          target === "all"
            ? "Broadcast queued — delivery progress shown below."
            : "Notification queued.",
        variant: "success",
      });
      resetForm();
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Send failed. Try again.",
        variant: "danger",
      });
    } finally {
      setSending(false);
      void loadRecentBroadcasts();
    }
  }, [
    title,
    body,
    target,
    selectedUser,
    url,
    showToast,
    resetForm,
    loadRecentBroadcasts,
  ]);

  const handleSendClick = () => {
    if (!canSend) return;
    if (target === "all") {
      setConfirmOpen(true);
    } else {
      void performSend();
    }
  };

  const handleConfirmSend = () => {
    setConfirmOpen(false);
    void performSend();
  };

  const handleContinue = useCallback(async () => {
    if (!broadcastId) return;
    setContinuing(true);
    try {
      const res = await apiFetch(
        `/api/admin/notifications/broadcasts/${broadcastId}/continue`,
        { method: "POST" },
      );
      if (res.error) throw new Error(res.error);
      showToast({
        message: "Resume signal sent — processing should continue.",
        variant: "success",
      });
      processingStartRef.current = Date.now();
    } catch (err) {
      showToast({
        message:
          err instanceof Error ? err.message : "Couldn't resume. Try again.",
        variant: "danger",
      });
    } finally {
      setContinuing(false);
    }
  }, [broadcastId, showToast]);

  // Stuck flag for processing (shows extra hint in status card)
  const isStuck =
    activeBroadcast?.status === "processing" &&
    processingStartRef.current != null &&
    Date.now() - processingStartRef.current > STUCK_THRESHOLD_MS;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <AppDialog
        open={confirmOpen}
        variant="confirm"
        title="Send to everyone?"
        message="This will be delivered to every registered user on PrepUniv. It cannot be recalled. Are you sure?"
        confirmLabel="Send to all"
        cancelLabel="Cancel"
        onConfirm={handleConfirmSend}
        onCancel={() => setConfirmOpen(false)}
      />

      <PageContainer className="max-w-290!">
        <div className="space-y-5 lg:space-y-6">
          {/* ─── Page header ────────────────────────────────────────────── */}
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Broadcasts
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-lg leading-relaxed">
              Send in-app and push notifications to users. Recent broadcasts
              appear at the bottom.
            </p>
          </div>

          {/* ─── SECTION 1: Composer card ──────────────────────────────── */}
          <Card padded={false} className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary shrink-0">
                <Megaphone className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-text leading-tight">
                  New broadcast
                </h2>
                <p className="mt-0.5 text-[13px] text-text-soft leading-relaxed">
                  Send a notification to one person or everyone on PrepUniv.
                </p>
              </div>
            </div>

            {/* Audience picker */}
            <div className="space-y-2">
              <label className="text-[13px] font-heading font-semibold text-text">
                Audience
              </label>
              <div className="inline-flex p-1 rounded-2xl bg-surface/50 border border-border/40">
                <button
                  type="button"
                  onClick={() => setTarget("all")}
                  className={`h-9 px-4 rounded-2xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    target === "all"
                      ? "bg-primary text-cream shadow-soft"
                      : "bg-transparent text-text-soft hover:text-text"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setTarget("user")}
                  className={`h-9 px-4 rounded-2xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                    target === "user"
                      ? "bg-primary text-cream shadow-soft"
                      : "bg-transparent text-text-soft hover:text-text"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  Specific user
                </button>
              </div>
            </div>

            {/* Specific user: search + picker */}
            {target === "user" && (
              <div className="space-y-2.5" ref={searchContainerRef}>
                <label className="text-[13px] font-heading font-semibold text-text">
                  Pick a user
                </label>

                {selectedUser ? (
                  <div className="flex items-center gap-2.5">
                    <SelectedUserPill
                      user={selectedUser}
                      onRemove={() => {
                        setSelectedUser(null);
                        setUserSearchInput("");
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                      <input
                        type="search"
                        value={userSearchInput}
                        onChange={(e) => {
                          setUserSearchInput(e.target.value);
                          setUserSearchOpen(true);
                        }}
                        onFocus={() => setUserSearchOpen(true)}
                        placeholder="Search by name…"
                        className="w-full h-11 border border-border/60 rounded-xl bg-cream pl-10 pr-3.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                      />
                    </div>

                    {userSearchOpen &&
                      (userSearchLoading ||
                        userSearchResults.length > 0 ||
                        userSearchInput.trim().length > 0) && (
                        <div className="relative mt-1 rounded-2xl bg-cream border border-border/60 shadow-elevated overflow-hidden max-h-72 overflow-y-auto z-20">
                          {userSearchLoading && (
                            <div className="flex items-center gap-2 px-4 py-3 text-[12px] text-muted">
                              <Loader2
                                className="w-3.5 h-3.5 animate-spin"
                                strokeWidth={2}
                              />
                              Searching…
                            </div>
                          )}
                          {!userSearchLoading &&
                            userSearchResults.length === 0 && (
                              <div className="px-4 py-5 text-center">
                                <p className="text-[12px] text-muted font-heading">
                                  No users match &quot;
                                  {userSearchInput.trim()}&quot;
                                </p>
                              </div>
                            )}
                          {!userSearchLoading &&
                            userSearchResults.map((m) => (
                              <UserSearchResultItem
                                key={m.id}
                                match={m}
                                onPick={() => {
                                  setSelectedUser({
                                    id: m.id,
                                    full_name: m.full_name,
                                    email: m.email,
                                  });
                                  setUserSearchInput("");
                                  setUserSearchOpen(false);
                                  setUserSearchResults([]);
                                }}
                              />
                            ))}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            {/* Title field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-heading font-semibold text-text">
                  Notification title
                </label>
                <span
                  className={`text-[11px] font-heading tabular-nums ${
                    title.length >= 80 ? "text-danger" : "text-muted"
                  }`}
                >
                  {title.length} / 80
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short, scannable summary"
                className="w-full h-11 rounded-xl bg-cream border border-border/60 px-3.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
              />
            </div>

            {/* Body field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-heading font-semibold text-text">
                  Message body
                </label>
                <span
                  className={`text-[11px] font-heading tabular-nums ${
                    body.length >= 200 ? "text-danger" : "text-muted"
                  }`}
                >
                  {body.length} / 200
                </span>
              </div>
              <textarea
                value={body}
                maxLength={200}
                rows={3}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Short plain text message the user will read."
                className="w-full rounded-xl bg-cream border border-border/60 px-3.5 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow resize-none leading-relaxed"
              />
            </div>

            {/* Deep link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-heading font-semibold text-text">
                  Tap action link{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>
              </div>
              <p className="text-[12px] text-text-soft -mt-0.5 leading-relaxed">
                Where the user goes when they tap the notification. Leave blank
                to open the home page.
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none select-none font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={url.startsWith("/") ? url.slice(1) : url}
                  onChange={(e) => {
                    const v = e.target.value;
                    setUrl(v.startsWith("/") ? v : "/" + v);
                  }}
                  placeholder="home"
                  className="w-full h-11 rounded-xl bg-cream border border-border/60 pl-8 pr-3.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow font-mono"
                />
              </div>
            </div>

            {/* Preview */}
            <NotificationPreview title={title} body={body} url={url} />

            {/* ─── SECTION 2: Send button ─────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-text-soft max-w-sm leading-relaxed">
                {target === "all"
                  ? "Requires confirmation. Runs asynchronously — check progress below."
                  : selectedUser
                    ? `Sends directly to ${selectedUser.full_name}. No confirm step.`
                    : "Pick a user above to enable send."}
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleSendClick}
                disabled={!canSend || sending}
                isLoading={sending}
              >
                {!sending && <Send className="w-4 h-4" />}
                Send broadcast
              </Button>
            </div>
          </Card>

          {/* ─── SECTION 3: Active broadcast status ─────────────────────── */}
          {(activeBroadcast || broadcastId) && (
            <BroadcastStatusCard
              broadcast={
                activeBroadcast ?? {
                  id: broadcastId!,
                  title,
                  body,
                  target,
                  status: "pending",
                  total_recipients: 0,
                  processed_count: 0,
                  created_at: new Date().toISOString(),
                }
              }
              onContinue={handleContinue}
              continuing={continuing}
            />
          )}

          {/* ─── SECTION 4: Recent broadcasts table ─────────────────────── */}
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base text-text flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-muted inline-block" />
              Recent Broadcasts
            </h2>
            <RecentBroadcastsTable
              rows={recentBroadcasts}
              loading={recentLoading}
            />
          </div>
        </div>
      </PageContainer>
    </>
  );
}
