import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileText,
  Download,
  Eye,
  Search,
  RefreshCw,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  X,
  Upload,
  AlertCircle,
  Layers,
  HardDrive,
  Calendar,
  ExternalLink,
  Trash2,
  Cloud,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Monitor,
} from "lucide-react";
import {
  UploadedPdfNoteRecord,
  fetchAllPdfNotes,
  subscribeToPdfNotes,
  resolvePdfBytes,
  resolvePdfViewUrl,
  downloadVerbatimPdf,
  deleteUploadedPdfNote,
} from "../services/cloudSyncService";
import { useAuth } from "../context/AuthContext";

// Configure PDF.js worker robustly via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;

interface PdfNotesModeViewProps {
  onOpenAdminUpload?: () => void;
  initialNoteId?: string | null;
  onConsumeInitialNote?: () => void;
}

const CLASS_FILTERS = [
  "All Classes",
  "Class 12",
  "Class 11",
  "Class 10",
  "Class 9",
  "Class 6th to 8th",
  "Class 1st to 5th",
  "MDCAT & ECAT Entry Test",
  "General / College",
  "All Levels",
];

const SUBJECT_FILTERS = [
  "All Subjects",
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science",
  "General Science",
  "English",
  "Urdu",
  "Pakistan Studies",
  "General Study",
];

function normalizeGradeGroup(grade: string): string {
  const g = (grade || "").trim().toLowerCase();
  if (g.includes("12")) return "Class 12";
  if (g.includes("11")) return "Class 11";
  if (g.includes("10")) return "Class 10";
  if (g.includes("9")) return "Class 9";
  if (
    g.includes("6th to 8th") ||
    g === "class 6" ||
    g === "class 7" ||
    g === "class 8"
  ) {
    return "Class 6th to 8th";
  }
  if (
    g.includes("1st to 5th") ||
    g === "class 1" ||
    g === "class 2" ||
    g === "class 3" ||
    g === "class 4" ||
    g === "class 5"
  ) {
    return "Class 1st to 5th";
  }
  if (g.includes("mdcat") || g.includes("ecat")) return "MDCAT & ECAT Entry Test";
  if (g.includes("college") || g.includes("general")) return "General / College";
  if (g.includes("all")) return "All Levels";
  return grade;
}

function formatSize(kb: number): string {
  if (!kb || kb <= 0) return "PDF";
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
}

