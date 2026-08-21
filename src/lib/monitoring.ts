/**
 * Client-side crash/error tracking.
 *
 * Listens for uncaught errors and unhandled promise rejections, forwards a
 * compact report to /api/public/monitoring/report, and mirrors the event into
 * analytics so engagement dashboards see crash rates too.
 */
import { track } from "@/lib/analytics";

const REPORT_URL = "/api/public/monitoring/report";
const MAX_PER_SESSION = 10;
let sent = 0;
let installed = false;
const seen = new Set<string>();

export interface ErrorReport {
  message: string;
  stack?: string;
  severity?: "error" | "fatal" | "warning";
  route?: string;
  extra?: Record<string, unknown>;
}

export function reportError(report: ErrorReport) {
  if (typeof window === "undefined") return;
  if (sent >= MAX_PER_SESSION) return;

  const key = `${report.message}::${(report.stack ?? "").slice(0, 200)}`;
  if (seen.has(key)) return;
  seen.add(key);
  sent += 1;

  const body = JSON.stringify({
    message: report.message.slice(0, 1000),
    stack: report.stack?.slice(0, 4000),
    severity: report.severity ?? "error",
    route: report.route ?? window.location.pathname + window.location.search,
    userAgent: navigator.userAgent,
    release: import.meta.env["VITE_APP_RELEASE"] ?? "production",
    extra: report.extra ?? {},
  });

  track("app_error", { message: report.message.slice(0, 120), severity: report.severity ?? "error" });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(REPORT_URL, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(REPORT_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* monitoring must never break the UI */
  });
}

export function installMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const err = event.error as Error | undefined;
    reportError({
      message: err?.message ?? event.message ?? "Unknown error",
      stack: err?.stack,
      severity: "fatal",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason as unknown;
    const err = reason instanceof Error ? reason : undefined;
    reportError({
      message: err?.message ?? String(reason).slice(0, 300),
      stack: err?.stack,
      severity: "error",
      extra: { type: "unhandledrejection" },
    });
  });
}
