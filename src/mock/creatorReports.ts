import type { CreatorReport } from "./types";

/**
 * Admin-visible reports filed against quizzes on the platform.
 * Mix of open/resolved/dismissed, varied reasons, multiple quizzes/creators.
 * reporter_id "user_009" has 3 reports this month — used to demo the
 * repeat-reporter pattern.
 */
export const creatorReports: CreatorReport[] = [
  // ── Open ──────────────────────────────────────────────────────────────────

  // quiz_004 (creator_001) — incorrect answers
  {
    id: "cr_001",
    reporter_id: "user_005",
    quiz_id: "quiz_004",
    quiz_title: "GST 121 — Comprehension & Summary Skills",
    reason: "incorrect_answers",
    details:
      'Question 3 — the answer key marks "concise" as the only correct answer for the opposite of "verbose", but "brief" and "terse" are equally valid. Could you review?',
    status: "open",
    created_at: "2026-07-22T10:15:00Z",
  },

  // quiz_023 (creator_001) — low quality
  {
    id: "cr_002",
    reporter_id: "user_008",
    quiz_id: "quiz_023",
    quiz_title: "CHM 211 — Organic Chemistry: Reactions & Nomenclature",
    reason: "low_quality",
    details:
      "Several questions have ambiguous wording and the options overlap in meaning. Question 5 especially feels like it has two correct answers.",
    status: "open",
    created_at: "2026-07-25T08:40:00Z",
  },

  // quiz_012 (creator_001) — misleading description (user_009 report #1)
  {
    id: "cr_005",
    reporter_id: "user_009",
    quiz_id: "quiz_012",
    quiz_title: "STA 121 — Probability & Data Interpretation",
    reason: "other",
    other_text: "Misleading preview description",
    details:
      "The quiz description says it covers probability distributions but most questions are on basic descriptive statistics.",
    status: "open",
    created_at: "2026-07-27T09:05:00Z",
  },

  // quiz_006 (creator_002) — incorrect answers, different creator
  {
    id: "cr_007",
    reporter_id: "user_011",
    quiz_id: "quiz_006",
    quiz_title: "MTH 201 — Calculus: Limits & Derivatives",
    reason: "incorrect_answers",
    details:
      "Question 7: the derivative of sin(x) is marked as -cos(x) but the correct answer is cos(x). This is a fundamental error that would mislead students.",
    status: "open",
    created_at: "2026-07-26T14:00:00Z",
  },

  // quiz_025 (creator_002) — copyright
  {
    id: "cr_008",
    reporter_id: "user_009", // user_009 report #2 (same month)
    quiz_id: "quiz_025",
    quiz_title: "MTH 101 — Algebra, Number Theory & Trigonometry",
    reason: "copyright",
    details:
      "At least 6 questions in this quiz appear verbatim in the official NOUN MTH 101 course material. This seems to be lifted without transformation.",
    status: "open",
    created_at: "2026-07-28T07:30:00Z",
  },

  // quiz_019 (creator_001) — inappropriate (user_009 report #3)
  {
    id: "cr_009",
    reporter_id: "user_009", // user_009 report #3 (repeat reporter!)
    quiz_id: "quiz_019",
    quiz_title: "PHY 101 — Mechanics: Forces, Motion & Energy",
    reason: "inappropriate",
    details:
      "A scenario question in this quiz uses an example involving violence that I found inappropriate for an academic platform.",
    status: "open",
    created_at: "2026-07-28T11:15:00Z",
  },

  // quiz_002 (creator_002) — low quality
  {
    id: "cr_010",
    reporter_id: "user_013",
    quiz_id: "quiz_002",
    quiz_title: "CSC 122 — Algorithms & Problem Solving Pack",
    reason: "low_quality",
    details:
      "The quiz only has 10 unique questions even though it advertises 28. Several appear to be duplicates with slightly reworded phrasing.",
    status: "open",
    created_at: "2026-07-29T08:00:00Z",
  },

  // ── Resolved ──────────────────────────────────────────────────────────────

  // quiz_001 (creator_001) — copyright
  {
    id: "cr_003",
    reporter_id: "user_003",
    quiz_id: "quiz_001",
    quiz_title: "CSC 122 — Loops, Arrays & Functions Bootcamp",
    reason: "copyright",
    details:
      "Questions 12–15 appear to be lifted verbatim from a published textbook on introductory programming.",
    status: "resolved",
    created_at: "2026-07-10T14:30:00Z",
    resolved_at: "2026-07-12T11:00:00Z",
  },

  // quiz_019 (creator_001) — incorrect answers
  {
    id: "cr_006",
    reporter_id: "user_004",
    quiz_id: "quiz_019",
    quiz_title: "PHY 101 — Mechanics: Forces, Motion & Energy",
    reason: "incorrect_answers",
    details:
      "The answer for the Newton's third law question is marked as Second Law — this is incorrect.",
    status: "resolved",
    created_at: "2026-07-05T12:00:00Z",
    resolved_at: "2026-07-07T10:00:00Z",
  },

  // quiz_014 (creator_002) — incorrect answers
  {
    id: "cr_011",
    reporter_id: "user_006",
    quiz_id: "quiz_014",
    quiz_title: "BIO 101 — Cell Structure & Function",
    reason: "incorrect_answers",
    details:
      "Question 4 states the ribosome is responsible for energy production — this is incorrect, that is the mitochondria. Marked incorrect answer is misleading students.",
    status: "resolved",
    created_at: "2026-06-18T09:00:00Z",
    resolved_at: "2026-06-20T10:00:00Z",
  },

  // ── Dismissed ─────────────────────────────────────────────────────────────

  // quiz_008 (creator_001) — inappropriate
  {
    id: "cr_004",
    reporter_id: "user_012",
    quiz_id: "quiz_008",
    quiz_title: "ECO 101 — Microeconomics: Supply & Demand",
    reason: "inappropriate",
    details: "One of the scenario questions references a specific brand name.",
    status: "dismissed",
    created_at: "2026-06-28T16:00:00Z",
    resolved_at: "2026-06-30T09:00:00Z",
  },

  // quiz_005 (creator_003) — low quality
  {
    id: "cr_012",
    reporter_id: "user_007",
    quiz_id: "quiz_005",
    quiz_title: "GST 121 — Lexis, Structure & Grammar Bootcamp",
    reason: "low_quality",
    details:
      "The fill-in-blank answers are too strict — natural synonyms are rejected. This feels like a grading flaw, not genuine low quality.",
    status: "dismissed",
    created_at: "2026-07-01T11:00:00Z",
    resolved_at: "2026-07-02T09:00:00Z",
  },
];

/**
 * Update a report's status plus optional resolution notes and timestamp.
 */
export function updateCreatorReport(
  id: string,
  status: CreatorReport["status"],
  notes?: string,
): void {
  const report = creatorReports.find((r) => r.id === id);
  if (report) {
    report.status = status;
    report.resolved_at = new Date().toISOString();
    // Store notes in other_text field if provided (re-using existing schema)
    if (notes)
      report.other_text =
        (report.other_text ? report.other_text + " | Admin: " : "Admin: ") +
        notes;
  }
}
