import React from "react";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  CheckCircle2,
  Brain,
  Bot,
  Mic,
  Sparkles,
  GraduationCap,
  FileDown,
  Gamepad2,
  Languages,
  User,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { ProStudyMindLogo } from "./ProStudyMindLogo";
import { AdsterraBanner, AdsterraSmartlink } from "./AdsterraBanner";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { tr, setIsVoiceModalOpen, platformSettings } = useApp();
  const { isAdmin } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "Home" },
    { id: "pdfs", label: "Student PDFs", icon: FileDown, badge: "Notes & Keys" },
    { id: "lectures", label: "Lectures", icon: GraduationCap, badge: "Class 1-12" },
    { id: "games", label: "Educational Games", icon: Gamepad2, badge: "Play & Learn" },
    { id: "dictionary", label: "Dictionary", icon: Languages, badge: "Multilingual" },
    { id: "media", label: "Media Studio", icon: Sparkles, badge: "Image/Video" },
    { id: "quiz", label: tr("navQuiz"), icon: Brain, badge: "AI Study" },
    { id: "ai", label: tr("navAI"), icon: Bot, badge: "Assistant" },
    { id: "voicemode", label: tr("navVoice"), icon: Mic, badge: "Ultra-Fast" },
    { id: "files", label: tr("navFiles"), icon: FileText },
    { id: "tasks", label: tr("navTasks"), icon: CheckCircle2 },
    { id: "calendar", label: tr("navCalendar"), icon: Calendar },
    ...(isAdmin
      ? [{ id: "admin", label: "Admin Dashboard", icon: ShieldCheck, badge: "Backend" }]
      : []),
    { id: "profile", label: "My Profile", icon: User, badge: "Settings" },
  ];

  return (
    <>
      {/* Mobile Horizontal Tabs (< md) */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 px-3 py-2 flex items-center gap-1.5 sticky top-[57px] z-20 backdrop-blur-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    isActive ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Sidebar (>= md) */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 p-4 flex-col justify-between md:min-h-[calc(100vh-65px)]">
        <div className="space-y-4">
          <div className="px-3 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Study Navigation
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Voice Banner */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-900/40 via-indigo-950/40 to-slate-950 border border-indigo-800/40 text-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Mic className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">AI Voice Assistant</h4>
              <p className="text-[10px] text-slate-400">Natural speech mode</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Talk with AI to quiz yourself, summarize study notes, schedule sessions, or solve problems hands-free.
          </p>
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Start Voice Mode
          </button>
        </div>

        {/* Adsterra Sidebar Placements */}
        {platformSettings?.adPlacementsEnabled !== false && (
          <>
            <AdsterraSmartlink compact={true} className="mt-4" />
            <AdsterraBanner bannerId="banner1" mediaQuery="(min-width: 768px)" className="mt-4" />
            <AdsterraBanner bannerId="banner2" mediaQuery="(min-width: 768px)" className="mt-4" />
          </>
        )}
      </aside>
    </>
  );
};
