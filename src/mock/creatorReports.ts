import type { CreatorReport } from "./types";

/**
 * Reports filed against quizzes owned by creator_001.
 * Covers all reason types and all status values.
 */
export const creatorReports: CreatorReport[] = [
  // Open — incorrect answers on quiz_004 (GST 121)
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
  // Open — low quality on quiz_023 (CHM 211)
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
  // Resolved — copyright on quiz_001 (CSC 122)
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
  // Dismissed — inappropriate on quiz_008 (ECO 101)
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
  // Open — misleading description on quiz_012 (STA 121)
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
  // Resolved — incorrect answers on quiz_019 (PHY 101)
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
];
