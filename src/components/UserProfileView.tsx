import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  KeyRound,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  Flame,
  FileDown,
  Video,
  Languages,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  LogOut,
  Clock,
  School,
  Mail,
  Award,
  Palette,
  Check,
  Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { StudentGrade } from "../types";
import { getUserItem, setUserItem } from "../utils/userStorage";

interface UserProfileViewProps {
  setActiveTab?: (tab: string) => void;
}

const GRADE_OPTIONS: StudentGrade[] = [
  "9th Class",
  "10th Class",
  "11th Class",
  "12th Class",
  "Class 1st to 5th",
  "Class 6th to 8th",
  "MDCAT & ECAT Entry Test",
  "General / College",
  "All Levels",
];

const BOARD_OPTIONS = [
  "BISE Malakand",
  "BISE Peshawar",
  "BISE Mardan",
  "BISE Swat",
  "BISE Abbottabad",
  "BISE Kohat",
  "BISE Bannu",
  "BISE D.I. Khan",
  "Federal Board (FBISE Islamabad)",
  "BISE Lahore",
  "BISE Rawalpindi",
  "BISE Gujranwala",
  "BISE Faisalabad",
  "BISE Multan",
  "BISE Karachi",
  "BISE Hyderabad",
  "BISE Quetta",
  "Aga Khan University Examination Board (AKU-EB)",
  "Cambridge O/A Level (CAIE)",
];

const SUBJECT_OPTIONS = [
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Computer Science",
  "English",
  "Urdu",
  "General Science",
];

