import type { Profile } from "./types";

export const profiles: Profile[] = [
  {
    id: "user_001",
    full_name: "Adebayo Johnson",
    email: "adebayo.j@example.com",
    role: "user",
    is_approved_creator: false,
    avatar_url: undefined,
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
  },
  {
    id: "admin_001",
    full_name: "Super Admin",
    email: "admin@prepuniv.com",
    role: "admin",
    is_approved_creator: true,
    bank_account_number: "9876543210",
    bank_code: "011",
    avatar_url: undefined,
  },
];

export const purchasedQuizIdsByUser: Record<string, string[]> = {
  user_001: [
    "quiz_001", // English Language — Full Mock 2024
    "quiz_003", // Physics — Mechanics Masterclass
    "quiz_005", // Microeconomics — Supply & Demand
    "quiz_007", // West African History
    "quiz_008", // Cell Biology — Structure & Function
    "quiz_009", // Calculus Fundamentals
    "quiz_012", // English Comprehension & Summary
    "quiz_013", // Descriptive Statistics
    "quiz_015", // Genetics & Evolution
    "quiz_017", // Algebra & Number Theory
  ],
  creator_001: ["quiz_006", "quiz_002", "quiz_004"],
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
