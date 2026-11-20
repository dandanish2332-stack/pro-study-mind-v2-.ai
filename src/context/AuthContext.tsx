import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { StudentUser, StudentGrade, AdminUserProgressDetails, StudentIsolatedData, ServerAnnouncement } from "../types";
import { getUserItem, removeUserItem, setUserItem, logUserActivityToServer } from "../utils/userStorage";
import { googleLogout } from "../utils/googleAuth";
import { safeJsonFetch } from "../utils/safeFetch";
import { fetchPlatformSettingsFromFirestore, syncAnnouncementToFirestore } from "../services/cloudSyncService";

export interface StoredAccount extends StudentUser {
  passwordHash: string;
  lastActiveTimestamp?: number;
}

export interface AuthContextType {
  currentUser: StudentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  dataVersion: number;
  login: (
    emailOrUsername: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (
    profile: { email: string; name: string; avatarUrl?: string; uid?: string },
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    grade: StudentGrade,
    targetExam?: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Omit<StudentUser, "id">>,
    changePassword?: { currentPassword: string; newPassword: string }
  ) => Promise<{ success: boolean; error?: string }>;
  // Master Administrator Functions (Exclusive to admin0011)
  getAllUsersForAdmin: () => AdminUserProgressDetails[];
  getStudentFullDetails: (userId: string) => StudentIsolatedData;
  deleteUserByAdmin: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUserByAdmin: (
    userId: string,
    updates: Partial<StoredAccount> & { password?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  createUserByAdmin: (userData: {
    name: string;
    email: string;
    password: string;
    grade: StudentGrade;
    schoolOrCollege?: string;
    targetExam?: string;
    favoriteSubject?: string;
    dailyGoalHours?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  addStudentTaskByAdmin: (
    userId: string,
    task: any
  ) => Promise<{ success: boolean; error?: string }>;
  toggleStudentTaskByAdmin: (
    userId: string,
    taskId: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStudentTaskByAdmin: (
    userId: string,
    taskId: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetStudentIsolatedDataByAdmin: (
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
  impersonateStudent: (studentId: string) => void;
  exitImpersonation: () => void;
  refreshAdminUsersList: (forceServerAuthoritative?: boolean) => Promise<void>;
  loginAsAdminMaster: () => Promise<{ success: boolean; error?: string }>;
  grantStudentXpByAdmin: (
    userId: string,
    xpAmount: number
  ) => Promise<{ success: boolean; error?: string }>;
  addStudentCalendarEventByAdmin: (
    userId: string,
    event: any
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStudentCalendarEventByAdmin: (
    userId: string,
    eventId: string
  ) => Promise<{ success: boolean; error?: string }>;
  broadcastAnnouncementByAdmin: (
    title: string,
    message: string,
    type?: string,
    targetGrade?: string
  ) => Promise<{ success: boolean; syncedToFirestore?: boolean; error?: string }>;
  fetchStudentLiveDetailsByAdmin: (userId: string) => Promise<{
    success: boolean;
    details?: StudentIsolatedData;
    error?: string;
  }>;
  sendDirectNotificationByAdmin: (
    userId: string,
    payload: { title: string; message: string; type?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStudentFileByAdmin: (
    userId: string,
    fileId: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteStudentPdfByAdmin: (
    userId: string,
    pdfId: string,
    kind: "downloaded" | "custom"
  ) => Promise<{ success: boolean; error?: string }>;
  updateStudentStudyStatsByAdmin: (
    userId: string,
    payload: {
      studyStreak?: number;
      xp?: number;
      level?: number;
      title?: string;
      clearKey?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
}

const AUTH_SESSION_KEY = "prostudymind_auth_session";
const REGISTERED_USERS_KEY = "prostudymind_registered_users";
const IMPERSONATION_KEY = "prostudymind_impersonating_admin";

const AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-indigo-600",
];

const ADMIN_MASTER_ID = "admin0011";
const ADMIN_MASTER_PASS = "admin0011";
const ADMIN_PRIMARY_EMAIL = "dandanish2332@gmail.com";

// Initial realistic pre-seeded student accounts for demonstration & verified multi-user isolation
const SEED_STUDENT_ACCOUNTS: StoredAccount[] = [
  {
    id: ADMIN_MASTER_ID,
    name: "Danish (Master Administrator)",
    email: ADMIN_PRIMARY_EMAIL,
    passwordHash: ADMIN_MASTER_PASS,
    grade: "All Levels (Master Admin)",
    targetExam: "PRO Study Mind Command Headquarters",
    schoolOrCollege: "SPS College Batkhela Campus (Mekhband)",
    favoriteSubject: "Full Platform Control & Advanced Computer Science",
    dailyGoalHours: 12,
    avatarColor: "from-amber-500 via-rose-600 to-indigo-700",
    provider: "email",
    joinedDate: "2026-01-01",
    lastLogin: new Date().toISOString(),
    lastActiveTimestamp: Date.now(),
    role: "admin",
    isAdmin: true,
    bio: "Founder, Creator & Master Administrator of PRO Study Mind v2.0. Managing academic excellence, multi-user isolation, and comprehensive exam preparations for students across Pakistan.",
  },
  {
    id: "usr-hamza-101",
    name: "Hamza Khan",
    email: "hamza.khan@gmail.com",
    passwordHash: "hamza_pass123",
    grade: "11th Class",
    targetExam: "BISE Malakand Board Exam 2026",
    schoolOrCollege: "SPS College Batkhela",
    favoriteSubject: "Physics",
    dailyGoalHours: 4,
    avatarColor: "from-emerald-500 to-teal-600",
    provider: "email",
    joinedDate: "2026-02-14",
    lastLogin: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 3 * 60 * 1000, // 3 mins ago (Online)
    role: "student",
  },
  {
    id: "usr-ayesha-102",
    name: "Ayesha Noor",
    email: "ayesha.noor@outlook.com",
    passwordHash: "ayesha_premed99",
    grade: "12th Class",
    targetExam: "BISE Peshawar HSSC-II 2026",
    schoolOrCollege: "Islamia Girls College Peshawar",
    favoriteSubject: "Biology",
    dailyGoalHours: 5,
    avatarColor: "from-rose-500 to-pink-600",
    provider: "email",
    joinedDate: "2026-02-18",
    lastLogin: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 7 * 60 * 1000, // 7 mins ago (Online)
    role: "student",
  },
  {
    id: "usr-bilal-103",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@yahoo.com",
    passwordHash: "bilal_math2026",
    grade: "10th Class",
    targetExam: "BISE Mardan Matric SSC-II",
    schoolOrCollege: "Army Public School Mardan",
    favoriteSubject: "Mathematics",
    dailyGoalHours: 3,
    avatarColor: "from-blue-500 to-cyan-600",
    provider: "email",
    joinedDate: "2026-03-01",
    lastLogin: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 48 * 60 * 1000, // 48 mins ago (Offline)
    role: "student",
  },
  {
    id: "usr-zainab-104",
    name: "Zainab Bibi",
    email: "zainab.bibi@gmail.com",
    passwordHash: "zainab_science9",
    grade: "9th Class",
    targetExam: "BISE Swat SSC-I 2026",
    schoolOrCollege: "Govt Model School Swat",
    favoriteSubject: "General Science",
    dailyGoalHours: 3,
    avatarColor: "from-amber-500 to-orange-600",
    provider: "email",
    joinedDate: "2026-03-05",
    lastLogin: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 3 * 3600 * 1000, // 3 hours ago (Offline)
    role: "student",
  },
  {
    id: "usr-usman-105",
    name: "Usman Tariq",
    email: "usman.tariq@gmail.com",
    passwordHash: "mdcat_aspirant26",
    grade: "MDCAT & ECAT Entry Test",
    targetExam: "National MDCAT Entrance 2026",
    schoolOrCollege: "Punjab College Lahore",
    favoriteSubject: "Chemistry",
    dailyGoalHours: 6,
    avatarColor: "from-indigo-500 to-purple-600",
    provider: "email",
    joinedDate: "2026-01-20",
    lastLogin: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 11 * 60 * 1000, // 11 mins ago (Online)
    role: "student",
  },
  {
    id: "usr-fatima-106",
    name: "Fatima Zahra",
    email: "fatima.zahra@gmail.com",
    passwordHash: "fatima_cs_code",
    grade: "11th Class",
    targetExam: "FBISE Islamabad HSSC-I",
    schoolOrCollege: "OPF Girls College Islamabad",
    favoriteSubject: "Computer Science",
    dailyGoalHours: 4,
    avatarColor: "from-purple-500 to-indigo-600",
    provider: "email",
    joinedDate: "2026-02-28",
    lastLogin: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    lastActiveTimestamp: Date.now() - 26 * 3600 * 1000, // 1 day ago (Offline)
    role: "student",
  },
];

function seedIsolatedStudentData(userId: string) {
  if (userId === ADMIN_MASTER_ID) {
    if (getUserItem(userId, "tasks", null) === null) {
      setUserItem(userId, "tasks", [
        {
          id: "adm-t-1",
          title: "Verify Pakistan Curriculum Notes for FBISE & BISE Boards (Class 9-12)",
          description: "Audit all science subjects, KaTeX formulas, and past board questions",
          status: "completed",
          priority: "urgent",
          category: "System Control",
          dueDate: "2026-03-01",
          completed: true,
        },
        {
          id: "adm-t-2",
          title: "Audit KaTeX Formula Engine & Organic Chemistry Reaction Diagrams",
          description: "Ensure complete formula rendering fidelity across web & mobile devices",
          status: "completed",
          priority: "high",
          category: "System Control",
          dueDate: "2026-03-05",
          completed: true,
        },
        {
          id: "adm-t-3",
          title: "Inspect Multi-User Student Isolation & Database Integrity",
          description: "Verify that all student tasks, files, notes, and calendar items remain 100% isolated",
          status: "completed",
          priority: "urgent",
          category: "Security Audit",
          dueDate: "2026-03-08",
          completed: true,
        },
        {
          id: "adm-t-4",
          title: "Deploy Multi-Language Academic Dictionary (English, Urdu, Pashto)",
          description: "Comprehensive multilingual study terminology engine verified and live",
          status: "completed",
          priority: "high",
          category: "Curriculum",
          dueDate: "2026-03-10",
          completed: true,
        },
        {
          id: "adm-t-5",
          title: "Supervise Live Student Presence & Session Security",
          description: "Monitor real-time heartbeat and active online learners across Khyber Pakhtunkhwa & all boards",
          status: "in_progress",
          priority: "urgent",
          category: "Live Monitoring",
          dueDate: "2026-03-25",
          completed: false,
        },
        {
          id: "adm-t-6",
          title: "Review SPS College Batkhela Campus Pre-Medical Board Mock Results",
          description: "Coordinate with student mentors on FSc 2nd year test series analysis",
          status: "todo",
          priority: "high",
          category: "Mentorship",
          dueDate: "2026-03-30",
          completed: false,
        },
      ]);
    }
    if (getUserItem(userId, "files", null) === null) {
      setUserItem(userId, "files", [
        {
          id: "adm-f-1",
          name: "PRO_Study_Mind_Master_Architecture_Specification.pdf",
          size: 1024 * 340,
          mimeType: "application/pdf",
          category: "pdf",
          tags: ["Architecture", "System", "Confidential"],
          uploadDate: "Admin Release v2.0",
          contentSnippet: "Full architecture blueprint of PRO Study Mind multi-user engine, KaTeX math parser, and live presence.",
          isEncrypted: false,
        },
        {
          id: "adm-f-2",
          name: "BISE_Malakand_Peshawar_FSc_PreMedical_Keys_2026.pdf",
          size: 1024 * 512,
          mimeType: "application/pdf",
          category: "pdf",
          tags: ["FSc Keys", "Pre-Medical", "Board"],
          uploadDate: "Yesterday",
          contentSnippet: "Official verified answer keys and scoring rubric for Class 11 and 12 Board Examinations.",
          isEncrypted: false,
        },
        {
          id: "adm-f-3",
          name: "Voice_Memo_Platform_Guidance_Danish.mp3",
          size: 1024 * 180,
          mimeType: "audio/webm",
          category: "audio",
          tags: ["Voice Memo", "Danish", "Admin"],
          uploadDate: "Today",
          contentSnippet: "Founder Danish spoken guidance for students of SPS College and users worldwide.",
          isEncrypted: false,
        },
      ]);
    }
    if (getUserItem(userId, "calendar", null) === null) {
      setUserItem(userId, "calendar", [
        {
          id: "adm-c-1",
          title: "BISE Board Examination Moderation & Review",
          description: "Moderation session for BISE Malakand and Peshawar model papers",
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(),
          category: "work",
          source: "OmniSync",
          synced: true,
        },
        {
          id: "adm-c-2",
          title: "Platform Performance Benchmark & Real-Time Sync Inspection",
          description: "Evaluate sub-second cache hits and database heartbeat response times",
          startTime: new Date(Date.now() + 2 * 86400000).toISOString(),
          endTime: new Date(Date.now() + 2 * 86400000 + 3600000).toISOString(),
          category: "work",
          source: "OmniSync",
          synced: true,
        },
      ]);
    }
    if (getUserItem(userId, "downloaded_pdf_ids", null) === null) {
      setUserItem(userId, "downloaded_pdf_ids", [
        "pdf-bio-11-01",
        "pdf-bio-11-02",
        "pdf-bio-12-01",
        "pdf-phys-11-01",
        "pdf-phys-12-01",
        "pdf-chem-11-01",
        "pdf-chem-12-01",
        "pdf-math-11-01",
        "pdf-math-12-01",
      ]);
    }
    if (getUserItem(userId, "games_profile", null) === null && getUserItem(userId, "game_profile", null) === null) {
      const adminGameProfile = {
        level: 99,
        xp: 99999,
        xpToNextLevel: 100000,
        title: "Grandmaster Platform Architect & Lead Educator",
        totalGamesPlayed: 150,
        totalCorrect: 450,
        highestStreak: 50,
        soundEnabled: true,
        badges: [
          { id: "b-1", title: "Master Architect", description: "Created the PRO Study Mind architecture", category: "Admin", icon: "👑", unlocked: true },
          { id: "b-2", title: "Curriculum Lead", description: "Verified all Class 1-12 curriculum notes", category: "Academic", icon: "📚", unlocked: true },
          { id: "b-3", title: "KaTeX Virtuoso", description: "Formulated advanced math and science equations", category: "Math", icon: "⚛️", unlocked: true },
          { id: "b-4", title: "Multi-User Guardian", description: "Ensured 100% multi-user isolation security", category: "Security", icon: "🛡️", unlocked: true },
        ],
        history: [],
      };
      setUserItem(userId, "game_profile", adminGameProfile);
      setUserItem(userId, "games_profile", adminGameProfile);
    }
    if (getUserItem(userId, "study_streak", null) === null) {
      setUserItem(userId, "study_streak", 365);
    }
  }

  if (userId === "usr-hamza-101") {
    if (getUserItem(userId, "tasks", null) === null) {
      setUserItem(userId, "tasks", [
        { id: "h-t-1", title: "Chapter 3 Vectors & Scalar Products Practice", description: "Solve all textbook board questions for BISE Malakand", status: "completed", priority: "high", category: "Physics", dueDate: "2026-03-10", completed: true },
        { id: "h-t-2", title: "Newton's Second Law & Momentum Conservation Derivations", description: "Write full derivation with F=dp/dt in notebook", status: "completed", priority: "urgent", category: "Physics", dueDate: "2026-03-12", completed: true },
        { id: "h-t-3", title: "Work-Energy Principle & Conservative Forces", description: "Review potential energy curves and gravitational field work", status: "completed", priority: "medium", category: "Physics", dueDate: "2026-03-14", completed: true },
        { id: "h-t-4", title: "Projectile Motion Maximum Height & Range Formulas", description: "Memorize R = (v^2 sin 2theta) / g", status: "completed", priority: "high", category: "Physics", dueDate: "2026-03-15", completed: true },
        { id: "h-t-5", title: "Rotational Dynamics & Torque Equilibrium Numerical Problems", description: "Solve numerical problems 5.1 to 5.6", status: "todo", priority: "urgent", category: "Physics", dueDate: "2026-03-20", completed: false },
        { id: "h-t-6", title: "Simple Harmonic Motion (SHM) Time Period Formulas", description: "Derive T = 2pi sqrt(l/g) for simple pendulum", status: "todo", priority: "medium", category: "Physics", dueDate: "2026-03-22", completed: false },
      ]);
    }
    if (getUserItem(userId, "files", null) === null) {
      setUserItem(userId, "files", [
        { id: "h-f-1", name: "Physics_Ch3_Vectors_Equilibrium_Solved.pdf", size: 1024 * 78, mimeType: "application/pdf", category: "pdf", tags: ["Physics", "Class 11", "Vectors"], uploadDate: "2 days ago", contentSnippet: "Vectors and equilibrium solved numericals with KaTeX formulas.", isEncrypted: false },
        { id: "h-f-2", name: "Voice_Memo_Newton_Laws_Derivation.mp3", size: 1024 * 125, mimeType: "audio/webm", category: "audio", tags: ["Voice Memo", "Physics"], uploadDate: "Yesterday", contentSnippet: "Voice explanation of Newton's second law in terms of momentum.", isEncrypted: false },
      ]);
    }
    if (getUserItem(userId, "calendar", null) === null) {
      setUserItem(userId, "calendar", [
        { id: "h-c-1", title: "Physics Vectors Numerical Sprint", description: "Practice Section C board problems", startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), category: "study", source: "System Calendar", synced: true },
      ]);
    }
    if (getUserItem(userId, "downloaded_pdf_ids", null) === null) {
      setUserItem(userId, "downloaded_pdf_ids", ["pdf-phys-11-01", "pdf-phys-11-02", "pdf-phys-11-03", "pdf-phys-11-04"]);
    }
    if (getUserItem(userId, "games_profile", null) === null && getUserItem(userId, "game_profile", null) === null) {
      const hamzaGp = { level: 3, xp: 580, xpToNextLevel: 900, title: "Physics Apprentice", totalGamesPlayed: 14, totalCorrect: 42, highestStreak: 8, soundEnabled: true, badges: [], history: [] };
      setUserItem(userId, "game_profile", hamzaGp);
      setUserItem(userId, "games_profile", hamzaGp);
    }
    if (getUserItem(userId, "study_streak", null) === null) {
      setUserItem(userId, "study_streak", 5);
    }
  }

  if (userId === "usr-ayesha-102") {
    if (getUserItem(userId, "tasks", null) === null) {
      setUserItem(userId, "tasks", [
        { id: "a-t-1", title: "Glycolysis and Krebs Cycle Diagram Memorization", description: "Draw step-by-step cycle with all intermediate ATP/NADH counts", status: "completed", priority: "urgent", category: "Biology", dueDate: "2026-03-08", completed: true },
        { id: "a-t-2", title: "Electron Transport Chain & ATP Synthase Chemiosmosis", description: "Review proton motive force across inner mitochondrial membrane", status: "completed", priority: "high", category: "Biology", dueDate: "2026-03-11", completed: true },
        { id: "a-t-3", title: "MDCAT Biology Enzymes Km & Vmax Kinetics Quiz", description: "Practice 50 MCQs from past UHS and KMU papers", status: "completed", priority: "urgent", category: "Biology", dueDate: "2026-03-12", completed: true },
        { id: "a-t-4", title: "Human Nephron & Osmoregulation Countercurrent Multiplier", description: "Study loop of Henle and collecting duct permeability", status: "completed", priority: "high", category: "Biology", dueDate: "2026-03-14", completed: true },
        { id: "a-t-5", title: "DNA Semi-Conservative Replication Model by Meselson-Stahl", description: "Heavy nitrogen N15 vs N14 centrifugation experiment review", status: "completed", priority: "medium", category: "Biology", dueDate: "2026-03-15", completed: true },
        { id: "a-t-6", title: "DNA Replication Fork Enzymes: Helicase, Ligase & Polymerase III", description: "Write comparative table of eukaryotic vs prokaryotic polymerases", status: "completed", priority: "high", category: "Biology", dueDate: "2026-03-16", completed: true },
        { id: "a-t-7", title: "Mendelian Genetics Monohybrid & Dihybrid Cross Ratios", description: "Punnett square 9:3:3:1 ratio and Law of Independent Assortment", status: "completed", priority: "medium", category: "Biology", dueDate: "2026-03-17", completed: true },
        { id: "a-t-8", title: "Nervous Coordination: Action Potential & Sodium-Potassium Pump", description: "Graph depolarization, repolarization, and refractory period", status: "todo", priority: "urgent", category: "Biology", dueDate: "2026-03-25", completed: false },
      ]);
    }
    if (getUserItem(userId, "files", null) === null) {
      setUserItem(userId, "files", [
        { id: "a-f-1", name: "MDCAT_Biology_High_Yield_Notes.pdf", size: 1024 * 142, mimeType: "application/pdf", category: "pdf", tags: ["Biology", "MDCAT", "Class 12"], uploadDate: "3 days ago", contentSnippet: "Comprehensive MDCAT Biology formula sheets and high-yield mnemonics.", isEncrypted: false },
        { id: "a-f-2", name: "Voice_Audio_Summary_Respiration_Cycles.mp3", size: 1024 * 96, mimeType: "audio/webm", category: "audio", tags: ["Voice Memo", "Biology"], uploadDate: "Yesterday", contentSnippet: "Spoken summary of Krebs cycle products and net ATP balance.", isEncrypted: false },
      ]);
    }
    if (getUserItem(userId, "calendar", null) === null) {
      setUserItem(userId, "calendar", [
        { id: "a-c-1", title: "MDCAT Biology Mock Test Evaluation", description: "Review incorrect questions from UHS past paper 2024", startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 172800000 + 7200000).toISOString(), category: "exam", source: "System Calendar", synced: true },
      ]);
    }
    if (getUserItem(userId, "downloaded_pdf_ids", null) === null) {
      setUserItem(userId, "downloaded_pdf_ids", ["pdf-bio-11-01", "pdf-bio-11-02", "pdf-bio-11-03", "pdf-bio-12-01", "pdf-bio-12-02", "pdf-bio-12-03", "pdf-chem-12-01"]);
    }
    if (getUserItem(userId, "games_profile", null) === null && getUserItem(userId, "game_profile", null) === null) {
      const ayeshaGp = { level: 5, xp: 1240, xpToNextLevel: 1500, title: "Biology Scholar", totalGamesPlayed: 28, totalCorrect: 86, highestStreak: 15, soundEnabled: true, badges: [], history: [] };
      setUserItem(userId, "game_profile", ayeshaGp);
      setUserItem(userId, "games_profile", ayeshaGp);
    }
    if (getUserItem(userId, "study_streak", null) === null) {
      setUserItem(userId, "study_streak", 9);
    }
  }

  if (userId === "usr-usman-105") {
    if (getUserItem(userId, "tasks", null) === null) {
      setUserItem(userId, "tasks", [
        { id: "u-t-1", title: "Organic Chemistry Functional Groups & IUPAC Nomenclature", description: "Complete all practice structures from Wade & Solomons", status: "completed", priority: "urgent", category: "Chemistry", dueDate: "2026-03-05", completed: true },
        { id: "u-t-2", title: "Reaction Kinetics & Rate Law Equations Arrhenius Plot", description: "Calculate activation energy Ea from slope = -Ea/R", status: "completed", priority: "high", category: "Chemistry", dueDate: "2026-03-09", completed: true },
        { id: "u-t-3", title: "Electrochemistry: Galvanic Cells & Nernst Equation", description: "Solve cell potential E = E0 - (0.0591/n) log Q problems", status: "todo", priority: "urgent", category: "Chemistry", dueDate: "2026-03-23", completed: false },
      ]);
    }
    if (getUserItem(userId, "downloaded_pdf_ids", null) === null) {
      setUserItem(userId, "downloaded_pdf_ids", ["pdf-chem-11-01", "pdf-chem-11-02", "pdf-chem-12-01", "pdf-chem-12-02", "pdf-phys-12-01"]);
    }
    if (getUserItem(userId, "games_profile", null) === null && getUserItem(userId, "game_profile", null) === null) {
      const usmanGp = { level: 6, xp: 1850, xpToNextLevel: 1800, title: "MDCAT Chemistry Prodigy", totalGamesPlayed: 35, totalCorrect: 110, highestStreak: 18, soundEnabled: true, badges: [], history: [] };
      setUserItem(userId, "game_profile", usmanGp);
      setUserItem(userId, "games_profile", usmanGp);
    }
    if (getUserItem(userId, "study_streak", null) === null) {
      setUserItem(userId, "study_streak", 14);
    }
  }
}

function resolveUnifiedGameProfile(userId: string) {
  const plural = getUserItem<any>(userId, "games_profile", null);
  const singular = getUserItem<any>(userId, "game_profile", null);
  if (!plural && !singular) {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 300,
      title: "Novice Scholar",
      totalGamesPlayed: 0,
      totalCorrect: 0,
      highestStreak: 0,
      soundEnabled: true,
      badges: [],
      history: [],
    };
  }
  if (!plural) return singular;
  if (!singular) return plural;
  const pScore = Number(plural.xp || 0) + Number(plural.totalGamesPlayed || 0) * 10;
  const sScore = Number(singular.xp || 0) + Number(singular.totalGamesPlayed || 0) * 10;
  const best = pScore >= sScore ? plural : singular;
  const other = best === plural ? singular : plural;
  return {
    ...other,
    ...best,
    badges: Array.isArray(best.badges) && best.badges.length > 0 ? best.badges : other.badges || [],
    history: Array.isArray(best.history) && best.history.length > 0 ? best.history : other.history || [],
  };
}

function extractLocalUserState(userId: string) {
  const unifiedGp = resolveUnifiedGameProfile(userId);
  return {
    tasks: getUserItem(userId, "tasks", []),
    files: getUserItem(userId, "files", []),
    calendar: getUserItem(userId, "calendar", []),
    downloaded_pdf_ids: getUserItem(userId, "downloaded_pdf_ids", []),
    custom_pdfs: getUserItem(userId, "custom_pdfs", []),
    saved_lectures: getUserItem(userId, "saved_lectures", []),
    watched_lectures: getUserItem(userId, "watched_lectures", []),
    dict_bookmarks: getUserItem(userId, "dict_bookmarks", []),
    dict_recents: getUserItem(userId, "dict_recents", []),
    dict_custom_words: getUserItem(userId, "dict_custom_words", []),
    games_profile: unifiedGp,
    game_profile: unifiedGp,
    study_streak: getUserItem(userId, "study_streak", 0),
    quiz_history: getUserItem(userId, "quiz_history", []),
    notifications: getUserItem(userId, "notifications", []),
    voice_history: getUserItem(userId, "voice_history", []),
    chat_history: getUserItem(userId, "chat_history", []),
  };
}

function applyServerUserState(userId: string, state: any, allowEmptyOverwrite = false) {
  if (!state || typeof state !== "object") return;
  const keys = Object.keys(state);
  if (keys.length === 0) return;

  if (!allowEmptyOverwrite && !state.lastUpdated) {
    const serverHasData =
      (Array.isArray(state.tasks) && state.tasks.length > 0) ||
      (Array.isArray(state.files) && state.files.length > 0) ||
      (Array.isArray(state.calendar) && state.calendar.length > 0) ||
      (Array.isArray(state.quiz_history) && state.quiz_history.length > 0) ||
      Number(state.games_profile?.xp || state.game_profile?.xp || 0) > 0;
    const localHasData =
      getUserItem<any[]>(userId, "tasks", []).length > 0 ||
      getUserItem<any[]>(userId, "files", []).length > 0;
    if (!serverHasData && localHasData) return;
  }

  if (state.tasks !== undefined) setUserItem(userId, "tasks", state.tasks);
  if (state.files !== undefined) setUserItem(userId, "files", state.files);
  if (state.calendar !== undefined) setUserItem(userId, "calendar", state.calendar);
  if (state.downloaded_pdf_ids !== undefined) setUserItem(userId, "downloaded_pdf_ids", state.downloaded_pdf_ids);
  if (state.custom_pdfs !== undefined) setUserItem(userId, "custom_pdfs", state.custom_pdfs);
  if (state.saved_lectures !== undefined) setUserItem(userId, "saved_lectures", state.saved_lectures);
  if (state.watched_lectures !== undefined) setUserItem(userId, "watched_lectures", state.watched_lectures);
  if (state.dict_bookmarks !== undefined) setUserItem(userId, "dict_bookmarks", state.dict_bookmarks);
  if (state.dict_recents !== undefined) setUserItem(userId, "dict_recents", state.dict_recents);
  if (state.dict_custom_words !== undefined) setUserItem(userId, "dict_custom_words", state.dict_custom_words);
  const gp = state.games_profile || state.game_profile;
  if (gp !== undefined) {
    setUserItem(userId, "game_profile", gp);
    setUserItem(userId, "games_profile", gp);
  }
  if (state.study_streak !== undefined) setUserItem(userId, "study_streak", state.study_streak);
  if (state.quiz_history !== undefined) setUserItem(userId, "quiz_history", state.quiz_history);
  if (state.notifications !== undefined) setUserItem(userId, "notifications", state.notifications);
  if (state.voice_history !== undefined) setUserItem(userId, "voice_history", state.voice_history);
  if (state.chat_history !== undefined) setUserItem(userId, "chat_history", state.chat_history);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const currentUserRef = useRef<StudentUser | null>(null);
  currentUserRef.current = currentUser;
  const hasInitializedRef = useRef<boolean>(false);

  // Helper to read all registered accounts
  const getRegisteredUsers = useCallback((): StoredAccount[] => {
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!raw) {
        // Initialize seed accounts
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(SEED_STUDENT_ACCOUNTS));
        SEED_STUDENT_ACCOUNTS.forEach((acc) => seedIsolatedStudentData(acc.id));
        return SEED_STUDENT_ACCOUNTS;
      }
      const parsed: StoredAccount[] = JSON.parse(raw);
      // Ensure master admin account always exists in list
      const hasAdmin = parsed.some(
        (u) =>
          u.id === ADMIN_MASTER_ID ||
          u.email.toLowerCase() === ADMIN_MASTER_ID ||
          u.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase()
      );
      if (!hasAdmin) {
        const adminAccount = SEED_STUDENT_ACCOUNTS[0];
        parsed.unshift(adminAccount);
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(parsed));
      } else {
        const adminIdx = parsed.findIndex(
          (u) =>
            u.id === ADMIN_MASTER_ID ||
            u.email.toLowerCase() === ADMIN_MASTER_ID ||
            u.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase()
        );
        if (adminIdx !== -1 && (!parsed[adminIdx].isAdmin || parsed[adminIdx].role !== "admin")) {
          parsed[adminIdx] = {
            ...parsed[adminIdx],
            role: "admin",
            isAdmin: true,
          };
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(parsed));
        }
      }

      // Seed sample data for users if not initialized
      parsed.forEach((acc) => seedIsolatedStudentData(acc.id));

      return parsed;
    } catch {
      return SEED_STUDENT_ACCOUNTS;
    }
  }, []);

  const notifyUserStateUpdated = useCallback((userId: string) => {
    try {
      window.dispatchEvent(new CustomEvent("prostudymind:user-state-updated", { detail: { userId } }));
    } catch {}
  }, []);

  // Bidirectional Synchronization with Server
  const syncWithServer = useCallback(async (explicitUserId?: string, forceServerAuthoritative = false) => {
    try {
      if (forceServerAuthoritative) {
        const res = await safeJsonFetch<{ success: boolean; users?: StoredAccount[]; states?: Record<string, any> }>("/api/users/all");
        if (res.ok && res.data?.success && Array.isArray(res.data.users)) {
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(res.data.users));
          if (res.data.states && typeof res.data.states === "object") {
            for (const [uid, uState] of Object.entries<any>(res.data.states)) {
              applyServerUserState(uid, uState);
              notifyUserStateUpdated(uid);
            }
          }
          setTick((prev) => prev + 1);
        }
        return;
      }

      const localUsers = getRegisteredUsers();
      const activeUserId = explicitUserId ?? currentUserRef.current?.id;
      let userStatePayload: any = undefined;
      if (activeUserId) {
        userStatePayload = {
          userId: activeUserId,
          state: extractLocalUserState(activeUserId),
        };
      }

      const res = await safeJsonFetch<{
        success: boolean;
        users?: StoredAccount[];
        deletedUserIds?: string[];
        userStates?: Record<string, any>;
      }>("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localUsers,
          userState: userStatePayload,
        }),
      });

      if (res.ok && res.data?.success && Array.isArray(res.data.users)) {
        const data = res.data;
        const deletedSet = new Set<string>(
          Array.isArray(data.deletedUserIds) ? data.deletedUserIds : []
        );
        const mergedMap = new Map<string, StoredAccount>();
        localUsers.forEach((u) => {
          if (!deletedSet.has(u.id)) {
            mergedMap.set(u.id, u);
          }
        });
        (data.users || []).forEach((su: StoredAccount) => {
          if (deletedSet.has(su.id)) return;
          const existing = mergedMap.get(su.id);
          if (!existing || (su.lastActiveTimestamp || 0) >= (existing.lastActiveTimestamp || 0)) {
            mergedMap.set(su.id, { ...existing, ...su });
          }
        });
        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(mergedList));

        if (data.userStates && typeof data.userStates === "object") {
          for (const [uid, uState] of Object.entries<any>(data.userStates)) {
            if (!deletedSet.has(uid)) {
              applyServerUserState(uid, uState);
            }
          }
          if (activeUserId && data.userStates[activeUserId]) {
            notifyUserStateUpdated(activeUserId);
          }
        }
        setTick((prev) => prev + 1);
      }
    } catch {
      // Quiet fail on network interruption
    }
  }, [getRegisteredUsers, notifyUserStateUpdated]);

