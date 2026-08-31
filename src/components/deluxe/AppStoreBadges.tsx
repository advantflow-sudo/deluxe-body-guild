import { Apple, Play, Smartphone } from "lucide-react";

/**
 * Store availability notice.
 *
 * Deluxe Fitness ships today as an installable web app (PWA) — there are no
 * native App Store / Google Play listings yet, so these are deliberately NOT
 * links. Wire real hrefs only once the listings exist.
 */
export function AppStoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {[
          { icon: Apple, label: "App Store" },
          { icon: Play, label: "Google Play" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="inline-flex items-center gap-3 rounded-xl border border-gold/20 bg-deluxe-black px-5 py-3 text-left opacity-70"
          >
            <Icon className="h-7 w-7 text-gold/70" strokeWidth={1.5} />
            <span>
              <span className="block text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Coming soon to
              </span>
              <span className="block font-display text-lg leading-none text-foreground/80">{label}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5 text-gold" />
        Available today as an installable web app — add it to your home screen.
      </p>
    </div>
  );
}
