/**
 * Lightweight analytics dispatcher.
 *
 * Forwards events to any installed provider on `window` (gtag, plausible,
 * posthog, fathom) without taking a hard dependency. Also emits a
 * `lovable:analytics` CustomEvent and logs in dev so you can verify wiring.
 */

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: AnalyticsProps }) => void;
    posthog?: { capture: (event: string, props?: AnalyticsProps) => void };
    fathom?: { trackEvent: (event: string, opts?: { _value?: number }) => void };
  }
}

export function track(event: string, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, props);
    window.plausible?.(event, { props });
    window.posthog?.capture(event, props);
    window.fathom?.trackEvent(event);
    window.dispatchEvent(new CustomEvent("lovable:analytics", { detail: { event, props } }));
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props);
    }
  } catch {
    /* swallow — analytics must never break the UI */
  }
}
