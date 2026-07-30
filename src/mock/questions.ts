import type { Question } from "./types";

export const questions: Question[] = [
  // ── quiz_001: CSC 122 — Loops, Arrays & Functions Bootcamp ───────────────
  {
    id: "q001_01",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text:
      'Choose the option that best completes the sentence: "The minister, together with his aides, ___ present at the ceremony."',
    options: ["were", "was", "are", "have been"],
    correct_answer: "was",
  },
  {
    id: "q001_02",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text:
      'Identify the figure of speech in: "The night is a dark blanket wrapped around the earth."',
    options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
    correct_answer: "Metaphor",
  },
  {
    id: "q001_03",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text:
      'Which option is nearest in meaning to the word "Garrulous"?',
    options: ["Silent", "Talkative", "Generous", "Aggressive"],
    correct_answer: "Talkative",
  },
  {
    id: "q001_04",
    quiz_id: "quiz_001",
    type: "fill_blank",
    question_text: 'The noun form of the word "Describe" is _____.',
    correct_answer: "description|descriptions",
  },
  {
    id: "q001_05",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text: "Which of the following sentences is grammatically correct?",
    options: [
      "He don't know the answer.",
      "She doesn't knows him.",
      "They were going to the market.",
      "We is happy today.",
    ],
    correct_answer: "They were going to the market.",
  },
  {
    id: "q001_06",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text: 'The word "Ephemeral" most nearly means:',
    options: ["Lasting", "Short-lived", "Colourful", "Enormous"],
    correct_answer: "Short-lived",
  },
  {
    id: "q001_07",
    quiz_id: "quiz_001",
    type: "fill_blank",
    question_text: 'The plural of "curriculum" is _____.',
    correct_answer: "curricula|curriculums",
  },
  {
    id: "q001_08",
    quiz_id: "quiz_001",
    type: "mcq",
    question_text: "Which sentence uses the passive voice?",
    options: [
      "The cat chased the mouse.",
      "She wrote the letter.",
      "The book was read by John.",
      "He ate the food.",
    ],
    correct_answer: "The book was read by John.",
  },

  // ── quiz_002: CSC 122 — Algorithms & Problem Solving Pack ────────────────
  {
    id: "q002_01",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "Simplify: (2x³ × 3x²) ÷ 6x",
    options: ["x⁴", "x³", "x²", "2x⁴"],
    correct_answer: "x⁴",
  },
  {
    id: "q002_02",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "The sum of the interior angles of a hexagon is:",
    options: ["540°", "720°", "900°", "360°"],
    correct_answer: "720°",
  },
  {
    id: "q002_03",
    quiz_id: "quiz_002",
    type: "fill_blank",
    question_text: "The value of sin 30° is _____.",
    correct_answer: "0.5|1/2",
  },
  {
    id: "q002_04",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "If 2x + 5 = 13, what is the value of x?",
    options: ["3", "4", "5", "6"],
    correct_answer: "4",
  },
  {
    id: "q002_05",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "What is the LCM of 12 and 18?",
    options: ["6", "24", "36", "72"],
    correct_answer: "36",
  },
  {
    id: "q002_06",
    quiz_id: "quiz_002",
    type: "fill_blank",
    question_text:
      "The area of a circle with radius 7cm is _____ cm² (use π = 22/7).",
    correct_answer: "154",
  },
  {
    id: "q002_07",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "Which of the following is a prime number?",
    options: ["21", "27", "29", "33"],
    correct_answer: "29",
  },
  {
    id: "q002_08",
    quiz_id: "quiz_002",
    type: "mcq",
    question_text: "If the mean of 4, 7, x, 10 is 8, find x.",
    options: ["9", "10", "11", "12"],
    correct_answer: "11",
  },

  // ── quiz_003: CSC 122 — Quick-Fire Syntax Drills ─────────────────────────
  {
    id: "q003_01",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text:
      "A body of mass 5 kg is acted upon by a force of 20 N. What is its acceleration?",
    options: ["2 m/s²", "4 m/s²", "10 m/s²", "100 m/s²"],
    correct_answer: "4 m/s²",
  },
  {
    id: "q003_02",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text:
      'Which of Newton\'s laws states that "for every action there is an equal and opposite reaction"?',
    options: ["First law", "Second law", "Third law", "Law of gravitation"],
    correct_answer: "Third law",
  },
  {
    id: "q003_03",
    quiz_id: "quiz_003",
    type: "fill_blank",
    question_text: "The SI unit of force is the _____.",
    correct_answer: "newton|Newton|N",
  },
  {
    id: "q003_04",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text:
      "A car accelerates from rest to 20 m/s in 5 seconds. What is its acceleration?",
    options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
    correct_answer: "4 m/s²",
  },
  {
    id: "q003_05",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text: "Kinetic energy is defined as:",
    options: ["½mv²", "mgh", "mv", "Fd"],
    correct_answer: "½mv²",
  },
  {
    id: "q003_06",
    quiz_id: "quiz_003",
    type: "fill_blank",
    question_text:
      "The gravitational field strength on Earth is approximately _____ m/s².",
    correct_answer: "10|9.8|9.81",
  },
  {
    id: "q003_07",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text: "Which quantity is conserved in an elastic collision?",
    options: [
      "Momentum only",
      "Kinetic energy only",
      "Both momentum and kinetic energy",
      "Potential energy",
    ],
    correct_answer: "Both momentum and kinetic energy",
  },
  {
    id: "q003_08",
    quiz_id: "quiz_003",
    type: "mcq",
    question_text:
      "The velocity of a body projected horizontally from a height is initially:",
    options: [
      "Zero",
      "Equal to g",
      "Equal to the horizontal component",
      "Infinite",
    ],
    correct_answer: "Equal to the horizontal component",
  },

  // ── quiz_004: GST 121 — Comprehension & Summary Skills ───────────────────
  {
    id: "q004_01",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text: "Which functional group is present in an alcohol?",
    options: ["-COOH", "-OH", "-CHO", "-NH₂"],
    correct_answer: "-OH",
  },
  {
    id: "q004_02",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text:
      "Ethanol reacting with ethanoic acid produces an ester. This reaction is called:",
    options: ["Hydrolysis", "Saponification", "Esterification", "Combustion"],
    correct_answer: "Esterification",
  },
  {
    id: "q004_03",
    quiz_id: "quiz_004",
    type: "fill_blank",
    question_text: "The general formula for alkanes is CₙH_____.",
    correct_answer: "2n+2|(2n+2)",
  },
  {
    id: "q004_04",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text: "Which of the following is a saturated hydrocarbon?",
    options: ["Ethene", "Ethyne", "Ethane", "Benzene"],
    correct_answer: "Ethane",
  },
  {
    id: "q004_05",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text:
      "What type of reaction occurs when bromine water is decolourised by an alkene?",
    options: ["Substitution", "Addition", "Elimination", "Condensation"],
    correct_answer: "Addition",
  },
  {
    id: "q004_06",
    quiz_id: "quiz_004",
    type: "fill_blank",
    question_text: "The IUPAC name of CH₃CH₂OH is _____.",
    correct_answer: "ethanol",
  },
  {
    id: "q004_07",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text:
      "Which gas is produced when ethanol undergoes complete combustion?",
    options: ["CO and H₂", "CO₂ and H₂O", "CO₂ only", "H₂O only"],
    correct_answer: "CO₂ and H₂O",
  },
  {
    id: "q004_08",
    quiz_id: "quiz_004",
    type: "mcq",
    question_text:
      "Carboxylic acids are characterised by the functional group:",
    options: ["-OH", "-CHO", "-COOH", "-CO-"],
    correct_answer: "-COOH",
  },

  // ── quiz_005: GST 121 — Lexis, Structure & Grammar Bootcamp ─────────────
  {
    id: "q005_01",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text:
      "When the price of a good rises and demand falls, the relationship is described as:",
    options: [
      "Positive correlation",
      "Negative correlation",
      "No correlation",
      "Inelastic",
    ],
    correct_answer: "Negative correlation",
  },
  {
    id: "q005_02",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text: "Price elasticity of demand is defined as:",
    options: [
      "% change in price ÷ % change in quantity",
      "% change in quantity ÷ % change in price",
      "Change in price × quantity",
      "Price ÷ quantity demanded",
    ],
    correct_answer: "% change in quantity ÷ % change in price",
  },
  {
    id: "q005_03",
    quiz_id: "quiz_005",
    type: "fill_blank",
    question_text:
      "A market where one firm dominates and has no close substitutes is called a _____.",
    correct_answer: "monopoly",
  },
  {
    id: "q005_04",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text: "The law of diminishing marginal utility states that:",
    options: [
      "Total utility always falls",
      "Marginal utility increases with each extra unit",
      "Marginal utility eventually decreases as more units are consumed",
      "Price and utility are directly proportional",
    ],
    correct_answer:
      "Marginal utility eventually decreases as more units are consumed",
  },
  {
    id: "q005_05",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text:
      "If demand is perfectly inelastic, the price elasticity of demand is:",
    options: ["0", "1", "Infinity", "-1"],
    correct_answer: "0",
  },
  {
    id: "q005_06",
    quiz_id: "quiz_005",
    type: "fill_blank",
    question_text:
      "The point where the supply curve and demand curve intersect is called the _____ point.",
    correct_answer: "equilibrium",
  },
  {
    id: "q005_07",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text: "A substitute good is one that:",
    options: [
      "Is used together with another good",
      "Can replace another good",
      "Has no alternatives",
      "Has inelastic demand",
    ],
    correct_answer: "Can replace another good",
  },
  {
    id: "q005_08",
    quiz_id: "quiz_005",
    type: "mcq",
    question_text: "In a perfectly competitive market, firms are:",
    options: ["Price makers", "Price takers", "Monopolists", "Oligopolists"],
    correct_answer: "Price takers",
  },

  // ── quiz_006: MTH 201 — Calculus: Limits & Derivatives ──────────────────
  {
    id: "q006_01",
    quiz_id: "quiz_006",
    type: "mcq",
    question_text: "The probability of rolling a 6 on a fair die is:",
    options: ["1/6", "1/3", "1/2", "6"],
    correct_answer: "1/6",
  },
  {
    id: "q006_02",
    quiz_id: "quiz_006",
    type: "fill_blank",
    question_text:
      "The sum of all probabilities in a probability distribution must equal _____.",
    correct_answer: "1",
  },
  {
    id: "q006_03",
    quiz_id: "quiz_006",
    type: "mcq",
    question_text: "A normal distribution is also called a:",
    options: ["Skewed curve", "Bell curve", "Bar chart", "Pie chart"],
    correct_answer: "Bell curve",
  },
  {
    id: "q006_04",
    quiz_id: "quiz_006",
    type: "mcq",
    question_text:
      "If two events A and B are mutually exclusive, then P(A and B) =",
    options: ["P(A) + P(B)", "0", "P(A) × P(B)", "1"],
    correct_answer: "0",
  },
  {
    id: "q006_05",
    quiz_id: "quiz_006",
    type: "fill_blank",
    question_text:
      "The measure of spread that is the square root of the variance is called the _____.",
    correct_answer: "standard deviation",
  },
  {
    id: "q006_06",
    quiz_id: "quiz_006",
    type: "mcq",
    question_text:
      "A random variable that can take only specific values is called:",
    options: ["Continuous", "Discrete", "Normal", "Uniform"],
    correct_answer: "Discrete",
  },
  {
    id: "q006_07",
    quiz_id: "quiz_006",
    type: "mcq",
    question_text:
      "Which distribution describes the number of successes in a fixed number of independent trials?",
    options: [
      "Normal distribution",
      "Poisson distribution",
      "Binomial distribution",
      "Uniform distribution",
    ],
    correct_answer: "Binomial distribution",
  },
  {
    id: "q006_08",
    quiz_id: "quiz_006",
    type: "fill_blank",
    question_text: "Two events are independent if P(A and B) = P(A) × _____.",
    correct_answer: "P(B)",
  },

  // ── quiz_007: MTH 201 — Integration & Series ─────────────────────────────
  {
    id: "q007_01",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text: "The Berlin Conference of 1884–85 resulted in:",
    options: [
      "West African independence",
      "The partition of Africa by European powers",
      "The abolition of the slave trade",
      "The founding of the African Union",
    ],
    correct_answer: "The partition of Africa by European powers",
  },
  {
    id: "q007_02",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text:
      "Which West African kingdom was famous for its control of the trans-Saharan gold trade?",
    options: ["Oyo", "Benin", "Mali", "Songhai"],
    correct_answer: "Mali",
  },
  {
    id: "q007_03",
    quiz_id: "quiz_007",
    type: "fill_blank",
    question_text:
      "Ghana achieved independence in _____, becoming the first sub-Saharan African country to do so.",
    correct_answer: "1957",
  },
  {
    id: "q007_04",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text: "The Asante Confederation was based in present-day:",
    options: ["Nigeria", "Ghana", "Senegal", "Mali"],
    correct_answer: "Ghana",
  },
  {
    id: "q007_05",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text: "Who was the first president of Ghana?",
    options: [
      "Sékou Touré",
      "Léopold Sédar Senghor",
      "Kwame Nkrumah",
      "Julius Nyerere",
    ],
    correct_answer: "Kwame Nkrumah",
  },
  {
    id: "q007_06",
    quiz_id: "quiz_007",
    type: "fill_blank",
    question_text:
      "The political philosophy of Pan-Africanism is most associated with _____ Nkrumah.",
    correct_answer: "Kwame",
  },
  {
    id: "q007_07",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text: "The Kingdom of Dahomey was located in present-day:",
    options: ["Ghana", "Senegal", "Benin", "Mali"],
    correct_answer: "Benin",
  },
  {
    id: "q007_08",
    quiz_id: "quiz_007",
    type: "mcq",
    question_text: "ECOWAS, the regional body for West Africa, was founded in:",
    options: ["1960", "1975", "1980", "1990"],
    correct_answer: "1975",
  },

  // ── quiz_008: ECO 101 — Microeconomics: Supply & Demand ──────────────────
  {
    id: "q008_01",
    quiz_id: "quiz_008",
    type: "mcq",
    question_text: 'Which organelle is known as the "powerhouse of the cell"?',
    options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi apparatus"],
    correct_answer: "Mitochondria",
  },
  {
    id: "q008_02",
    quiz_id: "quiz_008",
    type: "fill_blank",
    question_text:
      "The process by which cells divide to produce two identical daughter cells is called _____.",
    correct_answer: "mitosis",
  },
  {
    id: "q008_03",
    quiz_id: "quiz_008",
    type: "mcq",
    question_text:
      'The cell membrane is described as "selectively permeable" because:',
    options: [
      "It allows all substances to pass freely",
      "It controls what enters and exits the cell",
      "It is made of proteins only",
      "It is rigid and inflexible",
    ],
    correct_answer: "It controls what enters and exits the cell",
  },
  {
    id: "q008_04",
    quiz_id: "quiz_008",
    type: "mcq",
    question_text: "Which organelle is responsible for protein synthesis?",
    options: ["Vacuole", "Lysosome", "Ribosome", "Centrosome"],
    correct_answer: "Ribosome",
  },
  {
    id: "q008_05",
    quiz_id: "quiz_008",
    type: "fill_blank",
    question_text:
      "The control centre of the cell, containing DNA, is the _____.",
    correct_answer: "nucleus",
  },
  {
    id: "q008_06",
    quiz_id: "quiz_008",
    type: "mcq",
    question_text:
      "Osmosis is defined as the movement of water from a region of:",
    options: [
      "High solute concentration to low solute concentration",
      "Low water potential to high water potential",
      "High water potential to low water potential",
      "Low pressure to high pressure",
    ],
    correct_answer: "High water potential to low water potential",
  },
  {
    id: "q008_07",
    quiz_id: "quiz_008",
    type: "mcq",
    question_text:
      "Which of the following is found in plant cells but NOT animal cells?",
    options: ["Mitochondria", "Cell wall", "Ribosome", "Nucleus"],
    correct_answer: "Cell wall",
  },
  {
    id: "q008_08",
    quiz_id: "quiz_008",
    type: "fill_blank",
    question_text:
      "The fluid-filled space inside a plant cell vacuole is called cell _____.",
    correct_answer: "sap",
  },

  // ── quiz_009: ECO 101 — Macroeconomics: GDP, Inflation & Fiscal Policy ───
  {
    id: "q009_01",
    quiz_id: "quiz_009",
    type: "mcq",
    question_text: "What is the derivative of f(x) = x³?",
    options: ["3x", "3x²", "x²", "3x⁴"],
    correct_answer: "3x²",
  },
  {
    id: "q009_02",
    quiz_id: "quiz_009",
    type: "fill_blank",
    question_text: "The derivative of a constant is _____.",
    correct_answer: "0",
  },
  {
    id: "q009_03",
    quiz_id: "quiz_009",
    type: "mcq",
    question_text: "lim(x→0) sin(x)/x equals:",
    options: ["0", "∞", "1", "Undefined"],
    correct_answer: "1",
  },
  {
    id: "q009_04",
    quiz_id: "quiz_009",
    type: "mcq",
    question_text: "The derivative of sin(x) is:",
    options: ["cos(x)", "-cos(x)", "-sin(x)", "tan(x)"],
    correct_answer: "cos(x)",
  },
  {
    id: "q009_05",
    quiz_id: "quiz_009",
    type: "fill_blank",
    question_text: "If f(x) = 5x² + 3x, then f'(x) = 10x + _____.",
    correct_answer: "3",
  },
  {
    id: "q009_06",
    quiz_id: "quiz_009",
    type: "mcq",
    question_text: "A function is continuous at x = a if:",
    options: [
      "f(a) is defined and the limit equals f(a)",
      "f(a) = 0",
      "The limit does not exist",
      "f(a) is undefined",
    ],
    correct_answer: "f(a) is defined and the limit equals f(a)",
  },
  {
    id: "q009_07",
    quiz_id: "quiz_009",
    type: "mcq",
    question_text: "The integral of x² dx is:",
    options: ["2x", "x³/3 + C", "2x + C", "x³ + C"],
    correct_answer: "x³/3 + C",
  },
  {
    id: "q009_08",
    quiz_id: "quiz_009",
    type: "fill_blank",
    question_text:
      "The chain rule states that d/dx[f(g(x))] = f'(g(x)) × _____.",
    correct_answer: "g'(x)",
  },

  // ── quiz_010: EDU 221 — Learning Theories & Motivation ───────────────────
  {
    id: "q010_01",
    quiz_id: "quiz_010",
    type: "mcq",
    question_text: "Ohm's Law states that V =",
    options: ["I + R", "I × R", "I / R", "R / I"],
    correct_answer: "I × R",
  },
  {
    id: "q010_02",
    quiz_id: "quiz_010",
    type: "fill_blank",
    question_text: "The SI unit of electrical resistance is the _____.",
    correct_answer: "ohm|Ohm|Ω",
  },
  {
    id: "q010_03",
    quiz_id: "quiz_010",
    type: "mcq",
    question_text:
      "Two resistors of 4Ω and 6Ω are connected in series. The total resistance is:",
    options: ["2.4Ω", "10Ω", "24Ω", "5Ω"],
    correct_answer: "10Ω",
  },
  {
    id: "q010_04",
    quiz_id: "quiz_010",
    type: "mcq",
    question_text: "A magnetic field is produced around a conductor when:",
    options: [
      "Light shines on it",
      "Electric current flows through it",
      "It is heated",
      "It is stretched",
    ],
    correct_answer: "Electric current flows through it",
  },
  {
    id: "q010_05",
    quiz_id: "quiz_010",
    type: "fill_blank",
    question_text:
      "Faraday's law states that the induced EMF is proportional to the rate of change of magnetic _____.",
    correct_answer: "flux",
  },
  {
    id: "q010_06",
    quiz_id: "quiz_010",
    type: "mcq",
    question_text: "The formula for electrical power is:",
    options: ["P = V/I", "P = I/V", "P = VI", "P = V + I"],
    correct_answer: "P = VI",
  },
  {
    id: "q010_07",
    quiz_id: "quiz_010",
    type: "mcq",
    question_text: "Like charges:",
    options: [
      "Attract each other",
      "Repel each other",
      "Have no effect on each other",
      "Cancel each other",
    ],
    correct_answer: "Repel each other",
  },
  {
    id: "q010_08",
    quiz_id: "quiz_010",
    type: "fill_blank",
    question_text: "A device that converts AC to DC is called a _____.",
    correct_answer: "rectifier",
  },

  // ── quiz_011: ECO 301 — Development Economics ────────────────────────────
  {
    id: "q011_01",
    quiz_id: "quiz_011",
    type: "mcq",
    question_text: "GDP stands for:",
    options: [
      "Gross Domestic Product",
      "General Development Plan",
      "Gross Development Profit",
      "Government Domestic Policy",
    ],
    correct_answer: "Gross Domestic Product",
  },
  {
    id: "q011_02",
    quiz_id: "quiz_011",
    type: "fill_blank",
    question_text:
      "Inflation is a general rise in the _____ level of goods and services.",
    correct_answer: "price",
  },
  {
    id: "q011_03",
    quiz_id: "quiz_011",
    type: "mcq",
    question_text: "Fiscal policy refers to:",
    options: [
      "Central bank interest rate policy",
      "Government spending and taxation policy",
      "Exchange rate management",
      "Trade tariff regulation",
    ],
    correct_answer: "Government spending and taxation policy",
  },
  {
    id: "q011_04",
    quiz_id: "quiz_011",
    type: "mcq",
    question_text: "An expansionary monetary policy would:",
    options: [
      "Increase interest rates",
      "Decrease money supply",
      "Lower interest rates to stimulate borrowing",
      "Raise taxes",
    ],
    correct_answer: "Lower interest rates to stimulate borrowing",
  },
  {
    id: "q011_05",
    quiz_id: "quiz_011",
    type: "fill_blank",
    question_text:
      "The institution responsible for monetary policy in Nigeria is the _____.",
    correct_answer: "CBN|Central Bank of Nigeria",
  },
  {
    id: "q011_06",
    quiz_id: "quiz_011",
    type: "mcq",
    question_text:
      "Unemployment that occurs due to a mismatch between job seekers' skills and available jobs is called:",
    options: [
      "Cyclical unemployment",
      "Seasonal unemployment",
      "Frictional unemployment",
      "Structural unemployment",
    ],
    correct_answer: "Structural unemployment",
  },
  {
    id: "q011_07",
    quiz_id: "quiz_011",
    type: "mcq",
    question_text: "A trade surplus means a country:",
    options: [
      "Imports more than it exports",
      "Exports more than it imports",
      "Has balanced trade",
      "Has no foreign debt",
    ],
    correct_answer: "Exports more than it imports",
  },
  {
    id: "q011_08",
    quiz_id: "quiz_011",
    type: "fill_blank",
    question_text:
      "The Phillips curve shows the relationship between inflation and _____.",
    correct_answer: "unemployment",
  },

  // ── quiz_012: STA 121 — Probability & Data Interpretation ────────────────
  {
    id: "q012_01",
    quiz_id: "quiz_012",
    type: "mcq",
    question_text: 'A synonym for "Benevolent" is:',
    options: ["Cruel", "Generous", "Lazy", "Reckless"],
    correct_answer: "Generous",
  },
  {
    id: "q012_02",
    quiz_id: "quiz_012",
    type: "fill_blank",
    question_text: 'The opposite of "Verbose" is _____.',
    correct_answer: "concise|brief|terse",
  },
  {
    id: "q012_03",
    quiz_id: "quiz_012",
    type: "mcq",
    question_text: "Which sentence contains a dangling modifier?",
    options: [
      "Running quickly, John caught the bus.",
      "Running quickly, the bus was caught.",
      "John caught the bus quickly.",
      "The bus was caught by John.",
    ],
    correct_answer: "Running quickly, the bus was caught.",
  },
  {
    id: "q012_04",
    quiz_id: "quiz_012",
    type: "mcq",
    question_text: '"The pen is mightier than the sword" is an example of:',
    options: ["Simile", "Metaphor", "Alliteration", "Oxymoron"],
    correct_answer: "Metaphor",
  },
  {
    id: "q012_05",
    quiz_id: "quiz_012",
    type: "fill_blank",
    question_text:
      "The rhetorical technique of repeating a word at the beginning of successive clauses is called _____.",
    correct_answer: "anaphora",
  },
  {
    id: "q012_06",
    quiz_id: "quiz_012",
    type: "mcq",
    question_text: 'Which of the following best defines "inference"?',
    options: [
      "A direct statement in the text",
      "A conclusion drawn from evidence",
      "A summary of the passage",
      "The author's main purpose",
    ],
    correct_answer: "A conclusion drawn from evidence",
  },
  {
    id: "q012_07",
    quiz_id: "quiz_012",
    type: "mcq",
    question_text: "In summary writing, you should:",
    options: [
      "Include your own opinions",
      "Copy sentences verbatim from the passage",
      "Express the main ideas in your own words",
      "Expand on every detail mentioned",
    ],
    correct_answer: "Express the main ideas in your own words",
  },
  {
    id: "q012_08",
    quiz_id: "quiz_012",
    type: "fill_blank",
    question_text:
      'A word that sounds like what it represents (e.g. "buzz") is called _____.',
    correct_answer: "onomatopoeia",
  },

  // ── quiz_013: STA 121 — Descriptive Stats: Mean, Median & Mode ──────────
  {
    id: "q013_01",
    quiz_id: "quiz_013",
    type: "mcq",
    question_text: "The mean of the dataset [3, 5, 7, 7, 8] is:",
    options: ["6", "7", "8", "5"],
    correct_answer: "6",
  },
  {
    id: "q013_02",
    quiz_id: "quiz_013",
    type: "fill_blank",
    question_text:
      "The value that appears most frequently in a dataset is the _____.",
    correct_answer: "mode",
  },
  {
    id: "q013_03",
    quiz_id: "quiz_013",
    type: "mcq",
    question_text: "The median of [2, 4, 6, 8, 10] is:",
    options: ["4", "5", "6", "7"],
    correct_answer: "6",
  },
  {
    id: "q013_04",
    quiz_id: "quiz_013",
    type: "mcq",
    question_text: "The range of a dataset is:",
    options: [
      "Mean minus median",
      "Highest value minus lowest value",
      "Sum of all values",
      "Variance squared",
    ],
    correct_answer: "Highest value minus lowest value",
  },
  {
    id: "q013_05",
    quiz_id: "quiz_013",
    type: "fill_blank",
    question_text:
      "Variance is the average of the squared _____ from the mean.",
    correct_answer: "deviations",
  },
  {
    id: "q013_06",
    quiz_id: "quiz_013",
    type: "mcq",
    question_text: "A bar chart is best used to display:",
    options: [
      "Continuous data over time",
      "Categorical data comparisons",
      "Frequency distributions of intervals",
      "Correlations between two variables",
    ],
    correct_answer: "Categorical data comparisons",
  },
  {
    id: "q013_07",
    quiz_id: "quiz_013",
    type: "mcq",
    question_text: "The interquartile range (IQR) is:",
    options: ["Q3 - Q1", "Q2 - Q1", "Q4 - Q0", "Q3 + Q1"],
    correct_answer: "Q3 - Q1",
  },
  {
    id: "q013_08",
    quiz_id: "quiz_013",
    type: "fill_blank",
    question_text:
      "A graph that shows the distribution of data using five-number summary is called a _____ plot.",
    correct_answer: "box|box-and-whisker",
  },

  // ── quiz_014: BIO 101 — Cell Structure & Function ────────────────────────
  {
    id: "q014_01",
    quiz_id: "quiz_014",
    type: "mcq",
    question_text: "The Nigerian Civil War (Biafra War) lasted from:",
    options: ["1960–1963", "1967–1970", "1975–1978", "1980–1983"],
    correct_answer: "1967–1970",
  },
  {
    id: "q014_02",
    quiz_id: "quiz_014",
    type: "fill_blank",
    question_text:
      "Nigeria gained independence from Britain on October 1st, _____.",
    correct_answer: "1960",
  },
  {
    id: "q014_03",
    quiz_id: "quiz_014",
    type: "mcq",
    question_text:
      "The military head of state who was assassinated in 1966 was:",
    options: [
      "Yakubu Gowon",
      "Tafawa Balewa",
      "Aguiyi-Ironsi",
      "Murtala Mohammed",
    ],
    correct_answer: "Aguiyi-Ironsi",
  },
  {
    id: "q014_04",
    quiz_id: "quiz_014",
    type: "mcq",
    question_text:
      "Nigeria's return to democratic civilian rule after military dictatorship occurred in:",
    options: ["1979", "1989", "1999", "2003"],
    correct_answer: "1999",
  },
  {
    id: "q014_05",
    quiz_id: "quiz_014",
    type: "fill_blank",
    question_text:
      "The first Republic of Nigeria was headed by Prime Minister Sir Abubakar Tafawa _____.",
    correct_answer: "Balewa",
  },
  {
    id: "q014_06",
    quiz_id: "quiz_014",
    type: "mcq",
    question_text:
      "OPEC membership, which shaped Nigeria's oil-based economy, began in:",
    options: ["1960", "1971", "1980", "1990"],
    correct_answer: "1971",
  },
  {
    id: "q014_07",
    quiz_id: "quiz_014",
    type: "mcq",
    question_text:
      "The June 12, 1993 election, widely regarded as Nigeria's fairest, was won by:",
    options: [
      "Sani Abacha",
      "Ernest Shonekan",
      "M.K.O. Abiola",
      "Olusegun Obasanjo",
    ],
    correct_answer: "M.K.O. Abiola",
  },
  {
    id: "q014_08",
    quiz_id: "quiz_014",
    type: "fill_blank",
    question_text:
      'The policy of "no victor, no vanquished" after the civil war was declared by General _____.',
    correct_answer: "Gowon|Yakubu Gowon",
  },

  // ── quiz_015–024: remaining quizzes ──────────────────────────────────────
  // quiz_015: BIO 101 — Ecology & Biodiversity
  {
    id: "q015_01",
    quiz_id: "quiz_015",
    type: "mcq",
    question_text: "Mendel's Law of Segregation states that:",
    options: [
      "Traits blend together in offspring",
      "Two alleles separate during gamete formation",
      "Dominant traits always appear",
      "Genes are inherited in groups",
    ],
    correct_answer: "Two alleles separate during gamete formation",
  },
  {
    id: "q015_02",
    quiz_id: "quiz_015",
    type: "fill_blank",
    question_text:
      "An organism with two identical alleles for a trait is called _____.",
    correct_answer: "homozygous",
  },
  {
    id: "q015_03",
    quiz_id: "quiz_015",
    type: "mcq",
    question_text: "The physical expression of a gene is called the:",
    options: ["Genotype", "Phenotype", "Allele", "Locus"],
    correct_answer: "Phenotype",
  },
  {
    id: "q015_04",
    quiz_id: "quiz_015",
    type: "mcq",
    question_text: "Darwin's theory of natural selection proposes that:",
    options: [
      "Organisms change their traits by willpower",
      "Traits that improve survival are more likely to be passed on",
      "All organisms evolved at the same rate",
      "Evolution only affects extinct species",
    ],
    correct_answer:
      "Traits that improve survival are more likely to be passed on",
  },
  {
    id: "q015_05",
    quiz_id: "quiz_015",
    type: "fill_blank",
    question_text: "The molecule that carries genetic information is _____.",
    correct_answer: "DNA",
  },
  {
    id: "q015_06",
    quiz_id: "quiz_015",
    type: "mcq",
    question_text:
      "A cross between a homozygous dominant (AA) and homozygous recessive (aa) parent produces offspring that are all:",
    options: ["AA", "aa", "Aa", "aA or AA"],
    correct_answer: "Aa",
  },
  {
    id: "q015_07",
    quiz_id: "quiz_015",
    type: "mcq",
    question_text:
      "Which of the following is an example of a sex-linked trait?",
    options: ["Height", "Blood type", "Colour blindness", "Skin colour"],
    correct_answer: "Colour blindness",
  },
  {
    id: "q015_08",
    quiz_id: "quiz_015",
    type: "fill_blank",
    question_text:
      "The process of forming gametes with half the normal chromosome number is called _____.",
    correct_answer: "meiosis",
  },

  // quiz_016: BIO 211 — Genetics & Mendelian Inheritance
  {
    id: "q016_01",
    quiz_id: "quiz_016",
    type: "mcq",
    question_text:
      "Elements in the same period of the periodic table have the same:",
    options: [
      "Number of neutrons",
      "Number of electron shells",
      "Atomic mass",
      "Chemical properties",
    ],
    correct_answer: "Number of electron shells",
  },
  {
    id: "q016_02",
    quiz_id: "quiz_016",
    type: "fill_blank",
    question_text:
      "The atomic number of an element equals the number of _____ in the nucleus.",
    correct_answer: "protons",
  },
  {
    id: "q016_03",
    quiz_id: "quiz_016",
    type: "mcq",
    question_text: "An ionic bond is formed by:",
    options: [
      "Sharing of electrons",
      "Transfer of electrons between atoms",
      "Covalent bonding",
      "Metallic bonding",
    ],
    correct_answer: "Transfer of electrons between atoms",
  },
  {
    id: "q016_04",
    quiz_id: "quiz_016",
    type: "mcq",
    question_text: "Which element is in Group VII (halogens)?",
    options: ["Sodium", "Carbon", "Chlorine", "Calcium"],
    correct_answer: "Chlorine",
  },
  {
    id: "q016_05",
    quiz_id: "quiz_016",
    type: "fill_blank",
    question_text:
      "The periodic table is arranged in order of increasing _____ number.",
    correct_answer: "atomic",
  },
  {
    id: "q016_06",
    quiz_id: "quiz_016",
    type: "mcq",
    question_text:
      "Which type of bonding involves a sea of delocalized electrons?",
    options: ["Ionic", "Covalent", "Metallic", "Hydrogen"],
    correct_answer: "Metallic",
  },
  {
    id: "q016_07",
    quiz_id: "quiz_016",
    type: "mcq",
    question_text: "Noble gases are chemically unreactive because they:",
    options: [
      "Have full outer electron shells",
      "Have very large atomic radii",
      "Are found in group I",
      "React only with metals",
    ],
    correct_answer: "Have full outer electron shells",
  },
  {
    id: "q016_08",
    quiz_id: "quiz_016",
    type: "fill_blank",
    question_text: "The process of gaining electrons is called _____.",
    correct_answer: "reduction",
  },

  // quiz_017: HIS 101 — Pre-Colonial Kingdoms to Independence
  {
    id: "q017_01",
    quiz_id: "quiz_017",
    type: "mcq",
    question_text: "Solve for x: 3x - 9 = 0",
    options: ["x = 0", "x = 3", "x = 9", "x = -3"],
    correct_answer: "x = 3",
  },
  {
    id: "q017_02",
    quiz_id: "quiz_017",
    type: "fill_blank",
    question_text: "The HCF of 24 and 36 is _____.",
    correct_answer: "12",
  },
  {
    id: "q017_03",
    quiz_id: "quiz_017",
    type: "mcq",
    question_text: "Which of the following is an irrational number?",
    options: ["¼", "0.333...", "√2", "7"],
    correct_answer: "√2",
  },
  {
    id: "q017_04",
    quiz_id: "quiz_017",
    type: "mcq",
    question_text: "Factorise x² - 9:",
    options: ["(x-3)(x-3)", "(x+3)(x-3)", "(x+9)(x-1)", "(x-3)²"],
    correct_answer: "(x+3)(x-3)",
  },
  {
    id: "q017_05",
    quiz_id: "quiz_017",
    type: "fill_blank",
    question_text: "Express 0.25 as a fraction in its simplest form: _____.",
    correct_answer: "1/4",
  },
  {
    id: "q017_06",
    quiz_id: "quiz_017",
    type: "mcq",
    question_text: "If a = 2 and b = 3, what is a² + 2ab + b²?",
    options: ["13", "25", "17", "10"],
    correct_answer: "25",
  },
  {
    id: "q017_07",
    quiz_id: "quiz_017",
    type: "mcq",
    question_text: "What is 2⁵?",
    options: ["10", "25", "32", "64"],
    correct_answer: "32",
  },
  {
    id: "q017_08",
    quiz_id: "quiz_017",
    type: "fill_blank",
    question_text: "The solution to x² = 16 gives x = ±_____.",
    correct_answer: "4",
  },

  // quiz_018: HIS 201 — Civil War, Democracy & Nation-Building
  {
    id: "q018_01",
    quiz_id: "quiz_018",
    type: "mcq",
    question_text: "The speed of light in a vacuum is approximately:",
    options: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
    correct_answer: "3 × 10⁸ m/s",
  },
  {
    id: "q018_02",
    quiz_id: "quiz_018",
    type: "fill_blank",
    question_text:
      "The bending of light as it passes from one medium to another is called _____.",
    correct_answer: "refraction",
  },
  {
    id: "q018_03",
    quiz_id: "quiz_018",
    type: "mcq",
    question_text: "The frequency of a wave is related to its wavelength by:",
    options: ["f = vλ", "f = v/λ", "f = λ/v", "f = v + λ"],
    correct_answer: "f = v/λ",
  },
  {
    id: "q018_04",
    quiz_id: "quiz_018",
    type: "mcq",
    question_text: "Which of these is NOT a transverse wave?",
    options: ["Light", "Water waves", "Sound waves", "Electromagnetic waves"],
    correct_answer: "Sound waves",
  },
  {
    id: "q018_05",
    quiz_id: "quiz_018",
    type: "fill_blank",
    question_text:
      "The phenomenon where two waves overlap to produce a resultant wave is called _____.",
    correct_answer: "interference|superposition",
  },
  {
    id: "q018_06",
    quiz_id: "quiz_018",
    type: "mcq",
    question_text: "A concave mirror is used to:",
    options: [
      "Diverge light rays",
      "Converge light rays",
      "Absorb all light",
      "Transmit light",
    ],
    correct_answer: "Converge light rays",
  },
  {
    id: "q018_07",
    quiz_id: "quiz_018",
    type: "mcq",
    question_text: "The Doppler effect explains the change in:",
    options: [
      "Wave speed as a source moves",
      "Observed frequency when source and observer move relative to each other",
      "Wave amplitude over distance",
      "Refractive index",
    ],
    correct_answer:
      "Observed frequency when source and observer move relative to each other",
  },
  {
    id: "q018_08",
    quiz_id: "quiz_018",
    type: "fill_blank",
    question_text:
      "The distance between two successive crests of a wave is the _____.",
    correct_answer: "wavelength",
  },

  // quiz_019: PHY 101 — Mechanics: Forces, Motion & Energy
  {
    id: "q019_01",
    quiz_id: "quiz_019",
    type: "mcq",
    question_text: "Which index measures human development beyond GDP?",
    options: ["CPI", "HDI", "GNI", "PPP"],
    correct_answer: "HDI",
  },
  {
    id: "q019_02",
    quiz_id: "quiz_019",
    type: "fill_blank",
    question_text:
      "The _____ curve shows the degree of inequality in income distribution.",
    correct_answer: "Lorenz",
  },
  {
    id: "q019_03",
    quiz_id: "quiz_019",
    type: "mcq",
    question_text: "Which economic sector is considered primary?",
    options: ["Manufacturing", "Banking", "Agriculture", "Retail"],
    correct_answer: "Agriculture",
  },
  {
    id: "q019_04",
    quiz_id: "quiz_019",
    type: "mcq",
    question_text: "A common challenge of development in Nigeria is:",
    options: [
      "Currency deflation",
      "Oil dependency and infrastructure deficit",
      "Excessive manufacturing output",
      "Very high literacy rates",
    ],
    correct_answer: "Oil dependency and infrastructure deficit",
  },
  {
    id: "q019_05",
    quiz_id: "quiz_019",
    type: "fill_blank",
    question_text:
      "The percentage of a population living below a defined income threshold is the _____ rate.",
    correct_answer: "poverty",
  },
  {
    id: "q019_06",
    quiz_id: "quiz_019",
    type: "mcq",
    question_text:
      "Structural adjustment programmes (SAPs) were primarily promoted by:",
    options: ["African Union", "World Bank and IMF", "OPEC", "ECOWAS"],
    correct_answer: "World Bank and IMF",
  },
  {
    id: "q019_07",
    quiz_id: "quiz_019",
    type: "mcq",
    question_text: "Import substitution industrialisation aims to:",
    options: [
      "Increase imports of manufactured goods",
      "Produce locally what was previously imported",
      "Expand the export of raw materials",
      "Reduce the industrial sector",
    ],
    correct_answer: "Produce locally what was previously imported",
  },
  {
    id: "q019_08",
    quiz_id: "quiz_019",
    type: "fill_blank",
    question_text:
      "Foreign direct investment (FDI) involves investment in a country's economy by _____ firms.",
    correct_answer: "foreign|overseas|international",
  },

  // quiz_020: PHY 101 — Waves, Optics & Modern Physics
  {
    id: "q020_01",
    quiz_id: "quiz_020",
    type: "mcq",
    question_text: "A Type I error in hypothesis testing means:",
    options: [
      "Failing to reject a false null hypothesis",
      "Rejecting a true null hypothesis",
      "Accepting the alternative hypothesis",
      "Having too small a sample",
    ],
    correct_answer: "Rejecting a true null hypothesis",
  },
  {
    id: "q020_02",
    quiz_id: "quiz_020",
    type: "fill_blank",
    question_text:
      "The significance level α = 0.05 means there is a _____ % chance of making a Type I error.",
    correct_answer: "5",
  },
  {
    id: "q020_03",
    quiz_id: "quiz_020",
    type: "mcq",
    question_text: "A 95% confidence interval means:",
    options: [
      "95% of data falls within the interval",
      "95% confidence the population parameter lies in the interval",
      "The sample mean equals the population mean 95% of the time",
      "The standard error is 5%",
    ],
    correct_answer:
      "95% confidence the population parameter lies in the interval",
  },
  {
    id: "q020_04",
    quiz_id: "quiz_020",
    type: "mcq",
    question_text: "The p-value represents:",
    options: [
      "The probability the null hypothesis is true",
      "The probability of observing results as extreme as those found, assuming H₀ is true",
      "The sample mean",
      "The confidence level",
    ],
    correct_answer:
      "The probability of observing results as extreme as those found, assuming H₀ is true",
  },
  {
    id: "q020_05",
    quiz_id: "quiz_020",
    type: "fill_blank",
    question_text:
      "The test used to compare means of two independent groups is called a _____ test.",
    correct_answer: "t|t-test",
  },
  {
    id: "q020_06",
    quiz_id: "quiz_020",
    type: "mcq",
    question_text:
      "The central limit theorem states that with a large enough sample, the sampling distribution of the mean approaches:",
    options: [
      "A skewed distribution",
      "A normal distribution",
      "A uniform distribution",
      "A bimodal distribution",
    ],
    correct_answer: "A normal distribution",
  },
  {
    id: "q020_07",
    quiz_id: "quiz_020",
    type: "mcq",
    question_text: "Pearson's r measures:",
    options: [
      "The slope of a regression line",
      "The strength and direction of a linear relationship",
      "The difference between two means",
      "The variance of a dataset",
    ],
    correct_answer: "The strength and direction of a linear relationship",
  },
  {
    id: "q020_08",
    quiz_id: "quiz_020",
    type: "fill_blank",
    question_text:
      "A chi-square test is used to test for _____ between categorical variables.",
    correct_answer: "independence|association",
  },

  // quiz_021: PHY 201 — Circuits, Fields & Electromagnetic Induction
  {
    id: "q021_01",
    quiz_id: "quiz_021",
    type: "mcq",
    question_text: "Choose the correct sentence:",
    options: [
      "Neither of them are ready.",
      "Neither of them is ready.",
      "Neither of them were ready.",
      "Neither of them have been ready.",
    ],
    correct_answer: "Neither of them is ready.",
  },
  {
    id: "q021_02",
    quiz_id: "quiz_021",
    type: "fill_blank",
    question_text: 'The past participle of "break" is _____.',
    correct_answer: "broken",
  },
  {
    id: "q021_03",
    quiz_id: "quiz_021",
    type: "mcq",
    question_text:
      'Identify the verb tense: "By next year, she will have graduated."',
    options: [
      "Simple future",
      "Future perfect",
      "Present perfect",
      "Future continuous",
    ],
    correct_answer: "Future perfect",
  },
  {
    id: "q021_04",
    quiz_id: "quiz_021",
    type: "mcq",
    question_text: "Which sentence is in the subjunctive mood?",
    options: [
      "If it rains, I will stay home.",
      "If it rained, I would stay home.",
      "If I were you, I would leave.",
      "I will leave when it rains.",
    ],
    correct_answer: "If I were you, I would leave.",
  },
  {
    id: "q021_05",
    quiz_id: "quiz_021",
    type: "fill_blank",
    question_text: "A word that modifies a noun or pronoun is called an _____.",
    correct_answer: "adjective",
  },
  {
    id: "q021_06",
    quiz_id: "quiz_021",
    type: "mcq",
    question_text: 'The antonym of "Frugal" is:',
    options: ["Careful", "Extravagant", "Thrifty", "Modest"],
    correct_answer: "Extravagant",
  },
  {
    id: "q021_07",
    quiz_id: "quiz_021",
    type: "mcq",
    question_text: "In which sentence is a comma used correctly?",
    options: [
      "I went to the store, and bought bread.",
      "Although tired, she continued working.",
      "She likes cats, however she is allergic.",
      "He ran, quickly to catch the bus.",
    ],
    correct_answer: "Although tired, she continued working.",
  },
  {
    id: "q021_08",
    quiz_id: "quiz_021",
    type: "fill_blank",
    question_text: 'The word "quickly" in "She ran quickly" is an _____.',
    correct_answer: "adverb",
  },

  // quiz_022: CHM 101 — Periodic Table & Chemical Bonding
  {
    id: "q022_01",
    quiz_id: "quiz_022",
    type: "mcq",
    question_text: "The Industrial Revolution began in:",
    options: ["France", "Germany", "Britain", "United States"],
    correct_answer: "Britain",
  },
  {
    id: "q022_02",
    quiz_id: "quiz_022",
    type: "fill_blank",
    question_text: "World War I began in _____.",
    correct_answer: "1914",
  },
  {
    id: "q022_03",
    quiz_id: "quiz_022",
    type: "mcq",
    question_text: "The Treaty of Versailles (1919) officially ended:",
    options: [
      "World War II",
      "The Cold War",
      "World War I",
      "The Napoleonic Wars",
    ],
    correct_answer: "World War I",
  },
  {
    id: "q022_04",
    quiz_id: "quiz_022",
    type: "mcq",
    question_text: "The United Nations was founded in:",
    options: ["1919", "1939", "1945", "1950"],
    correct_answer: "1945",
  },
  {
    id: "q022_05",
    quiz_id: "quiz_022",
    type: "fill_blank",
    question_text:
      "The Cold War was primarily a tension between the USA and the _____.",
    correct_answer: "USSR|Soviet Union",
  },
  {
    id: "q022_06",
    quiz_id: "quiz_022",
    type: "mcq",
    question_text:
      "The steam engine, central to the Industrial Revolution, was improved by:",
    options: [
      "Isaac Newton",
      "Charles Darwin",
      "James Watt",
      "Michael Faraday",
    ],
    correct_answer: "James Watt",
  },
  {
    id: "q022_07",
    quiz_id: "quiz_022",
    type: "mcq",
    question_text: "The French Revolution began in:",
    options: ["1776", "1789", "1815", "1848"],
    correct_answer: "1789",
  },
  {
    id: "q022_08",
    quiz_id: "quiz_022",
    type: "fill_blank",
    question_text:
      "The ideology that a nation's interests are best served by independence and self-sufficiency is called _____.",
    correct_answer: "nationalism",
  },

  // quiz_023: CHM 211 — Organic Chemistry: Reactions & Nomenclature
  {
    id: "q023_01",
    quiz_id: "quiz_023",
    type: "mcq",
    question_text: "The role an organism plays in its ecosystem is called its:",
    options: ["Habitat", "Niche", "Biome", "Population"],
    correct_answer: "Niche",
  },
  {
    id: "q023_02",
    quiz_id: "quiz_023",
    type: "fill_blank",
    question_text:
      "The greenhouse gas most responsible for human-caused climate change is _____.",
    correct_answer: "CO2|carbon dioxide|CO₂",
  },
  {
    id: "q023_03",
    quiz_id: "quiz_023",
    type: "mcq",
    question_text: "Biodiversity refers to:",
    options: [
      "The number of ecosystems in an area",
      "The variety of living organisms in a habitat",
      "The total biomass of an ecosystem",
      "The rate of photosynthesis",
    ],
    correct_answer: "The variety of living organisms in a habitat",
  },
  {
    id: "q023_04",
    quiz_id: "quiz_023",
    type: "mcq",
    question_text: "Primary producers in a food chain are typically:",
    options: ["Carnivores", "Herbivores", "Plants", "Decomposers"],
    correct_answer: "Plants",
  },
  {
    id: "q023_05",
    quiz_id: "quiz_023",
    type: "fill_blank",
    question_text:
      "The layer of the atmosphere that absorbs harmful UV radiation is the _____ layer.",
    correct_answer: "ozone",
  },
  {
    id: "q023_06",
    quiz_id: "quiz_023",
    type: "mcq",
    question_text: "Eutrophication of water bodies is primarily caused by:",
    options: [
      "Acid rain",
      "Excess nutrients from agricultural runoff",
      "Oil spills",
      "Plastic pollution",
    ],
    correct_answer: "Excess nutrients from agricultural runoff",
  },
  {
    id: "q023_07",
    quiz_id: "quiz_023",
    type: "mcq",
    question_text:
      "An ecosystem with very high biodiversity is most likely to be:",
    options: [
      "A desert",
      "A tropical rainforest",
      "A polar ice cap",
      "A sand dune",
    ],
    correct_answer: "A tropical rainforest",
  },
  {
    id: "q023_08",
    quiz_id: "quiz_023",
    type: "fill_blank",
    question_text:
      "The process by which dead organic matter is broken down into simpler substances is _____.",
    correct_answer: "decomposition",
  },

  // quiz_024: CHM 211 — Thermodynamics & Equilibrium
  {
    id: "q024_01",
    quiz_id: "quiz_024",
    type: "mcq",
    question_text: "The First Law of Thermodynamics states that:",
    options: [
      "Heat flows from cold to hot",
      "Energy cannot be created or destroyed",
      "Entropy always increases",
      "Absolute zero cannot be reached",
    ],
    correct_answer: "Energy cannot be created or destroyed",
  },
  {
    id: "q024_02",
    quiz_id: "quiz_024",
    type: "fill_blank",
    question_text:
      "Enthalpy change for an exothermic reaction is _____ (positive/negative).",
    correct_answer: "negative",
  },
  {
    id: "q024_03",
    quiz_id: "quiz_024",
    type: "mcq",
    question_text: "Entropy is a measure of:",
    options: [
      "Temperature of a system",
      "Disorder or randomness of a system",
      "Heat content of a system",
      "Pressure of a system",
    ],
    correct_answer: "Disorder or randomness of a system",
  },
  {
    id: "q024_04",
    quiz_id: "quiz_024",
    type: "mcq",
    question_text: "In an endothermic reaction:",
    options: [
      "Heat is released to the surroundings",
      "Heat is absorbed from the surroundings",
      "No energy change occurs",
      "Entropy decreases",
    ],
    correct_answer: "Heat is absorbed from the surroundings",
  },
  {
    id: "q024_05",
    quiz_id: "quiz_024",
    type: "fill_blank",
    question_text: "The Gibbs free energy equation is ΔG = ΔH - T_____.",
    correct_answer: "ΔS|ΔS",
  },
  {
    id: "q024_06",
    quiz_id: "quiz_024",
    type: "mcq",
    question_text: "At equilibrium, the Gibbs free energy change (ΔG) is:",
    options: ["Positive", "Negative", "Zero", "Equal to ΔH"],
    correct_answer: "Zero",
  },
  {
    id: "q024_07",
    quiz_id: "quiz_024",
    type: "mcq",
    question_text:
      "The standard enthalpy of formation of an element in its standard state is:",
    options: ["Equal to its atomic mass", "Negative", "Positive", "Zero"],
    correct_answer: "Zero",
  },
  {
    id: "q024_08",
    quiz_id: "quiz_024",
    type: "fill_blank",
    question_text:
      "Hess's Law states that the total enthalpy change is independent of the _____ taken.",
    correct_answer: "route|path|pathway",
  },
];

// ─── Mock mutation helpers ────────────────────────────────────────────────────

/** Replace all questions for a given quiz_id (used on edit save). */
export function replaceQuestionsForQuiz(
  quizId: string,
  newQs: Question[],
): void {
  // Remove existing
  const toRemove = new Set(
    questions.filter((q) => q.quiz_id === quizId).map((q) => q.id),
  );
  toRemove.forEach((id) => {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx !== -1) questions.splice(idx, 1);
  });
  // Append new
  questions.push(...newQs);
}

/** Append questions for a new quiz. */
export function appendQuestionsForQuiz(newQs: Question[]): void {
  questions.push(...newQs);
}
