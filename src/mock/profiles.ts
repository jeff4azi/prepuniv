import type { Profile } from "./types";

export const profiles: Profile[] = [
  // ── UNILAG users ──────────────────────────────────────────────────────────
  {
    id: "user_001",
    full_name: "Adebayo Johnson",
    email: "adebayo.j@example.com",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-03-01T00:00:00Z",
    university_id: "uni_001",
    email_confirmed: false,
  },
  {
    id: "creator_001",
    full_name: "Dr. Amaka Okafor",
    email: "amaka.okafor@unilag.edu.ng",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0123456789",
    bank_code: "044",
    avatar_url: undefined,
    bio: "Linguist and university lecturer with over 8 years teaching Use of English and communication skills across Nigerian universities. Holds a PhD in Linguistics from the University of Lagos and specialises in comprehension, lexis, and academic writing. Passionate about making course prep accessible, practical, and actually enjoyable.",
    joined_at: "2026-01-15T00:00:00Z",
    university_id: "uni_001",
  },
  {
    id: "creator_003",
    full_name: "Chidi Eze",
    email: "chidi.eze@unilag.edu.ng",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0345678901",
    bank_code: "033",
    avatar_url: undefined,
    bio: "Recent graduate and private tutor with 3 years teaching undergraduate students across English, History, and Statistics. Believes that short, focused quizzes beat marathon study sessions — every question he writes is designed to build genuine understanding, not just memorisation.",
    joined_at: "2026-02-01T00:00:00Z",
    university_id: "uni_001",
  },

  // ── ABU users ─────────────────────────────────────────────────────────────
  {
    id: "creator_002",
    full_name: "Prof. Ibrahim Musa",
    email: "ibrahim.musa@abu.edu.ng",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0234567890",
    bank_code: "058",
    avatar_url: undefined,
    bio: "Professor of Applied Mathematics at Ahmadu Bello University with 15 years of experience writing course assessment questions for undergraduate programmes. His quizzes are built around the exact computation and problem-solving patterns that high-scoring students master. Covers MTH 101, MTH 201, STA 121, and PHY 101.",
    joined_at: "2026-01-20T00:00:00Z",
    university_id: "uni_002",
  },
  {
    id: "user_002",
    full_name: "Ifeoma Nwosu",
    email: "ifeoma.nwosu@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-02-14T00:00:00Z",
    university_id: "uni_002",
  },
  {
    id: "user_003",
    full_name: "Suleiman Garba",
    email: "suleiman.garba@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-03-08T00:00:00Z",
    university_id: "uni_002",
  },

  // ── UNN users ─────────────────────────────────────────────────────────────
  {
    id: "user_004",
    full_name: "Chisom Eze",
    email: "chisom.eze@unn.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-04-20T00:00:00Z",
    university_id: "uni_003",
  },
  {
    id: "user_005",
    full_name: "Aisha Yusuf",
    email: "aisha.yusuf@unn.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-05-03T00:00:00Z",
    university_id: "uni_003",
  },

  // ── Platform admins (no university) ──────────────────────────────────────
  {
    id: "admin_001",
    full_name: "Super Admin",
    email: "admin@prepuniv.ng",
    role: "admin",
    is_approved_creator: true,
    bank_account_number: "9876543210",
    bank_code: "011",
    avatar_url: undefined,
    joined_at: "2025-12-01T00:00:00Z",
    university_id: undefined,
  },
  {
    id: "admin_002",
    full_name: "Kemi Adeyinka",
    email: "kemi@prepuniv.ng",
    role: "admin",
    is_approved_creator: false,
    joined_at: "2026-01-05T00:00:00Z",
    university_id: undefined,
  },

  // ── Applicant users ───────────────────────────────────────────────────────
  {
    id: "user_app_001",
    full_name: "Ngozi Adeyemi",
    email: "ngozi.adeyemi@unilag.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-01T00:00:00Z",
    university_id: "uni_001",
  },
  {
    id: "user_app_002",
    full_name: "Emeka Obi",
    email: "emeka.obi@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-05T00:00:00Z",
    university_id: "uni_002",
  },
  {
    id: "user_app_003",
    full_name: "Fatima Bello",
    email: "fatima.bello@unn.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-10T00:00:00Z",
    university_id: "uni_003",
  },
  {
    id: "user_app_004",
    full_name: "Tunde Fasanya",
    email: "tunde.fasanya@unilag.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-15T00:00:00Z",
    university_id: "uni_001",
  },
  {
    id: "user_app_005",
    full_name: "Blessing Nwosu",
    email: "blessing.nwosu@unn.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-18T00:00:00Z",
    university_id: "uni_003",
  },

  // ── More UNILAG users ─────────────────────────────────────────────────────
  {
    id: "user_006",
    full_name: "Oluwatobi Adewale",
    email: "oluwatobi.a@unilag.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-05-17T00:00:00Z",
    is_suspended: true,
    university_id: "uni_001",
  },
  {
    id: "user_007",
    full_name: "Miriam Okonkwo",
    email: "miriam.okonkwo@unilag.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-01T00:00:00Z",
    university_id: "uni_001",
  },

  // ── More ABU users ────────────────────────────────────────────────────────
  {
    id: "user_008",
    full_name: "Babatunde Alabi",
    email: "babatunde.alabi@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-15T00:00:00Z",
    university_id: "uni_002",
  },
  {
    id: "user_009",
    full_name: "Zainab Mohammed",
    email: "zainab.mohammed@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-28T00:00:00Z",
    university_id: "uni_002",
  },
];

export const purchasedQuizIdsByUser: Record<string, string[]> = {
  user_001: [
    "quiz_004", // GST 121 — Comprehension & Summary Skills (UNILAG)
    "quiz_008", // ECO 101 — Microeconomics (UNILAG)
    "quiz_012", // STA 121 — Probability (ABU — cross-uni blocked at browse level)
    "quiz_014", // BIO 101 — Cell Structure (UNILAG)
    "quiz_016", // BIO 211 — Genetics (UNILAG)
    "quiz_017", // HIS 101 — Pre-Colonial (UNILAG)
    "quiz_022", // CHM 101 — Periodic Table (UNILAG)
  ],
  creator_001: ["quiz_004", "quiz_008"],
  creator_002: ["quiz_006", "quiz_025"],
  admin_001: [
    "quiz_001",
    "quiz_002",
    "quiz_003",
    "quiz_004",
    "quiz_005",
    "quiz_006",
    "quiz_007",
    "quiz_008",
    "quiz_009",
    "quiz_010",
    "quiz_011",
    "quiz_012",
  ],
};

export const walletBalancesByUser: Record<string, number> = {
  user_001: 12500,
  creator_001: 84500,
  creator_002: 45000,
  admin_001: 500000,
};

/** Flip a user's is_approved_creator flag and upgrade their role to 'creator'. */
export function approveCreator(userId: string): void {
  const profile = profiles.find((p) => p.id === userId);
  if (profile) {
    profile.is_approved_creator = true;
    if (profile.role === "user") profile.role = "creator";
  }
}

/** Toggle a user's is_suspended flag. */
export function toggleSuspension(userId: string): boolean {
  const profile = profiles.find((p) => p.id === userId);
  if (!profile) return false;
  profile.is_suspended = !profile.is_suspended;
  return profile.is_suspended;
}

/** Mark a user's email as confirmed. */
export function confirmEmail(userId: string): void {
  const profile = profiles.find((p) => p.id === userId);
  if (profile) profile.email_confirmed = true;
}
