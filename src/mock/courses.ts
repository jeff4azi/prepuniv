import type { Course } from "./types";

/**
 * Course catalogue — living list, not static.
 *
 * Initial seed data gives us a base set, but the list grows automatically
 * whenever a creator publishes a quiz for a course that isn't in here yet
 * (see `getOrCreateCourse` below). Admin's role is to *edit/clean up the
 * metadata afterwards* (fix typos, merge duplicates), not gate creation.
 */
export const courses: Course[] = [
  // ── Computer Science ──────────────────────────────────────────────────────
  {
    id: "course_001",
    code: "CSC 122",
    title: "Introduction to Programming",
    subject_area: "Computer Science",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_002",
    code: "CSC 221",
    title: "Data Structures and Algorithms",
    subject_area: "Computer Science",
    level: 200,
    is_computational: true,
  },
  {
    id: "course_003",
    code: "CSC 311",
    title: "Operating Systems",
    subject_area: "Computer Science",
    level: 300,
    is_computational: false,
  },

  // ── General Studies ───────────────────────────────────────────────────────
  {
    id: "course_004",
    code: "GST 121",
    title: "Use of English I",
    subject_area: "General Studies",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_005",
    code: "GST 211",
    title: "Logic and Scientific Reasoning",
    subject_area: "General Studies",
    level: 200,
    is_computational: false,
  },

  // ── Mathematics ───────────────────────────────────────────────────────────
  {
    id: "course_006",
    code: "MTH 101",
    title: "Elementary Mathematics I",
    subject_area: "Mathematics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_007",
    code: "MTH 201",
    title: "Mathematical Methods",
    subject_area: "Mathematics",
    level: 200,
    is_computational: true,
  },

  // ── Economics ─────────────────────────────────────────────────────────────
  {
    id: "course_008",
    code: "ECO 101",
    title: "Introduction to Economics",
    subject_area: "Economics",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_009",
    code: "ECO 301",
    title: "Development Economics",
    subject_area: "Economics",
    level: 300,
    is_computational: false,
  },

  // ── Education ─────────────────────────────────────────────────────────────
  {
    id: "course_010",
    code: "EDU 221",
    title: "Educational Psychology",
    subject_area: "Education",
    level: 200,
    is_computational: false,
  },
  {
    id: "course_011",
    code: "EDU 311",
    title: "Curriculum Theory and Practice",
    subject_area: "Education",
    level: 300,
    is_computational: false,
  },

  // ── Biology ───────────────────────────────────────────────────────────────
  {
    id: "course_012",
    code: "BIO 101",
    title: "General Biology I",
    subject_area: "Biology",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_013",
    code: "BIO 211",
    title: "Cell Biology and Genetics",
    subject_area: "Biology",
    level: 200,
    is_computational: false,
  },

  // ── Physics ───────────────────────────────────────────────────────────────
  {
    id: "course_014",
    code: "PHY 101",
    title: "General Physics I",
    subject_area: "Physics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_015",
    code: "PHY 201",
    title: "Electricity and Magnetism",
    subject_area: "Physics",
    level: 200,
    is_computational: true,
  },

  // ── Chemistry ─────────────────────────────────────────────────────────────
  {
    id: "course_016",
    code: "CHM 101",
    title: "General Chemistry I",
    subject_area: "Chemistry",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_017",
    code: "CHM 211",
    title: "Organic Chemistry I",
    subject_area: "Chemistry",
    level: 200,
    is_computational: true,
  },

  // ── Statistics ────────────────────────────────────────────────────────────
  {
    id: "course_018",
    code: "STA 121",
    title: "Introduction to Statistics",
    subject_area: "Statistics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_019",
    code: "STA 221",
    title: "Probability and Distributions",
    subject_area: "Statistics",
    level: 200,
    is_computational: true,
  },

  // ── History ───────────────────────────────────────────────────────────────
  {
    id: "course_020",
    code: "HIS 101",
    title: "Survey of African History",
    subject_area: "History",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_021",
    code: "HIS 201",
    title: "Nigerian History and Politics",
    subject_area: "History",
    level: 200,
    is_computational: false,
  },
];

/**
 * Prefix-to-subject_area mapping — used in the quiz builder to auto-suggest
 * the subject area when a creator types a course code.
 */
export const COURSE_PREFIX_SUBJECT_AREA: Record<string, string> = {
  CSC: "Computer Science",
  GST: "General Studies",
  MTH: "Mathematics",
  ECO: "Economics",
  EDU: "Education",
  BIO: "Biology",
  PHY: "Physics",
  CHM: "Chemistry",
  STA: "Statistics",
  HIS: "History",
  ENG: "English",
  LAW: "Law",
  MED: "Medicine",
  ACC: "Accounting",
  FIN: "Finance",
  MGT: "Management",
  PSY: "Psychology",
  SOC: "Sociology",
  POL: "Political Science",
  GEO: "Geography",
};

/**
 * Derive a suggested level (100/200/300/400) from the numeric portion of
 * a course code, e.g. "CSC 122" → 100, "MTH 201" → 200.
 * Returns undefined if the code doesn't follow the convention.
 */
export function suggestLevelFromCode(
  code: string,
): 100 | 200 | 300 | 400 | undefined {
  const match = code.match(/\d+/);
  if (!match) return undefined;
  const firstDigit = parseInt(match[0][0], 10);
  if (firstDigit >= 1 && firstDigit <= 4) {
    return (firstDigit * 100) as 100 | 200 | 300 | 400;
  }
  return undefined;
}

