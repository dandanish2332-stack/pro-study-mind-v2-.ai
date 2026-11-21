import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Upload,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  AlertTriangle,
  Activity,
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
  CheckSquare,
  Award,
  KeyRound,
  Megaphone,
  Server,
  Database,
  ScrollText,
  Zap,
  HardDrive,
  Send,
  Sparkles,
  BookOpen,
  Video,
  Bell,
  MessageSquare,
  Code2,
  Flame,
  Phone,
  UserCheck,
  Mail,
  Inbox,
  LogIn,
  FileSpreadsheet,
  FileJson,
  Unlink,
  Link2,
  Cloud,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  getGoogleAccessToken,
  getGoogleCurrentUser,
  googleLogout,
  googleSignIn,
  initGoogleAuth,
  isFirebaseAdminSessionActive,
} from "../utils/googleAuth";
import { safeJsonFetch } from "../utils/safeFetch";
import { auth } from "../firebase";
import * as pdfjsLib from "pdfjs-dist";
import {
  UploadedPdfNoteRecord,
  uploadPdfToCloud,
  fetchAllPdfNotes,
  subscribeToPdfNotes,
  syncLocalPdfToFirestore,
  syncAllLocalPdfsToFirestore,
  deleteUploadedPdfNote,
  downloadVerbatimPdf,
  ensureAdminFirestoreDoc,
  syncPlatformSettingsToFirestore,
  deleteAnnouncementFromFirestore,
  fetchAnnouncementsFromFirestore,
  fetchPlatformSettingsFromFirestore,
  validatePdfBytes,
} from "../services/cloudSyncService";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
import {
  AdminAuditLog,
  AdminLogsSummary,
  AdminServerOverview,
  AdminUserProgressDetails,
  EmailDispatchLog,
  GmailMessageDetail,
  GmailMessageSummary,
  PlatformSettings,
  ServerAnnouncement,
  StudentGrade,
  UserActivityLog,
} from "../types";

export type AdminSectionTab = "users" | "gmail" | "broadcasts" | "backend" | "logs" | "pdf-upload";

interface AdminHubViewProps {
  setActiveTab?: (tab: string) => void;
  initialSectionTab?: AdminSectionTab;
  onConsumeInitialSection?: () => void;
}

type LogStreamTab = "audit" | "auth" | "activity" | "email" | "errors";

const GRADE_OPTIONS: StudentGrade[] = [
  "Class 9",
  "Class 10",
  "9th Class",
  "10th Class",
  "11th Class",
  "12th Class",
  "Class 1st to 5th",
  "Class 6th to 8th",
  "MDCAT & ECAT Entry Test",
  "General / College",
  "All Levels",
  "All Levels (Master Admin)",
];

const PDF_GRADE_OPTIONS: string[] = [
  "12th Class",
  "11th Class",
  "Class 10",
  "Class 9",
  "10th Class",
  "9th Class",
  "Class 8",
  "Class 7",
  "Class 6",
  "Class 5",
  "Class 4",
  "Class 3",
  "Class 2",
  "Class 1",
  "Class 6th to 8th",
  "Class 1st to 5th",
  "MDCAT & ECAT Entry Test",
  "General / College",
  "All Levels",
];

const PDF_SUBJECT_OPTIONS: string[] = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science",
  "General Science",
  "English",
  "Urdu",
  "Pakistan Studies",
  "General Study",
];

