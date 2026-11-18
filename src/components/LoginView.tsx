import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Atom,
  HardDrive,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StudentGrade } from "../types";
import { ProStudyMindLogo } from "./ProStudyMindLogo";
import { AdsterraNativeBanner } from "./AdsterraNativeBanner";
import { AdsterraBanner, AdsterraSmartlink } from "./AdsterraBanner";

export const LoginView: React.FC = () => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<StudentGrade>("11th Class");
  const [targetExam, setTargetExam] = useState("Annual Board Examinations 2026");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const res = await login(email, password, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || "Authentication failed. Please check your credentials.");
        }
      } else {
        const res = await signup(name, email, password, grade, targetExam, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || "Registration failed. Please check your inputs.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-64 h-64 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center items-center">
            <ProStudyMindLogo size="lg" showText={true} showBadge={true} />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Student Academic Access Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Login is strictly required to unlock verified textbook notes, KaTeX formulas, video lectures, and exam revision guides.
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-xl shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Callout */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Full Student Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Danish Ahmad"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {mode === "signup" ? "Student Email Address" : "Student Email or ID"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mode === "signup" ? "email" : "text"}
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@school.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Current Class / Level
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as StudentGrade)}
                    className="w-full px-3 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs font-bold focus:outline-none"
                  >
                    <option value="Class 9">Class 9 (Matric 1)</option>
                    <option value="Class 10">Class 10 (Matric 2)</option>
                    <option value="11th Class">Class 11 (1st Year FSc)</option>
                    <option value="12th Class">Class 12 (2nd Year FSc)</option>
                    <option value="MDCAT & ECAT Entry Test">MDCAT & ECAT Entrance</option>
                    <option value="General / College">College / University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Examination Goal
                  </label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. Board Distinction 2026"
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember my session on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Authenticating...</span>
                </>
              ) : mode === "login" ? (
                <>
                  <Lock className="w-4 h-4 text-cyan-300" />
                  <span>Log In to Student Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 text-cyan-300" />
                  <span>Create Account & Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Helper hint */}
          <div className="pt-2 text-center text-[11px] text-slate-400">
            {mode === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Create Student Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & Academic Guarantees */}
        <div className="grid grid-cols-3 gap-3 text-center text-[10px] text-slate-400 pt-1">
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Strict Student Login</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Atom className="w-4 h-4 text-indigo-400" />
            <span>Verified KaTeX Math</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>Encrypted Session</span>
          </div>
        </div>

        <AdsterraNativeBanner className="border-slate-800/80 bg-slate-900/60" />
        <AdsterraSmartlink compact={true} />
        <AdsterraBanner bannerId="banner6" className="pt-1" />
      </div>
    </div>
  );
};
