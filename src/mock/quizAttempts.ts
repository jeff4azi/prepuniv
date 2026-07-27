import type { QuizAttempt } from './types';

export const quizAttempts: QuizAttempt[] = [
  { id: 'attempt_001', user_id: 'user_001', quiz_id: 'quiz_001', score: 72, is_timed: true, started_at: '2025-07-12T09:16:00Z', completed_at: '2025-07-12T10:56:00Z' },
  { id: 'attempt_002', user_id: 'user_001', quiz_id: 'quiz_001', score: 81, is_timed: true, started_at: '2025-07-14T18:00:00Z', completed_at: '2025-07-14T19:35:00Z' },
  { id: 'attempt_003', user_id: 'user_001', quiz_id: 'quiz_003', score: 65, is_timed: true, started_at: '2025-07-15T15:00:00Z', completed_at: '2025-07-15T15:50:00Z' },
  { id: 'attempt_004', user_id: 'user_001', quiz_id: 'quiz_005', score: 88, is_timed: true, started_at: '2025-07-18T07:30:00Z', completed_at: '2025-07-18T08:25:00Z' },
  { id: 'attempt_005', user_id: 'user_001', quiz_id: 'quiz_002', score: 54, is_timed: true, started_at: '2025-07-23T13:00:00Z', completed_at: '2025-07-23T14:05:00Z' },

  { id: 'attempt_101', user_id: 'creator_001', quiz_id: 'quiz_001', score: 96, is_timed: false, started_at: '2025-07-08T09:00:00Z', completed_at: '2025-07-08T10:20:00Z' },
  { id: 'attempt_102', user_id: 'creator_001', quiz_id: 'quiz_002', score: 92, is_timed: false, started_at: '2025-07-11T11:00:00Z', completed_at: '2025-07-11T11:40:00Z' },
  { id: 'attempt_103', user_id: 'creator_001', quiz_id: 'quiz_005', score: 79, is_timed: true, started_at: '2025-07-20T06:15:00Z', completed_at: '2025-07-20T07:15:00Z' },

  { id: 'attempt_004', user_id: 'admin_001', quiz_id: 'quiz_002', score: 95, is_timed: false, started_at: '2025-07-21T10:00:00Z', completed_at: '2025-07-21T10:45:00Z' },
  { id: 'attempt_201', user_id: 'admin_001', quiz_id: 'quiz_001', score: 88, is_timed: true, started_at: '2025-07-16T10:00:00Z', completed_at: '2025-07-16T11:45:00Z' },
  { id: 'attempt_202', user_id: 'admin_001', quiz_id: 'quiz_004', score: 74, is_timed: false, started_at: '2025-07-19T09:00:00Z', completed_at: '2025-07-19T09:40:00Z' },
  { id: 'attempt_203', user_id: 'admin_001', quiz_id: 'quiz_006', score: 85, is_timed: true, started_at: '2025-07-24T08:00:00Z', completed_at: '2025-07-24T08:55:00Z' },
];
