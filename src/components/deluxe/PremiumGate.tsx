import { Link } from "@tanstack/react-router";
import { Crown, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { usePremium } from "@/hooks/usePremium";
import { GoldButton, SectionLabel } from "./ui";

interface Props {
  children: ReactNode;
  feature: string;
  description?: string;
}

export function PremiumGate({ children, feature, description }: Props) {
  const { isPremium, loading } = usePremium();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (isPremium) return <>{children}</>;
  return (
    <div className="mx-auto max-w-2xl px-5 pt-12">
      <div className="relative overflow-hidden border border-gold/30 bg-gradient-to-br from-deluxe-forest/40 to-deluxe-black p-8 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gold-gradient/5" />
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-deluxe-black">
            <Crown className="h-6 w-6 text-gold" />
          </div>
          <SectionLabel>Premium feature</SectionLabel>
          <h2 className="mt-3 font-display text-3xl text-foreground">{feature}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            {description ?? "Unlock the full Deluxe experience with a Premium or Deluxe membership."}
          </p>
          <Link to="/pricing" className="mt-6 inline-block">
            <GoldButton>Upgrade now</GoldButton>
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <Lock className="h-3 w-3" /> Restricted to members
          </p>
        </div>
      </div>
    </div>
  );
}
