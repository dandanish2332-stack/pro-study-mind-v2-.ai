import React, { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

export type AdsterraBannerId =
  | "banner1"
  | "banner2"
  | "banner3"
  | "banner4"
  | "banner5"
  | "banner6";

interface AdsterraBannerConfig {
  key: string;
  width: number;
  height: number;
  src: string;
  label: string;
}

export const ADSTERRA_BANNERS: Record<AdsterraBannerId, AdsterraBannerConfig> = {
  banner1: {
    key: "191f598ff639ac6de5cdaf98650b699a",
    width: 468,
    height: 60,
    src: "https://bauval.org/22/191f598ff639ac6de5cdaf98650b699a",
    label: "468x60",
  },
  banner2: {
    key: "b0d565031e8a3245f241c8fb34d0a66a",
    width: 300,
    height: 250,
    src: "https://bauval.org/22/b0d565031e8a3245f241c8fb34d0a66a",
    label: "300x250",
  },
  banner3: {
    key: "aaab3ba8aee9a3877e8b393bdcf3d06c",
    width: 160,
    height: 300,
    src: "https://bauval.org/22/aaab3ba8aee9a3877e8b393bdcf3d06c",
    label: "160x300",
  },
  banner4: {
    key: "3dc6df9ac3322ce8d5a503ddee98b87f",
    width: 160,
    height: 600,
    src: "https://bauval.org/22/3dc6df9ac3322ce8d5a503ddee98b87f",
    label: "160x600",
  },
  banner5: {
    key: "c2bc20030b97629b522f6c921c68d09f",
    width: 728,
    height: 90,
    src: "https://bauval.org/22/c2bc20030b97629b522f6c921c68d09f",
    label: "728x90",
  },
  banner6: {
    key: "95b1e0884f0f5aa801d679a1d3c238a1",
    width: 320,
    height: 50,
    src: "https://bauval.org/22/95b1e0884f0f5aa801d679a1d3c238a1",
    label: "320x50",
  },
};

export const ADSTERRA_SMARTLINK_URL =
  "https://araplhn.org/4/c2de17f576fdb3241226f7a1f0343451";

declare global {
  interface Window {
    atOptions?: {
      key: string;
      format: string;
      height: number;
      width: number;
      params: Record<string, unknown>;
    };
  }
}

// Serialize Adsterra banner script loading so window.atOptions is never overwritten before a script executes
let bannerLoadQueue: Promise<void> = Promise.resolve();

function enqueueBannerScript(task: () => Promise<void>): Promise<void> {
  const next = bannerLoadQueue.then(task, task);
  bannerLoadQueue = next.catch(() => {});
  return next;
}

export const AdsterraBanner: React.FC<{
  bannerId: AdsterraBannerId;
  className?: string;
  mediaQuery?: string;
}> = ({ bannerId, className = "", mediaQuery }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const config = ADSTERRA_BANNERS[bannerId];

  const [matchesMedia, setMatchesMedia] = useState<boolean>(() => {
    if (!mediaQuery || typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia(mediaQuery).matches;
  });

  useEffect(() => {
    if (!mediaQuery || typeof window === "undefined" || !window.matchMedia) {
      setMatchesMedia(true);
      return;
    }
    const mql = window.matchMedia(mediaQuery);
    setMatchesMedia(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatchesMedia(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [mediaQuery]);

  useEffect(() => {
    if (!matchesMedia) return;
    const container = containerRef.current;
    if (!container || !config) return;

    let cancelled = false;
    container.innerHTML = "";

    enqueueBannerScript(
      () =>
        new Promise<void>((resolve) => {
          if (cancelled || !containerRef.current) {
            resolve();
            return;
          }

          window.atOptions = {
            key: config.key,
            format: "iframe",
            height: config.height,
            width: config.width,
            params: {},
          };

          const script = document.createElement("script");
          script.src = config.src;
          script.async = false;
          script.setAttribute("data-cfasync", "false");

          const safetyTimeout = window.setTimeout(() => {
            resolve();
          }, 2500);

          const finish = () => {
            window.clearTimeout(safetyTimeout);
            resolve();
          };

          script.onload = finish;
          script.onerror = finish;

          container.appendChild(script);
        })
    );

    return () => {
      cancelled = true;
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [config, matchesMedia]);

  if (!matchesMedia || !config) return null;

  return (
    <div
      className={`w-full max-w-full flex justify-center items-center overflow-x-auto ${className}`}
      aria-label={`Sponsored Ad ${config.label}`}
    >
      <div
        ref={containerRef}
        className="flex justify-center items-center shrink-0 max-w-full"
        style={{ width: config.width, minHeight: config.height }}
      />
    </div>
  );
};

export const AdsterraSmartlink: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = "", compact = false }) => {
  return (
    <a
      href={ADSTERRA_SMARTLINK_URL}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`group flex items-center justify-between gap-2 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/60 hover:border-cyan-400/60 text-slate-100 shadow-sm transition-all ${
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-xs sm:text-sm"
      } ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
          Ad
        </span>
        <span className="font-bold truncate group-hover:text-cyan-300 transition-colors">
          Sponsored Study Partner Resource
        </span>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
};
