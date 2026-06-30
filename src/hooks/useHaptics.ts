// Lightweight haptic feedback wrapper around the Web Vibration API.
// Gracefully no-ops on devices that don't support vibration (most desktops,
// iOS Safari). Respects the user's reduce-motion preference.

type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  selection: 5,
  success: [10, 40, 20],
  warning: [20, 60, 20],
  error: [30, 50, 30, 50, 30],
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof navigator === "undefined") return;
  if (prefersReducedMotion()) return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}

export function useHaptics() {
  return { haptic };
}
