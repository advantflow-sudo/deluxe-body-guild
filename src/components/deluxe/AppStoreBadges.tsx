import { Apple, Play } from "lucide-react";

/**
 * App Store + Google Play badge-style buttons.
 * Open in a new tab. Replace hrefs once the apps are listed.
 */
const APP_STORE_URL = "https://apps.apple.com/app/deluxe-fitness/id000000000";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.deluxefitness";

export function AppStoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${className}`}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download on the App Store"
        className="group inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-deluxe-black px-5 py-3 text-left transition hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-8px_rgba(201,168,76,0.55)]"
      >
        <Apple className="h-7 w-7 text-gold" strokeWidth={1.5} />
        <span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Download on the
          </span>
          <span className="block font-display text-lg leading-none text-foreground">
            App Store
          </span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get it on Google Play"
        className="group inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-deluxe-black px-5 py-3 text-left transition hover:border-gold hover:bg-gold/10 hover:shadow-[0_0_24px_-8px_rgba(201,168,76,0.55)]"
      >
        <Play className="h-7 w-7 text-gold" strokeWidth={1.5} />
        <span>
          <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Get it on
          </span>
          <span className="block font-display text-lg leading-none text-foreground">
            Google Play
          </span>
        </span>
      </a>
    </div>
  );
}