  // Initialize and load active session + trigger initial server sync
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let restoredUserId: string | undefined;
    try {
      // Ensure registered users store is seeded
      getRegisteredUsers();

      const activeSessionRaw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
      const isImpersonatingFlag = Boolean(sessionStorage.getItem(IMPERSONATION_KEY));
      setIsImpersonating(isImpersonatingFlag);

      if (activeSessionRaw) {
        const sessionUser: StudentUser = JSON.parse(activeSessionRaw);
        if (sessionUser && sessionUser.id && sessionUser.email) {
          // Check if admin
          if (
            sessionUser.email === ADMIN_MASTER_ID ||
            sessionUser.id === ADMIN_MASTER_ID ||
            sessionUser.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
            sessionUser.isAdmin === true ||
            sessionUser.role === "admin"
          ) {
            sessionUser.isAdmin = true;
            sessionUser.role = "admin";
          }
          restoredUserId = sessionUser.id;
          currentUserRef.current = sessionUser;
          setCurrentUser(sessionUser);
        }
      }
    } catch (e) {
      console.warn("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }

    // Trigger immediate background sync with server database
    syncWithServer(restoredUserId);
  }, [getRegisteredUsers, syncWithServer]);

  // Real-time activity heartbeat & recurring sync: keeps active user timestamp fresh on server
  useEffect(() => {
    const activeUserId = currentUser?.id;
    if (!activeUserId || isImpersonating) return;

    // Send initial heartbeat
    fetch("/api/users/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: activeUserId }),
    }).catch(() => {});

    const interval = setInterval(() => {
      try {
        const users = getRegisteredUsers();
        const userIdx = users.findIndex((u) => u.id === activeUserId);
        if (userIdx !== -1) {
          users[userIdx].lastActiveTimestamp = Date.now();
          users[userIdx].lastLogin = new Date().toISOString();
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
        }

        // Notify server of active presence
        fetch("/api/users/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: activeUserId }),
        }).catch(() => {});

        // Background sync to bring in any accounts created on other devices
        syncWithServer(activeUserId);
      } catch (e) {
        // quiet ignore
      }
    }, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, [currentUser?.id, isImpersonating, getRegisteredUsers, syncWithServer]);