export const PdfNotesModeView: React.FC<PdfNotesModeViewProps> = ({
  onOpenAdminUpload,
  initialNoteId,
  onConsumeInitialNote,
}) => {
  const { isAdmin } = useAuth();

  const [notes, setNotes] = useState<UploadedPdfNoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("All Classes");
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Reader & Delete modal state
  const [activeNote, setActiveNote] = useState<UploadedPdfNoteRecord | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [viewerMode, setViewerMode] = useState<"canvas" | "native">("canvas");
  const [nativeBlobUrl, setNativeBlobUrl] = useState<string | null>(null);
  const [isResolvingPdf, setIsResolvingPdf] = useState<boolean>(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const showNotice = useCallback((text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 4500);
  }, []);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setSyncError(null);
    try {
      const list = await fetchAllPdfNotes();
      setNotes(list);
    } catch (err: any) {
      setSyncError(err?.message || "Could not connect to Cloud Firestore to load PDF notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
    const unsubscribe = subscribeToPdfNotes(
      (liveNotes) => {
        setNotes(liveNotes);
        setSyncError(null);
        setIsLoading(false);
      },
      (err: any) => {
        setSyncError(err?.message || "Live PDF sync interrupted. Click Refresh PDFs to retry.");
      }
    );
    return () => unsubscribe();
  }, [loadNotes]);

  const closeReader = useCallback(() => {
    setActiveNote(null);
    setPdfDocProxy((prev) => {
      if (prev) {
        try {
          prev.cleanup();
        } catch {}
      }
      return null;
    });
    setTotalPages(0);
    setCurrentPage(1);
    setNativeBlobUrl(null);
    setReaderError(null);
    setViewerMode("canvas");
    pageRefs.current = {};
  }, []);

  const handleOpenReader = useCallback(async (note: UploadedPdfNoteRecord) => {
    setActiveNote(note);
    setPdfDocProxy((prev) => {
      if (prev) {
        try {
          prev.cleanup();
        } catch {}
      }
      return null;
    });
    setTotalPages(0);
    setCurrentPage(1);
    setNativeBlobUrl(null);
    setReaderError(null);
    setViewerMode("canvas");
    setIsResolvingPdf(true);
    pageRefs.current = {};

    try {
      const blobUrl = await resolvePdfViewUrl(note);
      setNativeBlobUrl(blobUrl);

      const bytes = await resolvePdfBytes(note);
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const proxy = await loadingTask.promise;
      setPdfDocProxy(proxy);
      setTotalPages(proxy.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      try {
        const blobUrl = await resolvePdfViewUrl(note);
        setNativeBlobUrl(blobUrl);
        setViewerMode("native");
      } catch (nativeErr: any) {
        setReaderError(nativeErr?.message || err?.message || "Could not load PDF document.");
      }
    } finally {
      setIsResolvingPdf(false);
    }
  }, []);

  // Auto-open requested PDF if navigated directly from AI Notes shelf
  useEffect(() => {
    if (!initialNoteId || notes.length === 0) return;
    const match = notes.find((n) => n.id === initialNoteId);
    if (match) {
      handleOpenReader(match);
      onConsumeInitialNote?.();
    }
  }, [initialNoteId, notes, handleOpenReader, onConsumeInitialNote]);

  // Render all PDF pages to crisp high-DPI canvases whenever proxy or zoomScale changes
  useEffect(() => {
    if (!pdfDocProxy || viewerMode !== "canvas") return;
    let cancelled = false;

    const renderPages = async () => {
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      for (let pageNum = 1; pageNum <= pdfDocProxy.numPages; pageNum++) {
        if (cancelled) return;
        const wrapper = pageRefs.current[pageNum];
        if (!wrapper) continue;

        try {
          const page = await pdfDocProxy.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const containerWidth = Math.max(
            280,
            (canvasContainerRef.current?.clientWidth || 820) - 48
          );
          const fitScale = Math.min(1.6, containerWidth / baseViewport.width);
          const effectiveScale = fitScale * zoomScale;
          const viewport = page.getViewport({ scale: effectiveScale });

          let canvas = wrapper.querySelector("canvas");
          if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.className = "mx-auto shadow-lg rounded-lg bg-white block";
            wrapper.innerHTML = "";
            wrapper.appendChild(canvas);
          }

          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          await page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          }).promise;
        } catch (renderErr) {
          console.warn(`PDF page ${pageNum} render warning:`, renderErr);
        }
      }
    };

    const timer = setTimeout(renderPages, 40);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pdfDocProxy, zoomScale, viewerMode]);

  const jumpToPage = (targetPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, targetPage));
    setCurrentPage(clamped);
    const el = pageRefs.current[clamped];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDownload = async (note: UploadedPdfNoteRecord) => {
    setDownloadingId(note.id);
    try {
      await downloadVerbatimPdf(note);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, downloadCount: (n.downloadCount || 0) + 1 } : n))
      );
      showNotice(`Downloading original PDF: "${note.fileName}"`);
    } catch (err: any) {
      showNotice(err?.message || "Failed to download PDF file.", true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteNote = async (note: UploadedPdfNoteRecord) => {
    setDeletingId(note.id);
    try {
      const res = await deleteUploadedPdfNote(note);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        setConfirmDeleteId(null);
        if (activeNote?.id === note.id) {
          closeReader();
        }
        showNotice(`Removed "${note.title}" from PDF Notes Mode.`);
      } else {
        showNotice(res.error || "Could not delete PDF note.", true);
      }
    } catch (err: any) {
      showNotice(err?.message || "Could not delete PDF note.", true);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((n) => {
      const normalizedClass = normalizeGradeGroup(n.grade);
      const matchClass =
        selectedClass === "All Classes" ||
        normalizedClass === selectedClass ||
        n.grade.toLowerCase() === selectedClass.toLowerCase();

      const matchSubject =
        selectedSubject === "All Subjects" ||
        n.subject.toLowerCase() === selectedSubject.toLowerCase();

      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.grade.toLowerCase().includes(q) ||
        n.fileName.toLowerCase().includes(q) ||
        (n.tags || []).some((t) => t.toLowerCase().includes(q));

      return matchClass && matchSubject && matchSearch;
    });
  }, [notes, selectedClass, selectedSubject, searchQuery]);

  const classCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Classes": notes.length };
    for (const n of notes) {
      const grp = normalizeGradeGroup(n.grade);
      counts[grp] = (counts[grp] || 0) + 1;
    }
    return counts;
  }, [notes]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {toastMsg && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl text-white shadow-xl flex items-center gap-2 text-xs font-bold border max-w-md ${
            toastMsg.isError
              ? "bg-rose-600 border-rose-400"
              : "bg-emerald-600 border-emerald-400"
          }`}
        >
          {toastMsg.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-cyan-300 text-[11px] font-bold">
              <FileText className="w-3.5 h-3.5" />
              Original Verbatim PDF Library · Classes 1 to 12 & Entry Tests
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              PDF Notes Mode
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Read and download original, unmodified PDF study notes & textbook chapters uploaded directly by the Master Administrator — preserved page-for-page with zero edits or changes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={loadNotes}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Syncing..." : "Refresh PDFs"}</span>
            </button>

            {isAdmin && onOpenAdminUpload && (
              <button
                type="button"
                onClick={onOpenAdminUpload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New PDF (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-[11px]">Available PDFs</p>
            <p className="text-xl font-black font-mono text-white mt-0.5">{notes.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-[11px]">Showing Filtered</p>
            <p className="text-xl font-black font-mono text-cyan-300 mt-0.5">{filteredNotes.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-[11px]">Format Integrity</p>
            <p className="text-sm font-bold text-emerald-300 mt-1">100% Verbatim PDF</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-[11px]">Cloud Storage Sync</p>
            <p className="text-sm font-bold text-indigo-300 mt-1">Global Firestore (All Users)</p>
          </div>
        </div>
      </div>

      {syncError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{syncError}</span>
          </div>
          <button
            type="button"
            onClick={loadNotes}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shrink-0 cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PDF notes by chapter title, class, subject, or filename..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Class Filter Pills */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Filter by Class / Grade
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CLASS_FILTERS.map((cls) => {
              const count = classCounts[cls] || 0;
              const active = selectedClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{cls}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      active ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-500" /> Filter by Subject
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUBJECT_FILTERS.map((subj) => {
              const active = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PDF Cards Grid */}
      {isLoading && notes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-52 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {notes.length === 0
              ? "No PDF notes uploaded yet"
              : "No PDF notes match this class or subject filter"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {notes.length === 0
              ? isAdmin
                ? "Upload new original PDFs from the Admin Hub and they will appear here immediately for all students."
                : "Your administrator has not published PDF notes here yet. Please check back shortly or click Refresh PDFs."
              : "Try switching back to All Classes or All Subjects, or upload a new PDF document from the Admin Hub."}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClass("All Classes");
                  setSelectedSubject("All Subjects");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Show All PDF Notes
              </button>
            )}
            {isAdmin && onOpenAdminUpload && (
              <button
                type="button"
                onClick={onOpenAdminUpload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Add New PDF Notes</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotes.map((note) => {
            const isConfirmingDelete = confirmDeleteId === note.id;
            return (
              <div
                key={note.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 shadow-xs transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/70">
                        {note.grade}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/70">
                        {note.subject}
                      </span>
                      {isAdmin && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border ${
                            note.storageType === "firestore_chunks" || note.storageType === "firebase_storage"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70"
                          }`}
                        >
                          <Cloud className="w-3 h-3" />
                          {note.storageType === "firestore_chunks" || note.storageType === "firebase_storage"
                            ? "All Devices"
                            : "Local Only — Sync in Admin Hub"}
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={deletingId === note.id}
                              onClick={() => handleDeleteNote(note)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              {deletingId === note.id ? "Removing..." : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(note.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                            title="Remove PDF note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {note.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {note.pageCount} pages
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                      {formatSize(note.fileSizeKb)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {note.lastUpdated}
                    </span>
                    <span className="truncate max-w-[200px]" title={note.fileName}>
                      {note.fileName}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenReader(note)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span>Open PDF Reader</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingId === note.id}
                    onClick={() => handleDownload(note)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingId === note.id ? "Preparing..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Verbatim PDF Reader Modal (PDF.js Canvas + Native Toggle) */}
      {activeNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
          <div className="w-full max-w-6xl h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Reader Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                    {activeNote.grade}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-600 text-white text-[10px] font-bold">
                    {activeNote.subject}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                    {activeNote.fileName}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate mt-1">
                  {activeNote.title}
                </h3>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {pdfDocProxy && !readerError && (
                  <>
                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => jumpToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="p-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-mono px-1.5 text-[11px]">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => jumpToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                      <button
                        type="button"
                        onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.2).toFixed(2))))}
                        className="p-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomScale(1.2)}
                        className="font-mono px-1.5 text-[11px] hover:underline cursor-pointer"
                        title="Reset Zoom"
                      >
                        {Math.round(zoomScale * 100)}%
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomScale((z) => Math.min(2.2, Number((z + 0.2).toFixed(2))))}
                        className="p-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>

                    {nativeBlobUrl && (
                      <button
                        type="button"
                        onClick={() => setViewerMode((m) => (m === "canvas" ? "native" : "canvas"))}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                        title="Switch between built-in Canvas PDF viewer and browser native PDF embed"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>{viewerMode === "canvas" ? "Native View" : "Canvas View"}</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload(activeNote)}
                  disabled={downloadingId === activeNote.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingId === activeNote.id ? "Preparing..." : "Download PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={closeReader}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="Close PDF Reader"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reader Content */}
            <div
              ref={canvasContainerRef}
              className="flex-1 bg-slate-200 dark:bg-slate-950 relative overflow-y-auto overflow-x-auto"
            >
              {isResolvingPdf ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-600 dark:text-slate-300 p-6">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-xs font-bold">Loading original verbatim PDF from Cloud Firestore...</p>
                </div>
              ) : readerError ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-lg mx-auto">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Cannot Open PDF Document
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {readerError}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    {isAdmin && (
                      <button
                        type="button"
                        disabled={deletingId === activeNote.id}
                        onClick={() => handleDeleteNote(activeNote)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{deletingId === activeNote.id ? "Deleting..." : "Delete Corrupt PDF (Admin)"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenReader(activeNote)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ) : viewerMode === "native" && nativeBlobUrl ? (
                <iframe
                  src={nativeBlobUrl}
                  title={activeNote.title}
                  className="w-full h-full border-0 bg-white"
                />
              ) : pdfDocProxy ? (
                <div className="py-6 px-3 sm:px-6 space-y-5 flex flex-col items-center">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <div key={pageNum} className="w-full flex flex-col items-center gap-1.5">
                      <div
                        ref={(el) => {
                          pageRefs.current[pageNum] = el;
                        }}
                        className="min-h-[200px] flex items-center justify-center"
                      />
                      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        Page {pageNum} of {totalPages}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <ExternalLink className="w-8 h-8 mx-auto text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click below to download the original unmodified PDF file directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(activeNote)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Verbatim PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
