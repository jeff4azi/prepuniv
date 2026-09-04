import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  ChevronRight,
  AlertCircle,
  Wallet as WalletIcon,
  CreditCard,
  FileText,
  ShieldCheck,
  Megaphone,
  Sparkles,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { usePushSubscription } from "../hooks/usePushSubscription";

interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
}

type FilterKey = "all" | "unread";

const PAGE_SIZE = 30;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(iso: string): string {
  const now = new Date().getTime();
  const d = new Date(iso).getTime();
  const diffMs = now - d;
  if (diffMs < 0) return formatDate(iso);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return formatDate(iso);
}

function getIconForType(type: string): {
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
} {
  switch (type) {
    case "topup_completed":
    case "topup_partial":
      return {
        icon: <WalletIcon className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: type === "topup_partial" ? "bg-warning/10" : "bg-primary/10",
        textClass: type === "topup_partial" ? "text-warning" : "text-primary",
      };
    case "topup_failed":
      return {
        icon: <WalletIcon className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-danger/10",
        textClass: "text-danger",
      };
    case "quiz_purchase_confirmed":
      return {
        icon: <FileText className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-secondary/10",
        textClass: "text-secondary",
      };
    case "payout_requested":
    case "payout_paid":
      return {
        icon: <CreditCard className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-secondary/10",
        textClass: "text-secondary",
      };
    case "payout_failed":
    case "payout_reversed":
      return {
        icon: <CreditCard className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-danger/10",
        textClass: "text-danger",
      };
    case "new_report_on_quiz":
    case "new_report_submitted":
      return {
        icon: <AlertCircle className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-warning/10",
        textClass: "text-warning",
      };
    case "quiz_suspended":
      return {
        icon: <AlertCircle className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-danger/10",
        textClass: "text-danger",
      };
    case "creator_application_approved":
      return {
        icon: <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-secondary/10",
        textClass: "text-secondary",
      };
    case "creator_application_rejected":
      return {
        icon: <AlertCircle className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-warning/10",
        textClass: "text-warning",
      };
    case "new_creator_application":
    case "payout_requested_pending_review":
      return {
        icon: <ShieldCheck className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-warning/10",
        textClass: "text-warning",
      };
    case "admin_broadcast":
      return {
        icon: <Megaphone className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-primary/10",
        textClass: "text-primary",
      };
    default:
      return {
        icon: <Bell className="w-[18px] h-[18px]" strokeWidth={2} />,
        bgClass: "bg-primary/10",
        textClass: "text-primary",
      };
  }
}

