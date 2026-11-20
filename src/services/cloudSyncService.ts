import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db, auth, OperationType, handleFirestoreError } from "../firebase";
import { PlatformSettings, ServerAnnouncement, StudentGrade, StudentSubject } from "../types";
import { safeJsonFetch } from "../utils/safeFetch";
import { isFirebaseAdminSessionActive } from "../utils/googleAuth";

export interface UploadedPdfNoteRecord {
  id: string;
  title: string;
  description: string;
  subject: StudentSubject | string;
  grade: StudentGrade | string;
  category: string;
  fileName: string;
  pageCount: number;
  fileSizeKb: number;
  downloadCount: number;
  lastUpdated: string;
  fileUrl: string;
  storageType: "firebase_storage" | "firestore_chunks" | "static_asset" | "server_api";
  chunkCount?: number;
  storagePath?: string;
  uploadedBy?: string;
  tags?: string[];
}

const LOCAL_UPLOADED_NOTES_CACHE_KEY = "prostudymind_uploaded_notes_cache_v3";
const LOCAL_PLATFORM_SETTINGS_CACHE_KEY = "prostudymind_platform_settings_cache_v1";
const LOCAL_ANNOUNCEMENTS_CACHE_KEY = "prostudymind_announcements_cache_v1";

// 524,286 bytes is an exact multiple of 3 -> encodes cleanly to 699,048 base64 chars
// Fits well inside Firestore 1MB doc limit (<750KB rule cap) and serverless HTTP chunk limits
const CHUNK_BYTE_SIZE = 524_286;
const MAX_FIRESTORE_CHUNKS = 500; // ~262 MB raw PDF capacity

export const BUILT_IN_VERBATIM_PDFS: UploadedPdfNoteRecord[] = [];

// In-memory cache of assembled PDF bytes & Blob URLs for chunked PDFs
const resolvedBytesCache = new Map<string, Uint8Array>();
const resolvedBlobCache = new Map<string, string>();

export function assertValidPdfBytes(bytes: Uint8Array): void {
  if (!bytes || bytes.length < 5) {
    throw new Error("The PDF file is empty or incomplete.");
  }
  const headSlice = bytes.subarray(0, Math.min(bytes.length, 1024));
  let headText = "";
  for (let i = 0; i < headSlice.length; i++) {
    headText += String.fromCharCode(headSlice[i]);
  }
  if (headText.includes("%PDF-")) {
    return;
  }
  const lower = headText.trimStart().toLowerCase();
  if (lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.startsWith("<head") || lower.startsWith("<script")) {
    throw new Error(
      "This file contains webpage/HTML data instead of a real PDF document (likely saved from an old redirect or error page). Please delete it and upload the original .pdf file."
    );
  }
  throw new Error(
    "This file is not a valid PDF document (missing %PDF- signature). Please upload an uncorrupted .pdf file."
  );
}

function readLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function writeLocalCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const block = 0x8000;
  for (let i = 0; i < bytes.length; i += block) {
    const slice = bytes.subarray(i, i + block);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function decodeBase64ChunkToUint8(rawChunk: string, isFirstChunk: boolean): Uint8Array {
  let clean = rawChunk.trim();
  if (isFirstChunk) {
    const commaIdx = clean.indexOf(",");
    if (clean.startsWith("data:") && commaIdx !== -1) {
      clean = clean.slice(commaIdx + 1);
    }
  }
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function dataUrlToPdfBlob(dataUrl: string): Blob {
  const bytes = decodeBase64ChunkToUint8(dataUrl, true);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export async function ensureAdminFirestoreDoc(strict = false): Promise<void> {
  if (!isFirebaseAdminSessionActive() || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const path = `admins/${uid}`;
  try {
    await auth.currentUser.getIdToken(true);
    const adminRef = doc(db, "admins", uid);
    const snap = await getDoc(adminRef);
    if (!snap.exists()) {
      await setDoc(adminRef, {
        uid,
        email: auth.currentUser.email || "dandanish2332@gmail.com",
        role: "admin",
      });
    }
  } catch (err) {
    if (strict) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.warn("Admin Firestore doc verification notice:", err);
  }
}

async function uploadChunksToExpressBackend(params: {
  file: File;
  notePayload: UploadedPdfNoteRecord;
  totalChunks: number;
  onProgress?: (pct: number, statusText: string) => void;
}): Promise<{ ok: boolean; note?: UploadedPdfNoteRecord; error?: string }> {
  const { file, notePayload, totalChunks, onProgress } = params;

  const initRes = await safeJsonFetch<{ success: boolean; error?: string }>(
    "/api/uploaded-notes/upload/init",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: notePayload.id, totalChunks }),
    }
  );
  if (!initRes.ok || !initRes.data?.success) {
    return { ok: false, error: initRes.error || initRes.data?.error || "Failed to initialize backend upload." };
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_BYTE_SIZE;
    const end = Math.min(file.size, start + CHUNK_BYTE_SIZE);
    const sliceBuffer = await file.slice(start, end).arrayBuffer();
    const base64Data = uint8ToBase64(new Uint8Array(sliceBuffer));

    const chunkRes = await safeJsonFetch<{ success: boolean; error?: string }>(
      "/api/uploaded-notes/upload/chunk",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteId: notePayload.id,
          chunkIndex: i,
          base64Data,
        }),
      }
    );

    if (!chunkRes.ok || !chunkRes.data?.success) {
      return {
        ok: false,
        error: chunkRes.error || chunkRes.data?.error || `Backend upload failed at chunk ${i + 1}/${totalChunks}.`,
      };
    }

    if (onProgress) {
      const pct = 15 + Math.round(((i + 1) / totalChunks) * 75);
      onProgress(pct, `Uploading PDF part ${i + 1} of ${totalChunks} to backend server...`);
    }
  }

  const completeRes = await safeJsonFetch<{ success: boolean; note?: UploadedPdfNoteRecord; error?: string }>(
    "/api/uploaded-notes/upload/complete",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notePayload),
    }
  );

  if (!completeRes.ok || !completeRes.data?.success) {
    return {
      ok: false,
      error: completeRes.error || completeRes.data?.error || "Failed to finalize backend PDF upload.",
    };
  }

  return { ok: true, note: completeRes.data.note };
}

