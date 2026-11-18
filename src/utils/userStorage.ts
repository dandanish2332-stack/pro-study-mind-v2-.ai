/**
 * User Scoped Storage Manager
 * Guarantees that every student account has completely isolated, separate,
 * and fresh state for all features: tasks, files, notes, lectures, dictionary bookmarks,
 * games progress, streak, calendar, and chat history.
 */
import { UserActivityLog } from "../types";

export function getUserStorageKey(userId: string | undefined, key: string): string {
  const safeId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "_") : "anonymous";
  return `prostudymind_usr_${safeId}_${key}`;
}

export function getUserItem<T>(userId: string | undefined, key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId, key));
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function setUserItem<T>(userId: string | undefined, key: string, value: T): void {
  try {
    localStorage.setItem(getUserStorageKey(userId, key), JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to set user storage item [${key}]:`, e);
  }
}

export function removeUserItem(userId: string | undefined, key: string): void {
  try {
    localStorage.removeItem(getUserStorageKey(userId, key));
  } catch (e) {
    console.warn(`Failed to remove user storage item [${key}]:`, e);
  }
}

export function persistUserKeyToServer(userId: string | undefined, key: string, value: any): void {
  if (!userId) return;
  const payloadState: Record<string, any> = { [key]: value };
  if (key === "games_profile") {
    payloadState.game_profile = value;
  } else if (key === "game_profile") {
    payloadState.games_profile = value;
  }
  fetch("/api/users/save-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, state: payloadState }),
  }).catch(() => {});
}

export function persistUserStateBatchToServer(
  userId: string | undefined,
  statePatch: Record<string, any>
): void {
  if (!userId || !statePatch) return;
  fetch("/api/users/save-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, state: statePatch }),
  }).catch(() => {});
}

export function logUserActivityToServer(payload: {
  userId: string;
  userEmail: string;
  userName?: string;
  feature: UserActivityLog["feature"];
  action: string;
  details: string;
  metadata?: Record<string, any>;
}): void {
  if (!payload.userId) return;
  fetch("/api/logs/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