const PDF_CATEGORY_OPTIONS: string[] = [
  "Complete Study Guide",
  "Chapter Theory Notes",
  "Solved Exercise & Numericals",
  "Formula Sheet",
  "Past Paper & Guess Paper",
  "Board Exam Handout",
];

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const AdminHubView: React.FC<AdminHubViewProps> = ({
  setActiveTab,
  initialSectionTab,
  onConsumeInitialSection,
}) => {
  const {
    isAdmin,
    dataVersion,
    getAllUsersForAdmin,
    getStudentFullDetails,
    deleteUserByAdmin,
    updateUserByAdmin,
    createUserByAdmin,
    addStudentTaskByAdmin,
    toggleStudentTaskByAdmin,
    deleteStudentTaskByAdmin,
    resetStudentIsolatedDataByAdmin,
    grantStudentXpByAdmin,
    addStudentCalendarEventByAdmin,
    deleteStudentCalendarEventByAdmin,
    broadcastAnnouncementByAdmin,
    impersonateStudent,
    refreshAdminUsersList,
    fetchStudentLiveDetailsByAdmin,
    sendDirectNotificationByAdmin,
    deleteStudentFileByAdmin,
    deleteStudentPdfByAdmin,
    updateStudentStudyStatsByAdmin,
  } = useAuth();
  const { refreshPlatformSettings, syncAnnouncementsNow, platformSettings } = useApp();

  const [sectionTab, setSectionTab] = useState<AdminSectionTab>(initialSectionTab || "users");

  useEffect(() => {
    if (initialSectionTab) {
      setSectionTab(initialSectionTab);
      onConsumeInitialSection?.();
    }
  }, [initialSectionTab, onConsumeInitialSection]);

  // Users directory state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [userId: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [inspectUser, setInspectUser] = useState<AdminUserProgressDetails | null>(null);
  const [inspectTab, setInspectTab] = useState<
    "overview" | "settings" | "tasks" | "files" | "calendar" | "learning" | "activity" | "gaming"
  >("overview");
  const [isRefreshingInspect, setIsRefreshingInspect] = useState<boolean>(false);
  const [inspectLastSyncedAt, setInspectLastSyncedAt] = useState<string>("");
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [editUser, setEditUser] = useState<AdminUserProgressDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserProgressDetails | null>(null);
  const [confirmResetUser, setConfirmResetUser] = useState<AdminUserProgressDetails | null>(null);

  // Inspect User Settings form
  const [inspectEditName, setInspectEditName] = useState("");
  const [inspectEditEmail, setInspectEditEmail] = useState("");
  const [inspectEditPassword, setInspectEditPassword] = useState("");
  const [inspectEditGrade, setInspectEditGrade] = useState<StudentGrade>("11th Class");
  const [inspectEditSchool, setInspectEditSchool] = useState("");
  const [inspectEditTargetExam, setInspectEditTargetExam] = useState("");
  const [inspectEditSubject, setInspectEditSubject] = useState("Biology");
  const [inspectEditGoalHours, setInspectEditGoalHours] = useState(3);
  const [inspectEditPhone, setInspectEditPhone] = useState("");
  const [inspectEditBio, setInspectEditBio] = useState("");
  const [isSavingInspectSettings, setIsSavingInspectSettings] = useState(false);
  const [inspectSettingsSuccess, setInspectSettingsSuccess] = useState<string | null>(null);
  const [inspectSettingsError, setInspectSettingsError] = useState<string | null>(null);
  const [showInspectPassword, setShowInspectPassword] = useState(true);

  // Inspect User Direct Notification & Study Stats forms
  const [directNotifTitle, setDirectNotifTitle] = useState("");
  const [directNotifMessage, setDirectNotifMessage] = useState("");
  const [directNotifType, setDirectNotifType] = useState<"info" | "urgent" | "reminder" | "security">("info");
  const [isSendingDirectNotif, setIsSendingDirectNotif] = useState(false);
  const [editStreakValue, setEditStreakValue] = useState<number>(0);
  const [editXpValue, setEditXpValue] = useState<number>(0);
  const [editLevelValue, setEditLevelValue] = useState<number>(1);
  const [editRankTitle, setEditRankTitle] = useState<string>("Novice Scholar");
  const [isSavingStudyStats, setIsSavingStudyStats] = useState(false);

  // Inspect User New Task, Calendar Event, Custom XP
  const [taskInspectFilter, setTaskInspectFilter] = useState<"all" | "pending" | "completed">("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("General Study");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "high" | "medium" | "low">("high");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<"work" | "personal" | "meeting" | "deadline">("work");
  const [customXpAmount, setCustomXpAmount] = useState<number>(100);

  // Create User form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserGrade, setNewUserGrade] = useState<StudentGrade>("11th Class");
  const [newUserSchool, setNewUserSchool] = useState("");
  const [newUserTargetExam, setNewUserTargetExam] = useState("BISE Annual Board Examinations 2026");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit User form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editGrade, setEditGrade] = useState<StudentGrade>("11th Class");
  const [editSchool, setEditSchool] = useState("");
  const [editTargetExam, setEditTargetExam] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Broadcasts state
  const [announcements, setAnnouncements] = useState<ServerAnnouncement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<ServerAnnouncement["type"]>("urgent");
  const [broadcastGrade, setBroadcastGrade] = useState<string>("All Levels");
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Backend Server Telemetry & Settings state
  const [overview, setOverview] = useState<AdminServerOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [settingsForm, setSettingsForm] = useState<PlatformSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState<string | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // Multi-stream logs & telemetry state
  const [logStream, setLogStream] = useState<LogStreamTab>("audit");
  const [logsSummary, setLogsSummary] = useState<AdminLogsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [authLogs, setAuthLogs] = useState<AdminAuditLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [apiErrorLogs, setApiErrorLogs] = useState<
    { timestamp: string; route: string; statusCode: number; message: string }[]
  >([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>("all");
  const [activityFeatureFilter, setActivityFeatureFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  const [confirmClearStream, setConfirmClearStream] = useState<"audit" | "activity" | "email" | "errors" | null>(null);

  // Cloud & Published Environment Status state
  const [cloudAdminActive, setCloudAdminActive] = useState<boolean>(() => isFirebaseAdminSessionActive());
  const [backendReachable, setBackendReachable] = useState<boolean | null>(null);
  const [isConnectingCloudSync, setIsConnectingCloudSync] = useState<boolean>(false);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // PDF Upload state & handlers
  const [uploadSubject, setUploadSubject] = useState<string>("Physics");
  const [uploadGrade, setUploadGrade] = useState<string>("12th Class");
  const [uploadCategory, setUploadCategory] = useState<string>("Complete Study Guide");
  const [uploadPageCount, setUploadPageCount] = useState<number>(15);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [uploadedNotesHistory, setUploadedNotesHistory] = useState<UploadedPdfNoteRecord[]>([]);
  const [isLoadingUploadedNotes, setIsLoadingUploadedNotes] = useState<boolean>(false);
  const [confirmDeletePdfId, setConfirmDeletePdfId] = useState<string | null>(null);
  const [deletingPdfId, setDeletingPdfId] = useState<string | null>(null);
  const [syncingPdfId, setSyncingPdfId] = useState<string | null>(null);
  const [isSyncingAllLocalPdfs, setIsSyncingAllLocalPdfs] = useState<boolean>(false);
  const [autoOpenPdfNotesAfterUpload, setAutoOpenPdfNotesAfterUpload] = useState<boolean>(true);
  const [lastUploadedPdfBanner, setLastUploadedPdfBanner] = useState<UploadedPdfNoteRecord | null>(null);
  const pdfFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadUploadedNotes = useCallback(async () => {
    setIsLoadingUploadedNotes(true);
    try {
      const notes = await fetchAllPdfNotes();
      setUploadedNotesHistory(notes);
    } finally {
      setIsLoadingUploadedNotes(false);
    }
  }, []);

  useEffect(() => {
    loadUploadedNotes();
    const unsubscribe = subscribeToPdfNotes((liveNotes) => {
      setUploadedNotesHistory(liveNotes);
      setIsLoadingUploadedNotes(false);
    });
    return () => unsubscribe();
  }, [loadUploadedNotes]);

  const handleAdminPdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      showToast("Please select a valid .pdf file.", "error");
      inputEl.value = "";
      return;
    }

    try {
      const headerSlice = new Uint8Array(
        await file.slice(0, Math.min(file.size, 1024)).arrayBuffer()
      );
      const check = validatePdfBytes(headerSlice);
      if (!check.valid) {
        showToast(check.reason || "Selected file is not a genuine PDF document.", "error");
        setSelectedPdfFile(null);
        inputEl.value = "";
        return;
      }
    } catch {
      showToast("Could not read the selected PDF file.", "error");
      inputEl.value = "";
      return;
    }

    setSelectedPdfFile(file);
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.pdf$/i, "").replace(/_/g, " "));
    }

    // Best-effort auto-detect real PDF page count for files up to 40 MB
    if (file.size <= 40 * 1024 * 1024) {
      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const docProxy = await loadingTask.promise;
        if (docProxy.numPages > 0) {
          setUploadPageCount(docProxy.numPages);
        }
        await docProxy.cleanup();
        await loadingTask.destroy();
      } catch {
        // Keep manual/default page count if encrypted or complex PDF
      }
    }
  };

  const ensureGoogleAdminForGlobalPublish = async (): Promise<boolean> => {
    if (isFirebaseAdminSessionActive()) {
      await ensureAdminFirestoreDoc(true);
      setCloudAdminActive(true);
      return true;
    }

    const res = await googleSignIn({
      forceConsent: false,
      includeGmailScopes: false,
    });
    if (res.email.toLowerCase() !== "dandanish2332@gmail.com") {
      const msg = `Signed in as ${res.email}. Master Firestore Admin rules require dandanish2332@gmail.com so everyone on all devices can see uploaded PDFs.`;
      setCloudSyncError(msg);
      throw new Error(msg);
    }

    await ensureAdminFirestoreDoc(true);
    setCloudAdminActive(true);
    setGmailAuthEmail(res.email);
    setCloudSyncError(null);
    return true;
  };

  const handleAdminPdfUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfFile) {
      showToast("Please choose a PDF file from your device first.", "error");
      return;
    }

    setIsUploadingPdf(true);
    setUploadProgress(2);
    setUploadStatusText("Verifying Global Firestore Admin session...");

    try {
      try {
        await auth.authStateReady();
      } catch {}

      if (!isFirebaseAdminSessionActive()) {
        setUploadStatusText("Please complete Google Sign-In (dandanish2332@gmail.com) so everyone can see this PDF...");
        await ensureGoogleAdminForGlobalPublish();
      } else {
        await ensureAdminFirestoreDoc(true);
      }

      const result = await uploadPdfToCloud({
        file: selectedPdfFile,
        title: uploadTitle.trim() || selectedPdfFile.name.replace(/\.pdf$/i, ""),
        description:
          uploadDescription.trim() ||
          `Original PDF notes for ${uploadSubject} (${uploadGrade}) uploaded verbatim without modifications.`,
        subject: uploadSubject,
        grade: uploadGrade,
        category: uploadCategory,
        pageCount: uploadPageCount,
        onProgress: (pct, statusText) => {
          setUploadProgress(pct);
          setUploadStatusText(statusText);
        },
      });

      setLastUploadedPdfBanner(result.note);

      if (result.isGlobalCloud) {
        showToast(`Published "${result.note.title}" globally to PDF Notes Mode — now visible to everyone on all devices!`);
      } else {
        showToast(
          `Uploaded "${result.note.title}" (${result.storageBackend}). Note: PDFs over 260 MB require backend storage.`,
          "error"
        );
      }

      setSelectedPdfFile(null);
      setUploadTitle("");
      setUploadDescription("");
      if (pdfFileInputRef.current) {
        pdfFileInputRef.current.value = "";
      }
      await loadUploadedNotes();

      if (result.isGlobalCloud && autoOpenPdfNotesAfterUpload && setActiveTab) {
        setTimeout(() => {
          setActiveTab("pdfnotes");
        }, 450);
      }
    } catch (err: any) {
      showToast(
        err?.message ||
          "To show uploaded PDFs to everyone on all devices, please sign in with Google (dandanish2332@gmail.com).",
        "error"
      );
    } finally {
      setTimeout(() => {
        setIsUploadingPdf(false);
        setUploadProgress(0);
        setUploadStatusText("");
      }, 600);
    }
  };

  const handlePublishSingleLocalPdf = async (note: UploadedPdfNoteRecord) => {
    setSyncingPdfId(note.id);
    try {
      if (!isFirebaseAdminSessionActive()) {
        await ensureGoogleAdminForGlobalPublish();
      }
      await syncLocalPdfToFirestore(note);
      showToast(`"${note.title}" is now published globally to everyone on all devices!`);
      await loadUploadedNotes();
    } catch (err: any) {
      showToast(err?.message || "Failed to publish PDF globally to Firestore.", "error");
    } finally {
      setSyncingPdfId(null);
    }
  };

  const handleSyncAllLocalPdfs = async () => {
    setIsSyncingAllLocalPdfs(true);
    try {
      if (!isFirebaseAdminSessionActive()) {
        await ensureGoogleAdminForGlobalPublish();
      }
      const { syncedCount, failedCount } = await syncAllLocalPdfsToFirestore();
      await loadUploadedNotes();
      if (syncedCount > 0 && failedCount === 0) {
        showToast(`Published ${syncedCount} local PDF(s) globally to Firestore — now visible to everyone!`);
      } else if (syncedCount > 0 && failedCount > 0) {
        showToast(`Published ${syncedCount} PDF(s) globally; ${failedCount} could not be read from local server.`, "error");
      } else if (failedCount > 0) {
        showToast(
          `Could not migrate ${failedCount} old local record(s) because their PDF file is missing on this server. Please re-upload them.`,
          "error"
        );
      } else {
        showToast("All uploaded PDFs are already published globally in Firestore!");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to sync local PDFs to Firestore.", "error");
    } finally {
      setIsSyncingAllLocalPdfs(false);
    }
  };

  const handleDownloadUploadedPdf = async (note: UploadedPdfNoteRecord) => {
    try {
      await downloadVerbatimPdf(note);
      showToast(`Downloading "${note.fileName || note.title}"`);
    } catch (err: any) {
      showToast(err?.message || "Failed to download PDF.", "error");
    }
  };

  const handleDeleteUploadedPdf = async (note: UploadedPdfNoteRecord) => {
    setDeletingPdfId(note.id);
    try {
      const res = await deleteUploadedPdfNote(note);
      if (res.success) {
        showToast(`Deleted "${note.title}" from PDF library.`);
        setConfirmDeletePdfId(null);
        await loadUploadedNotes();
      } else {
        showToast(res.error || "Could not delete PDF note.", "error");
      }
    } finally {
      setDeletingPdfId(null);
    }
  };

  // Google Workspace Gmail Hub state
  const [gmailConnected, setGmailConnected] = useState<boolean>(() => Boolean(getGoogleAccessToken()));
  const [gmailAuthEmail, setGmailAuthEmail] = useState<string | null>(
    () => getGoogleCurrentUser()?.email || null
  );
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailProfile, setGmailProfile] = useState<{
    emailAddress?: string;
    messagesTotal?: number;
    threadsTotal?: number;
    historyId?: string;
  } | null>(null);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailQuery, setGmailQuery] = useState("");
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [selectedGmailMsg, setSelectedGmailMsg] = useState<GmailMessageDetail | null>(null);
  const [isLoadingGmailDetail, setIsLoadingGmailDetail] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [confirmSendEmailOpen, setConfirmSendEmailOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [isLoadingEmailLogs, setIsLoadingEmailLogs] = useState(false);

  // Feedback banners (replaces browser alert)
  const [actionToast, setActionToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setActionToast({ type, message });
    setTimeout(() => setActionToast(null), 4000);
  }, []);

  useEffect(() => {
    const unsub = initGoogleAuth(
      (user) => {
        setGmailAuthEmail(user.email || null);
        setGmailConnected(Boolean(getGoogleAccessToken()));
        setCloudAdminActive(isFirebaseAdminSessionActive());
      },
      () => {
        setGmailAuthEmail(null);
        setGmailConnected(false);
        setCloudAdminActive(false);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    safeJsonFetch<{ status?: string }>("/api/health").then((res) => {
      setBackendReachable(res.ok);
    });
  }, [isAdmin]);

  const fetchServerOverview = useCallback(async () => {
    setIsLoadingOverview(true);
    try {
      const [apiRes, firestoreSettings] = await Promise.all([
        safeJsonFetch<{ success: boolean; overview?: AdminServerOverview }>("/api/admin/overview"),
        fetchPlatformSettingsFromFirestore(),
      ]);

      if (apiRes.ok && apiRes.data?.success && apiRes.data.overview) {
        setBackendReachable(true);
        setOverview(apiRes.data.overview);

        const apiSettings = apiRes.data.overview.settings;
        const chosenSettings =
          firestoreSettings &&
          (!apiSettings?.updatedAt ||
            new Date(firestoreSettings.updatedAt || 0).getTime() >=
              new Date(apiSettings.updatedAt || 0).getTime())
            ? firestoreSettings
            : apiSettings;
        setSettingsForm(chosenSettings);
      } else {
        setBackendReachable(false);
        const fallbackSettings: PlatformSettings = firestoreSettings || platformSettings || {
          platformName: "PRO Study Mind v2.0",
          supportEmail: "dandanish2332@gmail.com",
          allowPublicSignup: true,
          aiTutorEnabled: true,
          adPlacementsEnabled: true,
          defaultDailyGoalHours: 4,
          maintenanceBanner: "",
          updatedAt: new Date().toISOString(),
        };
        setSettingsForm(fallbackSettings);
        setOverview({
          server: {
            status: "degraded",
            uptimeSeconds: 0,
            startedAt: new Date().toISOString(),
            nodeVersion: "Serverless / Cloud Edge",
            platform: "Netlify / Cloud",
            pid: 0,
            memory: { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 },
          },
          traffic: { totalApiRequests: 0, avgLatencyMs: 0, topRoutes: [], recentErrors: [] },
          ai: {
            geminiConfigured: true,
            activeCooldowns: {},
            caches: {
              quiz: { size: 0, maxItems: 100, ttlMinutes: 30, hits: 0, misses: 0, hitRatePercent: 0 },
              media: { size: 0, maxItems: 100, ttlMinutes: 30, hits: 0, misses: 0, hitRatePercent: 0 },
              voice: { size: 0, maxItems: 100, ttlMinutes: 30, hits: 0, misses: 0, hitRatePercent: 0 },
              chat: { size: 0, maxItems: 100, ttlMinutes: 30, hits: 0, misses: 0, hitRatePercent: 0 },
            },
          },
          database: {
            totalUsers: 0,
            onlineUsers: 0,
            offlineUsers: 0,
            totalTasks: 0,
            completedTasks: 0,
            totalFiles: 0,
            totalCalendarEvents: 0,
            totalQuizzes: 0,
            totalXp: 0,
            announcementsCount: 0,
            auditLogsCount: 0,
            storageFiles: [],
          },
          settings: fallbackSettings,
        });
        showToast(apiRes.error || "Telemetry API unavailable — Firestore governance settings loaded.", "error");
      }
    } finally {
      setIsLoadingOverview(false);
    }
  }, [platformSettings, showToast]);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoadingAnnouncements(true);
    try {
      const [apiRes, firestoreList] = await Promise.all([
        safeJsonFetch<{ success: boolean; announcements?: ServerAnnouncement[] }>("/api/announcements"),
        fetchAnnouncementsFromFirestore(),
      ]);
      const byId = new Map<string, ServerAnnouncement>();
      if (apiRes.ok && apiRes.data?.success && Array.isArray(apiRes.data.announcements)) {
        for (const a of apiRes.data.announcements) byId.set(a.id, a);
      }
      for (const a of firestoreList) {
        if (!byId.has(a.id)) byId.set(a.id, a);
      }
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAnnouncements(merged);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  const fetchEmailLogs = useCallback(async (q?: string) => {
    setIsLoadingEmailLogs(true);
    try {
      const url = `/api/admin/email-logs?limit=150${q ? `&q=${encodeURIComponent(q)}` : ""}`;
      const res = await safeJsonFetch<{ success: boolean; logs?: EmailDispatchLog[] }>(url);
      if (res.ok && res.data?.success && Array.isArray(res.data.logs)) {
        setEmailLogs(res.data.logs);
      }
    } finally {
      setIsLoadingEmailLogs(false);
    }
  }, []);

  const fetchGmailProfile = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || getGoogleAccessToken();
    if (!token) {
      setGmailConnected(false);
      return;
    }
    const res = await safeJsonFetch<{ success: boolean; profile?: any; error?: string }>("/api/gmail/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      setGmailConnected(false);
      setGmailError("Gmail session expired. Please click 'Sign in with Google' to reconnect.");
      return;
    }
    if (res.ok && res.data?.success && res.data.profile) {
      setGmailProfile(res.data.profile);
      setGmailAuthEmail(res.data.profile.emailAddress || null);
      setGmailConnected(true);
      setGmailError(null);
    } else {
      setGmailError(res.error || res.data?.error || "Could not load Gmail profile.");
    }
  }, []);

  const fetchGmailMessages = useCallback(async (queryOverride?: string, tokenOverride?: string) => {
    const token = tokenOverride || getGoogleAccessToken();
    if (!token) {
      setGmailConnected(false);
      return;
    }
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const q = queryOverride !== undefined ? queryOverride : gmailQuery;
      const res = await safeJsonFetch<{ success: boolean; messages?: GmailMessageSummary[]; error?: string }>(
        `/api/gmail/messages?maxResults=15${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        setGmailConnected(false);
        setGmailError("Gmail authorization expired. Reconnect with Google to view inbox.");
        return;
      }
      if (res.ok && res.data?.success && Array.isArray(res.data.messages)) {
        setGmailMessages(res.data.messages);
      } else {
        setGmailError(res.error || res.data?.error || "Failed to fetch Gmail messages.");
      }
    } finally {
      setIsLoadingGmail(false);
    }
  }, [gmailQuery]);

  const fetchLogsSummary = useCallback(async () => {
    const res = await safeJsonFetch<{ success: boolean; summary?: AdminLogsSummary }>("/api/admin/logs/summary");
    if (res.ok && res.data?.success && res.data.summary) {
      setLogsSummary(res.data.summary);
    }
  }, []);

  const fetchActiveLogStream = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      if (logStream === "audit") {
        const res = await safeJsonFetch<{ success: boolean; logs?: AdminAuditLog[] }>(
          `/api/admin/audit-logs?category=${encodeURIComponent(logCategoryFilter)}&limit=150`
        );
        if (res.ok && res.data?.success && Array.isArray(res.data.logs)) setAuditLogs(res.data.logs);
      } else if (logStream === "auth") {
        const res = await safeJsonFetch<{ success: boolean; logs?: AdminAuditLog[] }>(
          `/api/admin/logs/auth?limit=150${logSearch.trim() ? `&q=${encodeURIComponent(logSearch.trim())}` : ""}`
        );
        if (res.ok && res.data?.success && Array.isArray(res.data.logs)) setAuthLogs(res.data.logs);
      } else if (logStream === "activity") {
        const res = await safeJsonFetch<{ success: boolean; logs?: UserActivityLog[] }>(
          `/api/admin/logs/activity?feature=${encodeURIComponent(activityFeatureFilter)}&limit=200${
            logSearch.trim() ? `&q=${encodeURIComponent(logSearch.trim())}` : ""
          }`
        );
        if (res.ok && res.data?.success && Array.isArray(res.data.logs)) setActivityLogs(res.data.logs);
      } else if (logStream === "email") {
        await fetchEmailLogs(logSearch.trim() || undefined);
      } else if (logStream === "errors") {
        const res = await safeJsonFetch<{ success: boolean; errors?: { timestamp: string; route: string; statusCode: number; message: string }[] }>(
          "/api/admin/logs/errors"
        );
        if (res.ok && res.data?.success && Array.isArray(res.data.errors)) setApiErrorLogs(res.data.errors);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [logStream, logCategoryFilter, activityFeatureFilter, logSearch, fetchEmailLogs]);

  const handleActivateGoogleCloudSync = async () => {
    setIsConnectingCloudSync(true);
    setCloudSyncError(null);
    try {
      // Reuse active verified Master Admin Firebase Auth session if already signed in
      if (isFirebaseAdminSessionActive()) {
        await ensureAdminFirestoreDoc(true);
        setCloudAdminActive(true);
        const { syncedCount } = await syncAllLocalPdfsToFirestore();
        await Promise.all([
          refreshPlatformSettings(),
          fetchAnnouncements(),
          loadUploadedNotes(),
        ]);
        showToast(
          syncedCount > 0
            ? `Google Firestore Sync active! Migrated ${syncedCount} local PDF(s) globally for all users.`
            : "Google Firestore Admin Sync verified & active!"
        );
        return;
      }

      const res = await googleSignIn({
        forceConsent: false,
        includeGmailScopes: false,
      });

      if (res.email.toLowerCase() !== "dandanish2332@gmail.com") {
        const msg = `Signed in as ${res.email}. Master Firestore Admin rules require dandanish2332@gmail.com.`;
        setCloudSyncError(msg);
        showToast(msg, "error");
        return;
      }

      await ensureAdminFirestoreDoc(true);
      setCloudAdminActive(true);
      setGmailAuthEmail(res.email);
      const { syncedCount } = await syncAllLocalPdfsToFirestore();
      await Promise.all([
        refreshPlatformSettings(),
        fetchAnnouncements(),
        loadUploadedNotes(),
      ]);
      showToast(
        syncedCount > 0
          ? `Google Firestore Sync activated & published ${syncedCount} local PDF(s) to everyone!`
          : "Google Firestore Admin Sync activated for live global publishing!"
      );
    } catch (err: any) {
      const msg = err?.message || "Could not connect Google Firestore Admin session.";
      setCloudSyncError(msg);
      showToast(msg, "error");
    } finally {
      setIsConnectingCloudSync(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (sectionTab === "users") {
      refreshAdminUsersList();
    } else if (sectionTab === "gmail") {
      fetchEmailLogs();
      const token = getGoogleAccessToken();
      if (token) {
        setGmailConnected(true);
        fetchGmailProfile(token);
        fetchGmailMessages(undefined, token);
      }
    } else if (sectionTab === "backend") {
      fetchServerOverview();
      const timer = setInterval(fetchServerOverview, 15000);
      return () => clearInterval(timer);
    } else if (sectionTab === "broadcasts") {
      fetchAnnouncements();
    } else if (sectionTab === "logs") {
      fetchLogsSummary();
      fetchActiveLogStream();
      const timer = setInterval(() => {
        fetchLogsSummary();
        fetchActiveLogStream();
      }, 15000);
      return () => clearInterval(timer);
    } else if (sectionTab === "pdf-upload") {
      loadUploadedNotes();
    }
  }, [
    isAdmin,
    sectionTab,
    refreshAdminUsersList,
    fetchEmailLogs,
    fetchGmailProfile,
    fetchGmailMessages,
    fetchServerOverview,
    fetchAnnouncements,
    fetchLogsSummary,
    fetchActiveLogStream,
    loadUploadedNotes,
  ]);

  const usersList = useMemo(() => {
    return getAllUsersForAdmin();
  }, [getAllUsersForAdmin, dataVersion]);

  const liveInspectUser = useMemo(() => {
    if (!inspectUser) return null;
    return usersList.find((u) => u.id === inspectUser.id) || inspectUser;
  }, [inspectUser, usersList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.schoolOrCollege && u.schoolOrCollege.toLowerCase().includes(search)) ||
        (u.targetExam && u.targetExam.toLowerCase().includes(search)) ||
        u.grade.toLowerCase().includes(search) ||
        u.passwordText.toLowerCase().includes(search);

      let matchStatus = true;
      if (statusFilter === "online") matchStatus = u.isOnline;
      if (statusFilter === "offline") matchStatus = !u.isOnline;

      let matchGrade = true;
      if (gradeFilter !== "all") matchGrade = u.grade === gradeFilter;

      return matchSearch && matchStatus && matchGrade;
    });
  }, [usersList, searchTerm, statusFilter, gradeFilter]);

  const filteredAuditLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.target && l.target.toLowerCase().includes(q)) ||
        l.details.toLowerCase().includes(q)
    );
  }, [auditLogs, logSearch]);

  const filteredAuthLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return authLogs;
    return authLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.target && l.target.toLowerCase().includes(q)) ||
        l.details.toLowerCase().includes(q)
    );
  }, [authLogs, logSearch]);

  const filteredActivityLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return activityLogs;
    return activityLogs.filter(
      (l) =>
        l.userEmail.toLowerCase().includes(q) ||
        (l.userName && l.userName.toLowerCase().includes(q)) ||
        l.feature.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }, [activityLogs, logSearch]);

  const filteredEmailLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return emailLogs;
    return emailLogs.filter(
      (l) =>
        l.to.toLowerCase().includes(q) ||
        l.subject.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.snippet && l.snippet.toLowerCase().includes(q))
    );
  }, [emailLogs, logSearch]);

  const filteredApiErrorLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return apiErrorLogs;
    return apiErrorLogs.filter(
      (e) =>
        e.route.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        String(e.statusCode).includes(q)
    );
  }, [apiErrorLogs, logSearch]);

  // Aggregate stats
  const totalUsers = usersList.length;
  const onlineUsersCount = usersList.filter((u) => u.isOnline).length;
  const offlineUsersCount = usersList.filter((u) => !u.isOnline).length;
  const totalTasksSum = usersList.reduce((acc, u) => acc + (u.tasksCount || 0), 0);
  const completedTasksSum = usersList.reduce((acc, u) => acc + (u.completedTasksCount || 0), 0);
  const totalQuizzesSum = usersList.reduce((acc, u) => acc + (u.quizzesCompleted || 0), 0);
  const totalXpSum = usersList.reduce((acc, u) => acc + (u.gameXp || 0), 0);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: prev[userId] !== undefined ? !prev[userId] : !showAllPasswords,
    }));
  };

  const handleOpenInspect = async (
    user: AdminUserProgressDetails,
    initialTab:
      | "overview"
      | "settings"
      | "tasks"
      | "files"
      | "calendar"
      | "learning"
      | "activity"
      | "gaming" = "overview"
  ) => {
    setInspectUser(user);
    setInspectTab(initialTab);
    setShowRawJson(false);
    setTaskInspectFilter("all");
    setInspectEditName(user.name);
    setInspectEditEmail(user.email);
    setInspectEditPassword(user.passwordText);
    setInspectEditGrade(user.grade);
    setInspectEditSchool(user.schoolOrCollege || "");
    setInspectEditTargetExam(user.targetExam || "");
    setInspectEditSubject(user.favoriteSubject || "Biology");
    setInspectEditGoalHours(user.dailyGoalHours || 3);
    setInspectEditPhone(user.phone || "");
    setInspectEditBio(user.bio || "");
    setInspectSettingsSuccess(null);
    setInspectSettingsError(null);
    setDirectNotifTitle("");
    setDirectNotifMessage("");

    const initialDetails = getStudentFullDetails(user.id);
    setEditStreakValue(Number(initialDetails.studyStreak || 0));
    setEditXpValue(Number(initialDetails.gameProfile?.xp || 0));
    setEditLevelValue(Number(initialDetails.gameProfile?.level || 1));
    setEditRankTitle(initialDetails.gameProfile?.title || "Novice Scholar");

    setIsRefreshingInspect(true);
    const live = await fetchStudentLiveDetailsByAdmin(user.id);
    setIsRefreshingInspect(false);
    if (live.success && live.details) {
      setInspectLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setEditStreakValue(Number(live.details.studyStreak || 0));
      setEditXpValue(Number(live.details.gameProfile?.xp || 0));
      setEditLevelValue(Number(live.details.gameProfile?.level || 1));
      setEditRankTitle(live.details.gameProfile?.title || "Novice Scholar");
    }
  };

  const handleRefreshInspectLive = async () => {
    if (!liveInspectUser) return;
    setIsRefreshingInspect(true);
    const res = await fetchStudentLiveDetailsByAdmin(liveInspectUser.id);
    setIsRefreshingInspect(false);
    if (res.success && res.details) {
      setInspectLastSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setEditStreakValue(Number(res.details.studyStreak || 0));
      setEditXpValue(Number(res.details.gameProfile?.xp || 0));
      setEditLevelValue(Number(res.details.gameProfile?.level || 1));
      setEditRankTitle(res.details.gameProfile?.title || "Novice Scholar");
      showToast(`Live server data synced for ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Could not refresh user dossier from server.", "error");
    }
  };

  const handleExportUserDossierJson = () => {
    if (!liveInspectUser) return;
    const details = getStudentFullDetails(liveInspectUser.id);
    const dossier = {
      exportedAt: new Date().toISOString(),
      account: {
        id: liveInspectUser.id,
        name: liveInspectUser.name,
        email: liveInspectUser.email,
        password: liveInspectUser.passwordText,
        role: liveInspectUser.role || "student",
        grade: liveInspectUser.grade,
        schoolOrCollege: liveInspectUser.schoolOrCollege,
        targetExam: liveInspectUser.targetExam,
        favoriteSubject: liveInspectUser.favoriteSubject,
        dailyGoalHours: liveInspectUser.dailyGoalHours,
        phone: liveInspectUser.phone,
        bio: liveInspectUser.bio,
        joinedDate: liveInspectUser.joinedDate,
        lastLogin: liveInspectUser.lastLogin,
        isOnline: liveInspectUser.isOnline,
      },
      data: details,
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `User_Dossier_${liveInspectUser.id}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported complete JSON dossier for ${liveInspectUser.name}`);
  };

  const handleSaveStudentSettingsSeparately = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspectUser) return;
    setIsSavingInspectSettings(true);
    setInspectSettingsError(null);
    setInspectSettingsSuccess(null);

    const res = await updateUserByAdmin(liveInspectUser.id, {
      name: inspectEditName,
      email: inspectEditEmail,
      password: inspectEditPassword,
      grade: inspectEditGrade,
      schoolOrCollege: inspectEditSchool,
      targetExam: inspectEditTargetExam,
      favoriteSubject: inspectEditSubject,
      dailyGoalHours: inspectEditGoalHours,
      phone: inspectEditPhone,
      bio: inspectEditBio,
    });

    setIsSavingInspectSettings(false);
    if (!res.success) {
      setInspectSettingsError(res.error || "Failed to update student settings.");
    } else {
      setInspectSettingsSuccess(`Saved all profile fields & credentials for ${inspectEditName}.`);
      showToast(`Updated settings for ${inspectEditName}`);
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
              phone: inspectEditPhone,
              bio: inspectEditBio,
            }
          : null
      );
    }
  };

  const handleSendDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspectUser || !directNotifTitle.trim() || !directNotifMessage.trim()) return;
    setIsSendingDirectNotif(true);
    const res = await sendDirectNotificationByAdmin(liveInspectUser.id, {
      title: directNotifTitle.trim(),
      message: directNotifMessage.trim(),
      type: directNotifType,
    });
    setIsSendingDirectNotif(false);
    if (res.success) {
      setDirectNotifTitle("");
      setDirectNotifMessage("");
      showToast(`Delivered direct alert to ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Failed to send direct notification.", "error");
    }
  };

  const handleDeleteStudentFile = async (fileId: string) => {
    if (!liveInspectUser) return;
    const res = await deleteStudentFileByAdmin(liveInspectUser.id, fileId);
    if (res.success) {
      showToast("Removed file from student vault.");
    } else {
      showToast(res.error || "Failed to delete file.", "error");
    }
  };

  const handleDeleteStudentPdf = async (pdfId: string, kind: "downloaded" | "custom") => {
    if (!liveInspectUser) return;
    const res = await deleteStudentPdfByAdmin(liveInspectUser.id, pdfId, kind);
    if (res.success) {
      showToast("Removed note record from student library.");
    } else {
      showToast(res.error || "Failed to remove note record.", "error");
    }
  };

  const handleSaveStudyStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspectUser) return;
    setIsSavingStudyStats(true);
    const res = await updateStudentStudyStatsByAdmin(liveInspectUser.id, {
      studyStreak: editStreakValue,
      xp: editXpValue,
      level: editLevelValue,
      title: editRankTitle,
    });
    setIsSavingStudyStats(false);
    if (res.success) {
      showToast(`Saved XP, Rank & Streak for ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Failed to save study stats.", "error");
    }
  };

  const handleClearDataSlice = async (clearKey: string, label: string) => {
    if (!liveInspectUser) return;
    const res = await updateStudentStudyStatsByAdmin(liveInspectUser.id, { clearKey });
    if (res.success) {
      showToast(`Cleared ${label} for ${liveInspectUser.name}`);
    } else {
      showToast(res.error || `Failed to clear ${label}.`, "error");
    }
  };

  const handleAddStudentTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspectUser || !newTaskTitle.trim()) return;

    const res = await addStudentTaskByAdmin(liveInspectUser.id, {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      category: newTaskCategory.trim() || "General Study",
      dueDate: newTaskDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });

    if (res.success) {
      setNewTaskTitle("");
      showToast(`Assigned new task to ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Failed to assign task.", "error");
    }
  };

  const handleToggleStudentTask = async (taskId: string) => {
    if (!liveInspectUser) return;
    const res = await toggleStudentTaskByAdmin(liveInspectUser.id, taskId);
    if (res.success) {
      showToast("Updated task status.");
    } else {
      showToast(res.error || "Failed to update task.", "error");
    }
  };

  const handleDeleteStudentTask = async (taskId: string) => {
    if (!liveInspectUser) return;
    const res = await deleteStudentTaskByAdmin(liveInspectUser.id, taskId);
    if (res.success) {
      showToast("Deleted task from student record.");
    } else {
      showToast(res.error || "Failed to delete task.", "error");
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveInspectUser || !newEventTitle.trim()) return;
    const startIso = newEventDate
      ? new Date(`${newEventDate}T09:00:00`).toISOString()
      : new Date(Date.now() + 86400000).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 3600000).toISOString();
    const res = await addStudentCalendarEventByAdmin(liveInspectUser.id, {
      title: newEventTitle.trim(),
      startTime: startIso,
      endTime: endIso,
      category: newEventCategory,
    });
    if (res.success) {
      setNewEventTitle("");
      showToast(`Scheduled calendar event for ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Failed to schedule event.", "error");
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    if (!liveInspectUser) return;
    const res = await deleteStudentCalendarEventByAdmin(liveInspectUser.id, eventId);
    if (res.success) {
      showToast("Removed calendar event from student schedule.");
    } else {
      showToast(res.error || "Failed to delete calendar event.", "error");
    }
  };

  const handleGrantXp = async (amount: number) => {
    if (!liveInspectUser) return;
    const res = await grantStudentXpByAdmin(liveInspectUser.id, amount);
    if (res.success) {
      const updated = getStudentFullDetails(liveInspectUser.id);
      setEditXpValue(Number(updated.gameProfile?.xp || 0));
      setEditLevelValue(Number(updated.gameProfile?.level || 1));
      showToast(`Adjusted XP by ${amount >= 0 ? `+${amount}` : amount} for ${liveInspectUser.name}`);
    } else {
      showToast(res.error || "Failed to adjust XP.", "error");
    }
  };

  const handleLaunchStudentWorkspace = () => {
    if (!liveInspectUser) return;
    impersonateStudent(liveInspectUser.id);
    if (setActiveTab) {
      setActiveTab("dashboard");
    }
    showToast(`Browsing workspace as ${liveInspectUser.name}`);
  };

  const handleConfirmResetStudentData = async () => {
    if (!confirmResetUser) return;
    const res = await resetStudentIsolatedDataByAdmin(confirmResetUser.id);
    if (res.success) {
      showToast(`Reset isolated study data for ${confirmResetUser.name}`);
    } else {
      showToast(res.error || "Failed to reset student data.", "error");
    }
    setConfirmResetUser(null);
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
      showToast(`Updated account details for ${editName}`);
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
    });

    setIsSubmittingCreate(false);
    if (!res.success) {
      setCreateError(res.error || "Failed to create student account.");
    } else {
      setShowCreateModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserSchool("");
      showToast("Created and persisted student account on server.");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const res = await deleteUserByAdmin(deleteConfirmUser.id);
    if (!res.success) {
      showToast(res.error || "Failed to delete account.", "error");
    } else {
      showToast(`Deleted account ${deleteConfirmUser.name} and cleared isolated storage.`);
      setDeleteConfirmUser(null);
    }
  };

  const handleExportFullBackup = async () => {
    try {
      const res = await safeJsonFetch<{ success: boolean; snapshot?: any; error?: string }>("/api/admin/backup");
      if (!res.ok || !res.data?.success || !res.data.snapshot) {
        throw new Error(res.error || res.data?.error || "Backup export failed");
      }
      const blob = new Blob([JSON.stringify(res.data.snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ProStudyMind_Server_Backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Downloaded complete backend database snapshot.");
    } catch (err: any) {
      showToast(err?.message || "Failed to download backup.", "error");
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await safeJsonFetch<{ success: boolean; usersCount?: number; error?: string }>("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: parsed }),
      });
      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || res.data?.error || "Invalid backup file");
      }
      await refreshAdminUsersList(true);
      await refreshPlatformSettings();
      await syncAnnouncementsNow();
      fetchServerOverview();
      fetchAnnouncements();
      showToast(`Restored server backup (${res.data.usersCount ?? 0} user accounts).`);
    } catch (err: any) {
      showToast(err?.message || "Failed to restore backup file.", "error");
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    try {
      if (!isFirebaseAdminSessionActive()) {
        await ensureGoogleAdminForGlobalPublish().catch(() => false);
      }
      const res = await broadcastAnnouncementByAdmin(
        broadcastTitle.trim(),
        broadcastMessage.trim(),
        broadcastType,
        broadcastGrade
      );
      if (!res.success) {
        showToast(res.error || "Failed to send broadcast.", "error");
      } else {
        setBroadcastTitle("");
        setBroadcastMessage("");
        fetchAnnouncements();
        syncAnnouncementsNow();
        showToast(
          res.syncedToFirestore
            ? "Broadcast published globally to Backend & Firestore — live for all students!"
            : "Broadcast saved on backend server. Verify Google Sync (dandanish2332@gmail.com) to publish globally across all devices."
        );
      }
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const [apiRes, firestoreDeleted] = await Promise.all([
      safeJsonFetch<{ success: boolean; announcements?: ServerAnnouncement[]; error?: string }>(
        `/api/admin/announcements/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      ),
      deleteAnnouncementFromFirestore(id),
    ]);

    if ((apiRes.ok && apiRes.data?.success) || firestoreDeleted) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      await syncAnnouncementsNow();
      showToast("Removed announcement from server & cloud.");
    } else {
      showToast(apiRes.error || "Failed to remove announcement.", "error");
    }
  };

  const handleClearCache = async (target: "quiz" | "media" | "voice" | "chat" | "cooldowns" | "all") => {
    setIsClearingCache(target);
    try {
      const res = await safeJsonFetch<{ success: boolean; error?: string }>("/api/admin/cache/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      if (res.ok && res.data?.success) {
        await fetchServerOverview();
        showToast(`Cleared backend ${target === "all" ? "caches & model cooldowns" : `${target} cache`}.`);
      } else {
        showToast(res.error || res.data?.error || "Failed to clear server cache.", "error");
      }
    } finally {
      setIsClearingCache(null);
    }
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setIsSavingSettings(true);
    try {
      if (!isFirebaseAdminSessionActive()) {
        await ensureGoogleAdminForGlobalPublish().catch(() => false);
      }
      const payload: PlatformSettings = {
        ...settingsForm,
        updatedAt: new Date().toISOString(),
      };
      const [apiRes, firestoreSaved] = await Promise.all([
        safeJsonFetch<{ success: boolean; settings?: PlatformSettings; error?: string }>(
          "/api/admin/platform-settings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        ),
        syncPlatformSettingsToFirestore(payload),
      ]);

      if ((apiRes.ok && apiRes.data?.success) || firestoreSaved) {
        const finalSettings = apiRes.data?.settings || payload;
        setSettingsForm(finalSettings);
        await refreshPlatformSettings();
        if (apiRes.ok) {
          await fetchServerOverview();
        }
        showToast(
          firestoreSaved
            ? "Saved platform governance settings to Backend & Firestore globally — active on all devices!"
            : "Saved on backend server. Connect Google Sync (dandanish2332@gmail.com) to apply globally across all devices."
        );
      } else {
        showToast(apiRes.error || apiRes.data?.error || "Failed to save settings.", "error");
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleClearSelectedLogStream = async () => {
    if (!confirmClearStream) return;
    try {
      const endpointMap = {
        audit: "/api/admin/audit-logs",
        activity: "/api/admin/logs/activity",
        email: "/api/admin/email-logs",
        errors: "/api/admin/logs/errors",
      };
      const res = await safeJsonFetch<{ success: boolean; logs?: AdminAuditLog[]; error?: string }>(
        endpointMap[confirmClearStream],
        { method: "DELETE" }
      );
      if (res.ok && res.data?.success) {
        if (confirmClearStream === "audit") setAuditLogs(res.data.logs || []);
        if (confirmClearStream === "activity") setActivityLogs([]);
        if (confirmClearStream === "email") setEmailLogs([]);
        if (confirmClearStream === "errors") setApiErrorLogs([]);
        fetchLogsSummary();
        showToast(`Cleared ${confirmClearStream} logs.`);
      } else {
        showToast(res.error || "Failed to clear logs.", "error");
      }
    } finally {
      setConfirmClearStream(null);
    }
  };

  const handleExportLogs = (format: "csv" | "json") => {
    const stream = logStream;
    const url = `/api/admin/logs/export?stream=${encodeURIComponent(stream)}&format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `ProStudyMind_${stream}_logs_${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    showToast(`Exported ${stream} logs (${format.toUpperCase()}).`);
  };

  const handleConnectGoogleGmail = async (forceConsent = false) => {
    setIsConnectingGmail(true);
    setGmailError(null);
    try {
      const res = await googleSignIn({ forceConsent, includeGmailScopes: true });
      if (!res.accessToken) {
        throw new Error("Google did not return a Gmail access token. Please allow Gmail permissions and retry.");
      }
      setGmailConnected(true);
      setGmailAuthEmail(res.email);
      await Promise.all([
        fetchGmailProfile(res.accessToken),
        fetchGmailMessages(undefined, res.accessToken),
        fetchEmailLogs(),
      ]);
      showToast(`Connected Gmail as ${res.email}`);
    } catch (err: any) {
      const msg =
        err?.code === "auth/popup-closed-by-user"
          ? "Google sign-in popup was closed before finishing."
          : err?.message || "Failed to connect Google Gmail.";
      setGmailError(msg);
      showToast(msg, "error");
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGoogleGmail = async () => {
    await googleLogout();
    setGmailConnected(false);
    setGmailAuthEmail(null);
    setGmailProfile(null);
    setGmailMessages([]);
    setSelectedGmailMsg(null);
    showToast("Disconnected Gmail OAuth session.");
  };

  const handleSelectGmailMessage = async (msgId: string) => {
    const token = getGoogleAccessToken();
    if (!token) {
      setGmailConnected(false);
      setGmailError("Please sign in with Google to read full email contents.");
      return;
    }
    setIsLoadingGmailDetail(true);
    try {
      const res = await safeJsonFetch<{ success: boolean; message?: GmailMessageDetail; error?: string }>(
        `/api/gmail/messages/${encodeURIComponent(msgId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        setGmailConnected(false);
        setGmailError("Gmail token expired. Reconnect with Google.");
        return;
      }
      if (res.ok && res.data?.success && res.data.message) {
        setSelectedGmailMsg(res.data.message);
      } else {
        showToast(res.error || res.data?.error || "Could not load message details.", "error");
      }
    } finally {
      setIsLoadingGmailDetail(false);
    }
  };

  const handleRequestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      showToast("Recipient, subject, and message body are required.", "error");
      return;
    }
    if (!getGoogleAccessToken()) {
      setGmailConnected(false);
      showToast("Please connect your Google Gmail account first before sending.", "error");
      return;
    }
    setConfirmSendEmailOpen(true);
  };

  const handleConfirmAndSendEmail = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      setConfirmSendEmailOpen(false);
      setGmailConnected(false);
      showToast("Google OAuth token is missing or expired. Please sign in again.", "error");
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await safeJsonFetch<{ success: boolean; error?: string }>("/api/gmail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: emailTo.trim(),
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          senderEmail: gmailProfile?.emailAddress || gmailAuthEmail || "admin0011",
        }),
      });
      setConfirmSendEmailOpen(false);
      if (res.status === 401) {
        setGmailConnected(false);
        showToast("Gmail authorization expired. Reconnect Google and retry.", "error");
        return;
      }
      if (!res.ok || !res.data?.success) {
        showToast(res.error || res.data?.error || "Failed to send email via Gmail.", "error");
        fetchEmailLogs();
        return;
      }
      showToast(`Email sent to ${emailTo.trim()} via Gmail.`);
      setEmailSubject("");
      setEmailBody("");
      fetchEmailLogs();
      fetchGmailMessages(undefined, token);
      fetchLogsSummary();
    } finally {
      setIsSendingEmail(false);
    }
  };

  const openQuickEmailForUser = (userEmail: string, userName: string) => {
    setEmailTo(userEmail);
    setEmailSubject(`ProStudyMind Academic Update — ${userName}`);
    if (!emailBody.trim()) {
      setEmailBody(`Assalam-o-Alaikum ${userName},\n\n`);
    }
    setInspectUser(null);
    setSectionTab("gmail");
  };

  // Authorization Check
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Access Restricted: Master Admin Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            This backend administration console is reserved for the Master Administrator account.
          </p>
        </div>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab("dashboard")}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Toast Notification Banner */}
      {actionToast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold border ${
            actionToast.type === "error"
              ? "bg-rose-600 border-rose-500"
              : "bg-emerald-600 border-emerald-500"
          }`}
        >
          {actionToast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* Top Admin Console Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Master Administrator</span>
            <span aria-hidden="true">/</span>
            <span>Backend & Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Backend & Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Manage registered student accounts, publish server-wide broadcasts, inspect API & cache health, and monitor audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
          <button
            onClick={handleExportFullBackup}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Backup Snapshot</span>
          </button>
          <button
            onClick={async () => {
              await refreshAdminUsersList();
              await refreshPlatformSettings();
              if (sectionTab === "gmail") {
                await fetchEmailLogs();
                const tok = getGoogleAccessToken();
                if (tok) {
                  await fetchGmailProfile(tok);
                  await fetchGmailMessages(undefined, tok);
                }
              }
              if (sectionTab === "backend") await fetchServerOverview();
              if (sectionTab === "broadcasts") await fetchAnnouncements();
              if (sectionTab === "logs") {
                await fetchLogsSummary();
                await fetchActiveLogStream();
              }
              if (sectionTab === "pdf-upload") {
                await loadUploadedNotes();
              }
              showToast("Synchronized with Express backend & Firestore.");
            }}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
            title="Sync with server"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cloud Sync & Published Status Bar */}
      <div className="space-y-2">
        <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Server className={`w-3.5 h-3.5 ${backendReachable === false ? "text-amber-500" : "text-emerald-500"}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Backend API:</span>
              <span
                className={`font-bold ${
                  backendReachable === false
                    ? "text-amber-600 dark:text-amber-400"
                    : backendReachable === true
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                {backendReachable === true
                  ? "Connected"
                  : backendReachable === false
                  ? "Degraded (Firestore Fallback Active)"
                  : "Checking..."}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5">
              <Cloud className={`w-3.5 h-3.5 ${cloudAdminActive ? "text-emerald-500" : "text-amber-500"}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Cloud Sync:</span>
              <span
                className={`font-bold ${
                  cloudAdminActive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {cloudAdminActive
                  ? "Firestore Admin Verified (dandanish2332@gmail.com)"
                  : "Connect Google Firestore Sync for multi-device global PDFs & cloud rules"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleActivateGoogleCloudSync}
              disabled={isConnectingCloudSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                cloudAdminActive
                  ? "bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>
                {isConnectingCloudSync
                  ? "Connecting..."
                  : cloudAdminActive
                  ? "Verify Firestore Sync"
                  : "Activate Google Firestore Sync"}
              </span>
            </button>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab("pdfnotes")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                <span>Open Student PDF Notes</span>
              </button>
            )}
          </div>
        </div>

        {cloudSyncError && (
          <div className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{cloudSyncError}</span>
            </div>
            <button
              type="button"
              onClick={() => setCloudSyncError(null)}
              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Console Sub-Navigation Segmented Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSectionTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "users"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Users & Accounts</span>
          <span className="font-mono tabular-nums text-[11px] text-slate-400">({totalUsers})</span>
        </button>

        <button
          onClick={() => setSectionTab("gmail")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "gmail"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4 text-rose-500" />
          <span>Gmail & Email</span>
        </button>

        <button
          onClick={() => setSectionTab("broadcasts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "broadcasts"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>Broadcasts & Notices</span>
        </button>

        <button
          onClick={() => setSectionTab("backend")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "backend"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Server className="w-4 h-4 text-emerald-500" />
          <span>Backend & Server Control</span>
        </button>

        <button
          onClick={() => setSectionTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "logs"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ScrollText className="w-4 h-4 text-sky-500" />
          <span>Logs & Telemetry</span>
        </button>

        <button
          onClick={() => setSectionTab("pdf-upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            sectionTab === "pdf-upload"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Upload className="w-4 h-4 text-cyan-500" />
          <span>PDF Upload & Firestore</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: USERS & DIRECTORY                                            */}
      {/* =================================================================== */}
      {sectionTab === "users" && (
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Accounts</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {totalUsers}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Online Now</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {onlineUsersCount}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Offline</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-600 dark:text-slate-300 mt-1">
                {offlineUsersCount}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tasks Completed</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
                {completedTasksSum}/{totalTasksSum}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Quizzes Logged</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1">
                {totalQuizzesSum}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Platform XP</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {totalXpSum.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, school, grade, or password..."
                  className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    All ({totalUsers})
                  </button>
                  <button
                    onClick={() => setStatusFilter("online")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === "online"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-emerald-600"
                    }`}
                  >
                    Online ({onlineUsersCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("offline")}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === "offline"
                        ? "bg-slate-300 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Offline ({offlineUsersCount})
                  </button>
                </div>

                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Grades</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAllPasswords(!showAllPasswords)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showAllPasswords
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {showAllPasswords ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{showAllPasswords ? "Hide Passwords" : "Reveal Passwords"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>
                Showing <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{filteredUsers.length}</strong> of{" "}
                <strong className="font-mono tabular-nums text-slate-900 dark:text-white">{totalUsers}</strong> accounts
              </span>
              <span className="text-[11px]">Isolated per-student storage active</span>
            </div>
          </div>

          {/* Users Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Student & Institution</th>
                    <th className="py-3 px-4">Login Email / ID</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Grade & Exam</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Progress</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-semibold">No student accounts matched your filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isThisAdmin = user.id === "admin0011" || user.role === "admin";
                      const isPasswordShown =
                        visiblePasswords[user.id] !== undefined
                          ? visiblePasswords[user.id]
                          : showAllPasswords;

                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenInspect(user, "overview")}
                              className="flex items-center gap-3 text-left group cursor-pointer"
                            >
                              <div
                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                                  user.avatarColor || "from-indigo-500 to-purple-600"
                                } text-white font-bold text-xs flex items-center justify-center shrink-0`}
                              >
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[180px]">
                                  {user.name}
                                  {isThisAdmin && (
                                    <span className="ml-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                      · Admin
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                                  {user.schoolOrCollege || "SPS College / High School"}
                                </p>
                              </div>
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                {user.email}
                              </span>
                              <button
                                onClick={() => handleCopy(user.email, `email-${user.id}`)}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Copy email"
                              >
                                {copiedKey === `email-${user.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                              Joined {user.joinedDate}
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono">
                              <KeyRound className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-amber-200">
                                {isPasswordShown ? user.passwordText : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title={isPasswordShown ? "Mask password" : "Reveal password"}
                              >
                                {isPasswordShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => handleCopy(user.passwordText, `pass-${user.id}`)}
                                className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Copy password"
                              >
                                {copiedKey === `pass-${user.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.grade}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                              {user.targetExam || "Annual Board Exam"}
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            {user.isOnline ? (
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                Active now
                              </span>
                            ) : (
                              <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Offline</p>
                                <p className="text-[11px] font-mono tabular-nums text-slate-400">
                                  {user.lastActiveFormatted}
                                </p>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user.gameXp.toLocaleString()} XP · Lvl {user.gameLevel} · {user.studyStreak}d
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {user.completedTasksCount}/{user.tasksCount} tasks · {user.filesCount} files · {user.quizzesCompleted} quizzes
                            </p>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInspect(user, "overview")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                                title="Inspect complete student data"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Full Details</span>
                              </button>
                              {user.email.includes("@") && (
                                <button
                                  onClick={() => openQuickEmailForUser(user.email, user.name)}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Send Gmail to student"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
                                title="Edit credentials"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {!isThisAdmin && (
                                <button
                                  onClick={() => setDeleteConfirmUser(user)}
                                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete account"
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
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1B: GMAIL & EMAIL WORKSPACE                                     */}
      {/* =================================================================== */}
      {sectionTab === "gmail" && (
        <div className="space-y-5">
          {/* Google Workspace OAuth Connection Banner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Google Workspace Gmail Integration
                </h2>
                {gmailConnected ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    · Connected
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    · Authorization Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {gmailConnected
                  ? `Authenticated as ${gmailProfile?.emailAddress || gmailAuthEmail || "Google Workspace User"}. Access token is held strictly in memory.`
                  : "Connect your Google account with Gmail read & send permissions to browse inbox threads and dispatch student emails directly."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {!gmailConnected ? (
                <button
                  type="button"
                  onClick={() => handleConnectGoogleGmail(true)}
                  disabled={isConnectingGmail}
                  className="gsi-material-button flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold border border-slate-300 shadow-xs whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <div className="w-4 h-4 shrink-0">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span>{isConnectingGmail ? "Connecting..." : "Sign in with Google"}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      fetchGmailProfile();
                      fetchGmailMessages();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? "animate-spin" : ""}`} />
                    <span>Sync Inbox</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConnectGoogleGmail(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGoogleGmail}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {gmailError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gmailError}</span>
              </div>
              {!gmailConnected && (
                <button
                  type="button"
                  onClick={() => handleConnectGoogleGmail(true)}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reconnect Gmail
                </button>
              )}
            </div>
          )}

          {/* Gmail Profile Metrics Strip */}
          {gmailProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono tabular-nums">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Mailbox Address</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {gmailProfile.emailAddress || gmailAuthEmail}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Total Messages</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {(gmailProfile.messagesTotal || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Total Threads</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {(gmailProfile.threadsTotal || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Composer + Live Inbox Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Compose Email Form */}
            <form
              onSubmit={handleRequestSendEmail}
              className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs self-start"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Compose & Send via Gmail</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a registered student or enter any recipient email. Confirmation is required before dispatch.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quick Pick Student Recipient
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const selected = usersList.find((u) => u.email === e.target.value);
                    if (selected) {
                      setEmailTo(selected.email);
                      if (!emailSubject.trim()) {
                        setEmailSubject(`ProStudyMind Academic Update — ${selected.name}`);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select student to auto-fill email...</option>
                  {usersList
                    .filter((u) => u.email.includes("@"))
                    .map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.email}) — {u.grade}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email (To) *
                </label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Weekly Study Plan & Exam Schedule"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Body *
                </label>
                <textarea
                  rows={6}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Write your official message..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingEmail ? "Dispatching..." : "Review & Send Email"}</span>
              </button>
            </form>

            {/* Gmail Inbox List & Message Reader */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-indigo-500" />
                    <span>Gmail Inbox Explorer</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search recent messages via Gmail API
                  </p>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchGmailMessages();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={gmailQuery}
                    onChange={(e) => setGmailQuery(e.target.value)}
                    placeholder="Search Gmail (e.g. from:student)..."
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-48"
                  />
                  <button
                    type="submit"
                    disabled={!gmailConnected || isLoadingGmail}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
                  >
                    Search
                  </button>
                </form>
              </div>

              {!gmailConnected ? (
                <div className="p-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2 text-xs">
                  <Mail className="w-8 h-8 mx-auto opacity-40" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    Connect Google to browse your live Gmail messages
                  </p>
                  <p className="text-[11px]">
                    Email delivery logs remain accessible below even when Gmail is disconnected.
                  </p>
                </div>
              ) : isLoadingGmail ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                  ))}
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  No Gmail messages matched this query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 space-y-2 max-h-96 overflow-y-auto pr-1">
                    {gmailMessages.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => handleSelectGmailMessage(msg.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                          selectedGmailMsg?.id === msg.id
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {msg.from}
                          </span>
                          {msg.isUnread && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                              Unread
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {msg.snippet}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="md:col-span-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex flex-col max-h-96">
                    {isLoadingGmailDetail ? (
                      <p className="text-slate-400 py-8 text-center">Loading message body...</p>
                    ) : !selectedGmailMsg ? (
                      <div className="py-12 text-center text-slate-400 space-y-1 m-auto">
                        <Inbox className="w-6 h-6 mx-auto opacity-40" />
                        <p>Select an email thread on the left to read its full body.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 overflow-y-auto flex-1">
                        <div className="pb-2 border-b border-slate-200 dark:border-slate-800 space-y-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {selectedGmailMsg.subject}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono break-all">
                            From: {selectedGmailMsg.from}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {selectedGmailMsg.date}
                          </p>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedGmailMsg.bodyText}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Persistent Email Delivery & Sync History Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Email Delivery & Dispatch History ({emailLogs.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Persisted server-side audit of every outbound email sent or attempted through Gmail API
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchEmailLogs()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {isLoadingEmailLogs ? (
              <p className="text-xs text-slate-400 py-4">Loading email logs...</p>
            ) : emailLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No email dispatches recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      <th className="py-2 pr-3">Timestamp</th>
                      <th className="py-2 px-3">Recipient</th>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Actor</th>
                      <th className="py-2 pl-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {emailLogs.slice(0, 25).map((log) => (
                      <tr key={log.id}>
                        <td className="py-2 pr-3 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-800 dark:text-slate-200">{log.to}</td>
                        <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">
                          {log.subject}
                          {log.error && (
                            <p className="text-[11px] text-rose-500 font-normal">{log.error}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{log.actor}</td>
                        <td
                          className={`py-2 pl-3 text-right font-semibold uppercase text-[11px] ${
                            log.status === "sent"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : log.status === "failed"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {log.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: BROADCASTS & ANNOUNCEMENTS                                   */}
      {/* =================================================================== */}
      {sectionTab === "broadcasts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Compose Broadcast */}
          <form
            onSubmit={handlePublishBroadcast}
            className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 self-start"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Publish Server Announcement</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Persists to backend storage and delivers to matching student notification centers across sessions.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. BISE 2026 Physics Model Papers Uploaded"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Type
                  </label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as ServerAnnouncement["type"])}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="urgent">Urgent Notice</option>
                    <option value="info">Academic Info</option>
                    <option value="reminder">Exam Reminder</option>
                    <option value="security">Security Advisory</option>
                    <option value="sync">Platform Update</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={broadcastGrade}
                    onChange={(e) => setBroadcastGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="All Levels">All Students</option>
                    {GRADE_OPTIONS.filter((g) => g !== "All Levels (Master Admin)" && g !== "All Levels").map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write the full announcement details for students..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingBroadcast}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingBroadcast ? "Publishing..." : "Publish Broadcast"}</span>
              </button>
            </div>
          </form>

          {/* Active Announcements List */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Published Announcements</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored in backend database ({announcements.length} active)
                </p>
              </div>
              <button
                onClick={fetchAnnouncements}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {isLoadingAnnouncements ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-1.5">
                <Megaphone className="w-7 h-7 mx-auto opacity-40" />
                <p className="text-xs font-semibold">No broadcasts published yet.</p>
                <p className="text-[11px]">Use the form on the left to notify students.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span
                          className={`font-bold uppercase ${
                            ann.type === "urgent"
                              ? "text-rose-600 dark:text-rose-400"
                              : ann.type === "security"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {ann.type}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Audience: {ann.targetGrade}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(ann.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ann.message}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors shrink-0 cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: BACKEND & SERVER CONTROL                                     */}
      {/* =================================================================== */}
      {sectionTab === "backend" && (
        <div className="space-y-5">
          {isLoadingOverview && !overview ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : overview ? (
            <>
              {/* Live Server KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Express Runtime</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                    Healthy · {formatUptime(overview.server.uptimeSeconds)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {overview.server.nodeVersion} · PID {overview.server.pid}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Process Memory</span>
                    <HardDrive className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    {overview.server.memory.rssMb} MB RSS
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Heap: {overview.server.memory.heapUsedMb} / {overview.server.memory.heapTotalMb} MB
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>API Traffic</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                    {overview.traffic.totalApiRequests.toLocaleString()} calls
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Avg latency: {overview.traffic.avgLatencyMs} ms
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Gemini AI Engine</span>
                    <Brain className="w-4 h-4 text-purple-500" />
                  </div>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      overview.ai.geminiConfigured
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {overview.ai.geminiConfigured ? "Configured" : "Fallback Mode"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    {Object.keys(overview.ai.activeCooldowns).length} model cooldown(s)
                  </p>
                </div>
              </div>

              {/* FastCache + Storage Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* In-Memory FastCache Panel */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">In-Memory FastCache</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        LRU caches powering sub-millisecond quiz, media, voice, and chat responses
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleClearCache("cooldowns")}
                        disabled={isClearingCache !== null}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        Reset Cooldowns
                      </button>
                      <button
                        onClick={() => handleClearCache("all")}
                        disabled={isClearingCache !== null}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        {isClearingCache === "all" ? "Flushing..." : "Flush All Caches"}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <th className="py-2 pr-3">Cache Pool</th>
                          <th className="py-2 px-3 text-right">Entries</th>
                          <th className="py-2 px-3 text-right">TTL</th>
                          <th className="py-2 px-3 text-right">Hits / Misses</th>
                          <th className="py-2 px-3 text-right">Hit Rate</th>
                          <th className="py-2 pl-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                        {(["quiz", "media", "voice", "chat"] as const).map((key) => {
                          const c = overview.ai.caches[key];
                          return (
                            <tr key={key}>
                              <td className="py-2.5 pr-3 font-sans font-semibold capitalize text-slate-900 dark:text-white">
                                {key} Cache
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                                {c.size} / {c.maxItems}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-500">{c.ttlMinutes}m</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                                {c.hits} / {c.misses}
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                {c.hitRatePercent}%
                              </td>
                              <td className="py-2.5 pl-3 text-right font-sans">
                                <button
                                  onClick={() => handleClearCache(key)}
                                  disabled={isClearingCache !== null}
                                  className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  Flush
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* JSON Persistence Storage & Backup Restore */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">JSON Data Store</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Server-side files in data directory
                      </p>
                    </div>
                    <Database className="w-4 h-4 text-indigo-500" />
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono tabular-nums">
                    {overview.database.storageFiles.map((f) => (
                      <div key={f.name} className="py-2 flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300">{f.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">{formatBytes(f.bytes)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleExportFullBackup}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      <span>Download Snapshot</span>
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isRestoringBackup ? "Restoring..." : "Restore JSON"}</span>
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={handleRestoreBackupFile}
                        disabled={isRestoringBackup}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Platform Governance Settings + API Endpoint Traffic */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Platform Governance Settings */}
                {settingsForm && (
                  <form
                    onSubmit={handleSavePlatformSettings}
                    className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs"
                  >
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Platform Settings</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live configuration persisted on server
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={settingsForm.platformName || "PRO Study Mind v2.0"}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, platformName: e.target.value })
                          }
                          placeholder="PRO Study Mind v2.0"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Global Notice / Maintenance Banner
                        </label>
                        <input
                          type="text"
                          value={settingsForm.maintenanceBanner}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, maintenanceBanner: e.target.value })
                          }
                          placeholder="Leave empty to hide top banner"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Support Contact Email
                          </label>
                          <input
                            type="email"
                            value={settingsForm.supportEmail}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, supportEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Default Goal (Hours)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={16}
                            value={settingsForm.defaultDailyGoalHours}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                defaultDailyGoalHours: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Allow Public Student Signup
                          </span>
                          <input
                            type="checkbox"
                            checked={settingsForm.allowPublicSignup}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, allowPublicSignup: e.target.checked })
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>

                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Enable AI Tutor Endpoints
                          </span>
                          <input
                            type="checkbox"
                            checked={settingsForm.aiTutorEnabled}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, aiTutorEnabled: e.target.checked })
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>

                        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Enable Adsterra Ad Placements
                          </span>
                          <input
                            type="checkbox"
                            checked={settingsForm.adPlacementsEnabled}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, adPlacementsEnabled: e.target.checked })
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer"
                      >
                        {isSavingSettings ? "Saving Settings..." : "Save Platform Configuration"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Top API Routes Table */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">API Route Telemetry</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live request counts and average latency per Express endpoint
                      </p>
                    </div>
                    <button
                      onClick={fetchServerOverview}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Refresh
                    </button>
                  </div>

                  {overview.traffic.topRoutes.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">No API requests recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                            <th className="py-2 pr-3">Endpoint</th>
                            <th className="py-2 px-3 text-right">Hits</th>
                            <th className="py-2 px-3 text-right">Errors</th>
                            <th className="py-2 pl-3 text-right">Avg Latency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                          {overview.traffic.topRoutes.map((r) => (
                            <tr key={r.route}>
                              <td className="py-2 pr-3 text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
                                {r.route}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
                                {r.hits}
                              </td>
                              <td
                                className={`py-2 px-3 text-right ${
                                  r.errors > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-400"
                                }`}
                              >
                                {r.errors}
                              </td>
                              <td className="py-2 pl-3 text-right text-slate-600 dark:text-slate-300">
                                {r.avgLatencyMs} ms
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent API Errors & Active Cooldown Diagnostics */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Recent API Errors & Model Cooldowns
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ring buffer of the latest HTTP 4xx/5xx responses and active Gemini rate-limit cooldowns
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {overview.traffic.recentErrors.length} error(s) ·{" "}
                    {Object.keys(overview.ai.activeCooldowns).length} cooldown(s)
                  </span>
                </div>

                {Object.keys(overview.ai.activeCooldowns).length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    {Object.entries(overview.ai.activeCooldowns).map(([model, secs]) => (
                      <span
                        key={model}
                        className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                      >
                        {model}: {secs}s remaining
                      </span>
                    ))}
                  </div>
                )}

                {overview.traffic.recentErrors.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-2">
                    No API errors recorded since server start.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans text-slate-500">
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 px-3">Route</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 pl-3">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {overview.traffic.recentErrors.slice(0, 10).map((err, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">
                              {new Date(err.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{err.route}</td>
                            <td className="py-2 px-3 text-rose-600 dark:text-rose-400 font-bold">
                              {err.statusCode}
                            </td>
                            <td className="py-2 pl-3 text-slate-600 dark:text-slate-300 font-sans">
                              {err.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: MULTI-STREAM LOGS & TELEMETRY EXPLORER                       */}
      {/* =================================================================== */}
      {sectionTab === "logs" && (
        <div className="space-y-4">
          {/* Unified Log Stream Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono tabular-nums">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Audit Events</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {logsSummary?.auditCount ?? auditLogs.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Auth & Logins</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {logsSummary?.authCount ?? authLogs.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Student Activity</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {logsSummary?.activityCount ?? activityLogs.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Email Logs</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {logsSummary?.emailCount ?? emailLogs.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">API Errors</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {logsSummary?.errorCount ?? apiErrorLogs.length}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">Total API Calls</p>
              <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {(logsSummary?.totalApiRequests ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stream Switcher + Search + Export Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-100 dark:border-slate-800">
              {(
                [
                  { id: "audit", label: "Audit Trail", icon: ScrollText },
                  { id: "auth", label: "Auth & Logins", icon: LogIn },
                  { id: "activity", label: "Student Activity", icon: Activity },
                  { id: "email", label: "Email Logs", icon: Mail },
                  { id: "errors", label: "API Errors", icon: AlertTriangle },
                ] as const
              ).map((st) => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setLogStream(st.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      logStream === st.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder={`Search ${logStream} logs...`}
                    className="pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 w-64"
                  />
                </div>

                {logStream === "audit" && (
                  <select
                    value={logCategoryFilter}
                    onChange={(e) => setLogCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="auth">Authentication</option>
                    <option value="admin">Admin Actions</option>
                    <option value="system">System & Cache</option>
                  </select>
                )}

                {logStream === "activity" && (
                  <select
                    value={activityFeatureFilter}
                    onChange={(e) => setActivityFeatureFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Features</option>
                    <option value="auth">Auth</option>
                    <option value="quiz">Quizzes</option>
                    <option value="games">Educational Games</option>
                    <option value="files">File Vault</option>
                    <option value="pdfs">Notes & PDFs</option>
                    <option value="lectures">Video Lectures</option>
                    <option value="dictionary">Dictionary</option>
                    <option value="tasks">Tasks</option>
                    <option value="calendar">Calendar</option>
                    <option value="gmail">Gmail</option>
                    <option value="profile">Profile</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleExportLogs("csv")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportLogs("json")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FileJson className="w-3.5 h-3.5 text-amber-500" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fetchLogsSummary();
                    fetchActiveLogStream();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Refresh
                </button>
                {logStream !== "auth" && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearStream(logStream)}
                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Clear Stream
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stream Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {logStream === "audit" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Loading server audit logs...
                        </td>
                      </tr>
                    ) : filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No audit events matched.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`font-semibold uppercase text-[11px] ${
                                log.category === "admin"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : log.category === "auth"
                                  ? "text-indigo-600 dark:text-indigo-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {log.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {log.actor}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {log.details}
                            {log.target && <span className="text-slate-400 font-mono"> · {log.target}</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {logStream === "auth" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event</th>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Loading authentication logs...
                        </td>
                      </tr>
                    ) : filteredAuthLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No login or sign-up events recorded yet.
                        </td>
                      </tr>
                    ) : (
                      filteredAuthLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {log.actor}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[11px] font-bold uppercase ${
                                log.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {log.details}
                            {log.target && <span className="text-slate-400 font-mono"> · {log.target}</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {logStream === "activity" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Feature</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Loading student activity stream...
                        </td>
                      </tr>
                    ) : filteredActivityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No student feature telemetry logged yet.
                        </td>
                      </tr>
                    ) : (
                      filteredActivityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-semibold uppercase text-[11px] text-emerald-600 dark:text-emerald-400">
                            {log.feature}
                          </td>
                          <td className="py-2.5 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white">{log.userName || log.userEmail}</p>
                            <p className="text-[11px] font-mono text-slate-400">{log.userEmail}</p>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {logStream === "email" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject & Preview</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          Loading email delivery logs...
                        </td>
                      </tr>
                    ) : filteredEmailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No email dispatch records logged yet.
                        </td>
                      </tr>
                    ) : (
                      filteredEmailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono uppercase text-[11px] text-slate-500">
                            {log.direction}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {log.to}
                          </td>
                          <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-white">{log.subject}</p>
                            {log.error ? (
                              <p className="text-[11px] text-rose-500">{log.error}</p>
                            ) : (
                              log.snippet && <p className="text-[11px] text-slate-400 truncate max-w-md">{log.snippet}</p>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className={`text-[11px] font-bold uppercase ${
                                log.status === "sent"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : log.status === "failed"
                                  ? "text-rose-500"
                                  : "text-indigo-500"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {logStream === "errors" && (
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-sans font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">HTTP Status</th>
                      <th className="py-3 px-4">Error Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center font-sans text-slate-400">
                          Loading API error buffer...
                        </td>
                      </tr>
                    ) : filteredApiErrorLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center font-sans text-emerald-600 dark:text-emerald-400 font-semibold">
                          Zero API errors recorded in active server buffer.
                        </td>
                      </tr>
                    ) : (
                      filteredApiErrorLogs.map((err, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(err.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">{err.route}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-600 dark:text-rose-400">{err.statusCode}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-300">{err.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: PDF UPLOAD & FIRESTORE STORAGE                                 */}
      {/* =================================================================== */}
      {sectionTab === "pdf-upload" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/60 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-cyan-300 shrink-0">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold">PDF Upload & Firestore Storage Console</h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Upload any local PDF note verbatim without edits. It is automatically published into the dedicated Student PDF Notes Mode under the selected Class & Subject.
                  </p>
                </div>
              </div>
              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab("pdfnotes")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in PDF Notes Mode</span>
                </button>
              )}
            </div>

            {/* Global All-Device Publishing Indicator */}
            <div
              className={`px-4 py-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                cloudAdminActive
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/60 border-amber-500/50 text-amber-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cloud className={`w-4 h-4 shrink-0 ${cloudAdminActive ? "text-emerald-400" : "text-amber-400"}`} />
                <span>
                  {cloudAdminActive ? (
                    <>
                      <strong className="text-white">Global All-Device Publishing Active:</strong> Uploaded PDFs are stored directly in Cloud Firestore so every student on every device sees & downloads them immediately.
                    </>
                  ) : (
                    <>
                      <strong className="text-white">Google Admin Verification Needed for Global Sync:</strong> Click Verify (or submit the upload form) with <span className="font-mono text-amber-300">dandanish2332@gmail.com</span> so PDFs publish globally to everyone instead of only your device.
                    </>
                  )}
                </span>
              </div>
              {!cloudAdminActive && (
                <button
                  type="button"
                  onClick={handleActivateGoogleCloudSync}
                  disabled={isConnectingCloudSync}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  {isConnectingCloudSync ? "Verifying..." : "Verify Google Sync Now"}
                </button>
              )}
            </div>

            <form onSubmit={handleAdminPdfUploadSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Subject *</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
                  >
                    {PDF_SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Class / Grade *</label>
                  <select
                    value={uploadGrade}
                    onChange={(e) => setUploadGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
                  >
                    {PDF_GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-400"
                  >
                    {PDF_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Page Count (Approx.)</label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={uploadPageCount}
                    onChange={(e) => setUploadPageCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Note / Document Title *</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g., Chapter 12 Current Electricity Full PDF Notes"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Description / Summary</label>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief description for students..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Choose PDF File from Local Device *</label>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/60 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 transition-colors">
                  <input
                    ref={pdfFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleAdminPdfFileSelect}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
                {selectedPdfFile && (
                  <p className="text-[11px] text-cyan-300 font-mono">
                    Selected: {selectedPdfFile.name} ({Math.max(1, Math.round(selectedPdfFile.size / 1024))} KB) — Verbatim PDF binary preserved
                  </p>
                )}
              </div>

              {/* Upload Progress Indicator */}
              {isUploadingPdf && (
                <div className="space-y-2 p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/50">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-200 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                      {uploadStatusText || "Uploading to Firestore & Cloud Storage..."}
                    </span>
                    <span className="text-cyan-300 font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {lastUploadedPdfBanner && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>"{lastUploadedPdfBanner.title}"</strong> is now live in <strong>PDF Notes Mode</strong> for all users ({lastUploadedPdfBanner.grade} · {lastUploadedPdfBanner.subject}).
                    </span>
                  </div>
                  {setActiveTab && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("pdfnotes")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open PDF Notes Mode →
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoOpenPdfNotesAfterUpload}
                    onChange={(e) => setAutoOpenPdfNotesAfterUpload(e.target.checked)}
                    className="rounded border-slate-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>Automatically open PDF Notes Mode after publishing</span>
                </label>
                <button
                  type="submit"
                  disabled={isUploadingPdf || !selectedPdfFile}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingPdf ? "Uploading..." : "Upload & Publish to PDF Notes Mode"}
                </button>
              </div>
            </form>
          </div>

          {/* Uploaded History List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Published Original PDF Library ({uploadedNotesHistory.length})
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {uploadedNotesHistory.some(
                  (n) => n.storageType !== "firestore_chunks" && n.storageType !== "static_asset"
                ) && (
                  <button
                    type="button"
                    onClick={handleSyncAllLocalPdfs}
                    disabled={isSyncingAllLocalPdfs}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isSyncingAllLocalPdfs ? "Publishing All..." : "Publish Local PDFs to Everyone"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadUploadedNotes}
                  disabled={isLoadingUploadedNotes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUploadedNotes ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {uploadedNotesHistory.some(
              (n) => n.storageType !== "firestore_chunks" && n.storageType !== "static_asset"
            ) && (
              <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Some older PDFs below were saved only to your local server. Click <strong>Publish to Everyone</strong> to push them to Cloud Firestore so every student on all devices can see them.
                </span>
              </div>
            )}

            <div className="space-y-2.5">
              {uploadedNotesHistory.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No PDF notes uploaded yet.</p>
              ) : (
                uploadedNotesHistory.map((note) => {
                  const isGlobal = note.storageType === "firestore_chunks" || note.storageType === "firebase_storage";
                  const storageBadge =
                    note.storageType === "firebase_storage"
                      ? "Firebase Storage (Global)"
                      : note.storageType === "firestore_chunks"
                      ? "Global Cloud (All Devices)"
                      : note.storageType === "static_asset"
                      ? "Official Built-In PDF"
                      : "Local Device Only";
                  const isConfirming = confirmDeletePdfId === note.id;

                  return (
                    <div
                      key={note.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {note.subject} • {note.grade}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isGlobal
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {storageBadge}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {note.pageCount}p · {note.fileSizeKb >= 1024 ? `${(note.fileSizeKb / 1024).toFixed(1)} MB` : `${note.fileSizeKb} KB`} · {note.lastUpdated}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{note.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{note.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {!isGlobal && note.storageType !== "static_asset" && (
                          <button
                            type="button"
                            onClick={() => handlePublishSingleLocalPdf(note)}
                            disabled={syncingPdfId === note.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>{syncingPdfId === note.id ? "Publishing..." : "Publish to Everyone"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadUploadedPdf(note)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>

                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={deletingPdfId === note.id}
                              onClick={() => handleDeleteUploadedPdf(note)}
                              className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                            >
                              {deletingPdfId === note.id ? "Deleting..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePdfId(null)}
                              className="px-2 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePdfId(note.id)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                            title="Delete PDF from library"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: Complete 360° Student Dossier & Live Backend Inspection    */}
      {/* =================================================================== */}
      {liveInspectUser && (() => {
        const details = getStudentFullDetails(liveInspectUser.id);
        const completedTasks = details.tasks.filter((t) => t.status === "completed" || t.completed);
        const filteredInspectTasks = details.tasks.filter((t) => {
          const isDone = t.status === "completed" || t.completed;
          if (taskInspectFilter === "completed") return isDone;
          if (taskInspectFilter === "pending") return !isDone;
          return true;
        });
        const avgQuizPct =
          details.quizHistory.length > 0
            ? Math.round(
                details.quizHistory.reduce((acc, q) => acc + Number(q.percentage || 0), 0) /
                  details.quizHistory.length
              )
            : 0;
        const rawDossierPayload = {
          user: {
            id: liveInspectUser.id,
            name: liveInspectUser.name,
            email: liveInspectUser.email,
            password: liveInspectUser.passwordText,
            role: liveInspectUser.role || "student",
            grade: liveInspectUser.grade,
            schoolOrCollege: liveInspectUser.schoolOrCollege,
            targetExam: liveInspectUser.targetExam,
            favoriteSubject: liveInspectUser.favoriteSubject,
            dailyGoalHours: liveInspectUser.dailyGoalHours,
            phone: liveInspectUser.phone,
            bio: liveInspectUser.bio,
            joinedDate: liveInspectUser.joinedDate,
            lastLogin: liveInspectUser.lastLogin,
            isOnline: liveInspectUser.isOnline,
          },
          isolatedData: details,
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[93vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      liveInspectUser.avatarColor || "from-indigo-500 to-purple-600"
                    } text-white font-bold text-sm flex items-center justify-center shrink-0`}
                  >
                    {liveInspectUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {liveInspectUser.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          liveInspectUser.isOnline
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {liveInspectUser.isOnline ? "Online Now" : `Offline · ${liveInspectUser.lastActiveFormatted}`}
                      </span>
                      {(liveInspectUser.id === "admin0011" || liveInspectUser.role === "admin") && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
                          Master Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {liveInspectUser.email} · {liveInspectUser.grade} · ID: {liveInspectUser.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {liveInspectUser.email.includes("@") && (
                    <button
                      type="button"
                      onClick={() => openQuickEmailForUser(liveInspectUser.email, liveInspectUser.name)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white font-semibold text-xs border border-rose-200 dark:border-rose-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      title="Compose Gmail message to this student"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Student</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshInspectLive}
                    disabled={isRefreshingInspect}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    title="Pull latest user data from Express backend"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingInspect ? "animate-spin text-indigo-500" : ""}`} />
                    <span>{isRefreshingInspect ? "Syncing..." : "Sync Live"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportUserDossierJson}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    title="Download complete JSON dossier for this user"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden md:inline">Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLaunchStudentWorkspace}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectUser(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="px-4 sm:px-5 pt-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold pb-2.5">
                  {[
                    { id: "overview", label: "360° Overview", icon: UserCheck },
                    { id: "settings", label: "Edit Profile", icon: Sliders },
                    { id: "tasks", label: `Tasks (${details.tasks.length})`, icon: CheckSquare },
                    { id: "files", label: `Files (${details.files.length})`, icon: Folder },
                    { id: "calendar", label: `Calendar (${details.calendar.length})`, icon: Calendar },
                    {
                      id: "learning",
                      label: `Notes & Lectures (${details.downloadedPdfs.length + details.customPdfs.length + details.savedLectures.length})`,
                      icon: BookOpen,
                    },
                    {
                      id: "activity",
                      label: `Quizzes & Logs (${details.quizHistory.length + details.chatHistory.length + details.notifications.length})`,
                      icon: Brain,
                    },
                    {
                      id: "gaming",
                      label: `XP, Streak & Raw (${details.gameProfile?.xp ?? liveInspectUser.gameXp})`,
                      icon: Award,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setInspectTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          inspectTab === tab.id
                            ? "bg-indigo-600 text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
                {/* TAB 1: 360° OVERVIEW */}
                {inspectTab === "overview" && (
                  <div className="space-y-5">
                    {/* Complete Data KPI Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] font-sans text-slate-500">Level & Total XP</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Lvl {details.gameProfile?.level || 1} · {Number(details.gameProfile?.xp || 0).toLocaleString()} XP
                        </p>
                        <p className="text-[11px] font-sans text-slate-400 truncate">
                          {details.gameProfile?.title || "Novice Scholar"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] font-sans text-slate-500">Study Tasks</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {completedTasks.length} / {details.tasks.length} Done
                        </p>
                        <p className="text-[11px] font-sans text-slate-400">
                          Streak: {details.studyStreak || 0} days
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] font-sans text-slate-500">Quizzes & Vocab</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                          {details.quizHistory.length} Quizzes ({avgQuizPct}%)
                        </p>
                        <p className="text-[11px] font-sans text-slate-400">
                          {details.dictBookmarks.length} bookmarks · {details.dictRecents.length} searches
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-[11px] font-sans text-slate-500">Files, PDFs & Lectures</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                          {details.files.length} Files · {details.downloadedPdfs.length + details.customPdfs.length} PDFs
                        </p>
                        <p className="text-[11px] font-sans text-slate-400">
                          {details.savedLectures.length} saved · {details.watchedLectures.length} watched
                        </p>
                      </div>
                    </div>

                    {/* Profile & Credentials Dossier Card + Direct Message */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-7 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Identity, Credentials & Academic Profile
                          </h4>
                          <button
                            type="button"
                            onClick={() => setInspectTab("settings")}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                          >
                            Edit All Fields →
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[11px] text-slate-400">Email / Login ID</p>
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-white">
                              <span className="truncate">{liveInspectUser.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(liveInspectUser.email, "ov-email")}
                                className="text-slate-400 hover:text-indigo-500 cursor-pointer"
                              >
                                {copiedKey === "ov-email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">Password</p>
                            <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-600 dark:text-amber-300">
                              <span>{showInspectPassword ? liveInspectUser.passwordText : "••••••••"}</span>
                              <button
                                type="button"
                                onClick={() => setShowInspectPassword(!showInspectPassword)}
                                className="text-slate-400 hover:text-indigo-500 cursor-pointer"
                              >
                                {showInspectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(liveInspectUser.passwordText, "ov-pass")}
                                className="text-slate-400 hover:text-amber-500 cursor-pointer"
                              >
                                {copiedKey === "ov-pass" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">School / College</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {liveInspectUser.schoolOrCollege || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">Target Board / Exam</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {liveInspectUser.targetExam || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">Favorite Subject & Goal</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {liveInspectUser.favoriteSubject || "General"} · {liveInspectUser.dailyGoalHours || 3} hrs/day
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-400">Phone & Joined</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {liveInspectUser.phone || "No phone"} · {liveInspectUser.joinedDate}
                            </p>
                          </div>
                        </div>
                        {liveInspectUser.bio && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] text-slate-400 mb-0.5">Student Bio</p>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{liveInspectUser.bio}</p>
                          </div>
                        )}
                      </div>

                      {/* Send Direct Targeted Alert to this Student */}
                      <form
                        onSubmit={handleSendDirectNotification}
                        className="lg:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-500" />
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            Send Direct Student Alert
                          </h4>
                        </div>
                        <input
                          type="text"
                          required
                          value={directNotifTitle}
                          onChange={(e) => setDirectNotifTitle(e.target.value)}
                          placeholder="Alert title (e.g. Exam Homework Reminder)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <textarea
                          rows={2}
                          required
                          value={directNotifMessage}
                          onChange={(e) => setDirectNotifMessage(e.target.value)}
                          placeholder={`Direct message for ${liveInspectUser.name}...`}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={directNotifType}
                            onChange={(e) => setDirectNotifType(e.target.value as any)}
                            className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          >
                            <option value="info">Info</option>
                            <option value="urgent">Urgent</option>
                            <option value="reminder">Reminder</option>
                            <option value="security">Security</option>
                          </select>
                          <button
                            type="submit"
                            disabled={isSendingDirectNotif}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSendingDirectNotif ? "Sending..." : "Deliver Alert"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 2: FULL EDIT PROFILE & CREDENTIALS */}
                {inspectTab === "settings" && (
                  <div className="space-y-4">
                    {inspectSettingsSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{inspectSettingsSuccess}</span>
                      </div>
                    )}

                    {inspectSettingsError && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{inspectSettingsError}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveStudentSettingsSeparately} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-700 dark:text-slate-300">
                              Account Password
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setShowInspectPassword(!showInspectPassword)}
                                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                {showInspectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span>{showInspectPassword ? "Mask" : "Show"}</span>
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
                          <input
                            type={showInspectPassword ? "text" : "password"}
                            required
                            value={inspectEditPassword}
                            onChange={(e) => setInspectEditPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-amber-300 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={inspectEditPhone}
                              onChange={(e) => setInspectEditPhone(e.target.value)}
                              placeholder="+92 300 0000000"
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Target Board Examination
                          </label>
                          <input
                            type="text"
                            value={inspectEditTargetExam}
                            onChange={(e) => setInspectEditTargetExam(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Favorite Subject
                          </label>
                          <input
                            type="text"
                            value={inspectEditSubject}
                            onChange={(e) => setInspectEditSubject(e.target.value)}
                            placeholder="e.g. Physics"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Daily Goal (Hours)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={16}
                            value={inspectEditGoalHours}
                            onChange={(e) => setInspectEditGoalHours(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Student Bio / Notes
                        </label>
                        <textarea
                          rows={2}
                          value={inspectEditBio}
                          onChange={(e) => setInspectEditBio(e.target.value)}
                          placeholder="Academic background, goals, or admin notes..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        {liveInspectUser.id !== "admin0011" ? (
                          <button
                            type="button"
                            onClick={() => setConfirmResetUser(liveInspectUser)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-semibold transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Study Data</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Protected master admin account</span>
                        )}

                        <button
                          type="submit"
                          disabled={isSavingInspectSettings}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer flex items-center gap-2"
                        >
                          {isSavingInspectSettings ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Save Student Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 3: TASKS */}
                {inspectTab === "tasks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        {(["all", "pending", "completed"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setTaskInspectFilter(f)}
                            className={`px-3 py-1 rounded-lg capitalize cursor-pointer ${
                              taskInspectFilter === f
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        {completedTasks.length} completed / {details.tasks.length} total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {filteredInspectTasks.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                          No tasks matching this filter for {liveInspectUser.name}.
                        </div>
                      ) : (
                        filteredInspectTasks.map((task) => {
                          const isDone = task.status === "completed" || task.completed;
                          return (
                            <div
                              key={task.id}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentTask(task.id)}
                                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                    isDone
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-slate-300 dark:border-slate-700 hover:border-indigo-500"
                                  }`}
                                  title={isDone ? "Mark as incomplete" : "Mark as completed"}
                                >
                                  {isDone && <Check className="w-3 h-3" />}
                                </button>
                                <div className="space-y-0.5 min-w-0">
                                  <p
                                    className={`font-semibold ${
                                      isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{task.description}</p>
                                  )}
                                  <p className="text-[11px] text-slate-400 font-mono">
                                    Priority: {task.priority || "Normal"} · Due: {task.dueDate || "Ongoing"} · Category:{" "}
                                    {task.category || "General"}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form
                      onSubmit={handleAddStudentTask}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-indigo-500" />
                        <span>Assign New Task to {liveInspectUser.name}</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Task title (e.g. Physics Ch 4 derivations)"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Category (e.g. Physics)"
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                        />
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as any)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
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
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer"
                        >
                          Assign Task
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 4: FILES & VOICE MEMOS */}
                {inspectTab === "files" && (
                  <div className="space-y-2.5">
                    {details.files.length === 0 ? (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                        No files or voice memos recorded by this student yet.
                      </div>
                    ) : (
                      details.files.map((file) => (
                        <div
                          key={file.id}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                              {file.category === "audio" ? (
                                <Volume2 className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                                {Math.round((file.size || 1024) / 1024)} KB · {file.mimeType || file.category || "File"} ·{" "}
                                {file.uploadDate || "Recently"}
                                {file.isEncrypted ? " · Encrypted" : ""}
                              </p>
                              {file.contentSnippet && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {file.contentSnippet}
                                </p>
                              )}
                              {Array.isArray(file.tags) && file.tags.length > 0 && (
                                <p className="text-[10px] font-mono text-indigo-500">
                                  Tags: {file.tags.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudentFile(file.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Delete file from student vault"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: CALENDAR */}
                {inspectTab === "calendar" && (
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      {details.calendar.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                          No calendar events scheduled for this student.
                        </div>
                      ) : (
                        details.calendar.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">{ev.title}</p>
                              {ev.description && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">{ev.description}</p>
                              )}
                              <p className="text-[11px] text-slate-500 font-mono">
                                {ev.startTime ? new Date(ev.startTime).toLocaleString() : "Upcoming"} · Category:{" "}
                                {ev.category || "Study"} · Source: {ev.source || "OmniSync"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteCalendarEvent(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Delete event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <form
                      onSubmit={handleAddCalendarEvent}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span>Schedule Study Session for {liveInspectUser.name}</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Event title (e.g. Mock Biology Test)"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <select
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value as any)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="work">Study / Work</option>
                          <option value="deadline">Exam Deadline</option>
                          <option value="meeting">Mentorship</option>
                          <option value="personal">Personal</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                        >
                          Add Calendar Event
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 6: NOTES, LECTURES & DICTIONARY */}
                {inspectTab === "learning" && (
                  <div className="space-y-5 text-xs">
                    {/* Downloaded & Custom PDFs */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                          <FileDown className="w-4 h-4 text-amber-500" />
                          <span>Downloaded Curriculum PDFs ({details.downloadedPdfs.length})</span>
                        </h4>
                        {details.downloadedPdfs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearDataSlice("downloaded_pdf_ids", "downloaded PDFs")}
                            className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      {details.downloadedPdfs.length === 0 ? (
                        <p className="text-slate-400">No curriculum PDFs downloaded yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {details.downloadedPdfs.map((pdfId) => (
                            <div
                              key={pdfId}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {pdfId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentPdf(pdfId, "downloaded")}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                                title="Remove downloaded PDF record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {details.customPdfs.length > 0 && (
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Custom Student PDFs ({details.customPdfs.length})
                          </p>
                          {details.customPdfs.map((cp: any) => (
                            <div
                              key={cp.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">{cp.title}</p>
                                <p className="text-[11px] text-slate-500">
                                  {cp.subject} · {cp.grade} · {cp.pageCount || 1} pages
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentPdf(cp.id, "custom")}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Video Lectures */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-indigo-500" />
                        <span>Video Lectures Activity</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Saved Lectures ({details.savedLectures.length})
                            </span>
                            {details.savedLectures.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearDataSlice("saved_lectures", "saved lectures")}
                                className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          {details.savedLectures.length === 0 ? (
                            <p className="text-slate-400">None saved</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                              {details.savedLectures.map((id, i) => (
                                <p key={i} className="truncate text-slate-600 dark:text-slate-300">
                                  • {id}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Watched Lectures ({details.watchedLectures.length})
                            </span>
                            {details.watchedLectures.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearDataSlice("watched_lectures", "watched lectures")}
                                className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          {details.watchedLectures.length === 0 ? (
                            <p className="text-slate-400">None watched</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto font-mono text-[11px]">
                              {details.watchedLectures.map((id, i) => (
                                <p key={i} className="truncate text-slate-600 dark:text-slate-300">
                                  ✓ {id}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Dictionary */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                        <span>Academic Dictionary & Vocabulary</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Bookmarks ({details.dictBookmarks.length})
                          </p>
                          <p className="text-[11px] text-slate-500 break-words">
                            {details.dictBookmarks.length > 0 ? details.dictBookmarks.join(", ") : "No bookmarked words"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Recent Searches ({details.dictRecents.length})
                          </p>
                          <p className="text-[11px] text-slate-500 break-words">
                            {details.dictRecents.length > 0 ? details.dictRecents.join(", ") : "No recent searches"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            AI Looked-Up Words ({details.dictCustomWords.length})
                          </p>
                          <p className="text-[11px] text-slate-500 break-words">
                            {details.dictCustomWords.length > 0
                              ? details.dictCustomWords.map((w: any) => w.word).join(", ")
                              : "None saved"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 7: QUIZZES, AI CHATS, VOICE & NOTIFICATIONS */}
                {inspectTab === "activity" && (
                  <div className="space-y-5 text-xs">
                    {/* Quiz History */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                          <Brain className="w-4 h-4 text-purple-500" />
                          <span>Completed Quiz History ({details.quizHistory.length})</span>
                        </h4>
                        {details.quizHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearDataSlice("quiz_history", "quiz history")}
                            className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Clear Quiz History
                          </button>
                        )}
                      </div>
                      {details.quizHistory.length === 0 ? (
                        <p className="text-slate-400">No completed quizzes recorded for this student yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {details.quizHistory.map((q: any, idx: number) => (
                            <div
                              key={q.id || idx}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{q.topic || "Study Quiz"}</p>
                                <p className="text-[11px] text-slate-400 font-mono">
                                  {q.correctAnswers ?? q.score ?? 0}/{q.totalQuestions} correct ·{" "}
                                  {q.completedAt ? new Date(q.completedAt).toLocaleString() : "Completed"}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-md font-mono font-bold ${
                                  Number(q.percentage || 0) >= 70
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {q.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI Chat & Voice History */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                            <span>AI Tutor Chat ({details.chatHistory.length})</span>
                          </h4>
                          {details.chatHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearDataSlice("chat_history", "AI chat history")}
                              className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {details.chatHistory.length === 0 ? (
                            <p className="text-slate-400">No AI chat messages recorded yet.</p>
                          ) : (
                            details.chatHistory.map((m: any, i: number) => (
                              <div
                                key={m.id || i}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                                  <span className="font-bold uppercase text-indigo-500">{m.sender}</span>
                                  <span>{m.timestamp}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                                  {m.text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-emerald-500" />
                            <span>Voice Assistant ({details.voiceHistory.length})</span>
                          </h4>
                          {details.voiceHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearDataSlice("voice_history", "voice history")}
                              className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {details.voiceHistory.length === 0 ? (
                            <p className="text-slate-400">No voice assistant turns recorded yet.</p>
                          ) : (
                            details.voiceHistory.map((v: any, i: number) => (
                              <div
                                key={v.id || i}
                                className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                                  <span className="font-bold uppercase text-emerald-500">{v.sender}</span>
                                  <span>{v.timestamp}</span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                                  {v.text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Student Notification Inbox */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <span>Student Notifications Inbox ({details.notifications.length})</span>
                        </h4>
                        {details.notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearDataSlice("notifications", "student notifications")}
                            className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Clear Inbox
                          </button>
                        )}
                      </div>
                      {details.notifications.length === 0 ? (
                        <p className="text-slate-400">Inbox is currently empty.</p>
                      ) : (
                        <div className="space-y-2 max-h-44 overflow-y-auto">
                          {details.notifications.map((n: any, i: number) => (
                            <div
                              key={n.id || i}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">{n.message}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {n.read ? "Read" : "Unread"} · {n.timestamp}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 8: XP, STREAK, BADGES, GAME HISTORY & RAW JSON INSPECTOR */}
                {inspectTab === "gaming" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono tabular-nums">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          Lvl {details.gameProfile?.level || liveInspectUser.gameLevel}
                        </p>
                        <p className="text-[11px] font-sans text-slate-500 mt-0.5">Academic Rank</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {(details.gameProfile?.xp ?? liveInspectUser.gameXp).toLocaleString()}
                        </p>
                        <p className="text-[11px] font-sans text-slate-500 mt-0.5">Total XP</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                          <Flame className="w-4 h-4" />
                          {details.studyStreak || 0}d
                        </p>
                        <p className="text-[11px] font-sans text-slate-500 mt-0.5">Study Streak</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {details.gameProfile?.totalGamesPlayed || 0} / {details.gameProfile?.highestStreak || 0}
                        </p>
                        <p className="text-[11px] font-sans text-slate-500 mt-0.5">Games / Best Streak</p>
                      </div>
                    </div>

                    {/* Quick Grant XP */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">Quick XP Bonus / Adjustment</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[50, 100, 250, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleGrantXp(amt)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold cursor-pointer"
                          >
                            +{amt} XP
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <input
                            type="number"
                            value={customXpAmount}
                            onChange={(e) => setCustomXpAmount(Number(e.target.value))}
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => handleGrantXp(customXpAmount)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                          >
                            Apply XP
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exact Streak, Level, XP & Rank Editor */}
                    <form
                      onSubmit={handleSaveStudyStats}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                    >
                      <p className="font-bold text-slate-900 dark:text-white">Direct Gamification & Streak Override</p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Exact XP</label>
                          <input
                            type="number"
                            min={0}
                            value={editXpValue}
                            onChange={(e) => setEditXpValue(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Level</label>
                          <input
                            type="number"
                            min={1}
                            value={editLevelValue}
                            onChange={(e) => setEditLevelValue(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Study Streak (Days)</label>
                          <input
                            type="number"
                            min={0}
                            value={editStreakValue}
                            onChange={(e) => setEditStreakValue(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rank Title</label>
                          <input
                            type="text"
                            value={editRankTitle}
                            onChange={(e) => setEditRankTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingStudyStats}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                        >
                          {isSavingStudyStats ? "Saving..." : "Save Stats & Streak"}
                        </button>
                      </div>
                    </form>

                    {/* Recent Games & Badges */}
                    {Array.isArray(details.gameProfile?.history) && details.gameProfile.history.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Recent Educational Game Rounds ({details.gameProfile.history.length})
                        </p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {details.gameProfile.history.slice(0, 15).map((g: any, idx: number) => (
                            <div
                              key={g.id || idx}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-[11px]"
                            >
                              <span className="font-sans font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {g.gameTitle} ({g.difficulty})
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {g.percentage}% · +{g.xpEarned} XP
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Complete Raw JSON Dossier Inspector */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-sky-500" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            Complete Raw User Data Inspector (JSON)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(JSON.stringify(rawDossierPayload, null, 2), "raw-json-copy")}
                            className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer flex items-center gap-1"
                          >
                            {copiedKey === "raw-json-copy" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>Copy All JSON</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRawJson(!showRawJson)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer"
                          >
                            {showRawJson ? "Hide JSON" : "View Full JSON"}
                          </button>
                        </div>
                      </div>
                      {showRawJson && (
                        <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                          {JSON.stringify(rawDossierPayload, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-2 flex-wrap shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  User ID: {liveInspectUser.id}
                  {inspectLastSyncedAt ? ` · Live server sync: ${inspectLastSyncedAt}` : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportUserDossierJson}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* MODAL 2: Create New Student User Account                            */}
      {/* =================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Register New Student</h3>
                  <p className="text-xs text-slate-500">Creates an isolated student account on server</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email / Username *
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Board Exam
                </label>
                <input
                  type="text"
                  value={newUserTargetExam}
                  onChange={(e) => setNewUserTargetExam(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  {isSubmittingCreate ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: Edit Student User Account                                  */}
      {/* =================================================================== */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Profile: {editUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">Modify credentials and grade assignment</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email / Username
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Grade</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isSubmittingEdit ? "Saving..." : "Update Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: Delete Account Confirmation                                */}
      {/* =================================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Account: {deleteConfirmUser.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This permanently deletes the account and erases all isolated tasks, notes, and quiz history on the server.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: Reset Student Data Confirmation (Replaces window.confirm)  */}
      {/* =================================================================== */}
      {confirmResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset Study Data for {confirmResetUser.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All tasks, files, calendar events, XP, and downloaded note records will be cleared. Login credentials remain intact.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmResetUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetStudentData}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: Clear Log Stream Confirmation                              */}
      {/* =================================================================== */}
      {confirmClearStream && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <ScrollText className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Clear {confirmClearStream.toUpperCase()} Logs?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All existing entries in the {confirmClearStream} log stream will be permanently removed from the server.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setConfirmClearStream(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSelectedLogStream}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: Gmail Send Confirmation Dialog (Mandatory Safety Gate)     */}
      {/* =================================================================== */}
      {confirmSendEmailOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Gmail Dispatch</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review recipient and message details before sending via your connected Gmail account
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">From: </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {gmailProfile?.emailAddress || gmailAuthEmail || "Connected Google Account"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">To: </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{emailTo}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Subject: </span>
                <span className="font-bold text-slate-900 dark:text-white">{emailSubject}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-semibold mb-1">Message Preview:</p>
                <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto">
                  {emailBody}
                </pre>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSendEmailOpen(false)}
                disabled={isSendingEmail}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSendEmail}
                disabled={isSendingEmail}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? "Sending..." : "Confirm & Send Email"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
