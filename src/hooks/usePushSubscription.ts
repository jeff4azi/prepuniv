import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export type PushPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export interface UsePushSubscriptionReturn {
  permission: PushPermissionState;
  /** True if the current browser/device subscription has been persisted to the backend */
  subscribed: boolean;
  loading: boolean;
  enable: () => Promise<{ ok: boolean; error?: string }>;
  disable: () => Promise<{ ok: boolean; error?: string }>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const { isLoggedIn, authToken } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!supported || !isLoggedIn) {
        if (!cancelled) {
          setPermission(supported ? "default" : "unsupported");
          setLoading(false);
        }
        return;
      }

      const p: PushPermissionState =
        Notification.permission === "granted"
          ? "granted"
          : Notification.permission === "denied"
            ? "denied"
            : "default";
      setPermission(p);

      try {
        const resp = await apiFetch<{ enabled?: boolean; publicKey?: string; public_key?: string | null }>(
          "/api/push/vapid-key",
        );
        if (resp.data?.enabled === false) {
          if (!cancelled) setSubscribed(false);
        }
        if (!cancelled) setVapidKey(resp.data?.publicKey ?? resp.data?.public_key ?? null);
      } catch {
        if (!cancelled) setVapidKey(null);
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setCurrentEndpoint(sub.endpoint);
          setSubscribed(true);
        } else {
          setCurrentEndpoint(null);
          setSubscribed(false);
        }
      } catch (e) {
        setCurrentEndpoint(null);
        setSubscribed(false);
      }

      if (!cancelled) setLoading(false);
    }
    void init();

    let retries = 0;
    const retryInterval = setInterval(async () => {
      if (!supported || !isLoggedIn) return;
      retries++;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setCurrentEndpoint(sub.endpoint);
          setSubscribed(true);
          clearInterval(retryInterval);
        } else if (retries > 6) {
          clearInterval(retryInterval);
        }
      } catch { /* ignore */ }
    }, 1500);

    try {
      if ("permissions" in navigator) {
        navigator.permissions
          .query({ name: "notifications" as PermissionName })
          .then((status) => {
            status.onchange = () => {
              setPermission(
                status.state === "granted"
                  ? "granted"
                  : status.state === "denied"
                    ? "denied"
                    : "default",
              );
            };
          })
          .catch(() => {});
      }
    } catch { /* ignore */ }

    return () => {
      cancelled = true;
      clearInterval(retryInterval);
    };
  }, [supported, isLoggedIn, authToken]);

  const enable = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: false, error: "Push notifications are not supported in this browser." };
    if (!vapidKey) return { ok: false, error: "Push configuration missing on server — try again later." };

    setLoading(true);
    try {
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm === "denied") {
          setPermission("denied");
          return { ok: false, error: "Notifications blocked — re-enable them in browser settings." };
        }
        if (perm === "granted") setPermission("granted");
      }
      if (Notification.permission === "denied") {
        setPermission("denied");
        return { ok: false, error: "Notifications blocked — re-enable them in browser settings." };
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
        });
      }
      const rawKey = sub.getKey("p256dh");
      const rawAuth = sub.getKey("auth");
      const p256dh = rawKey ? btoa(String.fromCharCode(...new Uint8Array(rawKey as ArrayBuffer))) : "";
      const auth = rawAuth ? btoa(String.fromCharCode(...new Uint8Array(rawAuth as ArrayBuffer))) : "";
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

      const { error } = await apiFetch<{ ok: boolean }>("/api/push/subscribe", {
        method: "POST",
        body: { endpoint: sub.endpoint, p256dh, auth, user_agent: userAgent },
      });
      if (error) {
        return { ok: false, error };
      }
      setCurrentEndpoint(sub.endpoint);
      setSubscribed(true);
      setPermission("granted");
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to enable notifications";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [supported, vapidKey]);

  const disable = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!supported) return { ok: true };
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        if (endpoint) {
          await apiFetch("/api/push/unsubscribe", { method: "POST", body: { endpoint } });
        }
      }
      setCurrentEndpoint(null);
      setSubscribed(false);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to disable push";
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { permission, subscribed, loading, enable, disable };
}
