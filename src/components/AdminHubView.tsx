import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Edit3,
  UserPlus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
  KeyRound,
  Mail,
  School,
  Flame,
  Award,
  RefreshCw,
  X,
  AlertTriangle,
  Activity,
  Radio,
  FileDown,
  Brain,
  Calendar,
  FileText,
  Plus,
  ExternalLink,
  Folder,
  Volume2,
  Sliders,
  RotateCcw,
  Target,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AdminUserProgressDetails, StudentGrade } from "../types";

interface AdminHubViewProps {
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

export const AdminHubView: React.FC<AdminHubViewProps> = ({ setActiveTab }) => {
  const {
    currentUser,
    isAdmin,
    getAllUsersForAdmin,
    getStudentFullDetails,
    deleteUserByAdmin,
    updateUserByAdmin,
    createUserByAdmin,
    addStudentTaskByAdmin,
    deleteStudentTaskByAdmin,
    resetStudentIsolatedDataByAdmin,
    impersonateStudent,
    refreshAdminUsersList,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(true);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [inspectUser, setInspectUser] = useState<AdminUserProgressDetails | null>(null);
  const [inspectTab, setInspectTab] = useState<"settings" | "tasks" | "files" | "calendar" | "notes" | "gaming">("settings");
  const [editUser, setEditUser] = useState<AdminUserProgressDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserProgressDetails | null>(null);

  // Form states for Inspect User separate settings
  const [inspectEditName, setInspectEditName] = useState("");
  const [inspectEditEmail, setInspectEditEmail] = useState("");
  const [inspectEditPassword, setInspectEditPassword] = useState("");
  const [inspectEditGrade, setInspectEditGrade] = useState<StudentGrade>("11th Class");
  const [inspectEditSchool, setInspectEditSchool] = useState("");
  const [inspectEditTargetExam, setInspectEditTargetExam] = useState("");
  const [inspectEditSubject, setInspectEditSubject] = useState("Biology");
  const [inspectEditGoalHours, setInspectEditGoalHours] = useState(3);
  const [isSavingInspectSettings, setIsSavingInspectSettings] = useState(false);
  const [inspectSettingsSuccess, setInspectSettingsSuccess] = useState<string | null>(null);
  const [inspectSettingsError, setInspectSettingsError] = useState<string | null>(null);
  const [showInspectPassword, setShowInspectPassword] = useState(true);

  // New task form for student
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "high" | "medium" | "low">("high");
  const [newTaskCategory, setNewTaskCategory] = useState("General Study");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");

  // Form states for Create User
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserGrade, setNewUserGrade] = useState<StudentGrade>("11th Class");
  const [newUserSchool, setNewUserSchool] = useState("");
  const [newUserTargetExam, setNewUserTargetExam] = useState("BISE Annual Board Examinations 2026");
  const [newUserSubject, setNewUserSubject] = useState("Biology");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Form states for Edit User
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editGrade, setEditGrade] = useState<StudentGrade>("11th Class");
  const [editSchool, setEditSchool] = useState("");
  const [editTargetExam, setEditTargetExam] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Notifications/Toasts
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showSuccessNotice = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const usersList = useMemo(() => {
    return getAllUsersForAdmin();
  }, [getAllUsersForAdmin]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.schoolOrCollege && u.schoolOrCollege.toLowerCase().includes(search)) ||
        (u.targetExam && u.targetExam.toLowerCase().includes(search)) ||
        u.grade.toLowerCase().includes(search) ||
        u.passwordText.toLowerCase().includes(search);

      // Status filter
      let matchStatus = true;
      if (statusFilter === "online") matchStatus = u.isOnline;
      if (statusFilter === "offline") matchStatus = !u.isOnline;

      // Grade filter
      let matchGrade = true;
      if (gradeFilter !== "all") matchGrade = u.grade === gradeFilter;

