import type { Quiz } from "./types";

type QuizSeed = Omit<Quiz, "description">;

const quizSeeds: QuizSeed[] = [
  // ── CSC 122: Introduction to Programming (3 creators) ────────────────────
  {
    id: "quiz_001",
    creator_id: "creator_001",
    course_id: "course_001", // CSC 122
    title: "CSC 122 — Loops, Arrays & Functions Bootcamp",
    price: 35000,
    is_published: true,
    question_count: 40,
    attempt_count: 2840,
    created_at: "2026-01-15T08:00:00Z",
    time_limit_seconds: 2400, // 40 mins
  },
  {
    id: "quiz_002",
    creator_id: "creator_002",
    course_id: "course_001", // CSC 122
    title: "CSC 122 — Algorithms & Problem Solving Pack",
    price: 20000,
    is_published: true,
    question_count: 28,
    attempt_count: 1920,
    created_at: "2026-02-03T10:30:00Z",
    time_limit_seconds: 1800, // 30 mins
  },
  {
    id: "quiz_003",
    creator_id: "creator_003",
    course_id: "course_001", // CSC 122
    title: "CSC 122 — Quick-Fire Syntax Drills",
    price: 15000,
    is_published: true,
    question_count: 20,
    attempt_count: 1560,
    created_at: "2026-02-18T14:00:00Z",
    time_limit_seconds: 900, // 15 mins
  },

  // ── GST 121: Use of English I (2 creators) ────────────────────────────────
  {
    id: "quiz_004",
    creator_id: "creator_001",
    course_id: "course_004", // GST 121
    title: "GST 121 — Comprehension & Summary Skills",
    price: 8500,
    is_published: true,
    question_count: 40,
    attempt_count: 1450,
    created_at: "2026-05-11T12:00:00Z",
    time_limit_seconds: 3000, // 50 mins
  },
  {
    id: "quiz_005",
    creator_id: "creator_003",
    course_id: "course_004", // GST 121
    title: "GST 121 — Lexis, Structure & Grammar Bootcamp",
    price: 8500,
    is_published: true,
    question_count: 80,
    attempt_count: 1240,
    created_at: "2026-07-14T08:30:00Z",
    time_limit_seconds: 5400, // 90 mins
  },

  // ── MTH 201: Mathematical Methods (2 creators) ────────────────────────────
  {
    id: "quiz_006",
    creator_id: "creator_002",
    course_id: "course_007", // MTH 201
    title: "MTH 201 — Calculus: Limits & Derivatives",
    price: 25000,
    is_published: true,
    question_count: 40,
    attempt_count: 890,
    created_at: "2026-04-18T10:15:00Z",
    time_limit_seconds: 3600, // 60 mins
  },
  {
    id: "quiz_007",
    creator_id: "creator_001",
    course_id: "course_007", // MTH 201
    title: "MTH 201 — Integration & Series",
    price: 45000,
    is_published: true,
    question_count: 35,
    attempt_count: 560,
    created_at: "2026-07-10T15:00:00Z",
    time_limit_seconds: 3000, // 50 mins
  },

  // ── ECO 101: Introduction to Economics (2 creators) ──────────────────────
  {
    id: "quiz_008",
    creator_id: "creator_001",
    course_id: "course_008", // ECO 101
    title: "ECO 101 — Microeconomics: Supply & Demand",
    price: 12000,
    is_published: true,
    question_count: 60,
    attempt_count: 980,
    created_at: "2026-03-12T11:20:00Z",
    time_limit_seconds: 3600, // 60 mins
  },
  {
    id: "quiz_009",
    creator_id: "creator_002",
    course_id: "course_008", // ECO 101
    title: "ECO 101 — Macroeconomics: GDP, Inflation & Fiscal Policy",
    price: 14000,
    is_published: true,
    question_count: 50,
    attempt_count: 540,
    created_at: "2026-05-03T09:45:00Z",
    time_limit_seconds: 3000, // 50 mins
  },

  // ── EDU 221: Educational Psychology ──────────────────────────────────────
  {
    id: "quiz_010",
    creator_id: "creator_003",
    course_id: "course_010", // EDU 221
    title: "EDU 221 — Learning Theories & Motivation",
    price: 19000,
    is_published: true,
    question_count: 32,
    attempt_count: 670,
    created_at: "2026-04-25T15:30:00Z",
    time_limit_seconds: 1800, // 30 mins
  },

  // ── ECO 301: Development Economics ───────────────────────────────────────
  {
    id: "quiz_011",
    creator_id: "creator_001",
    course_id: "course_009", // ECO 301
    title: "ECO 301 — Development Economics: Nigeria Case Studies",
    price: 6000,
    is_published: true,
    question_count: 42,
    attempt_count: 390,
    created_at: "2026-07-05T09:15:00Z",
    time_limit_seconds: 2700, // 45 mins
  },

  // ── STA 121: Introduction to Statistics (2 creators) ─────────────────────
  {
    id: "quiz_012",
    creator_id: "creator_001",
    course_id: "course_018", // STA 121
    title: "STA 121 — Probability & Data Interpretation",
    price: 15000,
    is_published: true,
    question_count: 50,
    attempt_count: 1340,
    created_at: "2026-03-22T16:45:00Z",
    time_limit_seconds: 3600, // 60 mins
  },
  {
    id: "quiz_013",
    creator_id: "creator_003",
    course_id: "course_018", // STA 121
    title: "STA 121 — Descriptive Stats: Mean, Median & Mode",
    price: 11000,
    is_published: true,
    question_count: 30,
    attempt_count: 820,
    created_at: "2026-05-19T14:20:00Z",
    time_limit_seconds: 1800, // 30 mins
  },

  // ── BIO 101: General Biology I (2 creators) ───────────────────────────────
  {
    id: "quiz_014",
    creator_id: "creator_002",
    course_id: "course_012", // BIO 101
    title: "BIO 101 — Cell Structure & Function",
    price: 10000,
    is_published: true,
    question_count: 55,
    attempt_count: 1120,
    created_at: "2026-04-10T13:00:00Z",
    time_limit_seconds: 3300, // 55 mins
  },
  {
    id: "quiz_015",
    creator_id: "creator_003",
    course_id: "course_012", // BIO 101
    title: "BIO 101 — Ecology & Biodiversity",
    price: 45000,
    is_published: true,
    question_count: 36,
    attempt_count: 340,
    created_at: "2026-07-22T10:45:00Z",
    time_limit_seconds: 2400, // 40 mins
  },

  // ── BIO 211: Cell Biology and Genetics ───────────────────────────────────
  {
    id: "quiz_016",
    creator_id: "creator_003",
    course_id: "course_013", // BIO 211
    title: "BIO 211 — Genetics & Mendelian Inheritance",
    price: 16000,
    is_published: true,
    question_count: 45,
    attempt_count: 930,
    created_at: "2026-06-04T11:30:00Z",
    time_limit_seconds: 2700, // 45 mins
  },

  // ── HIS 101: Survey of African History ───────────────────────────────────
  {
    id: "quiz_017",
    creator_id: "creator_002",
    course_id: "course_020", // HIS 101
    title: "HIS 101 — Pre-Colonial Kingdoms to Independence",
    price: 8000,
    is_published: true,
    question_count: 45,
    attempt_count: 760,
    created_at: "2026-04-02T08:30:00Z",
    time_limit_seconds: 2700, // 45 mins
  },

  // ── HIS 201: Nigerian History and Politics ────────────────────────────────
  {
    id: "quiz_018",
    creator_id: "creator_003",
    course_id: "course_021", // HIS 201
    title: "HIS 201 — Civil War, Democracy & Nation-Building",
    price: 7500,
    is_published: true,
    question_count: 40,
    attempt_count: 610,
    created_at: "2026-05-27T08:00:00Z",
    time_limit_seconds: 2400, // 40 mins
  },

  // ── PHY 101: General Physics I (2 creators) ───────────────────────────────
  {
    id: "quiz_019",
    creator_id: "creator_001",
    course_id: "course_014", // PHY 101
    title: "PHY 101 — Mechanics: Forces, Motion & Energy",
    price: 18000,
    is_published: true,
    question_count: 40,
    attempt_count: 1560,
    created_at: "2026-02-18T14:00:00Z",
    time_limit_seconds: 3000, // 50 mins
  },
  {
    id: "quiz_020",
    creator_id: "creator_003",
    course_id: "course_014", // PHY 101
    title: "PHY 101 — Waves, Optics & Modern Physics",
    price: 19000,
    is_published: true,
    question_count: 32,
    attempt_count: 480,
    created_at: "2026-06-28T13:45:00Z",
    time_limit_seconds: 2400, // 40 mins
  },

  // ── PHY 201: Electricity and Magnetism ───────────────────────────────────
  {
    id: "quiz_021",
    creator_id: "creator_002",
    course_id: "course_015", // PHY 201
    title: "PHY 201 — Circuits, Fields & Electromagnetic Induction",
    price: 22000,
    is_published: true,
    question_count: 35,
    attempt_count: 670,
    created_at: "2026-04-25T15:30:00Z",
    time_limit_seconds: 2700, // 45 mins
  },

  // ── CHM 101: General Chemistry I ─────────────────────────────────────────
  {
    id: "quiz_022",
    creator_id: "creator_001",
    course_id: "course_016", // CHM 101
    title: "CHM 101 — Periodic Table & Chemical Bonding",
    price: 13000,
    is_published: true,
    question_count: 38,
    attempt_count: 780,
    created_at: "2026-06-12T16:00:00Z",
    time_limit_seconds: 2400, // 40 mins
  },

  // ── CHM 211: Organic Chemistry I ─────────────────────────────────────────
  {
    id: "quiz_023",
    creator_id: "creator_001",
    course_id: "course_017", // CHM 211
    title: "CHM 211 — Organic Chemistry: Reactions & Nomenclature",
    price: 17000,
    is_published: false,
    question_count: 35,
    attempt_count: 420,
    created_at: "2026-03-01T09:00:00Z",
    time_limit_seconds: 2400, // 40 mins
  },
  {
    id: "quiz_024",
    creator_id: "creator_003",
    course_id: "course_017", // CHM 211
    title: "CHM 211 — Thermodynamics & Equilibrium",
    price: 50000,
    is_published: true,
    question_count: 28,
    attempt_count: 290,
    created_at: "2026-07-26T14:30:00Z",
    time_limit_seconds: 2100, // 35 mins
  },

  // ── MTH 101: Elementary Mathematics I ────────────────────────────────────
  {
    id: "quiz_025",
    creator_id: "creator_002",
    course_id: "course_006", // MTH 101
    title: "MTH 101 — Algebra, Number Theory & Trigonometry",
    price: 5000,
    is_published: true,
    question_count: 25,
    attempt_count: 2100,
    created_at: "2026-06-20T10:00:00Z",
    time_limit_seconds: 1800, // 30 mins
  },

  // ── CSC 221: Data Structures and Algorithms ───────────────────────────────
  {
    id: "quiz_026",
    creator_id: "creator_002",
    course_id: "course_002", // CSC 221
    title: "CSC 221 — Trees, Graphs & Sorting Algorithms",
    price: 22000,
    is_published: false,
    question_count: 30,
    attempt_count: 0,
    created_at: "2026-07-28T14:30:00Z",
    time_limit_seconds: 1800, // 30 mins
  },

  // ── GST 211: Logic and Scientific Reasoning ───────────────────────────────
  {
    id: "quiz_027",
    creator_id: "creator_002",
    course_id: "course_005", // GST 211
    title: "GST 211 — World History: Industrial Revolution & Beyond",
    price: 9500,
    is_published: true,
    question_count: 50,
    attempt_count: 710,
    created_at: "2026-07-18T12:00:00Z",
    time_limit_seconds: 3000, // 50 mins
  },
];

