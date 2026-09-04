/**
 * analytics.ts — GA4 integration for PrepUniv
 *
 * Loads gtag.js dynamically (no static <script> in index.html) so the
 * VITE_GA_MEASUREMENT_ID guard works at module init time and the GA script
 * is never precached by the PWA service-worker (it always fetches live from
 * Google).
 *
 * Guard rules:
 *  - If VITE_GA_MEASUREMENT_ID is empty/unset, analytics is a no-op.
 *  - Every outbound call is wrapped in try/catch so ad-blockers or a
 *    Google outage can never crash the app.
 *  - No PII is sent — user IDs (not emails/names) only where needed.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

/** True only when we have a measurement ID and the script has been injected. */
let initialised = false;

/**
 * Call once at app bootstrap (inside <BrowserRouter> so initPageTracking can
 * read the current path, but it's called from main.tsx via App before any
 * route renders).
 *
 * Safe to call multiple times — subsequent calls after init are ignored.
 */
export function initAnalytics(): void {
  if (initialised) return;
  if (!GA_ID) return; // local dev / missing var — analytics disabled, silent

  try {
    // Seed dataLayer + gtag shim before the async script arrives so any
    // events queued during page load are not lost.
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    // Disable automatic page_view — we fire it manually on every SPA route
    // change so GA doesn't only count hard reloads.
    window.gtag("config", GA_ID, { send_page_view: false });

    // Inject the script tag. async + defer keeps it off the critical path.
    // Using a JS-generated tag (not a static one in index.html) means:
    //   1. The env-var guard above actually runs before any network call.
    //   2. The Workbox service-worker's precache list won't include this URL
    //      (it only precaches assets emitted by the Vite build), so GA
    //      always fetches the live script from Google.
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    initialised = true;
  } catch {
    // Silently swallow — analytics failure must never break the app.
  }
}

/**
 * Safe, typed wrapper around window.gtag("event", ...).
 * All instrumented events below go through this — one place to catch errors.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): void {
  if (!initialised || !GA_ID) return;
  try {
    window.gtag("event", name, params);
  } catch {
    // Ad-blocker or Google outage — degrade silently.
  }
}

/**
 * Fire a manual page_view event.
 * Called by <GAPageTracker> on every React Router location change.
 */
export function trackPageView(path: string): void {
  if (!initialised || !GA_ID) return;
  try {
    window.gtag("config", GA_ID, {
      page_path: path,
      send_page_view: true,
    });
  } catch {
    // Silently swallow.
  }
}

// ─── Typed event helpers ──────────────────────────────────────────────────────
// Named functions keep call sites readable and enforce consistent param shapes.

/** GA4 standard: user completed registration */
export function trackSignUp(method: string = "email"): void {
  trackEvent("sign_up", { method });
}

/** GA4 standard: user signed in */
export function trackLogin(method: string = "email"): void {
  trackEvent("login", { method });
}

/** Custom: user signed out */
export function trackLogout(): void {
  trackEvent("logout");
}

// ── Discovery ─────────────────────────────────────────────────────────────────

/** GA4 standard: user performed a search */
export function trackSearch(searchTerm: string): void {
  if (!searchTerm.trim()) return;
  trackEvent("search", { search_term: searchTerm.trim() });
}

/**
 * GA4 standard: user viewed a quiz detail page.
 * item_id = quiz ID (not title — no PII, and UUIDs are stable keys).
 */
export function trackViewItem(params: {
  quiz_id: string;
  quiz_title: string;
  course_id?: string | null;
  price_kobo?: number;
}): void {
  trackEvent("view_item", {
    item_id: params.quiz_id,
    item_name: params.quiz_title,
    item_category: params.course_id ?? undefined,
    value: params.price_kobo != null ? params.price_kobo / 100 : undefined,
    currency: "NGN",
  });
}

// ── Quiz-taking funnel ────────────────────────────────────────────────────────

/** Custom: user started a quiz attempt */
export function trackQuizAttemptStarted(params: {
  quiz_id: string;
  is_timed: boolean;
}): void {
  trackEvent("quiz_attempt_started", {
    quiz_id: params.quiz_id,
    is_timed: params.is_timed,
  });
}

/** Custom: user completed a quiz attempt */
export function trackQuizAttemptCompleted(params: {
  quiz_id: string;
  score: number;
  total_questions: number;
  is_timed: boolean;
  time_taken_seconds: number;
}): void {
  trackEvent("quiz_attempt_completed", {
    quiz_id: params.quiz_id,
    score: params.score,
    total_questions: params.total_questions,
    is_timed: params.is_timed,
    time_taken_seconds: params.time_taken_seconds,
  });
}

