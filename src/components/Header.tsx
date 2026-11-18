import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  Globe,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Brain,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Language } from "../types";
import { ProStudyMindLogo } from "./ProStudyMindLogo";

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenWelcomeIntro?: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenWelcomeIntro,
  onOpenProfile,
  onOpenAdmin,
}) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    notifications,
    setIsVoiceModalOpen,
    tr,
  } = useApp();

  const { currentUser, logout, isAdmin } = useAuth();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    if (langMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langMenuOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "EN", label: "English", flag: "🇺🇸" },
    { code: "PS", label: "پښتو (Pashto)", flag: "🇦🇫" },
    { code: "UR", label: "اردو (Urdu)", flag: "🇵🇰" },
    { code: "ES", label: "Español", flag: "🇪🇸" },
    { code: "FR", label: "Français", flag: "🇫🇷" },
    { code: "DE", label: "Deutsch", flag: "🇩🇪" },
    { code: "JA", label: "日本語", flag: "🇯🇵" },
    { code: "ZH", label: "中文", flag: "🇨🇳" },
    { code: "HI", label: "हिन्दी", flag: "🇮🇳" },
    { code: "AR", label: "العربية", flag: "🇸🇦" },
    { code: "TR", label: "Türkçe", flag: "🇹🇷" },
    { code: "RU", label: "Русский", flag: "🇷🇺" },
    { code: "FA", label: "فارسی (Persian)", flag: "🇮🇷" },
    { code: "BN", label: "বাংলা (Bengali)", flag: "🇧🇩" },
    { code: "PT", label: "Português", flag: "🇧🇷" },
    { code: "IT", label: "Italiano", flag: "🇮🇹" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenWelcomeIntro}
            className="flex items-center text-left group hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer focus:outline-none"
            title="Click to view PRO Study Mind v2.0 Welcome Splash Screen"
          >
            <ProStudyMindLogo size="md" showText={true} showBadge={true} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Open Backend & Master Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Dashboard</span>
            </button>
          )}

          {/* Voice Mode Button */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-sm shadow-indigo-500/20 active:scale-95 transition-all whitespace-nowrap shrink-0"
            title="Open Voice Assistant Modal"
          >
            <Mic className="w-4 h-4 animate-pulse text-cyan-300" />
            <span className="hidden sm:inline">Voice Assistant</span>
          </button>

          {/* Language Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      language === l.code
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </span>
                    {language === l.code && <span className="text-xs text-indigo-500">•</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={theme === "dark" ? tr("lightMode") : tr("darkMode")}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title={tr("notifications")}
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Logged In Student Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                title={`Signed in as ${currentUser.name} (${currentUser.email}) - Click to edit profile & settings`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${currentUser.avatarColor || "from-indigo-500 to-purple-600"} text-white text-[10px] font-black flex items-center justify-center shadow-xs`}
                >
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                      {currentUser.name}
                    </p>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                    {isAdmin ? "Master Administrator" : currentUser.grade}
                  </p>
                </div>
              </button>

              {/* Mobile compact avatar */}
              <button
                type="button"
                onClick={onOpenProfile}
                className={`md:hidden w-7 h-7 rounded-full bg-gradient-to-br ${currentUser.avatarColor || "from-indigo-500 to-purple-600"} text-white text-[11px] font-black flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-indigo-400`}
                title={`${currentUser.name} (${currentUser.grade}) - Open Profile`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/60 transition-all cursor-pointer"
                title="Sign out of student account (Lock Workspace)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
