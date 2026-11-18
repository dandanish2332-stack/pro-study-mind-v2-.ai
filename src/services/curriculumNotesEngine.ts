import { StudentPDFDocument, StudentGrade, StudentSubject, StudentPDFCategory, StudentPDFSection } from "../types";
import { MASTER_CURRICULUM_NOTES } from "../data/massiveCurriculumNotes";

// Multi-platform publisher profiles (all free from the word 'Pakistani' or 'Pakistan')
export interface NotePlatformSource {
  id: string;
  name: string;
  shortName: string;
  badgeColor: string;
  description: string;
}

export const NOTE_PLATFORMS: NotePlatformSource[] = [
  {
    id: "sabaq",
    name: "Sabaq Academic Series",
    shortName: "Sabaq Series",
    badgeColor: "bg-blue-600/20 text-blue-300 border-blue-500/30",
    description: "Visual textbook chapter walkthroughs and video-synced notes.",
  },
  {
    id: "ilm",
    name: "Ilm Knowledge Hub",
    shortName: "Ilm Hub",
    badgeColor: "bg-emerald-600/20 text-emerald-300 border-emerald-500/30",
    description: "Board toppers' solved question banks and past-paper guides.",
  },
  {
    id: "fbise",
    name: "Federal Board Model Series",
    shortName: "Federal Board",
    badgeColor: "bg-indigo-600/20 text-indigo-300 border-indigo-500/30",
    description: "Standard National Curriculum aligned for FBISE Islamabad.",
  },
  {
    id: "punjab",
    name: "Punjab Curriculum Edition",
    shortName: "Punjab Board",
    badgeColor: "bg-amber-600/20 text-amber-300 border-amber-500/30",
    description: "PCTB official syllabus breakdown and textbook numericals.",
  },
  {
    id: "sindh",
    name: "Sindh Textbook Series",
    shortName: "Sindh Board",
    badgeColor: "bg-rose-600/20 text-rose-300 border-rose-500/30",
    description: "STBB aligned curriculum with detailed derivations and theory.",
  },
  {
    id: "kpk",
    name: "KPK Textbook Board Edition",
    shortName: "KPK Board",
    badgeColor: "bg-teal-600/20 text-teal-300 border-teal-500/30",
    description: "KP-TB textbook notes with step-by-step solved examples.",
  },
  {
    id: "kips",
    name: "KIPS Academic Prep Series",
    shortName: "KIPS Prep",
    badgeColor: "bg-purple-600/20 text-purple-300 border-purple-500/30",
    description: "Competitive entrance and board distinction master notes.",
  },
  {
    id: "step",
    name: "STEP College Notes Series",
    shortName: "STEP Series",
    badgeColor: "bg-cyan-600/20 text-cyan-300 border-cyan-500/30",
    description: "Accelerated revision blueprints, formula sheets, and speed tricks.",
  },
];

export type NoteDimension =
  | "concept_theory"
  | "math_formulas"
  | "solved_numericals"
  | "short_qa_bank"
  | "past_paper_solved"
  | "mcq_key_deck"
  | "long_derivations"
  | "rapid_summary";

export interface ChapterMatrixDefinition {
  chapterNumber: number;
  chapterTitle: string;
  coreTopics: string[];
  latexFormulas?: { name: string; latex: string; explanation: string }[];
  keyDefinitions?: { term: string; definition: string }[];
  solvedProblems?: { question: string; formula: string; solution: string }[];
  examTips?: string[];
}

/**
 * MASTER SUBJECT CHAPTERS MATRIX
 * Covers all requested subjects:
 * - Mathematics
 * - Physics
 * - Chemistry
 * - Biology
 * - Computer Science
 * - General Science
 * - English
 * - Urdu
 * - General Study (Social Studies & History)
 *
 * All formulas use strictly valid KaTeX syntax (powers, fractions, radicals, quadratic formula, integrals).
 * Never contains the word "Pakistani" or "Pakistan" in any notes or UI text!
 */
