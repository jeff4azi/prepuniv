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
    courses: "GST 121 Use of English, GST 211 Logic and Scientific Reasoning",
    background:
      "I hold a PhD in Linguistics from the University of Lagos and have been teaching Use of English and academic writing at university level for over 8 years.",
    quiz_plans:
      "Comprehensive question banks aligned to the GST 121 syllabus, plus targeted lexis and structure drills for end-of-semester exams.",
    links: "https://researchgate.net/profile/amaka-okafor",
    notes: "Excellent background. Approved.",
    submitted_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "app_creator_002",
    user_id: "creator_002",
    status: "approved",
    courses: "MTH 101, MTH 201, STA 121, PHY 101",
    background:
      "Professor of Applied Mathematics at Ahmadu Bello University with 15 years of experience writing undergraduate course assessments.",
    quiz_plans:
      "Computation-heavy question banks for MTH 201 and STA 121, plus conceptual MCQ sets for PHY 101 and MTH 101.",
    links: "",
    notes: "Strong STEM background. Approved.",
    submitted_at: "2026-01-12T10:30:00Z",
  },
  {
    id: "app_creator_003",
    user_id: "creator_003",
    status: "approved",
    courses: "GST 121, HIS 101, HIS 201, STA 121",
    background:
      "Recent graduate and private tutor with 3 years teaching university undergraduates in English, History, and Statistics.",
    quiz_plans:
      "Bite-sized topic quizzes and summary skills exercises aligned to course outlines.",
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
