import type { QuizAttempt } from './types';

export const quizAttempts: QuizAttempt[] = [
  {
    id: 'attempt_001',
    user_id: 'user_001',
    quiz_id: 'quiz_001',
    score: 72,
    is_timed: true,
    started_at: '2025-07-12T09:16:00Z',
    completed_at: '2025-07-12T10:56:00Z',
  },
  {
    id: 'attempt_002',
    user_id: 'user_001',
    quiz_id: 'quiz_001',
    score: 81,
    is_timed: true,
    started_at: '2025-07-14T18:00:00Z',
    completed_at: '2025-07-14T19:35:00Z',
  },
  {
    id: 'attempt_003',
    user_id: 'user_001',
    quiz_id: 'quiz_003',
    score: 65,
    is_timed: true,
    started_at: '2025-07-15T15:00:00Z',
    completed_at: '2025-07-15T15:50:00Z',
  },
  {
    id: 'attempt_004',
    user_id: 'admin_001',
    quiz_id: 'quiz_002',
    score: 95,
    is_timed: false,
    started_at: '2025-07-21T10:00:00Z',
    completed_at: '2025-07-21T10:45:00Z',
  },
];