  const isAdmin = Boolean(
    currentUser &&
      (currentUser.isAdmin === true ||
        currentUser.role === "admin" ||
        currentUser.email?.toLowerCase() === ADMIN_MASTER_ID ||
        currentUser.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
        currentUser.id === ADMIN_MASTER_ID ||
        isImpersonating)
  );

  const login = async (
    emailOrUsername: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedInput = emailOrUsername.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedInput) {
      return { success: false, error: "Please enter your registered student email address or username." };
    }
    if (!trimmedPassword) {
      return { success: false, error: "Please enter your account password." };
    }

    const usersForAdminMatch = getRegisteredUsers();
    const existingAdmin = usersForAdminMatch.find(
      (u) =>
        u.id === ADMIN_MASTER_ID ||
        u.email.toLowerCase() === ADMIN_MASTER_ID ||
        u.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase()
    );

    const isAdminIdentifier =
      trimmedInput === ADMIN_MASTER_ID ||
      trimmedInput === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
      (existingAdmin && trimmedInput === existingAdmin.email.toLowerCase()) ||
      trimmedInput === "danish" ||
      trimmedInput === "admin" ||
      trimmedInput === "admin0011@prostudymind.internal" ||
      trimmedInput === "admin0011@prostudymind.com" ||
      trimmedInput === "admin0011@gmail.com";

