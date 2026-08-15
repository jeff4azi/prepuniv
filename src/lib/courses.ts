export const COURSE_PREFIX_SUBJECT_AREA: Record<string, string> = {
  // Original
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

  // General / University-wide
  ENT: "Entrepreneurship",
  GNS: "General Studies",
  GSS: "General Studies",
  VOS: "Vocational Studies",
  GSP: "General Studies",

  // Computing / ICT
  COS: "Computing",
  CYB: "Cybersecurity",
  DTS: "Data Science",
  SEN: "Software Engineering",
  ICT: "Information and Communication Technology",
  IFT: "Information Technology",
  INS: "Information Systems",
  CPE: "Computer Engineering",
  CIT: "Computer Science",

  // Sciences
  MAT: "Mathematics",
  MCB: "Microbiology",
  BCH: "Biochemistry",
  BOT: "Botany",
  ZOO: "Zoology",
  GLY: "Geology",
  GEO: "Geography",
  GPH: "Geophysics",
  ICH: "Industrial Chemistry",

  // Engineering & Technology
  GET: "General Engineering",
  MEE: "Mechanical Engineering",
  MEC: "Mechanical Engineering",
  EEE: "Electrical and Electronics Engineering",
  ELE: "Electronics Engineering",
  TEL: "Electrical Engineering",
  CEE: "Civil Engineering",
  CVE: "Civil Engineering",
  TCH: "Chemical Engineering",
  CHE: "Chemical Engineering",
  ABE: "Agricultural and Biosystems Engineering",
  AGE: "Agricultural Engineering",
  TAG: "Agricultural Engineering",
  BME: "Biomedical Engineering",
  FST: "Food Science and Technology",
  MME: "Materials and Metallurgical Engineering",
  MTE: "Metallurgical Engineering",
  PGE: "Petroleum and Gas Engineering",
  PEE: "Petroleum Engineering",
  IPE: "Industrial and Production Engineering",
  MCT: "Mechatronics Engineering",

  // Agriculture
  AGR: "Agriculture",
  AGG: "Agriculture",
  AGB: "Agribusiness",
  AGX: "Agricultural Extension",
  AEX: "Agricultural Extension",
  ANS: "Animal Science",
  CPS: "Crop Science",
  CPP: "Crop Production",
  SOS: "Soil Science",
  SSL: "Soil Science",
  FAA: "Fisheries and Aquaculture",
  FIS: "Fisheries",
  FSH: "Fisheries",
  FCS: "Family and Consumer Sciences",
  FWM: "Forest Resources and Wildlife Management",
  FRM: "Forestry",
  FWL: "Forestry and Wildlife",
  HLM: "Horticulture and Landscape Management",
  WMA: "Water Resources Management and Agro-meteorology",

  // Social Sciences
  POL: "Political Science",
  SOC: "Sociology",
  PSY: "Psychology",
  IRS: "International Relations",
  CSS: "Criminology and Security Studies",
  DSS: "Demography and Social Statistics",
  DES: "Development Studies",
  PCR: "Peace and Conflict Resolution",
  SSC: "Social Sciences",
  BSW: "Social Work",

  // Administration & Management
  BAF: "Banking and Finance",
  BFN: "Banking and Finance",
  MKT: "Marketing",
  PAD: "Public Administration",
  PUB: "Public Administration",

  // Arts / Humanities
  LIT: "Literature in English",
  HIS: "History",
  HID: "History and Diplomatic Studies",
  PHL: "Philosophy",
  LIN: "Linguistics",
  FRE: "French",
  ARA: "Arabic Studies",
  CRS: "Christian Religious Studies",
  ISS: "Islamic Studies",
  THA: "Theatre Arts",
  MUS: "Music",
  ALL: "African Languages and Literature",

  // Health & Allied
  ANA: "Anatomy",
  ANT: "Anatomy",
  PHS: "Physiology",
  MLS: "Medical Laboratory Science",
  MLT: "Medical Laboratory Science",
  NSC: "Nursing Science",
  NUR: "Nursing",
  PHM: "Pharmacy",
  PHA: "Pharmacy",
  RAD: "Radiography",
  PHT: "Physiotherapy",

  // Environmental / Built Environment
  ARC: "Architecture",
  BUD: "Building",
  BLD: "Building",
  ESM: "Estate Management",
  URP: "Urban and Regional Planning",
  QTS: "Quantity Surveying",
  QSV: "Quantity Surveying",
  SVG: "Surveying and Geoinformatics",
  EVM: "Environmental Management",
  EVS: "Environmental Standards",

  // Education
  EDU: "Education",
  VTE: "Vocational and Technical Education",
  BED: "Business Education",
  TED: "Technical Education",
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
