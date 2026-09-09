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
import beefMinceRiceTeriyaki from "@/assets/meals/beef-mince-rice-teriyaki.jpg";
import chickenPastaTomato from "@/assets/meals/chicken-pasta-tomato.jpg";
import oatsBananaPeanut from "@/assets/meals/oats-banana-peanut.jpg";
import shakeBanana from "@/assets/meals/shake-banana.jpg";
import chickenRice from "@/assets/meals/chicken-rice.jpg";
import fishPlate from "@/assets/meals/fish.jpg";
import saladPlate from "@/assets/meals/salad.jpg";
import breakfastPlate from "@/assets/meals/breakfast.jpg";
import beefPlate from "@/assets/meals/beef.jpg";
import pastaPlate from "@/assets/meals/pasta.jpg";

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
  { id: "tuna-avocado-wrap", url: tunaAvocadoWrap, visibleFoods: ["tuna", "bread", "avocado", "spinach"], alt: "Tuna, avocado and spinach wholemeal wrap" },
  { id: "chicken-sweetpotato-broccoli", url: chickenSweetPotatoBroccoli, visibleFoods: ["chicken", "potato", "broccoli"], alt: "Chicken breast with roasted sweet potato and broccoli" },
  { id: "cottage-cheese-apple-walnuts", url: cottageCheeseAppleWalnuts, visibleFoods: ["cottage-cheese", "apple", "nuts"], alt: "Cottage cheese with sliced apple and walnuts" },
  { id: "beef-mince-rice-teriyaki", url: beefMinceRiceTeriyaki, visibleFoods: ["beef-mince", "rice", "teriyaki-sauce"], alt: "Beef mince and rice bowl with teriyaki glaze" },
  { id: "beef-mince-rice", url: beefMinceRiceTeriyaki, visibleFoods: ["beef-mince", "rice"], alt: "Beef mince served over rice" },
  { id: "chicken-pasta-tomato", url: chickenPastaTomato, visibleFoods: ["chicken", "pasta", "tomato"], alt: "Grilled chicken over penne pasta with tomato sauce" },
  { id: "chicken-pasta", url: chickenPastaTomato, visibleFoods: ["chicken", "pasta"], alt: "Grilled chicken with penne pasta" },
  { id: "oats-banana-peanut", url: oatsBananaPeanut, visibleFoods: ["oats", "banana", "peanut-butter"], alt: "Porridge oats with banana and peanut butter" },
  { id: "oats-banana", url: oatsBananaPeanut, visibleFoods: ["oats", "banana"], alt: "Porridge oats topped with banana" },
  { id: "shake-banana-whey", url: shakeBanana, visibleFoods: ["whey", "banana", "milk"], alt: "Protein shake with banana and milk" },
  { id: "shake-banana", url: shakeBanana, visibleFoods: ["whey", "banana"], alt: "Protein shake with a banana" },
  { id: "shake-whey", url: shakeBanana, visibleFoods: ["whey"], alt: "Protein shake" },
  { id: "chicken-rice", url: chickenRice, visibleFoods: ["chicken", "rice"], alt: "Chicken breast with rice" },
  { id: "salmon-plate", url: fishPlate, visibleFoods: ["salmon"], alt: "Cooked salmon fillet" },
  { id: "white-fish-plate", url: fishPlate, visibleFoods: ["white-fish"], alt: "Cooked white fish fillet" },
  { id: "yogurt-plain", url: yogurtBerries, visibleFoods: ["greek-yogurt"], alt: "Bowl of Greek yogurt" },
  { id: "salad-leaves", url: saladPlate, visibleFoods: ["spinach", "tomato"], alt: "Leafy salad with tomatoes" },
  { id: "eggs-plate", url: breakfastPlate, visibleFoods: ["egg"], alt: "Cooked eggs" },
  { id: "almonds-only", url: almondsApple, visibleFoods: ["almonds"], alt: "Bowl of almonds" },
  { id: "apple-only", url: almondsApple, visibleFoods: ["apple"], alt: "Fresh apple" },
  { id: "oats-only", url: porridgeOats, visibleFoods: ["oats"], alt: "Bowl of porridge oats" },
  { id: "rice-plate", url: chickenRice, visibleFoods: ["rice"], alt: "Bowl of cooked rice" },
  { id: "beef-plate", url: beefPlate, visibleFoods: ["steak"], alt: "Cooked beef steak" },
  { id: "pasta-plate", url: pastaPlate, visibleFoods: ["pasta"], alt: "Bowl of cooked pasta" },
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
