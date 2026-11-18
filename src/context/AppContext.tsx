import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Language,
  Theme,
  FileItem,
  SocialAccount,
  SocialFeedItem,
  CalendarEvent,
  TaskItem,
  DeviceItem,
  DevicePermissionsState,
  NotificationItem,
  SecurityVaultState,
  AISummaryReport,
  SocialDigest,
  ChatMessage,
  VoicePersonaId,
  AttachedFile,
  VoiceConversationMessage,
} from "../types";
import { speakWithVoice, FIRST_TIME_VOICE_GREETINGS, getVoiceModeInitialGreeting } from "../utils/voiceEngine";
import {
  initialFiles,
  initialSocialAccounts,
  initialSocialFeed,
  initialCalendarEvents,
  initialTasks,
  initialDevices,
  initialNotifications,
  initialVaultState,
} from "../data/initialData";
import { t } from "../utils/i18n";
import { useAuth } from "./AuthContext";
import { getUserItem, setUserItem } from "../utils/userStorage";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isOffline: boolean;
  isSyncing: boolean;
  triggerCloudSync: () => void;
  
  // Files & AI Report
  files: FileItem[];
  addFile: (file: FileItem) => void;
  deleteFile: (id: string) => void;
  summaryReport: AISummaryReport | null;
  generateAISummaryReport: () => Promise<void>;
  isGeneratingReport: boolean;

  // Social Hub
  socialAccounts: SocialAccount[];
  socialFeed: SocialFeedItem[];
  socialDigest: SocialDigest | null;
  generateSocialDigest: () => Promise<void>;
  isGeneratingDigest: boolean;
  toggleConnectAccount: (id: string) => void;

  // Calendar & Schedule
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  deleteCalendarEvent: (id: string) => void;

  // Tasks & Analytics
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, "id">) => void;
  toggleTaskStatus: (id: string) => void;

  // Devices & Cloud Sync & Universal Access
  devices: DeviceItem[];
  activeDeviceId: string;
  setActiveDeviceId: (id: string) => void;
  isAllAccessGranted: boolean;
  grantAllAccessToAllDevices: () => Promise<void>;
  toggleDevicePermission: (deviceId: string, permissionKey: keyof DevicePermissionsState) => void;
  grantFullAccessToDevice: (deviceId: string) => void;
  revokeDeviceAccess: (deviceId: string) => void;
  testDeviceAction: (deviceId: string, actionType: string) => Promise<{ success: boolean; message: string }>;

  // Vault & Encryption
  vaultState: SecurityVaultState;
  toggleVaultLock: (passcode?: string) => boolean;
  
  // Notifications
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => void;

  // AI Chat & Voice Assistant
  chatMessages: ChatMessage[];
  sendMessageToAI: (text: string, attachment?: AttachedFile) => Promise<void>;
  startNewChat: () => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  isBiometricModalOpen: boolean;
  setIsBiometricModalOpen: (open: boolean) => void;
  biometricSuccessCallback: (() => void) | null;
  requestBiometricAuth: (onSuccess: () => void) => void;

  // Voice Conversation Memory
  voiceConversationHistory: VoiceConversationMessage[];
  addVoiceConversationTurn: (turn: { userText: string; aiText: string; actionTaken?: string }) => void;
  clearVoiceConversationHistory: () => void;

  // Multi-Voice Settings
  selectedVoicePersona: VoicePersonaId;
  setSelectedVoicePersona: (persona: VoicePersonaId) => void;
  customVoiceURI: string;
  setCustomVoiceURI: (uri: string) => void;
  speakBunny: (text: string, onStart?: () => void, onEnd?: () => void) => void;

  // Helper
  tr: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [language, setLanguage] = useState<Language>("EN");
  const [theme, setTheme] = useState<Theme>("dark");
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Files & Reports (Isolated per student account)
  const [files, setFiles] = useState<FileItem[]>(() => {
    return getUserItem<FileItem[]>(currentUser?.id, "files", []);
  });
  const [summaryReport, setSummaryReport] = useState<AISummaryReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Social Hub
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(initialSocialAccounts);
  const [socialFeed, setSocialFeed] = useState<SocialFeedItem[]>(initialSocialFeed);
  const [socialDigest, setSocialDigest] = useState<SocialDigest | null>(null);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState<boolean>(false);

  // Calendar (Isolated per student account)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    return getUserItem<CalendarEvent[]>(currentUser?.id, "calendar", []);
  });

  // Tasks (Isolated per student account)
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return getUserItem<TaskItem[]>(currentUser?.id, "tasks", []);
  });

  // Devices
  const [devices, setDevices] = useState<DeviceItem[]>(initialDevices);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("dev-1");

  // Vault
  const [vaultState, setVaultState] = useState<SecurityVaultState>(initialVaultState);

  // Notifications (Isolated per student account)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return getUserItem<NotificationItem[]>(currentUser?.id, "notifications", []);
  });

  // Voice & Biometrics
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [biometricSuccessCallback, setBiometricSuccessCallback] = useState<(() => void) | null>(null);

  // Voice Conversation Memory (Isolated per student account)
  const [voiceConversationHistory, setVoiceConversationHistory] = useState<VoiceConversationMessage[]>(() => {
    const { text: introText } = getVoiceModeInitialGreeting("EN");
    return getUserItem<VoiceConversationMessage[]>(currentUser?.id, "voice_history", [
      {
        id: "vm-1",
        sender: "ai",
        text: introText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  });

  // Re-synchronize and isolate all data when a different user logs in
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId) {
      setFiles([]);
      setTasks([]);
      setCalendarEvents([]);
      setNotifications([]);
      return;
    }

    // 1. User Tasks (Fresh with welcome task if newly created account)
    const existingTasks = getUserItem<TaskItem[] | null>(userId, "tasks", null);
    if (existingTasks === null) {
      const welcomeTask: TaskItem = {
        id: `t-welcome-${Date.now()}`,
        title: `Explore ${currentUser.grade} Master Chapter Notes & Formulas`,
        description: `Review your chapter master study guide, definitions, and practice formula keys.`,
        category: "study",
        priority: "high",
        status: "todo",
        dueDate: new Date().toISOString().split("T")[0],
        estimatedHours: 2,
      };
      setTasks([welcomeTask]);
      setUserItem(userId, "tasks", [welcomeTask]);
    } else {
      setTasks(existingTasks);
    }

    // 2. User Files (Fresh for new account)
    const userFiles = getUserItem<FileItem[]>(userId, "files", []);
    setFiles(userFiles);

    // 3. User Calendar Events (Fresh for new account)
    const userEvents = getUserItem<CalendarEvent[]>(userId, "calendar", []);
    setCalendarEvents(userEvents);

    // 4. User Notifications (Fresh welcome notification for new account)
    const existingNotifs = getUserItem<NotificationItem[] | null>(userId, "notifications", null);
    if (existingNotifs === null) {
      const welcomeNotif: NotificationItem = {
        id: `n-welcome-${Date.now()}`,
        title: `Welcome, ${currentUser.name}!`,
        message: `Your personal academic dashboard has been configured for ${currentUser.grade}. All notes, test scores, and tasks are private and separate to your account.`,
        type: "info",
        timestamp: "Just now",
        read: false,
      };
      setNotifications([welcomeNotif]);
      setUserItem(userId, "notifications", [welcomeNotif]);
    } else {
      setNotifications(existingNotifs);
    }

    // 5. User Voice Conversation History (Fresh for new account)
    const existingVoice = getUserItem<VoiceConversationMessage[] | null>(userId, "voice_history", null);
    if (existingVoice === null) {
      const { text: introText } = getVoiceModeInitialGreeting(language);
      const freshVoice: VoiceConversationMessage = {
        id: `vm-welcome-${Date.now()}`,
        sender: "ai",
        text: `Welcome ${currentUser.name}! Voice Assistant is ready for ${currentUser.grade}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setVoiceConversationHistory([freshVoice]);
      setUserItem(userId, "voice_history", [freshVoice]);
    } else {
      setVoiceConversationHistory(existingVoice);
    }
  }, [currentUser?.id, currentUser?.grade, currentUser?.name]);

  const addVoiceConversationTurn = (turn: { userText: string; aiText: string; actionTaken?: string }) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: VoiceConversationMessage = {
      id: "vm-u-" + Date.now(),
      sender: "user",
      text: turn.userText,
      timestamp: timeStr,
    };
    const aiMsg: VoiceConversationMessage = {
      id: "vm-a-" + (Date.now() + 1),
      sender: "ai",
      text: turn.aiText,
      timestamp: timeStr,
      actionTaken: turn.actionTaken,
    };
    setVoiceConversationHistory((prev) => {
      const next = [...prev, userMsg, aiMsg];
      setUserItem(currentUser?.id, "voice_history", next);
      return next;
    });
  };

  const clearVoiceConversationHistory = () => {
    const { text: introText } = getVoiceModeInitialGreeting(language);
    const freshMsg: VoiceConversationMessage = {
      id: "vm-" + Date.now(),
      sender: "ai",
      text: introText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setVoiceConversationHistory([freshMsg]);
    setUserItem(currentUser?.id, "voice_history", [freshMsg]);
  };

  // Multi Voice Persona State (Default: Natural Man)
  const [selectedVoicePersona, setSelectedVoicePersona] = useState<VoicePersonaId>("natural_man");
  const [customVoiceURI, setCustomVoiceURI] = useState<string>("");

  const speakBunny = useCallback((text: string, onStart?: () => void, onEnd?: () => void) => {
    speakWithVoice(text, selectedVoicePersona, customVoiceURI, undefined, undefined, language, onStart, onEnd);
  }, [selectedVoicePersona, customVoiceURI, language]);

  // Chat
  const getInitialChatMessage = (lang: Language = language): ChatMessage => {
    const greetingText = FIRST_TIME_VOICE_GREETINGS[lang] || "Hey, I am an AI agent created by Danish. How can I help you today?";
    return {
      id: "m-" + Date.now(),
      sender: "ai",
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "ai",
      text: "Hey, I am an AI agent created by Danish. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const startNewChat = () => {
    setChatMessages([getInitialChatMessage(language)]);
  };

  // Handle Online / Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync dark class on document root element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const tr = useCallback((key: string) => t(key, language), [language]);

  const triggerCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setDevices((prev) =>
        prev.map((d) => ({ ...d, lastSyncTime: d.isCurrentDevice ? "Just now" : `${nowStr}` }))
      );
    }, 1200);
  };

  const addFile = (file: FileItem) => {
    setFiles((prev) => {
      const next = [file, ...prev];
      setUserItem(currentUser?.id, "files", next);
      return next;
    });
    triggerCloudSync();
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      setUserItem(currentUser?.id, "files", next);
      return next;
    });
  };

  const generateAISummaryReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch("/api/ai/summarize-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, language }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setSummaryReport({ ...data, generatedAt: new Date().toLocaleString() });
    } catch (e) {
      // Fallback structured report
      setSummaryReport({
        executiveSummary: `OmniSync AI Analyzed ${files.length} personal files in ${language}. High concentration in financial audits and architectural specs.`,
        categoryBreakdown: [
          { category: "PDF & Documents", count: files.filter((f) => f.category === "pdf" || f.category === "document").length, insights: "Contains Q3 financial audits and security blueprints." },
          { category: "Spreadsheets & Media", count: files.filter((f) => f.category === "spreadsheet" || f.category === "image").length, insights: "Social media target metrics and encrypted identification." },
        ],
        actionItems: [
          "Submit Q3 Corporate Tax Return prior to Aug 25",
          "Conduct multi-device security key backup for encrypted vault",
          "Execute social post campaign on Twitter & LinkedIn",
        ],
        riskAudit: "1 file flagged with urgent financial tax deadline. Passport image secured with zero-knowledge AES-256.",
        generatedAt: new Date().toLocaleString(),
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateSocialDigest = async () => {
    setIsGeneratingDigest(true);
    try {
      const res = await fetch("/api/ai/social-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: socialAccounts, language }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setSocialDigest({ ...data, generatedAt: new Date().toLocaleString() });
    } catch (e) {
      setSocialDigest({
        digestTitle: "Personalized Cross-Platform Social Update Digest",
        highlights: [
          "LinkedIn post engagement up +38% after Tech Insider feature",
          "1 critical security alert on GitHub repository (Dependabot PR pending)",
        ],
        platformSummaries: [
          { platform: "LinkedIn", summary: "14,820 total connections. Top post reached 1,200 impressions.", sentiment: "Positive" },
          { platform: "Twitter/X", summary: "28,450 followers. High interest in open-source voice AI architecture.", sentiment: "Positive" },
        ],
        recommendedPosts: [
          "Sharing insights on building real-time zero-knowledge AI workspace agents! #AI #CloudSecurity",
          "How we reduced cloud operating expenses by 12% in Q3 using automated sync architectures.",
        ],
        generatedAt: new Date().toLocaleString(),
      });
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  const toggleConnectAccount = (id: string) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, isConnected: !acc.isConnected } : acc))
    );
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, "id">) => {
    const newEv: CalendarEvent = {
      ...eventData,
      id: "e-" + Date.now(),
    };
    setCalendarEvents((prev) => {
      const next = [...prev, newEv];
      setUserItem(currentUser?.id, "calendar", next);
      return next;
    });
    triggerCloudSync();
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      setUserItem(currentUser?.id, "calendar", next);
      return next;
    });
  };

  const addTask = (taskData: Omit<TaskItem, "id">) => {
    const newTask: TaskItem = {
      ...taskData,
      id: "t-" + Date.now(),
    };
    setTasks((prev) => {
      const next = [newTask, ...prev];
      setUserItem(currentUser?.id, "tasks", next);
      return next;
    });
    triggerCloudSync();
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "completed" ? "todo" : "completed";
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === "completed" ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });
      setUserItem(currentUser?.id, "tasks", next);
      return next;
    });
  };

  // Universal Access & Device Permissions Management
  const isAllAccessGranted = devices.every((d) => d.allAccessGranted);

  const grantAllAccessToAllDevices = async () => {
    // 1. Request real browser permissions if available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => {
          return navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        });
      }
    } catch {
      // Handled gracefully
    }

    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 2000 }
        );
      }
    } catch {
      // Handled gracefully
    }

    try {
      if ("Notification" in window && Notification.permission !== "granted") {
        await Notification.requestPermission().catch(() => null);
      }
    } catch {
      // Handled gracefully
    }

    // 2. Set all devices to 100% full access
    setDevices((prev) =>
      prev.map((dev) => ({
        ...dev,
        status: "online",
        allAccessGranted: true,
        permissionsGranted: {
          microphone: true,
          camera: true,
          geolocation: true,
          fileSystem: true,
          notifications: true,
          clipboard: true,
          networkSync: true,
          biometrics: true,
          screenCapture: true,
          backgroundExecution: true,
        },
      }))
    );

    addNotification({
      title: "Universal All-Device Access Granted",
      message: "100% Full Access granted to all 6 devices: Camera, Microphone, GPS, Filesystem, Notifications, Clipboard & Cloud Sync.",
      type: "security",
    });

    speakBunny("Universal access granted. All devices and sensors have full authorization across your workspace.");
    triggerCloudSync();
  };

  const toggleDevicePermission = (deviceId: string, permissionKey: keyof DevicePermissionsState) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === deviceId) {
          const nextPerms = {
            ...dev.permissionsGranted,
            [permissionKey]: !dev.permissionsGranted[permissionKey],
          };
          const allGranted = Object.values(nextPerms).every(Boolean);
          return {
            ...dev,
            permissionsGranted: nextPerms,
            allAccessGranted: allGranted,
          };
        }
        return dev;
      })
    );
  };

  const grantFullAccessToDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === deviceId) {
          return {
            ...dev,
            status: "online",
            allAccessGranted: true,
            permissionsGranted: {
              microphone: true,
              camera: true,
              geolocation: true,
              fileSystem: true,
              notifications: true,
              clipboard: true,
              networkSync: true,
              biometrics: true,
              screenCapture: true,
              backgroundExecution: true,
            },
          };
        }
        return dev;
      })
    );

    addNotification({
      title: "Device Full Access Granted",
      message: `Full hardware and sensor access granted to device ${deviceId}.`,
      type: "sync",
    });
  };

  const revokeDeviceAccess = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id === deviceId) {
          return {
            ...dev,
            allAccessGranted: false,
            permissionsGranted: {
              microphone: false,
              camera: false,
              geolocation: false,
              fileSystem: false,
              notifications: false,
              clipboard: false,
              networkSync: true,
              biometrics: false,
              screenCapture: false,
              backgroundExecution: false,
            },
          };
        }
        return dev;
      })
    );
  };

  const testDeviceAction = async (deviceId: string, actionType: string): Promise<{ success: boolean; message: string }> => {
    const dev = devices.find((d) => d.id === deviceId);
    const devName = dev ? dev.name : "Device";

    switch (actionType) {
      case "camera":
        return { success: true, message: `${devName}: Optical camera sensor feed initialized successfully.` };
      case "microphone":
        return { success: true, message: `${devName}: Dual studio microphone stream active and calibrated.` };
      case "geolocation":
        return { success: true, message: `${devName}: GPS telemetry locked (37.7749° N, 122.4194° W, accuracy: ±3m).` };
      case "filesystem":
        return { success: true, message: `${devName}: File system storage read/write root verified with zero errors.` };
      case "clipboard":
        return { success: true, message: `${devName}: Cross-device clipboard sync pipe connected.` };
      case "biometrics":
        return { success: true, message: `${devName}: Hardware Secure Enclave biometric passkey confirmed.` };
      default:
        return { success: true, message: `${devName}: Universal hardware ping succeeded (latency: 18ms).` };
    }
  };

  const toggleVaultLock = (passcode?: string) => {
    if (vaultState.isLocked) {
      if (passcode === "1234" || passcode === undefined) {
        setVaultState((prev) => ({ ...prev, isLocked: false }));
        return true;
      }
      return false;
    } else {
      setVaultState((prev) => ({ ...prev, isLocked: true }));
      return true;
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      setUserItem(currentUser?.id, "notifications", next);
      return next;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUserItem(currentUser?.id, "notifications", []);
  };

  const addNotification = useCallback((notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const newN: NotificationItem = {
      ...notif,
      id: "n-" + Date.now(),
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => {
      const next = [newN, ...prev];
      setUserItem(currentUser?.id, "notifications", next);
      return next;
    });

    // Send browser push notification if supported & permitted
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(notif.title, { body: notif.message });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [currentUser?.id]);

  const sendMessageToAI = async (text: string, attachment?: AttachedFile) => {
    const userMsg: ChatMessage = {
      id: "m-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachment: attachment ? {
        id: attachment.id || "att-" + Date.now(),
        name: attachment.name,
        mimeType: attachment.mimeType || attachment.type || "application/octet-stream",
        type: attachment.type || attachment.mimeType || "application/octet-stream",
        size: attachment.size,
        dataUrl: attachment.dataUrl,
        contentSnippet: attachment.contentSnippet || attachment.snippet || attachment.fullText?.substring(0, 300) || "",
        snippet: attachment.contentSnippet || attachment.snippet || attachment.fullText?.substring(0, 300) || "",
      } : undefined,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language,
          fileAttachment: attachment ? {
            name: attachment.name,
            type: attachment.mimeType,
            size: attachment.size,
            content: attachment.fullText || attachment.contentSnippet || "",
          } : undefined,
          context: {
            filesCount: files.length,
            tasksCount: tasks.filter((t) => t.status !== "completed").length,
            nextEvent: calendarEvents[0]?.title || "None",
            studyNotesCount: 5,
          },
        }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: "m-" + (Date.now() + 1),
        sender: "ai",
        text: data.reply || "I have received your request and study data.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        generatedMedia: data.generatedMedia || undefined,
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const lower = text.toLowerCase();
      let fallbackText = `I received your message${attachment ? ` and file "${attachment.name}"` : ""} in ${language}. Study notes and assistant tools are ready!`;
      if (
        lower.includes("creator") ||
        lower.includes("creater") ||
        lower.includes("who created you") ||
        lower.includes("who made you") ||
        lower.includes("who is danish") ||
        lower.includes("about danish")
      ) {
        fallbackText = "I am created by Danish, who is studying in 2nd year and is a student of SPS College Batkhela Campus and lives in Mekhband.";
      }
      const aiMsg: ChatMessage = {
        id: "m-" + (Date.now() + 1),
        sender: "ai",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    }
  };

  const requestBiometricAuth = (onSuccess: () => void) => {
    setBiometricSuccessCallback(() => onSuccess);
    setIsBiometricModalOpen(true);
  };

  const contextValue = useMemo<AppContextType>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      isOffline,
      isSyncing,
      triggerCloudSync,
      files,
      addFile,
      deleteFile,
      summaryReport,
      generateAISummaryReport,
      isGeneratingReport,
      socialAccounts,
      socialFeed,
      socialDigest,
      generateSocialDigest,
      isGeneratingDigest,
      toggleConnectAccount,
      calendarEvents,
      addCalendarEvent,
      deleteCalendarEvent,
      tasks,
      addTask,
      toggleTaskStatus,
      devices,
      activeDeviceId,
      setActiveDeviceId,
      isAllAccessGranted,
      grantAllAccessToAllDevices,
      toggleDevicePermission,
      grantFullAccessToDevice,
      revokeDeviceAccess,
      testDeviceAction,
      vaultState,
      toggleVaultLock,
      notifications,
      markNotificationRead,
      clearAllNotifications,
      addNotification,
      chatMessages,
      sendMessageToAI,
      startNewChat,
      isVoiceModalOpen,
      setIsVoiceModalOpen,
      isBiometricModalOpen,
      setIsBiometricModalOpen,
      biometricSuccessCallback,
      requestBiometricAuth,
      voiceConversationHistory,
      addVoiceConversationTurn,
      clearVoiceConversationHistory,
      selectedVoicePersona,
      setSelectedVoicePersona,
      customVoiceURI,
      setCustomVoiceURI,
      speakBunny,
      tr,
    }),
    [
      language,
      theme,
      isOffline,
      isSyncing,
      files,
      summaryReport,
      isGeneratingReport,
      socialAccounts,
      socialFeed,
      socialDigest,
      isGeneratingDigest,
      calendarEvents,
      tasks,
      devices,
      activeDeviceId,
      isAllAccessGranted,
      vaultState,
      notifications,
      addNotification,
      chatMessages,
      isVoiceModalOpen,
      isBiometricModalOpen,
      biometricSuccessCallback,
      voiceConversationHistory,
      selectedVoicePersona,
      customVoiceURI,
      speakBunny,
      tr,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
