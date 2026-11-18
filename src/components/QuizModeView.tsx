import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Layers,
  Flame,
  Timer,
  Play,
  Pause,
  Shuffle,
  ChevronRight,
  Upload,
  Plus,
  Compass,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { QuizQuestion, QuizResult, Flashcard } from "../types";
import { speakWithVoice, stopSpeaking } from "../utils/voiceEngine";

// Default Preset Flashcards for quick study
const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    front: "What is the primary function of Mitochondria in cells?",
    back: "Generates cellular energy in the form of ATP through aerobic cellular respiration.",
    subject: "Biology",
    mastered: false,
  },
  {
    id: "fc-2",
    front: "What does the Second Law of Thermodynamics state?",
    back: "Total entropy of an isolated system always increases over time in spontaneous processes.",
    subject: "Physics",
    mastered: false,
  },
  {
    id: "fc-3",
    front: "What is the Big-O time complexity of Binary Search on a sorted array?",
    back: "O(log n) logarithmic time complexity.",
    subject: "Computer Science",
    mastered: true,
  },
  {
    id: "fc-4",
    front: "What is Euler's Identity formula?",
    back: "e^(iπ) + 1 = 0, connecting five fundamental mathematical constants.",
    subject: "Mathematics",
    mastered: false,
  },
  {
    id: "fc-5",
    front: "What triggered the start of the Industrial Revolution in the 18th century?",
    back: "The invention and commercial application of James Watt's improved steam engine in Britain.",
    subject: "History",
    mastered: false,
  },
];

