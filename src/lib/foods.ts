/**
 * Ingredient nutrition database + amount parser.
 *
 * This is the factual basis of every meal in the plan: calories and macros are
 * DERIVED from the listed ingredient quantities. Nothing is ever back-filled to
 * make four meals add up to the daily target.
 *
 * Values are per 100 g of the stated basis (raw unless noted) and come from
 * standard UK food composition figures, rounded to whole numbers.
 */

export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  /** Canonical id, also used as the "visible food" tag for image validation. */
  id: string;
  /** Lower-case match terms, longest-first matching is applied automatically. */
  keys: string[];
  per100g: Per100g;
  /** Grams for one countable unit ("1 egg", "2 slices", "1 scoop"). */
  gramsPerUnit?: number;
  /** Grams in one tablespoon (defaults to 15 g). */
  gramsPerTbsp?: number;
}

/* ------------------------------------------------------------------ */
/* Database                                                            */
/* ------------------------------------------------------------------ */

export const FOODS: FoodEntry[] = [
  // Poultry / meat / fish (raw weights)
  { id: "chicken", keys: ["chicken breast", "chicken thigh", "chicken"], per100g: { kcal: 120, protein: 23, carbs: 0, fat: 2.6 } },
  { id: "turkey", keys: ["turkey mince", "turkey breast", "turkey"], per100g: { kcal: 110, protein: 24, carbs: 0, fat: 1.5 } },
  { id: "beef-mince", keys: ["beef mince", "minced beef", "lean mince", "mince"], per100g: { kcal: 176, protein: 20, carbs: 0, fat: 10 } },
  { id: "steak", keys: ["sirloin steak", "rump steak", "steak", "beef fillet"], per100g: { kcal: 190, protein: 22, carbs: 0, fat: 11 } },
  { id: "lamb", keys: ["lamb"], per100g: { kcal: 235, protein: 20, carbs: 0, fat: 17 } },
  { id: "pork", keys: ["pork loin", "pork"], per100g: { kcal: 165, protein: 22, carbs: 0, fat: 8 } },
  { id: "salmon", keys: ["salmon"], per100g: { kcal: 200, protein: 21, carbs: 0, fat: 13 } },
  { id: "white-fish", keys: ["cod", "haddock", "sea bass", "white fish", "pollock"], per100g: { kcal: 82, protein: 18, carbs: 0, fat: 0.7 } },
  { id: "tuna", keys: ["tuna"], per100g: { kcal: 116, protein: 26, carbs: 0, fat: 1 } },
  { id: "prawns", keys: ["prawns", "prawn", "shrimp"], per100g: { kcal: 85, protein: 20, carbs: 0, fat: 0.5 } },

  // Eggs & dairy
  { id: "egg", keys: ["egg white", "eggs", "egg"], per100g: { kcal: 143, protein: 13, carbs: 1, fat: 10 }, gramsPerUnit: 50 },
  { id: "greek-yogurt", keys: ["greek yogurt", "greek yoghurt", "0% yogurt", "yogurt", "yoghurt"], per100g: { kcal: 57, protein: 10, carbs: 4, fat: 0.4 } },
  { id: "cottage-cheese", keys: ["cottage cheese"], per100g: { kcal: 98, protein: 11, carbs: 3, fat: 4 } },
  { id: "milk", keys: ["semi-skimmed milk", "skimmed milk", "whole milk", "milk"], per100g: { kcal: 50, protein: 3.5, carbs: 4.8, fat: 1.8 } },
  { id: "cheese", keys: ["cheddar", "parmesan", "cheese"], per100g: { kcal: 402, protein: 25, carbs: 1, fat: 33 } },
  { id: "feta", keys: ["feta", "halloumi"], per100g: { kcal: 264, protein: 17, carbs: 2, fat: 21 } },
  { id: "whey", keys: ["whey protein", "protein powder", "whey", "casein"], per100g: { kcal: 380, protein: 78, carbs: 6, fat: 5 }, gramsPerUnit: 30 },

  // Grains, starch, bread (raw/dry unless noted)
  { id: "rice", keys: ["basmati rice", "jasmine rice", "white rice", "brown rice", "rice"], per100g: { kcal: 355, protein: 7, carbs: 78, fat: 1 } },
  { id: "pasta", keys: ["penne", "spaghetti", "linguine", "macaroni", "pasta"], per100g: { kcal: 358, protein: 12, carbs: 71, fat: 1.5 } },
  { id: "oats", keys: ["porridge oats", "rolled oats", "oats"], per100g: { kcal: 379, protein: 13, carbs: 60, fat: 8 } },
  { id: "bread", keys: ["sourdough", "wholemeal bread", "bread", "toast", "bagel", "wrap", "tortilla"], per100g: { kcal: 258, protein: 10, carbs: 45, fat: 3 }, gramsPerUnit: 40 },
  { id: "potato", keys: ["baby potatoes", "new potatoes", "sweet potato", "potato", "potatoes"], per100g: { kcal: 77, protein: 2, carbs: 17, fat: 0.1 } },
  { id: "quinoa", keys: ["quinoa"], per100g: { kcal: 368, protein: 14, carbs: 64, fat: 6 } },
  { id: "couscous", keys: ["couscous"], per100g: { kcal: 376, protein: 13, carbs: 77, fat: 0.6 } },
  { id: "noodles", keys: ["rice noodles", "egg noodles", "noodles"], per100g: { kcal: 348, protein: 10, carbs: 74, fat: 1 } },

  // Legumes & plant protein
  { id: "tofu", keys: ["tofu", "tempeh"], per100g: { kcal: 144, protein: 16, carbs: 3, fat: 8 } },
  { id: "lentils", keys: ["lentils", "red lentils"], per100g: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 } },
  { id: "chickpeas", keys: ["chickpeas", "black beans", "kidney beans", "beans"], per100g: { kcal: 120, protein: 7, carbs: 18, fat: 2 } },

  // Vegetables & fruit
  { id: "broccoli", keys: ["broccoli", "tenderstem"], per100g: { kcal: 34, protein: 2.8, carbs: 4, fat: 0.4 } },
  { id: "green-beans", keys: ["green beans", "runner beans"], per100g: { kcal: 31, protein: 1.8, carbs: 5, fat: 0.2 } },
  { id: "asparagus", keys: ["asparagus"], per100g: { kcal: 20, protein: 2.2, carbs: 2, fat: 0.2 } },
  { id: "spinach", keys: ["spinach", "kale", "rocket", "salad leaves", "mixed leaves", "lettuce"], per100g: { kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4 } },
  { id: "tomato", keys: ["cherry tomatoes", "chopped tomatoes", "passata", "tomato"], per100g: { kcal: 20, protein: 1, carbs: 3.5, fat: 0.2 } },
  { id: "pepper", keys: ["red pepper", "bell pepper", "peppers", "pepper"], per100g: { kcal: 26, protein: 1, carbs: 5, fat: 0.3 } },
  { id: "onion", keys: ["red onion", "onion", "shallot", "garlic"], per100g: { kcal: 40, protein: 1.1, carbs: 8, fat: 0.1 } },
  { id: "courgette", keys: ["courgette", "zucchini", "aubergine", "mushroom", "mushrooms", "carrot", "cucumber", "peas"], per100g: { kcal: 30, protein: 2, carbs: 4, fat: 0.3 } },
  { id: "avocado", keys: ["avocado"], per100g: { kcal: 160, protein: 2, carbs: 2, fat: 15 }, gramsPerUnit: 100 },
  { id: "banana", keys: ["banana"], per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, gramsPerUnit: 120 },
  { id: "apple", keys: ["apple"], per100g: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, gramsPerUnit: 150 },
  { id: "berries", keys: ["blueberries", "raspberries", "strawberries", "berries", "mixed berries"], per100g: { kcal: 45, protein: 0.8, carbs: 10, fat: 0.3 } },
  { id: "orange", keys: ["orange", "satsuma", "clementine"], per100g: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 }, gramsPerUnit: 130 },

  // Fats, nuts, extras
  { id: "olive-oil", keys: ["olive oil", "rapeseed oil", "vegetable oil", "oil"], per100g: { kcal: 884, protein: 0, carbs: 0, fat: 100 }, gramsPerTbsp: 14 },
  { id: "butter", keys: ["butter", "ghee"], per100g: { kcal: 744, protein: 0.5, carbs: 0.6, fat: 82 }, gramsPerTbsp: 14 },
  { id: "almonds", keys: ["almonds", "almond"], per100g: { kcal: 579, protein: 21, carbs: 9, fat: 50 } },
  { id: "nuts", keys: ["walnuts", "cashews", "peanuts", "mixed nuts", "nuts"], per100g: { kcal: 607, protein: 20, carbs: 13, fat: 52 } },
  { id: "peanut-butter", keys: ["peanut butter", "almond butter", "nut butter"], per100g: { kcal: 588, protein: 25, carbs: 12, fat: 50 }, gramsPerTbsp: 16 },
  { id: "seeds", keys: ["chia seeds", "flaxseed", "pumpkin seeds", "seeds"], per100g: { kcal: 534, protein: 18, carbs: 20, fat: 42 } },
  { id: "honey", keys: ["honey", "maple syrup"], per100g: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 }, gramsPerTbsp: 21 },
  { id: "dark-chocolate", keys: ["dark chocolate", "cacao", "cocoa"], per100g: { kcal: 546, protein: 8, carbs: 46, fat: 31 } },
  { id: "hummus", keys: ["hummus"], per100g: { kcal: 166, protein: 8, carbs: 14, fat: 10 } },
  { id: "protein-bar", keys: ["protein bar"], per100g: { kcal: 350, protein: 32, carbs: 33, fat: 10 }, gramsPerUnit: 60 },
];

