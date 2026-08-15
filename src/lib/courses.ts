export const COURSE_PREFIX_SUBJECT_AREA: Record<string, string> = {
  CSC: "Computer Science",
  MTH: "Mathematics",
  STA: "Statistics",
  PHY: "Physics",
  CHM: "Chemistry",
  BIO: "Biology",
  GST: "General Studies",
  ECO: "Economics",
  ACC: "Accounting",
  BUS: "Business Administration",
  LAW: "Law",
  ENG: "English",
  MED: "Medicine",
};

/**
 * Derive a suggested level (100/200/300/400) from the numeric portion of
 * a course code, e.g. "CSC 122" → 100, "MTH 201" → 200.
 */
export function suggestLevelFromCode(
  code: string,
): 100 | 200 | 300 | 400 | undefined {
  const match = code.match(/\d+/);
  if (!match) return undefined;
  const firstDigit = parseInt(match[0][0], 10);
  if (firstDigit >= 1 && firstDigit <= 4) {
    return (firstDigit * 100) as 100 | 200 | 300 | 400;
  }
  return undefined;
}
