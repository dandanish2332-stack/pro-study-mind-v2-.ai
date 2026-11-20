import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "../firebase";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

const ADMIN_EMAIL = "dandanish2332@gmail.com";

// Strictly in-memory OAuth access token cache — NEVER persisted to localStorage or sessionStorage
let cachedAccessToken: string | null = null;
let cachedTokenHasGmailScopes = false;
let cachedTokenTimestamp = 0;
let isSigningIn = false;

export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

export function getGoogleCurrentUser(): User | null {
  try {
    return auth.currentUser;
  } catch {
    return null;
  }
}

export function isFirebaseAdminSessionActive(): boolean {
  try {
    const user = auth.currentUser;
    return Boolean(
      user &&
        user.emailVerified &&
        user.email &&
        user.email.toLowerCase() === ADMIN_EMAIL
    );
  } catch {
    return false;
  }
}

export function hasGoogleGmailSession(): boolean {
  return Boolean(cachedAccessToken && cachedTokenHasGmailScopes);
}

export function initGoogleAuth(
  onSuccess: (user: User) => void,
  onFailure?: (err?: unknown) => void
): () => void {
  try {
    return onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          onSuccess(user);
        } else {
          cachedAccessToken = null;
          cachedTokenHasGmailScopes = false;
          cachedTokenTimestamp = 0;
          if (onFailure) onFailure();
        }
      },
      (err) => {
        cachedAccessToken = null;
        cachedTokenHasGmailScopes = false;
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
  includeGmailScopes?: boolean;
}): Promise<{
  user: User;
  accessToken: string | null;
  email: string;
  name: string;
  avatarUrl?: string;
}> {
  if (isSigningIn) {
    throw new Error("A Google Sign-In popup is already open. Please complete or close it.");
  }
  isSigningIn = true;
  try {
    const includeGmail = Boolean(options?.includeGmailScopes);
    const activeProvider = new GoogleAuthProvider();
    if (includeGmail) {
      GMAIL_SCOPES.forEach((scope) => activeProvider.addScope(scope));
    }
    activeProvider.setCustomParameters({
      prompt: options?.forceConsent ? "consent select_account" : "select_account",
    });

    const result = await signInWithPopup(auth, activeProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    if (accessToken && includeGmail) {
      cachedAccessToken = accessToken;
      cachedTokenHasGmailScopes = true;
      cachedTokenTimestamp = Date.now();
    } else if (accessToken) {
      cachedAccessToken = accessToken;
      cachedTokenTimestamp = Date.now();
    }

    const email = (result.user.email || "").toLowerCase();
    if (!email) {
      throw new Error("Google account did not return an email address.");
    }
    const name = result.user.displayName || email.split("@")[0] || "Google User";
    const avatarUrl = result.user.photoURL || undefined;

    return {
      user: result.user,
      accessToken,
      email,
      name,
      avatarUrl,
    };
  } catch (popupErr: any) {
    const code = popupErr?.code || "";
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      throw new Error("Google sign-in popup was closed before selecting an account.");
    }
    if (code === "auth/popup-blocked") {
      throw new Error("Browser blocked the Google Sign-In popup. Please allow popups for this site and try again.");
    }
    if (code === "auth/unauthorized-domain") {
      throw new Error(
        `This domain (${host}) is not listed in Firebase Authorized Domains yet. Add "${host}" in Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
    }
    if (code === "auth/operation-not-allowed") {
      throw new Error("Google Sign-In is not enabled in Firebase Authentication Console.");
    }
    throw popupErr;
  } finally {
    isSigningIn = false;
  }
}

export async function getValidGoogleAccessToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh && cachedAccessToken && Date.now() - cachedTokenTimestamp < 50 * 60 * 1000) {
    return cachedAccessToken;
  }
  return cachedAccessToken;
}

export async function googleLogout(): Promise<void> {
  cachedAccessToken = null;
  cachedTokenHasGmailScopes = false;
  cachedTokenTimestamp = 0;
  try {
    await signOut(auth);
  } catch {
    // quiet fail if auth wasn't initialized
  }
}
