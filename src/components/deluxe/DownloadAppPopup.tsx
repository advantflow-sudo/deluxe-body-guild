import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GoldButton, OutlineButton } from "./ui";
import { Apple, Smartphone } from "lucide-react";

// TODO: replace with your real store URLs
const APP_STORE_URL = "https://apps.apple.com/app/idYOUR_APP_ID";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=YOUR.PACKAGE.NAME";

const STORAGE_KEY = "df_download_popup_dismissed_at";
const SHOW_AFTER_MS = 4000; // delay before first appearance
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // re-show after 7 days

export function DownloadAppPopup() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Only show on marketing/public pages
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

  const dismiss = (o: boolean) => {
    setOpen(o);
    if (!o) localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent className="border-gold/30 bg-deluxe-black text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight text-gold">
            Get the Deluxe Fitness app
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/70">
            Take your training, coach, and rewards with you. Download free on iOS and Android.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-3">
          <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
            <GoldButton className="w-full justify-center gap-2">
              <Apple className="h-4 w-4" />
              Download on the App Store
            </GoldButton>
          </a>
          <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
            <OutlineButton className="w-full justify-center gap-2">
              <Smartphone className="h-4 w-4" />
              Get it on Google Play
            </OutlineButton>
          </a>
          <button
            onClick={() => dismiss(false)}
            className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-foreground/50 transition-colors hover:text-gold"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