const QUIZ_DESCRIPTIONS: Record<string, string> = {
  quiz_001:
    "Drill loops, arrays, and function definitions through 40 practical coding-concept questions. Built around the exact patterns tested in CSC 122 semester exams — great for final-week revision.",
  quiz_002:
    "Sharpen your algorithmic thinking with 28 curated questions on problem decomposition, pseudocode, and basic complexity. Mirrors the style of CSC 122 CA tests and exams.",
  quiz_003:
    "Twenty fast-paced questions on syntax rules, data types, and control flow. Perfect for a quick pre-exam sweep to lock in the fundamentals before your CSC 122 assessment.",
  quiz_004:
    "Comprehension passages and summary exercises to boost reading speed and accuracy for GST 121. Written by an experienced English lecturer who knows exactly what examiners look for.",
  quiz_005:
    "Grammar bootcamp covering tenses, subject-verb agreement, voice, and sentence structure — 80 questions designed to drill the GST 121 lexis and structure syllabus until it sticks.",
  quiz_006:
    "Limits, continuity, and introductory derivatives with step-by-step style prompts aligned to the MTH 201 course outline. Computational timing applies per question in timed mode.",
  quiz_007:
    "Definite and indefinite integrals, sequences, and series in one focused pack. Advanced topic coverage for MTH 201 students aiming for distinction.",
  quiz_008:
    "Supply, demand, elasticity, and market equilibrium with real-world microeconomics scenarios. Great for building ECO 101 intuition, not just memorising definitions.",
  quiz_009:
    "GDP, inflation, fiscal policy, and monetary tools in macroeconomics. Scenario-based questions help you apply ECO 101 theory to Nigerian and global cases.",
  quiz_010:
    "Learning theories — Piaget, Vygotsky, Skinner, Bandura — and motivation models explained through practice questions. Everything you need for EDU 221 semester exams.",
  quiz_011:
    "Development economics through Nigerian case studies — poverty traps, growth models, SAPs, and policy trade-offs. Highly relevant for ECO 301 exams and essays.",
  quiz_012:
    "Probability, distributions, and data interpretation in one compact pack. Designed for STA 121 students tackling statistics for the first time at university level.",
  quiz_013:
    "Mean, median, mode, variance, and basic data presentation — the descriptive stats foundation every STA 121 student needs before moving to inferential methods.",
  quiz_014:
    "Cell structure, organelles, and biological processes explained through BIO 101 practice questions. Covers both prokaryotic and eukaryotic cells with diagram-style prompts.",
  quiz_015:
    "Ecosystems, biodiversity, and environmental issues with application-focused BIO 101 questions. Comprehensive but concise — ideal for the ecology section of your semester exam.",
  quiz_016:
    "Mendelian genetics, inheritance patterns, and introductory molecular biology. Diagram-based and text-based items included for the BIO 211 genetics module.",
  quiz_017:
    "From pre-colonial kingdoms to independence movements across Africa. HIS 101 essay-style and multiple-choice items test both recall and analytical thinking.",
  quiz_018:
    "Nigeria from the civil war through the return to democracy. HIS 201 context-rich questions that go beyond dates and names to test real understanding.",
  quiz_019:
    "Forces, motion, energy, and momentum — the high-yield PHY 101 mechanics topics. Exam-style questions with calculation and concept items.",
  quiz_020:
    "Light, sound, wave phenomena, and introductory modern physics. PHY 101 questions cover both calculation and conceptual understanding.",
  quiz_021:
    "Electric circuits, fields, and electromagnetic induction — the core topics in PHY 201. High-yield questions that appear every semester.",
  quiz_022:
    "Periodic trends, bonding, and inorganic reactions in a focused 38-question set. Covers the CHM 101 periodic table and chemical bonding modules.",
  quiz_023:
    "Focused drills on organic reactions, nomenclature, and functional groups for CHM 211. Best for students who want targeted practice on the organic section.",
  quiz_024:
    "Thermodynamics laws, enthalpy, and equilibrium basics in CHM 211 physical chemistry. Advanced topic, beginner-friendly explanations in each question stem.",
  quiz_025:
    "Algebra, number theory, and trigonometry fundamentals for MTH 101. An affordable entry-level pack to build confidence before tackling harder MTH topics.",
  quiz_026:
    "Trees, graphs, and sorting algorithms — the CSC 221 data structures topics that most students find hardest. Ideal for CA and exam preparation.",
  quiz_027:
    "Scientific reasoning, logic, and critical thinking exercises for GST 211. Covers argument analysis, hypothesis testing, and evidence evaluation.",
};

export const quizzes: Quiz[] = quizSeeds.map((q) => ({
  ...q,
  description:
    QUIZ_DESCRIPTIONS[q.id] ??
    `A ${q.question_count}-question practice quiz designed to help you ace your course exam.`,
}));

// ─── Mock mutation helpers ────────────────────────────────────────────────────

export function addQuiz(quiz: Quiz): void {
  quizzes.push(quiz);
}

export function updateQuiz(updated: Quiz): void {
  const idx = quizzes.findIndex((q) => q.id === updated.id);
  if (idx !== -1) quizzes[idx] = updated;
}

/** Admin force-unpublishes a quiz. Sets both is_published=false and unpublished_by_admin=true. */
export function adminUnpublishQuiz(quizId: string): void {
  const quiz = quizzes.find((q) => q.id === quizId);
  if (quiz) {
    quiz.is_published = false;
    quiz.unpublished_by_admin = true;
  }
}

/** Admin clears the override and republishes. */
export function adminRepublishQuiz(quizId: string): void {
  const quiz = quizzes.find((q) => q.id === quizId);
  if (quiz) {
    quiz.is_published = true;
    quiz.unpublished_by_admin = false;
  }
}
