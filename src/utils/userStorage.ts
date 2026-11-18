/**
 * User Scoped Storage Manager
 * Guarantees that every student account has completely isolated, separate,
 * and fresh state for all features: tasks, files, notes, lectures, dictionary bookmarks,
 * games progress, streak, calendar, and chat history.
 */

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
