import React, { useEffect, useState, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LANG_TO_LOCALE, playActivationChime } from "../utils/voiceEngine";
import { requestMicrophoneAccess, releaseAudioStream, getSpeechRecognitionClass } from "../utils/audioInput";

interface WakeWordListenerProps {
  activeTab?: string;
}

export const WakeWordListener: React.FC<WakeWordListenerProps> = ({ activeTab }) => {
  const {
    setIsVoiceModalOpen,
    isVoiceModalOpen,
    language,
    addNotification,
  } = useApp();
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [detectedToast, setDetectedToast] = useState<string | null>(null);
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const isProcessingRef = useRef(false);
  const addNotificationRef = useRef(addNotification);
  const setIsVoiceModalOpenRef = useRef(setIsVoiceModalOpen);

  useEffect(() => {
    addNotificationRef.current = addNotification;
    setIsVoiceModalOpenRef.current = setIsVoiceModalOpen;
  }, [addNotification, setIsVoiceModalOpen]);

  // Toggle Wake word listener
  const toggleWakeWord = async () => {
    if (wakeWordActive) {
      setWakeWordActive(false);
      setMicStatusMsg(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    // Verify mic access first
    const perm = await requestMicrophoneAccess();
    if (!perm.granted) {
      setMicStatusMsg(perm.error || "Microphone access needed");
      setTimeout(() => setMicStatusMsg(null), 5000);
      return;
    }

    // Release test stream so speech recognition can bind
    if (perm.stream) {
      releaseAudioStream(perm.stream);
    }

    setWakeWordActive(true);
    setMicStatusMsg(null);
  };

  useEffect(() => {
    // If wake word is disabled, voice modal is open, or user is on the dedicated Voice tab, pause background listener
    const shouldPause = !wakeWordActive || isVoiceModalOpen || activeTab === "voicemode";

    if (shouldPause) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = LANG_TO_LOCALE[language] || "en-US";

      rec.onstart = () => {
        isRecognizingRef.current = true;
      };

      rec.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }

        const lower = currentText.toLowerCase().trim();
        // Check for wake words: "hey ai", "hay ai", "hi ai", "hello ai", "ok ai", "hey a.i.", "hay a.i.", "hi a.i.", "hello a.i."
        const isWakeWord =
          lower.includes("hey ai") ||
          lower.includes("hay ai") ||
          lower.includes("hi ai") ||
          lower.includes("hello ai") ||
          lower.includes("ok ai") ||
          lower.includes("hey a.i") ||
          lower.includes("hay a.i") ||
          lower.includes("hi a.i") ||
          lower.includes("hello a.i") ||
          lower.includes("ok a.i") ||
          lower.includes("hey assistant") ||
          lower.includes("hey bunny") ||
          lower.includes("hey danish");

        if (isWakeWord && !isProcessingRef.current) {
          isProcessingRef.current = true;
          playActivationChime();
          setDetectedToast(`Wake word detected: "${currentText}"`);

          // Open voice assistant modal (it will handle greeting and auto-listening)
          setIsVoiceModalOpenRef.current(true);

          addNotificationRef.current({
            title: "🤖 AI Voice Activated",
            message: `Detected wake word: "${currentText}"!`,
            type: "info",
          });

          setTimeout(() => {
            setDetectedToast(null);
            isProcessingRef.current = false;
          }, 4000);
        }
      };

      let hasErr = false;

      rec.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Wake word listener notice:", event.error);
        }
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed" ||
          event.error === "audio-capture"
        ) {
          hasErr = true;
          setWakeWordActive(false);
          setMicStatusMsg("Microphone permission required for wake word");
          setTimeout(() => setMicStatusMsg(null), 5000);
        }
      };

      rec.onend = () => {
        isRecognizingRef.current = false;
        // Auto restart background listener if still enabled and no pause conditions met
        if (wakeWordActive && !hasErr && !isVoiceModalOpen && activeTab !== "voicemode") {
          setTimeout(() => {
            if (!isRecognizingRef.current && wakeWordActive && !isVoiceModalOpen && activeTab !== "voicemode") {
              try {
                rec.start();
              } catch (e) {
                try {
                  const freshRec = new SpeechRecognitionClass();
                  freshRec.continuous = true;
                  freshRec.interimResults = true;
                  freshRec.lang = LANG_TO_LOCALE[language] || "en-US";
                  freshRec.onstart = rec.onstart;
                  freshRec.onresult = rec.onresult;
                  freshRec.onerror = rec.onerror;
                  freshRec.onend = rec.onend;
                  recognitionRef.current = freshRec;
                  freshRec.start();
                } catch (err) {}
              }
            }
          }, 600);
        }
      };

      try {
        rec.start();
      } catch (e) {}

      recognitionRef.current = rec;

      return () => {
        try {
          rec.stop();
        } catch (e) {}
      };
    }
  }, [wakeWordActive, language, isVoiceModalOpen, activeTab]);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        {/* Wake-Word Active Pill (Hidden as requested) */}
        <button
          onClick={toggleWakeWord}
          style={{ display: "none" }}
          className="hidden"
          title="Toggle 'Hey AI' automatic background voice wake word detection"
        >
          <span className={`w-2 h-2 rounded-full ${wakeWordActive ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`} />
          <span className="font-mono">🤖 "Hey AI" Wake Listener</span>
          <span className="text-[10px] opacity-70">
            [{wakeWordActive ? (activeTab === "voicemode" || isVoiceModalOpen ? "PAUSED (VOICE ACTIVE)" : "ACTIVE") : "STANDBY"}]
          </span>
        </button>

        {/* Detected Toast Alert */}
        {detectedToast && (
          <div className="px-3 py-1.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-xl animate-bounce flex items-center gap-1.5 border border-indigo-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{detectedToast}</span>
          </div>
        )}
      </div>

      {micStatusMsg && (
        <span className="text-[10px] bg-rose-500/90 text-white px-2 py-0.5 rounded font-medium shadow">
          {micStatusMsg}
        </span>
      )}
    </div>
  );
};
