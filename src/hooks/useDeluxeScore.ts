import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DeluxeScoreBreakdown {
  total: number;
  training: number;
  water: number;
  nutrition: number;
  sleep: number;
  dailyGoals: number;
  waterMl: number;
  sleepHours: number;
  goalsCompleted: number;
  goalsTotal: number;
  loading: boolean;
}

const TARGETS = {
  waterMl: 3000,
  sleepHours: 7.5,
  calorieMin: 1600,
  calorieMax: 2800,
  goalSlots: 5, // up to 5 habits @ 8pts each
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const todayStart = () => `${todayIso()}T00:00:00`;

export function useDeluxeScore(): DeluxeScoreBreakdown {
  const { user } = useAuth();
  const [state, setState] = useState<DeluxeScoreBreakdown>({
    total: 0, training: 0, water: 0, nutrition: 0, sleep: 0, dailyGoals: 0,
    waterMl: 0, sleepHours: 0, goalsCompleted: 0, goalsTotal: 0, loading: true,
  });

  const fetchScores = useCallback(async () => {
    if (!user) return;
    const today = todayIso();
    const [dailyRes, workoutsRes, nutritionRes, habitsRes, habitLogsRes] = await Promise.all([
      supabase.from("daily_stats").select("water_ml,sleep_hours").eq("user_id", user.id).eq("stat_date", today).maybeSingle(),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("completed_at", todayStart()),
      supabase.from("nutrition_logs").select("calories").eq("user_id", user.id).eq("log_date", today),
      supabase.from("habits").select("id").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("log_date", today),
    ]);

    const waterMl = (dailyRes.data?.water_ml as number | undefined) ?? 0;
    const sleepHours = Number(dailyRes.data?.sleep_hours ?? 0);

    const training = (workoutsRes.data?.length ?? 0) > 0 ? 20 : 0;
    const water = Math.min(10, Math.round((waterMl / TARGETS.waterMl) * 10));
    const sleep = Math.min(15, Math.round((sleepHours / TARGETS.sleepHours) * 15));

    const meals = nutritionRes.data ?? [];
    const totalCals = meals.reduce((s, r) => s + (r.calories ?? 0), 0);
    const nutrition = meals.length === 0 ? 0
      : (totalCals >= TARGETS.calorieMin && totalCals <= TARGETS.calorieMax ? 15 : 10);

    const habitIds = new Set((habitsRes.data ?? []).map((h) => h.id));
    const completed = new Set(
      (habitLogsRes.data ?? []).map((l) => l.habit_id).filter((id) => habitIds.has(id))
    );
    const goalsCompleted = Math.min(TARGETS.goalSlots, completed.size);
    const goalsTotal = Math.min(TARGETS.goalSlots, habitIds.size || TARGETS.goalSlots);
    const dailyGoals = goalsCompleted * 8;

    const total = training + water + nutrition + sleep + dailyGoals;

    setState({
      total, training, water, nutrition, sleep, dailyGoals,
      waterMl, sleepHours, goalsCompleted, goalsTotal, loading: false,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchScores();

    const filter = `user_id=eq.${user.id}`;
    const ch = supabase
      .channel(`deluxe-score-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_stats", filter }, fetchScores)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions", filter }, fetchScores)
      .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_logs", filter }, fetchScores)
      .on("postgres_changes", { event: "*", schema: "public", table: "habit_logs", filter }, fetchScores)
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, fetchScores]);

  return state;
}