      return matchSearch && matchStatus && matchGrade;
    });
  }, [usersList, searchTerm, statusFilter, gradeFilter]);

  // Aggregate stats
  const totalUsers = usersList.length;
  const onlineUsersCount = usersList.filter((u) => u.isOnline).length;
  const offlineUsersCount = usersList.filter((u) => !u.isOnline).length;
  const totalTasksSum = usersList.reduce((acc, u) => acc + (u.tasksCount || 0), 0);
  const completedTasksSum = usersList.reduce((acc, u) => acc + (u.completedTasksCount || 0), 0);
  const totalDownloadsSum = usersList.reduce((acc, u) => acc + (u.downloadedPdfsCount || 0), 0);
  const totalQuizzesSum = usersList.reduce((acc, u) => acc + (u.quizzesCompleted || 0), 0);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: prev[userId] !== undefined ? !prev[userId] : false,
    }));
  };

  const handleOpenInspect = (
    user: AdminUserProgressDetails,
    initialTab: "settings" | "tasks" | "files" | "calendar" | "notes" | "gaming" = "settings"
  ) => {
    setInspectUser(user);
    setInspectTab(initialTab);
    setInspectEditName(user.name);
    setInspectEditEmail(user.email);
    setInspectEditPassword(user.passwordText);
    setInspectEditGrade(user.grade);
    setInspectEditSchool(user.schoolOrCollege || "");
    setInspectEditTargetExam(user.targetExam || "");
    setInspectEditSubject(user.favoriteSubject || "Biology");
    setInspectEditGoalHours(user.dailyGoalHours || 3);
    setInspectSettingsSuccess(null);
    setInspectSettingsError(null);
  };

  const handleSaveStudentSettingsSeparately = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUser) return;
    setIsSavingInspectSettings(true);
    setInspectSettingsError(null);
    setInspectSettingsSuccess(null);

    const res = await updateUserByAdmin(inspectUser.id, {
      name: inspectEditName,
      email: inspectEditEmail,
      password: inspectEditPassword,
      grade: inspectEditGrade,
      schoolOrCollege: inspectEditSchool,
      targetExam: inspectEditTargetExam,
      favoriteSubject: inspectEditSubject,
      dailyGoalHours: inspectEditGoalHours,
    });

    setIsSavingInspectSettings(false);
    if (!res.success) {
      setInspectSettingsError(res.error || "Failed to update student settings.");
    } else {
      setInspectSettingsSuccess(`Saved settings & credentials separately for ${inspectEditName}!`);
      showSuccessNotice(`Updated settings for student: ${inspectEditName}`);
      setInspectUser((prev) =>
        prev
          ? {
              ...prev,
              name: inspectEditName,
              email: inspectEditEmail,
              passwordText: inspectEditPassword,
              grade: inspectEditGrade,
              schoolOrCollege: inspectEditSchool,
              targetExam: inspectEditTargetExam,
              favoriteSubject: inspectEditSubject,
              dailyGoalHours: inspectEditGoalHours,
            }
          : null
      );
    }
  };

  const handleAddStudentTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUser || !newTaskTitle.trim()) return;

    addStudentTaskByAdmin(inspectUser.id, {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: newTaskDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });

    setNewTaskTitle("");
    showSuccessNotice(`Assigned new task for student: ${inspectUser.name}`);
  };

  const handleDeleteStudentTask = (taskId: string) => {
    if (!inspectUser) return;
    deleteStudentTaskByAdmin(inspectUser.id, taskId);
    showSuccessNotice("Deleted task from student's record.");
  };

  const handleLaunchStudentWorkspace = () => {
    if (!inspectUser) return;
    impersonateStudent(inspectUser.id);
    if (setActiveTab) {
      setActiveTab("dashboard");
    }
    showSuccessNotice(`Browsing workspace as: ${inspectUser.name}`);
  };

  const handleResetStudentData = () => {
    if (!inspectUser) return;
    if (
      window.confirm(
        `Are you sure you want to reset all tasks, files, notes, and calendar for student "${inspectUser.name}"? Credentials (username & password) will be kept.`
      )
    ) {
      resetStudentIsolatedDataByAdmin(inspectUser.id);
      showSuccessNotice(`Reset all isolated data for ${inspectUser.name}`);
    }
  };

  const openEditModal = (u: AdminUserProgressDetails) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword(u.passwordText);
    setEditGrade(u.grade);
    setEditSchool(u.schoolOrCollege || "");
    setEditTargetExam(u.targetExam || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    const res = await updateUserByAdmin(editUser.id, {
      name: editName,
      email: editEmail,
      password: editPassword,
      grade: editGrade,
      schoolOrCollege: editSchool,
      targetExam: editTargetExam,
    });

    setIsSubmittingEdit(false);
    if (!res.success) {
      setEditError(res.error || "Failed to update user.");
    } else {
      setEditUser(null);
      showSuccessNotice(`Updated account details for ${editName} successfully.`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setCreateError(null);

    const res = await createUserByAdmin({
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      grade: newUserGrade,
      schoolOrCollege: newUserSchool,
      targetExam: newUserTargetExam,
      favoriteSubject: newUserSubject,
    });

    setIsSubmittingCreate(false);
    if (!res.success) {
      setCreateError(res.error || "Failed to create new user account.");
    } else {
      setShowCreateModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserSchool("");
      showSuccessNotice(`Successfully created and registered student account.`);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const res = await deleteUserByAdmin(deleteConfirmUser.id);
    if (!res.success) {
      alert(res.error || "Failed to delete account.");
    } else {
      showSuccessNotice(`Deleted user ${deleteConfirmUser.name} and cleared isolated storage.`);
      setDeleteConfirmUser(null);
    }
  };

  const handleExportJSON = () => {
    const exportData = usersList.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.passwordText,
      grade: u.grade,
      schoolOrCollege: u.schoolOrCollege,
      targetExam: u.targetExam,
      joinedDate: u.joinedDate,
      lastLogin: u.lastLogin,
      isOnline: u.isOnline,
      tasksTracked: u.tasksCount,
      tasksCompleted: u.completedTasksCount,
      notesDownloaded: u.downloadedPdfsCount,
      quizzesCompleted: u.quizzesCompleted,
      gameXp: u.gameXp,
      gameLevel: u.gameLevel,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ProStudyMind_All_Users_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccessNotice("Exported all registered users database to JSON file.");
  };

  // Authorization Check
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Access Restricted: Master Admin Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            This mode is strictly confidential and reserved for the Master Administrator account (admin0011).
          </p>
        </div>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-black tracking-wide">{actionSuccessMsg}</p>
        </div>
      )}

      {/* Admin Control Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-500/40 shadow-2xl text-white relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Master Administrator Hub
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Real-Time Presence
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800/80 text-amber-300 border border-slate-700">
                admin0011 verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Platform User Control & Student Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Confidential administrative control over all registered student accounts. View passwords, isolated
              academic milestones, and track real-time active and offline users.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student Account</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all cursor-pointer"
              title="Download entire user database as JSON"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Database</span>
            </button>
            <button
              onClick={refreshAdminUsersList}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Refresh User Presence"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Presence & Platform Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">100% Isolated State</p>
          </div>
        </div>

        {/* Active Online */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Online</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{onlineUsersCount}</p>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">🟢 Active Now</p>
          </div>
        </div>

        {/* Offline Users */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Offline Users</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{offlineUsersCount}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">⚪ Offline Presence</p>
          </div>
        </div>

        {/* Study Tasks Tracked */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tasks Tracked</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {completedTasksSum}/{totalTasksSum}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Completed Milestones</p>
          </div>
        </div>

        {/* Quizzes Taken */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quizzes Taken</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalQuizzesSum}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Assessment Sessions</p>
          </div>
        </div>

        {/* Notes Downloaded */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notes Saved</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <FileDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalDownloadsSum}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Downloaded PDFs</p>
          </div>
        </div>
      </div>

      {/* Control Filters & Search Tooling */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, email, password, school, grade, or board..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs & Grade Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pills */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All Users ({totalUsers})
              </button>
              <button
                onClick={() => setStatusFilter("online")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === "online"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-emerald-500"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active ({onlineUsersCount})
              </button>
              <button
                onClick={() => setStatusFilter("offline")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === "offline"
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Offline ({offlineUsersCount})
              </button>
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Grades / Levels</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Toggle All Passwords Visibility */}
            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showAllPasswords
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
              title="Show or mask plain text passwords across the user table"
            >
              {showAllPasswords ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-500" />
                  <span>Passwords Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mask Passwords</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <p>
            Showing <span className="font-extrabold text-slate-900 dark:text-white">{filteredUsers.length}</span> of{" "}
            <span className="font-extrabold text-slate-900 dark:text-white">{totalUsers}</span> student accounts
          </p>
          <p className="text-[11px] font-mono">Real-time isolation active • Multi-Account Secure</p>
        </div>
      </div>

      {/* Main Interactive Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Student & Profile</th>
                <th className="py-3.5 px-4">Login ID / Username</th>
                <th className="py-3.5 px-4">Account Password</th>
                <th className="py-3.5 px-4">Grade & Examination</th>
                <th className="py-3.5 px-4">Presence Status</th>
                <th className="py-3.5 px-4">Academic Progress</th>
                <th className="py-3.5 px-4 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold">No user accounts matched your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isThisAdmin = user.id === "admin0011" || user.email === "admin0011";
                  const isPasswordShown =
                    visiblePasswords[user.id] !== undefined
                      ? visiblePasswords[user.id]
                      : showAllPasswords;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Student Name & School */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${
                                user.avatarColor || "from-indigo-500 to-purple-600"
                              } text-white font-black text-xs flex items-center justify-center shadow-sm`}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            {/* Live Presence indicator dot */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                user.isOnline ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                              title={user.isOnline ? "Online right now" : "Offline"}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-slate-900 dark:text-white truncate">
                                {user.name}
                              </p>
                              {isThisAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                                  MASTER ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                              {user.schoolOrCollege || "SPS College / High School"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Email / Login ID */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[170px]">
                            {user.email}
                          </span>
                          <button
                            onClick={() => handleCopy(user.email, `email-${user.id}`)}
                            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title="Copy Email / Login ID"
                          >
                            {copiedKey === `email-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans">Joined: {user.joinedDate}</p>
                      </td>

                      {/* 3. Password (Plain text reveal & 1-click copy) */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-amber-200">
                            {isPasswordShown ? user.passwordText : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={isPasswordShown ? "Hide password" : "Show plain text password"}
                          >
                            {isPasswordShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(user.passwordText, `pass-${user.id}`)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Copy Password"
                          >
                            {copiedKey === `pass-${user.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 4. Grade & Exam */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-1">
                          {user.grade}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {user.targetExam || "Annual Board Exam"}
                        </p>
                      </td>

                      {/* 5. Presence Status (Active vs Offline) */}
                      <td className="py-3.5 px-4">
                        {user.isOnline ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <div>
                              <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                                ACTIVE NOW
                              </p>
                              <p className="text-[10px] text-slate-400">Online in workspace</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                            <div>
                              <p className="text-[11px] font-bold leading-tight">OFFLINE</p>
                              <p className="text-[10px] text-slate-400">{user.lastActiveFormatted}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. Academic Progress */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            <span>Tasks: {user.completedTasksCount}/{user.tasksCount}</span>
                            <span>{user.gameXp} XP</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{
                                width: `${
                                  user.tasksCount > 0
                                    ? Math.round((user.completedTasksCount / user.tasksCount) * 100)
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {user.downloadedPdfsCount} PDFs • {user.quizzesCompleted} Quizzes
                          </p>
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspect(user)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Inspect complete student record & settings"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                            title="Edit student account & credentials"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!isThisAdmin && (
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Delete student account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Complete Student Record Inspection              */}
      {/* ======================================================== */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header with Student Identity & Quick Workspace Launch */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    inspectUser.avatarColor || "from-indigo-500 to-purple-600"
                  } text-white font-black text-sm flex items-center justify-center shadow-md shrink-0`}
                >
                  {inspectUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                      {inspectUser.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        inspectUser.isOnline
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          inspectUser.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      {inspectUser.isOnline ? "Active Online" : `Offline (${inspectUser.lastActiveFormatted})`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {inspectUser.grade}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    ID: {inspectUser.email} • {inspectUser.schoolOrCollege || "SPS College / High School"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleLaunchStudentWorkspace}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  title="Launch workspace directly as this student"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Launch Student View</span>
                </button>
                <button
                  onClick={() => setInspectUser(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tab Navigation Bar */}
            <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-bold pb-2">
                <button
                  onClick={() => setInspectTab("settings")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "settings"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Account Settings & Passwords</span>
                </button>

                <button
                  onClick={() => setInspectTab("tasks")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "tasks"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks & Todos ({getStudentFullDetails(inspectUser.id).tasks.length})</span>
                </button>

                <button
                  onClick={() => setInspectTab("files")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "files"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span>Files & Audio Notes ({getStudentFullDetails(inspectUser.id).files.length})</span>
                </button>

                <button
                  onClick={() => setInspectTab("calendar")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "calendar"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Study Calendar ({getStudentFullDetails(inspectUser.id).calendar.length})</span>
                </button>

                <button
                  onClick={() => setInspectTab("notes")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "notes"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Saved Notes ({getStudentFullDetails(inspectUser.id).downloadedPdfs.length})</span>
                </button>

                <button
                  onClick={() => setInspectTab("gaming")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    inspectTab === "gaming"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Gaming & XP ({inspectUser.gameXp} XP)</span>
                </button>
              </div>
            </div>

            {/* Modal Body with Active Subtab Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* TAB 1: Separate Account Settings & Credentials */}
              {inspectTab === "settings" && (
                <div className="space-y-5 animate-fadeIn">
                  {inspectSettingsSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{inspectSettingsSuccess}</span>
                    </div>
                  )}

                  {inspectSettingsError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{inspectSettingsError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveStudentSettingsSeparately} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Full Student Name
                        </label>
                        <input
                          type="text"
                          required
                          value={inspectEditName}
                          onChange={(e) => setInspectEditName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Student Email or Login ID
                        </label>
                        <input
                          type="text"
                          required
                          value={inspectEditEmail}
                          onChange={(e) => setInspectEditEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Control */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          Account Password (Plain-Text Editable)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInspectPassword(!showInspectPassword)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showInspectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showInspectPassword ? "Mask Password" : "Show Password"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(inspectEditPassword, "inspect-pass-copy")}
                            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "inspect-pass-copy" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type={showInspectPassword ? "text" : "password"}
                          required
                          value={inspectEditPassword}
                          onChange={(e) => setInspectEditPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Class / Academic Grade
                        </label>
                        <select
                          value={inspectEditGrade}
                          onChange={(e) => setInspectEditGrade(e.target.value as StudentGrade)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        >
                          {GRADE_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          School or College Name
                        </label>
                        <input
                          type="text"
                          value={inspectEditSchool}
                          onChange={(e) => setInspectEditSchool(e.target.value)}
                          placeholder="e.g. SPS College Batkhela"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Target Board Examination
                        </label>
                        <input
                          type="text"
                          value={inspectEditTargetExam}
                          onChange={(e) => setInspectEditTargetExam(e.target.value)}
                          placeholder="e.g. BISE Board Examinations 2026"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Daily Study Target (Hours)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={inspectEditGoalHours}
                          onChange={(e) => setInspectEditGoalHours(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleResetStudentData}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold transition-all cursor-pointer"
                        title="Erase all isolated tasks, files, notes, and calendar data for this student"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Study Data</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingInspectSettings}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isSavingInspectSettings ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Settings...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save Student Settings Separately</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: Tasks & Todos */}
              {inspectTab === "tasks" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Student Assigned Tasks & Milestones
                      </h4>
                      <p className="text-xs text-slate-500">
                        Independently managed study tasks for {inspectUser.name}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                      {getStudentFullDetails(inspectUser.id).tasks.filter((t) => t.status === "completed" || t.completed).length} / {getStudentFullDetails(inspectUser.id).tasks.length} Completed
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5">
                    {getStudentFullDetails(inspectUser.id).tasks.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No tasks currently tracked for this student. Assign one below!
                      </div>
                    ) : (
                      getStudentFullDetails(inspectUser.id).tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  task.status === "completed" || task.completed ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              <p
                                className={`font-bold ${
                                  task.status === "completed" || task.completed
                                    ? "line-through text-slate-400"
                                    : "text-slate-900 dark:text-white"
                                }`}
                              >
                                {task.title}
                              </p>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                {task.priority || "Normal"}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 leading-snug">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                              <span>Due: {task.dueDate || "Ongoing"}</span>
                              <span>•</span>
                              <span>Category: {task.category || "General"}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteStudentTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Delete this task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Assign New Task Card */}
                  <form
                    onSubmit={handleAddStudentTask}
                    className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 text-xs"
                  >
                    <p className="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Assign New Task for {inspectUser.name}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Task title (e.g. Physics Ch 4 derivations)"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="urgent">Urgent Priority</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Add Task to Student
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: Files & Voice Memos */}
              {inspectTab === "files" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Uploaded Files & Voice Recordings
                    </h4>
                    <p className="text-xs text-slate-500">
                      Isolated audio memos and study notes belonging to {inspectUser.name}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {getStudentFullDetails(inspectUser.id).files.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No files or voice memos recorded by this student yet.
                      </div>
                    ) : (
                      getStudentFullDetails(inspectUser.id).files.map((file) => (
                        <div
                          key={file.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                              {file.category === "audio" ? (
                                <Volume2 className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {file.contentSnippet || "Study resource document"}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                                <span>{Math.round((file.size || 1024) / 1024)} KB</span>
                                <span>•</span>
                                <span>Uploaded: {file.uploadDate || "Recently"}</span>
                              </div>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {file.category || "File"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Study Calendar */}
              {inspectTab === "calendar" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Study Calendar & Examination Schedule
                    </h4>
                    <p className="text-xs text-slate-500">
                      Scheduled revision events for {inspectUser.name}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {getStudentFullDetails(inspectUser.id).calendar.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No calendar events scheduled yet by this student.
                      </div>
                    ) : (
                      getStudentFullDetails(inspectUser.id).calendar.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{ev.title}</p>
                              {ev.description && (
                                <p className="text-[11px] text-slate-500">{ev.description}</p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                {ev.startTime ? new Date(ev.startTime).toLocaleDateString() : "Upcoming"}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            {ev.category || "Study"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: Saved Notes */}
              {inspectTab === "notes" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Curriculum Notes & Downloaded PDF Library
                    </h4>
                    <p className="text-xs text-slate-500">
                      Curriculum guides downloaded or saved by {inspectUser.name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {getStudentFullDetails(inspectUser.id).downloadedPdfs.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No curriculum notes downloaded yet by this student.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {getStudentFullDetails(inspectUser.id).downloadedPdfs.map((pdfId, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2.5 text-xs"
                          >
                            <FileDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-mono font-bold text-slate-900 dark:text-white truncate">
                                {pdfId}
                              </p>
                              <p className="text-[10px] text-slate-500">Verified Board Approved Guide</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: Gaming & XP */}
              {inspectTab === "gaming" && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Gamification Profile & Assessment History
                    </h4>
                    <p className="text-xs text-slate-500">
                      XP milestones and quiz history for {inspectUser.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        Level {getStudentFullDetails(inspectUser.id).gameProfile?.level || inspectUser.gameLevel}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500">Academic Rank</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {getStudentFullDetails(inspectUser.id).gameProfile?.xp || inspectUser.gameXp}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500">Total XP</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {getStudentFullDetails(inspectUser.id).studyStreak || 0} Days
                      </p>
                      <p className="text-[11px] font-bold text-slate-500">Daily Study Streak</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        {inspectUser.quizzesCompleted}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500">Quizzes Taken</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Close Button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                Isolated Profile ID: {inspectUser.id}
              </span>
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Create New Student User Account                 */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Register New Student Account
                  </h3>
                  <p className="text-xs text-slate-500">Creates an isolated profile with credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Asad Ullah"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Email / Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. asad@student.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Grade Level
                  </label>
                  <select
                    value={newUserGrade}
                    onChange={(e) => setNewUserGrade(e.target.value as StudentGrade)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    School / College
                  </label>
                  <input
                    type="text"
                    value={newUserSchool}
                    onChange={(e) => setNewUserSchool(e.target.value)}
                    placeholder="e.g. SPS College Batkhela"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Board Exam
                </label>
                <input
                  type="text"
                  value={newUserTargetExam}
                  onChange={(e) => setNewUserTargetExam(e.target.value)}
                  placeholder="e.g. BISE Malakand Board Exam 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {isSubmittingCreate ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Edit Student User Account                      */}
      {/* ======================================================== */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-sm">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Edit Student Profile: {editUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">Modify credentials, password, and curriculum target</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Login Email / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password (Editable)
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Grade Level
                  </label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as StudentGrade)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    School / College
                  </label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Board Exam
                </label>
                <input
                  type="text"
                  value={editTargetExam}
                  onChange={(e) => setEditTargetExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 transition-all cursor-pointer"
                >
                  {isSubmittingEdit ? "Saving..." : "Update Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Delete Account Confirmation                     */}
      {/* ======================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete Account: {deleteConfirmUser.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will permanently delete this student's account and erase all their isolated tasks, downloaded notes,
                and quiz history. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
