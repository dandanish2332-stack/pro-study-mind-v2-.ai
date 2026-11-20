import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, auth, storage, OperationType, handleFirestoreError } from "../firebase";
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
  isFeatured?: boolean;
}

const LOCAL_UPLOADED_NOTES_CACHE_KEY = "prostudymind_uploaded_notes_cache_v2";
const LOCAL_PLATFORM_SETTINGS_CACHE_KEY = "prostudymind_platform_settings_cache_v1";
const LOCAL_ANNOUNCEMENTS_CACHE_KEY = "prostudymind_announcements_cache_v1";

// Official pre-uploaded verbatim PDF (Class 12 Physics Chapter 11)
export const BUILT_IN_VERBATIM_PDFS: UploadedPdfNoteRecord[] = [
  {
    id: "pdf-phy-12-ch11-electrostatics-ilmi",
    title: "Class 12 Physics Ch.11 Theory Notes (Electrostatics)",
    description:
      "Official complete 57-page theory notes for Class 12 Physics Chapter 11 Electrostatics (Ilmi Stars Academy) — uploaded verbatim in original PDF format without any edits or changes.",
    subject: "Physics",
    grade: "12th Class",
    category: "Complete Study Guide",
    fileName: "Class 12 Physics Ch.11 Theory Notes.pdf",
    pageCount: 57,
    fileSizeKb: 4800,
    downloadCount: 3850,
    lastUpdated: "2026-11-19",
    fileUrl: "/assets/aistudio/Class_12_Physics_Ch.11_Theory_Notes_aade1763.pdf",
    storageType: "static_asset",
    isFeatured: true,
    uploadedBy: "admin0011",
    tags: ["physics", "12thclass", "class12", "electrostatics", "ch11", "verbatim_pdf"],
  },
];

// In-memory cache of assembled Blob URLs for chunked PDFs
const resolvedBlobCache = new Map<string, string>();

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

export async function ensureAdminFirestoreDoc(): Promise<void> {
  if (!isFirebaseAdminSessionActive() || !auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const path = `admins/${uid}`;
  try {
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
    console.warn("Admin Firestore doc check notice:", err);
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read PDF binary data."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file from local device."));
    reader.readAsDataURL(file);
  });
}

