import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileDown,
  Download,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Eye,
  X,
  FileText,
  Clock,
  HardDrive,
  Layers,
  GraduationCap,
  Plus,
  Printer,
  Share2,
  Atom,
  FlaskConical,
  Dna,
  Binary,
  Calculator,
  Compass,
  Check,
  ArrowRight,
  Filter,
  Bookmark,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Award,
} from "lucide-react";
import {
  StudentPDFDocument,
  StudentSubject,
  StudentGrade,
  StudentPDFCategory,
  StudentPDFSection,
  StudentPDFCallout,
} from "../types";
import { initialStudentPDFs } from "../data/studentPDFsData";
import {
  downloadStudentPDFFile,
  generateStudentPDF,
} from "../utils/studentPdfGenerator";
import { FormattedMathText, MathFormula } from "./MathRenderer";
import {
  searchCurriculumNotes,
  NOTE_PLATFORMS,
  SearchEngineResult,
} from "../services/curriculumNotesEngine";
import { useAuth } from "../context/AuthContext";
import { getUserItem, setUserItem, persistUserKeyToServer, logUserActivityToServer } from "../utils/userStorage";
import {
  UploadedPdfNoteRecord,
  fetchAllPdfNotes,
  subscribeToPdfNotes,
  downloadVerbatimPdf,
} from "../services/cloudSyncService";

interface StudentPDFViewProps {
  initialSubjectFilter?: string | null;
  initialGradeFilter?: string | null;
  onOpenPdfNotesMode?: (noteId?: string) => void;
}

interface ReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function getNoteReviewQuestions(doc: StudentPDFDocument): ReviewQuestion[] {
  const s = (doc.subject || "").toLowerCase();
  const t = (doc.title || "").toLowerCase();

  if (s.includes("phys")) {
    if (t.includes("kinemat") || t.includes("motion")) {
      return [
        {
          question: "When an object starts from rest ($v_i = 0$) with uniform acceleration $a$, what is its displacement $S$ in time $t$?",
          options: ["$S = v_i + at$", "$S = \\frac{1}{2}at^2$", "$S = 2at$", "$S = at^2$"],
          correctIndex: 1,
          explanation: "Substituting $v_i = 0$ into $S = v_i t + \\frac{1}{2}at^2$ reduces the displacement directly to $S = \\frac{1}{2}at^2$.",
        },
        {
          question: "What is the standard SI metric unit of acceleration?",
          options: ["$\\text{m/s}$", "$\\text{m}\\cdot\\text{s}$", "$\\text{m/s}^2$", "$\\text{kg}\\cdot\\text{m/s}$"],
          correctIndex: 2,
          explanation: "Acceleration represents the rate of change of velocity with respect to time: $\\frac{\\text{m/s}}{\\text{s}} = \\text{m/s}^2$.",
        },
        {
          question: "In board exam numericals, what is required to secure maximum methodology marks?",
          options: ["Directly write down the final number", "State Given Data, To Find, and Formula with standard symbols", "Omit SI units until the end", "Skip intermediate algebra"],
          correctIndex: 1,
          explanation: "Board marking schemes award explicit marks for stating Given Data, To Find, and the primary governing equation before substituting values.",
        },
      ];
    }
    return [
      {
        question: "Which physical quantities share the standard SI unit of Joule (J)?",
        options: ["Power and Momentum", "Work and Energy", "Force and Torque", "Pressure and Stress"],
        correctIndex: 1,
        explanation: "Work and Energy share identical dimensions $[ML^2T^{-2}]$ and are both measured in Joules ($1\\text{ J} = 1\\text{ N}\\cdot\\text{m}$).",
      },
      {
        question: "Before performing calculations in any physical formula, what must always be verified?",
        options: ["All quantities are converted to standard SI metric units", "The result must always be negative", "All units are imperial feet and inches", "Calculations are done without formula"],
        correctIndex: 0,
        explanation: "Dimensional consistency requires all quantities (mass in kg, length in meters, time in seconds) to be in SI units prior to substitution.",
      },
      {
        question: "What happens to the kinetic energy of an object if its speed is doubled?",
        options: ["It doubles (2x)", "It quadruples (4x)", "It halves (0.5x)", "It remains unchanged"],
        correctIndex: 1,
        explanation: "Because $K.E. = \\frac{1}{2}mv^2$, doubling velocity $v \\to (2v)^2 = 4v^2$, quadrupling kinetic energy.",
      },
    ];
  }

  if (s.includes("math")) {
    return [
      {
        question: "In the quadratic equation $ax^2 + bx + c = 0$, what does the discriminant $D = b^2 - 4ac > 0$ indicate?",
        options: ["Two distinct real roots", "Two imaginary complex roots", "One repeated equal real root", "No solution exists"],
        correctIndex: 0,
        explanation: "When the discriminant is strictly positive ($D > 0$), the quadratic equation yields two distinct real roots.",
      },
      {
        question: "What is a square matrix whose determinant is strictly zero ($|A| = 0$) called?",
        options: ["Identity matrix", "Singular matrix", "Scalar matrix", "Orthogonal matrix"],
        correctIndex: 1,
        explanation: "A square matrix is singular when $|A| = 0$, which signifies that it has no multiplicative inverse ($A^{-1}$ does not exist).",
      },
      {
        question: "How should the final roots of an algebraic equation be presented on a board exam paper?",
        options: ["Left as rough work", "Enclosed in a formal Solution Set $\\{x_1, x_2\\}$ and underlined", "Omit any negative root", "Only approximate with decimals"],
        correctIndex: 1,
        explanation: "Underlining the final roots enclosed in a formal Solution Set $\\{x_1, x_2\\}$ ensures full presentation credit under board marking rubrics.",
      },
    ];
  }

  if (s.includes("chem")) {
    return [
      {
        question: "How many elementary particles are present in exactly one mole of any pure substance?",
        options: ["$3.1415 \\times 10^{23}$", "$6.022 \\times 10^{23}$ (Avogadro's constant)", "$9.8 \\times 10^{24}$", "$1.602 \\times 10^{-19}$"],
        correctIndex: 1,
        explanation: "One mole of any substance contains exactly $6.022 \\times 10^{23}$ constituent particles (Avogadro's number).",
      },
      {
        question: "In a dynamic chemical equilibrium, which statement is strictly true?",
        options: ["The chemical reaction has ceased completely", "The rates of forward and reverse reactions are equal", "All reactant molecules are exhausted", "The temperature drops to absolute zero"],
        correctIndex: 1,
        explanation: "Dynamic equilibrium is an active state where the forward reaction velocity equals the backward reaction velocity, maintaining constant macroscopic concentrations.",
      },
      {
        question: "Why must physical state symbols $(s, l, g, aq)$ accompany chemical equations in examinations?",
        options: ["They are decorative choices", "They indicate physical phases essential for stoichiometric and thermodynamic marks", "Only needed for noble gases", "To make formulas look longer"],
        correctIndex: 1,
        explanation: "Curriculum boards mandate state symbols $(s, l, g, aq)$ to demonstrate precise thermodynamic and stoichiometric understanding.",
      },
    ];
  }

