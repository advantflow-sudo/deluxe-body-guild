import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "df_install_prompt_dismissed_v1";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed / running standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // User previously dismissed (7-day cooldown)
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIos || isAndroid;
    if (!isMobile) return;

    setPlatform(isIos ? "ios" : "android");

    if (isIos) {
      const t = setTimeout(() => setVisible(true), 3500);
      return () => clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (platform === "ios") {
      setShowIosSteps(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") dismiss();
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:hidden">
      <div className="pointer-events-auto mx-auto max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-deluxe-black/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex items-start gap-3 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/5">
            <Download className="h-5 w-5 text-gold" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
              Install the app
            </div>
            <p className="mt-1 text-sm leading-snug text-foreground">
              Add Deluxe Fitness to your home screen for the full app experience.
            </p>

            {showIosSteps ? (
              <ol className="mt-3 space-y-2 text-xs text-foreground/80">
                <li className="flex items-center gap-2">
                  <span className="text-gold">1.</span> Tap
                  <Share className="h-3.5 w-3.5 text-gold" /> in the Safari toolbar
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold">2.</span> Choose
                  <Plus className="h-3.5 w-3.5 text-gold" /> "Add to Home Screen"
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gold">3.</span> Tap "Add" — you're in.
                </li>
              </ol>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={install}
                  className="rounded-lg bg-gold px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-deluxe-black transition hover:bg-gold/90"
                >
                  {platform === "ios" ? "Show me how" : "Install"}
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-lg border border-gold/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/70 transition hover:text-gold"
                >
                  Not now
                </button>
              </div>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground/50 transition hover:bg-gold/10 hover:text-gold"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
