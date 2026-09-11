import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import type { Tier } from "@/hooks/usePremium";

const TIER_LABEL: Record<string, string> = {
  essential: "Essential",
  signature: "Signature",
  private: "Private",
};

/**
 * Compact in-page lock for a single card (as opposed to PremiumGate, which
 * gates a whole screen). Keeps the membership matrix honest: the card is
 * visible so members know it exists, but it never runs without the tier.
 */
export function TierLock({
  minTier,
  title,
  description,
}: {
  minTier: Tier;
  title: string;
  description: string;
}) {
  const label = TIER_LABEL[minTier] ?? "Signature";
  return (
    <div className="mt-3 border border-gold/20 bg-deluxe-forest/25 p-4">
      <SectionLabel>{label} membership</SectionLabel>
      <div className="mt-2 flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0">
          <div className="font-display text-base text-foreground">{title}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
          <Link
            to="/pricing"
            className="mt-3 inline-block border border-gold/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold hover:text-deluxe-black"
          >
            View {label}
          </Link>
        </div>
      </div>
    </div>
  );
}
