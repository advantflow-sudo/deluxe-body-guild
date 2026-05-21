import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Tier = "free" | "premium" | "deluxe";

export function usePremium() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTier("free");
      setLoading(false);
      return;
    }
    supabase
      .from("user_profiles_ext")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setTier(((data?.subscription_tier as Tier) ?? "free"));
        setLoading(false);
      });
  }, [user]);

  return { tier, loading, isPremium: tier === "premium" || tier === "deluxe" };
}
