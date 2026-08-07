import type { Course } from "./types";

/**
 * Course catalogue — living list, not static.
 *
 * Each course is scoped to a specific university. Courses with the same code
 * at different universities are independent records.
 *
 * The list grows automatically whenever a creator publishes a quiz for a course
 * that isn't in here yet (see `getOrCreateCourse` below).
 */
export const courses: Course[] = [
  // ── UNILAG (uni_001) ──────────────────────────────────────────────────────

  // Computer Science
  {
    id: "course_001",
    code: "CSC 122",
    title: "Introduction to Programming",
    subject_area: "Computer Science",
    level: 100,
    is_computational: true,
    university_id: "uni_001",
  },
  {
    id: "course_002",
    code: "CSC 221",
    title: "Data Structures and Algorithms",
    subject_area: "Computer Science",
    level: 200,
    is_computational: true,
    university_id: "uni_001",
  },
  {
    id: "course_003",
    code: "CSC 311",
    title: "Operating Systems",
    subject_area: "Computer Science",
    level: 300,
    is_computational: false,
    university_id: "uni_001",
  },

  // General Studies
  {
    id: "course_004",
    code: "GST 121",
    title: "Use of English I",
    subject_area: "General Studies",
    level: 100,
    is_computational: false,
    university_id: "uni_001",
  },
  {
    id: "course_005",
    code: "GST 211",
    title: "Logic and Scientific Reasoning",
    subject_area: "General Studies",
    level: 200,
    is_computational: false,
    university_id: "uni_001",
  },

  // Economics
  {
    id: "course_008",
    code: "ECO 101",
    title: "Introduction to Economics",
    subject_area: "Economics",
    level: 100,
    is_computational: false,
    university_id: "uni_001",
  },
  {
    id: "course_009",
    code: "ECO 301",
    title: "Development Economics",
    subject_area: "Economics",
    level: 300,
    is_computational: false,
    university_id: "uni_001",
  },

  // Biology
  {
    id: "course_012",
    code: "BIO 101",
    title: "General Biology I",
    subject_area: "Biology",
    level: 100,
    is_computational: false,
    university_id: "uni_001",
  },
  {
    id: "course_013",
    code: "BIO 211",
    title: "Cell Biology and Genetics",
    subject_area: "Biology",
    level: 200,
    is_computational: false,
    university_id: "uni_001",
  },

  // History
  {
    id: "course_020",
    code: "HIS 101",
    title: "Survey of African History",
    subject_area: "History",
    level: 100,
    is_computational: false,
    university_id: "uni_001",
  },
  {
    id: "course_021",
    code: "HIS 201",
    title: "Nigerian History and Politics",
    subject_area: "History",
    level: 200,
    is_computational: false,
    university_id: "uni_001",
  },

  // Chemistry
  {
    id: "course_016",
    code: "CHM 101",
    title: "General Chemistry I",
    subject_area: "Chemistry",
    level: 100,
    is_computational: true,
    university_id: "uni_001",
  },
  {
    id: "course_017",
    code: "CHM 211",
    title: "Organic Chemistry I",
    subject_area: "Chemistry",
    level: 200,
    is_computational: true,
    university_id: "uni_001",
  },

  // ── ABU (uni_002) ─────────────────────────────────────────────────────────

  // Mathematics
  {
    id: "course_006",
    code: "MTH 101",
    title: "Elementary Mathematics I",
    subject_area: "Mathematics",
    level: 100,
    is_computational: true,
    university_id: "uni_002",
  },
  {
    id: "course_007",
    code: "MTH 201",
    title: "Mathematical Methods",
    subject_area: "Mathematics",
    level: 200,
    is_computational: true,
    university_id: "uni_002",
  },

  // Physics
  {
    id: "course_014",
    code: "PHY 101",
    title: "General Physics I",
    subject_area: "Physics",
    level: 100,
    is_computational: true,
    university_id: "uni_002",
  },
  {
    id: "course_015",
    code: "PHY 201",
    title: "Electricity and Magnetism",
    subject_area: "Physics",
    level: 200,
    is_computational: true,
    university_id: "uni_002",
  },

  // Statistics
  {
    id: "course_018",
    code: "STA 121",
    title: "Introduction to Statistics",
    subject_area: "Statistics",
    level: 100,
    is_computational: true,
    university_id: "uni_002",
  },
  {
    id: "course_019",
    code: "STA 221",
    title: "Probability and Distributions",
    subject_area: "Statistics",
    level: 200,
    is_computational: true,
    university_id: "uni_002",
  },

  // General Studies (ABU)
  {
    id: "course_abu_gst",
    code: "GST 101",
    title: "Communication in English",
    subject_area: "General Studies",
    level: 100,
    is_computational: false,
    university_id: "uni_002",
  },

  // ── UNN (uni_003) ─────────────────────────────────────────────────────────

  // Education
  {
    id: "course_010",
    code: "EDU 221",
    title: "Educational Psychology",
    subject_area: "Education",
    level: 200,
    is_computational: false,
    university_id: "uni_003",
  },
  {
    id: "course_011",
    code: "EDU 311",
    title: "Curriculum Theory and Practice",
    subject_area: "Education",
    level: 300,
    is_computational: false,
    university_id: "uni_003",
  },

  // Computer Science (UNN)
  {
    id: "course_unn_csc",
    code: "CSC 101",
    title: "Introduction to Computing",
    subject_area: "Computer Science",
    level: 100,
    is_computational: true,
    university_id: "uni_003",
  },

  // Biology (UNN)
  {
    id: "course_unn_bio",
    code: "BIO 301",
    title: "Molecular Biology",
    subject_area: "Biology",
    level: 300,
    is_computational: false,
    university_id: "uni_003",
  },

  // Economics (UNN)
  {
    id: "course_unn_eco",
    code: "ECO 201",
    title: "Intermediate Microeconomics",
    subject_area: "Economics",
    level: 200,
    is_computational: false,
    university_id: "uni_003",
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

// ─── Mock mutation helpers ────────────────────────────────────────────────────

export function addCourse(course: Course): void {
  courses.push(course);
}

export function updateCourse(updated: Course): void {
  const idx = courses.findIndex((c) => c.id === updated.id);
  if (idx !== -1) courses[idx] = updated;
}

// ─── Dynamic helpers for the living-course paradigm ──────────────────────────

export interface FindCoursesOptions {
  limit?: number;
  excludeId?: string;
  /** Only return courses belonging to this university */
  university_id?: string;
}

/**
 * Fuzzy-search the catalogue from the creator's autocomplete dropdown.
 * When university_id is provided, only courses from that university are returned.
 */
export function findCoursesByQuery(
  rawQuery: string,
  opts: FindCoursesOptions = {},
): Course[] {
  const { limit = 8, excludeId, university_id } = opts;
  const q = rawQuery.trim().toLowerCase();
  const qNoSpace = q.replace(/\s+/g, "");

  let list = excludeId ? courses.filter((c) => c.id !== excludeId) : courses;
  if (university_id) {
    list = list.filter((c) => c.university_id === university_id);
  }

  if (!q) {
    return [...list]
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(0, limit);
  }

  const scored: { course: Course; score: number }[] = [];
  for (const c of list) {
    const codeNorm = normalizeCode(c.code);
    const codeNormFlat = codeNorm.replace(/\s+/g, "");
    const titleLow = c.title.toLowerCase();
    const subjectLow = c.subject_area.toLowerCase();

    let score = -Infinity;

    if (codeNorm === q.toUpperCase().replace(/\s+/g, " ")) score = 10_000;
    else if (codeNormFlat.startsWith(qNoSpace))
      score = 1000 + 100 / (1 + codeNorm.length);
    else if (codeNormFlat.includes(qNoSpace))
      score = 500 + 100 / (1 + codeNorm.length);
    else if (titleLow.startsWith(q)) score = 200 + 100 / (1 + c.title.length);
    else if (titleLow.includes(q)) score = 100 + 100 / (1 + c.title.length);
    else if (subjectLow.includes(q))
      score = 50 + 100 / (1 + c.subject_area.length);

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
  /** University this course belongs to — required for proper scoping */
  university_id: string;
  mergeTitleOnMatch?: boolean;
}

/**
 * Find-or-insert for the courses catalogue, scoped to a university.
 * Two courses with the same code at different universities are separate records.
 */
export function getOrCreateCourse(input: GetOrCreateCourseInput): Course {
  const codeNorm = normalizeCode(input.code);
  if (!codeNorm) {
    throw new Error("getOrCreateCourse: code is required");
  }

  const existing = courses.find(
    (c) =>
      normalizeCode(c.code) === codeNorm &&
      c.university_id === input.university_id,
  );

  if (existing) {
    if (input.mergeTitleOnMatch !== false) {
      if (input.title && input.title.trim())
        existing.title = input.title.trim();
      if (input.subject_area && input.subject_area.trim())
        existing.subject_area = input.subject_area.trim();
      if (input.level) existing.level = input.level;
    }
    return existing;
  }

  const levelNum: 100 | 200 | 300 | 400 =
    input.level ?? suggestLevelFromCode(codeNorm) ?? 100;
  const prefix = codeNorm.split(/\s+/)[0];
  const subjectGuess =
    input.subject_area?.trim() ||
    (prefix ? COURSE_PREFIX_SUBJECT_AREA[prefix] : undefined) ||
    "General Studies";
  const title = input.title?.trim() || codeNorm;

  const computationalPrefixes = ["MTH", "STA", "PHY", "CHM", "CSC"];
  const isComp = computationalPrefixes.includes(prefix);

  const created: Course = {
    id: "course_" + Math.random().toString(36).slice(2, 10),
    code: codeNorm,
    title,
    subject_area: subjectGuess,
    level: levelNum,
    is_computational: isComp,
    university_id: input.university_id,
  };
  courses.push(created);
  return created;
}
