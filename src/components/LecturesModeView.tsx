import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  CheckCircle2,
  Dna,
  FlaskConical,
  Atom,
  BookOpen,
  Sparkles,
  FileDown,
  Search,
  Play,
  ExternalLink,
  X,
  Volume2,
  Clock,
  Check,
  Calculator,
  Binary,
  RotateCcw,
  Radio,
  FileText,
  Share2,
  Flag,
  Bookmark,
  BookmarkCheck,
  Award,
  Video,
  ListFilter,
  CheckCircle,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { initialStudentPDFs } from "../data/studentPDFsData";
import { downloadStudentPDFFile } from "../utils/studentPdfGenerator";
import { LectureVideo, LectureType } from "../types";
import {
  PAKISTANI_LECTURES,
  PAKISTANI_LECTURE_TYPES,
  PAKISTANI_BOARDS,
  MasterLectureEntry,
} from "../data/pakistaniLecturesData";
import {
  searchCurriculumLectures,
  getYouTubeSearchUrl,
  ExtendedLectureVideo,
} from "../services/curriculumLecturesEngine";
import { useAuth } from "../context/AuthContext";
import { getUserItem, setUserItem, persistUserKeyToServer, logUserActivityToServer } from "../utils/userStorage";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  popularTopics: string[];
}

