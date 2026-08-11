import { supabase } from "./supabase";

const HOST =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "";

const IS_PROD_HOST = HOST === "prepuniv.vercel.app" || HOST === "www.prepuniv.vercel.app";

const ENV_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

const API_BASE: string = (() => {
  if (IS_PROD_HOST) return "";
  if (ENV_BASE === "undefined") return "";
  return ENV_BASE;
})();

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * All money-moving and state-changing writes go through this helper
 * (not through the Supabase client directly).
 *
 * Automatically attaches the live Supabase session access_token as a Bearer
 * token so the Express backend can verify the caller via its auth middleware.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: {
    method?: Method;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { method = "GET", body, query } = init;

  let url = API_BASE + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Network error",
      status: 0,
    };
  }

  let json: unknown = null;
  try {
    json = await resp.json();
  } catch {
    json = null;
  }

  function normalizeError(raw: unknown): string {
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (typeof o.message === "string") return o.message;
      if (typeof o.error === "string") return o.error;
      if (typeof o.detail === "string") return o.detail;
      if (typeof o.code !== "undefined") {
        const codeStr = String(o.code);
        return typeof o.msg === "string" ? o.msg : typeof o.message === "string" ? o.message : `Server error (${codeStr})`;
      }
      try {
        return JSON.stringify(raw);
      } catch {
        return "Unknown error";
      }
    }
    return `HTTP ${resp.status}`;
  }

  if (!resp.ok) {
    let errMsg: string = resp.statusText || `HTTP ${resp.status}`;
    if (json && typeof json === "object") {
      const o = json as Record<string, unknown>;
      if (typeof o.error === "string") errMsg = o.error;
      else if ("message" in o || "code" in o || "detail" in o) errMsg = normalizeError(json);
      else if (typeof (json as { error?: unknown }).error !== "undefined") {
        errMsg = normalizeError((json as { error: unknown }).error);
      }
    }
    return { data: null, error: errMsg, status: resp.status };
  }

  return { data: json as T, error: null, status: resp.status };
}
