import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  getDocFromServer,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const firestoreDatabaseId =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || "(default)";

let dbInstance: Firestore;
try {
  dbInstance =
    typeof window !== "undefined"
      ? initializeFirestore(
          app,
          {
            experimentalForceLongPolling: true,
            experimentalLongPollingOptions: { timeoutSeconds: 15 },
            ignoreUndefinedProperties: true,
          },
          firestoreDatabaseId
        )
      : getFirestore(app, firestoreDatabaseId);
} catch {
  dbInstance = getFirestore(app, firestoreDatabaseId);
}

export const db: Firestore = dbInstance;

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      // Retry once after brief warmup in case initial proxy/transport handshake stalled
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        await getDocFromServer(doc(db, "test", "connection"));
        return;
      } catch (retryError) {
        if (retryError instanceof Error && retryError.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
  }
}

if (typeof window !== "undefined") {
  testConnection();
}