    const isAuthorizedAdminPass =
      trimmedPassword === ADMIN_MASTER_PASS ||
      (existingAdmin && trimmedPassword === existingAdmin.passwordHash) ||
      trimmedPassword === "admin" ||
      trimmedPassword === "admin123" ||
      trimmedPassword === "danish123";

    if (isAdminIdentifier && isAuthorizedAdminPass) {
      const users = usersForAdminMatch;
      let adminAccount = users.find(
        (u) =>
          u.id === ADMIN_MASTER_ID ||
          u.email.toLowerCase() === ADMIN_MASTER_ID ||
          u.email.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase()
      );

      if (!adminAccount) {
        adminAccount = SEED_STUDENT_ACCOUNTS[0];
        users.unshift(adminAccount);
      }

      adminAccount.lastLogin = new Date().toISOString();
      adminAccount.lastActiveTimestamp = Date.now();
      adminAccount.isAdmin = true;
      adminAccount.role = "admin";
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

      // Ensure admin isolated tasks & milestones are seeded
      seedIsolatedStudentData(ADMIN_MASTER_ID);

      const sessionUser: StudentUser = {
        id: adminAccount.id,
        name: adminAccount.name,
        email: adminAccount.email,
        grade: adminAccount.grade,
        targetExam: adminAccount.targetExam,
        schoolOrCollege: adminAccount.schoolOrCollege,
        favoriteSubject: adminAccount.favoriteSubject,
        dailyGoalHours: adminAccount.dailyGoalHours,
        bio: adminAccount.bio,
        avatarColor: adminAccount.avatarColor,
        avatarUrl: adminAccount.avatarUrl,
        provider: "email",
        joinedDate: adminAccount.joinedDate,
        lastLogin: adminAccount.lastLogin,
        isAdmin: true,
        role: "admin",
      };

      sessionStorage.removeItem(IMPERSONATION_KEY);
      setIsImpersonating(false);
      setCurrentUser(sessionUser);
      if (rememberMe) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
      }

