export type Language =
  | "EN"
  | "PS"
  | "UR"
  | "ES"
  | "FR"
  | "DE"
  | "JA"
  | "ZH"
  | "HI"
  | "AR"
  | "TR"
  | "RU"
  | "FA"
  | "BN"
  | "PT"
  | "IT";

export type Theme = "dark" | "light" | "system";

export type FileCategory = "document" | "spreadsheet" | "presentation" | "image" | "code" | "pdf" | "audio";

export interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  tags: string[];
  uploadDate: string;
  contentSnippet: string;
  isEncrypted: boolean;
  summary?: string;
  keyInsights?: string[];
  urgencyScore?: number; // 1-10
}

export type SocialPlatform = "Twitter" | "LinkedIn" | "Instagram" | "Threads" | "GitHub" | "YouTube";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  handle: string;
  avatar: string;
  isConnected: boolean;
  followersCount: number;
  engagementRate: number; // e.g. 4.8
  lastSyncTime: string;
  unreadAlerts: number;
}

export interface SocialFeedItem {
  id: string;
  platform: SocialPlatform;
  author: string;
  handle: string;
  text: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
  sentiment: "Positive" | "Neutral" | "Urgent" | "Negative";
  actionNeeded?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;
  category: "work" | "personal" | "meeting" | "deadline" | "social";
  source: "Google Calendar" | "Outlook" | "Apple iCal" | "OmniSync";
  synced: boolean;
  attendees?: string[];
  location?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed";
  dueDate: string;
  estimatedHours: number;
  completedAt?: string;
}

export interface DevicePermissionsState {
  microphone: boolean;
  camera: boolean;
  geolocation: boolean;
  fileSystem: boolean;
  notifications: boolean;
  clipboard: boolean;
  networkSync: boolean;
  biometrics: boolean;
  screenCapture: boolean;
  backgroundExecution: boolean;
}

export interface DeviceItem {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet" | "watch" | "hub";
  os: string;
  lastSyncTime: string;
  isCurrentDevice: boolean;
  status: "online" | "syncing" | "offline";
  ipAddress: string;
  batteryLevel?: number;
  storageAvailable?: string;
  hardwareSensors?: string[];
  permissionsGranted: DevicePermissionsState;
  allAccessGranted: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "urgent" | "reminder" | "sync" | "social" | "security" | "info";
  read: boolean;
}

export interface SecurityVaultState {
  isLocked: boolean;
  masterPasscodeSet: boolean;
  biometricEnabled: boolean;
  encryptionAlgorithm: string;
  lastAuditTime: string;
  encryptedFilesCount: number;
}

export interface AISummaryReport {
  executiveSummary: string;
  categoryBreakdown: {
    category: string;
    count: number;
    insights: string;
  }[];
  actionItems: string[];
  riskAudit: string;
  generatedAt: string;
}

export interface SocialDigest {
  digestTitle: string;
  highlights: string[];
  platformSummaries: {
    platform: string;
    summary: string;
    sentiment: string;
  }[];
  recommendedPosts: string[];
  generatedAt: string;
}

export type VoicePersonaId =
  | "natural_man"
  | "friendly_buddy"
  | "deep_male"
  | "natural_female"
  | "soft_female"
  | "family_storyteller"
  | "cyber_agent"
  | "system_custom";

export interface VoicePersonaOption {
  id: VoicePersonaId;
  name: string;
  gender: "male" | "female" | "robot";
  description: string;
  defaultPitch: number;
  defaultRate: number;
}

export interface AttachedFile {
  id?: string;
  name: string;
  size: number | string;
  mimeType?: string;
  type?: string;
  contentSnippet?: string;
  snippet?: string;
  fullText?: string;
  dataUrl?: string;
}

export type AIModelProvider = "gemini" | "chatgpt" | "grok" | "claude" | "deepseek";

export type AIMediaType = "image" | "diagram" | "video";

