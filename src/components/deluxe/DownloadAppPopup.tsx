import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Apple, Download, Smartphone, X } from "lucide-react";
import mark from "@/assets/deluxe-mark.webp";

// TODO: replace with your real store URLs
const APP_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=YOUR.PACKAGE.NAME";

const STORAGE_KEY = "df_download_popup_dismissed_at";
const SHOW_AFTER_MS = 4000;
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function DownloadAppPopup() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isAppArea =
    pathname.startsWith("/app") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    if (isAppArea) return;
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - last < COOLDOWN_MS) return;
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [isAppArea]);

  const dismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!open || isAppArea) return null;

  return (
    <div
      role="dialog"
      aria-label="Download the Deluxe Fitness app"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 sm:bottom-6 sm:right-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-deluxe-black/95 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/50 transition hover:bg-gold/10 hover:text-gold"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/30 bg-gold/5">
            <img src={mark} alt="" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/80">
              <Download className="h-3 w-3" />
              Get the App
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              Install Deluxe Fitness for quick access
            </p>
            <p className="mt-0.5 text-xs text-foreground/60">
              Training, coach &amp; rewards on iOS and Android.
            </p>
          </div>
        </div>

        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gold px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition hover:bg-gold/90"
          >
            Download Free
          </button>
        ) : (
          <div className="mt-3 grid gap-2">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition hover:bg-gold/90"
            >
              <Apple className="h-4 w-4" />
              App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold transition hover:bg-gold/10"
            >
              <Smartphone className="h-4 w-4" />
              Google Play
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
