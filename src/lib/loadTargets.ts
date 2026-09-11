/**
 * Single resolver for a member's daily targets, shared by every screen
 * (Home rings, Plan page, Deluxe Score, Water tracker, Weekly summary).
 *
 * Rule: the most recently saved meal plan wins — it is what the member has
 * actually committed to — otherwise targets are computed from the profile.
 * Nothing may derive its own numbers, or pages disagree (3430 vs 2550 kcal).
 */
import { supabase } from "@/integrations/supabase/client";
import { computeTargets, type DailyTargets, type ProfileExtLike } from "@/lib/targets";

export interface ResolvedTargets {
  targets: DailyTargets;
  ext: ProfileExtLike | null;
  /** True when the numbers came from a saved meal plan rather than the profile. */
  fromPlan: boolean;
}

export async function loadTargets(userId: string): Promise<ResolvedTargets> {
  const [extRes, planRes] = await Promise.all([
    supabase
      .from("user_profiles_ext")
      .select("weight_kg,height_cm,age,fitness_goal")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("meal_plans")
      .select("kcal_target,protein_target_g,carbs_target_g,fat_target_g,water_target_ml")
      .eq("user_id", userId)
      .order("plan_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ext = (extRes.data as ProfileExtLike | null) ?? null;
  const computed = computeTargets(ext);
  if (!planRes.data) return { targets: computed, ext, fromPlan: false };

  return {
    ext,
    fromPlan: true,
    targets: {
      kcal: Number(planRes.data.kcal_target) || computed.kcal,
      protein: Number(planRes.data.protein_target_g) || computed.protein,
      carbs: Number(planRes.data.carbs_target_g) || computed.carbs,
      fat: Number(planRes.data.fat_target_g) || computed.fat,
      waterMl: Number(planRes.data.water_target_ml) || computed.waterMl,
    },
  };
}
