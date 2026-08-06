import type { CreatorApplication } from "./types";

/**
 * In-memory store for creator applications.
 * Seeded with entries for creator_001 (approved) and admin_001 (approved)
 * so their states are consistent. user_001 has none by default — the
 * dev switcher on the apply page lets you inject a pending/rejected entry
 * without reloading.
 */
export const creatorApplications: CreatorApplication[] = [
  // ── Approved ──────────────────────────────────────────────────────────────
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

  // ── Pending ───────────────────────────────────────────────────────────────
  {
    id: "app_pending_001",
    user_id: "user_app_001",
    status: "pending",
    courses: "CSC 122 Introduction to Programming, CSC 221 Data Structures",
    background:
      "I am a 400-level Computer Science student at the University of Lagos with a CGPA of 4.6/5.0. I have been a teaching assistant for CSC 122 for two semesters, helping over 60 students understand core programming concepts. I have also facilitated weekly study groups for CSC 221 where I developed my own question sets.",
    quiz_plans:
      "Full-semester question banks for CSC 122 covering loops, arrays, functions, and recursion. For CSC 221, I plan to create topic-focused sets on trees, graphs, and sorting algorithms with worked-example style question stems that explain the reasoning behind each answer.",
    links: "https://github.com/ngozi-adeyemi",
    submitted_at: "2026-07-22T09:30:00Z",
  },
  {
    id: "app_pending_002",
    user_id: "user_app_002",
    status: "pending",
    courses: "ECO 101 Introduction to Economics, ECO 301 Development Economics",
    background:
      "MSc Economics graduate from Ahmadu Bello University. I spent two years as a research assistant at the Institute for Development Studies and have co-authored two working papers on poverty measurement in northern Nigeria. I tutored ECO 101 privately for three cohorts of 100-level students and consistently received strong feedback on my ability to break down abstract concepts.",
    quiz_plans:
      "Scenario-based MCQ sets for ECO 101 covering demand/supply, elasticity, and market structure. For ECO 301, I want to build case-study-driven questions using Nigerian economic data — IMF/CBN statistics, NBS reports — so students can apply development theory to contexts they recognise.",
    links: "https://linkedin.com/in/emeka-obi-economics",
    submitted_at: "2026-07-24T14:15:00Z",
  },
  {
    id: "app_pending_003",
    user_id: "user_app_003",
    status: "pending",
    courses: "BIO 101 General Biology, BIO 211 Cell Biology and Genetics",
    background:
      "Final-year Biochemistry student at the University of Jos. I scored 89% in BIO 101 and 91% in BIO 211 and have been running informal revision sessions for my department since my second year. I have a folder of over 200 personally written practice questions that my peers have found useful in past exam preparation.",
    quiz_plans:
      "BIO 101 sets focused on cell structure, ecosystems, and biodiversity — mixing MCQ and fill-in-blank formats. For BIO 211, I will focus on genetics: Mendelian inheritance, DNA replication, and gene expression. I aim to price accessibly (₦100–₦200 per quiz) so no student is priced out.",
    links: "",
    submitted_at: "2026-07-25T11:45:00Z",
  },

  // ── Rejected ──────────────────────────────────────────────────────────────
  {
    id: "app_rejected_001",
    user_id: "user_app_004",
    status: "rejected",
    courses: "MTH 101",
    background: "I know maths.",
    quiz_plans: "I will make quizzes.",
    links: "",
    notes:
      "Application does not provide enough detail about your teaching background or specific quiz content plans. Please reapply with a fuller description of your experience and the specific topics you intend to cover.",
    submitted_at: "2026-07-10T08:00:00Z",
  },
  {
    id: "app_rejected_002",
    user_id: "user_app_005",
    status: "rejected",
    courses: "GST 121, PHY 101, CHM 101, MTH 101, BIO 101, ECO 101, HIS 101",
    background:
      "I am a 100-level student. I did well in all my first-semester courses and I want to share what I learned.",
    quiz_plans:
      "I will create quizzes for all my courses — one for each subject I passed this semester.",
    links: "",
    notes:
      "We appreciate your enthusiasm, but we typically require at least one year of subject-area teaching, tutoring, or research experience before approving a creator account. Please reapply after your second year when you have more experience in the courses you plan to cover.",
    submitted_at: "2026-07-18T16:20:00Z",
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
