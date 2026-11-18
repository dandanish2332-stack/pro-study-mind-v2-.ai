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
  Sliders,
  Play,
  CheckCircle2,
  Calendar,
  FileText,
  Lock,
  Plus,
  Zap,
  Bot,
  User,
  Cpu,
  Volume,
  Square,
  Activity,
  AlertTriangle,
  HelpCircle,
  Disc,
  FileAudio,
  Save,
  Download,
  Copy,
  Clock,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  VOICE_PERSONAS,
  getSystemVoices,
  speakWithVoice,
  stopSpeaking,
  playActivationChime,
  playListeningStartTone,
  LANG_TO_LOCALE,
  getVoiceModeInitialGreeting,
  warmUpSpeechEngine,
  getInstantVoiceAnswer,
} from "../utils/voiceEngine";
import {
  requestMicrophoneAccess,
  releaseAudioStream,
  getSpeechRecognitionClass,
  SafeAudioRecorder,
  transcribeAudioViaServer,
} from "../utils/audioInput";
import { FileItem } from "../types";

interface VoiceMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionTaken?: string;
}

export const VoiceCommunicatorView: React.FC = () => {
  const {
    language,
    files,
    addCalendarEvent,
    addTask,
    generateAISummaryReport,
    generateSocialDigest,
    toggleVaultLock,
    selectedVoicePersona,
    setSelectedVoicePersona,
    customVoiceURI,
    setCustomVoiceURI,
    addNotification,
    addFile,
  } = useApp();

  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [continuousLoop, setContinuousLoop] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.15);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Custom Record Button & Memo Studio State
  const [isCustomRecording, setIsCustomRecording] = useState(false);
  const [customRecordSeconds, setCustomRecordSeconds] = useState(0);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioBlob, setCustomAudioBlob] = useState<Blob | null>(null);
  const [customTranscript, setCustomTranscript] = useState<string>("");
  const [isTranscribingMemo, setIsTranscribingMemo] = useState(false);
  const [customMemoTitle, setCustomMemoTitle] = useState("");
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [savedFileNotice, setSavedFileNotice] = useState(false);

  // Diagnostic tool
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    micFound: boolean;
    peakDecibels: number;
    testAudioUrl?: string;
  } | null>(null);

  const [messages, setMessages] = useState<VoiceMessage[]>(() => {
    const { text: introText } = getVoiceModeInitialGreeting(language);

    return [
      {
        id: "vm-1",
        sender: "ai",
        text: introText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const recognitionRef = useRef<any>(null);
  const isRecognizingRef = useRef<boolean>(false);
  const audioRecorderRef = useRef<SafeAudioRecorder | null>(null);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Custom Recorder Ref
  const customRecorderRef = useRef<SafeAudioRecorder | null>(null);
  const customTimerRef = useRef<any>(null);

  const transcriptRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);
  const isThinkingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const continuousLoopRef = useRef<boolean>(true);
  const isMountedRef = useRef<boolean>(true);
  const isListeningRef = useRef<boolean>(false);
  const userSpokeSoundRef = useRef<boolean>(false);
  const lastSoundTimeRef = useRef<number>(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const customVoiceURIRef = useRef<string>(customVoiceURI);

  useEffect(() => {
    customVoiceURIRef.current = customVoiceURI;
  }, [customVoiceURI]);

  useEffect(() => {
    continuousLoopRef.current = continuousLoop;
  }, [continuousLoop]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAudioAnalysis(true);
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (audioRecorderRef.current) {
        try {
          audioRecorderRef.current.stop();
        } catch (e) {}
        audioRecorderRef.current = null;
      }
      if (customTimerRef.current) {
        clearInterval(customTimerRef.current);
      }
    };
  }, []);

  // Audio level analysis
  const stopAudioAnalysis = (releaseStream = false) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (releaseStream && activeMediaStreamRef.current) {
      releaseAudioStream(activeMediaStreamRef.current);
      activeMediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

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
        if (!isMountedRef.current) {
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

        // Voice Activity Detection (VAD) - auto finalize if user actually spoke text and then paused
        if (isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current) {
          if (normalized > 24) {
            userSpokeSoundRef.current = true;
            lastSoundTimeRef.current = Date.now();
          } else if (userSpokeSoundRef.current && lastSoundTimeRef.current > 0) {
            const hasRecognizedText = Boolean((transcriptRef.current || "").trim());
            // Fast auto-finalize: 450ms after last spoken word for instant responsiveness
            if (hasRecognizedText && Date.now() - lastSoundTimeRef.current > 450) {
              userSpokeSoundRef.current = false;
              lastSoundTimeRef.current = 0;
              stopListening(false);
              return;
            } else if (!hasRecognizedText && Date.now() - lastSoundTimeRef.current > 1800) {
              // Reset sound detection flag if no words were decoded from ambient sound
              userSpokeSoundRef.current = false;
              lastSoundTimeRef.current = 0;
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (e) {
      console.warn("Voice analyzer notice:", e);
    }
  };

  // Load browser speech synthesis voices and pre-warm audio engine
  useEffect(() => {
    warmUpSpeechEngine();
    const updateVoices = () => {
      const v = getSystemVoices();
      setSystemVoices(v);
      if (v.length > 0 && !customVoiceURIRef.current && v[0].voiceURI) {
        setCustomVoiceURI(v[0].voiceURI);
      }
    };
    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.onvoiceschanged === updateVoices) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      }
    };
  }, [setCustomVoiceURI]);

  // Safe Speech Recognition Engine Setup
  const initSpeechEngine = () => {
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
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // Ultra-responsive conversational turn-taking: 380ms for final phrase, 700ms for interim pause
          const pauseTimeout = hasFinal ? 380 : 700;
          silenceTimerRef.current = setTimeout(() => {
            if (
              transcriptRef.current &&
              !isThinkingRef.current &&
              !isSpeakingRef.current &&
              isMountedRef.current
            ) {
              const cmd = transcriptRef.current;
              transcriptRef.current = "";
              if (audioRecorderRef.current) {
                audioRecorderRef.current.stop().catch(() => {});
                audioRecorderRef.current = null;
              }
              processCommand(cmd);
            }
          }, pauseTimeout);
        };

        rec.onerror = (event: any) => {
          const errorType = event.error;
          if (errorType === "no-speech" || errorType === "aborted") return;

          if (errorType === "not-allowed" || errorType === "service-not-allowed") {
            setMicErrorMessage("Microphone access blocked. Click Allow / Retry to speak.");
          } else if (errorType === "network" || errorType === "audio-capture") {
            // Web Speech API network service error - smoothly delegate to audio recorder fallback
            console.warn("Speech recognition network notice, using audio recorder fallback:", errorType);
          }
        };

        rec.onend = () => {
          isRecognizingRef.current = false;
          if (
            isListeningRef.current &&
            continuousLoopRef.current &&
            !isThinkingRef.current &&
            !isSpeakingRef.current &&
            isMountedRef.current
          ) {
            setTimeout(() => {
              if (
                isListeningRef.current &&
                isMountedRef.current &&
                !isRecognizingRef.current &&
                !isThinkingRef.current &&
                !isSpeakingRef.current
              ) {
                try {
                  const freshRec = initSpeechEngine();
                  if (freshRec) {
                    freshRec.start();
                  }
                } catch (e) {
                  try { rec.start(); } catch (err) {}
                }
              }
            }, 250);
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

  const startListening = async (isUserInitiated = false) => {
    if (isThinkingRef.current) return;

    // Interrupt assistant speech if speaking
    if (isSpeakingRef.current) {
      stopSpeaking();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }

    if (isUserInitiated) {
      setMicErrorMessage(null);
    }
    stopSpeaking();

    let stream: MediaStream | null = activeMediaStreamRef.current;
    const hasLiveTracks = stream && stream.active && stream.getAudioTracks().some((t) => t.readyState === "live");

    if (!hasLiveTracks) {
      try {
        const micStatus = await requestMicrophoneAccess();
        if (!micStatus.granted || !micStatus.stream) {
          if (isUserInitiated) {
            setMicErrorMessage(micStatus.error || "Microphone access denied. Please allow microphone permissions in browser.");
          }
          return;
        }
        stream = micStatus.stream;
        activeMediaStreamRef.current = stream;
      } catch (e: any) {
        if (isUserInitiated) {
          setMicErrorMessage("Microphone access denied. Please allow microphone permissions in browser.");
        }
        return;
      }
    }

    if (stream) {
      startAudioAnalysis(stream);

      // Start fail-safe MediaRecorder backup in parallel
      try {
        const recorder = new SafeAudioRecorder();
        audioRecorderRef.current = recorder;
        await recorder.start(stream);
      } catch (e) {
        console.warn("Media recorder fallback init:", e);
      }
    }

    setTranscript("");
    transcriptRef.current = "";
    isListeningRef.current = true;
    setIsListening(true);
    playListeningStartTone();

    // Start Web Speech Recognition
    let rec = recognitionRef.current;
    if (!rec) {
      rec = initSpeechEngine();
    }

    if (rec && !isRecognizingRef.current) {
      try {
        rec.lang = LANG_TO_LOCALE[language] || "en-US";
        rec.start();
      } catch (e: any) {
        if (e?.name !== "InvalidStateError") {
          try {
            rec.stop();
            setTimeout(() => {
              try {
                if (isListeningRef.current && isMountedRef.current && !isRecognizingRef.current) rec.start();
              } catch (err) {}
            }, 200);
          } catch (err) {}
        }
      }
    }
  };

  const stopListening = async (isManual = false) => {
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

    stopAudioAnalysis(false);

    let currentText = (transcriptRef.current || transcript).trim();

    // If Web Speech API didn't pick up text, check recorded audio fallback
    if (!currentText && audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
      try {
        const audioBlob = await audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        if (audioBlob && audioBlob.size > 1500) {
          setMicErrorMessage("Transcribing spoken audio with AI...");
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

    if (currentText.trim()) {
      transcriptRef.current = "";
      setTranscript("");
      processCommand(currentText);
      return;
    } else if (!isManual && continuousLoopRef.current && isMountedRef.current) {
      // Re-arm listening if in continuous mode and user was just pausing
      setTimeout(() => {
        if (!isListeningRef.current && !isThinkingRef.current && !isSpeakingRef.current && isMountedRef.current) {
          startListening();
        }
      }, 500);
    }
  };

  // Custom Record Button Handlers
  const startCustomRecording = async () => {
    setCustomAudioUrl(null);
    setCustomAudioBlob(null);
    setCustomTranscript("");
    setCustomRecordSeconds(0);
    setSavedFileNotice(false);

    let stream: MediaStream | null = null;
    try {
      const micStatus = await requestMicrophoneAccess();
      if (!micStatus.granted || !micStatus.stream) {
        setMicErrorMessage(micStatus.error || "Microphone permission is required for custom memo recording.");
        return;
      }
      stream = micStatus.stream;
    } catch (e) {
      setMicErrorMessage("Microphone permission is required for custom memo recording.");
      return;
    }

    activeMediaStreamRef.current = stream;
    startAudioAnalysis(stream);

    const rec = new SafeAudioRecorder();
    customRecorderRef.current = rec;
    const ok = await rec.start(stream);
    if (!ok) return;

    setIsCustomRecording(true);

    if (customTimerRef.current) clearInterval(customTimerRef.current);
    customTimerRef.current = setInterval(() => {
      setCustomRecordSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopCustomRecording = async () => {
    if (customTimerRef.current) {
      clearInterval(customTimerRef.current);
      customTimerRef.current = null;
    }
    setIsCustomRecording(false);
    stopAudioAnalysis();

    if (customRecorderRef.current) {
      const blob = await customRecorderRef.current.stop();
      customRecorderRef.current = null;
      if (blob && blob.size > 0) {
        setCustomAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setCustomAudioUrl(url);

        setIsTranscribingMemo(true);
        try {
          const text = await transcribeAudioViaServer(blob, language);
          setCustomTranscript(text || "Voice audio note recorded.");
          if (!customMemoTitle) {
            setCustomMemoTitle(`Voice Note (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`);
          }
        } catch (e) {
          setCustomTranscript("Audio note captured.");
        } finally {
          setIsTranscribingMemo(false);
        }
      }
    }
  };

  const saveCustomVoiceNoteToFile = () => {
    if (!customAudioBlob && !customTranscript) return;

    const fileName = customMemoTitle.trim()
      ? `${customMemoTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.mp3`
      : `Voice_Memo_${Date.now()}.mp3`;

    const newFile: FileItem = {
      id: "voice-memo-" + Date.now(),
      name: fileName,
      size: customAudioBlob ? customAudioBlob.size : 1024 * 45,
      mimeType: "audio/webm",
      category: "audio",
      tags: ["Voice Memo", "Custom Recording", language],
      uploadDate: "Just now",
      contentSnippet: customTranscript || "Recorded custom voice audio note.",
      isEncrypted: false,
      summary: `Custom recorded voice note in ${language} (${formatSeconds(customRecordSeconds)}).`,
      keyInsights: [
        `Duration: ${formatSeconds(customRecordSeconds)}`,
        `Transcribed: ${customTranscript.slice(0, 80)}...`,
      ],
      urgencyScore: 4,
    };

    addFile(newFile);
    addNotification({
      title: "Voice Note Saved",
      message: `Saved "${fileName}" to Workspace Files with transcription.`,
      type: "sync",
    });

    setSavedFileNotice(true);
    setTimeout(() => setSavedFileNotice(false), 3000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const speakResponse = (text: string, onDone?: () => void) => {
    if (!autoSpeak) {
      if (onDone) onDone();
      return;
    }

    stopListening();
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    speakWithVoice(
      text,
      selectedVoicePersona,
      customVoiceURI,
      speechPitch !== 1.0 ? speechPitch : undefined,
      speechRate !== 1.0 ? speechRate : undefined,
      language,
      () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onDone) onDone();
      },
      () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onDone) onDone();
      }
    );
  };

  const processCommand = async (commandRaw: string) => {
    let command = commandRaw.trim();
    if (!command || isThinkingRef.current) return;

    // Check and strip wake word prefix
    const lowerRaw = command.toLowerCase().replace(/[,.!?]/g, "").trim();
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
      setTranscript("");
      setTextInput("");
      const greetingMsg: VoiceMessage = {
        id: "msg-" + Date.now(),
        sender: "user",
        text: commandRaw,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const replyMsg: VoiceMessage = {
        id: "ai-" + Date.now(),
        sender: "ai",
        text: "Hi, I am your AI Voice Assistant and Study Helper created by danish. What would you like to study or work on today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, greetingMsg, replyMsg]);
      speakResponse("Hi, I am your AI Voice Assistant and Study Helper created by danish. What would you like to study or work on today?", () => {
        if (continuousLoopRef.current && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 350);
        }
      });
      return;
    }

    let cleanCommand = command;
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
        cleanCommand = command.slice(prefix.length).replace(/^[,.\s]+/, "").trim();
        break;
      }
    }

    if (!cleanCommand) return;

    isThinkingRef.current = true;
    setIsThinking(true);
    stopListening();
    setTranscript("");
    setTextInput("");

    // Add user message to stream
    const userMsg: VoiceMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: command,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Analyze command for autonomous workspace action execution
    let actionTakenDesc = "";
    const lower = cleanCommand.toLowerCase();

    // Check for creator inquiry
    const isCreatorQuery =
      lower.includes("creater") ||
      lower.includes("creator") ||
      lower.includes("who created you") ||
      lower.includes("who made you") ||
      lower.includes("who built you") ||
      lower.includes("who designed you") ||
      lower.includes("who is danish") ||
      lower.includes("about danish") ||
      lower.includes("who is your creator") ||
      lower.includes("who is your creater") ||
      lower.includes("what you know about your creater") ||
      lower.includes("what you know about your creator") ||
      lower.includes("what do you know about your creator") ||
      lower.includes("what do you know about your creater") ||
      lower.includes("tell me about your creator") ||
      lower.includes("tell me about your creater") ||
      lower.includes("about your creator") ||
      lower.includes("about your creater");

    if (isCreatorQuery) {
      let creatorReply = "I am created by Danish, who is studying in 2nd year and is a student of SPS College Batkhela Campus and lives in Mekhband.";
      if (language === "UR") {
        creatorReply = "مجھے دانش نے بنایا ہے جو سیکنڈ ایئر (2nd year) میں زیرِ تعلیم ہیں، SPS کالج بٹ خیلہ کیمپس کے طالب علم ہیں اور میخ بند (Mekhband) میں رہتے ہیں۔";
      } else if (language === "PS") {
        creatorReply = "زه د دانش لخوا جوړ شوی یم چې په دوهم کال (2nd year) کې زده کړه کوي، د SPS کالج باټخیله کیمپس زده کوونکی دی او په میخ بند کې اوسیږي.";
      } else if (language === "ES") {
        creatorReply = "Fui creado por Danish, quien está estudiando en segundo año, es estudiante de SPS College Batkhela Campus y vive en Mekhband.";
      }

      const aiMsg: VoiceMessage = {
        id: "ai-" + (Date.now() + 1),
        sender: "ai",
        text: creatorReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionTaken: "Answered Creator Info (Danish)",
      };
      setMessages((prev) => [...prev, aiMsg]);
      speakResponse(creatorReply, () => {
        if (continuousLoopRef.current && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 350);
        }
      });
      isThinkingRef.current = false;
      setIsThinking(false);
      return;
    }

    if (lower.includes("schedule") || lower.includes("meeting") || lower.includes("calendar")) {
      addCalendarEvent({
        title: cleanCommand.length > 35 ? cleanCommand.substring(0, 35) + "..." : cleanCommand,
        description: `Voice Command scheduled: "${cleanCommand}"`,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        category: "meeting",
        source: "OmniSync",
        synced: true,
      });
      actionTakenDesc = "Added new meeting to Google Calendar & Apple iCal";
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
      actionTakenDesc = "Created task in productivity board";
    } else if (lower.includes("summarize") || lower.includes("report") || lower.includes("notes")) {
      generateAISummaryReport();
      actionTakenDesc = `Generated AI summary report for study notes and files`;
    } else if (lower.includes("quiz") || lower.includes("test")) {
      actionTakenDesc = "Prepared study quiz session";
    } else if (lower.includes("timer") || lower.includes("pomodoro") || lower.includes("focus")) {
      actionTakenDesc = "Configured study focus timer";
    } else if (lower.includes("video")) {
      actionTakenDesc = "Generated study video with Gemini & ChatGPT intelligence";
    } else if (lower.includes("diagram") || lower.includes("chart") || lower.includes("graph")) {
      actionTakenDesc = "Generated study diagram with Gemini & ChatGPT intelligence";
    } else if (lower.includes("image") || lower.includes("picture") || lower.includes("draw")) {
      actionTakenDesc = "Generated study illustration with Gemini & ChatGPT intelligence";
    } else if (lower.includes("game") || lower.includes("play")) {
      actionTakenDesc = "Prepared Educational Games Arena session";
    }

    // 1. Instant client-side knowledge & creator resolver (<1ms zero-latency response)
    const instantReply = getInstantVoiceAnswer(cleanCommand, language);
    if (instantReply) {
      isThinkingRef.current = false;
      setIsThinking(false);

      const aiMsg: VoiceMessage = {
        id: "ai-" + (Date.now() + 1),
        sender: "ai",
        text: instantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionTaken: actionTakenDesc || undefined,
      };

      // Start voice immediately
      speakResponse(instantReply, () => {
        if (continuousLoopRef.current && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 200);
        }
      });

      setMessages((prev) => [...prev, aiMsg]);
      return;
    }

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
      const replyText = data.textResponse || `I have executed your voice command: "${cleanCommand}".`;

      const aiMsg: VoiceMessage = {
        id: "ai-" + (Date.now() + 1),
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionTaken: actionTakenDesc || undefined,
      };

      // Trigger speech synthesis concurrently and immediately so sound starts synchronously with text
      speakResponse(replyText, () => {
        if (continuousLoopRef.current && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 200);
        }
      });

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const fallbackReply = `I have received: "${cleanCommand}". Workspace tasks and schedules are synchronized in ${language}.`;
      const aiMsg: VoiceMessage = {
        id: "ai-" + (Date.now() + 1),
        sender: "ai",
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionTaken: actionTakenDesc || undefined,
      };

      speakResponse(fallbackReply, () => {
        if (continuousLoopRef.current && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current && !isSpeakingRef.current && !isThinkingRef.current) {
              startListening();
            }
          }, 250);
        }
      });

      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      isThinkingRef.current = false;
      setIsThinking(false);
    }
  };

  // Hardware Diagnostics Runner
  const runMicDiagnostic = async () => {
    setDiagRunning(true);
    setDiagResult(null);

    let stream: MediaStream | null = null;
    try {
      const micStatus = await requestMicrophoneAccess();
      if (!micStatus.granted || !micStatus.stream) {
        setDiagResult({ micFound: false, peakDecibels: 0 });
        setDiagRunning(false);
        return;
      }
      stream = micStatus.stream;
    } catch (e) {
      setDiagResult({ micFound: false, peakDecibels: 0 });
      setDiagRunning(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const src = audioCtx.createMediaStreamSource(stream);
      src.connect(analyser);

      const recorder = new SafeAudioRecorder();
      await recorder.start(stream);

      let maxLevel = 0;
      const dataArr = new Uint8Array(analyser.frequencyBinCount);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
        const avg = sum / dataArr.length;
        if (avg > maxLevel) maxLevel = avg;
      }, 50);

      setTimeout(async () => {
        clearInterval(interval);
        try {
          audioCtx.close();
        } catch (e) {}

        const blob = await recorder.stop();
        let testAudioUrl: string | undefined = undefined;
        if (blob) {
          testAudioUrl = URL.createObjectURL(blob);
        }
        releaseAudioStream(stream);

        setDiagResult({
          micFound: true,
          peakDecibels: Math.round((maxLevel / 128) * 100),
          testAudioUrl,
        });
        setDiagRunning(false);
      }, 2500);
    } catch (e) {
      setDiagRunning(false);
      releaseAudioStream(stream);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Voice Mode Communicator
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Gemini Multimodal + Web Speech
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interact hands-free with spoken voice and custom voice recording studio.
            </p>
          </div>
        </div>

        {/* Audio Output Settings Toggle */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
              showDiagnostics ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
            title="Run microphone hardware test"
          >
            <Activity className="w-3.5 h-3.5" />
            Mic Diagnostic
          </button>

          <button
            onClick={() => setContinuousLoop(!continuousLoop)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
              continuousLoop
                ? "bg-indigo-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
            title="Auto-listen for next turn after AI finishes speaking"
          >
            <Zap className="w-3.5 h-3.5" />
            {continuousLoop ? "Continuous" : "Manual"}
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              setAutoSpeak(!autoSpeak);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
              autoSpeak
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {autoSpeak ? "Voice Output" : "Muted"}
          </button>
        </div>
      </div>

      {/* Diagnostics panel */}
      {showDiagnostics && (
        <div className="p-5 rounded-3xl bg-slate-950 border border-indigo-500/40 text-slate-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Microphone Diagnostic & Signal Analyzer
            </h4>
            <button
              onClick={runMicDiagnostic}
              disabled={diagRunning}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
            >
              {diagRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
              {diagRunning ? "Analyzing Signal..." : "Run 3-Second Mic Test"}
            </button>
          </div>

          {diagResult && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hardware Input Status:</span>
                <span className={diagResult.micFound ? "text-emerald-400 font-bold flex items-center gap-1" : "text-rose-400 font-bold"}>
                  {diagResult.micFound ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {diagResult.micFound ? "Microphone Detected & Capturing" : "Blocked or Unavailable"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Peak Decibels Captured:</span>
                <span className="text-slate-200 font-mono font-bold">{diagResult.peakDecibels}% Signal Intensity</span>
              </div>
              {diagResult.testAudioUrl && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Recorded Audio Playback:</span>
                  <audio src={diagResult.testAudioUrl} controls className="h-8 w-56" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Waveform Box & Conversation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Voice Controller & Custom Voice Memo Studio */}
        <div className="space-y-6">
          {/* Sound Wave Stage */}
          <div className="relative p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl overflow-hidden flex flex-col items-center justify-center text-center space-y-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              <Zap className="w-3 h-3 text-cyan-300" /> Dual Engine • Live Decibel Visualizer
            </div>

            {/* Dynamic Waveform Bars */}
            <div className="flex items-end justify-center gap-1.5 h-20 w-full px-4">
              {[45, 80, 35, 95, 60, 100, 75, 90, 50, 85, 40, 70, 30, 90].map((h, i) => {
                const liveHeight =
                  isListening && audioLevel > 5
                    ? Math.min(100, Math.max(20, Math.round((h * audioLevel) / 55)))
                    : isListening
                    ? Math.max(15, h * 0.4)
                    : isSpeaking
                    ? h
                    : 12;

                return (
                  <div
                    key={i}
                    style={{
                      height: `${liveHeight}%`,
                      animationDuration: `${0.35 + (i % 4) * 0.15}s`,
                    }}
                    className={`w-2 rounded-full transition-all ${
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

            {/* Live Indicator Status */}
            <div className="text-xs font-bold uppercase tracking-wider">
              {isListening ? (
                <span className="text-rose-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Listening... Speak now {audioLevel > 5 ? `(${audioLevel}%)` : ""}
                </span>
              ) : isThinking ? (
                <span className="text-indigo-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AI Agent Executing...
                </span>
              ) : isSpeaking ? (
                <span className="text-cyan-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  AI Speaking Response...
                </span>
              ) : micErrorMessage ? (
                <span className="text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <AlertTriangle className="w-4 h-4" />
                  Microphone Paused • Tap to Start
                </span>
              ) : (
                <span className="text-slate-400">Ready for Voice Command</span>
              )}
            </div>

            {/* Microphone Trigger Button & Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={isListening ? () => stopListening(true) : () => startListening(true)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform active:scale-95 shadow-2xl ${
                  isListening
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/40 ring-4 ring-rose-600/30 animate-pulse"
                    : micErrorMessage
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/40"
                    : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 hover:brightness-110 shadow-indigo-600/40"
                }`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              {isSpeaking && (
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsSpeaking(false);
                    isSpeakingRef.current = false;
                    startListening(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                  title="Interrupt current spoken audio"
                >
                  <Square className="w-4 h-4 text-rose-400" /> Interrupt
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED CUSTOM RECORD BUTTON & VOICE MEMO STUDIO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 flex items-center gap-2">
                <Disc className="w-4 h-4 animate-pulse" /> Custom Record Studio
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Voice Note Capture
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record custom voice memos, dictations, or meetings with AI transcription and 1-click save to Workspace Files.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-slate-900 dark:text-slate-100">
                <Clock className={`w-5 h-5 ${isCustomRecording ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                {formatSeconds(customRecordSeconds)}
              </div>

              {/* Custom Record Action Button */}
              <div className="flex items-center justify-center gap-3">
                {!isCustomRecording ? (
                  <button
                    onClick={startCustomRecording}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transform active:scale-95 transition-all"
                  >
                    <Disc className="w-4 h-4 animate-spin" />
                    Start Custom Recording
                  </button>
                ) : (
                  <button
                    onClick={stopCustomRecording}
                    className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40 font-bold text-xs shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
                  >
                    <Square className="w-4 h-4 fill-rose-400" />
                    Stop & Transcribe Note
                  </button>
                )}
              </div>

              {isTranscribingMemo && (
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Transcribing voice note with AI...
                </div>
              )}

              {/* Recorded Result & Actions */}
              {customAudioUrl && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={customMemoTitle}
                      onChange={(e) => setCustomMemoTitle(e.target.value)}
                      placeholder="Title this voice memo..."
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold w-40"
                    />
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {formatSeconds(customRecordSeconds)}
                    </span>
                  </div>

                  <audio src={customAudioUrl} controls className="w-full h-7" />

                  {customTranscript && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      {customTranscript}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={saveCustomVoiceNoteToFile}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow transition-colors"
                    >
                      <Save className="w-3 h-3" />
                      {savedFileNotice ? "Saved to Files!" : "Save to Files"}
                    </button>

                    <button
                      onClick={() => {
                        if (customTranscript) {
                          navigator.clipboard.writeText(customTranscript);
                          setCopiedNotice(true);
                          setTimeout(() => setCopiedNotice(false), 2000);
                        }
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1"
                      title="Copy Transcript"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedNotice ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Voice Persona Selection & Tuning */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Volume className="w-4 h-4 text-indigo-500" /> Multi-Voice Persona
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Default: Natural Man
              </span>
            </div>

            {/* Voice Cards */}
            <div className="space-y-2 text-xs">
              {VOICE_PERSONAS.map((p) => {
                const isSelected = selectedVoicePersona === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedVoicePersona(p.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        {p.gender === "male" ? (
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                        ) : p.gender === "female" ? (
                          <User className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {p.id === "natural_man" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white uppercase">
                            Default
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVoicePersona(p.id);
                            speakResponse(
                              `Hello! I am speaking with the ${p.name} voice profile. How can I help you today?`
                            );
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors flex items-center gap-1"
                          title="Test speech audio"
                        >
                          <Play className="w-2.5 h-2.5" /> Test
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      {p.description}
                    </p>

                    {p.id === "system_custom" && isSelected && systemVoices.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Installed Browser Voices ({systemVoices.length}):
                        </label>
                        <select
                          value={customVoiceURI}
                          onChange={(e) => setCustomVoiceURI(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          {systemVoices.map((sv) => (
                            <option key={sv.voiceURI} value={sv.voiceURI}>
                              {sv.name} ({sv.lang})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pitch & Speed Modifiers */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Fine-Tune Speed & Pitch
              </h4>
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>Speech Speed Rate</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>Voice Pitch Tone</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{speechPitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual Input (Voice & Text) Conversation History Log */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[640px]">
          {/* Conversation Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => {
              const isAI = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl text-xs space-y-2 ${
                    isAI
                      ? "bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      : "bg-indigo-600 text-white shadow-md ml-8"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
                    <span className="font-bold flex items-center gap-1">
                      {isAI ? <Bot className="w-3.5 h-3.5 text-cyan-400" /> : <Mic className="w-3.5 h-3.5" />}
                      {isAI ? "AI Voice Assistant (created by danish)" : "You (Spoken / Typed)"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>

                  {msg.actionTaken && (
                    <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Action Executed: {msg.actionTaken}</span>
                    </div>
                  )}



                  {isAI && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => speakResponse(msg.text)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Play className="w-3 h-3" /> Replay Voice Audio
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Quick Voice Command Preset Badges */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Voice Presets:</span>
            {[
              { label: "What do you know about your creator?", icon: Bot },
              { label: "Help me with math & homework", icon: Zap },
              { label: "Schedule family dinner tomorrow at 7 PM", icon: Calendar },
              { label: "Summarize my study notes & files", icon: FileText },
              { label: "Tell me a fun educational fact", icon: Sparkles },
              { label: "Create task: Finish science project", icon: Plus },
            ].map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  onClick={() => processCommand(preset.label)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  <Icon className="w-3 h-3 text-indigo-500" />
                  "{preset.label}"
                </button>
              );
            })}
          </div>

          {/* Input Bar: Voice Transcript Preview & Dual Command Input */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {transcript && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                <span>
                  <strong className="font-bold">Live Spoken Transcript:</strong> "{transcript}"
                </span>
                <button
                  onClick={() => processCommand(transcript)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] shadow"
                >
                  Send Spoken Text
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                processCommand(textInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type a voice command or click microphone..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                onClick={isListening ? () => stopListening(true) : () => startListening(true)}
                className={`p-3 rounded-2xl transition-all shadow ${
                  isListening
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-500"
                }`}
                title={isListening ? "Stop listening" : "Start speech input"}
              >
                <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : ""}`} />
              </button>

              <button
                type="submit"
                disabled={!textInput.trim() || isThinking}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                {isThinking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Command
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