export const QuizModeView: React.FC = () => {
  const { language, selectedVoicePersona, customVoiceURI } = useApp();

  // Active study tab: "quiz" | "flashcards" | "timer"
  const [studyTab, setStudyTab] = useState<"quiz" | "flashcards" | "timer">("quiz");

  // Quiz Generation State
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customNotes, setCustomNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const autoAdvanceTimerRef = useRef<any>(null);

  // Flashcard State
  const [flashcards, setFlashcards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newSubject, setNewSubject] = useState("General");
  const [showAddCard, setShowAddCard] = useState(false);

  // Pomodoro Study Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // 25 min default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [completedSessions, setCompletedSessions] = useState(0);
  const timerIntervalRef = useRef<any>(null);

  // Preset Topics
  const PRESET_TOPICS = [
    { title: "Biology & Human Anatomy", icon: "🧬", prompt: "Human anatomy and cellular biology" },
    { title: "Physics & Thermodynamics", icon: "⚡", prompt: "Classical mechanics and thermodynamics" },
    { title: "World History & Revolutions", icon: "🏛️", prompt: "World history milestones and revolutions" },
    { title: "Data Structures & Algorithms", icon: "💻", prompt: "Computer science data structures and sorting" },
    { title: "Organic Chemistry", icon: "🧪", prompt: "Organic chemistry functional groups and reactions" },
    { title: "Calculus & Derivatives", icon: "📐", prompt: "Differential and integral calculus" },
  ];

  // Handle Pomodoro countdown
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  useEffect(() => {
    if (isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(false);
      if (timerMode === "focus") {
        setCompletedSessions((s) => s + 1);
        speakWithVoice(
          "Great work! Your study session is complete. Time for a restful break.",
          selectedVoicePersona,
          customVoiceURI,
          1.0,
          1.0,
          language
        );
      } else {
        speakWithVoice(
          "Break time is over. Ready to focus again?",
          selectedVoicePersona,
          customVoiceURI,
          1.0,
          1.0,
          language
        );
      }
    }
  }, [isTimerRunning, timerSeconds, timerMode, language, selectedVoicePersona, customVoiceURI]);

  // Clean up audio speech and auto-advance timer when leaving view
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const handleStartTimerMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    if (mode === "focus") setTimerSeconds(25 * 60);
    else if (mode === "shortBreak") setTimerSeconds(5 * 60);
    else setTimerSeconds(15 * 60);
  };

  // Generate Quiz from Backend
  const handleGenerateQuiz = async (selectedTopic?: string) => {
    const quizTopic = selectedTopic || topic.trim();
    if (!quizTopic && !customNotes.trim()) {
      setErrorMsg("Please enter a study topic or paste some study notes.");
      return;
    }

    setTopic(quizTopic);
    setErrorMsg(null);
    setIsGenerating(true);
    setQuizFinished(false);
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setUserAnswers({});

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty,
          count: questionCount,
          language,
          customNotes: customNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const normalized = data.questions.map((q: any, i: number) => {
          const cIdx = typeof q.correctIndex === "number" ? q.correctIndex : typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0;
          return {
            id: q.id || `q-${i + 1}`,
            question: q.question,
            options: q.options && q.options.length ? q.options : ["True", "False"],
            correctIndex: cIdx,
            correctAnswerIndex: cIdx,
            explanation: q.explanation || "No explanation provided.",
            topic: q.topic || quizTopic,
            difficulty: q.difficulty || difficulty,
          };
        });
        setQuestions(normalized);
      } else {
        throw new Error("No questions returned from quiz generator.");
      }
    } catch {
      // High-yield topic-isolated local fallback questions (never mixing subjects)
      const cleanT = (quizTopic || "Science").trim();
      const lower = cleanT.toLowerCase();

      let topicTemplates: Array<{
        question: string;
        options: string[];
        correctAnswerIndex: number;
        explanation: string;
        difficulty: "easy" | "medium" | "hard";
      }> = [];

      // 1. PHOTOSYNTHESIS (STRICTLY PHOTOSYNTHESIS ONLY)
      if (
        lower.includes("photosynthesis") ||
        lower.includes("calvin cycle") ||
        lower.includes("thylakoid") ||
        lower.includes("chloroplast")
      ) {
        topicTemplates = [
          {
            question: `In photosynthesis, which specialized organelle and cellular sub-compartment contains the light-absorbing chlorophyll pigments?`,
            options: ["Thylakoid membranes within chloroplasts", "Cristae of mitochondria", "Lumen of rough endoplasmic reticulum", "Matrix of peroxisomes"],
            correctAnswerIndex: 0,
            explanation: "Chlorophyll pigments are embedded within the thylakoid membrane bilayers inside plant chloroplasts.",
            difficulty: "easy",
          },
          {
            question: `What primary event occurs during the light-dependent reactions of photosynthesis when sunlight strikes Photosystem II?`,
            options: [
              "Photolysis of water molecules (H2O), releasing oxygen gas, protons, and high-energy electrons",
              "Direct synthesis of polysaccharide cellulose walls",
              "Breakdown of glucose into pyruvate via anaerobic fermentation",
              "Fixation of nitrogen gas into nitrate ions",
            ],
            correctAnswerIndex: 0,
            explanation: "Photosystem II catalyzes the light-driven photolysis of water (2H2O -> 4H+ + 4e- + O2), releasing molecular oxygen as a byproduct.",
            difficulty: "medium",
          },
          {
            question: `Which key enzyme catalyzes carbon fixation in the stroma during the Calvin cycle of photosynthesis?`,
            options: ["RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)", "DNA Polymerase III", "ATP Synthase Subunit 1", "Peptidyl Transferase"],
            correctAnswerIndex: 0,
            explanation: "RuBisCO catalyzes the primary carbon-fixing reaction, combining atmospheric CO2 with ribulose-1,5-bisphosphate (RuBP).",
            difficulty: "medium",
          },
          {
            question: `What are the two high-energy chemical products generated by light-dependent reactions that power the Calvin cycle?`,
            options: ["ATP and NADPH", "ADP and NAD+", "Glucose and Pyruvate", "FADH2 and Lactic acid"],
            correctAnswerIndex: 0,
            explanation: "Light reactions produce ATP (via photophosphorylation) and NADPH (via NADP+ reductase), which fuel the Calvin cycle.",
            difficulty: "easy",
          },
          {
            question: `What is the net balanced overall chemical equation representing oxygenic photosynthesis?`,
            options: [
              "6 CO2 + 6 H2O + Light Energy -> C6H12O6 + 6 O2",
              "C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ATP",
              "6 CO2 + 12 H2O -> 2 C2H5OH + 6 O2",
              "CH4 + 2 O2 -> CO2 + 2 H2O + Heat",
            ],
            correctAnswerIndex: 0,
            explanation: "Photosynthesis converts six molecules of carbon dioxide and six molecules of water in the presence of solar energy into one glucose and six oxygen molecules.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("respiration") ||
        (lower.includes("atp") && !lower.includes("photosynthesis")) ||
        lower.includes("glycolysis") ||
        lower.includes("krebs")
      ) {
        // 2. CELLULAR RESPIRATION (STRICTLY RESPIRATION & ATP)
        topicTemplates = [
          {
            question: `Where does the initial phase of cellular respiration (glycolysis) take place within the cell?`,
            options: ["Cytoplasm / Cytosol", "Mitochondrial Matrix", "Inner Mitochondrial Membrane", "Nucleolus"],
            correctAnswerIndex: 0,
            explanation: "Glycolysis occurs anaerobically in the cytoplasm, breaking down one molecule of glucose into two molecules of pyruvate.",
            difficulty: "easy",
          },
          {
            question: `What is the net yield of ATP molecules produced directly from one glucose molecule during glycolysis alone?`,
            options: ["2 ATP (Net)", "4 ATP (Net)", "32 ATP (Net)", "0 ATP"],
            correctAnswerIndex: 0,
            explanation: "Glycolysis consumes 2 ATP during phosphorylation and produces 4 ATP, resulting in a net yield of 2 ATP per glucose.",
            difficulty: "easy",
          },
          {
            question: `In which mitochondrial sub-region does the Krebs (Citric Acid) Cycle take place?`,
            options: ["Mitochondrial Matrix", "Outer membrane intermembrane space", "Thylakoid lumen", "Endoplasmic cisternae"],
            correctAnswerIndex: 0,
            explanation: "The citric acid cycle enzymes are solubilized within the fluid mitochondrial matrix.",
            difficulty: "medium",
          },
          {
            question: `Which enzyme embedded in the inner mitochondrial membrane synthesizes ATP driven by the proton (H+) electrochemical gradient?`,
            options: ["ATP Synthase", "RNA Polymerase", "Amylase", "Hexokinase"],
            correctAnswerIndex: 0,
            explanation: "ATP Synthase utilizes the proton motive force across the inner mitochondrial membrane via chemiosmosis to phosphorylate ADP into ATP.",
            difficulty: "medium",
          },
          {
            question: `What is the terminal electron acceptor in the aerobic electron transport chain of cellular respiration?`,
            options: ["Molecular Oxygen (O2), which forms H2O", "Carbon dioxide (CO2)", "Lactic acid", "Inorganic Phosphate"],
            correctAnswerIndex: 0,
            explanation: "Oxygen acts as the final electron acceptor, combining with electrons and protons to form metabolic water.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("mitosis") ||
        lower.includes("cell division") ||
        lower.includes("cell cycle") ||
        lower.includes("meiosis")
      ) {
        // 3. MITOSIS & CELL DIVISION
        topicTemplates = [
          {
            question: `What is the correct sequential order of the four primary phases of mitosis?`,
            options: [
              "Prophase, Metaphase, Anaphase, Telophase (PMAT)",
              "Anaphase, Prophase, Metaphase, Telophase",
              "Telophase, Metaphase, Anaphase, Prophase",
              "Interphase, Prophase, Cytokinesis, Telophase",
            ],
            correctAnswerIndex: 0,
            explanation: "Mitosis progresses through Prophase (chromatin condenses), Metaphase (aligns), Anaphase (separates), and Telophase (re-forms nuclei).",
            difficulty: "easy",
          },
          {
            question: `During which mitotic phase do sister chromatids align along the equatorial plane of the spindle apparatus?`,
            options: ["Metaphase", "Prophase", "Anaphase", "Telophase"],
            correctAnswerIndex: 0,
            explanation: "In metaphase, chromosomes align precisely along the metaphase plate perpendicular to the spindle poles.",
            difficulty: "easy",
          },
          {
            question: `What structural protein complex on the centromere attaches chromosomes to the mitotic spindle microtubules?`,
            options: ["Kinetochore", "Centriole", "Telomere", "Histone octamer"],
            correctAnswerIndex: 0,
            explanation: "The kinetochore is the disc-shaped protein structure on the centromere where spindle microtubules attach during cell division.",
            difficulty: "medium",
          },
          {
            question: `At which phase of mitosis do sister chromatids physically separate and migrate toward opposite cell poles?`,
            options: ["Anaphase", "Telophase", "Metaphase", "Interphase"],
            correctAnswerIndex: 0,
            explanation: "During anaphase, cohesin proteins cleave and spindle fibers pull sister chromatids to opposite poles.",
            difficulty: "easy",
          },
          {
            question: `What is the final biological outcome of a complete mitotic cell cycle?`,
            options: [
              "Two genetically identical diploid daughter cells",
              "Four genetically distinct haploid gametes",
              "A single multinucleated syncytium",
              "Two polyploid daughter cells with halved chromosome counts",
            ],
            correctAnswerIndex: 0,
            explanation: "Mitosis produces two daughter cells with identical chromosome complements and genetic identity as the parent cell.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("dna") ||
        lower.includes("gene") ||
        lower.includes("replication") ||
        lower.includes("helicase") ||
        lower.includes("genetics")
      ) {
        // 4. DNA & GENETICS
        topicTemplates = [
          {
            question: `Which enzyme unzips the DNA double helix at the replication fork by breaking hydrogen bonds between base pairs?`,
            options: ["DNA Helicase", "DNA Ligase", "RNA Primase", "Topoisomerase II"],
            correctAnswerIndex: 0,
            explanation: "DNA Helicase unwinds the double helix by breaking hydrogen bonds between complementary base pairs.",
            difficulty: "easy",
          },
          {
            question: `According to Chargaff's rules of DNA base pairing, adenine (A) pairs with which nitrogenous base, and via how many hydrogen bonds?`,
            options: [
              "Thymine (T) via 2 hydrogen bonds",
              "Cytosine (C) via 3 hydrogen bonds",
              "Guanine (G) via 2 hydrogen bonds",
              "Uracil (U) via 3 hydrogen bonds",
            ],
            correctAnswerIndex: 0,
            explanation: "In double-stranded DNA, Adenine forms two hydrogen bonds with Thymine (A=T).",
            difficulty: "easy",
          },
          {
            question: `Which primary enzyme synthesizes the new complementary DNA strand in the 5' to 3' direction during replication?`,
            options: ["DNA Polymerase III", "RNA Polymerase II", "Reverse Transcriptase", "Restriction Endonuclease"],
            correctAnswerIndex: 0,
            explanation: "DNA Polymerase adds complementary deoxyribonucleotides to the 3'-OH end of the growing strand.",
            difficulty: "medium",
          },
          {
            question: `What is the biological process of synthesizing messenger RNA (mRNA) from a DNA template strand called?`,
            options: ["Transcription", "Translation", "Transduction", "Transformation"],
            correctAnswerIndex: 0,
            explanation: "Transcription is the synthesis of an RNA molecule from a DNA template catalyzed by RNA Polymerase.",
            difficulty: "easy",
          },
          {
            question: `Why is DNA replication described as semi-conservative?`,
            options: [
              "Each newly synthesized DNA molecule contains one original parental strand and one newly formed strand",
              "Both original strands are preserved together in one daughter molecule while the other is completely new",
              "The DNA molecule is cleaved randomly and reconstituted using RNA fragments",
              "Only half of the genetic code is copied in each round of division",
            ],
            correctAnswerIndex: 0,
            explanation: "Meselson and Stahl demonstrated that each new DNA duplex conserves one parent template strand and one newly synthesized strand.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("bio") ||
        lower.includes("cell") ||
        lower.includes("enzyme") ||
        lower.includes("heart") ||
        lower.includes("organ")
      ) {
        // 5. GENERAL BIOLOGY & CELL PHYSIOLOGY
        topicTemplates = [
          {
            question: `In cell biology for ${cleanT}, which cellular organelle contains digestive hydrolytic enzymes for intracellular recycling?`,
            options: ["Lysosome", "Centrosome", "Peroxisome", "Vacuole"],
            correctAnswerIndex: 0,
            explanation: "Lysosomes contain acidic hydrolytic enzymes that break down cellular waste and foreign matter.",
            difficulty: "easy",
          },
          {
            question: `What is the primary function of the phospholipid bilayer plasma membrane in ${cleanT}?`,
            options: ["Selective permeability regulating transport", "Impermeable solid shield", "Direct synthesis of genomic DNA", "Rigid wooden support"],
            correctAnswerIndex: 0,
            explanation: "The plasma membrane is selectively permeable, regulating molecular entry and exit.",
            difficulty: "easy",
          },
          {
            question: `Which biological catalyst accelerates biochemical reaction rates by lowering activation energy in ${cleanT}?`,
            options: ["Enzymes", "Steroids", "Triglycerides", "Polysaccharides"],
            correctAnswerIndex: 0,
            explanation: "Enzymes are specialized protein catalysts that decrease activation energy.",
            difficulty: "easy",
          },
          {
            question: `What transport mechanism moves solute molecules against their concentration gradient using ATP energy in ${cleanT}?`,
            options: ["Active Transport", "Simple Diffusion", "Osmosis", "Facilitated Passive Transport"],
            correctAnswerIndex: 0,
            explanation: "Active transport pumps solutes against their electrochemical gradient using metabolic energy (ATP).",
            difficulty: "medium",
          },
          {
            question: `In human physiology, which chamber of the heart pumps oxygenated blood directly into the systemic circulation via the aorta?`,
            options: ["Left Ventricle", "Right Ventricle", "Right Atrium", "Left Atrium"],
            correctAnswerIndex: 0,
            explanation: "The thick muscular left ventricle ejects oxygen-rich blood into the aorta for distribution across systemic tissues.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("newton") ||
        lower.includes("motion") ||
        lower.includes("kinematics") ||
        lower.includes("force") ||
        lower.includes("gravity") ||
        lower.includes("mechanics")
      ) {
        // 6. NEWTON'S LAWS & CLASSICAL MECHANICS
        topicTemplates = [
          {
            question: `In classical mechanics for ${cleanT}, what does Newton's First Law of Motion establish?`,
            options: [
              "An object remains at rest or in uniform straight-line motion unless acted upon by a net external force",
              "Force equals mass times acceleration",
              "For every action, there is an equal and opposite reaction",
              "Total mechanical energy is inversely proportional to velocity",
            ],
            correctAnswerIndex: 0,
            explanation: "Newton's First Law describes inertia: a body maintains its state of rest or constant velocity unless an unbalanced net force intervenes.",
            difficulty: "easy",
          },
          {
            question: `What is the fundamental mathematical expression for Newton's Second Law of Motion?`,
            options: ["F_net = m · a", "E = m · c²", "p = m / v", "W = F / d"],
            correctAnswerIndex: 0,
            explanation: "Newton's Second Law establishes that net force equals mass multiplied by acceleration (F = ma).",
            difficulty: "easy",
          },
          {
            question: `According to Newton's Third Law, if object A exerts a force on object B, what force does object B exert on object A?`,
            options: [
              "An equal magnitude force in the opposite direction acting simultaneously",
              "A lesser force proportional to the ratio of their masses",
              "A force perpendicular to the line connecting their centers of mass",
              "Zero force if object B has greater mass than object A",
            ],
            correctAnswerIndex: 0,
            explanation: "Action and reaction forces are strictly equal in magnitude and opposite in direction, acting on different bodies.",
            difficulty: "easy",
          },
          {
            question: `According to the Work-Energy Theorem in ${cleanT}, how is net work related to kinetic energy?`,
            options: [
              "Net work done equals the change in kinetic energy (W_net = ΔKE)",
              "Work is completely independent of kinetic energy",
              "Work always decreases potential energy to zero",
              "Work equals instantaneous acceleration divided by mass",
            ],
            correctAnswerIndex: 0,
            explanation: "The net work done by all forces on an object equals the change in kinetic energy (W_net = ΔKE).",
            difficulty: "medium",
          },
          {
            question: `Which fundamental physical law guarantees that the total momentum of an isolated system remains strictly constant?`,
            options: [
              "Law of Conservation of Linear Momentum",
              "Hooke's Law of Elastic Deformations",
              "Archimedes' Buoyancy Principle",
              "Bernoulli's Fluid Dynamics Theorem",
            ],
            correctAnswerIndex: 0,
            explanation: "In any closed isolated system where net external force is zero, total linear momentum is strictly conserved.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("optic") ||
        lower.includes("light") ||
        lower.includes("wave") ||
        lower.includes("electr") ||
        lower.includes("circuit") ||
        lower.includes("physic")
      ) {
        // 7. GENERAL PHYSICS / OPTICS / ELECTROMAGNETISM
        topicTemplates = [
          {
            question: `According to Snell's Law in optics for ${cleanT}, how are the angles of incidence and refraction related to refractive indices?`,
            options: ["n1 · sin(θ1) = n2 · sin(θ2)", "n1 · cos(θ1) = n2 · cos(θ2)", "n1 / n2 = θ1 / θ2", "n1 + n2 = sin(θ1 + θ2)"],
            correctAnswerIndex: 0,
            explanation: "Snell's Law states that n1 · sin(θ1) = n2 · sin(θ2) across planar optical interfaces.",
            difficulty: "easy",
          },
          {
            question: `What fundamental law in electrical circuits relates voltage (V), current (I), and resistance (R)?`,
            options: ["Ohm's Law: V = I · R", "Coulomb's Law: F = k · q1·q2 / r²", "Faraday's Law: ε = -dΦ/dt", "Ampere's Law: B = μ0·I / 2πr"],
            correctAnswerIndex: 0,
            explanation: "Ohm's Law establishes that potential difference across a conductor is directly proportional to current (V = IR).",
            difficulty: "easy",
          },
          {
            question: `What occurs when light travels from a denser optical medium to a less dense medium at an incident angle greater than the critical angle?`,
            options: ["Total Internal Reflection", "Complete destructive interference", "Polarization by absorption", "Dispersion into a continuous spectrum"],
            correctAnswerIndex: 0,
            explanation: "When the angle of incidence exceeds the critical angle, all light is reflected internally with zero transmission.",
            difficulty: "medium",
          },
          {
            question: `What is the SI unit of electrical resistance in ${cleanT}?`,
            options: ["Ohm (Ω)", "Ampere (A)", "Volt (V)", "Coulomb (C)"],
            correctAnswerIndex: 0,
            explanation: "The Ohm (Ω) is the SI unit of electrical resistance.",
            difficulty: "easy",
          },
          {
            question: `What electromagnetic wave property remains unchanged when light transitions from air into glass?`,
            options: ["Frequency (f)", "Wavelength (λ)", "Wave speed (v)", "Amplitude (A)"],
            correctAnswerIndex: 0,
            explanation: "The frequency of a wave is determined by its source and remains invariant upon entering another medium.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("bond") ||
        lower.includes("covalent") ||
        lower.includes("ionic") ||
        lower.includes("lewis") ||
        lower.includes("valence")
      ) {
        // 8. CHEMICAL BONDING
        topicTemplates = [
          {
            question: `In chemical bonding for ${cleanT}, which bond type is formed by the mutual sharing of valence electron pairs between atoms?`,
            options: ["Covalent Bond", "Ionic Bond", "Metallic Bond", "Hydrogen Bond"],
            correctAnswerIndex: 0,
            explanation: "A covalent bond consists of the mutual sharing of electron pairs between two nonmetal atoms.",
            difficulty: "easy",
          },
          {
            question: `What type of bond forms when one atom completely transfers one or more electrons to another atom with differing electronegativity?`,
            options: ["Ionic Bond", "Nonpolar Covalent Bond", "Pi-coordinate Bond", "London Dispersion Bond"],
            correctAnswerIndex: 0,
            explanation: "Ionic bonds result from electrostatic attraction between oppositely charged cations and anions following electron transfer.",
            difficulty: "easy",
          },
          {
            question: `According to the Octet Rule in ${cleanT}, main-group atoms attain stable configurations by acquiring how many valence electrons?`,
            options: ["8 valence electrons", "2 valence electrons", "18 valence electrons", "10 valence electrons"],
            correctAnswerIndex: 0,
            explanation: "The octet rule reflects noble gas electron configurations with 8 valence electrons (ns² np⁶).",
            difficulty: "easy",
          },
          {
            question: `What molecular geometry is predicted by VSEPR theory for methane (CH4) with four single bonding pairs and zero lone pairs?`,
            options: ["Tetrahedral (109.5°)", "Trigonal Planar (120°)", "Linear (180°)", "Octahedral (90°)"],
            correctAnswerIndex: 0,
            explanation: "Four electron domains minimize repulsion in a symmetric 3D tetrahedral geometry with 109.5° bond angles.",
            difficulty: "medium",
          },
          {
            question: `Which property describes the relative ability of an atom in a molecule to attract bonding electrons toward itself?`,
            options: ["Electronegativity", "Electron Affinity", "Ionization Energy", "Atomic Radius"],
            correctAnswerIndex: 0,
            explanation: "Electronegativity (measured on Pauling scale) gauges an atom's pulling power over shared bonding electrons.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("acid") ||
        lower.includes("base") ||
        lower.includes("ph") ||
        lower.includes("buffer") ||
        lower.includes("titration")
      ) {
        // 9. ACIDS, BASES & pH
        topicTemplates = [
          {
            question: `According to the Brønsted-Lowry definition in ${cleanT}, what is an acid?`,
            options: ["A proton (H+) donor", "A proton (H+) acceptor", "An electron-pair donor", "A hydroxide (OH-) donor"],
            correctAnswerIndex: 0,
            explanation: "In Brønsted-Lowry acid-base theory, an acid donates a hydrogen ion (proton H+) to a conjugate base.",
            difficulty: "easy",
          },
          {
            question: `What pH value represents a neutral aqueous solution at standard 25°C in ${cleanT}?`,
            options: ["pH 7.0", "pH 0.0", "pH 14.0", "pH 1.0"],
            correctAnswerIndex: 0,
            explanation: "At 25°C, autoionization of pure water yields [H+] = 10^-7 M, corresponding to pH 7.0.",
            difficulty: "easy",
          },
          {
            question: `What are the typical products formed when a strong acid reacts completely with a strong Arrhenius base?`,
            options: ["An ionic salt and water (H2O)", "Hydrogen gas and carbon dioxide", "Precipitated pure metals", "Carboxylic acids and ethers"],
            correctAnswerIndex: 0,
            explanation: "Neutralization of an acid with a base produces an ionic salt and neutral water (e.g., HCl + NaOH -> NaCl + H2O).",
            difficulty: "easy",
          },
          {
            question: `If the hydronium ion concentration [H+] of a solution is 1.0 × 10^-3 M, what is its measured pH?`,
            options: ["3.0", "11.0", "-3.0", "7.0"],
            correctAnswerIndex: 0,
            explanation: "pH = -log10[H+] = -log10(10^-3) = 3.0.",
            difficulty: "medium",
          },
          {
            question: `What is the chemical composition of an aqueous buffer solution that resists drastic changes in pH?`,
            options: [
              "A weak acid and its conjugate base (or weak base and conjugate acid)",
              "A stoichiometric mixture of concentrated HCl and NaOH",
              "Pure deionized distilled water with zero solutes",
              "A saturated solution of insoluble calcium carbonate",
            ],
            correctAnswerIndex: 0,
            explanation: "A buffer consists of a weak conjugate acid-base pair that neutralizes small amounts of added acid or base.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("calculus") ||
        lower.includes("derivative") ||
        lower.includes("integral") ||
        lower.includes("limit")
      ) {
        // 10. CALCULUS (STRICTLY CALCULUS ONLY - NO ALGEBRA MIXING)
        topicTemplates = [
          {
            question: `In calculus for ${cleanT}, what is the derivative of f(x) = x^n according to the power rule?`,
            options: ["n · x^(n-1)", "x^(n+1) / (n+1)", "n · x^n", "x^(n-1) / n"],
            correctAnswerIndex: 0,
            explanation: "The power rule for differentiation states that d/dx [x^n] = n · x^(n-1).",
            difficulty: "easy",
          },
          {
            question: `What fundamental geometric concept does the definite integral of f(x) between x=a and x=b represent in ${cleanT}?`,
            options: [
              "The net signed area bounded between the function curve and the x-axis",
              "The instantaneous tangent slope at x = (a+b)/2",
              "The radius of curvature along the osculating circle",
              "The arithmetic average of the boundary points",
            ],
            correctAnswerIndex: 0,
            explanation: "The definite integral computes the accumulated signed area between the curve and the horizontal axis.",
            difficulty: "medium",
          },
          {
            question: `What is the derivative of f(x) = sin(x) with respect to x in ${cleanT}?`,
            options: ["cos(x)", "-cos(x)", "tan(x)", "sec²(x)"],
            correctAnswerIndex: 0,
            explanation: "The derivative of sin(x) is cos(x).",
            difficulty: "easy",
          },
          {
            question: `According to the Chain Rule in calculus, how do you differentiate a composite function y = f(g(x))?`,
            options: ["f'(g(x)) · g'(x)", "f'(x) · g'(x)", "f'(g'(x))", "f'(x) + g'(x)"],
            correctAnswerIndex: 0,
            explanation: "The chain rule states that d/dx [f(g(x))] = f'(g(x)) · g'(x).",
            difficulty: "medium",
          },
          {
            question: `At a critical point x = c of a differentiable function f(x), what condition must hold?`,
            options: ["f'(c) = 0 or f'(c) is undefined", "f(c) = 0", "f''(c) > 0 always", "f'(c) = 1"],
            correctAnswerIndex: 0,
            explanation: "A critical point of a function occurs where its first derivative is zero or does not exist.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("algebra") ||
        lower.includes("quadratic") ||
        lower.includes("polynomial") ||
        lower.includes("equation")
      ) {
        // 11. ALGEBRA & EQUATIONS (STRICTLY ALGEBRA)
        topicTemplates = [
          {
            question: `What is the quadratic formula used to solve any standard quadratic equation ax² + bx + c = 0 in ${cleanT}?`,
            options: [
              "x = (-b ± √(b² - 4ac)) / (2a)",
              "x = (-b ± √(b² + 4ac)) / (2a)",
              "x = (b ± √(b² - 4ac)) / (2a)",
              "x = -b / (2a)",
            ],
            correctAnswerIndex: 0,
            explanation: "The quadratic formula calculates solutions to ax² + bx + c = 0 using x = (-b ± √(b² - 4ac)) / (2a).",
            difficulty: "easy",
          },
          {
            question: `For a quadratic equation ax² + bx + c = 0 in ${cleanT}, what does a positive discriminant (b² - 4ac > 0) signify?`,
            options: [
              "Two distinct real solutions",
              "Exactly one repeated real root",
              "Two complex conjugate imaginary roots",
              "Zero mathematical solutions",
            ],
            correctAnswerIndex: 0,
            explanation: "When the discriminant is strictly positive, the square root yields two distinct real values.",
            difficulty: "easy",
          },
          {
            question: `Which fundamental algebraic property ensures that a + b = b + a and a · b = b · a in ${cleanT}?`,
            options: ["Commutative Property", "Associative Property", "Distributive Property", "Identity Property"],
            correctAnswerIndex: 0,
            explanation: "The commutative property guarantees that changing the order of operands does not change the result.",
            difficulty: "easy",
          },
          {
            question: `What is the slope (m) of the linear equation 3x - 6y = 12 in standard Cartesian coordinate geometry?`,
            options: ["1/2", "2", "-2", "3"],
            correctAnswerIndex: 0,
            explanation: "Rearranging 3x - 6y = 12 into slope-intercept form gives y = (1/2)x - 2, so the slope is 1/2.",
            difficulty: "medium",
          },
          {
            question: `What is the factored algebraic form of the difference of squares: a² - b² in ${cleanT}?`,
            options: ["(a - b)(a + b)", "(a - b)²", "(a + b)²", "a(a - b)"],
            correctAnswerIndex: 0,
            explanation: "The algebraic identity for difference of two squares is a² - b² = (a - b)(a + b).",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("chem") ||
        lower.includes("reaction") ||
        lower.includes("stoichiometry") ||
        lower.includes("periodic") ||
        lower.includes("organic")
      ) {
        // 12. GENERAL CHEMISTRY
        topicTemplates = [
          {
            question: `Which fundamental law in ${cleanT} states that total mass of products equals total mass of reactants?`,
            options: [
              "Law of Conservation of Mass",
              "Law of Definite Proportions",
              "Avogadro's Hypothesis",
              "Dalton's Partial Pressure Law",
            ],
            correctAnswerIndex: 0,
            explanation: "The Law of Conservation of Mass establishes that matter cannot be created or destroyed in chemical transformations.",
            difficulty: "easy",
          },
          {
            question: `According to Le Chatelier's Principle in ${cleanT}, how does a dynamic system at equilibrium respond to an imposed disturbance?`,
            options: [
              "It shifts in the direction that counteracts and offsets the applied change",
              "It ceases all chemical reactions permanently",
              "It destroys reactants to maximize entropy",
              "It alters the intrinsic equilibrium constant arbitrarily",
            ],
            correctAnswerIndex: 0,
            explanation: "Le Chatelier's Principle states that a system at dynamic equilibrium adjusts to counteract any applied stress.",
            difficulty: "medium",
          },
          {
            question: `What is the oxidation state of pure elemental oxygen in diatomic O2 form in ${cleanT}?`,
            options: ["0", "-2", "-1", "+2"],
            correctAnswerIndex: 0,
            explanation: "Any pure chemical element in its free uncombined state has an oxidation state of zero.",
            difficulty: "easy",
          },
          {
            question: `How many particles (atoms, molecules, or ions) are contained in exactly one mole of a substance according to Avogadro's number?`,
            options: ["6.022 × 10^23", "3.00 × 10^8", "1.602 × 10^-19", "9.81 × 10^2"],
            correctAnswerIndex: 0,
            explanation: "Avogadro's constant defines one mole as 6.022 × 10^23 representative particles.",
            difficulty: "easy",
          },
          {
            question: `Which functional group characterizes all aliphatic alcohols in organic chemistry for ${cleanT}?`,
            options: ["Hydroxyl group (-OH)", "Carbonyl group (C=O)", "Carboxyl group (-COOH)", "Amino group (-NH2)"],
            correctAnswerIndex: 0,
            explanation: "Alcohols contain a hydroxyl functional group (-OH) bonded directly to a saturated carbon atom.",
            difficulty: "easy",
          },
        ];
      } else if (
        lower.includes("cs") ||
        lower.includes("comput") ||
        lower.includes("program") ||
        lower.includes("python") ||
        lower.includes("algorithm") ||
        lower.includes("binary") ||
        lower.includes("data structure") ||
        lower.includes("code") ||
        lower.includes("oop")
      ) {
        topicTemplates = [
          {
            question: `What is the asymptotic time complexity of Binary Search on a sorted array in ${cleanT}?`,
            options: ["O(log n)", "O(n)", "O(n²)", "O(1)"],
            correctAnswerIndex: 0,
            explanation: "Binary search divides the search space in half at each step, yielding logarithmic O(log n) time complexity.",
            difficulty: "easy",
          },
          {
            question: `Which fundamental data structure adheres strictly to the Last-In, First-Out (LIFO) order in ${cleanT}?`,
            options: ["Queue", "Stack", "Linked List", "Binary Heap"],
            correctAnswerIndex: 1,
            explanation: "A Stack operates on the LIFO principle, where the most recently pushed element is the first popped.",
            difficulty: "easy",
          },
          {
            question: `In Object-Oriented Programming (OOP) for ${cleanT}, what is the term for bundling data and methods inside a single class?`,
            options: ["Polymorphism", "Inheritance", "Encapsulation", "Recursion"],
            correctAnswerIndex: 2,
            explanation: "Encapsulation bundles data and methods together while restricting direct external access to internal state.",
            difficulty: "medium",
          },
          {
            question: `What must every valid recursive algorithm include to prevent infinite recursion and stack overflow in ${cleanT}?`,
            options: ["A base case", "A global pointer", "An infinite loop", "A secondary sort"],
            correctAnswerIndex: 0,
            explanation: "A terminating base case stops recursive self-invocations when reached.",
            difficulty: "easy",
          },
          {
            question: `Which data structure achieves average O(1) constant-time key lookups via hashing in ${cleanT}?`,
            options: ["Binary Search Tree", "Hash Table / Dictionary", "Linked List", "Doubly-ended Queue"],
            correctAnswerIndex: 1,
            explanation: "Hash tables use a hashing function to map keys to bucket indices for average O(1) retrieval.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("history") ||
        lower.includes("war") ||
        lower.includes("revolution") ||
        lower.includes("civilization") ||
        lower.includes("pakistan") ||
        lower.includes("empire")
      ) {
        topicTemplates = [
          {
            question: `What 18th-century global milestone mechanized manufacturing through commercial steam engines in ${cleanT}?`,
            options: ["Agricultural Expansion", "The Industrial Revolution", "The Renaissance", "The Feudal Era"],
            correctAnswerIndex: 1,
            explanation: "The Industrial Revolution mechanized production through the commercial application of steam engines.",
            difficulty: "easy",
          },
          {
            question: `Which primary source provides direct contemporary eyewitness evidence regarding ${cleanT}?`,
            options: ["Original letters, diaries, and official treaties", "Modern retrospective textbooks", "Historical fiction novels", "Recent encyclopedia entries"],
            correctAnswerIndex: 0,
            explanation: "Primary sources are direct first-hand accounts created during the time period under study.",
            difficulty: "easy",
          },
          {
            question: `In historical scholarship for ${cleanT}, what is the critical evaluation of an author's bias and context called?`,
            options: ["Source Criticism & Provenance Analysis", "Random Interpolation", "Chronological Fiction", "Anachronistic Conjecture"],
            correctAnswerIndex: 0,
            explanation: "Source criticism evaluates the context, motives, and reliability of historical documents.",
            difficulty: "medium",
          },
          {
            question: `Which international treaty established the League of Nations following World War I relevant to ${cleanT}?`,
            options: ["The Treaty of Versailles (1919)", "The Treaty of Westphalia (1648)", "The Congress of Vienna (1815)", "The Magna Carta (1215)"],
            correctAnswerIndex: 0,
            explanation: "The Treaty of Versailles formally ended WWI between the Allies and Germany and established the League of Nations.",
            difficulty: "easy",
          },
          {
            question: `What was the primary demographic impact of urbanization during industrial revolutions in ${cleanT}?`,
            options: [
              "Migration of rural populations into factory cities",
              "Complete abandonment of technological development",
              "Dispersal of cities into agrarian hamlets",
              "Total cessation of international commerce",
            ],
            correctAnswerIndex: 0,
            explanation: "Urbanization concentrated workforces in rapidly expanding industrial cities near manufacturing centers.",
            difficulty: "medium",
          },
        ];
      } else if (
        lower.includes("english") ||
        lower.includes("grammar") ||
        lower.includes("tense") ||
        lower.includes("essay") ||
        lower.includes("literature")
      ) {
        topicTemplates = [
          {
            question: `In English syntax regarding ${cleanT}, which element must agree in person and number with the subject?`,
            options: ["The finite verb", "The indirect object", "The modifying adverb", "The preposition"],
            correctAnswerIndex: 0,
            explanation: "Subject-verb agreement requires the verb to match the singular or plural grammatical subject.",
            difficulty: "easy",
          },
          {
            question: `Which literary device compares two disparate concepts using 'like' or 'as' in ${cleanT}?`,
            options: ["Metaphor", "Simile", "Personification", "Hyperbole"],
            correctAnswerIndex: 1,
            explanation: "A simile is an explicit comparison between two things using the words 'like' or 'as'.",
            difficulty: "easy",
          },
          {
            question: `In academic essay writing for ${cleanT}, what constitutes a strong thesis statement?`,
            options: [
              "A broad generalization of undisputed fact",
              "A clear, defensible central claim that guides the paper",
              "A quote from an encyclopedia introduction",
              "An unanswered rhetorical question",
            ],
            correctAnswerIndex: 1,
            explanation: "A thesis statement provides a specific, debatable central claim that the essay argues and supports.",
            difficulty: "medium",
          },
          {
            question: `In passive voice grammatical construction for ${cleanT}, which sentence component receives the action?`,
            options: ["The Grammatical Subject", "The Adverbial Modifier", "The Conjunction", "The Interjection"],
            correctAnswerIndex: 0,
            explanation: "In passive voice, the grammatical subject receives the action performed by the agent.",
            difficulty: "easy",
          },
          {
            question: `Which sentence structure consists of one independent clause and at least one dependent subordinate clause in ${cleanT}?`,
            options: ["Simple Sentence", "Compound Sentence", "Complex Sentence", "Compound-Complex"],
            correctAnswerIndex: 2,
            explanation: "A complex sentence connects an independent clause with one or more dependent clauses.",
            difficulty: "easy",
          },
        ];
      } else {
        // Topic-isolated universal practice questions strictly about ${cleanT}
        topicTemplates = [
          {
            question: `In the academic study of "${cleanT}", what is the primary foundational principle and governing law?`,
            options: [
              `The systematic analysis and verified governing laws of ${cleanT}`,
              "An unverified speculative assumption with no real-world application",
              "A purely subjective opinion with no measurable variables",
              "A static historical artifact no longer relevant to modern study",
            ],
            correctAnswerIndex: 0,
            explanation: `${cleanT} is defined through rigorous foundational laws, repeatable observations, and measurable variables.`,
            difficulty: "easy",
          },
          {
            question: `Which methodology provides the most reliable verification of theoretical claims in "${cleanT}"?`,
            options: [
              "Uncontrolled personal intuition",
              "Controlled empirical evidence and structured analysis",
              "Passive consensus without experimental verification",
              "Random speculative conjecture",
            ],
            correctAnswerIndex: 1,
            explanation: `Systematic empirical analysis and structured problem-solving provide reproducible verification for ${cleanT}.`,
            difficulty: "medium",
          },
          {
            question: `What is the most critical first step when solving examination problems regarding "${cleanT}"?`,
            options: [
              "Identifying given parameters, constraints, and applicable governing formulas",
              "Guessing numerical values without checking units",
              "Ignoring boundary conditions and assumptions",
              "Skipping the verification of sign conventions",
            ],
            correctAnswerIndex: 0,
            explanation: `Accurate problem solving in ${cleanT} begins by identifying known quantities, target unknowns, and appropriate governing equations.`,
            difficulty: "easy",
          },
          {
            question: `How does mastery of "${cleanT}" directly relate to examination success and practical application?`,
            options: [
              `It establishes foundational principles applied in advanced study and real-world systems`,
              "It is strictly isolated from all other academic and practical domains",
              "It requires zero mathematical or analytical understanding",
              "It has no connection to modern examinations or syllabus requirements",
            ],
            correctAnswerIndex: 0,
            explanation: `Concepts within ${cleanT} form key building blocks for exam problem-solving and real-world analytical applications.`,
            difficulty: "easy",
          },
          {
            question: `Which studying technique is scientifically proven to yield the highest exam retention for "${cleanT}"?`,
            options: [
              "Active recall, self-testing, and spaced repetition",
              "Single-pass passive highlighting of textbook paragraphs",
              "All-night cramming immediately before the exam",
              "Memorizing answers without understanding the underlying mechanisms",
            ],
            correctAnswerIndex: 0,
            explanation: `Active recall and spaced self-testing strengthen retrieval pathways for complex concepts in ${cleanT}.`,
            difficulty: "easy",
          },
        ];
      }

      const countToGen = Math.min(Math.max(questionCount, 1), 30);
      const fallbackQuestions: QuizQuestion[] = [];
      for (let i = 0; i < countToGen; i++) {
        const item = topicTemplates[i % topicTemplates.length];
        fallbackQuestions.push({
          id: `q-fb-${i + 1}`,
          question: i >= topicTemplates.length ? `[Practice #${i + 1}] ${item.question}` : item.question,
          options: item.options,
          correctIndex: item.correctAnswerIndex,
          correctAnswerIndex: item.correctAnswerIndex,
          explanation: item.explanation,
          difficulty: item.difficulty,
          topic: quizTopic,
        });
      }
      setQuestions(fallbackQuestions);
    } finally {
      setIsGenerating(false);
    }
  };

  // Select an option: immediately displays feedback and auto-advances to next question
  const handleSelectOption = (idx: number) => {
    if (showExplanation) return; // Prevent change after reveal
    setSelectedOption(idx);
    setShowExplanation(true);

    const currentQ = questions[currentIdx];
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: idx,
    }));

    // Auto-advance to next question upon clicking an option (snappy ~850ms)
    if (autoAdvance) {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 850);
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    stopSpeaking();
    setIsSpeakingQuestion(false);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  // Reset Quiz
  const handleResetQuiz = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    stopSpeaking();
    setQuestions([]);
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setUserAnswers({});
    setQuizFinished(false);
  };

  // Read current question out loud using voice engine
  const handleSpeakQuestion = () => {
    if (isSpeakingQuestion) {
      stopSpeaking();
      setIsSpeakingQuestion(false);
      return;
    }

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    const letters = ["A", "B", "C", "D", "E", "F"];
    const optionsText = currentQ.options
      .map((opt, i) => `Option ${letters[i] || i + 1}: ${opt}`)
      .join(". ");
    const textToRead = `${currentQ.question}. ${optionsText}.`;
    setIsSpeakingQuestion(true);

    speakWithVoice(
      textToRead,
      selectedVoicePersona,
      customVoiceURI,
      1.0,
      1.0,
      language,
      () => setIsSpeakingQuestion(true),
      () => setIsSpeakingQuestion(false),
      () => setIsSpeakingQuestion(false)
    );
  };

  // Calculate Quiz Score
  const calculateScore = (): QuizResult => {
    let score = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });
    const percentage = Math.round((score / questions.length) * 100);
    return {
      totalQuestions: questions.length,
      correctAnswers: score,
      percentage,
      topic: topic || "Study Quiz",
      completedAt: new Date().toLocaleDateString(),
    };
  };

  // Flashcard controls
  const handleNextCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIdx((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsCardFlipped(false);
    setCurrentCardIdx((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleToggleMastered = (cardId: string) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, mastered: !c.mastered } : c))
    );
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const newCard: Flashcard = {
      id: "fc-" + Date.now(),
      front: newFront.trim(),
      back: newBack.trim(),
      subject: newSubject.trim() || "General",
      mastered: false,
    };
    setFlashcards((prev) => [newCard, ...prev]);
    setNewFront("");
    setNewBack("");
    setShowAddCard(false);
    setCurrentCardIdx(0);
    setIsCardFlipped(false);
  };

  const activeCard = flashcards[currentCardIdx];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner & Mode Tabs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Quiz Mode & Study Helper
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Powered
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate custom practice quizzes, review active recall flashcards, and track focus sessions.
            </p>
          </div>
        </div>

        {/* Study Navigation Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setStudyTab("quiz")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              studyTab === "quiz"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Practice Quiz
          </button>

          <button
            onClick={() => setStudyTab("flashcards")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              studyTab === "flashcards"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Flashcards ({flashcards.length})
          </button>

          <button
            onClick={() => setStudyTab("timer")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              studyTab === "timer"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Timer className="w-3.5 h-3.5" /> Focus Timer
          </button>
        </div>
      </div>

      {/* TAB 1: PRACTICE QUIZ MODE */}
      {studyTab === "quiz" && (
        <div className="space-y-6">
          {/* Quiz Generator Config (Visible when not actively playing a quiz) */}
          {questions.length === 0 && !isGenerating && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Generate AI Study Quiz
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose any subject or paste your lecture notes to create tailored multiple-choice questions.
                </p>
              </div>

              {/* Preset Subjects Carousel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Quick Select Topic:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_TOPICS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTopic(p.prompt);
                        handleGenerateQuiz(p.prompt);
                      }}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition-all group flex items-start gap-2.5"
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">Click to generate</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Subject or Exam Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Photosynthesis light reactions, World War 2 Pacific theater, Linear Algebra..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Questions
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomCount(!isCustomCount)}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {isCustomCount ? "Presets" : "Custom #"}
                        </button>
                      </div>

                      {isCustomCount ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setQuestionCount((c) => Math.max(1, c - 1))}
                            className="w-8 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700"
                            title="Decrease question count"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={questionCount}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setQuestionCount(Math.min(Math.max(val, 1), 30));
                              }
                            }}
                            className="w-full text-center px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setQuestionCount((c) => Math.min(30, c + 1))}
                            className="w-8 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700"
                            title="Increase question count"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <select
                          value={questionCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              setIsCustomCount(true);
                            } else {
                              setQuestionCount(Number(val));
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                        >
                          <option value={3}>3 Questions</option>
                          <option value={5}>5 Questions</option>
                          <option value={10}>10 Questions</option>
                          <option value={15}>15 Questions</option>
                          <option value={20}>20 Questions</option>
                          <option value={25}>25 Questions</option>
                          <option value="custom">Custom amount...</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Custom Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paste Lecture Notes or Textbook Excerpt (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Paste notes or study materials here and AI will generate questions directly from them..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>
                )}

                <button
                  onClick={() => handleGenerateQuiz()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" /> Generate Practice Quiz
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center animate-spin">
                <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Synthesizing Quiz Questions...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Analyzing syllabus concepts, formulating test options, and preparing comprehensive explanations.
                </p>
              </div>
            </div>
          )}

          {/* Active Quiz Player */}
          {questions.length > 0 && !quizFinished && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Progress & Voice Bar */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Topic: {topic || "Study Quiz"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (autoAdvance && autoAdvanceTimerRef.current) {
                        clearTimeout(autoAdvanceTimerRef.current);
                        autoAdvanceTimerRef.current = null;
                      }
                      setAutoAdvance(!autoAdvance);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      autoAdvance
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                    title="Toggle auto-showing the next question on option click"
                  >
                    <Zap className={`w-3.5 h-3.5 ${autoAdvance ? "text-amber-500 fill-amber-500" : "text-slate-400"}`} />
                    <span>Auto-Next: {autoAdvance ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    onClick={handleSpeakQuestion}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      isSpeakingQuestion
                        ? "bg-cyan-600 text-white border-cyan-500 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                    }`}
                    title="Read question and options aloud"
                  >
                    {isSpeakingQuestion ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    {isSpeakingQuestion ? "Stop Audio" : "Listen (Voice)"}
                  </button>

                  <button
                    onClick={handleResetQuiz}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Abandon Quiz"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {questions[currentIdx].question}
                </p>
              </div>

              {/* Options List */}
              <div className="grid grid-cols-1 gap-3">
                {questions[currentIdx].options.map((option, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isCorrect = optIdx === questions[currentIdx].correctAnswerIndex;

                  let buttonStyles = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30";

                  if (showExplanation) {
                    if (isCorrect) {
                      buttonStyles = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold";
                    } else if (isSelected && !isCorrect) {
                      buttonStyles = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 font-bold";
                    } else {
                      buttonStyles = "opacity-50 border-slate-200 dark:border-slate-800";
                    }
                  }

                  const optionLetter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      disabled={showExplanation}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 text-xs ${buttonStyles}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          showExplanation && isCorrect
                            ? "bg-emerald-600 text-white"
                            : showExplanation && isSelected && !isCorrect
                            ? "bg-rose-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {showExplanation && isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : showExplanation && isSelected && !isCorrect ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          optionLetter
                        )}
                      </div>
                      <span className="flex-1 font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {showExplanation && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs animate-fadeIn space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Explanation & Key Takeaway:</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {questions[currentIdx].explanation}
                  </p>
                </div>
              )}

              {/* Next Button & Auto-Advance Notice */}
              {showExplanation && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {autoAdvance && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-fadeIn">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        Auto-showing next question...
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all self-end sm:self-auto"
                  >
                    {currentIdx + 1 === questions.length ? "Finish Quiz & View Results" : "Next Question"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz Completion & Results Screen */}
          {quizFinished && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Award className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  Quiz Completed!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Topic: {topic || "General Study"}
                </p>
              </div>

              {/* Score Display Card */}
              {(() => {
                const result = calculateScore();
                return (
                  <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {result.percentage}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({result.correctAnswers} of {result.totalQuestions} correct)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {result.percentage >= 80
                        ? "Mastery Achieved! Excellent understanding of this subject."
                        : result.percentage >= 60
                        ? "Good foundation! Review the flashcards below to solidify tricky topics."
                        : "Needs more practice. Keep studying and try again!"}
                    </p>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetQuiz}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Start Another Quiz
                </button>

                <button
                  onClick={() => setStudyTab("flashcards")}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <Layers className="w-4 h-4" /> Review Flashcards
                </button>
              </div>

              {/* Detailed Question by Question Review */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-left space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  Detailed Question Review ({questions.length} Questions)
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const userPick = userAnswers[q.id];
                    const correctPick = typeof q.correctIndex === "number" ? q.correctIndex : q.correctAnswerIndex ?? 0;
                    const isUserCorrect = userPick === correctPick;

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                          isUserCorrect
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                            : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {idx + 1}. {q.question}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isUserCorrect
                                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {isUserCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 block">Your Answer:</span>
                            <span className={`font-medium ${isUserCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {userPick !== undefined && q.options[userPick] ? q.options[userPick] : "Unanswered"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 block">Correct Answer:</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {q.options[correctPick] || "Option A"}
                            </span>
                          </div>
                        </div>

                        {q.explanation && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                            <strong className="text-slate-700 dark:text-slate-300">Explanation: </strong>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE RECALL FLASHCARDS */}
      {studyTab === "flashcards" && (
        <div className="space-y-6">
          {/* Header and Add Card Bar */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                Active Recall Flashcards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flip to test your memory recall before exams.
              </p>
            </div>

            <button
              onClick={() => setShowAddCard(!showAddCard)}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {showAddCard ? "Close Creator" : "Create Card"}
            </button>
          </div>

          {/* Add Card Form Modal / Collapsible */}
          {showAddCard && (
            <form
              onSubmit={handleAddFlashcard}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-fadeIn"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                New Study Flashcard
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Front (Question or Prompt)
                  </label>
                  <input
                    type="text"
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    placeholder="e.g., What is Newton's Third Law?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Category
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Physics, Biology, History..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Back (Answer & Explanation)
                </label>
                <textarea
                  rows={2}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g., For every action, there is an equal and opposite reaction."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCard(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-colors"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          )}

          {/* Flashcard Viewer */}
          {flashcards.length > 0 && activeCard && (
            <div className="space-y-4">
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono">
                  Card {currentCardIdx + 1} of {flashcards.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                  {activeCard.subject}
                </span>
                <span className={activeCard.mastered ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                  {activeCard.mastered ? "✓ Mastered" : "⏳ Learning"}
                </span>
              </div>

              {/* Large Flip Card */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="cursor-pointer group relative min-h-[260px] rounded-3xl p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:border-indigo-400 select-none"
              >
                <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tap to {isCardFlipped ? "Flip Back" : "Reveal Answer"}
                </span>

                <div className="space-y-3 max-w-lg">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                    {isCardFlipped ? "Answer" : "Question"}
                  </span>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {isCardFlipped ? activeCard.back : activeCard.front}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  onClick={handlePrevCard}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
                >
                  ← Previous Card
                </button>

                <button
                  onClick={() => handleToggleMastered(activeCard.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    activeCard.mastered
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {activeCard.mastered ? "Marked Mastered" : "Mark as Mastered"}
                </button>

                <button
                  onClick={handleNextCard}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                >
                  Next Card →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDY FOCUS TIMER (POMODORO) */}
      {studyTab === "timer" && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center space-y-6 max-w-xl mx-auto">
          {/* Header */}
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              <Timer className="w-5 h-5 text-indigo-500" />
              Focus & Pomodoro Study Timer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Boost study retention with interval focus blocks and voice notifications.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl max-w-xs mx-auto border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleStartTimerMode("focus")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerMode === "focus"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => handleStartTimerMode("shortBreak")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerMode === "shortBreak"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Break (5m)
            </button>
            <button
              onClick={() => handleStartTimerMode("longBreak")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerMode === "longBreak"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Big Time Display */}
          <div className="py-6">
            <div className="text-6xl sm:text-7xl font-mono font-extrabold text-slate-900 dark:text-slate-100 tracking-tighter">
              {formatTime(timerSeconds)}
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-3">
              {timerMode === "focus" ? "Deep Focus Session" : "Rest & Recharge"}
            </p>
          </div>

          {/* Play/Pause & Reset Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${
                isTimerRunning
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
              title={isTimerRunning ? "Pause Timer" : "Start Timer"}
            >
              {isTimerRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => handleStartTimerMode(timerMode)}
              className="p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Completed Streak */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Completed Study Intervals Today: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{completedSessions}</span>
          </div>
        </div>
      )}
    </div>
  );
};