// ── Wallet top-up funnel ──────────────────────────────────────────────────────

/**
 * GA4 standard: wallet top-up initiated (user clicked "Continue" and
 * the backend returned a payment link — they're about to be redirected).
 */
export function trackBeginCheckout(params: {
  value_naira: number;
  tx_ref?: string;
}): void {
  trackEvent("begin_checkout", {
    value: params.value_naira,
    currency: "NGN",
    transaction_id: params.tx_ref ?? undefined,
  });
}

/**
 * GA4 standard purchase: wallet successfully credited.
 * value = amount actually received (credited), NOT the originally requested
 * amount, so GA's purchase revenue is real money, not intent.
 */
export function trackTopupCompleted(params: {
  value_naira: number;
  tx_ref?: string;
}): void {
  trackEvent("purchase", {
    transaction_id: params.tx_ref ?? undefined,
    value: params.value_naira,
    currency: "NGN",
    payment_type: "wallet_topup",
  });
}

/**
 * Custom: top-up failed (Flutterwave reported failure after redirect back).
 */
export function trackTopupFailed(params: { tx_ref?: string }): void {
  trackEvent("topup_failed", {
    transaction_id: params.tx_ref ?? undefined,
  });
}

/**
 * Custom: partial top-up — amount received < amount expected.
 * Does NOT fire a `purchase` event (wallet was NOT credited), so GA revenue
 * stays accurate. This is the separate custom event for partial transfers.
 */
export function trackTopupPartial(params: {
  expected_naira: number;
  received_naira: number;
  tx_ref?: string;
}): void {
  trackEvent("topup_partial", {
    value_expected: params.expected_naira,
    value_received: params.received_naira,
    transaction_id: params.tx_ref ?? undefined,
    currency: "NGN",
  });
}

// ── Quiz purchase (wallet spend) ──────────────────────────────────────────────

/**
 * GA4 standard: user confirmed the payment banner (about to spend wallet
 * balance). Fires when the confirm button is pressed, before the API call.
 */
export function trackQuizBeginCheckout(params: {
  quiz_id: string;
  quiz_title: string;
  price_kobo: number;
}): void {
  trackEvent("begin_checkout", {
    item_id: params.quiz_id,
    item_name: params.quiz_title,
    value: params.price_kobo / 100,
    currency: "NGN",
    payment_type: "wallet_spend",
  });
}

/**
 * GA4 standard spend_virtual_currency: wallet balance spent to unlock a quiz.
 * GA4 has a built-in standard event for exactly this pattern — virtual
 * currency spend that isn't a real-money card transaction.
 */
export function trackQuizPurchase(params: {
  quiz_id: string;
  quiz_title: string;
  price_kobo: number;
  is_timed: boolean;
}): void {
  trackEvent("spend_virtual_currency", {
    virtual_currency_name: "PrepUniv Credits",
    value: params.price_kobo / 100,
    item_id: params.quiz_id,
    item_name: params.quiz_title,
    is_timed: params.is_timed,
  });
}

// ── Creator economy ───────────────────────────────────────────────────────────

/** Custom: creator submitted application */
export function trackCreatorApplicationSubmitted(): void {
  trackEvent("creator_application_submitted");
}

/**
 * Custom: creator requested a payout.
 * value = amount requested in naira.
 */
export function trackPayoutRequested(params: { value_naira: number }): void {
  trackEvent("payout_requested", {
    value: params.value_naira,
    currency: "NGN",
  });
}

// ── Trust & safety ────────────────────────────────────────────────────────────

/**
 * Custom: user submitted a report against a quiz.
 * reason is tracked (categorical, not free-text) — no PII.
 */
export function trackReportSubmitted(params: {
  quiz_id: string;
  reason: string;
}): void {
  trackEvent("report_submitted", {
    quiz_id: params.quiz_id,
    reason: params.reason,
  });
}

// ── Engagement ────────────────────────────────────────────────────────────────

/**
 * GA4 standard share event.
 * method: "native_share" (Web Share API) | "clipboard_copy"
 */
export function trackShare(params: {
  method: "native_share" | "clipboard_copy";
  item_id: string;
}): void {
  trackEvent("share", {
    method: params.method,
    content_type: "quiz",
    item_id: params.item_id,
  });
}

/** Custom: user granted push notification permission */
export function trackPushNotificationsEnabled(): void {
  trackEvent("push_notifications_enabled");
}

/** Custom: user revoked push notification permission */
export function trackPushNotificationsDisabled(): void {
  trackEvent("push_notifications_disabled");
}

// ─── TypeScript global declarations ──────────────────────────────────────────
// Lets us call window.gtag without @types/gtag.js

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void;
  }
}
