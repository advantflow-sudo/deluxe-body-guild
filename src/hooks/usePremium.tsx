import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Membership tiers. "premium"/"deluxe" are legacy stored values kept for
 * backwards compatibility with rows written before tiers were split out.
 */
export type Tier = "free" | "essential" | "signature" | "private" | "premium" | "deluxe";

/** Canonical tier name for any stored value. */
export function normalizeTier(value: string | null | undefined): Tier {
  switch (value) {
    case "essential":
    case "premium": // legacy: essential was stored as "premium"
      return "essential";
    case "signature":
    case "deluxe": // legacy: signature/private were both stored as "deluxe"
      return "signature";
    case "private":
      return "private";
    default:
      return "free";
  }
}

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  essential: 1,
  premium: 1,
  signature: 2,
  deluxe: 2,
  private: 3,
};

/** Tier granted by the 30-day points membership reward. No subscription is created. */
export const POINTS_REWARD_TIER: Tier = "signature";

/**
 * Access comes from either a paid plan (subscription_tier) or an unexpired
 * 30-day Signature month redeemed with reward points (premium_until).
 */
export function usePremium() {
  const { user } = useAuth();
  const [planTier, setPlanTier] = useState<Tier>("free");
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlanTier("free");
      setPremiumUntil(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_profiles_ext")
      .select("subscription_tier, premium_until")
      .eq("user_id", user.id)
      .maybeSingle();
    setPlanTier(normalizeTier(data?.subscription_tier as string | null));
    setPremiumUntil((data?.premium_until as string | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const paid = TIER_RANK[planTier] > 0;
  const pointsMonthActive = Boolean(premiumUntil && new Date(premiumUntil).getTime() > Date.now());

  // The points reward grants Signature-level access only — never Private.
  const effectiveTier: Tier =
    TIER_RANK[planTier] >= TIER_RANK[POINTS_REWARD_TIER]
      ? planTier
      : pointsMonthActive
        ? POINTS_REWARD_TIER
        : planTier;

  return {
    /** Tier from the paid plan alone. */
    planTier,
    /** Tier that should drive feature access (plan or redeemed month). */
    tier: effectiveTier,
    loading,
    isPremium: paid || pointsMonthActive,
    /** True when the caller's tier meets or exceeds `min`. */
    hasTier: (min: Tier) => TIER_RANK[effectiveTier] >= TIER_RANK[min],
    /** Set when access came from redeemed reward points rather than a plan. */
    premiumUntil: pointsMonthActive ? premiumUntil : null,
    source: paid ? ("plan" as const) : pointsMonthActive ? ("points" as const) : ("none" as const),
    refresh,
  };
}