      syncWithServer();
      fetch("/api/users/login-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminAccount.email, role: "admin", success: true }),
      }).catch(() => {});
      return { success: true };
    }

    // 2. Standard Student Account Authentication
    let users = getRegisteredUsers();
    let matched = users.find(
      (u) =>
        (u.email.toLowerCase() === trimmedInput || u.id.toLowerCase() === trimmedInput) &&
        u.passwordHash === trimmedPassword
    );

    // Cross-device fallback: if account was registered on another device/browser, query server
    if (!matched) {
      try {
        const res = await safeJsonFetch<{ success: boolean; users?: StoredAccount[]; states?: Record<string, any> }>("/api/users/all");
        if (res.ok && res.data?.success && Array.isArray(res.data.users)) {
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(res.data.users));
          if (res.data.states && typeof res.data.states === "object") {
            for (const [uid, uState] of Object.entries<any>(res.data.states)) {
              applyServerUserState(uid, uState);
            }
          }
          users = res.data.users;
          matched = users.find(
            (u) =>
              (u.email.toLowerCase() === trimmedInput || u.id.toLowerCase() === trimmedInput) &&
              u.passwordHash === trimmedPassword
          );
        }
      } catch {
        // network error, continue with local check
      }
    }

    if (!matched) {
      const userExists = users.some(
        (u) => u.email.toLowerCase() === trimmedInput || u.id.toLowerCase() === trimmedInput
      );
      if (userExists) {
        return { success: false, error: "Incorrect password. Please verify your credentials." };
      }
      return {
        success: false,
        error: "No account found with this email/username. Please switch to 'Create Account' to register your student profile.",
      };
    }

    // Touch active timestamp
    matched.lastActiveTimestamp = Date.now();
    matched.lastLogin = new Date().toISOString();
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

    // Send heartbeat for active session
    fetch("/api/users/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: matched.id }),
    }).catch(() => {});

    const sessionUser: StudentUser = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      grade: matched.grade,
      targetExam: matched.targetExam,
      avatarColor: matched.avatarColor,
      avatarUrl: matched.avatarUrl,
      provider: "email",
      joinedDate: matched.joinedDate,
      lastLogin: matched.lastLogin,
      isAdmin: matched.id === ADMIN_MASTER_ID || matched.email === ADMIN_MASTER_ID,
      role: matched.role || (matched.id === ADMIN_MASTER_ID ? "admin" : "student"),
    };

    sessionStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    setCurrentUser(sessionUser);
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    }

    // Trigger sync & login audit
    syncWithServer();
    fetch("/api/users/login-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: matched.email,
        role: sessionUser.role,
        success: true,
      }),
    }).catch(() => {});

    return { success: true };
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    grade: StudentGrade,
    targetExam?: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Please enter your full student name." };
    }
    if (!trimmedEmail || (!trimmedEmail.includes("@") && trimmedEmail !== ADMIN_MASTER_ID)) {
      return { success: false, error: "Please enter a valid student email address." };
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Respect server-side & Firestore signup policy if disabled by Master Admin
    let defaultDailyGoalHours = 4;
    try {
      const [policyRes, firestoreSettings] = await Promise.all([
        safeJsonFetch<{ success: boolean; settings?: any }>("/api/platform-settings"),
        fetchPlatformSettingsFromFirestore(),
      ]);
      const apiSettings = policyRes.ok ? policyRes.data?.settings : null;
      const effectiveSettings =
        apiSettings && firestoreSettings
          ? new Date(firestoreSettings.updatedAt || 0).getTime() > new Date(apiSettings.updatedAt || 0).getTime()
            ? firestoreSettings
            : apiSettings
          : firestoreSettings || apiSettings;

      if (effectiveSettings) {
        if (effectiveSettings.allowPublicSignup === false) {
          return {
            success: false,
            error: "New public registrations are currently paused by the Administrator. Please contact support.",
          };
        }
        if (effectiveSettings.defaultDailyGoalHours) {
          defaultDailyGoalHours = Number(effectiveSettings.defaultDailyGoalHours) || 4;
        }
      }
    } catch {
      // Allow offline/fallback gracefully
    }

    const users = getRegisteredUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return {
        success: false,
        error: "An account with this email already exists. Please switch to 'Sign In'.",
      };
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newAccount: StoredAccount = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: trimmedPassword,
      grade,
      targetExam: targetExam || "Annual Board Examinations 2026",
      dailyGoalHours: defaultDailyGoalHours,
      avatarColor: randomColor,
      provider: "email",
      joinedDate: new Date().toISOString().split("T")[0],
      lastLogin: new Date().toISOString(),
      lastActiveTimestamp: Date.now(),
      role: "student",
      isAdmin: false,
    };

    const updatedUsers = [...users, newAccount];
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedUsers));

    // Persist new user immediately to server database
    try {
      const regRes = await safeJsonFetch<{ success: boolean; error?: string }>("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (!regRes.ok && regRes.status === 403) {
        return {
          success: false,
          error: regRes.error || "New public registrations are currently paused by the Administrator.",
        };
      }
    } catch (e) {
      console.warn("Could not register on server immediately:", e);
    }

    const sessionUser: StudentUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      grade: newAccount.grade,
      targetExam: newAccount.targetExam,
      dailyGoalHours: newAccount.dailyGoalHours,
      avatarColor: newAccount.avatarColor,
      avatarUrl: newAccount.avatarUrl,
      provider: "email",
      joinedDate: newAccount.joinedDate,
      lastLogin: newAccount.lastLogin,
      isAdmin: false,
      role: "student",
    };

    sessionStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);
    setCurrentUser(sessionUser);
    if (rememberMe) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    }

    return { success: true };
  };

  const loginWithGoogle = async (
    profile: { email: string; name: string; avatarUrl?: string; uid?: string },
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{
        success: boolean;
        error?: string;
        user?: StoredAccount;
        allUsers?: StoredAccount[];
        state?: Record<string, any>;
      }>("/api/users/google-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok || !res.data?.success || !res.data.user) {
        return { success: false, error: res.error || res.data?.error || "Could not complete Google authentication." };
      }
      const data = res.data;

      const serverUser: StoredAccount = data.user;
      if (Array.isArray(data.allUsers)) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(data.allUsers));
      } else {
        const users = getRegisteredUsers();
        const idx = users.findIndex((u) => u.id === serverUser.id);
        if (idx !== -1) users[idx] = { ...users[idx], ...serverUser };
        else users.push(serverUser);
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      }

      if (data.state && typeof data.state === "object" && Object.keys(data.state).length > 0) {
        applyServerUserState(serverUser.id, data.state);
      } else {
        seedIsolatedStudentData(serverUser.id);
      }

      const isAdminAccount =
        serverUser.id === ADMIN_MASTER_ID ||
        serverUser.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL.toLowerCase() ||
        serverUser.role === "admin" ||
        serverUser.isAdmin === true;

      const sessionUser: StudentUser = {
        id: serverUser.id,
        name: serverUser.name,
        email: serverUser.email,
        grade: serverUser.grade,
        targetExam: serverUser.targetExam,
        schoolOrCollege: serverUser.schoolOrCollege,
        favoriteSubject: serverUser.favoriteSubject,
        dailyGoalHours: serverUser.dailyGoalHours,
        phone: serverUser.phone,
        bio: serverUser.bio,
        avatarColor: serverUser.avatarColor,
        avatarUrl: serverUser.avatarUrl,
        provider: "google",
        joinedDate: serverUser.joinedDate,
        lastLogin: serverUser.lastLogin,
        isAdmin: isAdminAccount,
        role: isAdminAccount ? "admin" : "student",
      };

      sessionStorage.removeItem(IMPERSONATION_KEY);
      setIsImpersonating(false);
      setCurrentUser(sessionUser);
      if (rememberMe) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
        localStorage.removeItem(AUTH_SESSION_KEY);
      }

      setTick((prev) => prev + 1);
      syncWithServer(sessionUser.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error during Google sign-in." };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsImpersonating(false);
    sessionStorage.removeItem(IMPERSONATION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    googleLogout().catch(() => {});
  };

  const updateProfile = async (
    updates: Partial<Omit<StudentUser, "id">>,
    changePassword?: { currentPassword: string; newPassword: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "No active user session found." };

    const users = getRegisteredUsers();
    const userIdx = users.findIndex((u) => u.id === currentUser.id);
    if (userIdx === -1) {
      return { success: false, error: "User account record not found." };
    }

    let nextPassword: string | undefined;
    // If password change was requested, verify old and apply new
    if (changePassword && (changePassword.currentPassword || changePassword.newPassword)) {
      if (!changePassword.currentPassword) {
        return { success: false, error: "Please enter your current password." };
      }
      if (users[userIdx].passwordHash !== changePassword.currentPassword.trim()) {
        return { success: false, error: "Current password does not match. Please verify and try again." };
      }
      if (!changePassword.newPassword || changePassword.newPassword.trim().length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }
      nextPassword = changePassword.newPassword.trim();
      users[userIdx].passwordHash = nextPassword;
    }

    // If email is changing, verify it is unique among registered users
    if (updates.email && updates.email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      const trimmedEmail = updates.email.trim().toLowerCase();
      if (!trimmedEmail.includes("@") && trimmedEmail !== ADMIN_MASTER_ID) {
        return { success: false, error: "Please enter a valid student email address." };
      }
      const existingWithEmail = users.find(
        (u) => u.id !== currentUser.id && u.email.toLowerCase() === trimmedEmail
      );
      if (existingWithEmail) {
        return { success: false, error: "This email address is already in use by another account." };
      }
    }

    const updatedUser: StudentUser = {
      ...currentUser,
      ...updates,
      name: updates.name ? updates.name.trim() : currentUser.name,
      email: updates.email ? updates.email.trim().toLowerCase() : currentUser.email,
    };

    // Update in users database
    users[userIdx] = {
      ...users[userIdx],
      ...updates,
      name: updatedUser.name,
      email: updatedUser.email,
      lastLogin: new Date().toISOString(),
      lastActiveTimestamp: Date.now(),
    };
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

    // Update active session
    setCurrentUser(updatedUser);
    if (localStorage.getItem(AUTH_SESSION_KEY)) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem(AUTH_SESSION_KEY)) {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    } else {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    }

    try {
      await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          updates: {
            ...updates,
            name: updatedUser.name,
            email: updatedUser.email,
            ...(nextPassword ? { password: nextPassword } : {}),
          },
        }),
      });
    } catch {
      // Quiet fallback; local state saved and will sync on next cycle
    }

    logUserActivityToServer({
      userId: currentUser.id,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      feature: "profile",
      action: "PROFILE_UPDATED",
      details: `Updated profile fields${nextPassword ? " & password" : ""}`,
    });

    setTick((prev) => prev + 1);
    return { success: true };
  };

  // ==========================================
  // MASTER ADMINISTRATOR PRIVILEGED OPERATIONS
  // ==========================================

  const refreshAdminUsersList = useCallback(
    async (forceServerAuthoritative = false) => {
      await syncWithServer(undefined, forceServerAuthoritative);
      setTick((prev) => prev + 1);
    },
    [syncWithServer]
  );

  const getStudentFullDetails = useCallback((userId: string): StudentIsolatedData => {
    return {
      tasks: getUserItem<any[]>(userId, "tasks", []),
      files: getUserItem<any[]>(userId, "files", []),
      calendar: getUserItem<any[]>(userId, "calendar", []),
      downloadedPdfs: getUserItem<string[]>(userId, "downloaded_pdf_ids", []),
      customPdfs: getUserItem<any[]>(userId, "custom_pdfs", []),
      savedLectures: getUserItem<string[]>(userId, "saved_lectures", []),
      watchedLectures: getUserItem<string[]>(userId, "watched_lectures", []),
      dictBookmarks: getUserItem<string[]>(userId, "dict_bookmarks", []),
      dictRecents: getUserItem<string[]>(userId, "dict_recents", []),
      dictCustomWords: getUserItem<any[]>(userId, "dict_custom_words", []),
      gameProfile: resolveUnifiedGameProfile(userId),
      studyStreak: getUserItem<number>(userId, "study_streak", 0),
      quizHistory: getUserItem<any[]>(userId, "quiz_history", []),
      notifications: getUserItem<any[]>(userId, "notifications", []),
      voiceHistory: getUserItem<any[]>(userId, "voice_history", []),
      chatHistory: getUserItem<any[]>(userId, "chat_history", []),
    };
  }, []);

  const getAllUsersForAdmin = useCallback((): AdminUserProgressDetails[] => {
    const users = getRegisteredUsers();
    const now = Date.now();

    return users.map((u) => {
      const details = getStudentFullDetails(u.id);
      const completedTasks = details.tasks.filter((t) => t.status === "completed" || t.completed);

      // Active vs Offline calculation
      const lastActive = u.lastActiveTimestamp || (u.lastLogin ? new Date(u.lastLogin).getTime() : 0);
      const diffMs = now - lastActive;
      const isOnline = u.id === currentUser?.id || (lastActive > 0 && diffMs < 15 * 60 * 1000);

      // Format relative activity time
      let lastActiveFormatted = "Just now";
      if (!isOnline) {
        const diffMins = Math.floor(diffMs / (60 * 1000));
        if (diffMins < 60) {
          lastActiveFormatted = `${diffMins} min ago`;
        } else {
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) {
            lastActiveFormatted = `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
          } else {
            const diffDays = Math.floor(diffHours / 24);
            lastActiveFormatted = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
          }
        }
      }

      return {
        ...u,
        passwordText: u.passwordHash,
        isOnline,
        lastActiveFormatted,
        tasksCount: details.tasks.length,
        completedTasksCount: completedTasks.length,
        filesCount: details.files.length,
        calendarCount: details.calendar.length,
        gameXp: Number(details.gameProfile?.xp || 0),
        gameLevel: Number(details.gameProfile?.level || 1),
        studyStreak: Number(details.studyStreak || 0),
        downloadedPdfsCount: details.downloadedPdfs.length,
        customPdfsCount: details.customPdfs.length,
        savedLecturesCount: details.savedLectures.length,
        watchedLecturesCount: details.watchedLectures.length,
        dictBookmarksCount: details.dictBookmarks.length,
        quizzesCompleted: details.quizHistory.length,
        notificationsCount: details.notifications.length,
        voiceTurnsCount: details.voiceHistory.length,
        chatMessagesCount: details.chatHistory.length,
        lastActiveTimestamp: lastActive,
        isolatedData: details,
      };
    });
  }, [getRegisteredUsers, getStudentFullDetails, currentUser, tick]);

  const deleteUserByAdmin = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (userId === ADMIN_MASTER_ID) {
      return { success: false, error: "The Master Administrator account (admin0011) cannot be deleted." };
    }

    try {
      const res = await safeJsonFetch<{ success: boolean; allUsers?: StoredAccount[]; error?: string }>("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to delete user on server." };
      }
      const data = res.data;

      if (Array.isArray(data.allUsers)) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(data.allUsers));
      } else {
        const users = getRegisteredUsers();
        localStorage.setItem(
          REGISTERED_USERS_KEY,
          JSON.stringify(users.filter((u) => u.id !== userId))
        );
      }

      [
        "tasks",
        "files",
        "calendar",
        "game_profile",
        "games_profile",
        "downloaded_pdf_ids",
        "custom_pdfs",
        "saved_lectures",
        "watched_lectures",
        "dict_bookmarks",
        "dict_recents",
        "dict_custom_words",
        "quiz_history",
        "study_streak",
        "notifications",
        "voice_history",
        "chat_history",
        "seen_announcement_ids",
      ].forEach((k) => removeUserItem(userId, k));

      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error deleting account." };
    }
  };

  const updateUserByAdmin = async (
    userId: string,
    updates: Partial<StoredAccount> & { password?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const users = getRegisteredUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: "User account not found." };
    }

    if (updates.email && updates.email.trim().toLowerCase() !== users[idx].email.toLowerCase()) {
      const emailCheck = users.find(
        (u) => u.id !== userId && u.email.toLowerCase() === updates.email!.trim().toLowerCase()
      );
      if (emailCheck) {
        return { success: false, error: "This email/username is already assigned to another user." };
      }
    }

    const updatedAccount: StoredAccount = {
      ...users[idx],
      ...updates,
      name: updates.name ? updates.name.trim() : users[idx].name,
      email: updates.email ? updates.email.trim().toLowerCase() : users[idx].email,
      passwordHash: updates.password ? updates.password.trim() : updates.passwordHash || users[idx].passwordHash,
      grade: updates.grade || users[idx].grade,
      schoolOrCollege: updates.schoolOrCollege !== undefined ? updates.schoolOrCollege : users[idx].schoolOrCollege,
      targetExam: updates.targetExam !== undefined ? updates.targetExam : users[idx].targetExam,
      favoriteSubject: updates.favoriteSubject !== undefined ? updates.favoriteSubject : users[idx].favoriteSubject,
      dailyGoalHours: updates.dailyGoalHours !== undefined ? Number(updates.dailyGoalHours) : users[idx].dailyGoalHours,
    };

    try {
      const res = await safeJsonFetch<{ success: boolean; allUsers?: StoredAccount[]; error?: string }>("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates }),
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to update account on server." };
      }
      if (Array.isArray(res.data.allUsers)) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(res.data.allUsers));
      } else {
        users[idx] = updatedAccount;
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
      }
    } catch {
      users[idx] = updatedAccount;
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    }

    // Keep active session synchronized if editing currently signed-in account
    if (currentUserRef.current && currentUserRef.current.id === userId) {
      const nextSessionUser: StudentUser = {
        ...currentUserRef.current,
        name: updatedAccount.name,
        email: updatedAccount.email,
        grade: updatedAccount.grade,
        schoolOrCollege: updatedAccount.schoolOrCollege,
        targetExam: updatedAccount.targetExam,
        favoriteSubject: updatedAccount.favoriteSubject,
        dailyGoalHours: updatedAccount.dailyGoalHours,
        phone: updatedAccount.phone,
        bio: updatedAccount.bio,
      };
      setCurrentUser(nextSessionUser);
      if (localStorage.getItem(AUTH_SESSION_KEY)) {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSessionUser));
      }
      if (sessionStorage.getItem(AUTH_SESSION_KEY)) {
        sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSessionUser));
      }
    }

    setTick((prev) => prev + 1);
    return { success: true };
  };

  const createUserByAdmin = async (userData: {
    name: string;
    email: string;
    password: string;
    grade: StudentGrade;
    schoolOrCollege?: string;
    targetExam?: string;
    favoriteSubject?: string;
    dailyGoalHours?: number;
  }): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = userData.name.trim();
    const trimmedEmail = userData.email.trim().toLowerCase();
    const trimmedPassword = userData.password.trim();

    if (!trimmedName) return { success: false, error: "Student name is required." };
    if (!trimmedEmail) return { success: false, error: "Student email/username is required." };
    if (!trimmedPassword || trimmedPassword.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    const users = getRegisteredUsers();
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: "An account with this email/username already exists." };
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newAccount: StoredAccount = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: trimmedPassword,
      grade: userData.grade,
      schoolOrCollege: userData.schoolOrCollege || "High School / College",
      targetExam: userData.targetExam || "Annual Board Exam 2026",
      favoriteSubject: userData.favoriteSubject || "Science",
      dailyGoalHours: userData.dailyGoalHours || 3,
      avatarColor: randomColor,
      provider: "email",
      joinedDate: new Date().toISOString().split("T")[0],
      lastLogin: new Date().toISOString(),
      lastActiveTimestamp: Date.now(),
      role: "student",
      isAdmin: false,
    };

    try {
      const res = await safeJsonFetch<{ success: boolean; allUsers?: StoredAccount[]; error?: string }>("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAccount, createdByAdmin: true }),
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to register account on server." };
      }
      if (Array.isArray(res.data.allUsers)) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(res.data.allUsers));
      } else {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, newAccount]));
      }
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error creating student account." };
    }
  };

  const addStudentTaskByAdmin = async (
    userId: string,
    task: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; tasks?: any[]; task?: any; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to assign task on server." };
      }
      const data = res.data;
      if (Array.isArray(data.tasks)) {
        setUserItem(userId, "tasks", data.tasks);
      } else if (data.task) {
        const currentTasks = getUserItem<any[]>(userId, "tasks", []);
        setUserItem(userId, "tasks", [data.task, ...currentTasks]);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error assigning task." };
    }
  };

  const toggleStudentTaskByAdmin = async (
    userId: string,
    taskId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; tasks?: any[]; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/tasks/${encodeURIComponent(taskId)}/toggle`,
        { method: "PATCH" }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to toggle task status." };
      }
      if (Array.isArray(res.data.tasks)) {
        setUserItem(userId, "tasks", res.data.tasks);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error updating task." };
    }
  };

  const deleteStudentTaskByAdmin = async (
    userId: string,
    taskId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; tasks?: any[]; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/tasks/${encodeURIComponent(taskId)}`,
        { method: "DELETE" }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to delete task on server." };
      }
      if (Array.isArray(res.data.tasks)) {
        setUserItem(userId, "tasks", res.data.tasks);
      } else {
        const currentTasks = getUserItem<any[]>(userId, "tasks", []);
        setUserItem(userId, "tasks", currentTasks.filter((t) => t.id !== taskId));
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error deleting task." };
    }
  };

  const resetStudentIsolatedDataByAdmin = async (
    userId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (userId === ADMIN_MASTER_ID) {
      return { success: false, error: "Master administrator data is protected." };
    }
    try {
      const res = await safeJsonFetch<{ success: boolean; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/reset-state`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to reset student state." };
      }
      const freshGp = {
        level: 1,
        xp: 0,
        xpToNextLevel: 300,
        title: "Novice Scholar",
        totalGamesPlayed: 0,
        totalCorrect: 0,
        highestStreak: 0,
        soundEnabled: true,
        badges: [],
        history: [],
      };
      setUserItem(userId, "tasks", []);
      setUserItem(userId, "files", []);
      setUserItem(userId, "calendar", []);
      setUserItem(userId, "downloaded_pdf_ids", []);
      setUserItem(userId, "custom_pdfs", []);
      setUserItem(userId, "saved_lectures", []);
      setUserItem(userId, "watched_lectures", []);
      setUserItem(userId, "dict_bookmarks", []);
      setUserItem(userId, "dict_recents", []);
      setUserItem(userId, "dict_custom_words", []);
      setUserItem(userId, "quiz_history", []);
      setUserItem(userId, "notifications", []);
      setUserItem(userId, "voice_history", []);
      setUserItem(userId, "chat_history", []);
      setUserItem(userId, "game_profile", freshGp);
      setUserItem(userId, "games_profile", freshGp);
      setUserItem(userId, "study_streak", 0);

      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error resetting state." };
    }
  };

  const impersonateStudent = (studentId: string) => {
    const users = getRegisteredUsers();
    const targetStudent = users.find((u) => u.id === studentId);
    if (!targetStudent) return;

    sessionStorage.setItem(IMPERSONATION_KEY, ADMIN_MASTER_ID);
    setIsImpersonating(true);

    const sessionUser: StudentUser = {
      id: targetStudent.id,
      name: targetStudent.name,
      email: targetStudent.email,
      grade: targetStudent.grade,
      targetExam: targetStudent.targetExam,
      schoolOrCollege: targetStudent.schoolOrCollege,
      favoriteSubject: targetStudent.favoriteSubject,
      dailyGoalHours: targetStudent.dailyGoalHours,
      avatarColor: targetStudent.avatarColor,
      avatarUrl: targetStudent.avatarUrl,
      provider: "email",
      joinedDate: targetStudent.joinedDate,
      lastLogin: targetStudent.lastLogin,
      isAdmin: false,
      role: "student",
    };

    setCurrentUser(sessionUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
  };

  const exitImpersonation = () => {
    sessionStorage.removeItem(IMPERSONATION_KEY);
    setIsImpersonating(false);

    const users = getRegisteredUsers();
    const adminAccount = users.find((u) => u.id === ADMIN_MASTER_ID || u.email === ADMIN_MASTER_ID) || SEED_STUDENT_ACCOUNTS[0];

    const sessionUser: StudentUser = {
      id: adminAccount.id,
      name: adminAccount.name,
      email: adminAccount.email,
      grade: adminAccount.grade,
      targetExam: adminAccount.targetExam,
      schoolOrCollege: adminAccount.schoolOrCollege,
      favoriteSubject: adminAccount.favoriteSubject,
      dailyGoalHours: adminAccount.dailyGoalHours,
      avatarColor: adminAccount.avatarColor,
      avatarUrl: adminAccount.avatarUrl,
      provider: "email",
      joinedDate: adminAccount.joinedDate,
      lastLogin: new Date().toISOString(),
      isAdmin: true,
      role: "admin",
    };

    setCurrentUser(sessionUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
  };

  const loginAsAdminMaster = async (): Promise<{ success: boolean; error?: string }> => {
    return login(ADMIN_MASTER_ID, ADMIN_MASTER_PASS, true);
  };

  const grantStudentXpByAdmin = async (
    userId: string,
    xpAmount: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; gameProfile?: any; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/grant-xp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xpAmount }),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to update student XP." };
      }
      if (res.data.gameProfile) {
        setUserItem(userId, "game_profile", res.data.gameProfile);
        setUserItem(userId, "games_profile", res.data.gameProfile);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error adjusting XP." };
    }
  };

  const addStudentCalendarEventByAdmin = async (
    userId: string,
    event: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; calendar?: any[]; event?: any; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/calendar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to schedule event on server." };
      }
      if (Array.isArray(res.data.calendar)) {
        setUserItem(userId, "calendar", res.data.calendar);
      } else if (res.data.event) {
        const currentEvents = getUserItem<any[]>(userId, "calendar", []);
        setUserItem(userId, "calendar", [...currentEvents, res.data.event]);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error scheduling event." };
    }
  };

  const deleteStudentCalendarEventByAdmin = async (
    userId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; calendar?: any[]; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/calendar/${encodeURIComponent(eventId)}`,
        { method: "DELETE" }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to delete calendar event." };
      }
      if (Array.isArray(res.data.calendar)) {
        setUserItem(userId, "calendar", res.data.calendar);
      } else {
        const currentEvents = getUserItem<any[]>(userId, "calendar", []);
        setUserItem(userId, "calendar", currentEvents.filter((e) => e.id !== eventId));
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error deleting calendar event." };
    }
  };

  const broadcastAnnouncementByAdmin = async (
    title: string,
    message: string,
    type = "urgent",
    targetGrade = "All Levels"
  ): Promise<{ success: boolean; syncedToFirestore?: boolean; error?: string }> => {
    const createdBy = currentUserRef.current?.name || "Danish (Master Admin)";
    const fallbackAnn: ServerAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      message,
      type: (type as ServerAnnouncement["type"]) || "urgent",
      targetGrade,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await safeJsonFetch<{ success: boolean; announcement?: ServerAnnouncement; error?: string }>(
        "/api/admin/announcements",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            message,
            type,
            targetGrade,
            createdBy,
          }),
        }
      );

      const annToSync = res.ok && res.data?.announcement ? res.data.announcement : fallbackAnn;
      const syncedFirestore = await syncAnnouncementToFirestore(annToSync);

      if ((!res.ok || !res.data?.success) && !syncedFirestore) {
        return { success: false, syncedToFirestore: false, error: res.error || res.data?.error || "Failed to publish announcement on server" };
      }

      if (currentUserRef.current?.id) {
        notifyUserStateUpdated(currentUserRef.current.id);
      }
      return { success: true, syncedToFirestore: syncedFirestore };
    } catch (err: any) {
      const syncedFirestore = await syncAnnouncementToFirestore(fallbackAnn);
      if (syncedFirestore) {
        if (currentUserRef.current?.id) {
          notifyUserStateUpdated(currentUserRef.current.id);
        }
        return { success: true, syncedToFirestore: true };
      }
      return { success: false, syncedToFirestore: false, error: err?.message || "Network error publishing announcement" };
    }
  };

  const fetchStudentLiveDetailsByAdmin = useCallback(
    async (
      userId: string
    ): Promise<{ success: boolean; details?: StudentIsolatedData; error?: string }> => {
      try {
        const res = await safeJsonFetch<{
          success: boolean;
          user?: StoredAccount;
          state?: Record<string, any>;
          error?: string;
        }>(`/api/admin/users/${encodeURIComponent(userId)}/full-details`);
        if (!res.ok || !res.data?.success) {
          return { success: false, error: res.error || res.data?.error || "Failed to load server user details." };
        }
        const data = res.data;
        if (data.user) {
          const users = getRegisteredUsers();
          const idx = users.findIndex((u) => u.id === userId);
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...data.user };
          } else {
            users.push(data.user);
          }
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
        }
        if (data.state && typeof data.state === "object") {
          applyServerUserState(userId, data.state);
          notifyUserStateUpdated(userId);
        }
        setTick((prev) => prev + 1);
        return { success: true, details: getStudentFullDetails(userId) };
      } catch (err: any) {
        return { success: false, error: err?.message || "Network error fetching user dossier." };
      }
    },
    [getRegisteredUsers, getStudentFullDetails, notifyUserStateUpdated]
  );

  const sendDirectNotificationByAdmin = async (
    userId: string,
    payload: { title: string; message: string; type?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; notifications?: any[]; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/notify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to send notification." };
      }
      if (Array.isArray(res.data.notifications)) {
        setUserItem(userId, "notifications", res.data.notifications);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error sending notification." };
    }
  };

  const deleteStudentFileByAdmin = async (
    userId: string,
    fileId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; files?: any[]; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/files/${encodeURIComponent(fileId)}`,
        { method: "DELETE" }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to delete student file." };
      }
      if (Array.isArray(res.data.files)) {
        setUserItem(userId, "files", res.data.files);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error deleting file." };
    }
  };

  const deleteStudentPdfByAdmin = async (
    userId: string,
    pdfId: string,
    kind: "downloaded" | "custom"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{
        success: boolean;
        downloadedPdfs?: string[];
        customPdfs?: any[];
        error?: string;
      }>(`/api/admin/users/${encodeURIComponent(userId)}/notes/${encodeURIComponent(pdfId)}?kind=${encodeURIComponent(kind)}`, {
        method: "DELETE",
      });
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to remove note record." };
      }
      if (Array.isArray(res.data.downloadedPdfs)) {
        setUserItem(userId, "downloaded_pdf_ids", res.data.downloadedPdfs);
      }
      if (Array.isArray(res.data.customPdfs)) {
        setUserItem(userId, "custom_pdfs", res.data.customPdfs);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error removing note record." };
    }
  };

  const updateStudentStudyStatsByAdmin = async (
    userId: string,
    payload: {
      studyStreak?: number;
      xp?: number;
      level?: number;
      title?: string;
      clearKey?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeJsonFetch<{ success: boolean; state?: Record<string, any>; error?: string }>(
        `/api/admin/users/${encodeURIComponent(userId)}/study-stats`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok || !res.data?.success) {
        return { success: false, error: res.error || res.data?.error || "Failed to update study statistics." };
      }
      if (res.data.state && typeof res.data.state === "object") {
        applyServerUserState(userId, res.data.state, true);
      }
      notifyUserStateUpdated(userId);
      setTick((prev) => prev + 1);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Network error updating study statistics." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        isAdmin,
        isImpersonating,
        dataVersion: tick,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile,
        getAllUsersForAdmin,
        getStudentFullDetails,
        deleteUserByAdmin,
        updateUserByAdmin,
        createUserByAdmin,
        addStudentTaskByAdmin,
        toggleStudentTaskByAdmin,
        deleteStudentTaskByAdmin,
        resetStudentIsolatedDataByAdmin,
        impersonateStudent,
        exitImpersonation,
        refreshAdminUsersList,
        loginAsAdminMaster,
        grantStudentXpByAdmin,
        addStudentCalendarEventByAdmin,
        deleteStudentCalendarEventByAdmin,
        broadcastAnnouncementByAdmin,
        fetchStudentLiveDetailsByAdmin,
        sendDirectNotificationByAdmin,
        deleteStudentFileByAdmin,
        deleteStudentPdfByAdmin,
        updateStudentStudyStatsByAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
