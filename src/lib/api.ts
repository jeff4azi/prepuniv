import { supabase } from "./supabase";

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

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

  let json: T | { error: string } | null = null;
  try {
    json = (await resp.json()) as T | { error: string };
  } catch {
    json = null;
  }

  if (!resp.ok) {
    const errMsg =
      (json && typeof json === "object" && "error" in json
        ? (json as { error: string }).error
        : null) || resp.statusText || `HTTP ${resp.status}`;
    return { data: null, error: errMsg, status: resp.status };
  }

  return { data: json as T, error: null, status: resp.status };
}
