import type { CreatorReport } from "./types";

/**
 * Reports filed against quizzes owned by creator_001.
 * Covers all reason types and all status values.
 */
export const creatorReports: CreatorReport[] = [
  // Open — incorrect answers on quiz_001
  {
    id: "cr_001",
    reporter_id: "user_005",
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    reason: "incorrect_answers",
    details:
      'Question 3 — the answer key says "Talkative" for "Garrulous" but the passage context seemed to require "Generous". Could you review?',
    status: "open",
    created_at: "2026-07-22T10:15:00Z",
  },
  // Open — low quality on quiz_004
  {
    id: "cr_002",
    reporter_id: "user_008",
    quiz_id: "quiz_004",
    quiz_title: "JAMB Chemistry — Organic Chemistry Drills",
    reason: "low_quality",
    details:
      "Several questions have ambiguous wording and the options overlap in meaning. Question 5 especially feels like it has two correct answers.",
    status: "open",
    created_at: "2026-07-25T08:40:00Z",
  },
  // Resolved — copyright on quiz_002
  {
    id: "cr_003",
    reporter_id: "user_003",
    quiz_id: "quiz_002",
    quiz_title: "JAMB Mathematics — Problem Solving Pack",
    reason: "copyright",
    details:
      "Questions 12–15 appear to be lifted verbatim from the 2023 JAMB official past questions booklet.",
    status: "resolved",
    created_at: "2026-07-10T14:30:00Z",
    resolved_at: "2026-07-12T11:00:00Z",
  },
  // Dismissed — inappropriate on quiz_005
  {
    id: "cr_004",
    reporter_id: "user_012",
    quiz_id: "quiz_005",
    quiz_title: "Microeconomics — Supply & Demand Essentials",
    reason: "inappropriate",
    details: "One of the scenario questions references a brand name.",
    status: "dismissed",
    created_at: "2026-06-28T16:00:00Z",
    resolved_at: "2026-06-30T09:00:00Z",
  },
  // Open — other on quiz_006
  {
    id: "cr_005",
    reporter_id: "user_009",
    quiz_id: "quiz_006",
    quiz_title: "Introductory Statistics — Probability & Data",
    reason: "other",
    other_text: "Misleading preview description",
    details:
      "The quiz description says it covers probability distributions but most questions are on basic descriptive stats.",
    status: "open",
    created_at: "2026-07-27T09:05:00Z",
  },
  // Resolved — incorrect answers on quiz_003
  {
    id: "cr_006",
    reporter_id: "user_004",
    quiz_id: "quiz_003",
    quiz_title: "JAMB Physics — Mechanics Masterclass",
    reason: "incorrect_answers",
    details:
      "The answer for the Newton's third law question is marked as Second Law — this is incorrect.",
    status: "resolved",
    created_at: "2026-07-05T12:00:00Z",
    resolved_at: "2026-07-07T10:00:00Z",
  },
];
