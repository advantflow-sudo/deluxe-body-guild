import { useState } from "react";
import { Share2, Check, Copy, Instagram, Music2, X as XIcon, MessageCircle } from "lucide-react";
import { haptic } from "@/hooks/useHaptics";

interface ShareButtonProps {
  title?: string;
  text?: string;
  /** Absolute or relative URL. Relative is resolved against window.location.origin. */
  url?: string;
  className?: string;
  label?: string;
}

/**
 * Share button with Web Share API + clipboard fallback + premium picker
 * for Instagram, TikTok, X, and WhatsApp deep links.
 */
export function ShareButton({ title, text, url, className, label = "Share" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const resolveUrl = () => {
    if (typeof window === "undefined") return url ?? "";
    if (!url) return window.location.href;
    try { return new URL(url, window.location.origin).toString(); } catch { return url; }
  };

  const copy = async (shareUrl: string) => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      haptic("error");
    }
  };

  const onClick = async () => {
    haptic("selection");
    const shareUrl = resolveUrl();
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && "share" in nav) {
      try {
        await (nav as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title, text, url: shareUrl });
        haptic("success");
        return;
      } catch { /* fall through to picker */ }
    }
    setOpen(true);
  };

  const shareUrl = typeof window !== "undefined" ? resolveUrl() : "";
  const enc = encodeURIComponent;
  const msg = `${text ?? title ?? "Check this out on Deluxe Fitness"} ${shareUrl}`.trim();

  const openExternal = (href: string) => {
    haptic("selection");
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/10"
        }
        aria-label={label}
      >
        {copied ? <Check className="h-4 w-4" /> : url ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Link copied" : label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-gold/30 bg-deluxe-black/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gold/15 px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
              Share
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 py-5">
              <ShareTile
                icon={<Instagram className="h-5 w-5" />}
                label="Instagram"
                onClick={async () => {
                  await copy(shareUrl);
                  openExternal("https://www.instagram.com/");
                }}
              />
              <ShareTile
                icon={<Music2 className="h-5 w-5" />}
                label="TikTok"
                onClick={async () => {
                  await copy(shareUrl);
                  openExternal("https://www.tiktok.com/upload");
                }}
              />
              <ShareTile
                icon={<XIcon className="h-5 w-5" />}
                label="X"
                onClick={() => openExternal(`https://twitter.com/intent/tweet?text=${enc(msg)}`)}
              />
              <ShareTile
                icon={<MessageCircle className="h-5 w-5" />}
                label="WhatsApp"
                onClick={() => openExternal(`https://wa.me/?text=${enc(msg)}`)}
              />
            </div>
            <div className="border-t border-gold/15 p-3">
              <button
                onClick={async () => { await copy(shareUrl); setOpen(false); }}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-gold/20 bg-deluxe-forest/30 px-4 py-3 text-left text-xs text-foreground transition hover:border-gold/50"
              >
                <span className="truncate">{shareUrl}</span>
                <Copy className="h-4 w-4 shrink-0 text-gold" />
              </button>
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Instagram & TikTok auto-copy the link
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShareTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-gold/15 bg-deluxe-forest/20 px-2 py-3 text-[10px] uppercase tracking-[0.2em] text-foreground transition hover:border-gold/40 hover:bg-gold/10"
    >
      <span className="text-gold">{icon}</span>
      {label}
    </button>
  );
}
