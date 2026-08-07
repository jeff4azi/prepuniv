export interface University {
  id: string;
  name: string;
  /** Short abbreviation shown in chips / badges */
  abbreviation: string;
  /** City the university is located in */
  city: string;
}

export const universities: University[] = [
  {
    id: "uni_001",
    name: "University of Lagos",
    abbreviation: "UNILAG",
    city: "Lagos",
  },
  {
    id: "uni_002",
    name: "Ahmadu Bello University",
    abbreviation: "ABU",
    city: "Zaria",
  },
  {
    id: "uni_003",
    name: "University of Nigeria, Nsukka",
    abbreviation: "UNN",
    city: "Nsukka",
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