function normalizeCode(code: string): string {
  return code.trim().replace(/\s+/g, " ").toUpperCase();
}

// ─── Mock mutation helpers (legacy, backwards compat) ──────────────────────

export function addCourse(course: Course): void {
  courses.push(course);
}

export function updateCourse(updated: Course): void {
  const idx = courses.findIndex((c) => c.id === updated.id);
  if (idx !== -1) courses[idx] = updated;
}

// ─── New dynamic helpers for the living-course paradigm ────────────────────

export interface FindCoursesOptions {
  limit?: number;
  /** Allow caller to exclude the currently-edited course (when creator types
   *  the same code as the one they're editing, we don't want a false "match"). */
  excludeId?: string;
}

/**
 * Fuzzy-search the catalogue from the creator's autocomplete dropdown.
 * Matches against normalized course code or title (case-insensitive substring).
 * Pre-sorts results so code-prefix matches (most common creator workflow)
 * appear before random title substring matches.
 */
export function findCoursesByQuery(
  rawQuery: string,
  opts: FindCoursesOptions = {},
): Course[] {
  const { limit = 8, excludeId } = opts;
  const q = rawQuery.trim().toLowerCase();
  const qNoSpace = q.replace(/\s+/g, "");

  const list = excludeId ? courses.filter((c) => c.id !== excludeId) : courses;

  if (!q) {
    // No query — show most-used first (for now: alphabetical top 8)
    return [...list].sort((a, b) => a.code.localeCompare(b.code)).slice(0, limit);
  }

  const scored: { course: Course; score: number }[] = [];
  for (const c of list) {
    const codeNorm = normalizeCode(c.code);
    const codeNormFlat = codeNorm.replace(/\s+/g, "");
    const titleLow = c.title.toLowerCase();
    const subjectLow = c.subject_area.toLowerCase();

    let score = -Infinity;

    // 1. Exact code match — highest priority
    if (codeNorm === q.toUpperCase().replace(/\s+/g, " ")) score = 10_000;
    // 2. Code starts with the query (e.g. "CSC" matches "CSC 122", "CSC 221"…)
    else if (codeNormFlat.startsWith(qNoSpace)) score = 1000 + 100 / (1 + codeNorm.length);
    // 3. Code contains query as substring
    else if (codeNormFlat.includes(qNoSpace)) score = 500 + 100 / (1 + codeNorm.length);
    // 4. Title starts with query
    else if (titleLow.startsWith(q)) score = 200 + 100 / (1 + c.title.length);
    // 5. Title contains query
    else if (titleLow.includes(q)) score = 100 + 100 / (1 + c.title.length);
    // 6. Subject area contains
    else if (subjectLow.includes(q)) score = 50 + 100 / (1 + c.subject_area.length);

    if (score > -Infinity) scored.push({ course: c, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.course);
}

export interface GetOrCreateCourseInput {
  code: string;
  title?: string;
  subject_area?: string;
  level?: 100 | 200 | 300 | 400;
  /** When matching by code, if a title was already stored but the caller
   *  passes a different non-empty title, should we overwrite the stored one?
   *  Defaults to true for the creator save flow (creator's latest typing wins,
   *  admin can clean up afterwards). */
  mergeTitleOnMatch?: boolean;
}

/**
 * The canonical "find or insert" function for the courses catalogue.
 *
 * Identity rules:
 *   1. If a course with the same normalized code (trimmed, upcased,
 *      collapsed whitespace) already exists → that's the match, use it.
 *   2. Otherwise → create a new Course record and append it to `courses`.
 *
 * This is the single source of truth for both:
 *   - Autocomplete (creator chooses existing → caller should pass that id)
 *   - On-save dedupe (creator typed fresh value → add if new).
 */
export function getOrCreateCourse(input: GetOrCreateCourseInput): Course {
  const codeNorm = normalizeCode(input.code);
  if (!codeNorm) {
    throw new Error("getOrCreateCourse: code is required");
  }

  const existing = courses.find((c) => normalizeCode(c.code) === codeNorm);

  if (existing) {
    if (input.mergeTitleOnMatch !== false) {
      // Merge-in any caller-provided non-empty overrides (creator might have
      // typed a better title; keeps catalogue growing more accurate over time).
      if (input.title && input.title.trim()) existing.title = input.title.trim();
      if (input.subject_area && input.subject_area.trim()) existing.subject_area = input.subject_area.trim();
      if (input.level) existing.level = input.level;
    }
    return existing;
  }

  // ── Create new course ────────────────────────────────────────────────────
  const levelNum: 100 | 200 | 300 | 400 =
    input.level ?? suggestLevelFromCode(codeNorm) ?? 100;
  const prefix = codeNorm.split(/\s+/)[0];
  const subjectGuess =
    input.subject_area?.trim() ||
    (prefix ? COURSE_PREFIX_SUBJECT_AREA[prefix] : undefined) ||
    "General Studies";
  const title = input.title?.trim() || codeNorm;

  // Infer computational default from prefix best-guess (still just default,
  // creator/admin can edit later — but better than always false).
  const computationalPrefixes = ["MTH", "STA", "PHY", "CHM", "CSC"];
  const isComp = computationalPrefixes.includes(prefix);

  const created: Course = {
    id: "course_" + Math.random().toString(36).slice(2, 10),
    code: codeNorm,
    title,
    subject_area: subjectGuess,
    level: levelNum,
    is_computational: isComp,
  };
  courses.push(created);
  return created;
}