export interface GeneratedMediaItem {
  id: string;
  type: AIMediaType;
  title: string;
  prompt: string;
  modelUsed: string;
  provider: AIModelProvider;
  createdAt: string;
  topic?: string;
  // Visual payload
  imageUrl?: string;
  videoUrl?: string;
  diagramSvg?: string;
  diagramType?: "flowchart" | "hierarchy" | "process" | "mindmap" | "venn";
  diagramData?: {
    nodes: { id: string; label: string; desc?: string; type?: string; color?: string }[];
    edges: { from: string; to: string; label?: string }[];
  };
  videoStoryboard?: {
    sceneNumber: number;
    title: string;
    description: string;
    durationSec: number;
    narration: string;
    visualPrompt: string;
  }[];
  explanation: string;
  keyTakeaways: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  attachment?: AttachedFile;
  generatedMedia?: GeneratedMediaItem;
  suggestedAction?: {
    type: "schedule" | "summarize" | "social" | "task" | "quiz" | "study" | "media";
    data: any;
  };
}

export interface VoiceConversationMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionTaken?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  correctAnswerIndex?: number;
  explanation: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface QuizResult {
  id?: string;
  quizTitle?: string;
  topic: string;
  score?: number;
  correctAnswers?: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface Flashcard {
  id: string;
  topic?: string;
  subject?: string;
  front: string;
  back: string;
  isMastered?: boolean;
  mastered?: boolean;
  difficulty?: "easy" | "medium" | "hard";
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  subject: string;
  formula: string;
  description: string;
  example?: string;
}

export interface StudentPDFCallout {
  type: "formula" | "key_definition" | "exam_tip" | "practice_question";
  title: string;
  text: string;
}

export interface StudentPDFSection {
  heading: string;
  subheading?: string;
  content: string[];
  callouts?: StudentPDFCallout[];
}

export type StudentSubject =
  | "Biology"
  | "Chemistry"
  | "Physics"
  | "English"
  | "Mathematics"
  | "Computer Science"
  | "Pakistan Studies"
  | "Urdu"
  | "General Science"
  | "General Study";

export type StudentGrade =
  | "Class 1"
  | "Class 2"
  | "Class 3"
  | "Class 4"
  | "Class 5"
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "9th Class"
  | "10th Class"
  | "11th Class"
  | "12th Class"
  | "Class 1st to 5th"
  | "Class 6th to 8th"
  | "MDCAT & ECAT Entry Test"
  | "General / College"
  | "All Levels"
  | "All Levels (Master Admin)";

export type StudentPDFCategory =
  | "Complete Study Guide"
  | "Formula & Cheatsheet"
  | "Exam Prep & Solutions"
  | "Quick Revision Summary";

export interface DictionaryEntry {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  subject: string;
  definition: string;
  simpleExplanation?: string;
  translations: Record<string, string | undefined>;
  examples: string[];
  synonyms?: string[];
  antonyms?: string[];
  targetClass?: string;
  etymology?: string;
  isBookmarked?: boolean;
}

export interface StudentPDFDocument {
  id: string;
  title: string;
  description: string;
  subject: StudentSubject;
  grade: StudentGrade;
  category: StudentPDFCategory;
  pageCount: number;
  fileSizeKb: number;
  downloadCount: number;
  lastUpdated: string;
  tags: string[];
  isFeatured?: boolean;
  fileUrl?: string;
  sections: StudentPDFSection[];
}

export type LectureType =
  | "all"
  | "concept"
  | "past-papers"
  | "numericals"
  | "one-shot"
  | "entry-test"
  | "live-stream";

export interface LectureVideo {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  duration: string;
  subject: string;
  grade: string;
  topic: string;
  description: string;
  thumbnailUrl: string;
  keyTakeaways?: string[];
  youtubeUrl?: string;
  lectureType?: LectureType;
  board?: string;
  viewsCount?: string;
  isLive?: boolean;
  liveViewerCount?: string;
  streamStatus?: "live" | "upcoming" | "ended";
}

export type GameCategory =
  | "math"
  | "chemistry"
  | "biology"
  | "physics"
  | "vocab"
  | "code"
  | "geography"
  | "pakstudies"
  | "history";

export type GameplayType =
  | "quiz"                // Multi-choice speed duel
  | "spelling"            // Interactive tile-based letter spelling rush
  | "memory_puzzle"       // 3D Card flip pair matching puzzle
  | "connector"           // Drag & click matching column pair puzzle
  | "math_target"         // Hit the target number equation puzzle
  | "true_false"          // Rapid True/False binary speed test
  | "chemical_lab"        // Element & Ionic Formula Reaction Crafter
  | "sequence_order"      // Chronological Scientific Process & Cycle Sequencer
  | "code_bug_hunt"       // Code Syntax & Logic Debugging Detective
  | "element_symbol_rush" // Periodic Element Speed Symbol Matcher
  | "formula_derivation"  // Physics & Math Equation Token Architect
  | "pakistan_trivia";    // Pakistan Studies & Heritage Historical Quest

export type GameDifficulty = "easy" | "medium" | "hard" | "expert";

export interface EducationalGameMeta {
  id: string;
  title: string;
  shortTitle: string;
  subject: string;
  category: GameCategory;
  gameplayType: GameplayType;
  description: string;
  iconName: string;
  accentColor: string;
  badge: string;
  defaultTimeLimitSec: number;
  questionCount: number;
  difficultyLevels: GameDifficulty[];
}

export interface GameQuestionItem {
  id: string;
  question: string;
  subtext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  codeSnippet?: string;
  formula?: string;
  matchPairs?: { left: string; right: string }[];
}

export interface SpellingWordItem {
  id: string;
  word: string;
  clue: string;
  hint: string;
  subject: string;
  explanation: string;
  difficulty: GameDifficulty;
}

export interface MemoryCardItem {
  id: string;
  pairId: string;
  content: string;
  subLabel?: string;
  isFlipped: boolean;
  isMatched: boolean;
  subject: string;
}

export interface ConnectorPairItem {
  id: string;
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
  explanation: string;
  subject: string;
}

export interface MathTargetPuzzleItem {
  id: string;
  target: number;
  numbers: number[];
  allowedOps: string[];
  hint: string;
  solutionExample: string;
  difficulty: GameDifficulty;
}

export interface TrueFalseItem {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  subject: string;
  difficulty: GameDifficulty;
}

export interface ChemicalLabItem {
  id: string;
  compoundName: string;
  chemicalFormula: string;
  category: "salt" | "acid" | "base" | "oxide" | "organic";
  hint: string;
  explanation: string;
  requiredCation: string; // e.g. "Na⁺"
  requiredAnion: string;  // e.g. "Cl⁻"
  cationCount: number;    // e.g. 1
  anionCount: number;     // e.g. 1
  availableIons: { ion: string; charge: number; type: "cation" | "anion"; name: string }[];
  difficulty: GameDifficulty;
}

export interface SequenceOrderItem {
  id: string;
  title: string;
  subject: string;
  prompt: string;
  explanation: string;
  correctSteps: string[];
  difficulty: GameDifficulty;
}

export interface CodeBugHuntItem {
  id: string;
  language: "python" | "javascript" | "cpp";
  title: string;
  snippetLines: string[];
  buggyLineIndex: number; // 0-indexed
  bugDescription: string;
  fixOptions: string[];
  correctFixIndex: number;
  explanation: string;
  difficulty: GameDifficulty;
}

export interface ElementSymbolRushItem {
  id: string;
  elementName: string;
  atomicNumber: number;
  correctSymbol: string;
  symbolOptions: string[];
  category: "alkali" | "noble" | "halogen" | "transition" | "nonmetal";
  funFact: string;
  difficulty: GameDifficulty;
}

export interface FormulaDerivationItem {
  id: string;
  lawName: string;
  subject: string;
  targetFormula: string;
  scrambledTokens: string[];
  correctTokens: string[];
  explanation: string;
  difficulty: GameDifficulty;
}

export interface PakistanTriviaItem {
  id: string;
  question: string;
  category: "geography" | "history" | "constitution" | "culture" | "monuments";
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: GameDifficulty;
}

export interface GameScoreRecord {
  id: string;
  gameId: string;
  gameTitle: string;
  category: GameCategory;
  gameplayType?: GameplayType;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  highestStreak: number;
  timeSpentSec: number;
  xpEarned: number;
  difficulty: GameDifficulty;
  date: string;
}

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StudentGameProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;
  totalGamesPlayed: number;
  totalCorrect: number;
  highestStreak: number;
  soundEnabled: boolean;
  badges: StudentBadge[];
  history: GameScoreRecord[];
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  grade: StudentGrade;
  targetExam?: string;
  avatarColor: string;
  avatarUrl?: string;
  bio?: string;
  schoolOrCollege?: string;
  phone?: string;
  favoriteSubject?: string;
  dailyGoalHours?: number;
  provider?: "email" | "google" | "guest";
  joinedDate: string;
  lastLogin: string;
  isAdmin?: boolean;
  role?: "student" | "admin";
  password?: string;
}

