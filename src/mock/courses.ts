import type { Course } from './types';

export const courses: Course[] = [
  { id: 'course_001', name: 'JAMB UTME - Use of English', is_computational: false },
  { id: 'course_002', name: 'JAMB UTME - Mathematics', is_computational: true },
  { id: 'course_003', name: 'JAMB UTME - Physics', is_computational: true },
  { id: 'course_004', name: 'JAMB UTME - Chemistry', is_computational: false },
  { id: 'course_005', name: 'WAEC - English Language', is_computational: false },
  { id: 'course_006', name: 'WAEC - General Mathematics', is_computational: true },
  { id: 'course_007', name: 'Post-UTME Screening', is_computational: false },
  { id: 'course_008', name: 'NYSC CBT Test', is_computational: false },
];