  return [
    {
      question: "Which of the following serves as the universal cellular energy currency in living organisms?",
      options: ["Glucose", "ATP (Adenosine Triphosphate)", "Deoxyribose DNA", "Cellulose fiber"],
      correctIndex: 1,
      explanation: "ATP stores readily accessible chemical energy released by the cleavage of high-energy phosphate bonds.",
    },
    {
      question: "What distinguishes active transport from passive diffusion or osmosis?",
      options: ["Requires metabolic cellular energy (ATP) against a concentration gradient", "Moves water molecules exclusively", "Operates only in non-living matter", "Requires zero energy input"],
      correctIndex: 0,
      explanation: "Active transport utilizes ATP to move solutes uphill against electrochemical or concentration gradients.",
    },
    {
      question: "When presenting multi-stage physiological pathways in long questions, what format secures maximum marks?",
      options: ["A single unbroken paragraph", "Sequential numbered or bulleted steps accompanied by a neat labeled diagram", "Omitting enzyme cofactors", "Writing in conversational slang"],
      correctIndex: 1,
      explanation: "Organized sequential bullet points with accurate technical vocabulary and clear labeled pencil diagrams achieve top examiner evaluation.",
    },
  ];
}

function renderTextbookContentItem(para: string, pIdx: number, secHeading: string) {
  // 1. Worked Examination Problem Card
  if (
    para.includes("Model Exam Problem") ||
    para.includes("Model Entrance Problem") ||
    para.includes("Governing Equation:") ||
    para.includes("Step-by-Step Worked Solution:") ||
    para.includes("Step-by-Step Execution:")
  ) {
    const parts = para.split(/\n\n→\s*|\n→\s*/);
    const mainProblem = parts[0] || "";
    let equationPart = "";
    let solutionPart = "";

    parts.slice(1).forEach((part) => {
      if (part.includes("Governing Equation:")) {
        equationPart = part.replace(/^\*{0,2}Governing Equation\*{0,2}:\s*/i, "").trim();
      } else if (part.includes("Step-by-Step Worked Solution:") || part.includes("Step-by-Step Execution:")) {
        solutionPart = part.replace(/^\*{0,2}Step-by-Step (?:Worked Solution|Execution)\*{0,2}:\s*/i, "").trim();
      } else if (!equationPart) {
        equationPart = part;
      } else {
        solutionPart = part;
      }
    });

    const cleanTitleMatch = mainProblem.match(/^•\s*\*{0,2}(Model (?:Exam|Entrance) Problem\s*\d*)\*{0,2}:?\s*([\s\S]*)$/i);
    const problemTitle = cleanTitleMatch ? cleanTitleMatch[1] : `Model Exam Problem`;
    const problemText = cleanTitleMatch ? cleanTitleMatch[2] : mainProblem.replace(/^•\s*/, "");
    const solutionLines = (solutionPart || "").split("\n").filter(Boolean);

    return (
      <div
        key={pIdx}
        className="my-3.5 rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden"
      >
        <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/60 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
          <span className="font-black text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> {problemTitle}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold">
            Step-by-Step Worked Model
          </span>
        </div>

        {/* Problem Statement */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/60 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
          <FormattedMathText text={problemText} />
        </div>

        {/* Governing Equation */}
        {equationPart && (
          <div className="px-4 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/30 border-b border-indigo-100/60 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider shrink-0">
              Governing Equation:
            </span>
            <div className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 font-semibold overflow-x-auto py-1">
              <FormattedMathText text={equationPart} />
            </div>
          </div>
        )}

        {/* Solution breakdown */}
        <div className="p-4 space-y-2 text-xs sm:text-sm">
          {solutionLines.map((line, sIdx) => {
            const isGiven = line.toLowerCase().startsWith("given:");
            const isFinal = line.toLowerCase().startsWith("final answer:");
            if (isFinal) {
              return (
                <div
                  key={sIdx}
                  className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 font-bold flex items-center gap-2.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <FormattedMathText text={line} />
                </div>
              );
            }
            if (isGiven) {
              return (
                <div
                  key={sIdx}
                  className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200 font-medium"
                >
                  <FormattedMathText text={line} />
                </div>
              );
            }
            return (
              <div key={sIdx} className="leading-relaxed text-slate-700 dark:text-slate-300">
                <FormattedMathText text={line} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Mathematical Formula item in Section 2
  if (secHeading.includes("Mathematical") && para.includes("Formally defined as")) {
    const match = para.match(/^•\s*\*{0,2}(.*?)\*{0,2}:\s*Formally defined as\s*(\$?[^$]+\$?)\.\s*Application & Units:\s*(.*)$/);
    if (match) {
      const [, fName, fLatex, fExpl] = match;
      return (
        <div
          key={pIdx}
          className="my-2.5 p-3.5 sm:p-4 rounded-2xl border border-teal-200/90 dark:border-teal-800/60 bg-teal-50/20 dark:bg-teal-950/20 space-y-2 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              {fName}
            </span>
            <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold tracking-wide uppercase">
              Core Formula
            </span>
          </div>
          <div className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 text-center text-sm sm:text-base text-slate-900 dark:text-slate-100 overflow-x-auto shadow-inner">
            <FormattedMathText text={fLatex} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Application & Units:</strong> {fExpl}
          </p>
        </div>
      );
    }
  }

  // 3. Key Definition item in Section 4
  if (secHeading.includes("Definitions") && (para.startsWith("• **") || para.startsWith("• "))) {
    const match = para.match(/^•\s*\*{0,2}(.*?)\*{0,2}:\s*(.*)$/);
    if (match) {
      const [, term, def] = match;
      return (
        <div
          key={pIdx}
          className="my-2.5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs uppercase tracking-wide">
              {term}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Official Syllabus Definition</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
            <FormattedMathText text={def} />
          </p>
        </div>
      );
    }
  }

  // 4. Conceptual Pillar Card in Section 1
  if ((secHeading.includes("Syllabus") || secHeading.includes("Foundations")) && (para.startsWith("• **") || para.startsWith("• "))) {
    const match = para.match(/^•\s*\*{0,2}(.*?)\*{0,2}:\s*(.*)$/);
    if (match) {
      const [, conceptTitle, conceptBody] = match;
      const isOverview = conceptTitle.toLowerCase().includes("overview");
      const isRelevance = conceptTitle.toLowerCase().includes("relevance");

      return (
        <div
          key={pIdx}
          className={`my-2.5 p-3.5 sm:p-4 rounded-2xl border transition-all ${
            isOverview
              ? "border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 shadow-xs"
              : isRelevance
              ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-extrabold text-xs uppercase tracking-wide ${
                isOverview
                  ? "bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200"
                  : isRelevance
                  ? "bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              {conceptTitle}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-1">
            <FormattedMathText text={conceptBody} />
          </div>
        </div>
      );
    }
  }

  // 5. Examiner Strategy Card in Section 5
  if ((secHeading.includes("Tips") || secHeading.includes("Distinction")) && (para.startsWith("• **") || para.startsWith("• "))) {
    const match = para.match(/^•\s*\*{0,2}(.*?)\*{0,2}:\s*(.*)$/);
    if (match) {
      const [, tipLabel, tipText] = match;
      return (
        <div
          key={pIdx}
          className="my-2.5 p-3.5 rounded-2xl border border-amber-200/90 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 flex items-start gap-3 shadow-xs"
        >
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="font-extrabold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
              {tipLabel}
            </span>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <FormattedMathText text={tipText} />
            </div>
          </div>
        </div>
      );
    }
  }

  // 6. Clean Bullet Item for any remaining content
  if (para.trim().startsWith("•") || para.trim().startsWith("-")) {
    const cleanContent = para.trim().replace(/^[-•]\s*/, "");
    return (
      <div key={pIdx} className="my-1.5 flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
        <div className="flex-1">
          <FormattedMathText text={cleanContent} />
        </div>
      </div>
    );
  }

  // 7. Standard Paragraph
  return (
    <div key={pIdx} className="leading-relaxed whitespace-pre-line text-xs sm:text-sm">
      <FormattedMathText text={para} />
    </div>
  );
}

export const StudentPDFView: React.FC<StudentPDFViewProps> = ({
  initialSubjectFilter,
  initialGradeFilter,
  onOpenPdfNotesMode,
}) => {
  const { currentUser } = useAuth();
  const [adminUploadedPdfs, setAdminUploadedPdfs] = useState<UploadedPdfNoteRecord[]>([]);
  const [downloadingUploadedId, setDownloadingUploadedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPdfNotes().then(setAdminUploadedPdfs).catch(() => {});
    const unsub = subscribeToPdfNotes((notes) => {
      setAdminUploadedPdfs(notes);
    });
    return () => unsub();
  }, []);

  const [pdfList, setPdfList] = useState<StudentPDFDocument[]>(() => {
    const saved = getUserItem<StudentPDFDocument[]>(currentUser?.id, "custom_pdfs", []);
    return [...initialStudentPDFs, ...saved];
  });

  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    return getUserItem<string[]>(currentUser?.id, "downloaded_pdf_ids", []);
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubjectFilter || "all"
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(
    initialGradeFilter || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchSortBy, setSearchSortBy] = useState<"relevance" | "downloads" | "formulas">("relevance");
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);

  // Active preview modal state
  const [previewDoc, setPreviewDoc] = useState<StudentPDFDocument | null>(null);
  const [readingMode, setReadingMode] = useState<"textbook" | "standard">("textbook");
  const [fontSizeScale, setFontSizeScale] = useState<"normal" | "large" | "xlarge">("normal");
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setReviewAnswers({});
  }, [previewDoc?.id]);

  // Custom PDF builder modal state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customSubject, setCustomSubject] = useState<StudentSubject>("Biology");
  const [customGrade, setCustomGrade] = useState<StudentGrade>("11th Class");
  const [customCategory, setCustomCategory] =
    useState<StudentPDFCategory>("Complete Study Guide");
  const [customDescription, setCustomDescription] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Instant AI Topic Notes Generator State
  const [instantTopic, setInstantTopic] = useState("");
  const [instantSubject, setInstantSubject] = useState<StudentSubject>("Biology");
  const [instantGrade, setInstantGrade] = useState<StudentGrade>("11th Class");
  const [isGeneratingInstant, setIsGeneratingInstant] = useState(false);
  const [latestGeneratedDoc, setLatestGeneratedDoc] = useState<StudentPDFDocument | null>(null);

  // Sync filters if props change via navigation
  useEffect(() => {
    if (initialSubjectFilter) {
      setSelectedSubject(initialSubjectFilter);
    }
    if (initialGradeFilter) {
      setSelectedGrade(initialGradeFilter);
    }
  }, [initialSubjectFilter, initialGradeFilter]);

  // Reset page to 1 when search query, grade, subject, category or platform filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedGrade, selectedCategory, selectedPlatform, searchSortBy, showDownloadedOnly]);

  // Re-synchronize custom PDFs and downloaded IDs when user changes
  const lastSyncedDownloadedRef = useRef<string>("");

  // Re-synchronize downloaded & custom PDFs when user switches
  useEffect(() => {
    const saved = getUserItem<StudentPDFDocument[]>(currentUser?.id, "custom_pdfs", []);
    setPdfList([...initialStudentPDFs, ...saved]);
    const stored = getUserItem<string[]>(currentUser?.id, "downloaded_pdf_ids", []);
    lastSyncedDownloadedRef.current = JSON.stringify(stored);
    setDownloadedIds(stored);
  }, [currentUser?.id]);

  // Update user storage & backend whenever downloadedIds actually changes
  useEffect(() => {
    if (currentUser?.id) {
      setUserItem(currentUser.id, "downloaded_pdf_ids", downloadedIds);
      const serialized = JSON.stringify(downloadedIds);
      if (serialized !== lastSyncedDownloadedRef.current) {
        lastSyncedDownloadedRef.current = serialized;
        persistUserKeyToServer(currentUser.id, "downloaded_pdf_ids", downloadedIds);
        if (downloadedIds.length > 0) {
          logUserActivityToServer({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.name,
            feature: "pdfs",
            action: "PDF_DOWNLOADED",
            details: `Downloaded PDF library item (${downloadedIds[downloadedIds.length - 1]})`,
          });
        }
      }
    }
  }, [downloadedIds, currentUser?.id, currentUser?.email, currentUser?.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleGenerateInstantNotes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!instantTopic.trim()) {
      showToast("Please enter a study topic (e.g., Photosynthesis, Newton's Laws)!");
      return;
    }
    setIsGeneratingInstant(true);
    try {
      const res = await fetch("/api/ai/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: instantTopic.trim(),
          subject: instantSubject,
          grade: instantGrade,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.document) {
          const newDoc: StudentPDFDocument = data.document;
          setLatestGeneratedDoc(newDoc);
          const userCustoms = getUserItem<StudentPDFDocument[]>(currentUser?.id, "custom_pdfs", []);
          const updatedCustoms = [newDoc, ...userCustoms];
          setUserItem(currentUser?.id, "custom_pdfs", updatedCustoms);
          persistUserKeyToServer(currentUser?.id, "custom_pdfs", updatedCustoms);
          if (currentUser?.id) {
            logUserActivityToServer({
              userId: currentUser.id,
              userEmail: currentUser.email,
              userName: currentUser.name,
              feature: "pdfs",
              action: "GENERATED_CUSTOM_NOTES",
              details: `Generated AI study guide "${instantTopic.trim()}"`,
            });
          }
          showToast(`✨ Generated complete study guide & exam keys for "${instantTopic.trim()}"!`);
        }
      } else {
        showToast("Unable to generate notes. Please try again.");
      }
    } catch {
      showToast("Network error generating notes. Check server connection.");
    } finally {
      setIsGeneratingInstant(false);
    }
  };

  const handleDownload = (docItem: StudentPDFDocument, studentName?: string) => {
    setDownloadingId(docItem.id);
    try {
      if (docItem.fileUrl) {
        const a = document.createElement("a");
        a.href = docItem.fileUrl;
        a.download = docItem.fileUrl.split("/").pop() || "Class_12_Physics_Ch.11_Theory_Notes.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        downloadStudentPDFFile(docItem, studentName || customStudentName);
      }
      if (!downloadedIds.includes(docItem.id)) {
        const next = [...downloadedIds, docItem.id];
        setDownloadedIds(next);
      }
      showToast(`Downloaded "${docItem.title}" successfully!`);
    } catch {
      showToast("Could not download file. Please try again.");
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 600);
    }
  };

  const handleDownloadAllFiltered = () => {
    displayedPDFs.forEach((doc, idx) => {
      setTimeout(() => {
        downloadStudentPDFFile(doc, customStudentName);
        if (!downloadedIds.includes(doc.id)) {
          setDownloadedIds((prev) => [...prev, doc.id]);
        }
      }, idx * 300);
    });
    showToast(`Downloading ${displayedPDFs.length} notes from this page to your local files...`);
  };

  const handleCreateCustomPDF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    // Parse notes into sections
    const rawLines = customNotes
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const sections: StudentPDFSection[] = [];
    let currentHeading = "1. Key Concepts & Overview";
    let currentContent: string[] = [];

    if (rawLines.length === 0) {
      currentContent = [
        "Comprehensive student study guide and formula overview.",
        "Ensure review of all definitions and core problems before exam sessions.",
      ];
    } else {
      rawLines.forEach((line) => {
        if (line.startsWith("#") || line.endsWith(":")) {
          if (currentContent.length > 0) {
            sections.push({
              heading: currentHeading,
              content: [...currentContent],
            });
            currentContent = [];
          }
          currentHeading = line.replace(/^#+\s*/, "").replace(/:$/, "");
        } else {
          currentContent.push(line.startsWith("•") ? line : `• ${line}`);
        }
      });
    }

    if (currentContent.length > 0) {
      sections.push({
        heading: currentHeading,
        content: currentContent,
      });
    }

    const newDoc: StudentPDFDocument = {
      id: `custom-pdf-${Date.now()}`,
      title: customTitle.trim(),
      description:
        customDescription.trim() ||
        `Custom generated study notes for ${customSubject} (${customGrade}).`,
      subject: customSubject,
      grade: customGrade,
      category: customCategory,
      pageCount: Math.max(2, Math.ceil(rawLines.length / 12) + 1),
      fileSizeKb: Math.floor(Math.random() * 80) + 120,
      downloadCount: 1,
      lastUpdated: new Date().toISOString().split("T")[0],
      tags: [customSubject.toLowerCase(), "custom", "student_notes"],
      isFeatured: false,
      sections,
    };

    // Save to user storage and state
    const userCustoms = getUserItem<StudentPDFDocument[]>(currentUser?.id, "custom_pdfs", []);
    const updatedCustoms = [newDoc, ...userCustoms];
    setUserItem(currentUser?.id, "custom_pdfs", updatedCustoms);
    persistUserKeyToServer(currentUser?.id, "custom_pdfs", updatedCustoms);
    if (currentUser?.id) {
      logUserActivityToServer({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        feature: "pdfs",
        action: "CREATED_CUSTOM_PDF",
        details: `Created custom study PDF "${newDoc.title}"`,
      });
    }
    setPdfList([newDoc, ...pdfList]);
    setIsBuilderOpen(false);
    handleDownload(newDoc, customStudentName);
  };

  const handleAIGenerateNotes = async () => {
    if (!customTitle.trim()) {
      showToast("Please enter a title or topic first!");
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await fetch("/api/generate-ai-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are an expert high school and college curriculum tutor. Generate comprehensive, high-yield academic study notes for the topic: "${customTitle}" in subject "${customSubject}" for "${customGrade}".
          Format the output cleanly with section headings and bullet points like:
          # Core Principles & Foundations:
          • Definition of key terms
          • Detailed scientific or conceptual explanations
          # Mechanisms and Step-by-Step Breakdown:
          • Step 1...
          • Step 2...
          # High-Yield Formulas & Exam Tips:
          • Key equation or rule
          • Typical test pitfalls to avoid`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setCustomNotes(data.text);
          if (!customDescription) {
            setCustomDescription(`AI-structured curriculum study guide for ${customTitle}.`);
          }
          showToast("AI Study Notes generated! Review or edit before downloading.");
        }
      } else {
        // Fallback default notes template
        setCustomNotes(
          `# 1. Fundamental Principles & Definition:\n• Primary definition and scope of ${customTitle}.\n• Key historical background and foundational axioms.\n• Fundamental variables and units of measurement.\n\n# 2. Detailed Conceptual Breakdown:\n• First law or primary operational mechanics.\n• Equilibrium and transformation dynamics.\n• Real-world applications and experimental proofs.\n\n# 3. High-Yield Exam Equations & Tips:\n• Core formula: Ensure consistent SI units before computation.\n• High-frequency question: Watch out for sign conventions and boundary conditions.`
        );
        showToast("Drafted study guide template!");
      }
    } catch (err) {
      setCustomNotes(
        `# 1. Fundamental Principles & Definition:\n• Primary definition and scope of ${customTitle}.\n• Key historical background and foundational axioms.\n\n# 2. Step-by-Step Problem Solving:\n• Step 1: Identify given variables and required targets.\n• Step 2: Apply governing equations.\n\n# 3. Exam Tips & High-Yield Summary:\n• Memorize key definitions and reciprocal formulas.`
      );
      showToast("Drafted study guide template!");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Execute search engine query across 3,000+ notes per subject per class
  const searchEngineResult: SearchEngineResult = useMemo(() => {
    return searchCurriculumNotes({
      query: searchTerm,
      grade: selectedGrade,
      subject: selectedSubject,
      category: selectedCategory,
      platformId: selectedPlatform,
      page: currentPage,
      pageSize: 24,
      sortBy: searchSortBy,
    });
  }, [
    searchTerm,
    selectedGrade,
    selectedSubject,
    selectedCategory,
    selectedPlatform,
    currentPage,
    searchSortBy,
  ]);

  const displayedPDFs = useMemo(() => {
    if (showDownloadedOnly) {
      return searchEngineResult.documents.filter((doc) => downloadedIds.includes(doc.id));
    }
    return searchEngineResult.documents;
  }, [showDownloadedOnly, searchEngineResult.documents, downloadedIds]);

  const getSubjectBadge = (subj: StudentSubject) => {
    switch (subj) {
      case "Biology":
        return {
          icon: Dna,
          badgeClass:
            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "Chemistry":
        return {
          icon: FlaskConical,
          badgeClass:
            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "Physics":
        return {
          icon: Atom,
          badgeClass:
            "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
        };
      case "English":
        return {
          icon: BookOpen,
          badgeClass:
            "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          iconColor: "text-purple-600 dark:text-purple-400",
        };
      case "Mathematics":
        return {
          icon: Calculator,
          badgeClass:
            "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
          iconColor: "text-cyan-600 dark:text-cyan-400",
        };
      case "Computer Science":
        return {
          icon: Binary,
          badgeClass:
            "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          iconColor: "text-indigo-600 dark:text-indigo-400",
        };
      default:
        return {
          icon: Compass,
          badgeClass:
            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          iconColor: "text-slate-600 dark:text-slate-400",
        };
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/60 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <FileDown className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
              Direct Student Local Downloads
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student PDF Library & Study Downloads
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every student can download complete curriculum study guides, chapter notes, formula cheat sheets, and exam problem sets straight to their computer or phone for offline study.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="open-custom-pdf-builder"
              onClick={() => setIsBuilderOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Custom Study PDF
            </button>
            <button
              onClick={handleDownloadAllFiltered}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
              title="Download notes on current page to your device"
            >
              <Download className="w-4 h-4 text-cyan-300" /> Download Current Page ({displayedPDFs.length})
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-indigo-800/40 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-cyan-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white">Curated Master Notes</p>
              <p className="text-[10px] text-slate-400">1 Master Guide Per Topic</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-emerald-300">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white">100% Offline</p>
              <p className="text-[10px] text-slate-400">Saves to local files</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-amber-300">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white">Class 1st to 12th + MDCAT</p>
              <p className="text-[10px] text-slate-400">All subjects & formulas</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-purple-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white">{downloadedIds.length} Saved on Device</p>
              <p className="text-[10px] text-slate-400">Local downloads tracked</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 LIVE ADMIN-UPLOADED ORIGINAL PDFS (FROM PDF NOTES MODE) */}
      {adminUploadedPdfs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  Official Uploaded PDF Notes ({adminUploadedPdfs.length})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Original verbatim PDF files published by the Master Administrator — available immediately for all students.
                </p>
              </div>
            </div>
            {onOpenPdfNotesMode && (
              <button
                type="button"
                onClick={() => onOpenPdfNotesMode()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
              >
                <span>Open Full PDF Notes Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {adminUploadedPdfs.slice(0, 6).map((upPdf) => (
              <div
                key={upPdf.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                      {upPdf.grade}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold">
                      {upPdf.subject}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {upPdf.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {upPdf.fileName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenPdfNotesMode && (
                    <button
                      type="button"
                      onClick={() => onOpenPdfNotesMode(upPdf.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold cursor-pointer"
                    >
                      Read in PDF Mode
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={downloadingUploadedId === upPdf.id}
                    onClick={async () => {
                      setDownloadingUploadedId(upPdf.id);
                      try {
                        await downloadVerbatimPdf(upPdf);
                        showToast(`Downloading "${upPdf.fileName}"`);
                      } catch (err: any) {
                        showToast(err?.message || "Failed to download PDF.");
                      } finally {
                        setDownloadingUploadedId(null);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>{downloadingUploadedId === upPdf.id ? "Loading..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⚡ INSTANT AI TOPIC STUDY GUIDE & EXAM KEYS GENERATOR */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-cyan-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Instant AI Topic Study Guide & Exam Keys
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Class 1st to 2nd Year
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Type any topic from your syllabus to instantly generate full conceptual notes, memory mnemonics, formulas, and board exam keys!
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerateInstantNotes} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-5 relative">
            <input
              type="text"
              value={instantTopic}
              onChange={(e) => setInstantTopic(e.target.value)}
              placeholder="Enter ANY topic (e.g., Photosynthesis, Newton's Laws, Quadratic Equations, 1973 Constitution)..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all shadow-inner"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={instantSubject}
              onChange={(e) => setInstantSubject(e.target.value as StudentSubject)}
              className="w-full px-3 py-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs font-bold text-white focus:outline-none focus:border-indigo-400 transition-all"
            >
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="General Study">Social Studies</option>
              <option value="Urdu">Urdu</option>
              <option value="English">English</option>
              <option value="General Science">General Science</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={instantGrade}
              onChange={(e) => setInstantGrade(e.target.value as StudentGrade)}
              className="w-full px-3 py-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs font-bold text-white focus:outline-none focus:border-indigo-400 transition-all"
            >
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9 (Matric 1)</option>
              <option value="Class 10">Class 10 (Matric 2)</option>
              <option value="Class 11">Class 11 (1st Year FSc)</option>
              <option value="Class 12">Class 12 (2nd Year FSc)</option>
              <option value="MDCAT & ECAT Entry Test">MDCAT & ECAT</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isGeneratingInstant}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-indigo-600/40 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isGeneratingInstant ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Synthesizing Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Generate with Tips & Keys</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Latest Generated Note Quick-Action Card */}
        {latestGeneratedDoc && (
          <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                  Ready To Save
                </span>
                <span className="text-xs text-indigo-200 font-bold">
                  {latestGeneratedDoc.subject} • {latestGeneratedDoc.grade}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white">
                {latestGeneratedDoc.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {latestGeneratedDoc.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPreviewDoc(latestGeneratedDoc)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-300" /> Preview Notes
              </button>
              <button
                onClick={() => handleDownload(latestGeneratedDoc)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔍 PRO ACADEMIC NOTES SEARCH ENGINE */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        {/* Search Engine Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 text-white shadow-md shadow-indigo-600/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Academic Notes Search Engine
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                  v2.0 PRO Engine
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  10,000+ Notes Per Subject
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Instant search across 10,000+ verified notes per subject for every class with KaTeX formulas, powers, fractions, and square roots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort by dropdown */}
            <span className="text-[11px] font-bold text-slate-400">Sort:</span>
            <select
              value={searchSortBy}
              onChange={(e) => {
                setSearchSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="relevance">Most Relevant</option>
              <option value="downloads">Most Downloaded</option>
              <option value="formulas">Formula-Rich First</option>
            </select>
          </div>
        </div>

        {/* Primary Search Input with Clear Button */}
        <div className="relative">
          <Search className="w-5 h-5 text-indigo-500 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            id="pdf-search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by topic, chapter, board numerical, or math formula (e.g., Quadratic Formula, Kinematics v=u+at, VSEPR, SHM, Mitosis)..."
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trending Search Shortcuts */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Trending:
          </span>
          {[
            { label: "Quadratic Formula", q: "quadratic formula" },
            { label: "Newton's Laws F=ma", q: "newton force" },
            { label: "Trigonometric Identities", q: "trigonometry identity" },
            { label: "Cell Mitosis & Meiosis", q: "mitosis cell" },
            { label: "Matrices & Determinants", q: "matrix determinant" },
            { label: "Pythagorean Theorem", q: "pythagorean theorem" },
            { label: "Logarithm Rules", q: "logarithm" },
            { label: "Gravitation & Earth Mass", q: "gravitation mass" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setSearchTerm(item.q);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Multi-Platform Sources Filter Tabs (Hidden as requested) */}
        <div className="hidden pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              Platform & Publisher Editions:
            </span>
            <span className="text-[10px] text-slate-400">Notes curated from multi-board platforms</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => {
                setSelectedPlatform("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedPlatform === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All Platforms (Combined)
            </button>
            {NOTE_PLATFORMS.map((plat) => {
              const isSelected = selectedPlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => {
                    setSelectedPlatform(plat.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                      : `${plat.badgeColor} hover:brightness-110`
                  }`}
                  title={plat.description}
                >
                  {plat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Class Filter Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
              Class:
            </span>
            {[
              { id: "all", label: "All Classes" },
              { id: "Class 1", label: "Class 1" },
              { id: "Class 2", label: "Class 2" },
              { id: "Class 3", label: "Class 3" },
              { id: "Class 4", label: "Class 4" },
              { id: "Class 5", label: "Class 5" },
              { id: "Class 6", label: "Class 6" },
              { id: "Class 7", label: "Class 7" },
              { id: "Class 8", label: "Class 8" },
              { id: "Class 9", label: "Class 9" },
              { id: "Class 10", label: "Class 10" },
              { id: "Class 11", label: "Class 11" },
              { id: "Class 12", label: "Class 12" },
              { id: "MDCAT & ECAT Entry Test", label: "MDCAT & ECAT" },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGrade(g.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedGrade === g.id
                    ? "bg-indigo-600 text-white shadow-xs ring-1 ring-white/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Subject:
            </span>
            {[
              { id: "all", label: "All Subjects" },
              { id: "mathematics", label: "Mathematics" },
              { id: "physics", label: "Physics" },
              { id: "chemistry", label: "Chemistry" },
              { id: "biology", label: "Biology" },
              { id: "computer science", label: "Computer Science" },
              { id: "general science", label: "General Science" },
              { id: "english", label: "English" },
              { id: "urdu", label: "Urdu" },
              { id: "general study", label: "Social Studies & Heritage" },
            ].map((subj) => {
              const isActive = selectedSubject.toLowerCase() === subj.id.toLowerCase();
              return (
                <button
                  key={subj.id}
                  onClick={() => {
                    setSelectedSubject(subj.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {subj.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Category and Saved Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">Format:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="all">All Formats & Dimensions</option>
              <option value="Complete Study Guide">Complete Master Guides</option>
              <option value="Formula & Cheatsheet">Formula Sheets & Cheatsheets</option>
              <option value="Exam Prep & Solutions">Solved Numericals & Past Papers</option>
              <option value="Quick Revision Summary">1-Page Exam Summaries</option>
            </select>

            <button
              onClick={() => setShowDownloadedOnly(!showDownloadedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                showDownloadedOnly
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved on Device ({downloadedIds.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllFiltered}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Download all notes on current page to local device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Current Page ({displayedPDFs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📊 SEARCH RESULTS STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 dark:text-slate-100">
            {searchEngineResult.totalResults.toLocaleString()} Notes Found
          </span>
          <span>•</span>
          <span>{searchEngineResult.activeGrade}</span>
          <span>•</span>
          <span>{searchEngineResult.activeSubject}</span>
          <span>•</span>
          <span className="text-cyan-500 font-mono text-[11px]">Indexed in {searchEngineResult.timeTakenMs}ms</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span>
            Showing {(currentPage - 1) * 24 + 1}–{Math.min(currentPage * 24, searchEngineResult.totalResults)} of{" "}
            {searchEngineResult.totalResults.toLocaleString()} notes
          </span>
        </div>
      </div>

      {/* PDF Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedPDFs.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <FileDown className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching study notes found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, or select "All Platforms" / "All Classes" to broaden results.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSubject("all");
                setSelectedGrade("all");
                setSelectedCategory("all");
                setSelectedPlatform("all");
                setShowDownloadedOnly(false);
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
            >
              Reset Search Engine Filters
            </button>
          </div>
        ) : (
          displayedPDFs.map((pdf) => {
            const isDownloaded = downloadedIds.includes(pdf.id);
            const isDownloading = downloadingId === pdf.id;
            const { icon: SubjIcon, badgeClass, iconColor } = getSubjectBadge(pdf.subject);

            // Determine platform badge
            const platformTag = NOTE_PLATFORMS.find((p) => pdf.tags.includes(p.id) || pdf.id.includes(p.id));

            return (
              <div
                key={pdf.id}
                id={`pdf-card-${pdf.id}`}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-700 transition-all shadow-xs hover:shadow-md group relative"
              >
                <div className="space-y-3">
                  {/* Card Top Meta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badgeClass}`}
                      >
                        <SubjIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                        {pdf.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {pdf.grade}
                      </span>
                      {platformTag && (
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${platformTag.badgeColor}`}>
                          {platformTag.shortName}
                        </span>
                      )}
                    </div>

                    {isDownloaded ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Check className="w-3 h-3" /> Saved Local
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        ~{pdf.fileSizeKb} KB
                      </span>
                    )}
                  </div>

                  {/* Title & Description with Math Formula Rendering */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <FormattedMathText text={pdf.title} />
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      <FormattedMathText text={pdf.description} />
                    </div>
                  </div>

                  {/* Section Headings Preview */}
                  <div className="space-y-1 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Included Syllabus Modules:
                    </p>
                    <div className="space-y-1">
                      {pdf.sections.slice(0, 2).map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="truncate">
                            <FormattedMathText text={sec.heading} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Bottom / Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" /> {pdf.pageCount} Pages • Formatted
                    </span>
                    <span>{pdf.downloadCount.toLocaleString()} downloads</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Preview Button */}
                    <button
                      id={`preview-btn-${pdf.id}`}
                      onClick={() => setPreviewDoc(pdf)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" /> Preview
                    </button>

                    {/* Direct Download Button */}
                    <button
                      id={`download-btn-${pdf.id}`}
                      onClick={() => handleDownload(pdf)}
                      disabled={isDownloading}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-75 cursor-pointer"
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 📄 INTERACTIVE PAGINATION BAR */}
      {searchEngineResult.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Page <span className="font-extrabold text-slate-900 dark:text-white">{currentPage}</span> of{" "}
            <span className="font-extrabold text-slate-900 dark:text-white">{searchEngineResult.totalPages}</span> (
            {searchEngineResult.totalResults.toLocaleString()} notes in current filter)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            {/* Current Page Window */}
            {[
              currentPage - 2,
              currentPage - 1,
              currentPage,
              currentPage + 1,
              currentPage + 2,
            ]
              .filter((p) => p >= 1 && p <= searchEngineResult.totalPages)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 400, behavior: "smooth" });
                  }}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    currentPage === p
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(searchEngineResult.totalPages, p + 1));
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={currentPage >= searchEngineResult.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              Next →
            </button>
            <button
              onClick={() => {
                setCurrentPage(searchEngineResult.totalPages);
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={currentPage >= searchEngineResult.totalPages}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Full Document Interactive Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header & Textbook Controls Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                      {previewDoc.subject}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {previewDoc.grade}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {previewDoc.title}
                  </h3>
                </div>
              </div>

              {/* Reader Controls & Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {/* Book Edition / Standard Toggle */}
                <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setReadingMode("textbook")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      readingMode === "textbook"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                    title="Read formatted like an authentic textbook book page"
                  >
                    📖 Book Edition
                  </button>
                  <button
                    onClick={() => setReadingMode("standard")}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      readingMode === "standard"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                    title="Clean standard digital mode"
                  >
                    📱 Digital
                  </button>
                </div>

                {/* Font Scaling Controls */}
                <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-[10px] font-black">
                  <button
                    onClick={() => setFontSizeScale("normal")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      fontSizeScale === "normal"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                    title="Normal font size"
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSizeScale("large")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      fontSizeScale === "large"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                    title="Large font size"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSizeScale("xlarge")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      fontSizeScale === "xlarge"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-500"
                    }`}
                    title="Extra large font size"
                  >
                    A++
                  </button>
                </div>

                {/* Download PDF Action */}
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Print this preview"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Jump Chapter Section Navigation Bar */}
            <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-[11px] font-bold scrollbar-none">
              <span className="text-slate-400 shrink-0 uppercase tracking-wider text-[10px]">
                Contents:
              </span>
              {previewDoc.sections.map((sec, sIdx) => {
                const shortLabel = sec.heading.includes("Conceptual")
                  ? "§1 Theory"
                  : sec.heading.includes("Mathematical") || sec.heading.includes("Formulations")
                  ? "§2 Formulas"
                  : sec.heading.includes("Solved") || sec.heading.includes("Numerical")
                  ? "§3 Solved Problems"
                  : sec.heading.includes("Definitions") || sec.heading.includes("Glossary")
                  ? "§4 Definitions"
                  : sec.heading.includes("Exam") || sec.heading.includes("Strategy")
                  ? "§5 Exam Tips"
                  : `§${sIdx + 1} Section`;

                return (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setActiveSectionIdx(sIdx);
                      const el = document.getElementById(`book-sec-${sIdx}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className={`px-3 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                      activeSectionIdx === sIdx
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  const el = document.getElementById("interactive-self-check-quiz");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="px-3 py-1 rounded-lg shrink-0 transition-all cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-xs hover:opacity-90"
              >
                ⚡ Self-Check Quiz
              </button>
            </div>

            {/* Modal Body: Book Edition vs Standard Preview */}
            <div
              className={`p-6 sm:p-8 overflow-y-auto space-y-6 ${
                readingMode === "textbook"
                  ? "bg-[#faf8f4] dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              }`}
            >
              {/* Textbook Chapter Title Header Banner */}
              <div
                className={`p-6 rounded-3xl border ${
                  readingMode === "textbook"
                    ? "bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950 border-amber-200/80 dark:border-indigo-900/60 shadow-inner"
                    : "bg-indigo-950 text-white border-indigo-900"
                } space-y-3`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase">
                  <span
                    className={
                      readingMode === "textbook"
                        ? "text-amber-800 dark:text-amber-400 font-bold"
                        : "text-indigo-400"
                    }
                  >
                    📚 Curriculum Textbook Master Series • Board Approved Edition
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                    {previewDoc.category}
                  </span>
                </div>

                <h2
                  className={`text-xl sm:text-2xl font-black ${
                    readingMode === "textbook" ? "font-serif text-slate-900 dark:text-white" : "text-white"
                  }`}
                >
                  {previewDoc.title}
                </h2>

                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    readingMode === "textbook"
                      ? "text-slate-700 dark:text-slate-300 italic"
                      : "text-slate-300"
                  }`}
                >
                  {previewDoc.description}
                </p>

                <div
                  className={`pt-3 flex flex-wrap items-center gap-3 text-xs font-semibold border-t ${
                    readingMode === "textbook"
                      ? "border-amber-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      : "border-indigo-900/80 text-indigo-300"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Subject: {previewDoc.subject}
                  </span>
                  <span>•</span>
                  <span>Grade / Level: {previewDoc.grade}</span>
                  <span>•</span>
                  <span>Pages: {previewDoc.pageCount} A4 Sheets</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✓ Verified KaTeX Formulas & Numericals
                  </span>
                </div>
              </div>

              {/* Sections Display (Formed like a published book chapter) */}
              <div
                className={`space-y-8 ${
                  fontSizeScale === "large"
                    ? "text-sm sm:text-base"
                    : fontSizeScale === "xlarge"
                    ? "text-base sm:text-lg"
                    : "text-xs sm:text-sm"
                }`}
              >
                {previewDoc.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    id={`book-sec-${idx}`}
                    className="space-y-4 pt-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-6 scroll-mt-6"
                  >
                    {/* Section Number & Textbook Heading */}
                    <div className="flex items-start justify-between gap-3 pb-2 border-b border-indigo-200/50 dark:border-indigo-900/40">
                      <div>
                        <h4
                          className={`font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 ${
                            readingMode === "textbook"
                              ? "font-serif text-base sm:text-lg text-indigo-950 dark:text-indigo-200"
                              : "text-sm sm:text-base text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs flex items-center justify-center font-black shrink-0 shadow-xs">
                            §{idx + 1}
                          </span>
                          <FormattedMathText text={sec.heading} />
                        </h4>
                        {sec.subheading && (
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 ml-8.5 mt-0.5">
                            <FormattedMathText text={sec.subheading} />
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 uppercase tracking-widest hidden sm:inline">
                        Part {idx + 1} of 5
                      </span>
                    </div>

                    {/* Section Paragraphs */}
                    <div className="space-y-3 ml-2 sm:ml-8.5 leading-relaxed text-slate-800 dark:text-slate-200">
                      {sec.content.map((para, pIdx) => renderTextbookContentItem(para, pIdx, sec.heading))}
                    </div>

                    {/* Textbook Featured Callout Cards */}
                    {sec.callouts && sec.callouts.length > 0 && (
                      <div className="ml-2 sm:ml-8.5 space-y-3 pt-2">
                        {sec.callouts.map((callout, cIdx) => (
                          <div
                            key={cIdx}
                            className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm shadow-sm ${
                              callout.type === "formula"
                                ? "bg-teal-50/90 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700/80 text-teal-950 dark:text-teal-100"
                                : callout.type === "exam_tip"
                                ? "bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100"
                                : callout.type === "practice_question"
                                ? "bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/80 text-rose-950 dark:text-rose-100"
                                : "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 text-indigo-950 dark:text-indigo-100"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-black/10 dark:border-white/10">
                              <p className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {callout.type === "formula"
                                  ? "📐 Governing Formula & Equation Formulation"
                                  : callout.type === "exam_tip"
                                  ? "💡 Examiner Distinction Tip & Common Pitfalls"
                                  : callout.type === "practice_question"
                                  ? "📝 Worked Model Examination Problem"
                                  : "📖 Key Syllabus Definition & Terminology"}
                                : {callout.title}
                              </p>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 shrink-0">
                                Box {idx + 1}.{cIdx + 1}
                              </span>
                            </div>

                            <div className="leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm">
                              <FormattedMathText text={callout.text} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Interactive Student Self-Check Comprehension Review */}
                <div id="interactive-self-check-quiz" className="mt-10 p-6 sm:p-7 rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-sky-950/30 shadow-md space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100 dark:border-indigo-900/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                          Self-Check Chapter Comprehension Quiz
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold">
                            Interactive
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Test your mastery of this chapter's concepts, KaTeX formulas, and board exam strategies!
                        </p>
                      </div>
                    </div>
                    {Object.keys(reviewAnswers).length > 0 && (
                      <button
                        onClick={() => setReviewAnswers({})}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-all shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Quiz
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    {getNoteReviewQuestions(previewDoc).map((q, qIdx) => {
                      const selected = reviewAnswers[qIdx];
                      const isAnswered = selected !== undefined;
                      const isCorrect = isAnswered && selected === q.correctIndex;

                      return (
                        <div
                          key={qIdx}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/70 shadow-xs space-y-3.5"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              Q{qIdx + 1}
                            </span>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                              <FormattedMathText text={q.question} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-0 sm:ml-8.5">
                            {q.options.map((opt, optIdx) => {
                              const isThisSelected = selected === optIdx;
                              const isThisCorrect = optIdx === q.correctIndex;

                              let btnStyle = "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400";
                              if (isAnswered) {
                                if (isThisCorrect) {
                                  btnStyle = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20";
                                } else if (isThisSelected) {
                                  btnStyle = "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 font-semibold";
                                } else {
                                  btnStyle = "border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={isAnswered}
                                  onClick={() => setReviewAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${btnStyle}`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-black/5 dark:bg-white/10 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <FormattedMathText text={opt} />
                                  </span>
                                  {isAnswered && isThisCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div
                              className={`p-3 rounded-xl text-xs ml-0 sm:ml-8.5 leading-relaxed flex items-start gap-2.5 ${
                                isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60"
                                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60"
                              }`}
                            >
                              <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${isCorrect ? "text-emerald-600" : "text-amber-600"}`} />
                              <div>
                                <span className="font-black mr-1">
                                  {isCorrect ? "Correct! Excellent comprehension." : "Explanation & Board Answer Key:"}
                                </span>
                                <FormattedMathText text={q.explanation} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Formatted strictly according to standard published textbook format with verified KaTeX formulas.
              </span>
              <button
                onClick={() => handleDownload(previewDoc)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Complete Textbook PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Custom Student PDF Creator */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Create Custom Study PDF
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Draft, summarize, or AI-generate any subject notes and download as a formatted PDF.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBuilderOpen(false)}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPDF} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Chapter 7 Photosynthesis & Light Reactions Summary"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value as StudentSubject)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Biology">Biology</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="English">English</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General Study">General Study</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Grade
                  </label>
                  <select
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value as StudentGrade)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  >
                    <option value="11th Class">11th Class</option>
                    <option value="12th Class">12th Class</option>
                    <option value="General / College">College / Prep</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as StudentPDFCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Complete Study Guide">Complete Study Guide</option>
                    <option value="Formula & Cheatsheet">Formula Cheatsheet</option>
                    <option value="Quick Revision Summary">Quick Revision</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Name (Optional - Printed on PDF Header)
                  </label>
                  <input
                    type="text"
                    value={customStudentName}
                    onChange={(e) => setCustomStudentName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Short Description / Objective
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="e.g. High-yield formulas and concepts for Friday exam"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes Input & AI Generator Action */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Content Notes / Outline
                  </label>
                  <button
                    type="button"
                    onClick={handleAIGenerateNotes}
                    disabled={isGeneratingAI || !customTitle.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {isGeneratingAI ? "AI Generating..." : "AI Auto-Generate Notes"}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder={`Type or paste your study notes, or use 'AI Auto-Generate Notes' above!\n\nTip: Use headings like:\n# Key Formulas:\n• Formula 1...\n• Formula 2...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  <Download className="w-4 h-4" />
                  Generate & Download PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
