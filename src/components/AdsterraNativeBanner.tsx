import React, { useEffect, useRef } from "react";

const NATIVE_BANNER_SRC = "https://bauval.org/21/38053601c23e2e350ae903de24bfe1f0";
const NATIVE_BANNER_CONTAINER_ID = "container-38053601c23e2e350ae903de24bfe1f0";

export const AdsterraNativeBanner: React.FC<{ className?: string }> = ({ className = "" }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;

    let cancelled = false;
    let injectedScript: HTMLScriptElement | null = null;
    container.innerHTML = "";

    const timer = window.setTimeout(() => {
      if (cancelled || !wrapperRef.current || !containerRef.current) return;
      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = NATIVE_BANNER_SRC;
      injectedScript = script;
      wrapper.insertBefore(script, container);
    }, 30);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (injectedScript && injectedScript.parentNode) {
        injectedScript.parentNode.removeChild(injectedScript);
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`w-full max-w-6xl mx-auto my-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 p-3 overflow-hidden min-h-[90px] ${className}`}
    >
      <div ref={containerRef} id={NATIVE_BANNER_CONTAINER_ID} className="w-full" />
    </div>
  );
};
