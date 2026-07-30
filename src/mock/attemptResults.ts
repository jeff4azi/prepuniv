import type { AttemptResultRecord } from "./types";

/**
 * Seeded full attempt results — used when revisiting /attempt/:id/result
 * after a refresh (no route state available).  Each record corresponds to
 * one of the QuizAttempts in quizAttempts.ts.
 */
export const attemptResults: AttemptResultRecord[] = [
  // ── attempt_001 : user_001, quiz_001 (English), score 72%, timed ──────────
  {
    attempt_id: "attempt_001",
    user_id: "user_001",
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    is_timed: true,
    score: 72,
    total: 8,
    started_at: "2026-07-12T09:16:00Z",
    completed_at: "2026-07-12T10:56:00Z",
    answers: [
      {
        question_id: "q001_01",
        given: "was",
        correct: "was",
        is_correct: true,
      },
      {
        question_id: "q001_02",
        given: "Metaphor",
        correct: "Metaphor",
        is_correct: true,
      },
      {
        question_id: "q001_03",
        given: "Silent",
        correct: "Talkative",
        is_correct: false,
      },
      {
        question_id: "q001_04",
        given: "descriptions",
        correct: "description|descriptions",
        is_correct: true,
      },
      {
        question_id: "q001_05",
        given: "They were going to the market.",
        correct: "They were going to the market.",
        is_correct: true,
      },
      {
        question_id: "q001_06",
        given: "Lasting",
        correct: "Short-lived",
        is_correct: false,
      },
      {
        question_id: "q001_07",
        given: "curricula",
        correct: "curricula|curriculums",
        is_correct: true,
      },
      {
        question_id: "q001_08",
        given: "The book was read by John.",
        correct: "The book was read by John.",
        is_correct: true,
      },
    ],
  },

  // ── attempt_002 : user_001, quiz_001 (English), score 81%, timed ──────────
  {
    attempt_id: "attempt_002",
    user_id: "user_001",
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    is_timed: true,
    score: 88,
    total: 8,
    started_at: "2026-07-14T18:00:00Z",
    completed_at: "2026-07-14T19:35:00Z",
    answers: [
      {
        question_id: "q001_01",
        given: "was",
        correct: "was",
        is_correct: true,
      },
      {
        question_id: "q001_02",
        given: "Metaphor",
        correct: "Metaphor",
        is_correct: true,
      },
      {
        question_id: "q001_03",
        given: "Talkative",
        correct: "Talkative",
        is_correct: true,
      },
      {
        question_id: "q001_04",
        given: "description",
        correct: "description|descriptions",
        is_correct: true,
      },
      {
        question_id: "q001_05",
        given: "They were going to the market.",
        correct: "They were going to the market.",
        is_correct: true,
      },
      {
        question_id: "q001_06",
        given: "Short-lived",
        correct: "Short-lived",
        is_correct: true,
      },
      {
        question_id: "q001_07",
        given: "curriculums",
        correct: "curricula|curriculums",
        is_correct: true,
      },
      {
        question_id: "q001_08",
        given: "He ate the food.",
        correct: "The book was read by John.",
        is_correct: false,
      },
    ],
  },

  // ── attempt_003 : user_001, quiz_003 (Physics), score 65%, timed ──────────
  {
    attempt_id: "attempt_003",
    user_id: "user_001",
    quiz_id: "quiz_003",
    quiz_title: "JAMB Physics — Mechanics Masterclass",
    is_timed: true,
    score: 63,
    total: 8,
    started_at: "2026-07-15T15:00:00Z",
    completed_at: "2026-07-15T15:50:00Z",
    answers: [
      {
        question_id: "q003_01",
        given: "4 m/s²",
        correct: "4 m/s²",
        is_correct: true,
      },
      {
        question_id: "q003_02",
        given: "Second law",
        correct: "Third law",
        is_correct: false,
      },
      {
        question_id: "q003_03",
        given: "newton",
        correct: "newton|Newton|N",
        is_correct: true,
      },
      {
        question_id: "q003_04",
        given: "4 m/s²",
        correct: "4 m/s²",
        is_correct: true,
      },
      {
        question_id: "q003_05",
        given: "mgh",
        correct: "½mv²",
        is_correct: false,
      },
      {
        question_id: "q003_06",
        given: "10",
        correct: "10|9.8|9.81",
        is_correct: true,
      },
      {
        question_id: "q003_07",
        given: "Both momentum and kinetic energy",
        correct: "Both momentum and kinetic energy",
        is_correct: true,
      },
      {
        question_id: "q003_08",
        given: "Zero",
        correct: "Equal to the horizontal component",
        is_correct: false,
      },
    ],
  },

  // ── attempt_004 : user_001, quiz_005 (Microeconomics), score 88%, timed ───
  {
    attempt_id: "attempt_004",
    user_id: "user_001",
    quiz_id: "quiz_005",
    quiz_title: "Microeconomics — Supply & Demand Essentials",
    is_timed: true,
    score: 88,
    total: 8,
    started_at: "2026-07-18T07:30:00Z",
    completed_at: "2026-07-18T08:25:00Z",
    answers: [
      {
        question_id: "q005_01",
        given: "Negative correlation",
        correct: "Negative correlation",
        is_correct: true,
      },
      {
        question_id: "q005_02",
        given: "% change in quantity ÷ % change in price",
        correct: "% change in quantity ÷ % change in price",
        is_correct: true,
      },
      {
        question_id: "q005_03",
        given: "monopoly",
        correct: "monopoly",
        is_correct: true,
      },
      {
        question_id: "q005_04",
        given:
          "Marginal utility eventually decreases as more units are consumed",
        correct:
          "Marginal utility eventually decreases as more units are consumed",
        is_correct: true,
      },
      { question_id: "q005_05", given: "1", correct: "0", is_correct: false },
      {
        question_id: "q005_06",
        given: "equilibrium",
        correct: "equilibrium",
        is_correct: true,
      },
      {
        question_id: "q005_07",
        given: "Can replace another good",
        correct: "Can replace another good",
        is_correct: true,
      },
      {
        question_id: "q005_08",
        given: "Price takers",
        correct: "Price takers",
        is_correct: true,
      },
    ],
  },

  // ── attempt_005 : user_001, quiz_002 (Maths), score 54%, timed ────────────
  {
    attempt_id: "attempt_005",
    user_id: "user_001",
    quiz_id: "quiz_002",
    quiz_title: "JAMB Mathematics — Problem Solving Pack",
    is_timed: true,
    score: 50,
    total: 8,
    started_at: "2026-07-23T13:00:00Z",
    completed_at: "2026-07-23T14:05:00Z",
    answers: [
      { question_id: "q002_01", given: "x³", correct: "x⁴", is_correct: false },
      {
        question_id: "q002_02",
        given: "720°",
        correct: "720°",
        is_correct: true,
      },
      {
        question_id: "q002_03",
        given: "0.5",
        correct: "0.5|1/2",
        is_correct: true,
      },
      { question_id: "q002_04", given: "3", correct: "4", is_correct: false },
      { question_id: "q002_05", given: "36", correct: "36", is_correct: true },
      {
        question_id: "q002_06",
        given: "150",
        correct: "154",
        is_correct: false,
      },
      { question_id: "q002_07", given: "29", correct: "29", is_correct: true },
      { question_id: "q002_08", given: "9", correct: "11", is_correct: false },
    ],
  },

  // ── attempt_101 : creator_001, quiz_001, score 96%, untimed ───────────────
  {
    attempt_id: "attempt_101",
    user_id: "creator_001",
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    is_timed: false,
    score: 88,
    total: 8,
    started_at: "2026-07-08T09:00:00Z",
    completed_at: "2026-07-08T10:20:00Z",
    answers: [
      {
        question_id: "q001_01",
        given: "was",
        correct: "was",
        is_correct: true,
      },
      {
        question_id: "q001_02",
        given: "Metaphor",
        correct: "Metaphor",
        is_correct: true,
      },
      {
        question_id: "q001_03",
        given: "Talkative",
        correct: "Talkative",
        is_correct: true,
      },
      {
        question_id: "q001_04",
        given: "description",
        correct: "description|descriptions",
        is_correct: true,
      },
      {
        question_id: "q001_05",
        given: "They were going to the market.",
        correct: "They were going to the market.",
        is_correct: true,
      },
      {
        question_id: "q001_06",
        given: "Short-lived",
        correct: "Short-lived",
        is_correct: true,
      },
      {
        question_id: "q001_07",
        given: "curricula",
        correct: "curricula|curriculums",
        is_correct: true,
      },
      {
        question_id: "q001_08",
        given: "She wrote the letter.",
        correct: "The book was read by John.",
        is_correct: false,
      },
    ],
  },

  // ── attempt_201 : admin_001, quiz_001, score 88%, timed ───────────────────
  {
    attempt_id: "attempt_201",
    user_id: "admin_001",
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    is_timed: true,
    score: 88,
    total: 8,
    started_at: "2026-07-16T10:00:00Z",
    completed_at: "2026-07-16T11:45:00Z",
    answers: [
      {
        question_id: "q001_01",
        given: "was",
        correct: "was",
        is_correct: true,
      },
      {
        question_id: "q001_02",
        given: "Simile",
        correct: "Metaphor",
        is_correct: false,
      },
      {
        question_id: "q001_03",
        given: "Talkative",
        correct: "Talkative",
        is_correct: true,
      },
      {
        question_id: "q001_04",
        given: "description",
        correct: "description|descriptions",
        is_correct: true,
      },
      {
        question_id: "q001_05",
        given: "They were going to the market.",
        correct: "They were going to the market.",
        is_correct: true,
      },
      {
        question_id: "q001_06",
        given: "Short-lived",
        correct: "Short-lived",
        is_correct: true,
      },
      {
        question_id: "q001_07",
        given: "curricula",
        correct: "curricula|curriculums",
        is_correct: true,
      },
      {
        question_id: "q001_08",
        given: "The book was read by John.",
        correct: "The book was read by John.",
        is_correct: true,
      },
    ],
  },
];

