const KEY = "ml-notification-reads";

export function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

export function markRead(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getReadIds();
    ids.forEach((id) => existing.add(id));
    // Cap at 1000 entries to prevent unbounded growth
    const arr = [...existing].slice(-1000);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}
