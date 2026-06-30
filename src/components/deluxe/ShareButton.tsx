import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
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
 * Share button with Web Share API + clipboard fallback. Use anywhere we want a
 * deep link out of the app (workouts, muscle pages, profile, etc.).
 */
export function ShareButton({ title, text, url, className, label = "Share" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const resolveUrl = () => {
    if (typeof window === "undefined") return url ?? "";
    if (!url) return window.location.href;
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  };

  const onClick = async () => {
    haptic("selection");
    const shareUrl = resolveUrl();
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && "share" in nav) {
      try {
        await (nav as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title,
          text,
          url: shareUrl,
        });
        haptic("success");
        return;
      } catch {
        /* user cancelled or share unavailable — fall through to copy */
      }
    }
    try {
      await nav?.clipboard?.writeText(shareUrl);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      haptic("error");
    }
  };

  return (
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
  );
}