// ── quiz_001 additional attempt results (for analytics per-question data) ────
// q001_03 (Garrulous) and q001_06 (Ephemeral) are the hard questions —
// most learners get them wrong, so they'll surface as "Needs review".
const q1AnswerSets: Array<[string, string, boolean][]> = [
  // attempt_q1_a — score 38 (3/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Simile", false],
    ["q001_03", "Silent", false],
    ["q001_04", "descriptions", true],
    ["q001_05", "He ate the food.", false],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "The cat chased the mouse.", false],
  ],
  // attempt_q1_b — score 55 (4/8 → mapped from 55%)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Silent", false],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_c — score 75 (6/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curriculums", true],
    ["q001_08", "He ate the food.", false],
  ],
  // attempt_q1_d — score 88 (7/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curricula", true],
    ["q001_08", "He ate the food.", false],
  ],
  // attempt_q1_e — score 25 (2/8)
  [
    ["q001_01", "were", false],
    ["q001_02", "Simile", false],
    ["q001_03", "Silent", false],
    ["q001_04", "description", true],
    ["q001_05", "He don't know the answer.", false],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_f — score 63 (5/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Silent", false],
    ["q001_04", "descriptions", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_g — score 50 (4/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Simile", false],
    ["q001_03", "Silent", false],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "He ate the food.", false],
  ],
  // attempt_q1_h — score 100 (8/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curricula", true],
    ["q001_08", "The book was read by John.", true],
  ],
  // attempt_q1_i — score 75 (6/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_j — score 63 (5/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Silent", false],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_k — score 88 (7/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curriculums", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_l — score 38 (3/8)
  [
    ["q001_01", "were", false],
    ["q001_02", "Simile", false],
    ["q001_03", "Silent", false],
    ["q001_04", "descriptions", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "He ate the food.", false],
  ],
  // attempt_q1_m — score 50 (4/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Simile", false],
    ["q001_03", "Silent", false],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Lasting", false],
    ["q001_07", "curricula", true],
    ["q001_08", "She wrote the letter.", false],
  ],
  // attempt_q1_n — score 75 (6/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curriculums", true],
    ["q001_08", "He ate the food.", false],
  ],
  // attempt_q1_o — score 88 (7/8)
  [
    ["q001_01", "was", true],
    ["q001_02", "Metaphor", true],
    ["q001_03", "Talkative", true],
    ["q001_04", "description", true],
    ["q001_05", "They were going to the market.", true],
    ["q001_06", "Short-lived", true],
    ["q001_07", "curricula", true],
    ["q001_08", "He ate the food.", false],
  ],
];