function tryUploadToFirebaseStorage(
  file: File,
  storagePath: string,
  onProgress: (pct: number, statusText: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, storagePath);
      const task = uploadBytesResumable(storageRef, file, {
        contentType: file.type || "application/pdf",
      });

      const stallTimer = setTimeout(() => {
        try {
          task.cancel();
        } catch {}
        reject(new Error("Firebase Storage upload timed out; switching to Firestore chunked storage."));
      }, 15000);

      task.on(
        "state_changed",
        (snapshot) => {
          const pct = snapshot.totalBytes > 0
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 65) + 20
            : 45;
          onProgress(Math.min(85, pct), "Uploading verbatim PDF to Firebase Cloud Storage...");
        },
        (error) => {
          clearTimeout(stallTimer);
          reject(error);
        },
        async () => {
          clearTimeout(stallTimer);
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
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
}): Promise<{ note: UploadedPdfNoteRecord; storageBackend: string }> {
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
  const fileSizeKb = Math.max(1, Math.round(file.size / 1024));
  const lastUpdated = new Date().toISOString().split("T")[0];
  const tags = [
    subject.toLowerCase(),
    grade.toLowerCase().replace(/\s+/g, ""),
    "admin_upload",
    "verbatim_pdf",
  ];

  onProgress(10, "Reading original PDF file verbatim...");
  const dataUrl = await readFileAsDataUrl(file);
  onProgress(20, "Preparing cloud storage upload...");

  const firebaseAdminActive = isFirebaseAdminSessionActive();
  if (firebaseAdminActive) {
    await ensureAdminFirestoreDoc();
  }

  let finalFileUrl = "";
  let storageType: UploadedPdfNoteRecord["storageType"] = "server_api";
  let chunkCount = 0;
  let storagePath = "";
  let storageBackend = "Backend Server";

  // 1. Attempt Firebase Storage first when signed in to Firebase
  if (firebaseAdminActive) {
    try {
      const safeFile = cleanFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `uploaded_pdfs/${noteId}_${safeFile}`;
      finalFileUrl = await tryUploadToFirebaseStorage(file, storagePath, onProgress);
      storageType = "firebase_storage";
      storageBackend = "Firebase Storage + Firestore";
    } catch (storageErr) {
      console.warn("Firebase Storage fallback -> Firestore chunks:", storageErr);
      storagePath = "";
    }
  }

  // 2. If Storage did not complete & Firebase Admin is authenticated, persist verbatim base64 in Firestore chunks
  if (!finalFileUrl && firebaseAdminActive) {
    const CHUNK_SIZE = 550_000; // safe under Firestore 1MB doc limit
    const chunks: string[] = [];
    for (let i = 0; i < dataUrl.length; i += CHUNK_SIZE) {
      chunks.push(dataUrl.slice(i, i + CHUNK_SIZE));
    }

    if (chunks.length <= 100) {
      chunkCount = chunks.length;
      storageType = "firestore_chunks";
      finalFileUrl = `firestore://uploaded_pdf_chunks/${noteId}`;
      storageBackend = "Firestore Chunked Storage";

      const noteDocPayload: UploadedPdfNoteRecord = {
        id: noteId,
        title: title.trim() || cleanFileName.replace(/\.pdf$/i, ""),
        description: description.trim() || `Original PDF notes for ${subject} (${grade})`,
        subject,
        grade,
        category,
        fileName: cleanFileName,
        pageCount: Number(pageCount) || 15,
        fileSizeKb,
        downloadCount: 0,
        lastUpdated,
        fileUrl: finalFileUrl,
        storageType,
        chunkCount,
        uploadedBy: auth.currentUser?.email || "admin0011",
        tags,
      };

      onProgress(35, `Writing metadata & ${chunks.length} PDF data chunk(s) to Firestore...`);
      try {
        await setDoc(doc(db, "uploaded_notes", noteId), noteDocPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `uploaded_notes/${noteId}`);
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunkDocId = `${noteId}_chunk_${i}`;
        try {
          await setDoc(doc(db, "uploaded_pdf_chunks", chunkDocId), {
            noteId,
            chunkIndex: i,
            totalChunks: chunks.length,
            data: chunks[i],
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `uploaded_pdf_chunks/${chunkDocId}`);
        }
        const pct = 35 + Math.round(((i + 1) / chunks.length) * 50);
        onProgress(pct, `Uploading PDF chunk ${i + 1} of ${chunks.length} to Firestore...`);
      }
    }
  } else if (finalFileUrl && firebaseAdminActive) {
    // Storage upload succeeded — also save metadata doc to Firestore uploaded_notes
    onProgress(88, "Registering PDF metadata in Firestore...");
    const noteDocPayload: UploadedPdfNoteRecord = {
      id: noteId,
      title: title.trim() || cleanFileName.replace(/\.pdf$/i, ""),
      description: description.trim() || `Original PDF notes for ${subject} (${grade})`,
      subject,
      grade,
      category,
      fileName: cleanFileName,
      pageCount: Number(pageCount) || 15,
      fileSizeKb,
      downloadCount: 0,
      lastUpdated,
      fileUrl: finalFileUrl,
      storageType: "firebase_storage",
      chunkCount: 0,
      storagePath,
      uploadedBy: auth.currentUser?.email || "admin0011",
      tags,
    };
    try {
      await setDoc(doc(db, "uploaded_notes", noteId), noteDocPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `uploaded_notes/${noteId}`);
    }
  }

  // 3. Always sync to Express / Netlify backend (/api/uploaded-notes)
  onProgress(92, "Synchronizing with backend & Student PDF Mode...");
  const canSendDataUrlToServer = dataUrl.length <= 4_200_000; // keep under Netlify 6MB limit
  if (!finalFileUrl) {
    if (!canSendDataUrlToServer) {
      throw new Error(
        "This PDF exceeds 3 MB and Google Firestore Admin session is not connected yet. Click 'Activate Google Firestore Sync' above to upload large PDFs globally."
      );
    }
    storageType = "server_api";
    finalFileUrl = `/api/uploaded-notes/${noteId}/file`;
    storageBackend = "Backend Server PDF Storage";
  }

  const finalNote: UploadedPdfNoteRecord = {
    id: noteId,
    title: title.trim() || cleanFileName.replace(/\.pdf$/i, ""),
    description: description.trim() || `Original PDF notes for ${subject} (${grade})`,
    subject,
    grade,
    category,
    fileName: cleanFileName,
    pageCount: Number(pageCount) || 15,
    fileSizeKb,
    downloadCount: 0,
    lastUpdated,
    fileUrl: finalFileUrl,
    storageType,
    chunkCount,
    storagePath,
    uploadedBy: auth.currentUser?.email || "admin0011",
    tags,
    isFeatured: true,
  };

  // Pre-warm in-memory blob cache in this browser immediately
  try {
    const blob = dataUrlToPdfBlob(dataUrl);
    resolvedBlobCache.set(noteId, URL.createObjectURL(blob));
  } catch {}

  const apiRes = await safeJsonFetch<{ success: boolean; note?: UploadedPdfNoteRecord }>("/api/uploaded-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...finalNote,
      ...(canSendDataUrlToServer && storageType === "server_api" ? { dataUrl } : {}),
    }),
  });

  if (!apiRes.ok && !firebaseAdminActive) {
    throw new Error(apiRes.error || "Failed to persist uploaded PDF on backend.");
  }

  const savedNote = apiRes.data?.note ? { ...finalNote, ...apiRes.data.note } : finalNote;
  const cachedList = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
  writeLocalCache(LOCAL_UPLOADED_NOTES_CACHE_KEY, [
    savedNote,
    ...cachedList.filter((n) => n.id !== savedNote.id),
  ]);

  onProgress(100, "Upload complete & published to PDF Notes Mode!");
  return { note: savedNote, storageBackend };
}

