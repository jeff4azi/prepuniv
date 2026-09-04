import { useEffect } from "react";

const SITE_NAME = "PrepUniv";
const DEFAULT_TITLE = `${SITE_NAME} — CBT & Exam Prep for Nigerian Students`;

/**
 * usePageTitle — sets document.title for the current route and resets it on
 * unmount so a stale title never bleeds into the next page.
 *
 * @param title  The page-specific title fragment (e.g. "Browse Quizzes").
 *               Pass `undefined` or `null` while data is still loading —
 *               the tab will show the loading placeholder until the real
 *               title is ready.
 * @param opts.suffix  Override the " | PrepUniv" suffix. Defaults to site name.
 * @param opts.loading Show this string while `title` is undefined/null.
 *                     Defaults to "Loading… | PrepUniv".
 * @param opts.full    Pass `true` to treat `title` as the COMPLETE document
 *                     title (no suffix appended). Useful for the landing page.
 */
export function usePageTitle(
  title: string | null | undefined,
  opts: {
    suffix?: string;
    loading?: string;
    full?: boolean;
  } = {},
): void {
  const {
    suffix = SITE_NAME,
    loading = `Loading… | ${SITE_NAME}`,
    full = false,
  } = opts;

  useEffect(() => {
    if (title == null) {
      document.title = loading;
    } else if (full) {
      document.title = title;
    } else {
      document.title = `${title} | ${suffix}`;
    }

    return () => {
      // Reset to the site default on unmount so the next page starts clean
      // even if its own usePageTitle hasn't fired yet.
      document.title = DEFAULT_TITLE;
    };
  }, [title, suffix, loading, full]);
}
