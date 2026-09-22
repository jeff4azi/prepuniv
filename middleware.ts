/**
 * middleware.ts — Vercel Edge Middleware for Open Graph tag injection
 *
 * Runs at the CDN edge on every request BEFORE Vercel serves a response.
 * For /quiz/:id and /profile/creator/:id:
 *   - If the request is from a social crawler (WhatsApp, Twitter, Discord,
 *     Telegram, iMessage, Slack, LinkedIn, Facebook, etc.) → fetch quiz/creator
 *     data from Supabase and return the page HTML with page-specific OG tags.
 *   - All other requests (real browsers) → pass through untouched via next().
 *     Users are never rerouted anywhere.
 *
 * Runs in the Vercel Edge Runtime (V8 isolate) — uses only Web APIs (fetch,
 * Request, Response, URL). No Node.js, no SDK imports.
 *
 * Vercel picks this file up automatically when it's at the project root.
 * The `config.matcher` below scopes it to only the two route shapes we care about.
 */

export const config = {
  matcher: ["/quiz/:id*", "/profile/creator/:id*"],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const SITE_ORIGIN = "https://www.prepuniv.com";
const SITE_NAME = "PrepUniv";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/PrepUniv.png`;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

// ─── Crawler detection ────────────────────────────────────────────────────────
const CRAWLER_RE =
  /whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|applebot|googlebot|bingbot|duckduckbot|pinterestbot|vkshare|w3c_validator|embedly|quora link preview|rogerbot|showyoubot|outbrain|flipboard|iframely/i;

function isCrawler(ua: string | null): boolean {
  return !!ua && CRAWLER_RE.test(ua);
}

// ─── Supabase REST (plain fetch — no SDK needed at edge) ──────────────────────

async function supabaseGet(table: string, params: Record<string, string>) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function trunc(s: string, max: number) {
  s = (s ?? "").trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

interface OGMeta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
}

function injectOG(html: string, meta: OGMeta): string {
  const replacements: [RegExp, string][] = [
    [/<title>[^<]*<\/title>/i, `<title>${esc(meta.title)}</title>`],
    [
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
      `$1${esc(meta.title)}$2`,
    ],
    [
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/i,
      `$1${esc(meta.description)}$2`,
    ],
    [
      /(<meta\s+property="og:url"\s+content=")[^"]*(")/i,
      `$1${esc(meta.url)}$2`,
    ],
    [
      /(<meta\s+property="og:image"\s+content=")[^"]*(")/i,
      `$1${esc(meta.image)}$2`,
    ],
    [
      /(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/i,
      `$1${esc(meta.imageAlt)}$2`,
    ],
    [
      /(<meta\s+name="description"\s+content=")[^"]*(")/i,
      `$1${esc(meta.description)}$2`,
    ],
    [
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,
      `$1${esc(meta.title)}$2`,
    ],
    [
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i,
      `$1${esc(meta.description)}$2`,
    ],
    [
      /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/i,
      `$1${esc(meta.image)}$2`,
    ],
    [
      /(<meta\s+name="twitter:image:alt"\s+content=")[^"]*(")/i,
      `$1${esc(meta.imageAlt)}$2`,
    ],
    [/(<link\s+rel="canonical"\s+href=")[^"]*(")/i, `$1${esc(meta.url)}$2`],
  ];

  for (const [re, val] of replacements) {
    html = html.replace(re, val);
  }
  return html;
}

// ─── Main middleware ──────────────────────────────────────────────────────────

export default async function middleware(req: Request): Promise<Response> {
  const ua = req.headers.get("user-agent");

  // Non-crawlers: pass through immediately — zero overhead for real users
  if (!isCrawler(ua)) {
    return fetch(req);
  }

  const url = new URL(req.url);
  const { pathname } = url;

  try {
    const quizMatch = /^\/quiz\/([\w-]+)$/.exec(pathname);
    const creatorMatch = /^\/profile\/creator\/([\w-]+)$/.exec(pathname);

    if (!quizMatch && !creatorMatch) return fetch(req);

    let meta: OGMeta | null = null;

    // ── /quiz/:id ────────────────────────────────────────────────────────────
    if (quizMatch) {
      const quiz = await supabaseGet("quizzes", {
        id: `eq.${quizMatch[1]}`,
        is_published: "eq.true",
        unpublished_by_admin: "eq.false",
        select: "id,title,description,creator_id",
        limit: "1",
      });

      if (!quiz) return fetch(req);

      // Use creator avatar as OG image if available
      let image = DEFAULT_IMAGE;
      if (quiz.creator_id) {
        const creator = await supabaseGet("profiles", {
          id: `eq.${quiz.creator_id}`,
          select: "avatar_url",
          limit: "1",
        });
        if (creator?.avatar_url) image = creator.avatar_url;
      }

      meta = {
        title: trunc(`${quiz.title} | ${SITE_NAME}`, 70),
        description: quiz.description
          ? trunc(quiz.description, 200)
          : `Practice quiz on PrepUniv — created and shared by Nigerian students.`,
        image,
        imageAlt: `${quiz.title} — PrepUniv quiz`,
        url: `${SITE_ORIGIN}/quiz/${quiz.id}`,
      };
    }

    // ── /profile/creator/:id ─────────────────────────────────────────────────
    if (creatorMatch) {
      const profile = await supabaseGet("profiles", {
        id: `eq.${creatorMatch[1]}`,
        select:
          "id,full_name,avatar_url,bio,role,is_approved_creator,is_suspended",
        limit: "1",
      });

      if (
        !profile ||
        profile.is_suspended ||
        (!profile.is_approved_creator && profile.role !== "admin")
      ) {
        return fetch(req);
      }

      meta = {
        title: trunc(`${profile.full_name} on ${SITE_NAME}`, 70),
        description: profile.bio
          ? trunc(profile.bio, 200)
          : `Check out ${profile.full_name}'s quizzes on PrepUniv`,
        image: profile.avatar_url || DEFAULT_IMAGE,
        imageAlt: `${profile.full_name} — PrepUniv creator`,
        url: `${SITE_ORIGIN}/profile/creator/${profile.id}`,
      };
    }

    if (!meta) return fetch(req);

    // Fetch the base index.html from Vercel's own CDN
    const indexRes = await fetch(new URL("/index.html", req.url).toString());
    const baseHtml = await indexRes.text();
    const injectedHtml = injectOG(baseHtml, meta);

    return new Response(injectedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-OG-Injected": "true",
      },
    });
  } catch (err) {
    // Any failure → fall through and serve default index.html normally
    console.error("[og-middleware]", err);
    return fetch(req);
  }
}
