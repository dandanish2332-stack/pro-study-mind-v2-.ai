import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  Auth,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function ensureFirebaseAuth(): Auth {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

const provider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: "select_account" });

// Strictly in-memory OAuth access token cache — NEVER persisted to localStorage or sessionStorage
let cachedAccessToken: string | null = null;
let cachedTokenTimestamp = 0;
let isSigningIn = false;

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function getGoogleCurrentUser(): User | null {
  try {
    return ensureFirebaseAuth().currentUser;
  } catch {
    return null;
  }
}

export function hasGoogleGmailSession(): boolean {
  return Boolean(cachedAccessToken);
}

export function initGoogleAuth(
  onSuccess: (user: User) => void,
  onFailure?: (err?: unknown) => void
): () => void {
  try {
    const auth = ensureFirebaseAuth();
    return onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          onSuccess(user);
        } else {
          cachedAccessToken = null;
          cachedTokenTimestamp = 0;
          if (onFailure) onFailure();
        }
      },
      (err) => {
        cachedAccessToken = null;
        cachedTokenTimestamp = 0;
        if (onFailure) onFailure(err);
      }
    );
  } catch (err) {
    if (onFailure) onFailure(err);
    return () => {};
  }
}

export async function googleSignIn(options?: {
  forceConsent?: boolean;
}): Promise<{
  user: User;
  accessToken: string;
  email: string;
  name: string;
  avatarUrl?: string;
}> {
  if (isSigningIn) {
    throw new Error("A Google Sign-In popup is already open. Please complete or close it.");
  }
  isSigningIn = true;
  try {
    const auth = ensureFirebaseAuth();
    if (options?.forceConsent) {
      provider.setCustomParameters({ prompt: "consent select_account" });
    } else {
      provider.setCustomParameters({ prompt: "select_account" });
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No OAuth access token was returned by Google.");
    }
    cachedAccessToken = credential.accessToken;
    cachedTokenTimestamp = Date.now();
    return {
      user: result.user,
      accessToken: credential.accessToken,
      email: (result.user.email || "").toLowerCase(),
      name: result.user.displayName || result.user.email || "Google User",
      avatarUrl: result.user.photoURL || undefined,
    };
  } finally {
    isSigningIn = false;
  }
}

export async function getValidGoogleAccessToken(forceRefresh = false): Promise<string | null> {
  // Tokens typically last 60 minutes; reuse within 50 minutes unless forced
  if (!forceRefresh && cachedAccessToken && Date.now() - cachedTokenTimestamp < 50 * 60 * 1000) {
    return cachedAccessToken;
  }
  return cachedAccessToken;
}

export async function googleLogout(): Promise<void> {
  cachedAccessToken = null;
  cachedTokenTimestamp = 0;
  try {
    const auth = ensureFirebaseAuth();
    await signOut(auth);
  } catch {
    // quiet fail if auth wasn't initialized
  }
}
