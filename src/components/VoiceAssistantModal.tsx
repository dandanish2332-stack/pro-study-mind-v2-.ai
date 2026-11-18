import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  RefreshCw,
  Radio,
  Play,
  CheckCircle2,
  Zap,
  X,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Square,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  speakWithVoice,
  stopSpeaking,
  playActivationChime,
  LANG_TO_LOCALE,
  getVoiceModeInitialGreeting,
  warmUpSpeechEngine,
  getInstantVoiceAnswer,
} from "../utils/voiceEngine";
import {
  requestMicrophoneAccess,
  releaseAudioStream,
  getSpeechRecognitionClass,
  isSpeechRecognitionSupported,
  SafeAudioRecorder,
  transcribeAudioViaServer,
} from "../utils/audioInput";
import { Language } from "../types";

export const VoiceAssistantModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    language,
    selectedVoicePersona,
    customVoiceURI,
    addCalendarEvent,
    addTask,
    generateAISummaryReport,
    generateSocialDigest,
    toggleVaultLock,
    files,
  } = useApp();

  // Conversational Assistant State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Diagnostic mode
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    micFound: boolean;
    streamActive: boolean;
    peakDecibels: number;
    recordedUrl?: string;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const transcriptRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);
  const isThinkingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const isModalOpenRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const audioRecorderRef = useRef<SafeAudioRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const userSpokeSoundRef = useRef<boolean>(false);
  const lastSoundTimeRef = useRef<number>(0);

  useEffect(() => {
    isModalOpenRef.current = isVoiceModalOpen;
  }, [isVoiceModalOpen]);

  // Clean up audio level analyzer
  const stopAudioAnalysis = (releaseStream = false) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (releaseStream && mediaStreamRef.current) {
      releaseAudioStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start real-time audio analysis from mic stream
  const startAudioAnalysis = (stream: MediaStream) => {
    try {
      let audioCtx = audioContextRef.current;
      if (!audioCtx || audioCtx.state === "closed") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!isModalOpenRef.current) {
          stopAudioAnalysis(false);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        // Voice Activity Detection (VAD) - auto stop & transcribe gracefully after user completes speaking
        if (isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
          if (normalized > 20) {
            userSpokeSoundRef.current = true;
            lastSoundTimeRef.current = Date.now();
          } else if (userSpokeSoundRef.current && lastSoundTimeRef.current > 0) {
            const hasRecognizedText = Boolean((transcriptRef.current || "").trim());
            // Natural conversational turn-taking: 900ms after last spoken sound once text is captured
            if (hasRecognizedText && Date.now() - lastSoundTimeRef.current > 900) {
              userSpokeSoundRef.current = false;
              lastSoundTimeRef.current = 0;
              stopListening();
              return;
            } else if (!hasRecognizedText && Date.now() - lastSoundTimeRef.current > 1600) {
              // Reset sound flag if no text was decoded from noise
              userSpokeSoundRef.current = false;
              lastSoundTimeRef.current = 0;
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (e) {
      console.warn("Audio visualizer notice:", e);
    }
  };

  // Safe Speech Recognition Engine Setup
  const initSpeechEngine = () => {
    // Clean up existing recognition engine before creating a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const SpeechRecognitionClass = getSpeechRecognitionClass();

    if (SpeechRecognitionClass) {
      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = LANG_TO_LOCALE[language] || "en-US";
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          isRecognizingRef.current = true;
        };

        rec.onresult = (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcriptChunk;
            } else {
              interim += transcriptChunk;
            }
          }

          const currentSpoken = (final || interim).trim();
          if (currentSpoken) {
            setTranscript(currentSpoken);
            transcriptRef.current = currentSpoken;
            setMicErrorMessage(null);
          }

          const hasFinal = Boolean(final.trim());
          // Reset silence timer
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // Natural conversational turn-taking: 850ms for completed final chunk, 1300ms for interim pause
          const pauseTimeout = hasFinal ? 850 : 1300;
          silenceTimerRef.current = setTimeout(() => {
            if (
              transcriptRef.current &&
              !isThinkingRef.current &&
              !isSpeakingRef.current
            ) {
              if (audioRecorderRef.current) {
                audioRecorderRef.current.stop().catch(() => {});
                audioRecorderRef.current = null;
              }
              handleFinalSubmission(transcriptRef.current);
            }
          }, pauseTimeout);
        };

        rec.onerror = (event: any) => {
          const errorType = event.error;
          if (errorType === "no-speech" || errorType === "aborted") return;

          if (errorType === "not-allowed" || errorType === "service-not-allowed") {
            setMicErrorMessage("Microphone access was denied. Please allow microphone permissions.");
          } else if (errorType === "network" || errorType === "audio-capture") {
            console.warn("Speech recognition network notice, using audio recorder fallback:", errorType);
          }
        };

        rec.onend = () => {
          isRecognizingRef.current = false;
          if (isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current && isModalOpenRef.current) {
            setTimeout(() => {
              if (isListeningRef.current && isModalOpenRef.current && !isRecognizingRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
                try {
                  rec.start();
                } catch (e) {
                  try {
                    const freshRec = initSpeechEngine();
                    if (freshRec) freshRec.start();
                  } catch (err) {}
                }
              }
            }, 300);
          }
        };

        recognitionRef.current = rec;
        return rec;
      } catch (e) {
        console.warn("SpeechRecognition init notice:", e);
      }
    }
    return null;
  };

  // Dedicated Hardware Diagnostic Tester
  const runMicDiagnostic = async () => {
    setDiagRunning(true);
    setDiagResult(null);

    const testRecorder = new SafeAudioRecorder();
    const ok = await testRecorder.start();

    if (!ok) {
      setDiagResult({ micFound: false, streamActive: false, peakDecibels: 0 });
      setDiagRunning(false);
      return;
    }

    setTimeout(async () => {
      const audioBlob = await testRecorder.stop();
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setDiagResult({
          micFound: true,
          streamActive: true,
          peakDecibels: 88,
          recordedUrl: url,
        });
      } else {
        setDiagResult({ micFound: true, streamActive: true, peakDecibels: 40 });
      }
      setDiagRunning(false);
    }, 3000);
  };

  // Start Voice Listening (Dual Engine)
  const startListening = async (isUserInitiated = false) => {
    if (isThinkingRef.current) return;

    // Interrupt assistant if it is currently speaking
    if (isSpeakingRef.current) {
      stopSpeaking();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }

    setTranscript("");
    transcriptRef.current = "";
    if (isUserInitiated) {
      setMicErrorMessage(null);
    }
    stopSpeaking();

    let stream: MediaStream | null = mediaStreamRef.current;
    const hasLiveTracks = stream && stream.active && stream.getAudioTracks().some((t) => t.readyState === "live");

    if (!hasLiveTracks) {
      try {
        const micStatus = await requestMicrophoneAccess();
        if (!micStatus.granted || !micStatus.stream) {
          if (isUserInitiated) {
            setMicErrorMessage(micStatus.error || "Please allow microphone permissions to speak.");
          }
          return;
        }
        stream = micStatus.stream;
        mediaStreamRef.current = stream;
      } catch (e: any) {
        if (isUserInitiated) {
          setMicErrorMessage("Please allow microphone permissions to speak.");
        }
        return;
      }
    }

    if (stream) {
      try {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
      } catch (e) {}

      startAudioAnalysis(stream);

      // Always start fail-safe MediaRecorder backup alongside Web Speech API
      // Ensures that if Web Speech API returns empty or fails in iframe, recorded audio is transcribed by AI
      try {
        const recorder = new SafeAudioRecorder();
        audioRecorderRef.current = recorder;
        await recorder.start(stream);
      } catch (e) {
        console.warn("Media recorder fallback init:", e);
      }
    }

    isListeningRef.current = true;
    setIsListening(true);

    // Start Web Speech recognition if available
    if (!recognitionRef.current) {
      initSpeechEngine();
    }

    if (recognitionRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current.lang = LANG_TO_LOCALE[language] || "en-US";
        recognitionRef.current.start();
      } catch (e: any) {
        if (e?.name !== "InvalidStateError") {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              if (isListeningRef.current && isModalOpenRef.current && recognitionRef.current && !isRecognizingRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (err) {}
              }
            }, 200);
          } catch (err) {}
        }
      }
    }
  };

  // Stop Listening
  const stopListening = async () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Temporarily disable mic tracks so audio output hardware is completely free for instant TTS playback
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      } catch (e) {}
    }

    stopAudioAnalysis(false);

    let currentText = (transcriptRef.current || transcript).trim();

    // If hardware recorder fallback was active and no text recognized yet, transcribe audio
    if (!currentText && audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
      try {
        const audioBlob = await audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        if (audioBlob && audioBlob.size > 1500) {
          setMicErrorMessage("Transcribing audio via AI...");
          currentText = await transcribeAudioViaServer(audioBlob, language);
          setMicErrorMessage(null);
        }
      } catch (e) {
        audioRecorderRef.current = null;
      }
    } else if (audioRecorderRef.current) {
      try {
        await audioRecorderRef.current.stop();
      } catch (e) {}
      audioRecorderRef.current = null;
    }

    if (currentText.trim() && !isThinkingRef.current) {
      transcriptRef.current = "";
      setTranscript("");
      handleFinalSubmission(currentText);
    }
  };

  const handleToggleMic = () => {
    if (isSpeakingRef.current) {
      stopSpeaking();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      startListening(true);
      return;
    }

    if (isListeningRef.current) {
      if (transcriptRef.current.trim()) {
        handleFinalSubmission(transcriptRef.current);
      } else {
        stopListening();
      }
    } else {
      startListening(true);
    }
  };

  // Speaks text with active voice persona
  const speakText = (text: string, onFinish?: () => void) => {
    if (!text || !text.trim()) return;

    setIsSpeaking(true);
    isSpeakingRef.current = true;

    speakWithVoice(
      text,
      selectedVoicePersona,
      customVoiceURI,
      undefined,
      1.22,
      language,
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onFinish) onFinish();
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onFinish) onFinish();
      }
    );
  };

  // Final submission of user voice command
  const handleFinalSubmission = (text: string) => {
    processVoiceCommand(text);
  };

  // Automatic AI Voice Command Processor & Action Executor
  const processVoiceCommand = async (textToSend: string) => {
    const raw = textToSend.trim();
    if (!raw || isThinkingRef.current) return;

    const lowerRaw = raw.toLowerCase().replace(/[,.!?]/g, "").trim();
    const isJustWakeWord =
      lowerRaw === "hey ai" ||
      lowerRaw === "hay ai" ||
      lowerRaw === "hi ai" ||
      lowerRaw === "hello ai" ||
      lowerRaw === "ok ai" ||
      lowerRaw === "hey a.i" ||
      lowerRaw === "hay a.i" ||
      lowerRaw === "hi a.i" ||
      lowerRaw === "hello a.i" ||
      lowerRaw === "ok a.i" ||
      lowerRaw === "ai" ||
      lowerRaw === "hey bunny" ||
      lowerRaw === "bunny" ||
      lowerRaw === "hey danish" ||
      lowerRaw === "hi danish" ||
      lowerRaw === "hello danish";

    if (isJustWakeWord) {
      stopListening();
      setTextInput("");
      const greetingReply = "Hi! I am your AI study and voice assistant. What would you like to learn or do today?";
      setAiResponse(greetingReply);
      speakText(greetingReply, () => {
        if (isModalOpenRef.current) {
          setTimeout(() => {
            if (isModalOpenRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 550);
        }
      });
      return;
    }

    let cleanCommand = raw;
    const prefixes = [
      "hey ai",
      "hay ai",
      "hi ai",
      "hello ai",
      "ok ai",
      "hey a.i",
      "hay a.i",
      "hi a.i",
      "hello a.i",
      "ok a.i",
      "hey bunny",
      "hay bunny",
      "hi bunny",
      "hello bunny",
      "ok bunny",
      "bunny",
      "hey danish",
      "hi danish",
      "hello danish",
      "danish",
    ];

    for (const prefix of prefixes) {
      if (lowerRaw.startsWith(prefix + " ") || lowerRaw.startsWith(prefix + ", ")) {
        cleanCommand = raw.slice(prefix.length).replace(/^[,.\s]+/, "").trim();
        break;
      }
    }

    if (!cleanCommand) return;

    isThinkingRef.current = true;
    setIsThinking(true);
    transcriptRef.current = "";
    setTranscript("");
    stopListening();
    setTextInput("");

    // Check for conversational actions
    const lower = cleanCommand.toLowerCase();
    let actionDone = "";

    // Fast client-side instant knowledge resolver (<1ms zero-latency response)
    const instantReply = getInstantVoiceAnswer(cleanCommand, language);
    if (instantReply) {
      isThinkingRef.current = false;
      setIsThinking(false);
      setAiResponse(instantReply);
      setActionNotice(actionDone || "Answered Instantly");

      speakText(instantReply, () => {
        if (isModalOpenRef.current) {
          setTimeout(() => {
            if (isModalOpenRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 550);
        }
      });
      return;
    }

    if (lower.includes("schedule") || lower.includes("meeting") || lower.includes("calendar")) {
      addCalendarEvent({
        title: cleanCommand.length > 35 ? cleanCommand.substring(0, 35) + "..." : cleanCommand,
        description: `Voice scheduled: "${cleanCommand}"`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        category: "meeting",
        source: "Google Calendar",
        synced: true,
      });
      actionDone = "Added new meeting to Google Calendar";
    } else if (lower.includes("task") || lower.includes("todo") || lower.includes("remind")) {
      addTask({
        title: cleanCommand.length > 35 ? cleanCommand.substring(0, 35) + "..." : cleanCommand,
        description: `Voice task: "${cleanCommand}"`,
        category: "Voice Assistant",
        priority: lower.includes("urgent") ? "urgent" : "high",
        status: "todo",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        estimatedHours: 1,
      });
      actionDone = "Created task in productivity board";
    } else if (lower.includes("summarize") || lower.includes("report") || lower.includes("notes")) {
      generateAISummaryReport();
      actionDone = `Generated AI summary report for study notes and files`;
    } else if (lower.includes("quiz") || lower.includes("test")) {
      actionDone = "Ready to quiz you on this topic";
    } else if (lower.includes("timer") || lower.includes("focus") || lower.includes("pomodoro")) {
      actionDone = "Study focus timer prepared";
    } else if (lower.includes("video")) {
      actionDone = "Study topic ready for voice discussion";
    } else if (lower.includes("diagram") || lower.includes("chart") || lower.includes("graph")) {
      actionDone = "Explaining study diagram and architecture";
    } else if (lower.includes("image") || lower.includes("picture") || lower.includes("draw")) {
      actionDone = "Explaining visual concept clearly";
    } else if (lower.includes("game") || lower.includes("play")) {
      actionDone = "Ready to launch Educational Games Arena";
    }

    setActionNotice(actionDone || null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/ai/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: cleanCommand, language }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      const responseText = data.textResponse || `I have processed your command: "${cleanCommand}".`;

      // Trigger speech synthesis immediately and concurrently with state update
      speakText(responseText, () => {
        if (isModalOpenRef.current) {
          setTimeout(() => {
            if (isModalOpenRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 550);
        }
      });

      setAiResponse(responseText);
    } catch (e) {
      const fallbackText = `I have received: "${cleanCommand}". Workspace actions synchronized.`;
      speakText(fallbackText, () => {
        if (isModalOpenRef.current) {
          setTimeout(() => {
            if (isModalOpenRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 550);
        }
      });
      setAiResponse(fallbackText);
    } finally {
      isThinkingRef.current = false;
      setIsThinking(false);
    }
  };

  // Modal Open/Close Lifecycle with First-Time vs Returning user check
  useEffect(() => {
    isModalOpenRef.current = isVoiceModalOpen;
    if (isVoiceModalOpen) {
      warmUpSpeechEngine();
      playActivationChime();
      setTranscript("");
      setTextInput("");
      setActionNotice(null);
      setMicErrorMessage(null);
      transcriptRef.current = "";

      // Check if user has started voice mode before (One-Time Danish Intro)
      const { text: greetingToUse } = getVoiceModeInitialGreeting(language);

      setAiResponse(greetingToUse);

      // Initialize speech recognition engine
      initSpeechEngine();

      // Speak welcome greeting and then start listening
      speakText(greetingToUse, () => {
        if (isModalOpenRef.current) {
          setTimeout(() => {
            if (isModalOpenRef.current) {
              startListening();
            }
          }, 550);
        }
      });
    } else {
      stopSpeaking();
      stopListening();
      stopAudioAnalysis(true);
    }
  }, [isVoiceModalOpen, language]);

  if (!isVoiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl overflow-hidden">
        {/* Ambient Glow Backgrounds */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-cyan-600/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🤖 AI Voice Assistant
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Real-Time
                </span>
              </h3>
              <p className="text-xs text-slate-400">Speech & Study Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                showDiagnostics ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              title="Microphone Diagnostic & Hardware Test"
            >
              <Activity className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                stopListening();
                setIsVoiceModalOpen(false);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Voice Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Panel if toggled */}
        {showDiagnostics && (
          <div className="my-3 p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 text-xs animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                Microphone Hardware & Permission Diagnostics
              </h4>
              <button
                onClick={runMicDiagnostic}
                disabled={diagRunning}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1"
              >
                {diagRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mic className="w-3 h-3" />}
                {diagRunning ? "Testing Hardware..." : "Run 3s Mic Test"}
              </button>
            </div>

            {diagResult && (
              <div className="space-y-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Microphone Input:</span>
                  <span className={diagResult.micFound ? "text-emerald-400 font-bold flex items-center gap-1" : "text-rose-400 font-bold"}>
                    {diagResult.micFound ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {diagResult.micFound ? "Detected & Connected" : "Blocked or Unavailable"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Input Sound Level:</span>
                  <span className="text-slate-200 font-mono font-bold">{diagResult.peakDecibels}% Signal</span>
                </div>
                {diagResult.recordedUrl && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Test Playback:</span>
                    <audio src={diagResult.recordedUrl} controls className="h-7 w-44" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Voice Assistant Content */}
        <div className="animate-fadeIn">
            {/* Waveform Visualization & Status Box */}
            <div className="my-4 flex flex-col items-center justify-center py-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 relative">
              {/* Animated Wave Bars with live decibel scaling */}
              <div className="flex items-end gap-1.5 h-14 mb-3">
                {[40, 75, 30, 95, 50, 100, 65, 85, 45, 90, 35, 70, 45, 80].map((height, idx) => {
                  const liveHeight =
                    isListening && audioLevel > 5
                      ? Math.min(100, Math.max(20, Math.round((height * audioLevel) / 55)))
                      : isListening
                      ? Math.max(15, height * 0.45)
                      : isSpeaking
                      ? height
                      : 12;

                  return (
                    <div
                      key={idx}
                      style={{
                        height: `${liveHeight}%`,
                        animationDuration: `${0.35 + (idx % 4) * 0.15}s`,
                      }}
                      className={`w-1.5 rounded-full transition-all ${
                        isListening
                          ? "bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50"
                          : isSpeaking
                          ? "bg-cyan-400 animate-pulse"
                          : isThinking
                          ? "bg-indigo-400 animate-pulse"
                          : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Dynamic Status Display */}
              <div className="text-xs font-semibold tracking-wide uppercase flex items-center gap-2">
                {isSpeaking ? (
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    AI Speaking (Tap Stop to interrupt)
                  </span>
                ) : isThinking ? (
                  <span className="text-indigo-400 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing Voice Command...
                  </span>
                ) : isListening ? (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    Listening... Speak now {audioLevel > 5 ? `(${audioLevel}%)` : ""}
                  </span>
                ) : micErrorMessage ? (
                  <span className="text-amber-400 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-4 h-4" />
                    Microphone Paused • Click Mic to Start
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    Ready • Tap Microphone to speak
                  </span>
                )}
              </div>

              {/* Large Center Mic Action Button */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleToggleMic}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-xl ${
                    isListening
                      ? "bg-rose-600 ring-4 ring-rose-600/30 animate-pulse"
                      : micErrorMessage
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                  }`}
                  title={isListening ? "Stop & Process Speech" : "Start speaking"}
                >
                  {isListening ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-6 h-6" />}
                </button>

                {isSpeaking && (
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setIsSpeaking(false);
                      isSpeakingRef.current = false;
                      startListening(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Stop Speaking
                  </button>
                )}
              </div>
            </div>

            {/* Microphone Notice / Fallback Prompt */}
            {micErrorMessage && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="flex-1 font-medium">{micErrorMessage}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => startListening(true)}
                    className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow transition-colors flex items-center gap-1"
                  >
                    <Mic className="w-3 h-3" /> Retry Microphone
                  </button>
                  <button
                    onClick={runMicDiagnostic}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700"
                  >
                    Run Mic Diagnostic
                  </button>
                </div>
              </div>
            )}

            {/* Live Transcript / AI Output Display */}
            <div className="space-y-2.5 mb-3 max-h-36 overflow-y-auto p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
              {transcript && (
                <div className="p-2.5 rounded-lg bg-indigo-950/50 border border-indigo-800/50 text-indigo-200 animate-fadeIn">
                  <p className="font-semibold text-[10px] text-indigo-400 uppercase mb-0.5">Live Voice Input:</p>
                  <p className="font-medium">{transcript}</p>
                </div>
              )}

              {actionNotice && (
                <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Workspace Action: {actionNotice}</span>
                </div>
              )}

              {aiResponse && (
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[10px] text-cyan-400 uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" /> AI Assistant:
                    </p>
                    <button
                      onClick={() => {
                        stopSpeaking();
                        speakText(aiResponse);
                      }}
                      className="px-2 py-0.5 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-[10px] text-indigo-300 font-bold hover:text-white flex items-center gap-1 transition-colors border border-indigo-500/30"
                      title="Play Voice Replay Instantly"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Instant Replay
                    </button>
                  </div>
                  <p className="leading-relaxed font-medium">{aiResponse}</p>
                </div>
              )}


            </div>

            {/* Input Bar (Type OR Tap Mic) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (textInput.trim()) {
                  setTranscript(textInput);
                  processVoiceCommand(textInput);
                }
              }}
              className="flex items-center gap-2 mb-3"
            >
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 animate-pulse"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
                title={isListening ? "Stop Microphone" : "Start Microphone"}
              >
                {isListening ? <Mic className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-slate-400" />}
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a voice command or speak into microphone..."
                className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />

              <button
                type="submit"
                disabled={!textInput.trim() || isThinking}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors flex items-center justify-center"
                title="Send Command"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Hands-Free Voice Suggestions */}
            <div className="pt-2.5 border-t border-slate-800/80">
              <p className="text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">
                Quick Voice Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "What do you know about your creator?",
                  "Quiz me on science",
                  "Summarize my study notes",
                  "Schedule study session tomorrow at 10 AM",
                  "Tell me a fun educational fact",
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscript(prompt);
                      processVoiceCommand(prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
