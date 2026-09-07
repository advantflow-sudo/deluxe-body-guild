import { describe, expect, it } from "vitest";
import { nutritionFromIngredients } from "@/lib/foods";
import { canonicalMeal, dayTotals, validateDay, type RawMeal } from "@/lib/mealPlan";
import { matchingMealPhotos } from "@/config/meal-photos";

const breakfast: RawMeal = {
  name: "Porridge with berries",
  slot: "Breakfast",
  kcal: 999,
  protein_g: 99,
  carbs_g: 99,
  fat_g: 99,
  prep_minutes: 8,
  ingredients: [
    { item: "porridge oats", amount: "80g", basis: "raw" },
    { item: "semi-skimmed milk", amount: "250ml", basis: "n/a" },
    { item: "mixed berries", amount: "100g", basis: "raw" },
    { item: "whey protein", amount: "1 scoop", basis: "n/a" },
  ],
  steps: ["1. Simmer oats in milk for 5 minutes.", "2. Fold in whey and top with berries."],
};

const lunch: RawMeal = {
  name: "Beef mince with rice and broccoli",
  slot: "Lunch",
  kcal: 858,
  protein_g: 60,
  carbs_g: 70,
  fat_g: 20,
  prep_minutes: 20,
  ingredients: [
    { item: "lean beef mince", amount: "180g", basis: "raw" },
    { item: "basmati rice", amount: "90g", basis: "raw" },
    { item: "broccoli", amount: "150g", basis: "raw" },
    { item: "olive oil", amount: "1 tbsp", basis: "n/a" },
    { item: "salt and black pepper", amount: "to taste", basis: "n/a" },
  ],
  steps: ["1. Brown the mince for 6 minutes.", "2. Boil rice 10 minutes, steam broccoli 5."],
};

describe("meal nutrition derives from ingredients", () => {
  it("ignores stated macros and uses ingredient weights", () => {
    const m = canonicalMeal(breakfast);
    expect(m.derived).toBe(true);
    expect(m.kcal).not.toBe(999);
    const n = nutritionFromIngredients(breakfast.ingredients);
    expect(m.kcal).toBe(n.kcal);
    expect(m.protein_g).toBe(n.protein_g);
  });

  it("meal totals equal the sum of its ingredient rows", () => {
    const n = nutritionFromIngredients(lunch.ingredients);
    const sum = n.resolved.reduce((s, r) => s + r.kcal, 0);
    expect(Math.round(sum)).toBe(n.kcal);
    const protein = n.resolved.reduce((s, r) => s + r.protein, 0);
    expect(Math.round(protein * 10) / 10).toBe(n.protein_g);
  });

  it("does not produce four mechanically identical meals", () => {
    const a = canonicalMeal(breakfast);
    const b = canonicalMeal(lunch);
    expect(a.kcal).not.toBe(b.kcal);
  });
});

describe("day totals", () => {
  it("day totals equal the sum of meal totals", () => {
    const meals = [canonicalMeal(breakfast), canonicalMeal(lunch)];
    const totals = dayTotals(meals);
    expect(totals.kcal).toBe(meals[0].kcal + meals[1].kcal);
  });

  it("reports when the day misses the target instead of forcing it", () => {
    const meals = [canonicalMeal(breakfast), canonicalMeal(lunch)];
    const v = validateDay(meals, 4000);
    expect(v.withinTolerance).toBe(false);
    expect(v.message).toContain("below");
  });
});

describe("photo validation", () => {
  it("only offers photos whose visible foods are in the recipe", () => {
    const beef = canonicalMeal(lunch);
    expect(beef.photo?.id).toBe("beef-mince-rice-broccoli");
    for (const p of matchingMealPhotos(beef.foodIds)) {
      for (const food of p.visibleFoods) expect(beef.foodIds).toContain(food);
    }
  });

  it("returns no photo when nothing honest matches", () => {
    const odd = canonicalMeal({
      ...lunch,
      name: "Tofu and quinoa bowl",
      ingredients: [
        { item: "tofu", amount: "200g", basis: "raw" },
        { item: "quinoa", amount: "80g", basis: "raw" },
      ],
    });
    expect(odd.photo).toBeNull();
  });
});