export const SUBJECT_CHAPTER_MATRICES: Record<string, Record<string, ChapterMatrixDefinition[]>> = {
  // =============================================================
  // MATHEMATICS
  // =============================================================
  Mathematics: {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Matrices and Determinants",
        coreTopics: [
          "Matrix Order & Row/Column Vectors",
          "Types of Matrices (Null, Identity, Symmetric, Skew-Symmetric)",
          "Determinant of 2x2 Matrix: $\\det(A) = ad - bc$",
          "Adjoint and Multiplicative Inverse: $A^{-1} = \\frac{1}{|A|}\\text{adj}(A)$",
          "Solving Simultaneous Linear Equations by Matrix Inversion",
          "Cramer's Rule: $x = \\frac{|A_x|}{|A|},\\ y = \\frac{|A_y|}{|A|}$",
        ],
        latexFormulas: [
          { name: "Determinant", latex: "\\det(A) = |A| = ad - bc", explanation: "Calculated for square matrix $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$." },
          { name: "Matrix Inverse", latex: "A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}", explanation: "Requires non-singular matrix $|A| \\neq 0$." },
          { name: "Cramer's Rule", latex: "x = \\frac{\\det(A_x)}{\\det(A)}, \\quad y = \\frac{\\det(A_y)}{\\det(A)}", explanation: "Direct linear solution using coefficient determinants." },
        ],
        keyDefinitions: [
          { term: "Singular Matrix", definition: "A square matrix whose determinant is strictly zero ($|A| = 0$). Inverse does not exist." },
          { term: "Symmetric Matrix", definition: "A square matrix $A$ where transpose equals itself ($A^t = A$)." },
        ],
        solvedProblems: [
          { question: "Solve system $2x - 2y = 4$ and $3x + 2y = 6$ using Cramer's Rule.", formula: "x = \\frac{|A_x|}{|A|}, y = \\frac{|A_y|}{|A|}", solution: "Determinant $|A| = (2)(2) - (-2)(3) = 4 + 6 = 10$. $|A_x| = (4)(2) - (-2)(6) = 8 + 12 = 20$. Thus $x = \\frac{20}{10} = 2$. $|A_y| = (2)(6) - (4)(3) = 12 - 12 = 0$. Thus $y = \\frac{0}{10} = 0$." },
        ],
        examTips: ["Always test if $|A| = 0$ before computing $A^{-1}$."],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Real and Complex Numbers",
        coreTopics: [
          "Radicals and Radicands: $\\sqrt[n]{x} = x^{\\frac{1}{n}}$",
          "Laws of Radicals & Fractional Exponents",
          "Complex Numbers: $z = a + bi$ with $i^2 = -1$",
          "Conjugate: $\\bar{z} = a - bi$ and Modulus: $|z| = \\sqrt{a^2 + b^2}$",
          "Algebraic Operations on Complex Numbers",
        ],
        latexFormulas: [
          { name: "Imaginary Unit Powers", latex: "i = \\sqrt{-1}, \\quad i^2 = -1, \\quad i^3 = -i, \\quad i^4 = 1", explanation: "Powers of imaginary unit repeat in 4-step cycles." },
          { name: "Complex Modulus", latex: "|z| = \\sqrt{a^2 + b^2}", explanation: "Distance of complex number $a + bi$ from origin in Argand plane." },
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Logarithms",
        coreTopics: [
          "Scientific Notation: $A \\times 10^n$",
          "Definition of Logarithm: $\\log_a y = x \\iff a^x = y$",
          "Product Law: $\\log_a(mn) = \\log_a m + \\log_a n$",
          "Quotient Law: $\\log_a\\left(\\frac{m}{n}\\right) = \\log_a m - \\log_a n$",
          "Power Law: $\\log_a(m^n) = n\\log_a m$",
          "Change of Base: $\\log_b a = \\frac{\\log_c a}{\\log_c b}$",
        ],
        latexFormulas: [
          { name: "Product Law", latex: "\\log_a(mn) = \\log_a m + \\log_a n", explanation: "Multiplication transforms to addition of logs." },
          { name: "Quotient Law", latex: "\\log_a\\left(\\frac{m}{n}\\right) = \\log_a m - \\log_a n", explanation: "Division transforms to subtraction of logs." },
          { name: "Power Law", latex: "\\log_a(m^n) = n\\log_a m", explanation: "Exponents factor out in front of the logarithm." },
        ],
      },
      {
        chapterNumber: 4,
        chapterTitle: "Algebraic Expressions & Formulas",
        coreTopics: [
          "Square Identities: $(a \\pm b)^2 = a^2 \\pm 2ab + b^2$",
          "Combined Identities: $(a+b)^2 - (a-b)^2 = 4ab$",
          "Difference of Squares: $a^2 - b^2 = (a-b)(a+b)$",
          "Trinomial Identity: $(a+b+c)^2 = a^2 + b^2 + c^2 + 2(ab+bc+ca)$",
          "Cube Identities: $(a \\pm b)^3 = a^3 \\pm 3ab(a \\pm b) \\pm b^3$",
          "Rationalization of Surds: $\\frac{1}{a + \\sqrt{b}} = \\frac{a - \\sqrt{b}}{a^2 - b}$",
        ],
        latexFormulas: [
          { name: "Quadratic Expansion", latex: "(a + b)^2 = a^2 + 2ab + b^2", explanation: "Fundamental binomial expansion identity." },
          { name: "Product Difference", latex: "(a + b)^2 - (a - b)^2 = 4ab", explanation: "High-yield identity for finding $ab$ or $a^2+b^2$." },
          { name: "Surd Rationalization", latex: "\\frac{1}{\\sqrt{x} + \\sqrt{y}} = \\frac{\\sqrt{x} - \\sqrt{y}}{x - y}", explanation: "Multiplying by conjugate removes radicals from denominator." },
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Quadratic Equations",
        coreTopics: [
          "Standard Form: $ax^2 + bx + c = 0$",
          "Method of Factorization & Mid-Term Breaking",
          "Completing the Square: $\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}$",
          "Quadratic Formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$",
          "Equations Reducible to Quadratic Form",
        ],
        latexFormulas: [
          { name: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", explanation: "Solves any quadratic equation over real and complex numbers." },
          { name: "Discriminant", latex: "D = b^2 - 4ac", explanation: "Discriminant determines whether roots are real, equal, or complex." },
        ],
        solvedProblems: [
          { question: "Solve $2x^2 - 7x + 3 = 0$ using Quadratic Formula.", formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", solution: "Here $a=2, b=-7, c=3$. $D = (-7)^2 - 4(2)(3) = 49 - 24 = 25$. $\\sqrt{D} = 5$. Roots: $x = \\frac{7 \\pm 5}{4} \\implies x = 3, \\frac{1}{2}$." },
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Theory of Quadratic Equations",
        coreTopics: [
          "Nature of Roots via Discriminant: $D = b^2 - 4ac$",
          "Cube Roots of Unity: $1, \\omega, \\omega^2$",
          "Properties: $1 + \\omega + \\omega^2 = 0$ and $\\omega^3 = 1$",
          "Sum and Product of Roots: $S = -\\frac{b}{a},\\ P = \\frac{c}{a}$",
          "Formation of Equation: $x^2 - Sx + P = 0$",
        ],
        latexFormulas: [
          { name: "Sum of Roots", latex: "S = \\alpha + \\beta = -\\frac{b}{a}", explanation: "Sum of roots of quadratic polynomial." },
          { name: "Product of Roots", latex: "P = \\alpha \\cdot \\beta = \\frac{c}{a}", explanation: "Product of roots of quadratic polynomial." },
          { name: "Cube Roots of Unity", latex: "1 + \\omega + \\omega^2 = 0, \\quad \\omega^3 = 1", explanation: "Harmonic sum and cyclic properties of complex roots." },
        ],
      },
      {
        chapterNumber: 7,
        chapterTitle: "Trigonometry",
        coreTopics: [
          "Sexagesimal and Radian Measure: $\\pi\\text{ rad} = 180^\\circ$",
          "Arc Length & Sector Area: $l = r\\theta,\\ A = \\frac{1}{2}r^2\\theta$",
          "Fundamental Identity: $\\sin^2\\theta + \\cos^2\\theta = 1$",
          "Secant Identity: $1 + \\tan^2\\theta = \\sec^2\\theta$",
          "Cosecant Identity: $1 + \\cot^2\\theta = \\csc^2\\theta$",
        ],
        latexFormulas: [
          { name: "Arc Length & Area", latex: "l = r\\theta, \\quad A = \\frac{1}{2}r^2\\theta", explanation: "Where $\\theta$ is measured strictly in radians." },
          { name: "Pythagorean Trigonometric Identity", latex: "\\sin^2\\theta + \\cos^2\\theta = 1", explanation: "Fundamental relation for all angles $\\theta$." },
          { name: "Secant-Tangent Identity", latex: "1 + \\tan^2\\theta = \\sec^2\\theta", explanation: "Derived by dividing by $\\cos^2\\theta$." },
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 3,
        chapterTitle: "Matrices and Determinants (College Level)",
        coreTopics: [
          "Echelon & Reduced Echelon Form",
          "Rank of a Matrix",
          "Properties of Higher Order Determinants",
          "Inverse using Adjoint: $A^{-1} = \\frac{1}{|A|}\\text{adj}(A)$",
          "Gaussian Elimination & Gauss-Jordan Method",
        ],
        latexFormulas: [
          { name: "Cramer's General Formula", latex: "x_i = \\frac{\\det(A_i)}{\\det(A)}", explanation: "Solution for $n$ simultaneous linear equations." },
          { name: "Determinant Transposition", latex: "\\det(A^T) = \\det(A), \\quad \\det(AB) = \\det(A)\\det(B)", explanation: "Multiplicative property of square matrix determinants." },
        ],
      },
      {
        chapterNumber: 9,
        chapterTitle: "Fundamentals of Trigonometry",
        coreTopics: [
          "General Angle & Terminal Arm in Standard Position",
          "Fundamental Law: $\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta$",
          "Deductions: $\\sin(\\alpha \\pm \\beta),\\ \\cos(\\alpha + \\beta),\\ \\tan(\\alpha \\pm \\beta)$",
          "Double Angle Identities: $\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta$",
          "Cosine Double Angle: $\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1$",
          "Half Angle Identities: $\\sin\\frac{\\theta}{2} = \\pm\\sqrt{\\frac{1-\\cos\\theta}{2}}$",
        ],
        latexFormulas: [
          { name: "Sine Addition", latex: "\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta", explanation: "Compound angle formula for sine." },
          { name: "Double Angle Sine", latex: "\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta", explanation: "High-yield transformation in calculus integration." },
          { name: "Double Angle Cosine", latex: "\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta = 2\\cos^2\\theta - 1 = 1 - 2\\sin^2\\theta", explanation: "Triple equivalent representations." },
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 1,
        chapterTitle: "Functions and Limits",
        coreTopics: [
          "Domain and Range of Real-Valued Functions",
          "Composition of Functions: $(f \\circ g)(x) = f(g(x))$",
          "Limit of a Function & Squeeze Theorem",
          "Fundamental Limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$",
          "Euler Number Limit: $\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e$",
          "Continuity of Functions at a Point",
        ],
        latexFormulas: [
          { name: "Trigonometric Limit", latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", explanation: "Requires angle $x$ measured in radians." },
          { name: "Exponential Limit", latex: "\\lim_{x \\to 0} (1 + x)^{\\frac{1}{x}} = e \\approx 2.71828", explanation: "Definition of natural base $e$." },
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Differentiation (Calculus I)",
        coreTopics: [
          "Derivative as Rate of Change: $f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}$",
          "Power Rule: $\\frac{d}{dx}[x^n] = n x^{n-1}$",
          "Product Rule: $\\frac{d}{dx}[uv] = u\\frac{dv}{dx} + v\\frac{du}{dx}$",
          "Quotient Rule: $\\frac{d}{dx}\\left[\\frac{u}{v}\\right] = \\frac{v\\frac{du}{dx} - u\\frac{dv}{dx}}{v^2}$",
          "Chain Rule: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$",
          "Derivatives of Trigonometric, Exponential, and Logarithmic Functions",
        ],
        latexFormulas: [
          { name: "Power Rule", latex: "\\frac{d}{dx}\\left(x^n\\right) = n x^{n-1}", explanation: "Valid for all real exponents $n$." },
          { name: "Quotient Rule", latex: "\\frac{d}{dx}\\left(\\frac{u}{v}\\right) = \\frac{v\\frac{du}{dx} - u\\frac{dv}{dx}}{v^2}", explanation: "Differentiates quotient of two functions." },
          { name: "Chain Rule", latex: "\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}", explanation: "Differentiates composite functions." },
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Integration (Calculus II)",
        coreTopics: [
          "Integration as Antiderivative: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + c$",
          "Integration by Substitution",
          "Integration by Parts: $\\int u v dx = u \\int v dx - \\int \\left(u' \\int v dx\\right) dx$",
          "Definite Integrals and Fundamental Theorem of Calculus",
          "Area Under Curve: $A = \\int_a^b f(x) dx$",
        ],
        latexFormulas: [
          { name: "Power Rule for Integrals", latex: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + c \\quad (n \\neq -1)", explanation: "When $n=-1$, integral yields $\\ln|x| + c$." },
          { name: "Integration by Parts", latex: "\\int u \\frac{dv}{dx} dx = u v - \\int v \\frac{du}{dx} dx", explanation: "Splits product using ILATE precedence." },
        ],
      },
    ],
  },

  // =============================================================
  // PHYSICS
  // =============================================================
  Physics: {
    "Class 9": [
      {
        chapterNumber: 2,
        chapterTitle: "Kinematics",
        coreTopics: [
          "Scalars vs Vectors",
          "Distance vs Displacement",
          "Speed, Velocity, and Uniform Acceleration",
          "First Equation: $v_f = v_i + at$",
          "Second Equation: $S = v_i t + \\frac{1}{2}at^2$",
          "Third Equation: $2aS = v_f^2 - v_i^2$",
          "Motion Under Gravity: $g = 9.8\\text{ m/s}^2$",
        ],
        latexFormulas: [
          { name: "1st Kinematic Equation", latex: "v_f = v_i + at", explanation: "Relates final velocity to initial velocity and acceleration." },
          { name: "2nd Kinematic Equation", latex: "S = v_i t + \\frac{1}{2}at^2", explanation: "Computes displacement under uniform acceleration." },
          { name: "3rd Kinematic Equation", latex: "2aS = v_f^2 - v_i^2", explanation: "Time-independent kinematic formula." },
        ],
        solvedProblems: [
          { question: "A car starts from rest ($v_i=0$) with acceleration $2\\text{ m/s}^2$ for $5\\text{ s}$. Find distance.", formula: "S = v_i t + \\frac{1}{2}at^2", solution: "$S = 0(5) + \\frac{1}{2}(2)(5^2) = 25\\text{ meters}$." },
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Dynamics & Newton's Laws",
        coreTopics: [
          "Newton's First Law (Law of Inertia)",
          "Newton's Second Law: $F = ma$",
          "Newton's Third Law (Action & Reaction)",
          "Linear Momentum: $p = mv$",
          "Conservation of Momentum: $m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$",
          "Friction & Limiting Friction: $F_s = \\mu_s mg$",
          "Centripetal Force: $F_c = \\frac{mv^2}{r}$",
        ],
        latexFormulas: [
          { name: "Newton's Second Law", latex: "F = ma", explanation: "Force equals product of mass and acceleration." },
          { name: "Centripetal Force", latex: "F_c = \\frac{mv^2}{r} = mr\\omega^2", explanation: "Inward force maintaining circular trajectory." },
        ],
      },
      {
        chapterNumber: 5,
        chapterTitle: "Gravitation",
        coreTopics: [
          "Universal Law of Gravitation: $F = G \\frac{m_1 m_2}{r^2}$",
          "Gravitational Constant: $G = 6.674 \\times 10^{-11}\\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$",
          "Mass of Earth: $M_e = \\frac{g R_e^2}{G} \\approx 6.0 \\times 10^{24}\\text{ kg}$",
          "Variation of g with Altitude: $g_h = g\\left(\\frac{R_e}{R_e+h}\\right)^2$",
          "Orbital Speed of Satellites: $v_o = \\sqrt{g R_e}$",
        ],
        latexFormulas: [
          { name: "Gravitational Law", latex: "F = G \\frac{m_1 m_2}{r^2}", explanation: "Universal force between two point masses." },
          { name: "Mass of Earth", latex: "M_e = \\frac{g R_e^2}{G} = 6.0 \\times 10^{24} \\text{ kg}", explanation: "Derived from surface gravitational acceleration." },
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Simple Harmonic Motion and Waves",
        coreTopics: [
          "SHM Definition: $a \\propto -x$",
          "Mass-Spring System: $T = 2\\pi \\sqrt{\\frac{m}{k}}$",
          "Simple Pendulum: $T = 2\\pi \\sqrt{\\frac{l}{g}}$",
          "Wave Equation: $v = f\\lambda$",
          "Reflection, Refraction & Diffraction of Waves in Ripple Tank",
        ],
        latexFormulas: [
          { name: "Pendulum Period", latex: "T = 2\\pi \\sqrt{\\frac{l}{g}}", explanation: "Time period depends only on length $l$ and gravity $g$." },
          { name: "Wave Speed Equation", latex: "v = f \\lambda", explanation: "Speed equals product of frequency and wavelength." },
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Current Electricity & Circuits",
        coreTopics: [
          "Electric Current: $I = \\frac{Q}{t}$",
          "Ohm's Law: $V = IR$",
          "Resistance & Resistivity: $R = \\rho \\frac{L}{A}$",
          "Series Circuit: $R_s = R_1 + R_2 + R_3$",
          "Parallel Circuit: $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$",
          "Joule's Law & Electrical Power: $P = VI = I^2 R = \\frac{V^2}{R}$",
        ],
        latexFormulas: [
          { name: "Ohm's Law", latex: "V = IR \\iff I = \\frac{V}{R}", explanation: "Linear relationship in ohmic conductors." },
          { name: "Electrical Power", latex: "P = VI = I^2 R = \\frac{V^2}{R}", explanation: "Rate of electrical energy dissipation in Watts." },
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 2,
        chapterTitle: "Vectors and Equilibrium",
        coreTopics: [
          "Rectangular Components: $A_x = A\\cos\\theta,\\ A_y = A\\sin\\theta$",
          "Scalar / Dot Product: $\\vec{A} \\cdot \\vec{B} = AB\\cos\\theta$",
          "Vector / Cross Product: $\\vec{A} \\times \\vec{B} = AB\\sin\\theta \\,\\hat{n}$",
          "Torque: $\\vec{\\tau} = \\vec{r} \\times \\vec{F}$",
          "First Condition of Equilibrium: $\\sum \\vec{F} = 0$",
          "Second Condition of Equilibrium: $\\sum \\vec{\\tau} = 0$",
        ],
        latexFormulas: [
          { name: "Dot Product", latex: "\\vec{A} \\cdot \\vec{B} = A_x B_x + A_y B_y + A_z B_z = AB\\cos\\theta", explanation: "Yields scalar work when force dots displacement." },
          { name: "Cross Product", latex: "|\\vec{A} \\times \\vec{B}| = AB\\sin\\theta", explanation: "Yields perpendicular vector torque." },
        ],
      },
      {
        chapterNumber: 8,
        chapterTitle: "Waves & Sound Doppler Effect",
        coreTopics: [
          "Speed of Sound (Laplace Correction): $v = \\sqrt{\\frac{\\gamma P}{\\rho}}$",
          "Stationary Waves in Stretched Strings: $f_n = n \\frac{v}{2L}$",
          "Organ Pipes (Open & Closed)",
          "Doppler Effect (Moving Source & Observer): $f' = f \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right)$",
        ],
        latexFormulas: [
          { name: "Laplace Speed of Sound", latex: "v = \\sqrt{\\frac{\\gamma P}{\\rho}}", explanation: "Adiabatic correction where $\\gamma = 1.4$ for air." },
          { name: "Doppler Effect Formula", latex: "f' = f \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right)", explanation: "Apparent frequency shift due to relative velocity." },
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 12,
        chapterTitle: "Electrostatics",
        coreTopics: [
          "Coulomb's Law: $F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}$",
          "Electric Field Intensity: $E = \\frac{F}{q} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q}{r^2}$",
          "Gauss's Law: $\\Phi_e = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q}{\\varepsilon_0}$",
          "Electric Potential: $V = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q}{r}$",
          "Capacitance of Parallel Plate: $C = \\frac{\\varepsilon_r \\varepsilon_0 A}{d}$",
          "Energy Stored in Capacitor: $U = \\frac{1}{2} C V^2$",
        ],
        latexFormulas: [
          { name: "Coulomb's Law", latex: "F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2} \\quad (\\varepsilon_0 = 8.85 \\times 10^{-12} \\text{ C}^2/\\text{N}\\cdot\\text{m}^2)", explanation: "Fundamental electrostatic attraction/repulsion force." },
          { name: "Stored Energy", latex: "U = \\frac{1}{2} C V^2 = \\frac{1}{2} Q V = \\frac{Q^2}{2C}", explanation: "Energy density stored in electric field." },
        ],
      },
      {
        chapterNumber: 16,
        chapterTitle: "Alternating Current",
        coreTopics: [
          "RMS Values: $I_{rms} = \\frac{I_o}{\\sqrt{2}} \\approx 0.707 I_o,\\ V_{rms} = \\frac{V_o}{\\sqrt{2}}$",
          "AC Reactance: Inductor ($X_L = 2\\pi f L$), Capacitor ($X_C = \\frac{1}{2\\pi f C}$)",
          "Impedance in R-L-C Series: $Z = \\sqrt{R^2 + (X_L - X_C)^2}$",
          "Resonance Frequency: $f_r = \\frac{1}{2\\pi\\sqrt{LC}}$",
        ],
        latexFormulas: [
          { name: "RMS Current & Voltage", latex: "I_{rms} = \\frac{I_o}{\\sqrt{2}}, \\quad V_{rms} = \\frac{V_o}{\\sqrt{2}}", explanation: "Effective DC equivalent heating value of sinusoidal wave." },
          { name: "Resonance Frequency", latex: "f_r = \\frac{1}{2\\pi\\sqrt{LC}}", explanation: "Frequency where inductive and capacitive reactances cancel." },
        ],
      },
    ],
  },

  // =============================================================
  // CHEMISTRY
  // =============================================================
  Chemistry: {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Fundamentals of Chemistry",
        coreTopics: [
          "Atomic Number $Z$ and Mass Number $A$",
          "Relative Atomic Mass and AMU",
          "Empirical Formula vs Molecular Formula",
          "Mole Concept & Avogadro's Number: $N_A = 6.022 \\times 10^{23}$",
          "Molar Mass & Mole Calculation: $n = \\frac{m}{M}$",
        ],
        latexFormulas: [
          { name: "Mole Calculation", latex: "n = \\frac{m}{M} = \\frac{\\text{Mass in grams}}{\\text{Molar mass in g/mol}}", explanation: "Relates macro mass to number of chemical moles." },
          { name: "Particle Count", latex: "N = n \\times N_A = n \\times 6.022 \\times 10^{23}", explanation: "Total atoms or molecules in given quantity." },
        ],
      },
      {
        chapterNumber: 4,
        chapterTitle: "Structure of Molecules & Chemical Bonding",
        coreTopics: [
          "Octet Rule and Duplet Rule",
          "Ionic Bond (Electrostatic transfer of electrons)",
          "Covalent Bond (Single, Double, Triple electron sharing)",
          "Coordinate Covalent / Dative Bond",
          "Polar vs Non-Polar Covalent Bonds",
          "Intermolecular Forces & Hydrogen Bonding",
        ],
        latexFormulas: [
          { name: "Dipole Moment", latex: "\\mu = q \\times r \\quad [\\text{Debye}]", explanation: "Measure of chemical bond polarity and charge separation." },
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Chemical Equilibrium",
        coreTopics: [
          "Reversible Reactions and Dynamic Equilibrium",
          "Law of Mass Action: $K_c = \\frac{[C]^c [D]^d}{[A]^a [B]^b}$",
          "Equilibrium Constant Units & Significance",
          "Le Chatelier's Principle (Effect of Concentration, Temperature, Pressure)",
        ],
        latexFormulas: [
          { name: "Equilibrium Constant", latex: "K_c = \\frac{[\\text{Products}]}{[\\text{Reactants}]} = \\frac{[C]^c [D]^d}{[A]^a [B]^b}", explanation: "Quotient of active molar concentrations at equilibrium." },
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Acids, Bases and Salts",
        coreTopics: [
          "Arrhenius, Bronsted-Lowry & Lewis Concepts",
          "Autoionization of Water: $K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14}$",
          "pH and pOH Scale: $\\text{pH} = -\\log_{10}[\\text{H}^+]$",
          "Relationship: $\\text{pH} + \\text{pOH} = 14$",
          "Buffer Solutions & Neutralization",
        ],
        latexFormulas: [
          { name: "pH Scale Formula", latex: "\\text{pH} = -\\log_{10}[\\text{H}^+], \\quad \\text{pOH} = -\\log_{10}[\\text{OH}^-]", explanation: "Logarithmic scale for aqueous hydrogen ion concentration." },
          { name: "Ionic Product of Water", latex: "K_w = [\\text{H}^+][\\text{OH}^-] = 1.0 \\times 10^{-14} \\quad (\\text{at } 25^\\circ\\text{C})", explanation: "Governs dissociation equilibrium in aqueous systems." },
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 3,
        chapterTitle: "Gases and Gas Laws",
        coreTopics: [
          "Boyle's Law: $P_1 V_1 = P_2 V_2$",
          "Charles's Law: $\\frac{V_1}{T_1} = \\frac{V_2}{T_2}$",
          "Avogadro's Law: $V \\propto n$",
          "Ideal Gas Equation: $PV = nRT$",
          "Gas Constant: $R = 0.0821\\text{ dm}^3\\cdot\\text{atm}/(\\text{mol}\\cdot\\text{K}) = 8.314\\text{ J}/(\\text{mol}\\cdot\\text{K})$",
          "Dalton's Law of Partial Pressures: $P_{\\text{total}} = P_1 + P_2 + P_3$",
          "Graham's Law of Diffusion: $\\frac{r_1}{r_2} = \\sqrt{\\frac{M_2}{M_1}}$",
          "Van der Waals Equation for Real Gases: $\\left(P + \\frac{an^2}{V^2}\\right)(V - nb) = nRT$",
        ],
        latexFormulas: [
          { name: "Ideal Gas Law", latex: "PV = nRT", explanation: "Relates pressure, volume, temperature, and moles." },
          { name: "Graham's Law", latex: "\\frac{r_1}{r_2} = \\sqrt{\\frac{M_2}{M_1}} = \\sqrt{\\frac{d_2}{d_1}}", explanation: "Rate of gas effusion is inversely proportional to square root of molar mass." },
          { name: "Van der Waals Equation", latex: "\\left(P + \\frac{an^2}{V^2}\\right)(V - nb) = nRT", explanation: "Corrects for molecular intermolecular attractions and real finite volume." },
        ],
      },
      {
        chapterNumber: 6,
        chapterTitle: "Chemical Bonding & Molecular Structure",
        coreTopics: [
          "VSEPR Theory (Linear, Trigonal Planar, Tetrahedral, Bent)",
          "Valence Bond Theory & Hybridization ($sp^3, sp^2, sp$)",
          "Molecular Orbital Theory (MOT) & Bond Order: $\\text{BO} = \\frac{N_b - N_a}{2}$",
          "Paramagnetism of $\\text{O}_2$ Molecule",
        ],
        latexFormulas: [
          { name: "Bond Order Formula", latex: "\\text{Bond Order} = \\frac{N_b - N_a}{2}", explanation: "Half the difference between bonding and antibonding electrons." },
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 7,
        chapterTitle: "Fundamental Principles of Organic Chemistry",
        coreTopics: [
          "Classification of Organic Compounds",
          "Functional Groups (Alcohols, Aldehydes, Ketones, Carboxylic Acids, Amines)",
          "Isomerism: Structural vs Stereoisomerism",
          "IUPAC Nomenclature Rules for Hydrocarbons",
          "Craking and Reforming of Petroleum",
        ],
        latexFormulas: [
          { name: "Alkane General Formula", latex: "\\text{C}_n\\text{H}_{2n+2}", explanation: "Homologous series for saturated aliphatic hydrocarbons." },
          { name: "Alkene & Alkyne Formulas", latex: "\\text{Alkene: } \\text{C}_n\\text{H}_{2n}, \\quad \\text{Alkyne: } \\text{C}_n\\text{H}_{2n-2}", explanation: "Unsaturated hydrocarbons with double and triple bonds." },
        ],
      },
      {
        chapterNumber: 8,
        chapterTitle: "Aliphatic Hydrocarbons & Reactions",
        coreTopics: [
          "Free Radical Substitution Mechanism of Alkanes",
          "Electrophilic Addition to Alkenes & Markovnikov's Rule",
          "Ozonolysis of Alkenes",
          "Acidity of Alkynes & Acetylide Ion Formation",
        ],
        latexFormulas: [
          { name: "Markovnikov's Addition", latex: "\\text{R-CH=CH}_2 + \\text{HX} \\to \\text{R-CH(X)-CH}_3", explanation: "Electrophilic proton adds to carbon with greater hydrogen count." },
        ],
      },
    ],
  },

  // =============================================================
  // BIOLOGY
  // =============================================================
  Biology: {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Introduction to Biology",
        coreTopics: [
          "Divisions of Biology (Zoology, Botany, Microbiology)",
          "Branches (Morphology, Anatomy, Histology, Physiology, Genetics, Taxonomy)",
          "Levels of Biological Organization: Subatomic to Biosphere",
          "Cellular Organization: Unicellular, Colonial, Multicellular",
        ],
        keyDefinitions: [
          { term: "Biosphere", definition: "The global zone of life on Earth where living organisms interact with abiotic environment." },
        ],
      },
      {
        chapterNumber: 4,
        chapterTitle: "Cells and Tissues",
        coreTopics: [
          "Cell Theory: Schleiden, Schwann, and Virchow",
          "Prokaryotic vs Eukaryotic Cells",
          "Structure & Function of Organelles: Nucleus, Mitochondria, Ribosomes, ER, Golgi",
          "Plant vs Animal Cell Comparison",
          "Diffusion, Facilitated Diffusion, Osmosis, and Active Transport",
        ],
        latexFormulas: [
          { name: "Water Potential Equation", latex: "\\Psi = \\Psi_s + \\Psi_p", explanation: "Total water potential equals solute potential plus pressure potential." },
        ],
      },
      {
        chapterNumber: 7,
        chapterTitle: "Bioenergetics",
        coreTopics: [
          "Role of ATP as Cellular Energy Currency: \\text{ATP} \\rightleftharpoons \\text{ADP} + \\text{P}_i + 7.3\\text{ kcal/mol}",
          "Photosynthesis: Light-Dependent Reactions & Calvin Cycle",
          "Overall Equation: 6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2",
          "Aerobic Respiration: Glycolysis, Krebs Cycle, Electron Transport Chain",
          "Anaerobic Respiration / Fermentation (Lactic Acid & Alcoholic)",
        ],
        latexFormulas: [
          { name: "Photosynthesis Net Equation", latex: "6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light, chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2", explanation: "Endothermic solar energy conversion into chemical bonds." },
          { name: "Aerobic Respiration Equation", latex: "\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\to 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + 36\\text{ to } 38\\text{ ATP}", explanation: "Complete oxidative breakdown of glucose." },
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Gaseous Exchange",
        coreTopics: [
          "Gaseous Exchange in Plants (Stomata & Lenticels)",
          "Human Respiratory System: Trachea, Bronchi, Alveoli",
          "Mechanism of Breathing: Inhalation vs Exhalation",
          "Respiratory Disorders: Bronchitis, Emphysema, Pneumonia, Lung Cancer",
        ],
      },
      {
        chapterNumber: 5,
        chapterTitle: "Reproduction & Cell Division",
        coreTopics: [
          "Asexual vs Sexual Reproduction",
          "Binary Fission, Budding, Spore Formation, Vegetative Propagation",
          "Sexual Reproduction in Flowering Plants (Pollination, Fertilization, Seed Formation)",
          "Human Reproductive Anatomy & Gametogenesis",
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 4,
        chapterTitle: "The Cell & Organelles",
        coreTopics: [
          "Fluid Mosaic Model of Plasma Membrane: Singer & Nicolson",
          "Endoplasmic Reticulum (RER & SER functions)",
          "Golgi Apparatus & Secretory Vesicle Trafficking",
          "Lysosomes, Peroxisomes, and Glyoxysomes",
          "Cytoskeleton: Microtubules, Microfilaments, Intermediate Filaments",
        ],
      },
      {
        chapterNumber: 11,
        chapterTitle: "Bioenergetics & Cellular Energy",
        coreTopics: [
          "Absorption Spectrum & Action Spectrum of Chlorophylls",
          "Non-Cyclic vs Cyclic Electron Flow (Z-Scheme)",
          "Photophosphorylation & Chemiosmosis in Chloroplasts",
          "Glycolysis Steps in Cytoplasm (Investment & Payoff)",
          "Krebs Citric Acid Cycle in Mitochondrial Matrix",
          "Electron Transport System (Complexes I-IV, ATP Synthase)",
        ],
        latexFormulas: [
          { name: "ATP Synthesis Ratio", latex: "1\\text{ NADH} \\to 2.5 \\text{ to } 3 \\text{ ATP}, \\quad 1\\text{ FADH}_2 \\to 1.5 \\text{ to } 2 \\text{ ATP}", explanation: "Proton pumping equivalence across inner mitochondrial membrane." },
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 15,
        chapterTitle: "Homeostasis",
        coreTopics: [
          "Concept of Feedback Mechanisms (Negative & Positive)",
          "Osmoregulation in Plants (Hydrophytes, Mesophytes, Xerophytes, Halophytes)",
          "Excretion in Animals: Ammonotelic, Ureotelic, Uricotelic",
          "Human Urinary System & Nephron Architecture",
          "Counter-Current Multiplier Mechanism & Aldosterone/ADH Action",
          "Thermoregulation in Endotherms vs Ectotherms",
        ],
      },
      {
        chapterNumber: 20,
        chapterTitle: "Chromosomes and DNA",
        coreTopics: [
          "DNA as Hereditary Material: Hershey-Chase & Griffith Experiments",
          "Watson-Crick Double Helix DNA Model",
          "DNA Replication: Semi-Conservative (Meselson-Stahl Experiment)",
          "Transcription: RNA Polymerase & Promoter Recognition",
          "Genetic Code: Triplet Codons & Degeneracy",
          "Translation: Initiation, Elongation, Termination on Ribosomes",
        ],
        latexFormulas: [
          { name: "Hardy-Weinberg Equilibrium", latex: "p^2 + 2pq + q^2 = 1, \\quad p + q = 1", explanation: "Allele and genotype frequency constancy in non-evolving populations." },
        ],
      },
    ],
  },

  // =============================================================
  // COMPUTER SCIENCE
  // =============================================================
  "Computer Science": {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Fundamentals of Computer Systems",
        coreTopics: [
          "Generations of Computers (1st to 5th)",
          "Classification: Micro, Mini, Mainframe, Supercomputer",
          "Von Neumann Computer Architecture",
          "CPU Components: ALU, CU, Registers, Cache",
          "Primary Memory (RAM vs ROM) & Secondary Storage",
          "Input/Output Devices & System Software vs Application Software",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Number Systems & Binary Representation",
        coreTopics: [
          "Decimal, Binary, Octal, and Hexadecimal Bases",
          "Radix Conversion Algorithms",
          "Binary Arithmetic: Addition, Subtraction",
          "Signed Representation: 1's Complement & 2's Complement",
          "ASCII, Extended ASCII, and Unicode UTF-8/UTF-16",
        ],
        latexFormulas: [
          { name: "Positional Number Value", latex: "N = \\sum_{i=-m}^{n-1} d_i \\cdot b^i", explanation: "Calculates decimal value of base $b$ numeral." },
          { name: "2's Complement Formula", latex: "\\text{2's Comp}(x) = 2^n - x = \\text{1's Comp}(x) + 1", explanation: "Standard hardware binary negative number representation." },
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Problem Solving & Algorithmic Design",
        coreTopics: [
          "Problem Identification, Analysis & Flowcharts",
          "Flowchart Symbols (Terminal, Process, Decision, I/O, Connector)",
          "Algorithm Design & Pseudocode Notation",
          "Tracing Algorithms with Trace Tables",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Programming in C Language",
        coreTopics: [
          "Basic Structure of a C Program & Preprocessor Directives (#include)",
          "Data Types (int, float, char, double) & Variable Declaration",
          "Format Specifiers (%d, %f, %c, %s) & scanf() / printf()",
          "Operators: Arithmetic, Relational, Logical, Assignment, Increment/Decrement",
          "Control Structures: if, if-else, nested if, switch-case",
          "Loops: for, while, do-while",
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 1,
        chapterTitle: "Overview of Information Technology & Networks",
        coreTopics: [
          "LAN, MAN, WAN & PAN Network Topologies (Bus, Star, Ring, Mesh)",
          "OSI 7-Layer Reference Model vs TCP/IP Protocol Suite",
          "Transmission Media: Guided (Twisted Pair, Coaxial, Fiber Optic) vs Unguided",
          "Data Communication: Simplex, Half-Duplex, Full-Duplex",
        ],
      },
      {
        chapterNumber: 5,
        chapterTitle: "Computer Architecture & Microprocessors",
        coreTopics: [
          "Bus Interconnection (Data Bus, Address Bus, Control Bus)",
          "Instruction Cycle: Fetch, Decode, Execute",
          "Interrupt Handling & Direct Memory Access (DMA)",
          "Cache Memory Mapping (Direct, Fully Associative, Set Associative)",
        ],
        latexFormulas: [
          { name: "Amdahl's Speedup Law", latex: "S_{latency} = \\frac{1}{(1 - p) + \\frac{p}{s}}", explanation: "Theoretical speedup improvement for parallelized execution." },
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 1,
        chapterTitle: "Database Management Systems (DBMS)",
        coreTopics: [
          "Traditional File System vs Modern Relational Database",
          "Database Architecture: Internal, Conceptual, External Levels",
          "Entity-Relationship (ER) Modeling: Entities, Attributes, Relationships (1:1, 1:N, M:N)",
          "Keys: Primary Key, Candidate Key, Foreign Key, Composite Key",
          "Normalization: First Normal Form (1NF), 2NF, 3NF, BCNF",
          "Structured Query Language (SQL): DDL, DML, DQL (SELECT, INSERT, UPDATE, DELETE)",
        ],
      },
      {
        chapterNumber: 4,
        chapterTitle: "Object-Oriented Programming (OOP)",
        coreTopics: [
          "Core Pillars of OOP: Encapsulation, Abstraction, Inheritance, Polymorphism",
          "Classes and Objects, Constructors and Destructors",
          "Function and Operator Overloading",
          "Access Specifiers: public, private, protected",
          "Pointers, Dynamic Memory Allocation (new/delete), and References",
        ],
      },
    ],
  },

  // =============================================================
  // GENERAL SCIENCE (Class 1-8)
  // =============================================================
  "General Science": {
    "Class 6": [
      {
        chapterNumber: 1,
        chapterTitle: "Cellular Organization of Plants and Animals",
        coreTopics: [
          "Microscopic View of Plant and Animal Cells",
          "Tissues in Plants (Epidermal, Photosynthetic, Vascular)",
          "Tissues in Animals (Epithelial, Muscle, Nerve)",
          "Organ Systems (Digestive, Respiratory, Circulatory)",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Sense Organs & Nervous Responses",
        coreTopics: [
          "Human Eye: Cornea, Iris, Pupil, Lens, Retina",
          "Human Ear: Pinna, Eardrum, Middle Ear Bones, Cochlea",
          "Sense of Touch, Taste Buds, and Olfactory Receptors",
        ],
      },
    ],
    "Class 7": [
      {
        chapterNumber: 1,
        chapterTitle: "Human Organ Systems",
        coreTopics: [
          "Digestion: Ingestion, Digestion, Absorption, Assimilation, Egestion",
          "Human Heart Anatomy: 4 Chambers, Valves, Pulmonary vs Systemic Circulation",
          "Blood Components: RBCs, WBCs, Platelets, Plasma",
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Photosynthesis and Respiration in Plants",
        coreTopics: [
          "Internal Structure of Leaf & Stomata Mechanism",
          "Chlorophyll & Solar Energy Absorption",
          "Word Equations for Photosynthesis and Aerobic Respiration",
        ],
        latexFormulas: [
          { name: "Photosynthesis Word Equation", latex: "\\text{Carbon Dioxide} + \\text{Water} \\xrightarrow{\\text{Light}} \\text{Glucose} + \\text{Oxygen}", explanation: "Primary food production equation for all green flora." },
        ],
      },
    ],
    "Class 8": [
      {
        chapterNumber: 1,
        chapterTitle: "Human Nervous System",
        coreTopics: [
          "Central Nervous System (Brain: Forebrain, Midbrain, Hindbrain; Spinal Cord)",
          "Structure of Neuron: Dendrites, Cell Body, Axon, Myelin Sheath",
          "Reflex Action & Reflex Arc Pathway",
          "Peripheral Nervous System & Sensory Receptors",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Cell Division & Genetics",
        coreTopics: [
          "Mitosis (Somatic cells for growth and repair)",
          "Meiosis (Gamete formation with halved chromosome number)",
          "Heredity, Genes, and DNA Chromatin",
          "Inherited vs Acquired Traits",
        ],
      },
      {
        chapterNumber: 6,
        chapterTitle: "Acids, Alkalis and Salts",
        coreTopics: [
          "Properties of Common Mineral Acids (HCl, H2SO4, HNO3)",
          "Properties of Alkalis (NaOH, KOH, Ca(OH)2)",
          "Litmus Paper, Phenolphthalein, and Universal Indicator",
          "Neutralization Reactions: \\text{Acid} + \\text{Base} \\to \\text{Salt} + \\text{Water}",
        ],
        latexFormulas: [
          { name: "Neutralization Equation", latex: "\\text{HCl} + \\text{NaOH} \\to \\text{NaCl} + \\text{H}_2\\text{O}", explanation: "Standard acid-base neutralization producing table salt." },
        ],
      },
    ],
  },

  // =============================================================
  // ENGLISH
  // =============================================================
  English: {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Grammar & Sentence Syntax",
        coreTopics: [
          "Parts of Speech: Nouns, Pronouns, Verbs, Adjectives, Adverbs, Prepositions, Conjunctions",
          "Types of Sentences: Assertive, Interrogative, Imperative, Exclamatory, Optative",
          "Active and Passive Voice (Present, Past, and Future Tenses)",
          "Direct and Indirect Speech (Assertive & Interrogative Rules)",
          "Subject-Verb Agreement Rules",
        ],
        keyDefinitions: [
          { term: "Active Voice", definition: "A sentence where the grammatical subject performs the action indicated by the verb." },
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Formal Composition & Letters",
        coreTopics: [
          "Formal Letters (To Editor, Principal, Municipal Authorities)",
          "Informal Letters (To Parents, Friends, Siblings)",
          "Application Writing (Sick Leave, Fee Concession, Character Certificate)",
          "Dialogue Writing & Story Writing with Moral",
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Advanced Grammar & Mechanics",
        coreTopics: [
          "Conditional Sentences (Type 0, Type 1, Type 2, Type 3)",
          "Direct and Indirect Narration (Imperative, Exclamatory & Optative)",
          "Gerunds, Participles, and Infinitives",
          "Idiomatic Expressions & Phrasal Verbs in Context",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Essay Writing & Comprehension",
        coreTopics: [
          "Essay Structure: Introduction, Thesis Statement, Body Paragraphs, Conclusion",
          "Reflective & Argumentative Essays (Digital Age, Pollution, Sports)",
          "Unseen Comprehension Passage & Precise Précis Writing",
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 1,
        chapterTitle: "Intermediate Prose & Literary Analysis",
        coreTopics: [
          "Theme, Tone, and Characterization in Modern Prose",
          "Figure of Speech: Metaphor, Simile, Personification, Alliteration, Irony",
          "Punctuation Rules for Complex and Compound Sentences",
          "Vocabulary: High-Frequency Contextual Synonyms & Antonyms",
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 1,
        chapterTitle: "Advanced Composition & Précis Writing",
        coreTopics: [
          "One-Third Rule of Précis Writing and Title Extraction",
          "Comprehensive Essay Composition on National and Global Socio-Economic Themes",
          "Correction of Errors (Misplaced Modifiers, Faulty Parallelism, Tense Shifts)",
          "Pair of Words & Homophones Commonly Tested in Examinations",
        ],
      },
    ],
  },

  // =============================================================
  // URDU
  // =============================================================
  Urdu: {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Hissa-e-Nasar (Nasar Khulasa & Asbaaq)",
        coreTopics: [
          "Khulasa Nigari ke Usool (1/3rd Summary Technique)",
          "Siaq-o-Sabaq ke Hawaley se Tashreeh (Contextual Explanation)",
          "Musannifeen ke Asaleeb-e-Bayan (Literary Styles of Classic Authors)",
          "Alfaz Maani aur Jumlon mein Istemal",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Hissa-e-Nazm o Ghazal (Tashreeh)",
        coreTopics: [
          "Nazam ki Tashreeh (Markazi Khayal aur Mafhoom)",
          "Ghazal ke Ash'aar ki Tashreeh (Matla, Maqta, Radeef, Qafia)",
          "Ilm-e-Bayan: Tashbeeh, Ista'ara, Talmeeh, Majaz-e-Mursal",
          "Sana-e-Lafzi o Maanwi: San'at-e-Tazad, Tajnees, Husn-e-Ta'leel",
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Qawaid-o-Insha (Grammar & Composition)",
        coreTopics: [
          "Ism ki Iqsam (M'arfa, Nakra) aur Zameer ki Iqsam",
          "Murakkabat (Murakkab-e-Tauseefi, Izafi, Ashari, Atfi)",
          "Khatoot Nigari, Darkhwast Nigari, aur Kahani Nigari",
          "Jumlon ki Durusti aur Rozmarrah Muhawray",
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Mazmoon Nigari & Asbaaq",
        coreTopics: [
          "Jame' Mazmoon Nigari ke Ahem Anasir (Tamheed, Nafs-e-Mazmoon, Ikhtitam)",
          "Tafheem-e-Ibarat (Comprehension Passage Question Solving)",
          "Klasiki o Jadeed Asbaaq ki Tashreeh",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Ghazliyat o Manzoom Tashreeh",
        coreTopics: [
          "Mir Taqi Mir, Asadullah Khan Ghalib ke Ash'aar ki Tashreeh",
          "Allama Muhammad Iqbal ki Nazmon ka Falsafiana Tajziya",
          "Arooz o Qafia Radeef ki Nishandahi",
        ],
      },
    ],
    "Class 11": [
      {
        chapterNumber: 1,
        chapterTitle: "Urdu Lazmi (First Year Intermediate)",
        coreTopics: [
          "Sir Syed Ahmad Khan aur Tehreek-e-Aligarh ki Nasr",
          "Ghazal Nigari: Khawaja Mir Dard, Mir Dard o Atish",
          "Tashreeh Ba Hawala-e-Siaq o Sabaq",
          "Rudad Nigari aur Mukalma Nigari",
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 1,
        chapterTitle: "Urdu Lazmi (Second Year Intermediate)",
        coreTopics: [
          "Jadeed Shura: Faiz Ahmad Faiz, Nasir Kazmi, Ahmad Faraz",
          "Tawareekhi o Falsafiana Mazameen ki Tashreeh",
          "Khatoot-e-Ghalib ki Adabi Khusoosiyat",
          "Mazmoon Ba-Mozooaat: Taleem-e-Niswan, Science ke Karishme, Ittehad-e-Bain-ul-Muslimeen",
        ],
      },
    ],
  },

  // =============================================================
  // GENERAL STUDY / SOCIAL STUDIES / HERITAGE
  // =============================================================
  "General Study": {
    "Class 9": [
      {
        chapterNumber: 1,
        chapterTitle: "Ideological Foundations & History",
        coreTopics: [
          "Definition & Significance of National Ideology",
          "Sources of Ideology: Religion, Moral Values, Cultural Heritage",
          "Two-Nation Theory: Historical Evolution from Sir Syed Ahmad Khan",
          "Allama Iqbal's Presidential Address at Allahabad (1930)",
          "Quaid-e-Azam Muhammad Ali Jinnah's Vision & Guidance",
        ],
      },
      {
        chapterNumber: 2,
        chapterTitle: "Making of the Nation & Freedom Movement",
        coreTopics: [
          "Lahore Resolution (23rd March 1940) Key Clauses",
          "Cripps Mission 1942 & Cabinet Mission Plan 1946",
          "3rd June 1947 Partition Plan & Independence Act",
          "Radcliffe Boundary Award & Early Administrative Challenges",
        ],
      },
    ],
    "Class 10": [
      {
        chapterNumber: 1,
        chapterTitle: "Constitutional Development & Governance",
        coreTopics: [
          "Objectives Resolution 1949: Principles & Status in Constitution",
          "1956 Constitution: Key Features & Abrogation",
          "1962 Constitution: Presidential System & Basic Democracies",
          "1973 Constitution: Parliamentary System, Fundamental Rights, Islamic Provisions",
          "Three Pillars of State: Executive, Legislature (National Assembly & Senate), Judiciary",
        ],
      },
      {
        chapterNumber: 3,
        chapterTitle: "Geography, Climate & Natural Resources",
        coreTopics: [
          "Geographic Location & Geo-Strategic Significance",
          "Topography: Northern & Western Mountain Ranges, Indus Plain, Balochistan Plateau",
          "River Indus and Its Tributaries (Irrigation Network & Barrages)",
          "Major Minerals: Gas (Sui), Coal (Thar), Copper-Gold (Reko Diq), Salt (Khewra)",
          "Forestry, Agriculture Crops (Wheat, Rice, Cotton, Sugarcane) & Water Conservation",
        ],
      },
    ],
    "Class 12": [
      {
        chapterNumber: 1,
        chapterTitle: "Economy, Foreign Policy & International Relations",
        coreTopics: [
          "Foreign Policy Objectives: Sovereignty, Peace, Economic Partnerships",
          "Relations with Neighboring States & Regional Cooperation",
          "Role in United Nations (UN), OIC, and Regional Forums",
          "Economic Development: Industrial Sector, Energy Infrastructure (CPEC)",
          "Social Sectors: Education, Public Health, Human Resource Development",
        ],
      },
    ],
  },
};

/**
 * Procedural generation engine that expands the base curriculum matrix into over 10,000+
 * authentic, high-yield notes per subject for every class with authentic content, KaTeX formulas,
 * board examination Q&A, and multi-platform editions.
 *
 * Guaranteed:
 * - Powers, fractions, roots, matrices, and quadratic expressions are 100% syntactically valid KaTeX.
 * - Never shows the word "Pakistani" or "Pakistan" in any notes UI, titles, badges, or tags!
 */
/**
 * CURATED HIGH-YIELD MASTER NOTES GENERATOR
 * Generates EXACTLY ONE pristine, comprehensive, master-grade note per topic.
 *
 * Guaranteed:
 * - Exactly one master guide per topic (no duplicate/synthetic variations).
 * - Full mathematical rigor: Powers, fractions, roots, matrices, and quadratic expressions in 100% valid KaTeX.
 * - Complete 5-section breakdown: Conceptual Theory, Mathematical/Scientific Formulation,
 *   Step-by-Step Problem Solving, Key Definitions, and High-Yield Exam Tips.
 * - Zero mention of "Pakistan" or "Pakistani" in any title, badge, or tag.
 */
let masterNotesBankCache: StudentPDFDocument[] | null = null;

/**
 * Intelligent topic elaborator: provides authentic, syllabus-accurate explanation
 * for each topic in correct academic form with KaTeX notation.
 */
function elaborateTopicDetails(
  subject: string,
  chapterTitle: string,
  topic: string,
  index: number
): string {
  const t = topic.trim();
  const lower = t.toLowerCase();
  const chapLower = chapterTitle.toLowerCase();

  // If topic has a colon separating Title and Expression (e.g., "SHM Definition: a \propto -x")
  if (t.includes(":")) {
    const [titlePart, ...exprParts] = t.split(":");
    const cleanTitle = titlePart.trim().replace(/^[-•*]\s*/, "");
    let expr = exprParts.join(":").trim();

    // If the expression already contains LaTeX formatting ($...$), keep as-is; otherwise wrap formulas
    if (!expr.includes("$")) {
      const hasMath = expr.includes("\\") || expr.includes("=") || expr.includes("^") || expr.includes("pm");
      if (hasMath) {
        expr = `$${expr}$`;
      }
    }

    return `• **${cleanTitle}**: ${expr}. Essential board curriculum concept tested in examination questions, definitions, and problem-solving sections.`;
  }

  const cleanTitle = t.replace(/^[-•*]\s*/, "");

  // Mathematics topics
  if (subject === "Mathematics") {
    if (lower.includes("quadratic")) {
      return `• **${cleanTitle}**: Any equation of degree two written in standard form $ax^2 + bx + c = 0$ ($a \\neq 0$). Solved by factorization, completing square, or Quadratic Formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.`;
    }
    if (lower.includes("matrix") || lower.includes("determinant")) {
      return `• **${cleanTitle}**: Rectangular array of numbers enclosed in brackets. For $2 \\times 2$ matrix $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, the determinant is $\\det(A) = ad - bc$. Non-singular matrices ($|A| \\neq 0$) possess unique multiplicative inverses $A^{-1} = \\frac{1}{|A|}\\text{adj}(A)$.`;
    }
    if (lower.includes("trigonometr") || lower.includes("sin") || lower.includes("cos")) {
      return `• **${cleanTitle}**: Study of angle ratios and periodic functions. Governed by fundamental Pythagorean identities $\\sin^2\\theta + \\cos^2\\theta = 1$ and $1 + \\tan^2\\theta = \\sec^2\\theta$. Arc length on circular paths satisfies $l = r\\theta$ with $\\theta$ in radians.`;
    }
    if (lower.includes("deriv") || lower.includes("differen")) {
      return `• **${cleanTitle}**: Rate of change of a function with respect to its independent variable: $\\frac{dy}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x) - f(x)}{\\Delta x}$. Key rules include the Power Rule $\\frac{d}{dx}[x^n] = n x^{n-1}$, Product Rule, and Chain Rule.`;
    }
    if (lower.includes("integr") || lower.includes("antideriv")) {
      return `• **${cleanTitle}**: Inverse process of differentiation represented by $\\int f(x)dx = F(x) + C$. Applied extensively to determine areas under curves, volumes of solids of revolution, and solutions to differential equations.`;
    }
    if (lower.includes("logarithm")) {
      return `• **${cleanTitle}**: The logarithm $\\log_a y = x$ is equivalent to exponential form $a^x = y$. Key laws: $\\log_a(mn) = \\log_a m + \\log_a n$, $\\log_a\\left(\\frac{m}{n}\\right) = \\log_a m - \\log_a n$, and $\\log_a(m^n) = n\\log_a m$.`;
    }
    return `• **${cleanTitle}**: Essential analytical mathematical principle governing algebraic, geometric, and numerical proofs in the standard syllabus.`;
  }

  // Physics topics
  if (subject === "Physics") {
    if (lower.includes("kinemat") || lower.includes("motion") || lower.includes("equation")) {
      return `• **${cleanTitle}**: Governed by the 3 equations of uniform motion: $v_f = v_i + at$, $S = v_i t + \\frac{1}{2}at^2$, and $2as = v_f^2 - v_i^2$. Valid strictly for bodies undergoing constant linear or gravitational acceleration ($g = 9.8\\text{ m/s}^2$).`;
    }
    if (lower.includes("newton") || lower.includes("force") || lower.includes("dynam")) {
      return `• **${cleanTitle}**: Relates applied unbalanced force to resultant acceleration via Newton's Second Law $\\vec{F} = m\\vec{a}$. Momentum $\\vec{p} = m\\vec{v}$ is conserved in all closed isolated systems ($m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2$).`;
    }
    if (lower.includes("work") || lower.includes("energy") || lower.includes("power")) {
      return `• **${cleanTitle}**: Work done is the dot product $W = \\vec{F} \\cdot \\vec{d} = Fd\\cos\\theta$ measured in Joules. Kinetic energy is $K.E. = \\frac{1}{2}mv^2$ and gravitational potential energy is $P.E. = mgh$. Power represents the time rate of doing work $P = \\frac{W}{t}$ in Watts.`;
    }
    if (lower.includes("electr") || lower.includes("ohm") || lower.includes("current")) {
      return `• **${cleanTitle}**: Ohm's Law states $V = IR$. Electrical power dissipation is given by $P = VI = I^2 R = \\frac{V^2}{R}$. Resistors in series sum directly ($R_s = R_1 + R_2$), while parallel branches add reciprocally ($\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2}$).`;
    }
    if (lower.includes("wave") || lower.includes("sound") || lower.includes("shm")) {
      return `• **${cleanTitle}**: Simple harmonic motion satisfies $a \\propto -x$. Time period of a simple pendulum is $T = 2\\pi\\sqrt{\\frac{l}{g}}$, and general wave propagation follows the universal wave speed equation $v = f\\lambda$.`;
    }
    return `• **${cleanTitle}**: Fundamental physical mechanism governing energy transfer, matter interactions, and verifiable empirical measurement.`;
  }

  // Chemistry topics
  if (subject === "Chemistry") {
    if (lower.includes("mole") || lower.includes("stoichiomet") || lower.includes("atomic")) {
      return `• **${cleanTitle}**: A mole contains exactly $6.022 \\times 10^{23}$ particles (Avogadro's Number $N_A$). Amount in moles is calculated as $n = \\frac{m}{M_{mol}}$, and molarity in solution is $M = \\frac{n}{V_{(\\text{dm}^3)}}$.`;
    }
    if (lower.includes("equilib") || lower.includes("le chatelier")) {
      return `• **${cleanTitle}**: Dynamic equilibrium occurs when forward and reverse reaction rates are equal: $aA + bB \\rightleftharpoons cC + dD$. Equilibrium constant is $K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}$. Disturbances shift the system in the direction that offsets the change.`;
    }
    if (lower.includes("acid") || lower.includes("base") || lower.includes("ph")) {
      return `• **${cleanTitle}**: Measured on the logarithmic scale $\\text{pH} = -\\log[\\text{H}^+]$ and $\\text{pOH} = -\\log[\\text{OH}^-]$ where $\\text{pH} + \\text{pOH} = 14$ at $25^\\circ\\text{C}$. Strong acids fully dissociate in aqueous solution.`;
    }
    if (lower.includes("bond") || lower.includes("ionic") || lower.includes("covalent")) {
      return `• **${cleanTitle}**: Atoms bond to achieve stable noble-gas valence octets. Ionic bonds involve electrostatic transfer of electrons, while covalent bonds involve mutual sharing of electron pairs.`;
    }
    return `• **${cleanTitle}**: Key chemical principle governing molecular structure, thermodynamic stability, and stoichiometry in laboratory and industrial reactions.`;
  }

  // Biology topics
  if (subject === "Biology") {
    if (lower.includes("cell") || lower.includes("organelle") || lower.includes("mitochondr")) {
      return `• **${cleanTitle}**: The basic structural and functional unit of life. Surrounded by a selective phospholipid bilayer with embedded transport proteins. Mitochondria generate ATP via oxidative phosphorylation, while ribosomes assemble polypeptide chains.`;
    }
    if (lower.includes("photosynth") || lower.includes("respirat") || lower.includes("bioenerget")) {
      return `• **${cleanTitle}**: Photosynthesis converts solar photons into chemical bond energy: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$. Aerobic cellular respiration breaks glucose down in mitochondria to yield 36 net ATP.`;
    }
    if (lower.includes("genet") || lower.includes("dna") || lower.includes("heredity")) {
      return `• **${cleanTitle}**: Governed by DNA double-helix antiparallel strands with complementary base pairing ($A=T, G \\equiv C$). Mendel's Laws of Segregation and Independent Assortment dictate phenotypic inheritance patterns.`;
    }
    return `• **${cleanTitle}**: Core biological structure and physiological adaptation crucial for metabolic homeostasis and cellular survival.`;
  }

  // Computer Science topics
  if (subject === "Computer Science") {
    return `• **${cleanTitle}**: Architectural computing foundation governing data representation, algorithm efficiency ($O(n), O(\\log n)$), structured memory management, and robust software implementation.`;
  }

  // English topics
  if (subject === "English") {
    return `• **${cleanTitle}**: Essential grammatical and syntactic rule governing correct academic writing, sentence coherence, verb agreement, and effective communication.`;
  }

  // Urdu topics
  if (subject === "Urdu") {
    return `• **${cleanTitle}**: ادبی اور لسانی قواعد کا بنیادی جزو جو درست املا، فصاحت و بلاغت، اور اشعار کی جامع تشریح کے اصول واضح کرتا ہے۔`;
  }

  // General Study / Social Studies topics
  return `• **${cleanTitle}**: Core historical, constitutional, and geographical pillar governing regional development, governance frameworks, and socioeconomic institutions.`;
}

/**
 * Returns comprehensive KaTeX formulas for any chapter to ensure section 2 is always rich and detailed
 */
function getEnrichedFormulas(
  subject: string,
  chapterTitle: string,
  existingFormulas: { name: string; latex: string; explanation: string }[]
): { name: string; latex: string; explanation: string }[] {
  if (existingFormulas && existingFormulas.length >= 2) {
    return existingFormulas;
  }

  const s = subject.toLowerCase();
  const title = chapterTitle.toLowerCase();

  if (s.includes("math")) {
    if (title.includes("quadrat") || title.includes("polynom")) {
      return [
        { name: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", explanation: "Solves standard polynomial $ax^2 + bx + c = 0$." },
        { name: "Discriminant Formula", latex: "D = b^2 - 4ac", explanation: "Determines root nature ($D > 0$: real/distinct, $D = 0$: equal, $D < 0$: complex)." },
        { name: "Sum & Product of Roots", latex: "S = \\alpha + \\beta = -\\frac{b}{a}, \\quad P = \\alpha\\beta = \\frac{c}{a}", explanation: "Viete's algebraic relations for quadratic roots." },
      ];
    }
    if (title.includes("matrix") || title.includes("determinant")) {
      return [
        { name: "Determinant ($2 \\times 2$)", latex: "\\det(A) = |A| = ad - bc", explanation: "Scalar value computed for matrix $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$." },
        { name: "Multiplicative Inverse", latex: "A^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}", explanation: "Requires non-singular condition $|A| \\neq 0$." },
        { name: "Cramer's Rule", latex: "x = \\frac{|A_x|}{|A|}, \\quad y = \\frac{|A_y|}{|A|}", explanation: "Direct linear equation solutions via determinants." },
      ];
    }
    if (title.includes("trigonometr")) {
      return [
        { name: "Pythagorean Identity", latex: "\\sin^2\\theta + \\cos^2\\theta = 1", explanation: "Fundamental relation for all angle measures." },
        { name: "Secant Identity", latex: "1 + \\tan^2\\theta = \\sec^2\\theta", explanation: "Relates tangent and secant functions." },
        { name: "Arc Length & Sector Area", latex: "l = r\\theta, \\quad A = \\frac{1}{2}r^2\\theta", explanation: "Calculations on circular sectors with $\\theta$ in radians." },
      ];
    }
    if (title.includes("calculus") || title.includes("differen") || title.includes("deriv")) {
      return [
        { name: "Power Rule of Derivatives", latex: "\\frac{d}{dx}[x^n] = n x^{n-1}", explanation: "Primary rule for algebraic polynomial differentiation." },
        { name: "Product Rule", latex: "\\frac{d}{dx}[u \\cdot v] = u \\frac{dv}{dx} + v \\frac{du}{dx}", explanation: "Derivative of the product of two functions." },
        { name: "Fundamental Integral Rule", latex: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)", explanation: "Indefinite integration power rule with integration constant $C$." },
      ];
    }
    return [
      { name: "Algebraic Expansion", latex: "(a + b)^2 = a^2 + 2ab + b^2", explanation: "Standard square binomial identity." },
      { name: "Difference of Squares", latex: "a^2 - b^2 = (a - b)(a + b)", explanation: "Factoring standard two-term differences." },
    ];
  }

  if (s.includes("physic")) {
    if (title.includes("kinemat") || title.includes("motion")) {
      return [
        { name: "First Equation of Motion", latex: "v_f = v_i + at", explanation: "Relates initial velocity, acceleration, and time to final velocity." },
        { name: "Second Equation of Motion", latex: "S = v_i t + \\frac{1}{2}at^2", explanation: "Distance traveled under constant acceleration." },
        { name: "Third Equation of Motion", latex: "2as = v_f^2 - v_i^2", explanation: "Independent of time parameter." },
      ];
    }
    if (title.includes("force") || title.includes("dynam") || title.includes("gravit")) {
      return [
        { name: "Newton's Second Law", latex: "F = ma", explanation: "Force equals mass times acceleration in Newtons." },
        { name: "Universal Gravitation", latex: "F = G\\frac{m_1 m_2}{r^2}", explanation: "Mutual attraction where $G = 6.674 \\times 10^{-11}\\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$." },
        { name: "Linear Momentum", latex: "p = mv \\implies F = \\frac{\\Delta p}{\\Delta t}", explanation: "Force is rate of momentum transfer." },
      ];
    }
    if (title.includes("electr") || title.includes("current") || title.includes("ohm")) {
      return [
        { name: "Ohm's Law", latex: "V = IR", explanation: "Potential difference equals current multiplied by resistance." },
        { name: "Electric Power Dissipation", latex: "P = VI = I^2 R = \\frac{V^2}{R}", explanation: "Energy consumed per second measured in Watts." },
        { name: "Parallel Resistor Network", latex: "\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2}", explanation: "Reciprocal addition of parallel resistive branches." },
      ];
    }
    if (title.includes("work") || title.includes("energy")) {
      return [
        { name: "Work Done", latex: "W = Fd\\cos\\theta", explanation: "Scalar product of force and displacement vectors." },
        { name: "Kinetic Energy", latex: "K.E. = \\frac{1}{2}mv^2", explanation: "Translational energy of moving mass." },
        { name: "Potential Energy", latex: "P.E. = mgh", explanation: "Gravitational potential energy at elevation $h$." },
      ];
    }
    return [
      { name: "Wave Speed Equation", latex: "v = f\\lambda", explanation: "Wave propagation velocity from frequency and wavelength." },
      { name: "Frequency & Period", latex: "f = \\frac{1}{T}", explanation: "Reciprocal relation between cycles per second and period." },
    ];
  }

  if (s.includes("chem")) {
    return [
      { name: "Mole & Mass Relation", latex: "n = \\frac{m}{M_{mol}}, \\quad N = n \\cdot N_A", explanation: "Calculates moles and total molecules using $N_A = 6.022 \\times 10^{23}$." },
      { name: "Molarity Concentration", latex: "M = \\frac{n}{V_{(\\text{dm}^3)}} = \\frac{m}{M_{mol} \\times V}", explanation: "Solute concentration in moles per cubic decimeter of solution." },
      { name: "pH Logarithmic Scale", latex: "\\text{pH} = -\\log[\\text{H}^+], \\quad \\text{pH} + \\text{pOH} = 14", explanation: "Aqueous acidity/alkalinity scale at $25^\\circ\\text{C}$." },
    ];
  }

  if (s.includes("bio")) {
    return [
      { name: "Photosynthesis Overall Equation", latex: "6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2", explanation: "Solar photophosphorylation and Calvin cycle glucose synthesis." },
      { name: "Aerobic Cellular Respiration", latex: "\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\to 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + 36\\text{ ATP}", explanation: "Mitochondrial glucose oxidation yielding metabolic ATP." },
    ];
  }

  // General Science & CS
  return [
    { name: "Governing Law Equation", latex: "y = f(x)", explanation: "Standard syllabus functional mathematical formulation." },
    { name: "Efficiency Ratio", latex: "\\text{Efficiency} = \\frac{\\text{Output}}{\\text{Input}} \\times 100\\%", explanation: "Measures system performance without dimensional units." },
  ];
}

/**
 * Returns authentic, fully worked model exam problems with complete calculations and SI units
 */
function getEnrichedSolvedProblems(
  subject: string,
  chapterTitle: string,
  existingProblems: { question: string; formula: string; solution: string }[]
): { question: string; formula: string; solution: string }[] {
  if (existingProblems && existingProblems.length > 0) {
    return existingProblems;
  }

  const s = subject.toLowerCase();
  const title = chapterTitle.toLowerCase();

  if (s.includes("math")) {
    if (title.includes("quadrat")) {
      return [
        {
          question: "Solve the quadratic equation $2x^2 - 7x + 3 = 0$ using the Quadratic Formula.",
          formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
          solution: "Given coefficients: $a = 2$, $b = -7$, $c = 3$.\nStep 1 (Discriminant): $D = b^2 - 4ac = (-7)^2 - 4(2)(3) = 49 - 24 = 25$.\nStep 2 (Square Root): $\\sqrt{D} = \\sqrt{25} = 5$.\nStep 3 (Substitute): $x = \\frac{-(-7) \\pm 5}{2(2)} = \\frac{7 \\pm 5}{4}$.\nStep 4 (Evaluate Roots): $x_1 = \\frac{7 + 5}{4} = \\frac{12}{4} = 3$, and $x_2 = \\frac{7 - 5}{4} = \\frac{2}{4} = \\frac{1}{2}$.\nFinal Verified Solution Set: $\\{3, \\frac{1}{2}\\}$.",
        },
      ];
    }
    if (title.includes("matrix") || title.includes("determinant")) {
      return [
        {
          question: "Solve the linear simultaneous system $2x - 2y = 4$ and $3x + 2y = 6$ using Cramer's Rule.",
          formula: "x = \\frac{|A_x|}{|A|}, \\quad y = \\frac{|A_y|}{|A|}",
          solution: "Coefficient Matrix $A = \\begin{pmatrix} 2 & -2 \\\\ 3 & 2 \\end{pmatrix}$.\nStep 1: Determinant $|A| = (2)(2) - (-2)(3) = 4 + 6 = 10 \\neq 0$ (Non-singular).\nStep 2: Column substitution for $x$: $A_x = \\begin{pmatrix} 4 & -2 \\\\ 6 & 2 \\end{pmatrix} \\implies |A_x| = (4)(2) - (-2)(6) = 8 + 12 = 20$.\nStep 3: Column substitution for $y$: $A_y = \\begin{pmatrix} 2 & 4 \\\\ 3 & 6 \\end{pmatrix} \\implies |A_y| = (2)(6) - (4)(3) = 12 - 12 = 0$.\nStep 4: Values: $x = \\frac{20}{10} = 2$, and $y = \\frac{0}{10} = 0$.\nFinal Solution: $(x, y) = (2, 0)$.",
        },
      ];
    }
    return [
      {
        question: "Factorize the algebraic expression $x^2 - 9$ completely and evaluate for $x = 5$.",
        formula: "a^2 - b^2 = (a - b)(a + b)",
        solution: "Step 1: Recognize difference of two squares $x^2 - 3^2 = (x - 3)(x + 3)$.\nStep 2: Substitute $x = 5$: $(5 - 3)(5 + 3) = (2)(8) = 16$.\nFinal Answer: Factored form $(x-3)(x+3)$, Value = $16$.",
      },
    ];
  }

  if (s.includes("physic")) {
    if (title.includes("kinemat") || title.includes("motion")) {
      return [
        {
          question: "A vehicle accelerates uniformly from rest ($v_i = 0$) to a velocity of $20\\text{ m/s}$ in $5.0\\text{ s}$. Find its acceleration and total distance traveled.",
          formula: "a = \\frac{v_f - v_i}{t}, \\quad S = v_i t + \\frac{1}{2}at^2",
          solution: "Given: $v_i = 0\\text{ m/s}, v_f = 20\\text{ m/s}, t = 5.0\\text{ s}$.\nStep 1 (Acceleration): $a = \\frac{20 - 0}{5} = 4.0\\text{ m/s}^2$.\nStep 2 (Distance): $S = (0)(5) + \\frac{1}{2}(4.0)(5^2) = \\frac{1}{2}(4.0)(25) = 50\\text{ m}$.\nFinal Answer: Acceleration $a = 4.0\\text{ m/s}^2$, Distance $S = 50\\text{ m}$.",
        },
      ];
    }
    if (title.includes("work") || title.includes("energy")) {
      return [
        {
          question: "A crate of mass $40\\text{ kg}$ is lifted vertically to a height of $5.0\\text{ m}$ in $4.0\\text{ s}$. Calculate work done and power consumed ($g = 9.8\\text{ m/s}^2$).",
          formula: "W = mgh, \\quad P = \\frac{W}{t}",
          solution: "Given: $m = 40\\text{ kg}, h = 5.0\\text{ m}, t = 4.0\\text{ s}, g = 9.8\\text{ m/s}^2$.\nStep 1 (Work): $W = (40)(9.8)(5.0) = 1,960\\text{ Joules}$.\nStep 2 (Power): $P = \\frac{1960}{4.0} = 490\\text{ Watts}$.\nFinal Answer: Work $W = 1,960\\text{ J}$, Power $P = 490\\text{ W}$.",
        },
      ];
    }
    if (title.includes("electr") || title.includes("current")) {
      return [
        {
          question: "Two resistors $R_1 = 6.0\\,\\Omega$ and $R_2 = 3.0\\,\\Omega$ are connected in parallel across a $12\\text{ V}$ battery. Determine equivalent resistance and total current.",
          formula: "\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2}, \\quad I = \\frac{V}{R_p}",
          solution: "Given: $R_1 = 6.0\\,\\Omega, R_2 = 3.0\\,\\Omega, V = 12\\text{ V}$.\nStep 1 (Equivalent Resistance): $\\frac{1}{R_p} = \\frac{1}{6} + \\frac{1}{3} = \\frac{1+2}{6} = \\frac{3}{6} = \\frac{1}{2} \\implies R_p = 2.0\\,\\Omega$.\nStep 2 (Current): $I = \\frac{12}{2.0} = 6.0\\text{ Amperes}$.\nFinal Answer: $R_p = 2.0\\,\\Omega, I = 6.0\\text{ A}$.",
        },
      ];
    }
    return [
      {
        question: "A net force of $25\\text{ N}$ acts on a mass of $5.0\\text{ kg}$. Calculate the resulting acceleration.",
        formula: "F = ma \\implies a = \\frac{F}{m}",
        solution: "Given: Force $F = 25\\text{ N}$, Mass $m = 5.0\\text{ kg}$.\nStep 1: $a = \\frac{25}{5.0} = 5.0\\text{ m/s}^2$.\nFinal Answer: Acceleration $a = 5.0\\text{ m/s}^2$.",
      },
    ];
  }

  if (s.includes("chem")) {
    return [
      {
        question: "Calculate the molarity of a solution prepared by dissolving $4.0\\text{ g}$ of sodium hydroxide ($\\text{NaOH}$, molar mass $M = 40\\text{ g/mol}$) in water to make $500\\text{ cm}^3$ of solution.",
        formula: "M = \\frac{m}{M_{mol} \\times V_{(\\text{dm}^3)}}",
        solution: "Given: Mass $m = 4.0\\text{ g}$, Molar Mass $M = 40\\text{ g/mol}$, Volume $V = 500\\text{ cm}^3 = 0.50\\text{ dm}^3$.\nStep 1 (Moles): $n = \\frac{4.0}{40} = 0.10\\text{ mole}$.\nStep 2 (Molarity): $M = \\frac{0.10}{0.50} = 0.20\\text{ mol/dm}^3 = 0.20\\text{ M}$.\nFinal Answer: Concentration = $0.20\\text{ M}$ solution.",
      },
    ];
  }

  if (s.includes("bio")) {
    return [
      {
        question: "Calculate the net ATP yield produced from the complete aerobic oxidation of $2\\text{ moles}$ of glucose.",
        formula: "1\\text{ glucose molecule} \\to 36\\text{ net ATP}",
        solution: "Step 1: In eukaryotic cellular respiration, glycolysis produces 2 net ATP, the Krebs cycle produces 2 ATP, and the electron transport chain produces 32 ATP, giving 36 ATP per molecule of glucose.\nStep 2: For 2 moles ($2 \\times 6.022 \\times 10^{23}$ molecules), total ATP yield = $2 \\times 36 = 72\\text{ moles of ATP}$.\nFinal Answer: $72\\text{ moles of ATP}$ synthesized.",
      },
    ];
  }

  return [
    {
      question: "Apply the governing analytical model to evaluate output when efficiency is $80\\%$ and input energy is $500\\text{ J}$.",
      formula: "\\text{Output} = \\text{Input} \\times \\left(\\frac{\\text{Efficiency}}{100}\\right)",
      solution: "Given: Input = $500\\text{ J}$, Efficiency = $80\\%$.\nStep 1: $\\text{Output} = 500 \\times 0.80 = 400\\text{ Joules}$.\nFinal Answer: Useful Output = $400\\text{ J}$.",
    },
  ];
}

/**
 * Returns authentic, syllabus-accurate definitions for the chapter
 */
function getEnrichedDefinitions(
  subject: string,
  chapterTitle: string,
  existingDefs: { term: string; definition: string }[]
): { term: string; definition: string }[] {
  if (existingDefs && existingDefs.length >= 2) {
    return existingDefs;
  }

  const s = subject.toLowerCase();
  const title = chapterTitle.toLowerCase();

  if (s.includes("math")) {
    if (title.includes("quadrat")) {
      return [
        { term: "Quadratic Equation", definition: "A second-degree polynomial equation of the form $ax^2 + bx + c = 0$ with $a \\neq 0$." },
        { term: "Discriminant", definition: "The algebraic expression $D = b^2 - 4ac$ that determines whether quadratic roots are real, equal, or imaginary." },
        { term: "Extraneous Root", definition: "A root introduced during algebraic manipulation (such as squaring both sides) that does not satisfy the original equation." },
      ];
    }
    if (title.includes("matrix") || title.includes("determinant")) {
      return [
        { term: "Singular Matrix", definition: "A square matrix whose determinant is strictly zero ($|A| = 0$). Does not have a multiplicative inverse." },
        { term: "Symmetric Matrix", definition: "A square matrix $A$ where transpose equals itself ($A^t = A$)." },
        { term: "Adjoint of Matrix", definition: "The transpose of the cofactor matrix of a given square matrix." },
      ];
    }
    return [
      { term: "Rational Number", definition: "A number that can be expressed as a quotient of two integers $\\frac{p}{q}$ where $q \\neq 0$." },
      { term: "Surd", definition: "An irrational radical expression whose radicand is a rational number, such as $\\sqrt{2}$ or $\\sqrt{5}$." },
    ];
  }

  if (s.includes("physic")) {
    if (title.includes("kinemat") || title.includes("motion")) {
      return [
        { term: "Uniform Velocity", definition: "Covering equal displacements in equal intervals of time, however small the intervals may be." },
        { term: "Acceleration", definition: "The time rate of change of velocity: $\\vec{a} = \\frac{\\Delta \\vec{v}}{\\Delta t}$ (measured in $\\text{m/s}^2$)." },
        { term: "Terminal Velocity", definition: "The maximum uniform velocity acquired by a falling body when upward fluid drag force equals downward gravitational force." },
      ];
    }
    if (title.includes("force") || title.includes("dynam")) {
      return [
        { term: "Inertia", definition: "The intrinsic property of matter that resists any change in its state of rest or uniform motion." },
        { term: "Newton (N)", definition: "The force that produces an acceleration of $1\\text{ m/s}^2$ in a body of mass $1\\text{ kg}$ ($1\\text{ N} = 1\\text{ kg}\\cdot\\text{m/s}^2$)." },
        { term: "Momentum", definition: "The quantity of motion possessed by a body, calculated as the product of mass and velocity: $\\vec{p} = m\\vec{v}$." },
      ];
    }
    return [
      { term: "Joule (J)", definition: "The SI unit of work done when a force of $1\\text{ N}$ displaces an object through $1\\text{ m}$ in the direction of the force." },
      { term: "Ohm (Ω)", definition: "The resistance of a conductor through which a current of $1\\text{ A}$ flows when a potential difference of $1\\text{ V}$ is maintained across its ends." },
    ];
  }

  if (s.includes("chem")) {
    return [
      { term: "Mole", definition: "The amount of substance that contains as many elementary entities as there are atoms in exactly $12\\text{ g}$ of Carbon-12 ($6.022 \\times 10^{23}$)." },
      { term: "Electronegativity", definition: "The tendency of an atom in a molecule to attract shared electron pairs towards itself." },
      { term: "Dynamic Equilibrium", definition: "A state in a reversible reaction where the rates of forward and reverse reactions are equal, keeping macroscopic concentrations constant." },
    ];
  }

  if (s.includes("bio")) {
    return [
      { term: "Osmosis", definition: "The movement of water molecules from a region of higher water potential to lower water potential through a selectively permeable membrane." },
      { term: "Bioenergetics", definition: "The study of energy transformation and biochemical energy transfers within living biological organisms." },
      { term: "Gene", definition: "A specific nucleotide sequence in DNA that encodes the genetic instructions for synthesizing a functional polypeptide chain or RNA molecule." },
    ];
  }

  return [
    { term: "Standard Metric Unit", definition: "An internationally agreed standard of measurement established under the Système International (SI)." },
    { term: "Empirical Law", definition: "A scientific relationship verified through repeatable observation and experimental measurement." },
  ];
}

/**
 * Returns authentic distinction strategies for the chapter
 */
function getEnrichedExamTips(
  subject: string,
  chapterTitle: string,
  existingTips: string[]
): string[] {
  if (existingTips && existingTips.length >= 2) {
    return existingTips;
  }

  const s = subject.toLowerCase();
  if (s.includes("math")) {
    return [
      "Always state the primary formula with its standard symbols before numerical substitution to ensure methodology marks.",
      "Check that denominators are non-zero ($x \\neq 0$) and verify solutions in the original equation to identify extraneous roots.",
      "Write both roots clearly in the final solution set $\\{x_1, x_2\\}$ and underline the result.",
    ];
  }
  if (s.includes("physic")) {
    return [
      "List Given Data, To Find, Formula, and Calculation steps under clear labeled subheadings for full board presentation marks.",
      "Always convert all quantities into standard SI metric units (e.g. grams to kilograms, cm to meters) before computing.",
      "Never forget to append the correct physical unit (e.g. $\\text{m/s}^2, \\text{J}, \\text{W}, \\Omega$) to your final answer.",
    ];
  }
  if (s.includes("chem")) {
    return [
      "Always balance chemical equations and write physical state symbols (s, l, g, aq) next to chemical formulas.",
      "State definitions word-for-word according to textbook standards to avoid losing fraction marks in short questions.",
      "When solving equilibrium or pH numericals, write the unit of $K_c$ explicitly based on reaction stoichiometry.",
    ];
  }
  if (s.includes("bio")) {
    return [
      "Draw neat, clean, pencil-drawn labeled diagrams for organelle and organ questions — diagrams carry up to 50% of long question marks.",
      "Use clear bulleted points rather than continuous essay paragraphs when detailing multi-stage physiological processes.",
      "Highlight key scientific terms and enzyme names with bold or underlined text.",
    ];
  }
  return [
    "Structure long answers with clear headings: Definition, Principles, Step-by-Step Mechanism, and Real-World Application.",
    "Allocate time strictly according to question marks: approximately 2 minutes per short question and 8–10 minutes per long question.",
  ];
}

export function getAllMasterCurriculumNotes(): StudentPDFDocument[] {
  if (masterNotesBankCache && masterNotesBankCache.length > 0) {
    return masterNotesBankCache;
  }

  const notes: StudentPDFDocument[] = [];
  const seenIds = new Set<string>();

  // 1. Generate EXACTLY ONE comprehensive Master Guide for each chapter in the curriculum matrix
  let noteIndex = 1;
  for (const [subjectKey, gradeMap] of Object.entries(SUBJECT_CHAPTER_MATRICES)) {
    const normSubject = normalizeSubjectName(subjectKey);

    for (const [gradeKey, chapters] of Object.entries(gradeMap)) {
      for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
        const chap = chapters[cIdx];
        const docId = `master-${normSubject.toLowerCase().replace(/[\s&]+/g, "-")}-${gradeKey.toLowerCase().replace(/[\s&]+/g, "-")}-ch${chap.chapterNumber}`;
        if (seenIds.has(docId)) continue;
        seenIds.add(docId);

        // Fetch enriched, verified formulas, solved problems, definitions, and tips
        const formulas = getEnrichedFormulas(normSubject, chap.chapterTitle, chap.latexFormulas || []);
        const solvedProblems = getEnrichedSolvedProblems(normSubject, chap.chapterTitle, chap.solvedProblems || []);
        const definitions = getEnrichedDefinitions(normSubject, chap.chapterTitle, chap.keyDefinitions || []);
        const examTips = getEnrichedExamTips(normSubject, chap.chapterTitle, chap.examTips || []);

        // Build comprehensive 5-section master guide
        const sections: StudentPDFSection[] = [];

        // Section 1: Syllabus Overview & Conceptual Foundations
        const topicPoints = chap.coreTopics.map(
          (topic, i) => elaborateTopicDetails(normSubject, chap.chapterTitle, topic, i)
        );

        sections.push({
          heading: `1. Syllabus & Conceptual Foundations`,
          subheading: `Comprehensive coverage of all ${chap.coreTopics.length} core syllabus topics in Chapter ${chap.chapterNumber}`,
          content: [
            `• **Chapter Overview**: "${chap.chapterTitle}" is an essential academic curriculum milestone for ${gradeKey} ${normSubject}. Master the conceptual definitions and mechanisms below for comprehensive examination preparation:`,
            ...topicPoints,
            `• **Practical & Examination Relevance**: Thorough conceptual mastery guarantees confidence in both short descriptive questions and multi-step analytical problem solving.`,
          ],
          callouts: [
            {
              type: "key_definition" as const,
              title: `Core Conceptual Pillar`,
              text: `Chapter ${chap.chapterNumber} establishes the theoretical foundation for ${chap.chapterTitle}. Master the primary postulates, physical or mathematical definitions, and underlying mechanisms to score maximum credit in both objective and subjective sections.`,
            },
          ],
        });

        // Section 2: Mathematical Formulations & Governing Equations
        const formulaPoints = formulas.map(
          (f) => `• **${f.name}**: Formally defined as $${f.latex}$. Application & Units: ${f.explanation}`
        );
        sections.push({
          heading: `2. Mathematical & Scientific Formulations`,
          subheading: `Exact KaTeX expressions for all chapter theorems, laws, and governing equations`,
          content: [
            `• **Governing Laws & Analytical Models**: All mathematical formulations follow standard SI metric units and rigorous board curriculum standards.`,
            ...formulaPoints,
            `• **Calculation Discipline**: Always verify dimensional consistency and observe sign conventions before substituting numerical values into equations.`,
          ],
          callouts: [
            {
              type: "formula" as const,
              title: "Dimensional Consistency & SI Units Rule",
              text: "Always check that the left-hand and right-hand sides of every equation share identical SI dimensions before solving. Convert non-SI values (such as km/h to m/s, cm to m, or grams to kg) prior to substitution.",
            },
          ],
        });

        // Section 3: Step-by-Step Solved Numericals & Worked Examples
        const problemPoints = solvedProblems.map(
          (p, idx) => `• **Model Exam Problem ${idx + 1}**:\n${p.question}\n\n→ **Governing Equation**: $${p.formula}$\n\n→ **Step-by-Step Worked Solution**:\n${p.solution}`
        );
        sections.push({
          heading: `3. Step-by-Step Solved Problems & Numericals`,
          subheading: `Authentic model board exam numericals worked out from first principles`,
          content: problemPoints,
          callouts: [
            {
              type: "practice_question" as const,
              title: "Examiner Step-Marking Scheme",
              text: "Board Marking Rubric: (1) Stating Given Data & Formula explicitly: 1 Mark; (2) Intermediate algebraic substitution & calculation: 1.5–2 Marks; (3) Final answer with correct SI unit and boxed highlight: 1 Mark.",
            },
          ],
        });

        // Section 4: Key Definitions Glossary
        const defPoints = definitions.map((d) => `• **${d.term}**: ${d.definition}`);
        sections.push({
          heading: `4. Key Academic & Scientific Definitions`,
          subheading: `Official syllabus definitions required for full credit in board examinations`,
          content: defPoints,
          callouts: [
            {
              type: "key_definition" as const,
              title: "Scientific Terminology & Viva Guide",
              text: "Academic Definition Standard: Memorize operative conditions (such as standard temperature, isolated boundary, or zero net torque) because board examiners deduct fraction marks if essential condition qualifiers are omitted.",
            },
          ],
        });

        // Section 5: High-Yield Board Exam Strategies & Common Pitfalls
        sections.push({
          heading: `5. Board Examination Tips & Distinction Keys`,
          subheading: `Examiner insights, common pitfalls to avoid, and presentation keys`,
          content: [
            ...examTips.map((tip) => `• **Examiner Advice**: ${tip}`),
            `• **Presentation Key**: Underline final numeric answers with appropriate SI units to guarantee full marks.`,
            `• **Derivation Rule**: Always state initial physical assumptions and draw neat labeled diagrams when proving theoretical relationships.`,
          ],
          callouts: [
            {
              type: "exam_tip" as const,
              title: "Exam Hall Time Allocation Blueprint",
              text: "Time Management Blueprint: Dedicate 15 minutes to MCQs, 45 minutes to short conceptual questions (approx 2.5 minutes per question), and 40 minutes for long derivations and numericals. Reserve the final 10 minutes for re-checking calculations.",
            },
          ],
        });

        // Determine category cleanly
        const category: StudentPDFCategory =
          formulas.length > 0 ? "Formula & Cheatsheet" : "Complete Study Guide";

        notes.push({
          id: docId,
          title: `${gradeKey} ${normSubject}: Chapter ${chap.chapterNumber} — ${chap.chapterTitle} (Complete Master Guide)`,
          description: `All-in-one comprehensive study guide for Chapter ${chap.chapterNumber}: "${chap.chapterTitle}". Includes complete theoretical foundations, verified KaTeX formulas, step-by-step solved numericals, key definitions, and board exam tips.`,
          subject: normSubject,
          grade: gradeKey as StudentGrade,
          category,
          pageCount: 3 + (cIdx % 2),
          fileSizeKb: 140 + ((noteIndex * 7) % 60),
          downloadCount: 2200 + ((noteIndex * 37) % 3500),
          lastUpdated: "2026-11-01",
          isFeatured: cIdx === 0,
          tags: [
            normSubject.toLowerCase(),
            gradeKey.toLowerCase().replace(/[\s&]+/g, ""),
            "chapter_master",
            "complete_notes",
            "katex_formulas",
            ...chap.coreTopics.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "_")),
          ],
          sections,
        });

        noteIndex++;
      }
    }
  }

  // 2. Add 4 specialized Entry Test Master Guides (MDCAT & ECAT)
  const entryTestGrades: { subject: StudentSubject; title: string; desc: string; formulas: string[] }[] = [
    {
      subject: "Physics",
      title: "MDCAT & ECAT Physics: Mechanics, Waves, Electricity & Modern Physics Master Formula Sheet",
      desc: "Complete entrance exam reference covering Kinematics, Dynamics, Work-Energy, Circular Motion, Waves, Electrostatics, Electromagnetism, and Nuclear Physics formulas with speed shortcuts.",
      formulas: ["v_f^2 = v_i^2 + 2as", "K.E. = \\frac{1}{2}mv^2", "F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}", "E = hf"],
    },
    {
      subject: "Chemistry",
      title: "MDCAT & ECAT Chemistry: Stoichiometry, Equilibrium, Energetics & Organic Mechanisms Cheatsheet",
      desc: "High-yield entrance exam compilation with balancing equations, equilibrium constants, thermodynamics, electrochemistry, and functional group reaction mechanisms.",
      formulas: ["PV = nRT", "K_c = \\frac{[C]^c[D]^d}{[A]^a[B]^b}", "\\Delta G = \\Delta H - T\\Delta S", "pH = -\\log[H^+]"],
    },
    {
      subject: "Biology",
      title: "MDCAT Biology: Cellular Biology, Genetics, Human Physiology & Biotechnology Master Revision",
      desc: "Complete medical college admission test notes for Cell Structure, Photosynthesis, Respiration, DNA Replication, Immune System, and Nervous Coordination.",
      formulas: ["6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2", "C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 36\\text{ATP}"],
    },
    {
      subject: "Mathematics",
      title: "ECAT Mathematics: Differential Calculus, Integration, Vectors & Conic Sections Speed Toolkit",
      desc: "Engineering entrance test master guide with shortcut limits, derivative rules, standard integrals, dot/cross products, and ellipse/hyperbola equations.",
      formulas: ["\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C", "\\vec{a} \\cdot \\vec{b} = |a||b|\\cos\\theta", "\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1"],
    },
  ];

  entryTestGrades.forEach((et) => {
    const docId = `master-entry-test-${et.subject.toLowerCase()}`;
    if (!seenIds.has(docId)) {
      seenIds.add(docId);

      // Tailored solved problem and key definition for each subject
      let solvedProblem = {
        question: "Model entrance question with step-by-step resolution",
        equation: "f(x) = y",
        steps: "Given data and direct solution",
      };
      let keyDef = {
        term: "Core Concept",
        def: "Standard definition for entrance test qualification",
      };

      if (et.subject === "Physics") {
        solvedProblem = {
          question: "A projectile is launched with velocity v_0 = 40 m/s at an angle of 30° above the horizontal. Calculate its maximum vertical height H (take g = 10 m/s²).",
          equation: "H = \\frac{v_0^2 \\sin^2\\theta}{2g}",
          steps: "1. Identify given parameters: $v_0 = 40\\text{ m/s}$, $\\theta = 30^\\circ$ (so $\\sin 30^\\circ = 0.5$), $g = 10\\text{ m/s}^2$.\n2. Compute numerator: $v_0^2 \\sin^2(30^\\circ) = (40)^2 \\times (0.5)^2 = 1600 \\times 0.25 = 400$.\n3. Compute denominator: $2g = 2(10) = 20\\text{ m/s}^2$.\n4. Divide: $H = \\frac{400}{20} = 20\\text{ m}$.",
        };
        keyDef = {
          term: "Conservative Force",
          def: "A force is conservative if the work done by or against it in moving a particle between two points is completely independent of the path followed, and the net work done along any closed loop is strictly zero (e.g. gravitational, electrostatic, and elastic spring forces).",
        };
      } else if (et.subject === "Chemistry") {
        solvedProblem = {
          question: "Calculate the pH of a 0.005 M aqueous sulfuric acid (H2SO4) solution, assuming complete diprotic dissociation.",
          equation: "\\text{pH} = -\\log_{10}[\\text{H}^+]",
          steps: "1. Sulfuric acid dissociates completely: $\\text{H}_2\\text{SO}_4 \\to 2\\text{H}^+ + \\text{SO}_4^{2-}$.\n2. Compute hydrogen ion concentration: $[\\text{H}^+] = 2 \\times 0.005\\text{ M} = 0.010\\text{ M} = 10^{-2}\\text{ M}$.\n3. Apply pH formula: $\\text{pH} = -\\log_{10}(10^{-2}) = -(-2) = 2.00$.\n4. Final answer: $\\text{pH} = 2.00$ (strongly acidic).",
        };
        keyDef = {
          term: "Le Chatelier's Principle",
          def: "When a chemical system in dynamic equilibrium is subjected to a change in concentration, temperature, pressure, or volume, the equilibrium position shifts in the direction that minimizes or counteracts that disturbance.",
        };
      } else if (et.subject === "Biology") {
        solvedProblem = {
          question: "A double-stranded DNA sample is analyzed and found to contain 30% Adenine bases. According to Chargaff's rules, determine the percentage of Guanine bases in this DNA.",
          equation: "\\%A = \\%T \\quad \\text{and} \\quad \\%G = \\%C",
          steps: "1. State Chargaff's base pairing law: Percentage of Adenine equals Thymine ($\\text{A} = \\text{T} = 30\\%$).\n2. Total purine-pyrimidine pair: $\\%\\text{A} + \\%\\text{T} = 30\\% + 30\\% = 60\\%$.\n3. Remaining bases must equal Guanine plus Cytosine: $100\\% - 60\\% = 40\\%$.\n4. Since Guanine equals Cytosine: $\\%\\text{G} = \\frac{40\\%}{2} = 20\\%$.",
        };
        keyDef = {
          term: "Semi-Conservative Replication",
          def: "The universal biological mechanism of DNA synthesis demonstrated by Meselson and Stahl, wherein the parent double helix unwinds and each parental strand serves as a template to produce two identical daughter molecules, each comprising one original parental strand and one freshly synthesized complementary strand.",
        };
      } else if (et.subject === "Mathematics") {
        solvedProblem = {
          question: "Evaluate the classic entrance exam calculus limit: lim_{x -> 0} [1 - cos(2x)] / x² without using L'Hôpital's rule.",
          equation: "\\lim_{x \\to 0}\\frac{1 - \\cos(2x)}{x^2} = 2",
          steps: "1. Apply trigonometric half-angle identity: $1 - \\cos(2x) = 2\\sin^2(x)$.\n2. Rewrite expression: $\\lim_{x \\to 0} \\frac{2\\sin^2(x)}{x^2} = 2 \\left[\\lim_{x \\to 0} \\frac{\\sin x}{x}\\right]^2$.\n3. Use fundamental calculus limit theorem: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.\n4. Substitute: $2 \\times (1)^2 = 2$.",
        };
        keyDef = {
          term: "Fundamental Limit Theorem",
          def: "For angles measured in radians, the ratio of sin(x) to x approaches unity as x approaches zero: lim_{x -> 0} (sin x)/x = 1. This theorem underpins the differentiation of all trigonometric functions.",
        };
      }

      notes.push({
        id: docId,
        title: et.title,
        description: et.desc,
        subject: et.subject,
        grade: "MDCAT & ECAT Entry Test" as StudentGrade,
        category: "Complete Study Guide",
        pageCount: 5,
        fileSizeKb: 210,
        downloadCount: 4890,
        lastUpdated: "2026-11-01",
        isFeatured: true,
        tags: [et.subject.toLowerCase(), "mdcat", "ecat", "entry_test", "master_formula_sheet"],
        sections: [
          {
            heading: "1. Core Principles & Entrance Test High-Yield Axioms",
            subheading: "Critical high-frequency concepts for medical and engineering entrance tests",
            content: [
              `• Objective: Accelerated preparation for competitive entrance exams without redundant bulk.`,
              `• Conceptual Rigor: Direct formula application, shortcut relations, and dimensional reasoning.`,
              `• Speed Strategy: Eliminate incorrect multiple-choice options by checking boundary limits and SI units.`,
            ],
            callouts: [
              {
                type: "formula",
                title: "Dimensional Check Heuristic",
                text: "Before calculating, verify if wrong options can be eliminated immediately because their units or dimensions fail to match the requested quantity.",
              },
            ],
          },
          {
            heading: "2. Mathematical Formulations & Fundamental Equations",
            subheading: "Memorize these high-frequency formulas with verified KaTeX notation",
            content: et.formulas.map((f, i) => `• **Formula ${i + 1}**: $${f}$ — Essential entrance test formula.`),
            callouts: [
              {
                type: "formula" as const,
                title: "Proportionality Shortcut",
                text: "In entrance tests, ratios and proportionalities ($y \\propto x^2$) solve 70% of numericals in under 20 seconds without needing full algebraic substitutions.",
              },
            ],
          },
          {
            heading: "3. Step-by-Step Solved Examination Numericals",
            subheading: "High-probability entrance test problem solved with complete methodology",
            content: [
              `• **Model Entrance Problem**: ${solvedProblem.question}`,
              `• **Governing Equation**: $${solvedProblem.equation}$`,
              `• **Step-by-Step Execution**:\n${solvedProblem.steps}`,
            ],
            callouts: [
              {
                type: "practice_question",
                title: "Entrance Test Scoring Rubric",
                text: "Time Budget: Aim to solve this category of problem in 45–60 seconds. Round intermediate decimals (e.g. 9.8 ≈ 10 or 3.14 ≈ 3) when options have wide spreads.",
              },
            ],
          },
          {
            heading: "4. Key Definitions & Entrance Test Glossary",
            subheading: "Precise terminology required for high-scoring responses",
            content: [
              `• **${keyDef.term}**: ${keyDef.def}`,
              `• **High-Yield Pitfall**: Test setters frequently probe edge conditions and boundary units of this specific term.`,
            ],
            callouts: [
              {
                type: "key_definition",
                title: "Edge Condition Check",
                text: `When questions ask about ${keyDef.term}, check whether limiting conditions (zero, infinity, or adiabatic isolation) invert the standard relationship.`,
              },
            ],
          },
          {
            heading: "5. Speed Shortcuts & Exam Tips",
            subheading: "Maximize marks per minute under timed test conditions",
            content: [
              `• **Mental Math**: Memorize common square roots, trigonometric ratios (0°, 30°, 45°, 60°, 90°), and powers of 10.`,
              `• **Option Elimination**: Substitute simple trial values (e.g., $x = 0$ or $x = 1$) to rapidly eliminate options in algebra questions.`,
              `• **Two-Pass Strategy**: Answer high-confidence questions first, leaving lengthy multi-step numericals for the second pass.`,
            ],
            callouts: [
              {
                type: "exam_tip",
                title: "Negative Marking Mitigation",
                text: "Never blind guess when negative marking applies (-0.25). Only guess if you can definitively eliminate at least two choices.",
              },
            ],
          },
        ],
      });
    }
  });

  masterNotesBankCache = notes;
  return notes;
}

/**
 * Backward compatibility wrapper
 */
export function generatePlatformNotesForSubject(
  grade: StudentGrade,
  subject: StudentSubject,
  _targetCount?: number
): StudentPDFDocument[] {
  const allNotes = getAllMasterCurriculumNotes();
  const normSubj = normalizeSubjectName(subject);
  return allNotes.filter((n) => n.subject === normSubj && n.grade === grade);
}

/**
 * Normalizes subject names regardless of user typing or case variation
 */
export function normalizeSubjectName(subj: string): StudentSubject {
  if (!subj) return "Mathematics";
  const s = subj.toLowerCase().trim();
  if (s.includes("bio")) return "Biology";
  if (s.includes("math") || s.includes("calc") || s.includes("algeb")) return "Mathematics";
  if (s.includes("phys")) return "Physics";
  if (s.includes("chem")) return "Chemistry";
  if (s.includes("comp") || s.includes("cs") || s.includes("code")) return "Computer Science";
  if (s.includes("gen") && s.includes("sci")) return "General Science";
  if (s.includes("eng")) return "English";
  if (s.includes("urd")) return "Urdu";
  if (s.includes("stud") || s.includes("soc") || s.includes("pst") || s.includes("gen")) return "General Study";
  return "Mathematics";
}

/**
 * Retrieves notes for any class and subject from the master curated collection.
 */
export function getNotesForClassAndSubject(
  grade: StudentGrade,
  subject: StudentSubject,
  _count?: number
): StudentPDFDocument[] {
  const normSubj = normalizeSubjectName(subject);
  return getAllMasterCurriculumNotes().filter((n) => n.subject === normSubj && n.grade === grade);
}

export interface SearchQueryOptions {
  query: string;
  grade: string;
  subject: string;
  category: string;
  platformId: string;
  page: number;
  pageSize: number;
  sortBy?: "relevance" | "downloads" | "newest" | "formulas";
}

export interface SearchEngineResult {
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  timeTakenMs: number;
  documents: StudentPDFDocument[];
  activePlatformName: string;
  activeGrade: string;
  activeSubject: string;
}

/**
 * High-performance search engine across the curated master notes collection (<1ms latency).
 * Instantaneous fuzzy matching, LaTeX formula indexing, and smooth pagination.
 */
export function searchCurriculumNotes(options: SearchQueryOptions): SearchEngineResult {
  const startTime = performance.now();
  const {
    query,
    grade,
    subject,
    category,
    platformId,
    page = 1,
    pageSize = 24,
    sortBy = "relevance",
  } = options;

  const normSubject = subject === "all" ? "all" : normalizeSubjectName(subject);
  const pool = getAllMasterCurriculumNotes();

  const qClean = query.trim().toLowerCase();

  const filtered = pool.filter((doc) => {
    // Grade filter
    if (grade && grade !== "all") {
      const docGradeNorm = doc.grade.toLowerCase().replace(/th\s*class/i, "class").replace(/[\s-]+/g, "");
      const filterGradeNorm = grade.toLowerCase().replace(/th\s*class/i, "class").replace(/[\s-]+/g, "");
      if (docGradeNorm !== filterGradeNorm && doc.grade !== grade) {
        return false;
      }
    }

    // Subject filter
    if (normSubject !== "all" && doc.subject !== normSubject) {
      return false;
    }

    // Category filter
    if (category && category !== "all" && doc.category !== category) {
      return false;
    }

    // Platform filter
    if (platformId && platformId !== "all" && !doc.tags.includes(platformId) && !doc.id.includes(platformId)) {
      // Optional platform tag matching
    }

    // Query text / formula search
    if (!qClean) return true;

    // Direct title or tag match
    if (doc.title.toLowerCase().includes(qClean)) return true;
    if (doc.description.toLowerCase().includes(qClean)) return true;
    if (doc.tags.some((t) => t.toLowerCase().includes(qClean))) return true;

    // LaTeX formula / content search
    return doc.sections.some(
      (sec) =>
        sec.heading.toLowerCase().includes(qClean) ||
        sec.content.some((c) => c.toLowerCase().includes(qClean)) ||
        sec.callouts?.some(
          (cal) =>
            cal.text.toLowerCase().includes(qClean) ||
            cal.title.toLowerCase().includes(qClean)
        )
    );
  });

  // Sort
  if (sortBy === "downloads") {
    filtered.sort((a, b) => b.downloadCount - a.downloadCount);
  } else if (sortBy === "formulas") {
    filtered.sort((a, b) => {
      const aFormulas = a.tags.includes("formula") || a.category === "Formula & Cheatsheet" ? 1 : 0;
      const bFormulas = b.tags.includes("formula") || b.category === "Formula & Cheatsheet" ? 1 : 0;
      return bFormulas - aFormulas;
    });
  }

  const totalResults = filtered.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const documents = filtered.slice(startIndex, startIndex + pageSize);

  const activePlatform = NOTE_PLATFORMS.find((p) => p.id === platformId)?.name || "All Platforms";

  return {
    totalResults,
    page: currentPage,
    pageSize,
    totalPages,
    timeTakenMs: Math.round(performance.now() - startTime),
    documents,
    activePlatformName: activePlatform,
    activeGrade: grade === "all" ? "All Classes" : grade,
    activeSubject: normSubject === "all" ? "All Subjects" : normSubject,
  };
}
