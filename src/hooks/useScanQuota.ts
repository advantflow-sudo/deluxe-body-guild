import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePremium } from "./usePremium";

/** Free members get a taste of the AI food scanner each month; premium is unlimited. */
export const FREE_SCANS_PER_MONTH = 5;

export function useScanQuota() {
  const { user } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsed(0);
      setLoading(false);
      return;
    }
    const start = new Date();
    start.setDate(1);
    const monthStart = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
    const { count } = await supabase
      .from("nutrition_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("source", "scan")
      .gte("log_date", monthStart);
    setUsed(count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remaining = Math.max(0, FREE_SCANS_PER_MONTH - used);

  return {
    loading: loading || premiumLoading,
    unlimited: isPremium,
    used,
    remaining,
    limit: FREE_SCANS_PER_MONTH,
    canScan: isPremium || remaining > 0,
    refresh,
  };
}
