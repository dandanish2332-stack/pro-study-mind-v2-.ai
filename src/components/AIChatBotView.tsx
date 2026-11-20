import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Mic,
  RefreshCw,
  User,
  PlusCircle,
  Paperclip,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Network,
  Video,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { AttachedFile, GeneratedMediaItem } from "../types";
import { stopSpeaking } from "../utils/voiceEngine";
import { AIMediaStudioView } from "./AIMediaStudioView";

export const AIChatBotView: React.FC = () => {
  const {
    chatMessages,
    sendMessageToAI,
    startNewChat,
    setIsVoiceModalOpen,
    language,
    speakBunny,
    platformSettings,
  } = useApp();

  const isAiPaused = platformSettings?.aiTutorEnabled === false;

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [selectedStudioMedia, setSelectedStudioMedia] = useState<GeneratedMediaItem | null>(null);
  const [showStudioModal, setShowStudioModal] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSending]);

  // Handle local storage file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    // Reset file input value so user can re-select same file if needed
    e.target.value = "";
  };

  const processSelectedFile = (file: File) => {
    setFileError(null);

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File is too large. Please select a file under 10MB.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isTextReadable =
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".py") ||
      file.name.endsWith(".java") ||
      file.name.endsWith(".c") ||
      file.name.endsWith(".cpp");

    const reader = new FileReader();

    if (isImage) {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedFile({
          id: "att-" + Date.now(),
          name: file.name,
          size: formatFileSize(file.size),
          mimeType: file.type || "image/png",
          dataUrl,
          contentSnippet: `[Image: ${file.name}, ${formatFileSize(file.size)}]`,
        });
      };
      reader.readAsDataURL(file);
    } else if (isTextReadable) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const snippet = text.length > 500 ? text.substring(0, 500) + "..." : text;
        setAttachedFile({
          id: "att-" + Date.now(),
          name: file.name,
          size: formatFileSize(file.size),
          mimeType: file.type || "text/plain",
          fullText: text,
          contentSnippet: snippet,
        });
      };
      reader.readAsText(file);
    } else {
      // PDF or binary documents
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedFile({
          id: "att-" + Date.now(),
          name: file.name,
          size: formatFileSize(file.size),
          mimeType: file.type || "application/octet-stream",
          dataUrl,
          contentSnippet: `[Attached Document: ${file.name} (${formatFileSize(file.size)})]`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAiPaused) return;
    if ((!inputText.trim() && !attachedFile) || isSending) return;

    const textToSend = inputText.trim() || (attachedFile ? `Please examine this attached file: ${attachedFile.name}` : "");
    const fileToSend = attachedFile || undefined;

    setInputText("");
    setAttachedFile(null);
    setIsSending(true);

    try {
      await sendMessageToAI(textToSend, fileToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              AI Study & Voice Assistant
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Study Helper
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ask questions, attach local study files & notes, generate summaries, or launch voice dialog.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStudioMedia(null);
              setShowStudioModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
            title="Open Image, Diagram & Video Studio"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" /> Media Studio
          </button>

          <button
            onClick={() => startNewChat()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shrink-0"
            title="Start New Chat"
          >
            <PlusCircle className="w-4 h-4 text-indigo-500" /> New Chat
          </button>

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            disabled={isAiPaused}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shrink-0"
          >
            <Mic className="w-4 h-4 animate-pulse" /> Launch Voice Mode
          </button>
        </div>
      </div>

      {isAiPaused && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold">AI Tutor Temporarily Paused by Master Administrator</p>
            <p className="text-[11px] opacity-90">
              Your existing chat history remains readable below. An administrator can re-enable AI Tutor endpoints from Backend & Server Control.
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-sm overflow-hidden flex flex-col h-[600px] relative ${
          isDragging ? "border-indigo-500 ring-4 ring-indigo-500/20" : "border-slate-200 dark:border-slate-800"
        }`}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 bg-indigo-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center animate-fadeIn pointer-events-none">
            <Paperclip className="w-12 h-12 mb-3 animate-bounce" />
            <p className="text-lg font-bold">Drop your file here</p>
            <p className="text-xs text-indigo-200 mt-1">
              Supports documents, notes, code, PDFs, images, and text files from local storage.
            </p>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isAI ? "justify-start" : "justify-end"}`}
              >
                {isAI && (
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    isAI
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700"
                      : "bg-indigo-600 text-white rounded-tr-none shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-mono mb-1">
                    <span className="font-bold">{isAI ? "AI Assistant" : "You"}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Attachment Badge in Message */}
                  {msg.attachment && (
                    <div
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                        isAI
                          ? "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                          : "bg-indigo-700/80 border-indigo-500/60 text-white"
                      }`}
                    >
                      {msg.attachment.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 shrink-0 text-cyan-300" />
                      ) : (
                        <FileText className="w-4 h-4 shrink-0 text-amber-300" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-[11px]">{msg.attachment.name}</p>
                        <p className="text-[10px] opacity-75">{msg.attachment.size}</p>
                      </div>
                      {msg.attachment.dataUrl && msg.attachment.type.startsWith("image/") && (
                        <img
                          src={msg.attachment.dataUrl}
                          alt={msg.attachment.name}
                          className="w-8 h-8 object-cover rounded-lg border border-white/20"
                        />
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* AI Generated Media (Image, Diagram, or Video Storyboard) */}
                  {msg.generatedMedia && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                            {msg.generatedMedia.type}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-300">
                            {msg.generatedMedia.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase">
                          {msg.generatedMedia.provider}
                        </span>
                      </div>

                      {/* Image Preview */}
                      {msg.generatedMedia.type === "image" && msg.generatedMedia.imageUrl && (
                        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                          <img
                            src={msg.generatedMedia.imageUrl}
                            alt={msg.generatedMedia.title}
                            className="w-full max-h-56 object-cover"
                          />
                        </div>
                      )}

                      {/* Diagram Preview */}
                      {msg.generatedMedia.type === "diagram" && msg.generatedMedia.diagramData && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {msg.generatedMedia.diagramData.nodes.slice(0, 4).map((node, nIdx) => (
                              <div
                                key={node.id}
                                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                              >
                                <p className="font-bold text-cyan-300 truncate">{node.label}</p>
                                <p className="text-[10px] text-slate-400 truncate">{node.desc || `Stage 0${nIdx + 1}`}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Storyboard Preview */}
                      {msg.generatedMedia.type === "video" && msg.generatedMedia.videoStoryboard && (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Video className="w-3.5 h-3.5" />
                              Animated Video Storyboard
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {msg.generatedMedia.videoStoryboard.length} Scenes
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 italic">
                            "{msg.generatedMedia.videoStoryboard[0]?.narration}"
                          </p>
                        </div>
                      )}

                      {/* Open Full Studio Button */}
                      <button
                        onClick={() => {
                          setSelectedStudioMedia(msg.generatedMedia || null);
                          setShowStudioModal(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Media Studio (Full Screen & Audio)</span>
                      </button>
                    </div>
                  )}

                  {/* Message Action Bar (Copy & TTS) */}
                  {isAI && (
                    <div className="pt-2 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          if (speakingMsgId === msg.id) {
                            stopSpeaking();
                            setSpeakingMsgId(null);
                          } else {
                            stopSpeaking();
                            setSpeakingMsgId(msg.id);
                            speakBunny(
                              msg.text,
                              () => setSpeakingMsgId(msg.id),
                              () => setSpeakingMsgId(null)
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        title={speakingMsgId === msg.id ? "Stop voice" : "Read aloud with voice"}
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          setCopiedMsgId(msg.id);
                          setTimeout(() => setCopiedMsgId(null), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-700/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Copy message text"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isAI && (
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-200 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-start gap-3 justify-start animate-fadeIn">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-1">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">AI Assistant</span>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Study Prompts:</span>
          {[
            attachedFile ? "Summarize this attached file into key takeaways" : "Create a 5-question study quiz on photosynthesis",
            attachedFile ? "Generate 3 quiz questions based on this file" : "Explain how binary search algorithms work step-by-step",
            "Give me 5 memory flashcard ideas for exams",
            "Help me plan a 45-minute focused study session",
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 shrink-0 text-[11px] transition-colors"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Attached File Preview Bar (if file selected) */}
        {attachedFile && (
          <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
                {attachedFile.mimeType.startsWith("image/") ? (
                  <ImageIcon className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="truncate">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs">
                  {attachedFile.name}
                </span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 ml-2">
                  ({attachedFile.size})
                </span>
                {attachedFile.contentSnippet && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                    Snippet: {attachedFile.contentSnippet}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
              title="Remove attached file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* File Error Notice if any */}
        {fileError && (
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{fileError}</span>
            </div>
            <button onClick={() => setFileError(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.java,.c,.cpp,.html,.pdf,image/*"
        />

        {/* Quick Media Inspiration Row */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-500" />
            Quick Prompts:
          </span>
          <button
            type="button"
            onClick={() => {
              setInputText("What do you know about your creator?");
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] whitespace-nowrap shrink-0 transition-colors font-medium"
          >
            🧑‍💻 About Creator (Danish)
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText("Generate an educational image diagram of the human brain with labeled lobes using Gemini");
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] whitespace-nowrap shrink-0 transition-colors"
          >
            🎨 Image of Human Brain
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText("Create a system architecture flowchart of a modern Web App using ChatGPT and Claude");
            }}
            className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-[11px] whitespace-nowrap shrink-0 transition-colors"
          >
            📊 Web App Flowchart
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText("Make an animated explainer video storyboard of how solar panels convert sunlight into electricity using Grok");
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] whitespace-nowrap shrink-0 transition-colors"
          >
            🎬 Solar Energy Video
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
              attachedFile
                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 border-indigo-300 dark:border-indigo-700"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
            }`}
            title="Attach file from local storage (.txt, .md, .pdf, code, images, notes)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAiPaused}
            placeholder={
              isAiPaused
                ? "AI Tutor endpoints are currently paused by the administrator..."
                : attachedFile
                ? `Ask anything about ${attachedFile.name}...`
                : `Ask AI, or type "make image of...", "diagram of...", "video of..."`
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            disabled={isAiPaused}
            className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 transition-colors"
            title="Speak query with Voice Assistant"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={isAiPaused || (!inputText.trim() && !attachedFile) || isSending}
            className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center transition-all shadow-md shadow-indigo-600/20 shrink-0"
            title="Send Message"
          >
            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Studio Modal Overlay */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowStudioModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white z-20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <AIMediaStudioView
              initialMedia={selectedStudioMedia || undefined}
              onClose={() => setShowStudioModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
