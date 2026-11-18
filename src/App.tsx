import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginView } from "./components/LoginView";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { FileOrganizerView } from "./components/FileOrganizerView";
import { QuizModeView } from "./components/QuizModeView";
import { CalendarView } from "./components/CalendarView";
import { TaskAnalyticsView } from "./components/TaskAnalyticsView";
import { VoiceCommunicatorView } from "./components/VoiceCommunicatorView";
import { AIChatBotView } from "./components/AIChatBotView";
import { AIMediaStudioView } from "./components/AIMediaStudioView";
import { LecturesModeView } from "./components/LecturesModeView";
import { StudentPDFView } from "./components/StudentPDFView";
import { EducationalGamesView } from "./components/EducationalGamesView";
import { DictionaryView } from "./components/DictionaryView";
import { DeviceSyncView } from "./components/DeviceSyncView";
import { EncryptedVaultView } from "./components/EncryptedVaultView";
import { SocialHubView } from "./components/SocialHubView";
import { VoiceAssistantModal } from "./components/VoiceAssistantModal";
import { BiometricModal } from "./components/BiometricModal";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import { WakeWordListener } from "./components/WakeWordListener";
import { WelcomeSplashModal } from "./components/WelcomeSplashModal";
import { UserProfileView } from "./components/UserProfileView";
import { AdminHubView } from "./components/AdminHubView";
import { AdsterraNativeBanner } from "./components/AdsterraNativeBanner";
import { AdsterraBanner, AdsterraSmartlink } from "./components/AdsterraBanner";

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isImpersonating, exitImpersonation, currentUser } = useAuth();
  const { platformSettings } = useApp();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [pdfSubjectFilter, setPdfSubjectFilter] = useState<string | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [isWelcomeSplashOpen, setIsWelcomeSplashOpen] = useState<boolean>(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center animate-pulse">
          <span className="w-4 h-4 rounded-full bg-indigo-400 animate-ping" />
        </div>
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          Verifying Academic Session...
        </p>
      </div>
    );
  }

  // Without login, no one can use the app
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const navigateToPDFsWithSubject = (subj?: string) => {
    if (subj) setPdfSubjectFilter(subj);
    setActiveTab("pdfs");
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView setActiveTab={setActiveTab} onNavigateToPDFs={navigateToPDFsWithSubject} />;
      case "admin":
        return <AdminHubView setActiveTab={setActiveTab} />;
      case "profile":
        return <UserProfileView setActiveTab={setActiveTab} />;
      case "dictionary":
        return <DictionaryView />;
      case "games":
        return <EducationalGamesView />;
      case "pdfs":
        return <StudentPDFView initialSubjectFilter={pdfSubjectFilter} />;
      case "lectures":
        return <LecturesModeView />;
      case "media":
        return <AIMediaStudioView />;
      case "quiz":
        return <QuizModeView />;
      case "files":
        return <FileOrganizerView />;
      case "calendar":
        return <CalendarView />;
      case "tasks":
        return <TaskAnalyticsView />;
      case "voicemode":
        return <VoiceCommunicatorView />;
      case "ai":
        return <AIChatBotView />;
      case "devices":
        return <DeviceSyncView />;
      case "vault":
        return <EncryptedVaultView />;
      case "social":
        return <SocialHubView />;
      default:
        return <StudentPDFView initialSubjectFilter={pdfSubjectFilter} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Master Admin Impersonation Banner */}
      {isImpersonating && (
        <aside
          aria-label="Master admin student inspection banner"
          className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-xl border-b border-amber-600/40"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping shrink-0" />
            <span>
              👑 Master Admin View: Browsing Workspace as <strong>{currentUser?.name}</strong> ({currentUser?.email})
            </span>
          </div>
          <button
            onClick={() => {
              exitImpersonation();
              setActiveTab("admin");
            }}
            className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-white font-extrabold text-[11px] shadow transition-all cursor-pointer"
          >
            ← Return to Master Admin Hub
          </button>
        </aside>
      )}

      {/* Top Header */}
      <Header
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onOpenWelcomeIntro={() => setIsWelcomeSplashOpen(true)}
        onOpenProfile={() => setActiveTab("profile")}
        onOpenAdmin={() => setActiveTab("admin")}
      />

      {/* Server-Controlled Platform Notice Banner */}
      {platformSettings?.maintenanceBanner && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold text-center">
          {platformSettings.maintenanceBanner}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {platformSettings?.adPlacementsEnabled !== false && (
            <>
              <AdsterraBanner bannerId="banner5" mediaQuery="(min-width: 1280px)" className="mb-5" />
              <AdsterraBanner bannerId="banner4" mediaQuery="(min-width: 640px) and (max-width: 1279px)" className="mb-4" />
              <AdsterraBanner bannerId="banner6" mediaQuery="(max-width: 639px)" className="mb-4" />
            </>
          )}
          {renderActiveView()}
          {platformSettings?.adPlacementsEnabled !== false && (
            <>
              <AdsterraNativeBanner className="mt-6" />
              <div className="mt-5 max-w-6xl mx-auto space-y-4">
                <AdsterraSmartlink />
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
                  <AdsterraBanner bannerId="banner3" />
                  <AdsterraBanner bannerId="banner4" mediaQuery="(min-width: 640px)" />
                  <AdsterraBanner bannerId="banner1" mediaQuery="(max-width: 767px)" />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Starting Welcome Screen Animation & Interactive Global Modals */}
      <WelcomeSplashModal
        isOpen={isWelcomeSplashOpen}
        onClose={() => setIsWelcomeSplashOpen(false)}
      />
      <VoiceAssistantModal />
      <BiometricModal />
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
      <WakeWordListener activeTab={activeTab} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