async function uploadBlobChunksToFirestore(params: {
  blob: Blob;
  notePayload: UploadedPdfNoteRecord;
  totalChunks: number;
  onProgress?: (pct: number, statusText: string) => void;
}): Promise<void> {
  const { blob, notePayload, totalChunks, onProgress } = params;

  onProgress?.(10, "Registering document metadata globally in Firestore...");
  try {
    await setDoc(doc(db, "uploaded_notes", notePayload.id), notePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `uploaded_notes/${notePayload.id}`);
  }

  const CHUNKS_PER_BATCH = 2;
  for (let batchStart = 0; batchStart < totalChunks; batchStart += CHUNKS_PER_BATCH) {
    const batch = writeBatch(db);
    const batchEnd = Math.min(totalChunks, batchStart + CHUNKS_PER_BATCH);

    for (let i = batchStart; i < batchEnd; i++) {
      const start = i * CHUNK_BYTE_SIZE;
      const end = Math.min(blob.size, start + CHUNK_BYTE_SIZE);
      const sliceBuffer = await blob.slice(start, end).arrayBuffer();
      const base64Data = uint8ToBase64(new Uint8Array(sliceBuffer));
      const chunkDocId = `${notePayload.id}_chunk_${i}`;
      batch.set(doc(db, "uploaded_pdf_chunks", chunkDocId), {
        noteId: notePayload.id,
        chunkIndex: i,
        totalChunks,
        data: base64Data,
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `uploaded_pdf_chunks/${notePayload.id}_batch_${batchStart}`);
    }

    const pct = 12 + Math.round((batchEnd / totalChunks) * 70);
    onProgress?.(pct, `Uploaded ${batchEnd} of ${totalChunks} chunks globally to Firestore...`);
  }
}

export async function uploadPdfToCloud(params: {
  file: File;
  title: string;
  description: string;
  subject: string;
  grade: string;
  category?: string;
  pageCount?: number;
  onProgress: (pct: number, statusText: string) => void;
}): Promise<{ note: UploadedPdfNoteRecord; storageBackend: string; isGlobalCloud: boolean }> {
  const {
    file,
    title,
    description,
    subject,
    grade,
    category = "Complete Study Guide",
    pageCount = 15,
    onProgress,
  } = params;

  const noteId = `uploaded-pdf-${Date.now()}`;
  const cleanFileName = file.name || `${title.replace(/\s+/g, "_")}.pdf`;
  const cleanTitle = (title.trim() || cleanFileName.replace(/\.pdf$/i, "")).slice(0, 240);
  const cleanDesc = (description.trim() || `Original PDF notes for ${subject} (${grade})`).slice(0, 1000);
  const fileSizeKb = Math.max(1, Math.round(file.size / 1024));
  const lastUpdated = new Date().toISOString().split("T")[0];
  const tags = [
    subject.toLowerCase(),
    grade.toLowerCase().replace(/\s+/g, ""),
    "admin_upload",
    "verbatim_pdf",
  ];

  const headerSlice = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  assertValidPdfBytes(headerSlice);

  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_BYTE_SIZE));
  onProgress(5, `Preparing ${totalChunks} verbatim PDF chunk(s)...`);

  try {
    await auth.authStateReady();
  } catch {}

  const firebaseAdminActive = isFirebaseAdminSessionActive();
  if (firebaseAdminActive) {
    await ensureAdminFirestoreDoc(true);
  }

  let savedToFirestore = false;
  let storageBackend = "Backend Server PDF Storage";
  let noteDocPayload: UploadedPdfNoteRecord = {
    id: noteId,
    title: cleanTitle,
    description: cleanDesc,
    subject,
    grade,
    category,
    fileName: cleanFileName.slice(0, 240),
    pageCount: Math.max(1, Number(pageCount) || 15),
    fileSizeKb,
    downloadCount: 0,
    lastUpdated,
    fileUrl: `/api/uploaded-notes/${noteId}/file`,
    storageType: "server_api",
    chunkCount: totalChunks,
    uploadedBy: (auth.currentUser?.email || "admin0011").slice(0, 128),
    tags,
  };

  // 1. Primary Global Persistence: Firestore Chunked Storage (visible across ALL students/devices)
  if (firebaseAdminActive && totalChunks <= MAX_FIRESTORE_CHUNKS) {
    noteDocPayload = {
      ...noteDocPayload,
      fileUrl: `firestore://uploaded_pdf_chunks/${noteId}`,
      storageType: "firestore_chunks",
      chunkCount: totalChunks,
    };

    await uploadBlobChunksToFirestore({
      blob: file,
      notePayload: noteDocPayload,
      totalChunks,
      onProgress,
    });

    savedToFirestore = true;
    storageBackend = "Firestore Global Chunked Storage";
  }

  // 2. Always sync / upload to Express Backend via Chunked API (handles huge files & fast HTTP range streaming)
  let serverSavedNote: UploadedPdfNoteRecord | undefined;
  let backendError: string | undefined;

  if (!savedToFirestore) {
    // Full backend chunked binary upload
    const res = await uploadChunksToExpressBackend({
      file,
      notePayload: noteDocPayload,
      totalChunks,
      onProgress,
    });
    serverSavedNote = res.note;
    backendError = res.error;
  } else {
    // Firestore succeeded globally; mirror metadata + chunks to backend best-effort for instant binary range streaming
    onProgress(86, "Mirroring PDF to Express backend server...");
    const mirrorRes = await uploadChunksToExpressBackend({
      file,
      notePayload: noteDocPayload,
      totalChunks,
    });
    if (mirrorRes.ok) {
      serverSavedNote = mirrorRes.note;
      storageBackend = "Firestore Global + Express Server";
    } else {
      // Fallback: at least register metadata if binary mirror skipped
      await safeJsonFetch("/api/uploaded-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteDocPayload),
      }).catch(() => {});
    }
  }

  if (!savedToFirestore && !serverSavedNote) {
    throw new Error(
      backendError ||
        (totalChunks > MAX_FIRESTORE_CHUNKS
          ? "PDF exceeds 260 MB Firestore limit and backend upload failed."
          : "Could not upload PDF. Please connect Google Firestore Sync or check backend connectivity.")
    );
  }

  // Pre-warm local browser Blob URL from the original File object immediately
  try {
    resolvedBlobCache.set(noteId, URL.createObjectURL(file));
  } catch {}

  const savedNote = serverSavedNote ? { ...noteDocPayload, ...serverSavedNote } : noteDocPayload;
  const cachedList = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
  writeLocalCache(LOCAL_UPLOADED_NOTES_CACHE_KEY, [
    savedNote,
    ...cachedList.filter((n) => n.id !== savedNote.id),
  ]);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prostudymind:pdf-notes-updated", { detail: savedNote }));
  }

  onProgress(100, savedToFirestore ? "Published globally to all devices!" : "Saved to local server!");
  return { note: savedNote, storageBackend, isGlobalCloud: savedToFirestore };
}

