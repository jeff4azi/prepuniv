import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface NetworkContextValue {
  isOnline: boolean;
  isChecking: boolean;
  wasOffline: boolean;
  checkConnection: () => Promise<boolean>;
  resetWasOffline: () => void;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Ping test function to verify actual internet connectivity
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return true;

    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Fetch a small static resource with cache busting to verify live connection
      const res = await fetch(`/favicon.ico?_t=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const onlineNow = res.ok || res.status < 500;

      setIsOnline((prev) => {
        if (!prev && onlineNow) {
          setWasOffline(true);
        }
        return onlineNow;
      });
      return onlineNow;
    } catch {
      setIsOnline(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      // Confirm with a quick ping when browser emits online event
      void checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleNetworkError = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("prepuniv:network_error", handleNetworkError);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("prepuniv:network_error", handleNetworkError);
    };
  }, [checkConnection]);

  // Auto-dismiss "Back online" toast/badge after 5 seconds if set
  useEffect(() => {
    if (wasOffline && isOnline) {
      const t = setTimeout(() => {
        setWasOffline(false);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [wasOffline, isOnline]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isChecking,
        wasOffline,
        checkConnection,
        resetWasOffline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return ctx;
}
