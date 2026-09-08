/**
 * Controlled meal photo library.
 *
 * Every photo declares the foods that are VISIBLE on the plate. A photo may
 * only be shown for a meal when each of those foods actually appears in the
 * meal's ingredient list — that is what stops a "beef mince and rice" recipe
 * being illustrated with steak, green beans and fruit.
 *
 * When nothing matches we deliberately return null so the UI can show a
 * proper placeholder instead of an unrelated (or blank) picture.
 */

import eggsAvocadoToast from "@/assets/meals/eggs-avocado-toast.jpg";
import porridgeOats from "@/assets/meals/porridge-oats.jpg";
import yogurtBerries from "@/assets/meals/yogurt-berries.jpg";
import chickenRiceBroccoli from "@/assets/meals/chicken-rice-broccoli.jpg";
import beefMinceRiceBroccoli from "@/assets/meals/beef-mince-rice-broccoli.jpg";
import salmonPotatoAsparagus from "@/assets/meals/salmon-potato-asparagus.jpg";
import pastaMince from "@/assets/meals/pasta-mince.jpg";
import almondsApple from "@/assets/meals/almonds-apple.jpg";
import tunaAvocadoWrap from "@/assets/meals/tuna-avocado-wrap.jpg";
import chickenSweetPotatoBroccoli from "@/assets/meals/chicken-sweetpotato-broccoli.jpg";
import cottageCheeseAppleWalnuts from "@/assets/meals/cottage-cheese-apple-walnuts.jpg";

export interface MealPhoto {
  id: string;
  url: string;
  /** Foods clearly visible in the shot — all must be in the recipe. */
  visibleFoods: string[];
  /** Human description used for alt text. */
  alt: string;
}

export const MEAL_PHOTOS: MealPhoto[] = [
  { id: "eggs-avocado-toast", url: eggsAvocadoToast, visibleFoods: ["egg", "avocado", "bread"], alt: "Eggs with avocado on toast" },
  { id: "porridge-oats", url: porridgeOats, visibleFoods: ["oats"], alt: "Bowl of porridge oats" },
  { id: "yogurt-berries", url: yogurtBerries, visibleFoods: ["greek-yogurt", "berries"], alt: "Greek yogurt with berries" },
  { id: "chicken-rice-broccoli", url: chickenRiceBroccoli, visibleFoods: ["chicken", "rice", "broccoli"], alt: "Chicken breast with rice and broccoli" },
  { id: "beef-mince-rice-broccoli", url: beefMinceRiceBroccoli, visibleFoods: ["beef-mince", "rice", "broccoli"], alt: "Beef mince with rice and broccoli" },
  { id: "salmon-potato-asparagus", url: salmonPotatoAsparagus, visibleFoods: ["salmon", "potato", "asparagus"], alt: "Salmon with potatoes and asparagus" },
  { id: "pasta-mince", url: pastaMince, visibleFoods: ["pasta", "beef-mince"], alt: "Pasta with beef mince sauce" },
  { id: "almonds-apple", url: almondsApple, visibleFoods: ["almonds", "apple"], alt: "Almonds and a fresh apple" },
];

/**
 * All photos whose visible foods are fully present in the recipe, best match
 * (most foods shown) first. Empty when no honest photo exists.
 */
export function matchingMealPhotos(recipeFoodIds: string[]): MealPhoto[] {
  const have = new Set(recipeFoodIds);
  return MEAL_PHOTOS.filter((p) => p.visibleFoods.every((f) => have.has(f))).sort(
    (a, b) => b.visibleFoods.length - a.visibleFoods.length,
  );
}

/** Pick a photo for the recipe; `offset` cycles through valid alternatives. */
export function selectMealPhoto(recipeFoodIds: string[], offset = 0): MealPhoto | null {
  const options = matchingMealPhotos(recipeFoodIds);
  if (options.length === 0) return null;
  return options[((offset % options.length) + options.length) % options.length];
}
