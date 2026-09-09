/**
 * Canonical meal record.
 *
 * One record per meal holds the title, ingredients with weights, the nutrition
 * DERIVED from those weights, the method, the image prompt and the validated
 * photo. Every surface (plan cards, cook guide, logging, shopping list) reads
 * from this record, so numbers and pictures can never drift apart.
 */

import { nutritionFromIngredients, type IngredientLike } from "@/lib/foods";
import { selectMealPhoto, type MealPhoto } from "@/config/meal-photos";

export interface RawMeal {
  name: string;
  slot: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_minutes: number;
  ingredients: IngredientLike[];
  steps: string[];
  logged?: boolean;
}

export interface CanonicalMeal extends RawMeal {
  /** Nutrition computed from the ingredient quantities. */
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** Ingredients we could not price (excluding seasonings). */
  unresolved: string[];
  /** 0–1 share of ingredients priced from the food database. */
  coverage: number;
  /** True when macros are computed, false when we fell back to stated values. */
  derived: boolean;
  foodIds: string[];
  photo: MealPhoto | null;
  /** Prompt describing exactly what the picture must show. */
  imagePrompt: string;
}

/** Below this ingredient coverage we cannot trust a derived total. */
export const MIN_COVERAGE = 0.7;

export function imagePromptFor(meal: RawMeal): string {
  const items = (meal.ingredients ?? [])
    .map((i) => `${i.amount} ${i.item}`.trim())
    .join(", ");
  return `Overhead luxury food photograph of "${meal.name}" containing exactly: ${items}. Dark slate surface, warm gold rim light, no extra foods, no garnish that is not listed.`;
}

/** Build the canonical record for a meal produced by the planner. */
export function canonicalMeal(meal: RawMeal, photoOffset = 0): CanonicalMeal {
  const n = nutritionFromIngredients(meal.ingredients ?? []);
  // Totals may only be presented as calculated when EVERY listed ingredient was
  // measurable and counted. One unmeasured ingredient makes the total untrue.
  const derived = n.unresolved.length === 0 && n.coverage >= MIN_COVERAGE && n.kcal > 0;
  return {
    ...meal,
    kcal: derived ? n.kcal : Math.round(Number(meal.kcal ?? 0)),
    protein_g: derived ? n.protein_g : Number(meal.protein_g ?? 0),
    carbs_g: derived ? n.carbs_g : Number(meal.carbs_g ?? 0),
    fat_g: derived ? n.fat_g : Number(meal.fat_g ?? 0),
    unresolved: n.unresolved,
    coverage: n.coverage,
    derived,
    foodIds: n.visibleFoods,
    photo: selectMealPhoto(n.visibleFoods, photoOffset),
    imagePrompt: imagePromptFor(meal),
  };
}

export interface DayTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function dayTotals(meals: Array<Pick<CanonicalMeal, "kcal" | "protein_g" | "carbs_g" | "fat_g">>): DayTotals {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: Math.round(meals.reduce((s, m) => s + Number(m.kcal ?? 0), 0)),
    protein_g: r1(meals.reduce((s, m) => s + Number(m.protein_g ?? 0), 0)),
    carbs_g: r1(meals.reduce((s, m) => s + Number(m.carbs_g ?? 0), 0)),
    fat_g: r1(meals.reduce((s, m) => s + Number(m.fat_g ?? 0), 0)),
  };
}

export interface DayValidation {
  totals: DayTotals;
  /** Signed percentage difference against the kcal target. */
  kcalDeltaPct: number;
  withinTolerance: boolean;
  message: string;
}

/**
 * Compare the day's real ingredient totals with the member's targets. We report
 * the difference rather than forcing four mechanically identical meals.
 */
export function validateDay(
  meals: Array<Pick<CanonicalMeal, "kcal" | "protein_g" | "carbs_g" | "fat_g">>,
  targetKcal: number,
  tolerancePct = 12,
): DayValidation {
  const totals = dayTotals(meals);
  const target = Math.max(1, targetKcal);
  const kcalDeltaPct = Math.round(((totals.kcal - target) / target) * 1000) / 10;
  const withinTolerance = Math.abs(kcalDeltaPct) <= tolerancePct;
  const message = withinTolerance
    ? `Ingredient totals land within ${tolerancePct}% of your ${target} kcal target.`
    : `${totals.kcal} kcal from the listed ingredients — ${kcalDeltaPct > 0 ? "above" : "below"} your ${target} kcal target by ${Math.abs(kcalDeltaPct)}%. Swap a meal to close the gap.`;
  return { totals, kcalDeltaPct, withinTolerance, message };
}