export function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  usePageTitle("Notifications");

  const {
    permission,
    subscribed,
    enable,
    loading: pushLoading,
  } = usePushSubscription();
  const [toast, showToast, dismissToast] = useToast();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");

  const userId = currentUser?.id;

  const loadUnreadCount = async (uid: string) => {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      if (!error && count != null) setUnreadCount(count);
    } catch {}
  };

  const load = async (uid: string, cursor?: string | null, append = false) => {
    try {
      let q = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        q = q.lt("created_at", cursor);
      }

      const { data, error } = await q;
      if (error) return;

      const rows = (data ?? []) as DbNotification[];

      if (append) {
        setNotifications((prev) => [...prev, ...rows]);
      } else {
        setNotifications(rows);
      }

      const lastItem = rows[rows.length - 1];
      setLastLoadedAt(lastItem?.created_at ?? null);
      setHasMore(rows.length === PAGE_SIZE);
    } catch {}
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const initial = async () => {
      setLoading(true);
      await Promise.all([load(userId, null, false), loadUnreadCount(userId)]);
      if (!cancelled) setLoading(false);
    };

    void initial();

    const channelName = `notifications-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load(userId, null, false);
          void loadUnreadCount(userId);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleLoadMore = async () => {
    if (!userId || !lastLoadedAt || loadingMore) return;
    setLoadingMore(true);
    await load(userId, lastLoadedAt, true);
    setLoadingMore(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!userId || unreadCount === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        showToast({ message: "Failed to mark as read", variant: "danger" });
      } else {
        setNotifications((prev) =>
          prev.map((n) =>
            n.is_read
              ? n
              : { ...n, is_read: true, read_at: new Date().toISOString() },
          ),
        );
        setUnreadCount(0);
        showToast({
          message: "All notifications marked as read",
          variant: "success",
        });
      }
    } catch {
      showToast({ message: "Failed to mark as read", variant: "danger" });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleRowClick = async (n: DbNotification) => {
    if (!n.is_read) {
      try {
        await supabase
          .from("notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", n.id);

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id
              ? { ...item, is_read: true, read_at: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }

    const url = n.data?.url;
    if (typeof url === "string" && url) {
      navigate(url);
    } else {
      navigate("/");
    }
  };

  const handleEnablePush = async () => {
    if (enablingPush) return;
    setEnablingPush(true);
    const result = await enable();
    if (result.ok) {
      showToast({ message: "Push notifications enabled", variant: "success" });
    } else {
      showToast({
        message: result.error ?? "Failed to enable push notifications",
        variant: "danger",
      });
    }
    setEnablingPush(false);
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    return notifications;
  }, [notifications, filter]);

  const showPushBanner =
    permission !== "unsupported" &&
    !(permission === "granted" && subscribed === true);

  return (
    <>
      <PageContainer
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "Stay up to date with top-ups, payouts, and announcements"
        }
      >
        <div className="space-y-5">
          {showPushBanner && permission === "denied" && (
            <Card className="bg-surface/50 border-border/50">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <BellOff className="w-[18px] h-[18px]" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-text leading-tight">
                    Notifications blocked by browser
                  </p>
                  <p className="mt-1 text-xs text-text-soft leading-relaxed max-w-lg">
                    You've blocked notifications in your browser settings. To
                    receive real-time alerts for payouts, top-ups, and important
                    updates, please enable notifications for this site in your
                    browser's privacy settings.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {}}
                  className="shrink-0"
                >
                  Got it
                </Button>
              </div>
            </Card>
          )}

          {showPushBanner &&
            permission !== "denied" &&
            (permission === "default" || subscribed === false) && (
              <Card className="bg-surface/50 border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BellOff className="w-[18px] h-[18px]" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-text leading-tight">
                      Enable push notifications
                    </p>
                    <p className="mt-1 text-xs text-text-soft leading-relaxed max-w-lg">
                      Get real-time alerts when your top-ups complete, payouts
                      are sent, quiz reports are filed, and important
                      announcements go out.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleEnablePush}
                    isLoading={enablingPush || pushLoading}
                    leftIcon={
                      enablingPush || pushLoading ? (
                        <Loader2
                          className="w-[16px] h-[16px] animate-spin"
                          strokeWidth={2}
                        />
                      ) : (
                        <Bell className="w-[16px] h-[16px]" strokeWidth={2} />
                      )
                    }
                    className="shrink-0 self-start sm:self-center"
                  >
                    Enable push notifications
                  </Button>
                </div>
              </Card>
            )}

          <Card padded={false}>
            <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50">
              <div className="inline-flex items-center p-1 rounded-2xl bg-surface/60 border border-border/50 w-full sm:w-auto">
                {(["all", "unread"] as FilterKey[]).map((k) => {
                  const active = filter === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className={`flex-1 sm:flex-none h-9 px-4 rounded-2xl text-sm font-heading transition-all duration-150 ${
                        active
                          ? "bg-primary text-cream font-semibold shadow-soft"
                          : "text-text-soft font-medium hover:text-text hover:bg-surface"
                      }`}
                    >
                      {k === "all" ? "All" : "Unread"}
                      {k === "unread" && unreadCount > 0 ? (
                        <span
                          className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-heading font-bold ${
                            active
                              ? "bg-cream/20 text-cream"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                leftIcon={
                  <CheckCheck className="w-[16px] h-[16px]" strokeWidth={2} />
                }
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || markingAllRead}
                isLoading={markingAllRead}
                className="shrink-0 self-start sm:self-center"
              >
                Mark all as read
              </Button>
            </div>

            {loading ? (
              <div className="p-8 sm:p-10 flex flex-col items-center justify-center">
                <Loader2
                  className="w-8 h-8 text-primary animate-spin"
                  strokeWidth={2}
                />
                <p className="mt-3 text-sm text-text-soft font-heading">
                  Loading notifications…
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 sm:p-10 flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-card ring-1 ring-border/50">
                  <Inbox className="w-10 h-10" strokeWidth={1.9} />
                </div>
                <h3 className="font-heading font-bold text-lg text-text leading-tight">
                  No notifications yet
                </h3>
                <p className="mt-1.5 text-sm text-text-soft max-w-sm leading-relaxed">
                  We'll notify you here about top-ups, payouts, purchases, and
                  important announcements.
                </p>
                {filter === "unread" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-surface/80 text-text font-heading font-medium text-sm border border-border/50 active:scale-95 transition-transform"
                  >
                    <ChevronRight className="w-4 h-4 -ml-1 -mr-0.5 rotate-180" />
                    Show all notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredNotifications.map((n) => {
                  const { icon, bgClass, textClass } = getIconForType(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      className={`relative flex items-start gap-3 p-4 sm:p-5 transition-colors cursor-pointer ${
                        n.is_read
                          ? "hover:bg-surface/40 border border-transparent hover:border-border/40"
                          : "bg-primary/[0.03] border border-transparent hover:border-border/40"
                      } first:rounded-t-2xl last:rounded-b-2xl`}
                    >
                      {!n.is_read && (
                        <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                      )}
                      <div
                        className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ring-1 ring-border/40 ${bgClass} ${textClass}`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-heading font-semibold text-sm text-text leading-tight">
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-text-soft leading-snug line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock
                            className="w-3 h-3 text-muted shrink-0"
                            strokeWidth={2}
                          />
                          <p className="text-[11px] text-muted font-heading">
                            {relativeTime(n.created_at)}
                          </p>
                          <span className="text-muted/50 text-[11px]">·</span>
                          <ArrowRight
                            className="w-3 h-3 text-muted shrink-0"
                            strokeWidth={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="p-4 sm:p-5 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      isLoading={loadingMore}
                      leftIcon={
                        loadingMore ? (
                          <Loader2
                            className="w-[16px] h-[16px] animate-spin"
                            strokeWidth={2}
                          />
                        ) : null
                      }
                    >
                      {loadingMore ? "Loading more…" : "Load more"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </PageContainer>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onDismiss={dismissToast}
        />
      )}
    </>
  );
}
