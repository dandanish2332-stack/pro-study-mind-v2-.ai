import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Calculator,
  Mic,
  Gamepad2,
  Atom,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import logoImg from "../assets/pro_study_mind_logo.jpg";
import { ProStudyMindLogo } from "./ProStudyMindLogo";

interface WelcomeSplashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeSplashModal: React.FC<WelcomeSplashModalProps> = ({
  isOpen,
  onClose,
}) => {
  const TOTAL_DURATION_MS = 5000; // Exact 5-second starting animation
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [statusMessage, setStatusMessage] = useState("Initializing PRO Study Mind v2.0 Engine...");
  const [isClosing, setIsClosing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [logoError, setLogoError] = useState(false);

  // Soft sci-fi welcome chord via Web Audio API (zero external network dependencies)
  const playWelcomeChord = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Polyphonic ascending chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const frequencies = [523.25, 659.25, 783.99, 1046.5];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + 1.4 + idx * 0.1);
      });
    } catch (e) {}
  };

  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleDismiss = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onCloseRef.current();
      setIsClosing(false);
    }, 350);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setSecondsRemaining(5);
    setIsClosing(false);
    playWelcomeChord();

    const startTime = Date.now();
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_DURATION_MS) * 100));
      setProgress(pct);

      const remainingSec = Math.max(0, Math.ceil((TOTAL_DURATION_MS - elapsed) / 1000));
      setSecondsRemaining(remainingSec);

      // Synchronize 5 specific stages across the 5-second animation
      if (pct < 20) {
        setStatusMessage("Initializing PRO Study Mind v2.0 Engine...");
      } else if (pct < 40) {
        setStatusMessage("Loading 1,000+ Notes with KaTeX Math Formulas...");
      } else if (pct < 60) {
        setStatusMessage("Synchronizing Video Lectures for Classes 1 to 12...");
      } else if (pct < 80) {
        setStatusMessage("Powering Ultra-Fast Voice & Smart Quiz Systems...");
      } else {
        setStatusMessage("PRO Workspace Ready! Launching now...");
      }

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(interval);
        // Automatically dismiss into the workspace after the 5 seconds complete
        dismissTimer = setTimeout(() => {
          handleDismiss();
        }, 200);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [isOpen, handleDismiss]);

  // Keyboard shortcut listener (Enter or Space to enter immediately)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isClosing ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Immersive Dark Backdrop with Glow */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl transition-opacity" />

      {/* Radiant Glowing Orbs in Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Glassmorphic Modal Card */}
      <div className="relative z-10 w-full max-w-xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/20 text-white overflow-hidden text-center space-y-6">
        {/* Subtle Top Sound Toggle & Skip */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 transition-colors"
            title="Toggle sound"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">Audio On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Muted</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="text-[11px] font-semibold text-indigo-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            Skip Intro (Press Enter)
          </button>
        </div>

        {/* Central Logo with Animated Orbiting Halo Rings */}
        <div className="relative inline-flex items-center justify-center mx-auto my-2">
          {/* Pulsing Backlight Halo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full opacity-60 blur-xl animate-pulse" />

          {/* Atomic Outer Orbital Rings */}
          <div className="absolute -inset-6 border border-cyan-400/40 rounded-full animate-spin [animation-duration:12s] pointer-events-none" />
          <div className="absolute -inset-10 border border-indigo-400/30 rounded-full animate-spin [animation-duration:18s] [animation-direction:reverse] pointer-events-none" />

          {/* Logo Graphic Image */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-600/50 ring-2 ring-white/30 transform transition-transform duration-500 hover:scale-105 flex items-center justify-center bg-indigo-950">
            {!logoError ? (
              <img
                src={logoImg}
                alt="PRO Study Mind v2.0 Logo"
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <ProStudyMindLogo size="xl" showText={false} showBadge={false} />
            )}
          </div>
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-cyan-300 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              Academic Platform
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-white px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 border border-indigo-400/40 shadow-xs">
              v2.0 PRO
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            WELCOME TO <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
              PRO STUDY MIND
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Your all-in-one AI academic engine for Pakistani school & college excellence.
          </p>
        </div>

        {/* 4 Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left pt-1">
          <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-cyan-300 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Class 1–12 Notes</p>
              <p className="text-[10px] text-slate-400 truncate">Math powers, fractions, roots</p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Video Lectures</p>
              <p className="text-[10px] text-slate-400 truncate">Sabaq, PGC, ilmkidunya</p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/30 text-cyan-300 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Fast Voice Mode</p>
              <p className="text-[10px] text-slate-400 truncate">Zero-delay speech & Q&A</p>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/30 text-emerald-300 shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Games Arena</p>
              <p className="text-[10px] text-slate-400 truncate">Interactive study games</p>
            </div>
          </div>
        </div>

        {/* Animated Loading Bar with 5-Second Timer */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-300 truncate max-w-[280px] sm:max-w-xs text-left">
              <Sparkles className="w-3 h-3 animate-spin text-cyan-400 shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-[10px] font-mono text-cyan-300">
                {secondsRemaining}s
              </span>
              <span className="font-mono text-indigo-300 w-8 text-right">{progress}%</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700/60 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-75 ease-linear shadow-sm shadow-cyan-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400/80 pt-0.5">
            <span>5-Second Starting Calibration</span>
            <span>Auto-launches at 100% (or Press Enter)</span>
          </div>
        </div>

        {/* Launch Workspace CTA Button */}
        <div className="pt-2">
          <button
            onClick={handleDismiss}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/40 hover:shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Enter Study Workspace</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
