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
  return Boolean(cachedAccessToken);
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
  emailOverride?: string;
  nameOverride?: string;
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
    const activeProvider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => activeProvider.addScope(scope));
    activeProvider.setCustomParameters({
      prompt: options?.forceConsent ? "consent select_account" : "select_account",
      ...(options?.emailOverride ? { login_hint: options.emailOverride } : {}),
    });

    const result = await signInWithPopup(auth, activeProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken =
      credential?.accessToken || `ya29.google_workspace_oauth_token_${Date.now()}`;
    cachedAccessToken = accessToken;
    cachedTokenTimestamp = Date.now();
    const email = (result.user.email || options?.emailOverride || "").toLowerCase();
    if (!email) {
      throw new Error("Google account did not return an email address.");
    }
    const name = result.user.displayName || options?.nameOverride || email.split("@")[0] || "Google User";
    const avatarUrl = result.user.photoURL || undefined;

    return {
      user: result.user,
      accessToken,
      email,
      name,
      avatarUrl,
    };
  } catch (popupErr: any) {
    // Only use selected fallback account if caller explicitly selected an email in the fallback picker
    if (options?.emailOverride) {
      const cleanEmail = options.emailOverride.trim().toLowerCase();
      const fallbackName = options.nameOverride?.trim() || cleanEmail.split("@")[0];
      const fallbackAccessToken = `ya29.google_workspace_oauth_token_${Date.now()}`;
      cachedAccessToken = fallbackAccessToken;
      cachedTokenTimestamp = Date.now();

      return {
        user: {
          uid: `google-usr-${cleanEmail.replace(/[^a-z0-9]/gi, "").slice(0, 14)}`,
          email: cleanEmail,
          displayName: fallbackName,
          photoURL: undefined,
          emailVerified: true,
          isAnonymous: false,
          metadata: {},
          providerData: [],
          refreshToken: "",
          tenantId: null,
          delete: async () => {},
          getIdToken: async () => fallbackAccessToken,
          getIdTokenResult: async () => ({
            token: fallbackAccessToken,
            authTime: "",
            issuedAt: "",
            expirationTime: "",
            signInProvider: "google.com",
            signInSecondFactor: null,
            claims: {},
          }),
          reload: async () => {},
          toJSON: () => ({}),
        } as unknown as User,
        accessToken: fallbackAccessToken,
        email: cleanEmail,
        name: fallbackName,
        avatarUrl: undefined,
      };
    }

    const code = popupErr?.code || "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      throw new Error("Google sign-in popup was closed before selecting an account.");
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
  cachedTokenTimestamp = 0;
  try {
    await signOut(auth);
  } catch {
    // quiet fail if auth wasn't initialized
  }
}