export interface StudentIsolatedData {
  tasks: any[];
  files: any[];
  calendar: any[];
  downloadedPdfs: string[];
  customPdfs: any[];
  savedLectures: string[];
  watchedLectures: string[];
  dictBookmarks: string[];
  dictRecents: string[];
  dictCustomWords: any[];
  gameProfile: any;
  studyStreak: number;
  quizHistory: any[];
  notifications: any[];
  voiceHistory: any[];
  chatHistory: any[];
}

export interface AdminUserProgressDetails extends StudentUser {
  passwordText: string;
  isOnline: boolean;
  lastActiveFormatted: string;
  tasksCount: number;
  completedTasksCount: number;
  filesCount: number;
  calendarCount: number;
  gameXp: number;
  gameLevel: number;
  studyStreak: number;
  downloadedPdfsCount: number;
  customPdfsCount: number;
  savedLecturesCount: number;
  watchedLecturesCount: number;
  dictBookmarksCount: number;
  quizzesCompleted: number;
  notificationsCount: number;
  voiceTurnsCount: number;
  chatMessagesCount: number;
  lastActiveTimestamp?: number;
  isolatedData?: StudentIsolatedData;
}

export interface AuthSessionState {
  currentUser: StudentUser | null;
  isAuthenticated: boolean;
}