const subjects: SubjectOption[] = [
  {
    id: "biology",
    name: "Biology",
    code: "BIO",
    icon: Dna,
    color: "from-emerald-500 to-teal-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    description: "Cell biology, photosynthesis, genetics, physiology, anatomy, and ecology for FSc Pre-Medical & Medical board exams.",
    popularTopics: ["Photosynthesis", "Cellular Respiration", "Mitosis & Cell Division", "DNA Replication", "Enzymes", "Human Circulatory System"],
  },
  {
    id: "physics",
    name: "Physics",
    code: "PHY",
    icon: Atom,
    color: "from-blue-500 to-indigo-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    description: "Newtonian mechanics, vectors, thermodynamics, and electricity for FSc Pre-Engineering & Board exams.",
    popularTopics: ["Newton's Laws of Motion", "Work, Energy and Power", "Kinematics", "Thermodynamics", "Electricity and Circuits", "Optics and Light"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    code: "CHEM",
    icon: FlaskConical,
    color: "from-amber-500 to-orange-600 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    description: "Chemical bonding, periodic trends, equilibrium, and organic chemistry for FSc Part 1 & 2.",
    popularTopics: ["Chemical Bonding", "Organic Chemistry", "Periodic Table & Trends", "Chemical Equilibrium", "Stoichiometry"],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    code: "MATH",
    icon: Calculator,
    color: "from-rose-500 to-pink-600 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    description: "Differentiation, integration, quadratic equations, and matrices for FSc & ICS mathematics.",
    popularTopics: ["Calculus & Derivatives", "Integration & Calculus", "Quadratic Equations", "Matrices & Transformations", "Trigonometry"],
  },
  {
    id: "computer_science",
    name: "Computer Science",
    code: "CS",
    icon: Binary,
    color: "from-cyan-500 to-blue-600 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
    description: "C & Python programming, database systems (SQL), and algorithms for ICS Part 1 & Part 2.",
    popularTopics: ["Programming & Python", "Data Structures & Algorithms", "Binary Search", "Object-Oriented Programming"],
  },
  {
    id: "english",
    name: "English",
    code: "ENG",
    icon: BookOpen,
    color: "from-purple-500 to-pink-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    description: "Active/passive voice, direct/indirect narration, and formal essays for intermediate board examinations.",
    popularTopics: ["Active and Passive Voice", "English Grammar", "Essay Writing & Thesis"],
  },
  {
    id: "social_studies",
    name: "Social Studies & History",
    code: "SOC",
    icon: Flag,
    color: "from-emerald-600 to-teal-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800",
    description: "Ideology of the Nation, Freedom Struggle, Lahore Resolution 1940, and 1973 Constitution for Board Exams.",
    popularTopics: ["Ideology of the Nation", "Lahore Resolution 1940", "Regional Geography", "1973 Constitution"],
  },
  {
    id: "urdu",
    name: "Urdu Compulsory",
    code: "URD",
    icon: FileText,
    color: "from-amber-600 to-yellow-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800",
    description: "Nazam & Ghazal Tashreeh, Sabaq ka Khulasa, Mazmoon Nigari, and exam presentation for intermediate students.",
    popularTopics: ["Urdu Grammar & Tashreeh", "Urdu Mazmoon Nigari", "Allama Iqbal Ash'aar"],
  },
];

export const LecturesModeView: React.FC = () => {
  const { language, speakBunny } = useApp();

  // Navigation & Filter States
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedLectureType, setSelectedLectureType] = useState<LectureType>("all");
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchTopic, setActiveSearchTopic] = useState("Photosynthesis");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<{
    topic: string;
    subtopics: string[];
    questions: string[];
    keys: string[];
    featuredLecture?: LectureVideo;
    relatedVideos?: LectureVideo[];
  } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Curated Pakistani Academic Topics for Instant Search Suggestions
  const CURATED_SEARCH_SUGGESTIONS = useMemo(() => [
    { topic: "Photosynthesis", subject: "Biology", grade: "11th Class", sub: "Light & Dark Reactions" },
    { topic: "Cellular Respiration", subject: "Biology", grade: "11th Class", sub: "Glycolysis & Krebs Cycle" },
    { topic: "Mitosis & Cell Division", subject: "Biology", grade: "11th Class", sub: "Prophase, Metaphase, Anaphase" },
    { topic: "DNA Replication", subject: "Biology", grade: "12th Class", sub: "Leading & Lagging Strands" },
    { topic: "Enzymes & Kinetics", subject: "Biology", grade: "11th Class", sub: "Lock and Key vs Induced Fit" },
    { topic: "Newton's Laws of Motion", subject: "Physics", grade: "11th Class", sub: "F = ma & Inertia" },
    { topic: "Work, Energy and Power", subject: "Physics", grade: "11th Class", sub: "Work-Energy Theorem" },
    { topic: "Thermodynamics", subject: "Physics", grade: "11th Class", sub: "First Law & Carnot Engine" },
    { topic: "Electricity and Circuits", subject: "Physics", grade: "12th Class", sub: "Kirchhoff's Laws & Ohm's Law" },
    { topic: "Optics and Light", subject: "Physics", grade: "11th Class", sub: "Young's Double Slit & Diffraction" },
    { topic: "Chemical Bonding", subject: "Chemistry", grade: "11th Class", sub: "VSEPR & Hybridization (sp³, sp²)" },
    { topic: "Organic Chemistry", subject: "Chemistry", grade: "12th Class", sub: "Isomerism & Functional Groups" },
    { topic: "Periodic Table & Trends", subject: "Chemistry", grade: "11th Class", sub: "Ionization Energy & Electronegativity" },
    { topic: "Chemical Equilibrium", subject: "Chemistry", grade: "11th Class", sub: "Kc, Kp & Le Chatelier's Principle" },
    { topic: "Stoichiometry", subject: "Chemistry", grade: "11th Class", sub: "Mole Calculations & Limiting Reactant" },
    { topic: "Calculus & Derivatives", subject: "Mathematics", grade: "12th Class", sub: "Product, Quotient & Chain Rules" },
    { topic: "Integration & Calculus", subject: "Mathematics", grade: "12th Class", sub: "Integration by Parts & Definite Integrals" },
    { topic: "Quadratic Equations", subject: "Mathematics", grade: "11th Class", sub: "Cube Roots of Unity & Discriminant" },
    { topic: "Matrices & Transformations", subject: "Mathematics", grade: "11th Class", sub: "Cramer's Rule & Inverses" },
    { topic: "Trigonometry", subject: "Mathematics", grade: "11th Class", sub: "Identities & Sine/Cosine Laws" },
    { topic: "Programming & Python", subject: "Computer Science", grade: "11th Class", sub: "Loops, Functions & Lists" },
    { topic: "Binary Search", subject: "Computer Science", grade: "12th Class", sub: "Logarithmic O(log n) Algorithm" },
    { topic: "Active and Passive Voice", subject: "English", grade: "11th Class", sub: "Conversion Rules for All Tenses" },
    { topic: "Ideology of the Nation", subject: "Social Studies & History", grade: "12th Class", sub: "Allama Iqbal & Quaid-e-Azam" },
    { topic: "Lahore Resolution 1940", subject: "Social Studies & History", grade: "12th Class", sub: "Historical Context & Clauses" },
    { topic: "1973 Constitution", subject: "Social Studies & History", grade: "12th Class", sub: "Islamic & Parliamentary Features" },
    { topic: "Urdu Grammar & Tashreeh", subject: "Urdu", grade: "11th Class", sub: "Nazam & Ghazal Rules" },
    { topic: "Urdu Mazmoon Nigari", subject: "Urdu", grade: "12th Class", sub: "Essay Presentation & Khulasa" },
  ], []);

  // Filter autocomplete suggestions based on what user has typed
  const autocompleteFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CURATED_SEARCH_SUGGESTIONS.slice(0, 6);
    return CURATED_SEARCH_SUGGESTIONS.filter(
      (item) =>
        item.topic.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, CURATED_SEARCH_SUGGESTIONS]);

  // Video State
  const [videos, setVideos] = useState<LectureVideo[]>([]);
  const { currentUser } = useAuth();
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<LectureVideo | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Persistence: Bookmarked and Watched lecture IDs (Isolated per user account)
  const [savedLectureIds, setSavedLectureIds] = useState<string[]>(() => {
    return getUserItem<string[]>(currentUser?.id, "saved_lectures", []);
  });

  const [watchedLectureIds, setWatchedLectureIds] = useState<string[]>(() => {
    return getUserItem<string[]>(currentUser?.id, "watched_lectures", []);
  });

  // Re-synchronize when user changes
  useEffect(() => {
    setSavedLectureIds(getUserItem<string[]>(currentUser?.id, "saved_lectures", []));
    setWatchedLectureIds(getUserItem<string[]>(currentUser?.id, "watched_lectures", []));
  }, [currentUser?.id]);

  const toggleSaveLecture = (id: string) => {
    setSavedLectureIds((prev) => {
      const added = !prev.includes(id);
      const next = added ? [...prev, id] : prev.filter((item) => item !== id);
      setUserItem(currentUser?.id, "saved_lectures", next);
      persistUserKeyToServer(currentUser?.id, "saved_lectures", next);
      if (currentUser?.id) {
        logUserActivityToServer({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          feature: "lectures",
          action: added ? "LECTURE_BOOKMARKED" : "LECTURE_UNBOOKMARKED",
          details: `${added ? "Saved" : "Removed"} lecture bookmark (${id})`,
        });
      }
      return next;
    });
  };

  const toggleWatchLecture = (id: string) => {
    setWatchedLectureIds((prev) => {
      const added = !prev.includes(id);
      const next = added ? [...prev, id] : prev.filter((item) => item !== id);
      setUserItem(currentUser?.id, "watched_lectures", next);
      persistUserKeyToServer(currentUser?.id, "watched_lectures", next);
      if (currentUser?.id && added) {
        logUserActivityToServer({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name,
          feature: "lectures",
          action: "LECTURE_WATCHED",
          details: `Marked lecture as watched (${id})`,
        });
      }
      return next;
    });
  };

  const loadTopicSuggestions = async (topic: string, subject = "") => {
    if (!topic || !topic.trim()) return;
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch("/api/lectures/topic-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), subject }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopicSuggestions(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Initial fetch of curated videos for current grade / topic
  useEffect(() => {
    fetchLectures(activeSearchTopic, selectedSubject || "", selectedGrade, selectedLectureType, selectedBoard);
    loadTopicSuggestions(activeSearchTopic, selectedSubject || "");
  }, []);

  const fetchLectures = async (
    topic: string,
    subject = "",
    grade = "11th",
    lectureType: LectureType = "all",
    board = "all"
  ) => {
    setIsLoadingVideos(true);
    loadTopicSuggestions(topic, subject);
    try {
      const res = await fetch("/api/lectures/search-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          grade: grade === "all" ? "" : `${grade} Class`,
          lectureType,
          board,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
          setSelectedVideo(data.videos[0]);
          return;
        }
      }
      throw new Error("No remote videos found");
      // High-performance search across the 10,000+ curriculum lecture catalog
      const searchResult = searchCurriculumLectures({
        query: topic && topic !== "all" ? topic : "",
        subject: subject || "all",
        grade: grade || "all",
        lectureType,
        board,
        page: 1,
        pageSize: 48,
      });

      const finalSelection = searchResult.videos.length > 0 ? searchResult.videos : PAKISTANI_LECTURES.slice(0, 12);
      setVideos(finalSelection);
      if (finalSelection.length > 0) {
        setSelectedVideo(finalSelection[0]);
      }
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;
    setIsSearchDropdownOpen(false);
    setActiveSearchTopic(clean);
    fetchLectures(clean, selectedSubject || "", selectedGrade, selectedLectureType, selectedBoard);
    loadTopicSuggestions(clean, selectedSubject || "");
  };

  const handleSelectTopicChip = (topicName: string, subjectId?: string) => {
    setIsSearchDropdownOpen(false);
    setSearchQuery(topicName);
    setActiveSearchTopic(topicName);
    if (subjectId) {
      setSelectedSubject(subjectId);
    }
    fetchLectures(topicName, subjectId || selectedSubject || "", selectedGrade, selectedLectureType, selectedBoard);
    loadTopicSuggestions(topicName, subjectId || selectedSubject || "");
  };

  const handleSelectSubject = (subjId: string) => {
    if (selectedSubject === subjId) {
      setSelectedSubject(null);
      fetchLectures(searchQuery || activeSearchTopic, "", selectedGrade, selectedLectureType, selectedBoard);
    } else {
      setSelectedSubject(subjId);
      const foundSubj = subjects.find((s) => s.id === subjId);
      const firstTopic = foundSubj?.popularTopics[0] || searchQuery || activeSearchTopic;
      setActiveSearchTopic(firstTopic);
      fetchLectures(firstTopic, subjId, selectedGrade, selectedLectureType, selectedBoard);
    }
  };

  const handleSelectClass = (grade: "11th" | "12th" | "all") => {
    setSelectedGrade(grade);
    fetchLectures(activeSearchTopic, selectedSubject || "", grade, selectedLectureType, selectedBoard);
  };

  const handleSelectLectureType = (type: LectureType) => {
    setSelectedLectureType(type);
    fetchLectures(activeSearchTopic, selectedSubject || "", selectedGrade, type, selectedBoard);
  };

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoard(boardId);
    fetchLectures(activeSearchTopic, selectedSubject || "", selectedGrade, selectedLectureType, boardId);
  };

  // Find corresponding student PDF if available
  const matchingPDF = useMemo(() => {
    if (!selectedVideo) return null;
    return initialStudentPDFs.find(
      (p) =>
        p.subject.toLowerCase() === selectedVideo.subject.toLowerCase() ||
        p.title.toLowerCase().includes(selectedVideo.topic.toLowerCase()) ||
        selectedVideo.topic.toLowerCase().includes(p.subject.toLowerCase())
    );
  }, [selectedVideo]);

  // Filter displayed videos if "Saved Lectures" tab is active
  const displayedVideos = useMemo(() => {
    if (onlySaved) {
      return PAKISTANI_LECTURES.filter((v) => savedLectureIds.includes(v.id));
    }
    return videos;
  }, [videos, onlySaved, savedLectureIds]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span>📚</span>
                100% Comprehensive Board Syllabus & Video Lectures
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                FBISE • KPK • Punjab • Sindh Boards
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                10,000+ Video Lectures & YouTube Search
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Curriculum Video Lectures & Masterclasses Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore authentic lectures from <strong>Sabaq Foundation</strong>, <strong>ilmkidunya</strong>, <strong>Campus.pk</strong>, <strong>Punjab Group of Colleges (PGC)</strong>, and <strong>Sir Nasim Zulfiqar</strong>. Filter by <strong>Concept Deep-Dive</strong>, <strong>Solved Past Papers</strong>, <strong>Numericals</strong>, <strong>One-Shot Marathons</strong>, or <strong>MDCAT/ECAT Prep</strong>.
            </p>
          </div>

          {/* Class Grade Selector & Saved Counter */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 max-w-2xl">
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
                { id: "11th", label: "Class 11 (1st Year)" },
                { id: "12th", label: "Class 12 (2nd Year)" },
                { id: "MDCAT", label: "MDCAT & ECAT" },
              ].map((g) => (
                <button
                  key={g.id}
                  id={`lecture-grade-${g.id.replace(/\s+/g, "-")}`}
                  onClick={() => handleSelectClass(g.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedGrade === g.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Quick study stats badge */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                {watchedLectureIds.length} Watched
              </span>
              <button
                onClick={() => setOnlySaved(!onlySaved)}
                className={`flex items-center gap-1 font-bold transition-colors ${
                  onlySaved ? "text-amber-400 underline" : "text-slate-400 hover:text-amber-300"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                {savedLectureIds.length} Saved
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & MULTI-TYPE FILTER CONTROLS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Search Input Form with Live Suggestions Dropdown */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                placeholder="Search board & curriculum lectures (e.g. Newton laws, Integration, Photosynthesis, Organic chemistry, 1973 Constitution)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoadingVideos}
              className="px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {isLoadingVideos ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search Lectures</span>
            </button>

            <a
              href={getYouTubeSearchUrl(searchQuery || activeSearchTopic, selectedGrade, selectedSubject || "")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="Search this exact topic on YouTube in a new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Search on YouTube</span>
              <span className="sm:hidden">YouTube</span>
            </a>
          </form>

          {/* Autocomplete Real-Time Topic Suggestions Dropdown */}
          {isSearchDropdownOpen && autocompleteFiltered.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 animate-fadeIn max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-indigo-500">
                  <Sparkles className="w-3.5 h-3.5" />
                  Suggested Curriculum Topics
                </span>
                <button
                  onClick={() => setIsSearchDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
                {/* Direct exact query action */}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      const clean = searchQuery.trim();
                      setIsSearchDropdownOpen(false);
                      setActiveSearchTopic(clean);
                      fetchLectures(clean, selectedSubject || "", selectedGrade, selectedLectureType, selectedBoard);
                      loadTopicSuggestions(clean, selectedSubject || "");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-left flex items-center justify-between transition-colors group"
                  >
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5" />
                      Search syllabus lectures for "{searchQuery}"
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium group-hover:text-indigo-400">
                      Direct Search ↵
                    </span>
                  </button>
                )}

                {autocompleteFiltered.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSelectTopicChip(item.topic);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold text-xs">
                        <Play className="w-3 h-3 fill-current" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">
                          {item.topic}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.sub}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                        {item.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">{item.grade}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LECTURE FORMATS & LIVE STREAM FILTER RIBBON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Radio className="w-4 h-4" />
              Lecture Formats & Modes:
            </span>
            {selectedLectureType !== "all" && (
              <button
                onClick={() => handleSelectLectureType("all")}
                className="text-indigo-600 dark:text-indigo-400 hover:underline lowercase font-semibold"
              >
                show all formats
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PAKISTANI_LECTURE_TYPES.map((typeObj) => {
              const isSelected = selectedLectureType === typeObj.id;
              const isLive = typeObj.id === "live-stream";

              return (
                <button
                  key={typeObj.id}
                  onClick={() => handleSelectLectureType(typeObj.id)}
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? isLive
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30"
                        : "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : isLive
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:border-rose-400"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />}
                  <span>{typeObj.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROVINCIAL & FEDERAL BOARDS FILTER RIBBON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Flag className="w-4 h-4" />
              Education Boards:
            </span>
            {selectedBoard !== "all" && (
              <button
                onClick={() => handleSelectBoard("all")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline lowercase font-semibold"
              >
                all boards
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PAKISTANI_BOARDS.map((boardObj) => {
              const isSelected = selectedBoard === boardObj.id;
              return (
                <button
                  key={boardObj.id}
                  onClick={() => handleSelectBoard(boardObj.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                  }`}
                >
                  {boardObj.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPACT SUBJECT SELECTOR RIBBON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
              Subjects (Class 1st to 2nd Year):
            </span>
            {selectedSubject && (
              <button
                onClick={() => handleSelectSubject(selectedSubject)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline lowercase font-semibold"
              >
                show all subjects
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {subjects.map((subj) => {
              const IconComp = subj.icon;
              const isSelected = selectedSubject === subj.id;
              return (
                <button
                  key={subj.id}
                  onClick={() => handleSelectSubject(subj.id)}
                  className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{subj.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DYNAMIC TOPIC SUGGESTIONS & HIGH-YIELD SUBTOPICS PANEL */}
        {topicSuggestions && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    Topic Suggestions & Subtopic Breakdown for "{topicSuggestions.topic}"
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any subtopic to play the verified video lecture right inside this app
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                In-App Video Playback Active
              </span>
            </div>

            {/* Subtopic Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                Syllabus Subtopics & Concepts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topicSuggestions.subtopics.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(sub);
                      setActiveSearchTopic(sub);
                      fetchLectures(sub, selectedSubject || "", selectedGrade, selectedLectureType, selectedBoard);
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-indigo-100 dark:border-indigo-900/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Play className="w-2.5 h-2.5 text-rose-500 fill-current" />
                    <span>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* High-Yield Board Questions & Formulas */}
            {topicSuggestions.questions && topicSuggestions.questions.length > 0 && (
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    High-Frequency Board Questions:
                  </span>
                  <div className="space-y-1">
                    {topicSuggestions.questions.slice(0, 2).map((q, qIdx) => (
                      <p key={qIdx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug">
                        <span className="font-bold text-indigo-500 shrink-0">•</span>
                        <span>{q}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {topicSuggestions.keys && topicSuggestions.keys.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Core Formulas & Textbook Keys:
                    </span>
                    <div className="space-y-1">
                      {topicSuggestions.keys.slice(0, 2).map((k, kIdx) => (
                        <p key={kIdx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5 leading-snug">
                          <span className="font-bold text-emerald-500 shrink-0">✓</span>
                          <span>{k}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Popular Recommended Topic Chips */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>High-Yield Curriculum Syllabus Topics:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(selectedSubject
              ? subjects.find((s) => s.id === selectedSubject)?.popularTopics || []
              : [
                  "Photosynthesis",
                  "Newton's Laws of Motion",
                  "Chemical Bonding",
                  "Cellular Respiration",
                  "Calculus & Derivatives",
                  "Mitosis & Cell Division",
                  "Organic Chemistry",
                  "Electricity and Circuits",
                  "Active and Passive Voice",
                  "Ideology of Pakistan",
                  "Urdu Grammar & Tashreeh",
                  "Programming & Python",
                ]
            ).map((topicName, idx) => {
              const isCurrent = activeSearchTopic.toLowerCase() === topicName.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectTopicChip(topicName, selectedSubject || undefined)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-indigo-600 text-white font-bold shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80"
                  }`}
                >
                  {topicName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE VIDEO PLAYER THEATER / STAGE */}
      {selectedVideo && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-indigo-500/30 text-white shadow-2xl space-y-4">
          {/* Player Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                  <Play className="w-2.5 h-2.5 fill-rose-300" />
                  YouTube Player
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {selectedVideo.channelTitle}
                </span>
                <span className="text-xs text-indigo-400 font-mono font-bold">
                  {selectedVideo.subject} ({selectedVideo.grade})
                </span>
                {selectedVideo.board && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-[10px] font-bold border border-emerald-800/60">
                    {selectedVideo.board}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-black text-white">
                {selectedVideo.title}
              </h2>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => toggleWatchLecture(selectedVideo.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  watchedLectureIds.includes(selectedVideo.id)
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                    : "bg-slate-800 text-slate-300 hover:text-white border-slate-700"
                }`}
                title="Mark this lecture as completed"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{watchedLectureIds.includes(selectedVideo.id) ? "Completed ✓" : "Mark Watched"}</span>
              </button>

              <button
                onClick={() => toggleSaveLecture(selectedVideo.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  savedLectureIds.includes(selectedVideo.id)
                    ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                    : "bg-slate-800 text-slate-300 hover:text-white border-slate-700"
                }`}
                title="Save lecture to your bookmarks"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{savedLectureIds.includes(selectedVideo.id) ? "Saved" : "Save"}</span>
              </button>

              <a
                href={selectedVideo.youtubeUrl || `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Open video on YouTube in a new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>YouTube</span>
              </a>

              {matchingPDF && (
                <button
                  onClick={() => downloadStudentPDFFile(matchingPDF)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
                  title="Download accompanying PDF study guide"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>PDF Notes</span>
                </button>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    selectedVideo.youtubeUrl || `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`
                  );
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Copy Video URL"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Player & Notes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Responsive YouTube Embed Video Player */}
            <div className="lg:col-span-2 space-y-3">
              {/* Live Streaming Status Banner if Live Stream */}
              {(selectedVideo.isLive || selectedVideo.lectureType === "live-stream") && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-900/70 to-rose-950/90 border border-rose-500/50 text-white text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg animate-pulse">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      🔴 LIVE STREAM
                    </span>
                    <span>Interactive Board Lecture Broadcast</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-rose-200">
                    <Eye className="w-4 h-4 text-rose-400" />
                    <span className="font-bold">{selectedVideo.liveViewerCount || "1.4k"} Students Watching Live</span>
                  </div>
                </div>
              )}

              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
                <iframe
                  key={selectedVideo.youtubeId}
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={selectedVideo.title}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Fallback playback assistance banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  Embedded video player ready.
                </span>
                <a
                  href={selectedVideo.youtubeUrl || `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
                >
                  Watch directly on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Video Info Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    Lecture Description:
                  </span>
                  <div className="flex items-center gap-3 text-slate-400 font-mono">
                    {selectedVideo.viewsCount && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Eye className="w-3 h-3 text-cyan-400" /> {selectedVideo.viewsCount} views
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {selectedVideo.duration}
                    </span>
                  </div>
                </div>
                <p className="leading-relaxed text-slate-300">
                  {selectedVideo.description}
                </p>
              </div>
            </div>

            {/* Right 1 Col: Key Learning Points & Related Videos */}
            <div className="space-y-4">
              {/* Key Concept Takeaways */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Key Concepts in this Lecture
                  </h4>
                  <button
                    onClick={() => {
                      const points = (selectedVideo.keyTakeaways || []).join(". ");
                      const speechText = `Key concepts for ${selectedVideo.title}. ${points}`;
                      speakBunny(speechText);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-indigo-500/30 transition-colors"
                    title="Listen to these takeaways in Bunny Voice"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Listen</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {(selectedVideo.keyTakeaways && selectedVideo.keyTakeaways.length > 0
                    ? selectedVideo.keyTakeaways
                    : [
                        "Foundational principles and theoretical framework",
                        "Key mechanisms and formula derivations",
                        "Examination tips and common question types",
                      ]
                  ).map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Tools Quick Launch */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/20 text-xs space-y-2.5">
                <p className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Academic Mastery Tools:
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Done with this lecture? Head to <strong>Quiz & Game Mode</strong> for interactive board duels on <em>"{selectedVideo.topic}"</em> or grab the complete PDF notes.
                </p>
                {matchingPDF && (
                  <button
                    onClick={() => downloadStudentPDFFile(matchingPDF)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <FileDown className="w-4 h-4" /> Download {matchingPDF.subject} Notes PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH RESULTS GALLERY: PICK FROM RELATED LECTURE VIDEOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {isLoadingVideos
                ? "Searching Curated Video Lectures..."
                : onlySaved
                ? `${displayedVideos.length} Saved Lectures in Your Library`
                : `${displayedVideos.length} Verified Board Lectures for "${activeSearchTopic}"`}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {onlySaved ? (
              <button
                onClick={() => setOnlySaved(false)}
                className="text-indigo-600 dark:text-indigo-400 font-bold underline"
              >
                Back to All Lectures
              </button>
            ) : (
              <span>Click any video below to watch instantly</span>
            )}
          </div>
        </div>

        {/* Direct YouTube Search Callout Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/70 via-slate-900 to-indigo-950/70 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">
                Explore 10,000+ Lectures on YouTube for "{activeSearchTopic}"
              </p>
              <p className="text-[11px] text-slate-300">
                Directly launch YouTube search for complete syllabus walkthroughs, past papers, and university playlists.
              </p>
            </div>
          </div>
          <a
            href={getYouTubeSearchUrl(activeSearchTopic, selectedGrade, selectedSubject || "")}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-red-600/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Search YouTube for "{activeSearchTopic}" ↗</span>
          </a>
        </div>

        {/* Loading State Skeleton */}
        {isLoadingVideos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
              >
                <div className="w-full aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Video Cards Grid */}
        {!isLoadingVideos && displayedVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedVideos.map((vid) => {
              const isSelected = selectedVideo?.id === vid.id;
              const isSaved = savedLectureIds.includes(vid.id);
              const isWatched = watchedLectureIds.includes(vid.id);

              return (
                <div
                  key={vid.id}
                  className={`rounded-3xl border text-left transition-all overflow-hidden flex flex-col justify-between group ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md"
                  }`}
                >
                  {/* Thumbnail with Play Hover */}
                  <div
                    onClick={() => {
                      setSelectedVideo(vid);
                      window.scrollTo({ top: 320, behavior: "smooth" });
                    }}
                    className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallbackTried) {
                          target.dataset.fallbackTried = "true";
                          target.src = `https://img.youtube.com/vi/${vid.youtubeId}/0.jpg`;
                        } else {
                          target.style.opacity = "0";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {vid.duration}
                    </div>

                    {/* Watched Tag */}
                    {isWatched && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Watched
                      </div>
                    )}

                    {/* Subject & Pakistani Curriculum Pill */}
                    <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
                      {(vid.isLive || vid.lectureType === "live-stream") ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          LIVE {vid.liveViewerCount ? `(${vid.liveViewerCount})` : ""}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
                          {vid.subject}
                        </span>
                      )}
                      {vid.lectureType && vid.lectureType !== "live-stream" && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/40 text-[9px] font-bold uppercase">
                          {vid.lectureType.replace("-", " ")}
                        </span>
                      )}
                    </div>

                    {/* Bookmark Quick Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveLecture(vid.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 hover:bg-black text-white hover:text-amber-400 transition-colors"
                      title={isSaved ? "Remove bookmark" : "Save lecture"}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 truncate max-w-[60%]">
                          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{vid.channelTitle}</span>
                        </span>
                        <span className="font-medium shrink-0">{vid.grade}</span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {vid.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {vid.description}
                      </p>
                    </div>

                    {/* Footer Button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedVideo(vid);
                          window.scrollTo({ top: 320, behavior: "smooth" });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-600 hover:text-white"
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isSelected ? "Now Playing" : "Watch Lecture"}</span>
                      </button>

                      <a
                        href={vid.youtubeUrl || `https://www.youtube.com/watch?v=${vid.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white text-xs font-bold flex items-center gap-1 border border-red-500/20 transition-all cursor-pointer"
                        title="Open on YouTube directly"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>YouTube</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Search State */}
        {!isLoadingVideos && displayedVideos.length === 0 && (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {onlySaved ? "No saved lectures yet" : `No videos found for "${activeSearchTopic}"`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {onlySaved
                  ? "Click the bookmark icon on any lecture card to save it for quick revision."
                  : "Try searching curriculum topics like Photosynthesis, Newton's Laws, Organic Chemistry, or Calculus."}
              </p>
            </div>
            <button
              onClick={() => {
                setOnlySaved(false);
                setSelectedLectureType("all");
                setSelectedBoard("all");
                setSelectedSubject(null);
                handleSelectTopicChip("Photosynthesis", "biology");
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Reset Filters & Show All Lectures
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
