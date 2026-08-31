import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeTargets } from "@/lib/targets";

export interface ScoreDetails {
  workoutCount: number;
  waterMl: number;
  waterTargetMl: number;
  sleepHours: number;
  sleepTargetHours: number;
  mealCount: number;
  totalCalories: number;
  calorieMin: number;
  calorieMax: number;
  goalsCompleted: number;
  goalsTotal: number;
  goalSlots: number;
}

export interface DeluxeScoreBreakdown {
  total: number;
  training: number;
  water: number;
  nutrition: number;
  sleep: number;
  dailyGoals: number;
  loading: boolean;
  refreshing: boolean;
  details: ScoreDetails;
}

// Static parts of the score rubric. Water/calorie targets come from the
// unified engine (src/lib/targets.ts) per user — no more hardcoded 3000 ml.
const SCORE = {
  sleepHours: 7.5,
  goalSlots: 5,
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const todayStart = () => `${todayIso()}T00:00:00`;

const FALLBACK = computeTargets(null);
const EMPTY_DETAILS: ScoreDetails = {
  workoutCount: 0,
  waterMl: 0, waterTargetMl: FALLBACK.waterMl,
  sleepHours: 0, sleepTargetHours: SCORE.sleepHours,
  mealCount: 0, totalCalories: 0,
  calorieMin: Math.round(FALLBACK.kcal * 0.85), calorieMax: Math.round(FALLBACK.kcal * 1.15),
  goalsCompleted: 0, goalsTotal: 0, goalSlots: SCORE.goalSlots,
};

export function useDeluxeScore(): DeluxeScoreBreakdown {
  const { user } = useAuth();
  const [state, setState] = useState<DeluxeScoreBreakdown>({
    total: 0, training: 0, water: 0, nutrition: 0, sleep: 0, dailyGoals: 0,
    loading: true, refreshing: false, details: EMPTY_DETAILS,
  });
  const lastStreakDay = useRef<string | null>(null);

  const fetchScores = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setState((s) => ({ ...s, refreshing: true }));
    const today = todayIso();
    const [dailyRes, workoutsRes, nutritionRes, habitsRes, habitLogsRes, extRes] = await Promise.all([
      supabase.from("daily_stats").select("water_ml,sleep_hours").eq("user_id", user.id).eq("stat_date", today).maybeSingle(),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).not("completed_at", "is", null).gte("completed_at", todayStart()),
      supabase.from("nutrition_logs").select("calories").eq("user_id", user.id).eq("log_date", today),
      supabase.from("habits").select("id").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("log_date", today),
      supabase.from("user_profiles_ext").select("weight_kg,height_cm,age,fitness_goal").eq("user_id", user.id).maybeSingle(),
    ]);

    // Unified per-user targets (audit M2).
    const t = computeTargets(extRes.data ?? null);
    const calorieMin = Math.round(t.kcal * 0.85);
    const calorieMax = Math.round(t.kcal * 1.15);

    const waterMl = (dailyRes.data?.water_ml as number | undefined) ?? 0;
    const sleepHours = Number(dailyRes.data?.sleep_hours ?? 0);
    const workoutCount = workoutsRes.data?.length ?? 0;
    const meals = nutritionRes.data ?? [];
    const totalCalories = meals.reduce((s, r) => s + (r.calories ?? 0), 0);

    const training = workoutCount > 0 ? 20 : 0;
    const water = Math.min(10, Math.round((waterMl / t.waterMl) * 10));
    const sleep = Math.min(15, Math.round((sleepHours / SCORE.sleepHours) * 15));
    const nutrition = meals.length === 0 ? 0
      : (totalCalories >= calorieMin && totalCalories <= calorieMax ? 15 : 10);

    const habitIds = new Set((habitsRes.data ?? []).map((h) => h.id));
    const completed = new Set(
      (habitLogsRes.data ?? []).map((l) => l.habit_id).filter((id) => habitIds.has(id))
    );
    const goalsCompleted = Math.min(SCORE.goalSlots, completed.size);
    const goalsTotal = Math.min(SCORE.goalSlots, habitIds.size);
    const dailyGoals = goalsCompleted * 8;

    const total = training + water + nutrition + sleep + dailyGoals;

    setState({
      total, training, water, nutrition, sleep, dailyGoals,
      loading: false, refreshing: false,
      details: {
        workoutCount, waterMl, waterTargetMl: t.waterMl,
        sleepHours, sleepTargetHours: SCORE.sleepHours,
        mealCount: meals.length, totalCalories,
        calorieMin: calorieMin, calorieMax: calorieMax,
        goalsCompleted, goalsTotal, goalSlots: SCORE.goalSlots,
      },
    });

    // Streak: touch once per day when there's any progress
    if (total > 0 && lastStreakDay.current !== today) {
      lastStreakDay.current = today;
      await supabase.rpc("touch_streak");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchScores(true);

    const filter = `user_id=eq.${user.id}`;
    const ch = supabase
      .channel(`deluxe-score-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_stats", filter }, () => fetchScores(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_sessions", filter }, () => fetchScores(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_logs", filter }, () => fetchScores(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "habit_logs", filter }, () => fetchScores(true))
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, fetchScores]);

  return state;
}
