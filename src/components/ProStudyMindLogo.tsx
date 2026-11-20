import React from "react";
import logoImg from "../assets/pro_study_mind_logo.jpg";

interface ProStudyMindLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showBadge?: boolean;
  useImage?: boolean;
  customTitle?: string;
  className?: string;
}

export const ProStudyMindLogo: React.FC<ProStudyMindLogoProps> = ({
  size = "md",
  showText = true,
  showBadge = true,
  useImage = false,
  customTitle,
  className = "",
}) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeMap = {
    xs: { icon: "w-6 h-6", text: "text-xs", badge: "text-[9px]" },
    sm: { icon: "w-8 h-8", text: "text-sm", badge: "text-[10px]" },
    md: { icon: "w-10 h-10", text: "text-base", badge: "text-[11px]" },
    lg: { icon: "w-12 h-12", text: "text-lg", badge: "text-xs" },
    xl: { icon: "w-16 h-16", text: "text-2xl", badge: "text-xs" },
  };

  const { icon, text, badge } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon Badge */}
      <div className={`relative shrink-0 ${icon} rounded-xl overflow-hidden shadow-md shadow-indigo-500/25 ring-1 ring-white/20 group`}>
        {useImage && !imgError ? (
          <img
            src={logoImg}
            alt="Pro Study Mind v2.0 Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-cyan-400 flex items-center justify-center p-1.5 text-white">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-sm"
            >
              {/* Atomic orbital rings */}
              <ellipse
                cx="24"
                cy="25"
                rx="20"
                ry="8"
                transform="rotate(-25 24 25)"
                stroke="#67e8f9"
                strokeWidth="1.6"
                strokeDasharray="2 1"
                className="opacity-75"
              />
              <ellipse
                cx="24"
                cy="25"
                rx="20"
                ry="8"
                transform="rotate(25 24 25)"
                stroke="#a855f7"
                strokeWidth="1.6"
                strokeDasharray="2 1"
                className="opacity-75"
              />
              {/* Electron dots */}
              <circle cx="7" cy="18" r="1.8" fill="#38bdf8" />
              <circle cx="41" cy="32" r="1.8" fill="#c084fc" />

              {/* Brain Cortical Lobes */}
              <path
                d="M17 22C14.5 22 13 24 13 27C13 30 14.8 32.5 17.5 33C17.2 34.5 18 36.5 20.5 37C22 37.3 23.2 36.8 24 36C24.8 36.8 26 37.3 27.5 37C30 36.5 30.8 34.5 30.5 33C33.2 32.5 35 30 35 27C35 24 33.5 22 31 22C30.8 19 28.5 17 25.5 17C24.8 17 24.2 17.2 23.7 17.5C23.2 17.2 22.5 17 21.8 17C19.2 17 17.2 19 17 22Z"
                fill="#1e1b4b"
                stroke="#e0e7ff"
                strokeWidth="1.5"
              />
              {/* Brain Neural Sulci lines */}
              <path
                d="M18 26C19.5 25.5 21 27 22 26M26 26C27 27 28.5 25.5 30 26M19 31C20.5 30.5 22 32 23.5 31M24.5 31C26 32 27.5 30.5 29 31"
                stroke="#818cf8"
                strokeWidth="1.2"
                strokeLinecap="round"
              />

              {/* Graduation Cap */}
              <polygon
                points="24,6 40,13 24,20 8,13"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* Cap base band */}
              <path
                d="M16 16.5V20C16 22.5 19.5 24.5 24 24.5C28.5 24.5 32 22.5 32 20V16.5"
                fill="#1e293b"
                stroke="#67e8f9"
                strokeWidth="1.2"
              />
              {/* Golden/Cyan Cap Tassel */}
              <circle cx="24" cy="13" r="1.6" fill="#facc15" />
              <path
                d="M24 13L35 17.5V23"
                stroke="#facc15"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="35" cy="23.5" r="1.2" fill="#facc15" />
            </svg>
          </div>
        )}

        {/* Live Active Pulse */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-slate-950"></span>
        </span>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            {customTitle && customTitle.trim() && customTitle.trim().toLowerCase() !== "pro study mind v2.0" ? (
              <span className={`font-black tracking-tight text-slate-900 dark:text-white ${text} leading-none`}>
                {customTitle}
              </span>
            ) : (
              <>
                <span className={`font-black tracking-tight text-slate-900 dark:text-white ${text} leading-none`}>
                  PRO STUDY <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">MIND</span>
                </span>
                {showBadge && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-black tracking-wider uppercase bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-xs ${badge}`}>
                    v2.0
                  </span>
                )}
              </>
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide mt-0.5">
            Academic & AI Study Engine
          </span>
        </div>
      )}
    </div>
  );
};