const extraAttemptIds = [
  "attempt_q1_a",
  "attempt_q1_b",
  "attempt_q1_c",
  "attempt_q1_d",
  "attempt_q1_e",
  "attempt_q1_f",
  "attempt_q1_g",
  "attempt_q1_h",
  "attempt_q1_i",
  "attempt_q1_j",
  "attempt_q1_k",
  "attempt_q1_l",
  "attempt_q1_m",
  "attempt_q1_n",
  "attempt_q1_o",
];
const extraUserIds = [
  "user_002",
  "user_003",
  "user_004",
  "user_005",
  "user_006",
  "user_007",
  "user_008",
  "user_009",
  "user_010",
  "user_002",
  "user_011",
  "user_012",
  "user_013",
  "user_014",
  "user_015",
];
const extraDates = [
  "2026-07-01",
  "2026-07-02",
  "2026-07-04",
  "2026-07-06",
  "2026-07-07",
  "2026-07-09",
  "2026-07-11",
  "2026-07-13",
  "2026-07-17",
  "2026-07-19",
  "2026-07-21",
  "2026-07-22",
  "2026-07-24",
  "2026-07-26",
  "2026-07-28",
];
const extraScores = [
  38, 55, 75, 88, 25, 63, 50, 100, 75, 63, 88, 38, 50, 75, 88,
];

extraAttemptIds.forEach((id, i) => {
  attemptResults.push({
    attempt_id: id,
    user_id: extraUserIds[i],
    quiz_id: "quiz_001",
    quiz_title: "JAMB Use of English — Full Mock 2024",
    is_timed: i % 2 === 0,
    score: extraScores[i],
    total: 8,
    started_at: `${extraDates[i]}T09:00:00Z`,
    completed_at: `${extraDates[i]}T10:30:00Z`,
    answers: q1AnswerSets[i].map(([question_id, given, is_correct]) => ({
      question_id,
      given,
      correct: "—",
      is_correct,
    })),
  });
});