export async function fetchAllPdfNotes(): Promise<UploadedPdfNoteRecord[]> {
  const byId = new Map<string, UploadedPdfNoteRecord>();

  // 1. Always include built-in verbatim PDFs
  for (const item of BUILT_IN_VERBATIM_PDFS) {
    byId.set(item.id, item);
  }

  // 2. Fetch from Express backend + Firestore concurrently
  const [apiResult, firestoreResult] = await Promise.all([
    safeJsonFetch<{ success: boolean; notes?: any[] }>("/api/uploaded-notes"),
    getDocs(collection(db, "uploaded_notes"))
      .then((snap) => snap.docs.map((d) => d.data() as UploadedPdfNoteRecord))
      .catch(() => [] as UploadedPdfNoteRecord[]),
  ]);

  const processIncoming = (rawList: any[]) => {
    for (const raw of rawList) {
      if (!raw || !raw.id || !raw.title) continue;
      // Ignore stale broken browser-only blob URLs
      if (typeof raw.fileUrl === "string" && raw.fileUrl.startsWith("blob:")) continue;
      const normalized: UploadedPdfNoteRecord = {
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
        lastUpdated: String(raw.lastUpdated || "2026-11-19"),
        fileUrl: String(raw.fileUrl || ""),
        storageType: raw.storageType || "server_api",
        chunkCount: Number(raw.chunkCount || 0),
        storagePath: raw.storagePath || undefined,
        uploadedBy: raw.uploadedBy || "admin0011",
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        isFeatured: raw.isFeatured !== false,
      };
      byId.set(normalized.id, normalized);
    }
  };

  if (apiResult.ok && Array.isArray(apiResult.data?.notes)) {
    processIncoming(apiResult.data.notes);
  }
  if (Array.isArray(firestoreResult) && firestoreResult.length > 0) {
    processIncoming(firestoreResult);
  }

  // If both offline/empty except built-in, also restore any valid local cache
  if (byId.size <= BUILT_IN_VERBATIM_PDFS.length) {
    const cached = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
    processIncoming(cached);
  } else {
    writeLocalCache(
      LOCAL_UPLOADED_NOTES_CACHE_KEY,
      Array.from(byId.values()).filter((n) => n.storageType !== "static_asset")
    );
  }

  return Array.from(byId.values());
}

function dataUrlToPdfBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

export async function resolvePdfViewUrl(note: UploadedPdfNoteRecord): Promise<string> {
  if (resolvedBlobCache.has(note.id)) {
    return resolvedBlobCache.get(note.id)!;
  }

  if (note.storageType === "firestore_chunks" || note.fileUrl.startsWith("firestore://")) {
    const q = query(
      collection(db, "uploaded_pdf_chunks"),
      where("noteId", "==", note.id)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("PDF data chunks were not found in Firestore.");
    }
    const ordered = snap.docs
      .map((d) => d.data() as { chunkIndex: number; data: string })
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
    const fullDataUrl = ordered.map((c) => c.data).join("");
    const blob = dataUrlToPdfBlob(fullDataUrl);
    const objectUrl = URL.createObjectURL(blob);
    resolvedBlobCache.set(note.id, objectUrl);
    return objectUrl;
  }

  if (note.fileUrl.startsWith("data:")) {
    const blob = dataUrlToPdfBlob(note.fileUrl);
    const objectUrl = URL.createObjectURL(blob);
    resolvedBlobCache.set(note.id, objectUrl);
    return objectUrl;
  }

  return note.fileUrl;
}

export async function downloadVerbatimPdf(note: UploadedPdfNoteRecord): Promise<void> {
  const url = await resolvePdfViewUrl(note);
  const safeName = note.fileName?.toLowerCase().endsWith(".pdf")
    ? note.fileName
    : `${note.title.replace(/[^a-zA-Z0-9._ -]/g, "_")}.pdf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Best-effort download counter increment
  safeJsonFetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incrementDownload: true }),
  }).catch(() => {});

  if (isFirebaseAdminSessionActive() && note.storageType !== "static_asset") {
    updateDoc(doc(db, "uploaded_notes", note.id), {
      downloadCount: increment(1),
    }).catch(() => {});
  }
}

export async function deleteUploadedPdfNote(note: UploadedPdfNoteRecord): Promise<{ success: boolean; error?: string }> {
  if (note.storageType === "static_asset") {
    return { success: false, error: "Built-in official Class 12 Physics PDF cannot be deleted." };
  }

  // Delete from backend API
  const apiRes = await safeJsonFetch(`/api/uploaded-notes/${encodeURIComponent(note.id)}`, {
    method: "DELETE",
  });

  // Delete from Firestore + Storage if admin is signed in with Google
  if (isFirebaseAdminSessionActive()) {
    try {
      await deleteDoc(doc(db, "uploaded_notes", note.id));
      if (note.chunkCount && note.chunkCount > 0) {
        const q = query(collection(db, "uploaded_pdf_chunks"), where("noteId", "==", note.id));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
      }
      if (note.storagePath) {
        await deleteObject(ref(storage, note.storagePath)).catch(() => {});
      }
    } catch (err) {
      console.warn("Firestore PDF delete warning:", err);
    }
  }

  const cached = readLocalCache<UploadedPdfNoteRecord[]>(LOCAL_UPLOADED_NOTES_CACHE_KEY, []);
  writeLocalCache(
    LOCAL_UPLOADED_NOTES_CACHE_KEY,
    cached.filter((n) => n.id !== note.id)
  );
  resolvedBlobCache.delete(note.id);

  if (!apiRes.ok && !isFirebaseAdminSessionActive()) {
    return { success: false, error: apiRes.error || "Could not delete PDF note." };
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
    await ensureAdminFirestoreDoc();
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

export async function syncAnnouncementToFirestore(announcement: ServerAnnouncement): Promise<boolean> {
  if (!isFirebaseAdminSessionActive()) return false;
  try {
    await ensureAdminFirestoreDoc();
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
