import type { CreatorApplication } from "./types";

/**
 * In-memory store for creator applications.
 * Seeded with entries for creator_001 (approved) and admin_001 (approved)
 * so their states are consistent. user_001 has none by default — the
 * dev switcher on the apply page lets you inject a pending/rejected entry
 * without reloading.
 */
export const creatorApplications: CreatorApplication[] = [
  {
    id: "app_creator_001",
    user_id: "creator_001",
    status: "approved",
    courses: "Use of English, Literature-in-English",
    background:
      "I hold a PhD in Linguistics from the University of Lagos and have been tutoring JAMB/WAEC candidates for over 8 years.",
    quiz_plans:
      "Full mock exam sets aligned to recent JAMB patterns, plus targeted lexis & structure drills.",
    links: "https://researchgate.net/profile/amaka-okafor",
    notes: "Excellent background. Approved.",
    submitted_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "app_creator_002",
    user_id: "creator_002",
    status: "approved",
    courses: "Mathematics, Physics, Statistics",
    background:
      "Professor of Applied Mathematics at Ahmadu Bello University with 15 years of exam-question writing experience.",
    quiz_plans:
      "Computation-heavy question banks for JAMB, WAEC, and post-UTME screening tests.",
    links: "",
    notes: "Strong STEM background. Approved.",
    submitted_at: "2026-01-12T10:30:00Z",
  },
  {
    id: "app_creator_003",
    user_id: "creator_003",
    status: "approved",
    courses: "English, History, Statistics",
    background:
      "Recent graduate and private tutor with 3 years teaching SS3 students.",
    quiz_plans: "Bite-sized topic quizzes and summary skills exercises.",
    links: "https://twitter.com/chidi_eze_edu",
    notes: "Good practical teaching background. Approved.",
    submitted_at: "2026-01-14T09:00:00Z",
  },
];

export function getApplicationByUserId(
  userId: string,
): CreatorApplication | undefined {
  return creatorApplications.find((a) => a.user_id === userId);
}

export function addApplication(app: CreatorApplication): void {
  // Replace any existing entry for this user
  const idx = creatorApplications.findIndex((a) => a.user_id === app.user_id);
  if (idx >= 0) {
    creatorApplications.splice(idx, 1, app);
  } else {
    creatorApplications.unshift(app);
  }
}

export function updateApplicationStatus(
  userId: string,
  status: CreatorApplication["status"],
  notes?: string,
): void {
  const app = creatorApplications.find((a) => a.user_id === userId);
  if (app) {
    app.status = status;
    if (notes !== undefined) app.notes = notes;
  }
}
