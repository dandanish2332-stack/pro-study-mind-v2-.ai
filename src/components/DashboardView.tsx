import React, { useState } from "react";
import {
  Sparkles,
  Gamepad2,
  FileDown,
  GraduationCap,
  Brain,
  Mic,
  BookOpen,
  Languages,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Award,
  Layers,
  ChevronRight,
  Play,
  Share2,
  FileText,
  Compass,
  Zap,
  Target,
  ShieldCheck,
  Check,
  User,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getUserItem } from "../utils/userStorage";

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onNavigateToPDFs?: (subject?: string) => void;
}

const CLASS_BANDS = [
  { id: "all", label: "All Classes", sub: "Class 1st to 2nd Year" },
  { id: "primary", label: "Primary Level", sub: "Class 1st to 5th" },
  { id: "middle", label: "Middle School", sub: "Class 6th to 8th" },
  { id: "matric", label: "Matriculation", sub: "9th & 10th Class" },
  { id: "college", label: "Intermediate", sub: "11th & 12th (FSc/ICS)" },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onNavigateToPDFs }) => {
  const { files, tasks, setIsVoiceModalOpen, tr } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [selectedClassBand, setSelectedClassBand] = useState<string>("college");
  const [revealedDailyAnswer, setRevealedDailyAnswer] = useState<boolean>(false);

  // Read saved progress metrics (Isolated per user account - starts at 0 for new account)
  const studyStreak = getUserItem<number>(currentUser?.id, "study_streak", 0);
  const savedLecturesCount = getUserItem<string[]>(currentUser?.id, "saved_lectures", []).length;
  const watchedLecturesCount = getUserItem<string[]>(currentUser?.id, "watched_lectures", []).length;
  const savedVocabCount = getUserItem<string[]>(currentUser?.id, "dict_bookmarks", []).length;

  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* HERO WELCOME BANNER */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/40">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Pro Study Mind v2.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950 text-cyan-300 border border-indigo-800">
                Class 1st to 12th (All Subjects) + MDCAT & ECAT
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>{currentUser ? `Welcome back, ${currentUser.name.split(" ")[0]}!` : "Welcome to"}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300">
                {currentUser ? `(${currentUser.grade})` : "Pro Study Mind v2.0"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your comprehensive academic & AI study platform. Access <strong>1,000+ Class Notes with Mathematical Formulas</strong>, <strong>Video Lectures for Every Class</strong>, <strong>Educational Games Arena</strong>, <strong>Multilingual Academic Dictionary</strong>, and hands-free <strong>Ultra-Fast Voice Mode</strong>!
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Mic className="w-4 h-4 animate-pulse" /> Launch Voice Assistant
            </button>
            <button
              onClick={() => setActiveTab("dictionary")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <Languages className="w-4 h-4 text-cyan-400" /> Open Dictionary (اردو / پښتو / EN)
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 text-xs font-bold border border-indigo-700/60 transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-indigo-400" /> My Profile & Settings
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" /> Open Admin Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CLASS LEVEL SELECTOR & STUDENT STATS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Class Level Selector Tabs (7 Cols) */}
        <div className="md:col-span-7 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" /> Select Your Class Level:
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Personalized Syllabus
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CLASS_BANDS.map((band) => {
              const isSelected = selectedClassBand === band.id;
              return (
                <button
                  key={band.id}
                  onClick={() => setSelectedClassBand(band.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"
                  }`}
                >
                  <p className="text-xs font-bold truncate">{band.label}</p>
                  <p
                    className={`text-[10px] truncate ${
                      isSelected ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {band.sub}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Selected band:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {CLASS_BANDS.find((b) => b.id === selectedClassBand)?.label}
              </strong>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("pdfnotes")}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Open PDF Notes →
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("lectures")}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Watch Lectures →
              </button>
            </div>
          </div>
        </div>

        {/* Learning Stats (5 Cols) */}
        <div className="md:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-around gap-2">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{studyStreak} Days</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Study Streak</p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto">
              <GraduationCap className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{watchedLecturesCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Lectures Watched</p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{savedVocabCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Words Saved</p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">{completedTasksCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Done</p>
          </div>
        </div>
      </div>

      {/* PRIMARY QUICK LAUNCH CARDS (8 Core Features) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span className="uppercase tracking-wider">Quick Launch Study Modes:</span>
          <span>Click to launch any workspace feature</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Multilingual Dictionary */}
          <div
            onClick={() => setActiveTab("dictionary")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Languages className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 uppercase">
                  Multi-Language
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Academic Dictionary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Look up terms in Urdu, Pashto, Arabic & English with voice pronunciation.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
              <span>Open Dictionary</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Educational Games */}
          <div
            onClick={() => setActiveTab("games")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase">
                  14+ Game Types
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Educational Games Arena
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Speed Math, Chemical Lab, Tile Spelling, and Board Trivia duels.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Play Games & Win XP</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Board Video Lectures */}
          <div
            onClick={() => setActiveTab("lectures")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                  60+ Lectures
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Board Video Lectures
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Sabaq Foundation, ilmkidunya, PGC, and Campus.pk in Urdu & English.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Watch Lectures</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Original Verbatim PDF Notes Mode */}
          <div
            onClick={() => setActiveTab("pdfnotes")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                  Original PDFs
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  PDF Notes Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Read and download unmodified original PDF study notes published by the Admin for all classes.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Open PDF Notes Mode</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4B. AI Study Notes & Keys Generator */}
          <div
            onClick={() => (onNavigateToPDFs ? onNavigateToPDFs() : setActiveTab("pdfs"))}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileDown className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                  Instant PDF
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  AI Study Notes & Keys
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Enter any topic and generate printable study notes with tips and exam keys.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Generate Notes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. Academic Quiz Mode */}
          <div
            onClick={() => setActiveTab("quiz")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 uppercase">
                  AI Quiz
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Quiz & Flashcards
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Adaptive tests on any curriculum topic with immediate answers.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <span>Start Quiz</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. AI Media Studio */}
          <div
            onClick={() => setActiveTab("media")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 uppercase">
                  Diagrams & Video
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  AI Media Studio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Generate visual flowcharts, 3D diagrams, and video storyboards for study.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
              <span>Create Visuals</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 7. Voice Assistant */}
          <div
            onClick={() => setActiveTab("voicemode")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
                  Ultra-Fast
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Voice Communicator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Real-time spoken dialogue in Urdu, Pashto, or English with Danish AI.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Talk with Voice AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 8. Study Planner & Tasks */}
          <div
            onClick={() => setActiveTab("tasks")}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 uppercase">
                  Planner
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Tasks & Planner
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Track homework deadlines, board exam revision, and daily study targets.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
              <span>Manage Tasks</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION OF THE DAY BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 to-purple-950 text-white border border-indigo-700/40 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            High-Yield Academic Challenge:
          </span>
          <span className="text-[11px] font-mono text-indigo-300">
            FBISE & Provincial Boards
          </span>
        </div>

        <p className="text-sm sm:text-base font-bold leading-relaxed">
          "What is the mathematical relationship between the work done in a conservative gravitational field and a closed path?"
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {revealedDailyAnswer ? (
            <div className="p-3 rounded-2xl bg-indigo-950/80 border border-indigo-700 text-xs text-indigo-200">
              <strong>Answer:</strong> The total work done in a closed loop within a conservative field is exactly <strong>zero (∮ F · dr = 0)</strong>, proving gravity is path-independent!
            </div>
          ) : (
            <button
              onClick={() => setRevealedDailyAnswer(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
            >
              Reveal Correct Answer
            </button>
          )}

          <button
            onClick={() => setActiveTab("quiz")}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <span>Practice 5 More Questions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