/** Zero-calorie seasonings that never need matching. */
const FREEBIES = [
  "salt", "pepper corn", "black pepper", "seasoning", "spice", "paprika", "cumin", "cinnamon",
  "herbs", "parsley", "coriander", "basil", "oregano", "chilli flakes", "lemon juice", "lime juice",
  "vinegar", "stock cube", "water", "soy sauce", "mustard", "sweetener", "ice",
];

/* ------------------------------------------------------------------ */
/* Amount parsing                                                      */
/* ------------------------------------------------------------------ */

const NUM = /(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+))?/;

/** Convert an ingredient amount string into grams for the matched food. */
export function amountToGrams(amount: string, food?: FoodEntry): number | null {
  const raw = (amount ?? "").toLowerCase().trim();
  if (!raw) return null;

  // Fractions like "1/2 avocado".
  let qty: number | null = null;
  const frac = raw.match(/^(\d+)\s*\/\s*(\d+)/);
  if (frac) qty = Number(frac[1]) / Number(frac[2]);
  else {
    const m = raw.match(NUM);
    if (m) qty = Number(m[1]);
  }
  if (qty === null || Number.isNaN(qty)) return null;

  if (/\bkg\b/.test(raw)) return qty * 1000;
  if (/\b(g|gram|grams|gr)\b/.test(raw)) return qty;
  if (/\b(l|litre|liter)\b/.test(raw)) return qty * 1000;
  if (/\b(ml|millilitre)\b/.test(raw)) return qty; // 1 ml ≈ 1 g for kitchen accuracy
  if (/\btbsp|tablespoon\b/.test(raw)) return qty * (food?.gramsPerTbsp ?? 15);
  if (/\btsp|teaspoon\b/.test(raw)) return qty * ((food?.gramsPerTbsp ?? 15) / 3);
  if (/\bcup\b/.test(raw)) return qty * 150;
  if (/\bhandful\b/.test(raw)) return qty * 30;
  if (/\bscoop\b/.test(raw)) return qty * (food?.gramsPerUnit ?? 30);
  if (/\bslice\b/.test(raw)) return qty * (food?.gramsPerUnit ?? 40);

  // Bare count ("2 eggs", "1 apple").
  if (food?.gramsPerUnit) return qty * food.gramsPerUnit;
  return null;
}