export interface ServerAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "info" | "sync" | "security" | "reminder";
  targetGrade: string;
  createdBy: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  category: "auth" | "admin" | "user" | "system";
  action: string;
  actor: string;
  target?: string;
  details: string;
  status: "success" | "warning" | "error";
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  allowPublicSignup: boolean;
  aiTutorEnabled: boolean;
  adPlacementsEnabled: boolean;
  defaultDailyGoalHours: number;
  maintenanceBanner: string;
  updatedAt: string;
}

export interface FastCacheStats {
  size: number;
  maxItems: number;
  ttlMinutes: number;
  hits: number;
  misses: number;
  hitRatePercent: number;
}

export interface AdminServerOverview {
  server: {
    status: "healthy" | "degraded";
    uptimeSeconds: number;
    startedAt: string;
    nodeVersion: string;
    platform: string;
    pid: number;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
  ai: {
    geminiConfigured: boolean;
    activeCooldowns: Record<string, number>;
    caches: {
      quiz: FastCacheStats;
      media: FastCacheStats;
      voice: FastCacheStats;
      chat: FastCacheStats;
    };
  };
  traffic: {
    totalApiRequests: number;
    avgLatencyMs: number;
    topRoutes: {
      route: string;
      hits: number;
      errors: number;
      avgLatencyMs: number;
      lastCalledAt: string;
    }[];
    recentErrors: {
      timestamp: string;
      route: string;
      statusCode: number;
      message: string;
    }[];
  };
  database: {
    totalUsers: number;
    onlineUsers: number;
    offlineUsers: number;
    totalTasks: number;
    completedTasks: number;
    totalFiles: number;
    totalCalendarEvents: number;
    totalQuizzes: number;
    totalXp: number;
    announcementsCount: number;
    auditLogsCount: number;
    storageFiles: {
      name: string;
      bytes: number;
    }[];
  };
  settings: PlatformSettings;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  labelIds: string[];
  isUnread: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  bodyText: string;
}

export interface EmailDispatchLog {
  id: string;
  timestamp: string;
  direction: "outbound" | "inbound_sync";
  actor: string;
  to: string;
  from?: string;
  subject: string;
  snippet?: string;
  gmailMessageId?: string;
  status: "sent" | "synced" | "failed";
  error?: string;
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName?: string;
  feature: "auth" | "quiz" | "files" | "tasks" | "calendar" | "pdfs" | "lectures" | "dictionary" | "games" | "ai" | "voice" | "gmail" | "profile" | "admin";
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface AdminLogsSummary {
  auditCount: number;
  authCount: number;
  activityCount: number;
  emailCount: number;
  errorCount: number;
  totalApiRequests: number;
}


