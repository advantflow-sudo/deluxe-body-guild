/** Registers the Deluxe service worker for offline caching of the app shell. */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  // Avoid registering in dev (Vite serves modules — SW caching causes stale chunks).
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — offline cache is a progressive enhancement */
    });
  });
}

const RECENT_KEY = "df_recent_workouts_v1";
const MAX = 10;

export interface CachedWorkout {
  id: string;
  title: string;
  type?: string | null;
  level?: string | null;
  cached_at: string;
}

export function cacheRecentWorkout(w: CachedWorkout) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: CachedWorkout[] = raw ? JSON.parse(raw) : [];
    const next = [w, ...list.filter((x) => x.id !== w.id)].slice(0, MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

export function getRecentWorkouts(): CachedWorkout[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
