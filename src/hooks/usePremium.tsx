import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Tier = "free" | "premium" | "deluxe";

/**
 * Premium access comes from either a paid plan (subscription_tier) or an
 * unexpired month redeemed with reward points (premium_until).
 */
export function usePremium() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("free");
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTier("free");
      setPremiumUntil(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_profiles_ext")
      .select("subscription_tier, premium_until")
      .eq("user_id", user.id)
      .maybeSingle();
    setTier((data?.subscription_tier as Tier) ?? "free");
    setPremiumUntil((data?.premium_until as string | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const paid = tier === "premium" || tier === "deluxe";
  const pointsMonthActive = Boolean(premiumUntil && new Date(premiumUntil).getTime() > Date.now());

  return {
    tier,
    loading,
    isPremium: paid || pointsMonthActive,
    /** Set when premium came from redeemed reward points rather than a plan. */
    premiumUntil: pointsMonthActive ? premiumUntil : null,
    source: paid ? ("plan" as const) : pointsMonthActive ? ("points" as const) : ("none" as const),
    refresh,
  };
}