function normalizeUploadedNote(raw: any): UploadedPdfNoteRecord | null {
  if (!raw || !raw.id || !raw.title) return null;
  if (typeof raw.fileUrl === "string" && raw.fileUrl.startsWith("blob:")) return null;
  return {
    id: String(raw.id),
    title: String(raw.title),
    description: String(raw.description || `Original PDF notes for ${raw.subject || "Study"}`),
    subject: String(raw.subject || "Physics"),
    grade: String(raw.grade || "12th Class"),
    category: String(raw.category || "Complete Study Guide"),
    fileName: String(raw.fileName || `${raw.title}.pdf`),
    pageCount: Number(raw.pageCount || 12),
    fileSizeKb: Number(raw.fileSizeKb || 1024),
    downloadCount: Number(raw.downloadCount || 0),
    lastUpdated: String(raw.lastUpdated || new Date().toISOString().split("T")[0]),
    fileUrl: String(raw.fileUrl || ""),
    storageType: raw.storageType || "server_api",
    chunkCount: Number(raw.chunkCount || 0),
    ...(raw.storagePath ? { storagePath: String(raw.storagePath) } : {}),
    uploadedBy: raw.uploadedBy || "admin0011",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

function sortUploadedNotes(list: UploadedPdfNoteRecord[]): UploadedPdfNoteRecord[] {
  return [...list].sort((a, b) => {
    const dateDiff = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.id.localeCompare(a.id);
  });
}

export async function fetchAllPdfNotes(): Promise<UploadedPdfNoteRecord[]> {
  const byId = new Map<string, UploadedPdfNoteRecord>();

  // 1. Fetch from Express backend + Firestore concurrently
  const [apiResult, firestoreResult] = await Promise.all([
    safeJsonFetch<{ success: boolean; notes?: any[] }>("/api/uploaded-notes"),
    getDocs(collection(db, "uploaded_notes"))
      .then((snap) => ({ ok: true as const, docs: snap.docs.map((d) => d.data() as UploadedPdfNoteRecord) }))
      .catch((err) => {
        console.warn("Firestore uploaded_notes fetch notice:", err);
        return { ok: false as const, docs: [] as UploadedPdfNoteRecord[] };
      }),
  ]);

  const processIncoming = (rawList: any[]) => {
    for (const raw of rawList) {
      const normalized = normalizeUploadedNote(raw);
      if (normalized) {
        byId.set(normalized.id, normalized);
      }
    }
  };

  if (apiResult.ok && Array.isArray(apiResult.data?.notes)) {
    processIncoming(apiResult.data.notes);
  }
  if (firestoreResult.ok && Array.isArray(firestoreResult.docs)) {
    // Firestore authoritative entries overwrite stale server metadata for firestore_chunks docs
    processIncoming(firestoreResult.docs);
  }

  // Only fall back to localStorage cache if BOTH backend & Firestore failed to respond
  if (!apiResult.ok && !firestoreResult.ok && byId.size === 0) {
    const cached = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
    processIncoming(cached);
  } else if (apiResult.ok || firestoreResult.ok) {
    writeLocalCache(LOCAL_UPLOADED_NOTES_CACHE_KEY, Array.from(byId.values()));
  }

  return sortUploadedNotes(Array.from(byId.values()));
}

export function subscribeToPdfNotes(
  onUpdate: (notes: UploadedPdfNoteRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let active = true;
  const emitMerged = async (firestoreDocs: UploadedPdfNoteRecord[]) => {
    if (!active) return;
    const byId = new Map<string, UploadedPdfNoteRecord>();

    const apiRes = await safeJsonFetch<{ success: boolean; notes?: any[] }>("/api/uploaded-notes").catch(
      () => ({ ok: false as const, data: undefined })
    );
    if (apiRes.ok && Array.isArray(apiRes.data?.notes)) {
      for (const raw of apiRes.data.notes) {
        const normalized = normalizeUploadedNote(raw);
        if (normalized) byId.set(normalized.id, normalized);
      }
    }

    for (const raw of firestoreDocs) {
      const normalized = normalizeUploadedNote(raw);
      if (normalized) byId.set(normalized.id, normalized);
    }

    if (!active) return;
    const sorted = sortUploadedNotes(Array.from(byId.values()));
    writeLocalCache(LOCAL_UPLOADED_NOTES_CACHE_KEY, sorted);
    onUpdate(sorted);
  };

  let latestFirestoreDocs: UploadedPdfNoteRecord[] = [];
  const unsubSnapshot = onSnapshot(
    collection(db, "uploaded_notes"),
    async (snap) => {
      latestFirestoreDocs = snap.docs.map((d) => d.data() as UploadedPdfNoteRecord);
      await emitMerged(latestFirestoreDocs);
    },
    (err) => {
      console.warn("Firestore live PDF subscription notice:", err);
      onError?.(err);
    }
  );

  const handleLocalEvent = () => {
    fetchAllPdfNotes().then((list) => {
      if (active) onUpdate(list);
    }).catch(() => {});
  };
  if (typeof window !== "undefined") {
    window.addEventListener("prostudymind:pdf-notes-updated", handleLocalEvent);
  }

  return () => {
    active = false;
    unsubSnapshot();
    if (typeof window !== "undefined") {
      window.removeEventListener("prostudymind:pdf-notes-updated", handleLocalEvent);
    }
  };
}

export async function syncLocalPdfToFirestore(
  note: UploadedPdfNoteRecord,
  onProgress?: (pct: number, statusText: string) => void
): Promise<UploadedPdfNoteRecord> {
  if (!isFirebaseAdminSessionActive()) {
    throw new Error("Please verify Google Admin Sync (dandanish2332@gmail.com) to publish this PDF globally.");
  }

  await ensureAdminFirestoreDoc(true);
  onProgress?.(5, `Downloading "${note.title}" from local server for global publishing...`);

  let pdfBlob: Blob | null = null;
  if (note.fileUrl.startsWith("data:")) {
    pdfBlob = dataUrlToPdfBlob(note.fileUrl);
  } else {
    const fileRes = await fetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}/file`);
    const contentType = (fileRes.headers.get("content-type") || "").toLowerCase();
    if (!fileRes.ok || !contentType.includes("application/pdf")) {
      throw new Error(
        `Original PDF binary for "${note.title}" is not available on this server. Please re-upload the PDF file directly.`
      );
    }
    pdfBlob = await fileRes.blob();
  }

  const totalChunks = Math.max(1, Math.ceil(pdfBlob.size / CHUNK_BYTE_SIZE));
  if (totalChunks > MAX_FIRESTORE_CHUNKS) {
    throw new Error(`"${note.title}" exceeds the 260 MB Firestore global chunk limit.`);
  }

  const globalRecord: UploadedPdfNoteRecord = {
    ...note,
    fileUrl: `firestore://uploaded_pdf_chunks/${note.id}`,
    storageType: "firestore_chunks",
    chunkCount: totalChunks,
    fileSizeKb: Math.max(1, Math.round(pdfBlob.size / 1024)),
    uploadedBy: (auth.currentUser?.email || note.uploadedBy || "dandanish2332@gmail.com").slice(0, 128),
  };

  await uploadBlobChunksToFirestore({
    blob: pdfBlob,
    notePayload: globalRecord,
    totalChunks,
    onProgress,
  });

  // Update backend metadata record so Express & Firestore stay aligned
  await safeJsonFetch("/api/uploaded-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(globalRecord),
  }).catch(() => {});

  const cached = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
  writeLocalCache(LOCAL_UPLOADED_NOTES_CACHE_KEY, [
    globalRecord,
    ...cached.filter((n) => n.id !== globalRecord.id),
  ]);

  onProgress?.(100, `Published "${note.title}" globally to all devices!`);
  return globalRecord;
}

export async function syncAllLocalPdfsToFirestore(
  onProgress?: (statusText: string) => void
): Promise<{ syncedCount: number; failedCount: number }> {
  if (!isFirebaseAdminSessionActive()) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const [apiRes, firestoreSnap] = await Promise.all([
    safeJsonFetch<{ success: boolean; notes?: any[] }>("/api/uploaded-notes"),
    getDocs(collection(db, "uploaded_notes")).catch(() => null),
  ]);

  if (!apiRes.ok || !Array.isArray(apiRes.data?.notes)) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const firestoreIds = new Set<string>(
    firestoreSnap ? firestoreSnap.docs.map((d) => d.id) : []
  );

  const pendingLocal = apiRes.data.notes
    .map((n) => normalizeUploadedNote(n))
    .filter((n): n is UploadedPdfNoteRecord => Boolean(n))
    .filter((n) => n.storageType !== "static_asset" && (!firestoreIds.has(n.id) || n.storageType !== "firestore_chunks"));

  let syncedCount = 0;
  let failedCount = 0;
  for (const note of pendingLocal) {
    try {
      onProgress?.(`Publishing local PDF "${note.title}" globally to Firestore...`);
      await syncLocalPdfToFirestore(note);
      syncedCount++;
    } catch (err) {
      console.warn(`Could not migrate local PDF ${note.id} to Firestore:`, err);
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

export async function resolvePdfBytes(note: UploadedPdfNoteRecord): Promise<Uint8Array> {
  const cachedBytes = resolvedBytesCache.get(note.id);
  if (cachedBytes) {
    assertValidPdfBytes(cachedBytes);
    return cachedBytes;
  }

  if (note.storageType === "firestore_chunks" || note.fileUrl.startsWith("firestore://")) {
    // Try Express binary stream first if this container has it in memory/disk
    try {
      const apiRes = await fetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}/file`);
      const contentType = (apiRes.headers.get("content-type") || "").toLowerCase();
      if (apiRes.ok && contentType.includes("application/pdf")) {
        const bytes = new Uint8Array(await apiRes.arrayBuffer());
        assertValidPdfBytes(bytes);
        resolvedBytesCache.set(note.id, bytes);
        return bytes;
      }
    } catch {
      // Fall through to Firestore global chunk reassembly
    }

    const q = query(collection(db, "uploaded_pdf_chunks"), where("noteId", "==", note.id));
    let snap;
    try {
      snap = await getDocs(q);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `uploaded_pdf_chunks?noteId=${note.id}`);
    }
    if (!snap || snap.empty) {
      throw new Error("PDF data chunks were not found in Cloud Firestore.");
    }

    const ordered = snap.docs
      .map((d) => d.data() as { chunkIndex: number; totalChunks?: number; data: string })
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    const parts: Uint8Array[] = [];
    let totalLen = 0;
    let carry = "";
    for (let idx = 0; idx < ordered.length; idx++) {
      let chunkStr = ordered[idx].data || "";
      if (idx === 0) {
        const commaIdx = chunkStr.indexOf(",");
        if (chunkStr.startsWith("data:") && commaIdx !== -1) {
          chunkStr = chunkStr.slice(commaIdx + 1);
        }
      }
      const combined = carry + chunkStr;
      const isLast = idx === ordered.length - 1;
      const usableLen = isLast ? combined.length : combined.length - (combined.length % 4);
      const decodable = combined.slice(0, usableLen);
      carry = combined.slice(usableLen);
      if (decodable.length > 0) {
        const bytes = decodeBase64ChunkToUint8(decodable, false);
        parts.push(bytes);
        totalLen += bytes.byteLength;
      }
    }

    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.byteLength;
    }

    assertValidPdfBytes(merged);
    resolvedBytesCache.set(note.id, merged);
    return merged;
  }

  if (note.fileUrl.startsWith("data:")) {
    const bytes = decodeBase64ChunkToUint8(note.fileUrl, true);
    assertValidPdfBytes(bytes);
    resolvedBytesCache.set(note.id, bytes);
    return bytes;
  }

  const res = await fetch(note.fileUrl);
  if (!res.ok) {
    throw new Error(`Could not fetch PDF file (HTTP ${res.status}).`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  assertValidPdfBytes(bytes);
  resolvedBytesCache.set(note.id, bytes);
  return bytes;
}

export async function resolvePdfViewUrl(note: UploadedPdfNoteRecord): Promise<string> {
  if (resolvedBlobCache.has(note.id)) {
    return resolvedBlobCache.get(note.id)!;
  }
  const bytes = await resolvePdfBytes(note);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const objectUrl = URL.createObjectURL(blob);
  resolvedBlobCache.set(note.id, objectUrl);
  return objectUrl;
}

export async function downloadVerbatimPdf(note: UploadedPdfNoteRecord): Promise<void> {
  const bytes = await resolvePdfBytes(note);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const safeName = note.fileName?.toLowerCase().endsWith(".pdf")
    ? note.fileName
    : `${note.title.replace(/[^a-zA-Z0-9._ -]/g, "_")}.pdf`;

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 10_000);

  // Best-effort download counter increment
  safeJsonFetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incrementDownload: true }),
  }).catch(() => {});

  if (isFirebaseAdminSessionActive()) {
    updateDoc(doc(db, "uploaded_notes", note.id), {
      downloadCount: increment(1),
    }).catch(() => {});
  }
}

export async function deleteUploadedPdfNote(
  note: UploadedPdfNoteRecord
): Promise<{ success: boolean; error?: string }> {
  // 1. Delete from backend API
  const apiRes = await safeJsonFetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}`, {
    method: "DELETE",
  });

  // 2. Delete from Firestore if admin is signed in with Google
  let firestoreDeleted = false;
  if (isFirebaseAdminSessionActive()) {
    try {
      await ensureAdminFirestoreDoc(false);
      await deleteDoc(doc(db, "uploaded_notes", note.id));
      const q = query(collection(db, "uploaded_pdf_chunks"), where("noteId", "==", note.id));
      const snap = await getDocs(q);
      // Batch delete up to 400 docs at a time
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      firestoreDeleted = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `uploaded_notes/${note.id}`);
    }
  }

  const cached = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
  writeLocalCache(
    LOCAL_UPLOADED_NOTES_CACHE_KEY,
    cached.filter((n) => n.id !== note.id)
  );
  const existingBlob = resolvedBlobCache.get(note.id);
  if (existingBlob && existingBlob.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(existingBlob);
    } catch {}
  }
  resolvedBytesCache.delete(note.id);
  resolvedBlobCache.delete(note.id);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prostudymind:pdf-notes-updated"));
  }

  if (!apiRes.ok && !firestoreDeleted) {
    return {
      success: false,
      error:
        note.storageType === "firestore_chunks" && !isFirebaseAdminSessionActive()
          ? "Connect Google Firestore Sync in Admin Hub first to delete cloud-hosted Firestore PDFs."
          : apiRes.error || "Could not delete PDF note.",
    };
  }
  return { success: true };
}

// ============================================================================
// GLOBAL PLATFORM GOVERNANCE & ANNOUNCEMENTS FIRESTORE SYNC
// ============================================================================

export async function syncPlatformSettingsToFirestore(settings: PlatformSettings): Promise<boolean> {
  writeLocalCache(LOCAL_PLATFORM_SETTINGS_CACHE_KEY, settings);
  if (!isFirebaseAdminSessionActive()) return false;
  try {
    await ensureAdminFirestoreDoc(false);
    await setDoc(doc(db, "platform_settings", "global"), {
      platformName: String(settings.platformName || "PRO Study Mind v2.0").slice(0, 120),
      supportEmail: String(settings.supportEmail || "dandanish2332@gmail.com").slice(0, 160),
      allowPublicSignup: Boolean(settings.allowPublicSignup),
      aiTutorEnabled: Boolean(settings.aiTutorEnabled),
      adPlacementsEnabled: Boolean(settings.adPlacementsEnabled),
      defaultDailyGoalHours: Math.max(1, Math.min(16, Number(settings.defaultDailyGoalHours || 4))),
      maintenanceBanner: String(settings.maintenanceBanner || "").slice(0, 500),
      updatedAt: settings.updatedAt || new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn("Firestore platform_settings write warning:", err);
    return false;
  }
}

export async function fetchPlatformSettingsFromFirestore(): Promise<PlatformSettings | null> {
  try {
    const snap = await getDoc(doc(db, "platform_settings", "global"));
    if (snap.exists()) {
      const data = snap.data() as PlatformSettings;
      writeLocalCache(LOCAL_PLATFORM_SETTINGS_CACHE_KEY, data);
      return data;
    }
  } catch {}
  return readLocalCache<PlatformSettings | null>(LOCAL_PLATFORM_SETTINGS_CACHE_KEY, null);
}

export function subscribeToPlatformSettings(
  onUpdate: (settings: PlatformSettings) => void,
  onError?: (err: unknown) => void
): () => void {
  return onSnapshot(
    doc(db, "platform_settings", "global"),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PlatformSettings;
        writeLocalCache(LOCAL_PLATFORM_SETTINGS_CACHE_KEY, data);
        onUpdate(data);
      }
    },
    (err) => {
      console.warn("Firestore live platform_settings subscription notice:", err);
      onError?.(err);
    }
  );
}

export async function syncAnnouncementToFirestore(announcement: ServerAnnouncement): Promise<boolean> {
  if (!isFirebaseAdminSessionActive()) return false;
  try {
    await ensureAdminFirestoreDoc(false);
    await setDoc(doc(db, "announcements", announcement.id), {
      id: announcement.id,
      title: announcement.title.slice(0, 200),
      message: announcement.message.slice(0, 2000),
      type: announcement.type,
      targetGrade: announcement.targetGrade.slice(0, 80),
      createdBy: announcement.createdBy.slice(0, 120),
      createdAt: announcement.createdAt,
    });
    return true;
  } catch (err) {
    console.warn("Firestore announcement sync warning:", err);
    return false;
  }
}

export async function deleteAnnouncementFromFirestore(id: string): Promise<boolean> {
  if (!isFirebaseAdminSessionActive()) return false;
  try {
    await ensureAdminFirestoreDoc(false);
    await deleteDoc(doc(db, "announcements", id));
    return true;
  } catch (err) {
    console.warn("Firestore announcement delete warning:", err);
    return false;
  }
}

export async function fetchAnnouncementsFromFirestore(): Promise<ServerAnnouncement[]> {
  try {
    const snap = await getDocs(collection(db, "announcements"));
    const items = snap.docs
      .map((d) => d.data() as ServerAnnouncement)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (items.length > 0) {
      writeLocalCache(LOCAL_ANNOUNCEMENTS_CACHE_KEY, items);
    }
    return items;
  } catch {
    return readLocalCache<ServerAnnouncement[]>(LOCAL_ANNOUNCEMENTS_CACHE_KEY, []);
  }
}

export function subscribeToAnnouncements(
  onUpdate: (announcements: ServerAnnouncement[]) => void,
  onError?: (err: unknown) => void
): () => void {
  return onSnapshot(
    collection(db, "announcements"),
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as ServerAnnouncement)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      writeLocalCache(LOCAL_ANNOUNCEMENTS_CACHE_KEY, items);
      onUpdate(items);
    },
    (err) => {
      console.warn("Firestore live announcements subscription notice:", err);
      onError?.(err);
    }
  );
}
