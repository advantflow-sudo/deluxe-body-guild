/**
 * Loads the user's unified daily targets (audit M2 single source of truth):
 * the latest saved meal plan wins; otherwise targets are computed from the
 * profile via src/lib/targets.ts.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeTargets, type DailyTargets, type ProfileExtLike } from "@/lib/targets";

export function useTargets(): { targets: DailyTargets; loading: boolean; ext: ProfileExtLike | null } {
  const { user } = useAuth();
  const [ext, setExt] = useState<ProfileExtLike | null>(null);
  const [targets, setTargets] = useState<DailyTargets>(() => computeTargets(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const [extRes, planRes] = await Promise.all([
        supabase
          .from("user_profiles_ext")
          .select("weight_kg,height_cm,age,fitness_goal")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("meal_plans")
          .select("kcal_target,protein_target_g,carbs_target_g,fat_target_g,water_target_ml")
          .eq("user_id", user.id)
          .order("plan_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const profile = (extRes.data as ProfileExtLike | null) ?? null;
      setExt(profile);
      if (planRes.data) {
        setTargets({
          kcal: Number(planRes.data.kcal_target),
          protein: Number(planRes.data.protein_target_g),
          carbs: Number(planRes.data.carbs_target_g),
          fat: Number(planRes.data.fat_target_g),
          waterMl: Number(planRes.data.water_target_ml) || computeTargets(profile).waterMl,
        });
      } else {
        setTargets(computeTargets(profile));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { targets, loading, ext };
}
