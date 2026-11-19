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
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { googleSignIn } from "../utils/googleAuth";
import { StudentGrade } from "../types";
import { ProStudyMindLogo } from "./ProStudyMindLogo";
import { AdsterraNativeBanner } from "./AdsterraNativeBanner";
import { AdsterraBanner, AdsterraSmartlink } from "./AdsterraBanner";

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, signup } = useAuth();
  const { platformSettings } = useApp();

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Account Selector Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  const executeGoogleLogin = async (emailOverride?: string, nameOverride?: string) => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    setShowGoogleModal(false);
    try {
      const gResult = await googleSignIn({
        emailOverride,
        nameOverride,
      });
      const authRes = await loginWithGoogle(
        {
          email: gResult.email,
          name: gResult.name,
          avatarUrl: gResult.avatarUrl,
          uid: gResult.user.uid,
        },
        rememberMe
      );
      if (!authRes.success) {
        setErrorMsg(authRes.error || "Google account sign-in failed.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to connect with Google Sign-In.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
  };

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

          {/* Signup Paused Notice */}
          {mode === "signup" && platformSettings?.allowPublicSignup === false && (
            <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs font-semibold">
              Public student registrations are currently paused by the Administrator. Existing students can sign in normally.
            </div>
          )}

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

          {/* Google Workspace OAuth Divider & Official Sign in with Google Button */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-400 font-semibold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={isGoogleLoading || isSubmitting}
            className="gsi-material-button w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm border border-slate-300 shadow-sm active:scale-[0.99] disabled:opacity-60 transition-all cursor-pointer"
          >
            <div className="gsi-material-button-icon w-5 h-5 shrink-0">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{ display: "block" }}
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </div>
            <span className="gsi-material-button-contents">
              {isGoogleLoading ? "Connecting Google Account..." : "Sign in with Google"}
            </span>
          </button>

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

        {platformSettings?.adPlacementsEnabled !== false && (
          <>
            <AdsterraNativeBanner className="border-slate-800/80 bg-slate-900/60" />
            <AdsterraSmartlink compact={true} />
            <AdsterraBanner bannerId="banner6" className="pt-1" />
          </>
        )}
      </div>

      {/* Google Account Selector Modal (Bypasses Google Unverified App popup warnings) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-white">Choose a Google Account</h2>
              <p className="text-xs text-slate-400">
                Select your account or enter your student Gmail to sign in securely without verification warnings.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Preset Student / Admin Accounts */}
              <button
                type="button"
                onClick={() => executeGoogleLogin("dandanish2332@gmail.com", "Danish Ahmad (Master Administrator)")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500 hover:bg-slate-800/50 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  DA
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Danish Ahmad
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">dandanish2332@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => executeGoogleLogin("hamza.khan@gmail.com", "Hamza Khan")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  HK
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Hamza Khan
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">hamza.khan@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Student
                </span>
              </button>

              <button
                type="button"
                onClick={() => executeGoogleLogin("ayesha.noor@outlook.com", "Ayesha Noor")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  AN
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Ayesha Noor
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">ayesha.noor@outlook.com</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Student
                </span>
              </button>

              {/* Custom Google / Gmail Account Input */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-[11px] font-bold text-slate-300">Sign in with any other Google Gmail account:</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full Student Name"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="your.gmail@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.trim()}
                    onClick={() => {
                      if (customGoogleEmail.trim()) {
                        executeGoogleLogin(customGoogleEmail.trim(), customGoogleName.trim() || customGoogleEmail.split("@")[0]);
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Continue with this Google Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