const AVATAR_COLOR_THEMES = [
  { id: "from-indigo-500 to-purple-600", label: "Indigo & Purple", preview: "bg-gradient-to-r from-indigo-500 to-purple-600" },
  { id: "from-emerald-500 to-teal-600", label: "Emerald & Teal", preview: "bg-gradient-to-r from-emerald-500 to-teal-600" },
  { id: "from-blue-500 to-cyan-600", label: "Sky & Cyan", preview: "bg-gradient-to-r from-blue-500 to-cyan-600" },
  { id: "from-amber-500 to-orange-600", label: "Amber & Orange", preview: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { id: "from-rose-500 to-pink-600", label: "Rose & Pink", preview: "bg-gradient-to-r from-rose-500 to-pink-600" },
  { id: "from-violet-600 to-fuchsia-600", label: "Violet & Fuchsia", preview: "bg-gradient-to-r from-violet-600 to-fuchsia-600" },
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({ setActiveTab }) => {
  const { currentUser, updateProfile, logout, isAdmin } = useAuth();
  const { tasks, clearVoiceConversationHistory } = useApp();

  const [activeSection, setActiveSection] = useState<"profile" | "security" | "stats">("profile");

  // Profile Form State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [grade, setGrade] = useState<StudentGrade>(currentUser?.grade || "11th Class");
  const [targetExam, setTargetExam] = useState(currentUser?.targetExam || "BISE Malakand Annual Board Exam 2026");
  const [schoolOrCollege, setSchoolOrCollege] = useState(currentUser?.schoolOrCollege || "");
  const [favoriteSubject, setFavoriteSubject] = useState(currentUser?.favoriteSubject || "Biology");
  const [dailyGoalHours, setDailyGoalHours] = useState<number>(currentUser?.dailyGoalHours || 3);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || "from-indigo-500 to-purple-600");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // User Stats (Isolated per account)
  const studyStreak = getUserItem<number>(currentUser?.id, "study_streak", 0);
  const downloadedNotesCount = getUserItem<string[]>(currentUser?.id, "downloaded_pdf_ids", []).length;
  const savedLecturesCount = getUserItem<string[]>(currentUser?.id, "saved_lectures", []).length;
  const watchedLecturesCount = getUserItem<string[]>(currentUser?.id, "watched_lectures", []).length;
  const bookmarkedVocabCount = getUserItem<string[]>(currentUser?.id, "dict_bookmarks", []).length;
  const gamesProfile = getUserItem<any>(currentUser?.id, "games_profile", { level: 0, xp: 0, totalGamesPlayed: 0 });
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!name.trim()) {
      setProfileErrorMsg("Student name cannot be empty.");
      return;
    }
    if (!email.trim() || (!email.includes("@") && email.trim().toLowerCase() !== "admin0011")) {
      setProfileErrorMsg("Please enter a valid student email address.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        grade,
        targetExam: targetExam.trim(),
        schoolOrCollege: schoolOrCollege.trim(),
        favoriteSubject,
        dailyGoalHours: Number(dailyGoalHours),
        bio: bio.trim(),
        avatarColor,
      });

      if (result.success) {
        setProfileSuccessMsg("Profile settings updated successfully!");
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(result.error || "Failed to update profile settings.");
      }
    } catch {
      setProfileErrorMsg("An unexpected error occurred while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("New password and confirm password do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile(
        {},
        {
          currentPassword,
          newPassword,
        }
      );

      if (result.success) {
        setPasswordSuccessMsg("Password changed successfully! Keep your new credentials secure.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      } else {
        setPasswordErrorMsg(result.error || "Failed to change password.");
      }
    } catch {
      setPasswordErrorMsg("An error occurred while updating your password.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetUserAccountData = () => {
    if (!currentUser?.id) return;
    setUserItem(currentUser.id, "tasks", []);
    setUserItem(currentUser.id, "files", []);
    setUserItem(currentUser.id, "calendar", []);
    setUserItem(currentUser.id, "downloaded_pdf_ids", []);
    setUserItem(currentUser.id, "custom_pdfs", []);
    setUserItem(currentUser.id, "saved_lectures", []);
    setUserItem(currentUser.id, "watched_lectures", []);
    setUserItem(currentUser.id, "dict_bookmarks", []);
    setUserItem(currentUser.id, "dict_recents", []);
    setUserItem(currentUser.id, "dict_custom_words", []);
    setUserItem(currentUser.id, "study_streak", 0);
    setUserItem(currentUser.id, "games_profile", {
      level: 0,
      xp: 0,
      xpToNextLevel: 250,
      title: "Novice Scholar",
      totalGamesPlayed: 0,
      totalCorrect: 0,
      highestStreak: 0,
      soundEnabled: true,
      badges: [],
      history: [],
    });
    clearVoiceConversationHistory();
    setIsResetConfirmOpen(false);
    setProfileSuccessMsg("Account workspace data has been reset to brand-new clean state!");
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  };

  const passwordStrengthScore = getPasswordStrength();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Profile Header Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Dynamic Avatar */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${avatarColor} p-1 shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0 border-2 border-white/20`}
            >
              <span className="text-2xl sm:text-3xl font-black text-white">
                {name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "ST"}
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {name || "Student"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active Account
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{email || currentUser?.email}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-indigo-300 font-semibold border border-indigo-500/30">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {grade}
                </span>
                {schoolOrCollege && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-medium border border-slate-700">
                    <School className="w-3.5 h-3.5 text-slate-400" />
                    {schoolOrCollege}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  Joined {currentUser?.joinedDate || "Recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveSection("security")}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Change Password</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
              title="Sign Out of Student Account"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-center">
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Study Streak
            </p>
            <p className="text-lg font-black text-white">{studyStreak} Days</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              Saved Notes
            </p>
            <p className="text-lg font-black text-white">{downloadedNotesCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              Lectures Saved
            </p>
            <p className="text-lg font-black text-white">{savedLecturesCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
              Games XP
            </p>
            <p className="text-lg font-black text-white">Lvl {gamesProfile.level || 0} • {gamesProfile.xp || 0} XP</p>
          </div>
        </div>
      </div>

      {/* Master Administrator Privileges Banner (Exclusive to admin0011) */}
      {isAdmin && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-purple-500/15 border-2 border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Master Administrator Privileges Active
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                  CONTROL ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                Logged in as <span className="font-mono font-bold text-amber-600 dark:text-amber-300">admin0011</span>. View and manage all student accounts, inspect passwords, and monitor live presence.
              </p>
            </div>
          </div>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab("admin")}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              Open Master Admin Hub →
            </button>
          )}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSection("profile")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSection === "profile"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Academic Settings</span>
        </button>

        <button
          onClick={() => setActiveSection("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSection === "security"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveSection("stats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeSection === "stats"
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Account Overview</span>
        </button>
      </div>

      {/* TAB 1: Profile & Academic Information */}
      {activeSection === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileSuccessMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {/* Student Identity Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Personal Student Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Full Name / Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Danish Khan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  School, College or Academy Name
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={schoolOrCollege}
                    onChange={(e) => setSchoolOrCollege(e.target.value)}
                    placeholder="e.g. SPS College Batkhela Campus"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Daily Study Goal (Hours)
                </label>
                <select
                  value={dailyGoalHours}
                  onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>1 Hour per day</option>
                  <option value={2}>2 Hours per day</option>
                  <option value={3}>3 Hours per day (Recommended)</option>
                  <option value={4}>4 Hours per day (High Focus)</option>
                  <option value={5}>5 Hours per day (Intensive Prep)</option>
                  <option value={6}>6+ Hours per day (Exam Mode)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Personal Bio / Academic Motto
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Share your academic goals, e.g. Preparing for FSc Pre-Medical and aspiring to score 95%+ in Board Exams."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Academic Curriculum Preferences */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Academic Curriculum & Examination Track
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Class / Grade Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as StudentGrade)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Educational Board / Exam
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Subject Focus
                </label>
                <select
                  value={favoriteSubject}
                  onChange={(e) => setFavoriteSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Avatar Theme Selection */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Palette className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Avatar Theme & Appearance
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your personalized gradient color palette displayed across headers, leaderboard badges, and study rankings.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {AVATAR_COLOR_THEMES.map((theme) => {
                const isSelected = avatarColor === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setAvatarColor(theme.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${theme.preview} flex items-center justify-center text-white shadow-xs`}>
                      {isSelected ? <Check className="w-5 h-5" /> : null}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center">
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setName(currentUser?.name || "");
                setEmail(currentUser?.email || "");
                setGrade(currentUser?.grade || "11th Class");
                setTargetExam(currentUser?.targetExam || "BISE Malakand");
                setSchoolOrCollege(currentUser?.schoolOrCollege || "");
                setFavoriteSubject(currentUser?.favoriteSubject || "Biology");
                setDailyGoalHours(currentUser?.dailyGoalHours || 3);
                setBio(currentUser?.bio || "");
                setAvatarColor(currentUser?.avatarColor || "from-indigo-500 to-purple-600");
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Discard Changes
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving Settings..." : "Save Profile Settings"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password Management */}
      {activeSection === "security" && (
        <div className="space-y-6">
          {passwordSuccessMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Update Account Password
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ensure your account is using a strong password with at least 6 characters. No external OAuth or social login is connected, so your student password is your primary security key.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 flex-1 rounded-full ${
                          passwordStrengthScore >= 1 ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full ${
                          passwordStrengthScore >= 2 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full ${
                          passwordStrengthScore >= 4 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Strength:{" "}
                      {passwordStrengthScore < 2
                        ? "Weak"
                        : passwordStrengthScore < 4
                        ? "Moderate"
                        : "Strong"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSaving ? "Updating Password..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Reset Card */}
          <div className="p-6 rounded-3xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Reset Account Progress & Data
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Want to start your academic year completely fresh? Resetting will clear all downloaded notes, saved lectures, vocabulary bookmarks, tasks, and game progress for your account while keeping your username and password intact.
            </p>

            {isResetConfirmOpen ? (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/40 space-y-3">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Are you absolutely sure you want to reset all data for {currentUser?.email}? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetUserAccountData}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                  >
                    Yes, Reset My Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Account Progress</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Account Overview & Learning Metrics */}
      {activeSection === "stats" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Award className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Account Academic Record & Activity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account ID</span>
                <p className="text-xs font-mono text-slate-800 dark:text-slate-200">{currentUser?.id}</p>
                <p className="text-[10px] text-emerald-500 font-semibold">100% Isolated Data Partition</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authentication Type</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Email & Student Password</p>
                <p className="text-[10px] text-slate-500">Zero third-party tracking</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.joinedDate || "Today"}</p>
                <p className="text-[10px] text-indigo-500">Active Student</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks Completed</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{completedTasksCount}</p>
                <p className="text-[10px] text-slate-500">Out of {tasks.length} assigned tasks</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dictionary Bookmarks</span>
                <p className="text-xl font-black text-violet-600 dark:text-violet-400">{bookmarkedVocabCount}</p>
                <p className="text-[10px] text-slate-500">Academic definitions saved</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Watched Lectures</span>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">{watchedLecturesCount}</p>
                <p className="text-[10px] text-slate-500">Curriculum video lessons</p>
              </div>
            </div>

            {/* Quick Links to Modes */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
              {setActiveTab && (
                <>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab("pdfs")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 transition-colors cursor-pointer"
                  >
                    Open Master Notes
                  </button>
                  <button
                    onClick={() => setActiveTab("games")}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 transition-colors cursor-pointer"
                  >
                    Play Educational Games
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