/** Find the database entry for a free-text ingredient name. */
export function matchFood(item: string): FoodEntry | undefined {
  const t = (item ?? "").toLowerCase();
  if (!t) return undefined;
  let best: FoodEntry | undefined;
  let bestLen = 0;
  for (const food of FOODS) {
    for (const key of food.keys) {
      if (t.includes(key) && key.length > bestLen) {
        best = food;
        bestLen = key.length;
      }
    }
  }
  return best;
}

export function isFreebie(item: string): boolean {
  const t = (item ?? "").toLowerCase();
  return FREEBIES.some((f) => t.includes(f));
}

/* ------------------------------------------------------------------ */
/* Nutrition from ingredients                                          */
/* ------------------------------------------------------------------ */

export interface IngredientLike {
  item: string;
  amount: string;
  basis?: string;
}

export interface ResolvedIngredient {
  item: string;
  amount: string;
  grams: number | null;
  foodId: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** True when we could not price this ingredient from the database. */
  unresolved: boolean;
}

export interface IngredientNutrition {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  resolved: ResolvedIngredient[];
  /** Ingredients we could not compute (excluding seasonings). */
  unresolved: string[];
  /** Share of listed ingredients priced from the database, 0–1. */
  coverage: number;
  /** Foods a photo of this meal may legitimately show. */
  visibleFoods: string[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Compute a meal's nutrition strictly from its ingredient quantities. */
export function nutritionFromIngredients(ingredients: IngredientLike[]): IngredientNutrition {
  const resolved: ResolvedIngredient[] = [];
  const unresolved: string[] = [];
  let counted = 0;
  let considered = 0;

  for (const ing of ingredients ?? []) {
    const food = matchFood(ing.item);
    const grams = amountToGrams(ing.amount ?? "", food);
    const freebie = isFreebie(ing.item);
    if (!freebie) considered += 1;

    if (food && grams !== null) {
      const f = grams / 100;
      const row: ResolvedIngredient = {
        item: ing.item,
        amount: ing.amount,
        grams,
        foodId: food.id,
        kcal: food.per100g.kcal * f,
        protein: food.per100g.protein * f,
        carbs: food.per100g.carbs * f,
        fat: food.per100g.fat * f,
        unresolved: false,
      };
      resolved.push(row);
      if (!freebie) counted += 1;
    } else {
      resolved.push({
        item: ing.item,
        amount: ing.amount,
        grams,
        foodId: food?.id ?? null,
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        unresolved: !freebie,
      });
      if (!freebie) unresolved.push(ing.item);
    }
  }

  const sum = (pick: (r: ResolvedIngredient) => number) => resolved.reduce((s, r) => s + pick(r), 0);

  return {
    kcal: Math.round(sum((r) => r.kcal)),
    protein_g: r1(sum((r) => r.protein)),
    carbs_g: r1(sum((r) => r.carbs)),
    fat_g: r1(sum((r) => r.fat)),
    resolved,
    unresolved,
    coverage: considered === 0 ? 0 : counted / considered,
    visibleFoods: Array.from(new Set(resolved.map((r) => r.foodId).filter((x): x is string => Boolean(x)))),
  };
}
