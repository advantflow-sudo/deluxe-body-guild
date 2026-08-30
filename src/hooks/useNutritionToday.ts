import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NutritionEntry {
  id: string;
  meal_label: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

export interface NutritionTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

const empty: NutritionTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0, meals: 0 };
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Single source of truth for "what did I actually eat today" — aggregates every
 * nutrition_logs row regardless of source (meal plan, quick log, food scanner).
 */
export function useNutritionToday() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [totals, setTotals] = useState<NutritionTotals>(empty);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("nutrition_logs")
      .select("id, meal_label, calories, protein_g, carbs_g, fat_g, logged_at")
      .eq("user_id", user.id)
      .eq("log_date", localDate())
      .order("logged_at", { ascending: true });

    const rows: NutritionEntry[] = (data ?? []).map((r) => ({
      id: r.id,
      meal_label: r.meal_label,
      calories: Number(r.calories ?? 0),
      protein_g: Number(r.protein_g ?? 0),
      carbs_g: Number(r.carbs_g ?? 0),
      fat_g: Number(r.fat_g ?? 0),
      logged_at: r.logged_at,
    }));

    setEntries(rows);
    setTotals(
      rows.reduce<NutritionTotals>(
        (acc, r) => ({
          kcal: acc.kcal + r.calories,
          protein: acc.protein + r.protein_g,
          carbs: acc.carbs + r.carbs_g,
          fat: acc.fat + r.fat_g,
          meals: acc.meals + 1,
        }),
        { ...empty },
      ),
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`nutrition-today-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nutrition_logs", filter: `user_id=eq.${user.id}` },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return { entries, totals, loading, refresh };
}
