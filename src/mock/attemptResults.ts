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
