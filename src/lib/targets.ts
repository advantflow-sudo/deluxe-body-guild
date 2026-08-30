/**
 * Unified calculation engine (audit M2) — the single source of truth for
 * daily nutrition/hydration targets and XP award values.
 *
 * Every screen (Water Tracker, Daily XP Mission, Weekly Summary, Deluxe
 * Score, Nutrition plan) MUST derive targets from here instead of hardcoding
 * its own numbers. Previously the app had 4 different water targets
 * (2000/2500/3000/35ml·kg) and 2 protein formulas (1.6 vs 1.8 g/kg).
 */

export interface DailyTargets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

export interface ProfileExtLike {
  weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  fitness_goal?: string | null;
}

export const DEFAULT_WEIGHT_KG = 75;

/** Protein: 1.8 g/kg bodyweight, floor 80g. (Was 1.6 in missions, 1.8 in plans — unified to 1.8.) */
export function proteinTargetG(weightKg: number): number {
  return Math.max(80, Math.round(weightKg * 1.8));
}

/** Water: 35 ml/kg bodyweight, rounded to the nearest 100 ml. */
export function waterTargetMl(weightKg: number): number {
  return Math.round((weightKg * 35) / 100) * 100;
}

/** Full daily targets from the user's profile (Mifflin-St Jeor). */
export function computeTargets(ext: ProfileExtLike | null | undefined): DailyTargets {
  const w = Number(ext?.weight_kg ?? DEFAULT_WEIGHT_KG);
  const h = Number(ext?.height_cm ?? 175);
  const a = Number(ext?.age ?? 30);
  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const goal = String(ext?.fitness_goal ?? "").toLowerCase();
  const factor = goal.includes("lose") || goal.includes("lean") ? 1.35 : goal.includes("muscle") ? 1.65 : 1.5;
  const kcal = Math.round((bmr * factor) / 10) * 10;
  const protein = proteinTargetG(w);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(60, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, waterMl: waterTargetMl(w) };
}

/** Targets when only the user's weight is known. */
export function fallbackTargets(weightKg?: number | null): DailyTargets {
  return computeTargets({ weight_kg: weightKg ?? DEFAULT_WEIGHT_KG });
}

/** Clamp a progress value to a 0–100 percentage. */
export function clampPct(value: number, max = 100): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

/* ------------------------------------------------------------------ */
/* XP awards — mirrors the server-side award_xp / award_mission_xp     */
/* defaults so every UI shows identical values.                        */
/* ------------------------------------------------------------------ */

export interface XpAward {
  /** Base reason used by award_xp. */
  reason: "workout" | "water" | "protein" | "habit";
  /** Mission reason used by award_mission_xp. */
  missionReason: "mission_workout" | "mission_water" | "mission_protein" | "mission_mindset";
  label: string;
  xp: number;
}

export const DAILY_XP_AWARDS: XpAward[] = [
  { reason: "workout", missionReason: "mission_workout", label: "Workout or planned recovery", xp: 50 },
  { reason: "water", missionReason: "mission_water", label: "Hydration target", xp: 20 },
  { reason: "protein", missionReason: "mission_protein", label: "Protein target", xp: 20 },
  { reason: "habit", missionReason: "mission_mindset", label: "Mindset check-in", xp: 10 },
];

export const DAILY_XP_TOTAL = DAILY_XP_AWARDS.reduce((s, a) => s + a.xp, 0);

/** XP rank ladder — mirrors get_xp_summary() thresholds server-side. */
export const XP_RANKS = [
  { name: "Beginner", floor: 0 },
  { name: "Consistent", floor: 800 },
  { name: "Warrior", floor: 2500 },
  { name: "Elite", floor: 6000 },
  { name: "Beast", floor: 12000 },
  { name: "Legend", floor: 25000 },
] as const;
