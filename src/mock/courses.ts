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
    department: "Computer Science",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_002",
    code: "CSC 221",
    title: "Data Structures and Algorithms",
    department: "Computer Science",
    level: 200,
    is_computational: true,
  },
  {
    id: "course_003",
    code: "CSC 311",
    title: "Operating Systems",
    department: "Computer Science",
    level: 300,
    is_computational: false,
  },

  // ── General Studies ───────────────────────────────────────────────────────
  {
    id: "course_004",
    code: "GST 121",
    title: "Use of English I",
    department: "General Studies",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_005",
    code: "GST 211",
    title: "Logic and Scientific Reasoning",
    department: "General Studies",
    level: 200,
    is_computational: false,
  },

  // ── Mathematics ───────────────────────────────────────────────────────────
  {
    id: "course_006",
    code: "MTH 101",
    title: "Elementary Mathematics I",
    department: "Mathematics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_007",
    code: "MTH 201",
    title: "Mathematical Methods",
    department: "Mathematics",
    level: 200,
    is_computational: true,
  },

  // ── Economics ─────────────────────────────────────────────────────────────
  {
    id: "course_008",
    code: "ECO 101",
    title: "Introduction to Economics",
    department: "Economics",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_009",
    code: "ECO 301",
    title: "Development Economics",
    department: "Economics",
    level: 300,
    is_computational: false,
  },

  // ── Education ─────────────────────────────────────────────────────────────
  {
    id: "course_010",
    code: "EDU 221",
    title: "Educational Psychology",
    department: "Education",
    level: 200,
    is_computational: false,
  },
  {
    id: "course_011",
    code: "EDU 311",
    title: "Curriculum Theory and Practice",
    department: "Education",
    level: 300,
    is_computational: false,
  },

  // ── Biology ───────────────────────────────────────────────────────────────
  {
    id: "course_012",
    code: "BIO 101",
    title: "General Biology I",
    department: "Biology",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_013",
    code: "BIO 211",
    title: "Cell Biology and Genetics",
    department: "Biology",
    level: 200,
    is_computational: false,
  },

  // ── Physics ───────────────────────────────────────────────────────────────
  {
    id: "course_014",
    code: "PHY 101",
    title: "General Physics I",
    department: "Physics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_015",
    code: "PHY 201",
    title: "Electricity and Magnetism",
    department: "Physics",
    level: 200,
    is_computational: true,
  },

  // ── Chemistry ─────────────────────────────────────────────────────────────
  {
    id: "course_016",
    code: "CHM 101",
    title: "General Chemistry I",
    department: "Chemistry",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_017",
    code: "CHM 211",
    title: "Organic Chemistry I",
    department: "Chemistry",
    level: 200,
    is_computational: true,
  },

  // ── Statistics ────────────────────────────────────────────────────────────
  {
    id: "course_018",
    code: "STA 121",
    title: "Introduction to Statistics",
    department: "Statistics",
    level: 100,
    is_computational: true,
  },
  {
    id: "course_019",
    code: "STA 221",
    title: "Probability and Distributions",
    department: "Statistics",
    level: 200,
    is_computational: true,
  },

  // ── History ───────────────────────────────────────────────────────────────
  {
    id: "course_020",
    code: "HIS 101",
    title: "Survey of African History",
    department: "History",
    level: 100,
    is_computational: false,
  },
  {
    id: "course_021",
    code: "HIS 201",
    title: "Nigerian History and Politics",
    department: "History",
    level: 200,
    is_computational: false,
  },
];

/**
 * Prefix-to-department mapping — used in the quiz builder to auto-suggest
 * the department when a creator types a course code.
 */
export const COURSE_PREFIX_DEPARTMENT: Record<string, string> = {
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
