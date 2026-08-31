/**
 * Food-photo scanner reliability layer.
 *
 * Classifies scanner failures the same way the nutritionist API does
 * (rate limited / out of credits / session expired / unavailable) and retries
 * transient failures with exponential backoff so a single hiccup doesn't lose
 * the member's photo.
 */
export type ScanFailure = "rate_limited" | "out_of_credits" | "session_expired" | "unavailable" | "bad_image";

export class MealScanError extends Error {
  kind: ScanFailure;
  constructor(kind: ScanFailure, message: string) {
    super(message);
    this.kind = kind;
    this.name = "MealScanError";
  }
}

export const SCAN_FAILURE_COPY: Record<ScanFailure, { title: string; detail: string; retryable: boolean }> = {
  rate_limited: {
    title: "Scanner is rate limited",
    detail: "Too many scans in a short window. Retry in a few seconds — your photo is kept.",
    retryable: true,
  },
  out_of_credits: {
    title: "AI credits exhausted",
    detail: "The workspace is out of AI credits. Log the meal manually or top up to scan again.",
    retryable: false,
  },
  session_expired: {
    title: "Your session expired",
    detail: "Sign in again, then rescan the photo.",
    retryable: false,
  },
  unavailable: {
    title: "Scanner is temporarily unavailable",
    detail: "The vision service didn't respond. Retry, or log the macros manually below.",
    retryable: true,
  },
  bad_image: {
    title: "That photo couldn't be read",
    detail: "Take a brighter, closer shot of the whole plate and try again.",
    retryable: false,
  },
};

export function classifyScanError(e: unknown): ScanFailure {
  const msg = (e instanceof Error ? e.message : String(e ?? "")).toLowerCase();
  if (/429|rate limit|too many/.test(msg)) return "rate_limited";
  if (/402|403|credit|quota|policy/.test(msg)) return "out_of_credits";
  if (/401|unauthor|session|sign in|token/.test(msg)) return "session_expired";
  if (/too large|image|decode|4mb|unsupported/.test(msg)) return "bad_image";
  return "unavailable";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run a scan with bounded exponential backoff on transient failures. */
export async function withScanRetry<T>(
  run: () => Promise<T>,
  opts?: { attempts?: number; onRetry?: (attempt: number, waitMs: number) => void },
): Promise<T> {
  const attempts = opts?.attempts ?? 3;
  let lastKind: ScanFailure = "unavailable";
  let lastMessage = "Scan failed.";

  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (e) {
      lastKind = classifyScanError(e);
      lastMessage = e instanceof Error ? e.message : String(e);
      const retryable = lastKind === "rate_limited" || lastKind === "unavailable";
      if (!retryable || i === attempts - 1) break;
      const wait = 700 * 2 ** i + Math.round(Math.random() * 250);
      opts?.onRetry?.(i, wait);
      await sleep(wait);
    }
  }
  throw new MealScanError(lastKind, lastMessage);
}
