/**
 * Synthetic user name registry for leaderboard display.
 * Covers the real seeded profiles plus the many synthetic user IDs
 * added for leaderboard mock data (user_016 through user_060).
 */

const FIRST_NAMES = [
  "Adaeze",
  "Babatunde",
  "Chukwuemeka",
  "Damilola",
  "Emeka",
  "Fatima",
  "Gbenga",
  "Halima",
  "Ibrahim",
  "Josephine",
  "Kelechi",
  "Lara",
  "Musa",
  "Ngozi",
  "Oluwaseun",
  "Praise",
  "Quadri",
  "Rukayat",
  "Segun",
  "Taiwo",
  "Usman",
  "Vivian",
  "Wale",
  "Xola",
  "Yetunde",
  "Zainab",
  "Amara",
  "Bode",
  "Chidinma",
  "Dele",
  "Esther",
  "Femi",
  "Grace",
  "Hassan",
  "Ifeoma",
  "James",
  "Kehinde",
  "Lamide",
  "Mohammed",
  "Nnamdi",
  "Obi",
  "Patience",
  "Rasheed",
  "Simbi",
  "Toyin",
  "Uchechi",
  "Victor",
  "Wunmi",
  "Yvonne",
  "Zara",
];

const LAST_NAMES = [
  "Adeyemi",
  "Balogun",
  "Chukwu",
  "Dike",
  "Eze",
  "Fashola",
  "Ganiyu",
  "Hassan",
  "Ibe",
  "James",
  "Kanu",
  "Lawal",
  "Musa",
  "Nwosu",
  "Okafor",
  "Peters",
  "Quadri",
  "Rotimi",
  "Sule",
  "Taiwo",
  "Uche",
  "Vitalis",
  "Wale",
  "Xavier",
  "Yakubu",
  "Zubairu",
  "Adesanya",
  "Bankole",
  "Coker",
  "Dada",
  "Ekwueme",
  "Folarin",
  "Gbadebo",
  "Haruna",
  "Idowu",
  "John",
  "Kayode",
  "Ladan",
  "Moloku",
  "Njoku",
  "Okeke",
  "Prince",
  "Raji",
  "Sani",
  "Tunde",
  "Udo",
  "Vandu",
  "Wusu",
  "Yin",
  "Zuberu",
];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function nameFromId(userId: string): string {
  const num = parseInt(userId.replace(/\D/g, ""), 10) || userId.charCodeAt(0);
  const rand = seedRandom(num);
  const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

const SEEDED: Record<string, string> = {
  user_001: "Adebayo Johnson",
  creator_001: "Dr. Amaka Okafor",
  creator_002: "Prof. Ibrahim Musa",
  creator_003: "Chidi Eze",
  admin_001: "Super Admin",
};

export function getMockUserName(userId: string): string {
  return SEEDED[userId] ?? nameFromId(userId);
}

/**
 * Privacy-safe display: "Firstname L." for anyone except the current user.
 */
export function formatDisplayName(
  fullName: string,
  isCurrentUser: boolean,
): string {
  if (isCurrentUser) return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * Returns true if the userId corresponds to a creator role.
 */
export function isCreatorUser(userId: string): boolean {
  return userId.startsWith("creator_") || userId === "admin_001";
}
