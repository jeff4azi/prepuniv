import type { Profile } from "./types";

export const profiles: Profile[] = [
  {
    id: "user_001",
    full_name: "Adebayo Johnson",
    email: "adebayo.j@example.com",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "creator_001",
    full_name: "Dr. Amaka Okafor",
    email: "amaka.okafor@example.com",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0123456789",
    bank_code: "044",
    avatar_url: undefined,
    bio: "Linguist and university lecturer with over 8 years teaching Use of English and communication skills across Nigerian universities. Holds a PhD in Linguistics from the University of Lagos and specialises in comprehension, lexis, and academic writing. Passionate about making course prep accessible, practical, and actually enjoyable.",
    joined_at: "2026-01-15T00:00:00Z",
  },
  {
    id: "creator_002",
    full_name: "Prof. Ibrahim Musa",
    email: "ibrahim.musa@example.com",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0234567890",
    bank_code: "058",
    avatar_url: undefined,
    bio: "Professor of Applied Mathematics at Ahmadu Bello University with 15 years of experience writing course assessment questions for undergraduate programmes. His quizzes are built around the exact computation and problem-solving patterns that high-scoring students master. Covers MTH 101, MTH 201, STA 121, and PHY 101.",
    joined_at: "2026-01-20T00:00:00Z",
  },
  {
    id: "creator_003",
    full_name: "Chidi Eze",
    email: "chidi.eze@example.com",
    role: "creator",
    is_approved_creator: true,
    bank_account_number: "0345678901",
    bank_code: "033",
    avatar_url: undefined,
    bio: "Recent graduate and private tutor with 3 years teaching undergraduate students across English, History, and Statistics. Believes that short, focused quizzes beat marathon study sessions — every question he writes is designed to build genuine understanding, not just memorisation.",
    joined_at: "2026-02-01T00:00:00Z",
  },
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
  },
  // ── Applicant users (pending / rejected applications) ─────────────────────
  {
    id: "user_app_001",
    full_name: "Ngozi Adeyemi",
    email: "ngozi.adeyemi@unilag.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-01T00:00:00Z",
  },
  {
    id: "user_app_002",
    full_name: "Emeka Obi",
    email: "emeka.obi@abu.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-05T00:00:00Z",
  },
  {
    id: "user_app_003",
    full_name: "Fatima Bello",
    email: "fatima.bello@unijos.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-10T00:00:00Z",
  },
  {
    id: "user_app_004",
    full_name: "Tunde Fasanya",
    email: "tunde.fasanya@oauife.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-15T00:00:00Z",
  },
  {
    id: "user_app_005",
    full_name: "Blessing Nwosu",
    email: "blessing.nwosu@unn.edu.ng",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
    joined_at: "2026-07-18T00:00:00Z",
  },
  // ── Additional regular users ──────────────────────────────────────────────
  {
    id: "user_002",
    full_name: "Ifeoma Nwosu",
    email: "ifeoma.nwosu@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-02-14T00:00:00Z",
  },
  {
    id: "user_003",
    full_name: "Suleiman Garba",
    email: "suleiman.garba@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-03-08T00:00:00Z",
  },
  {
    id: "user_004",
    full_name: "Chisom Eze",
    email: "chisom.eze@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-04-20T00:00:00Z",
  },
  {
    id: "user_005",
    full_name: "Aisha Yusuf",
    email: "aisha.yusuf@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-05-03T00:00:00Z",
  },
  {
    id: "user_006",
    full_name: "Oluwatobi Adewale",
    email: "oluwatobi.a@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-05-17T00:00:00Z",
    is_suspended: true, // suspended for filing repeated bad-faith reports
  },
  {
    id: "user_007",
    full_name: "Miriam Okonkwo",
    email: "miriam.okonkwo@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "user_008",
    full_name: "Babatunde Alabi",
    email: "babatunde.alabi@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "user_009",
    full_name: "Zainab Mohammed",
    email: "zainab.mohammed@example.com",
    role: "user",
    is_approved_creator: false,
    joined_at: "2026-06-28T00:00:00Z",
  },
  // ── Second admin ──────────────────────────────────────────────────────────
  {
    id: "admin_002",
    full_name: "Kemi Adeyinka",
    email: "kemi@prepuniv.ng",
    role: "admin",
    is_approved_creator: false,
    joined_at: "2026-01-05T00:00:00Z",
  },
];

export const purchasedQuizIdsByUser: Record<string, string[]> = {
  user_001: [
    "quiz_004", // GST 121 — Comprehension & Summary Skills
    "quiz_006", // MTH 201 — Calculus: Limits & Derivatives
    "quiz_008", // ECO 101 — Microeconomics: Supply & Demand
    "quiz_012", // STA 121 — Probability & Data Interpretation
    "quiz_014", // BIO 101 — Cell Structure & Function
    "quiz_016", // BIO 211 — Genetics & Mendelian Inheritance
    "quiz_017", // HIS 101 — Pre-Colonial Kingdoms to Independence
    "quiz_019", // PHY 101 — Mechanics: Forces, Motion & Energy
    "quiz_022", // CHM 101 — Periodic Table & Chemical Bonding
    "quiz_025", // MTH 101 — Algebra, Number Theory & Trigonometry
  ],
  creator_001: ["quiz_004", "quiz_008", "quiz_012"],
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
