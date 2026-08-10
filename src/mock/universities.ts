import type { University } from "./types";

export type { University };

export const universities: University[] = [
  {
    id: "uni_001",
    name: "University of Lagos",
    abbreviation: "UNILAG",
    state: "Lagos",
  },
  {
    id: "uni_002",
    name: "Ahmadu Bello University",
    abbreviation: "ABU",
    state: "Kaduna",
  },
  {
    id: "uni_003",
    name: "University of Nigeria, Nsukka",
    abbreviation: "UNN",
    state: "Enugu",
  },
];

export function getUniversityById(id: string): University | undefined {
  return universities.find((u) => u.id === id);
}

export function getUniversityByName(name: string): University | undefined {
  const q = name.trim().toLowerCase();
  return universities.find(
    (u) => u.name.toLowerCase() === q || u.abbreviation.toLowerCase() === q,
  );
}
