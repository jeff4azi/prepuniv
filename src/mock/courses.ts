import type { Course } from "./types";

/**
 * Course catalogue for the university.
 * Multiple quizzes can share the same course code — courseCode is a shared tag,
 * not a unique quiz identifier.
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

// ─── Mock mutation helpers ────────────────────────────────────────────────────

export function addCourse(course: Course): void {
  courses.push(course);
}

export function updateCourse(updated: Course): void {
  const idx = courses.findIndex((c) => c.id === updated.id);
  if (idx !== -1) courses[idx] = updated;
}
