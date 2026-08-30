import beef from "@/assets/meals/beef.jpg";
import breakfast from "@/assets/meals/breakfast.jpg";
import chickenRice from "@/assets/meals/chicken-rice.jpg";
import fish from "@/assets/meals/fish.jpg";
import oats from "@/assets/meals/oats.jpg";
import pasta from "@/assets/meals/pasta.jpg";
import salad from "@/assets/meals/salad.jpg";
import shake from "@/assets/meals/shake.jpg";
import snack from "@/assets/meals/snack.jpg";

/**
 * Keyword → image scoring table.
 *
 * `weight` reflects how strongly a keyword identifies the plate: the main
 * protein/format of the dish scores highest, sides and garnishes lowest. A
 * match in the meal *name* counts triple, so "Beef chilli with rice" picks the
 * beef photo even though rice appears in the ingredient list.
 */
const KEYWORDS: Array<{ img: string; weight: number; keys: string[] }> = [
  // Primary proteins / dish formats
  { img: fish, weight: 10, keys: ["salmon", "tuna", "cod", "mackerel", "sardine", "prawn", "shrimp", "seafood", "haddock", "sea bass", "fish"] },
  { img: beef, weight: 10, keys: ["beef", "steak", "sirloin", "rump", "mince", "lamb", "burger", "bolognese", "chilli", "chili con", "brisket", "venison"] },
  { img: chickenRice, weight: 10, keys: ["chicken", "turkey", "chicken breast", "thigh"] },
  { img: pasta, weight: 10, keys: ["pasta", "penne", "spaghetti", "linguine", "macaroni", "lasagne", "lasagna", "noodle", "ramen"] },
  { img: shake, weight: 10, keys: ["shake", "smoothie", "whey", "casein", "protein powder", "protein drink"] },
  { img: oats, weight: 9, keys: ["oats", "oatmeal", "porridge", "overnight oats", "granola", "muesli"] },
  { img: breakfast, weight: 9, keys: ["egg", "eggs", "omelette", "omelet", "scrambled", "pancake", "french toast", "shakshuka", "breakfast"] },
  { img: salad, weight: 9, keys: ["tofu", "tempeh", "chickpea", "lentil", "falafel", "halloumi", "paneer", "vegan", "salad"] },

  // Secondary / supporting cues
  { img: chickenRice, weight: 4, keys: ["rice", "basmati", "jasmine rice", "curry", "stir fry", "stir-fry", "wrap", "burrito", "fajita"] },
  { img: salad, weight: 3, keys: ["quinoa", "kale", "spinach salad", "rocket", "veggie", "vegetable bowl", "buddha bowl"] },
  { img: snack, weight: 3, keys: ["yogurt", "greek yoghurt", "yoghurt", "cottage cheese", "nuts", "almonds", "protein bar", "snack", "fruit bowl", "berries"] },
  { img: breakfast, weight: 2, keys: ["toast", "sourdough", "bagel", "avocado"] },
  { img: fish, weight: 2, keys: ["sushi", "poke"] },
];

const SLOT_FALLBACK: Array<{ img: string; keys: string[] }> = [
  { img: breakfast, keys: ["breakfast", "morning"] },
  { img: shake, keys: ["shake", "pre-workout", "post-workout", "pre workout", "post workout"] },
  { img: snack, keys: ["snack"] },
  { img: chickenRice, keys: ["lunch", "midday"] },
  { img: fish, keys: ["dinner", "evening", "supper"] },
];

function scoreText(text: string, multiplier: number, scores: Map<string, number>) {
  const t = text.toLowerCase();
  for (const rule of KEYWORDS) {
    for (const key of rule.keys) {
      if (t.includes(key)) {
        scores.set(rule.img, (scores.get(rule.img) ?? 0) + rule.weight * multiplier);
      }
    }
  }
}

/**
 * Pick the food image that best matches the meal's actual ingredients.
 * Name matches weigh 3x, ingredient matches 1x, then slot is used as fallback.
 */
export function mealImage(name: string, slot?: string, ingredients?: Array<{ item: string }>): string {
  const scores = new Map<string, number>();
  scoreText(name ?? "", 3, scores);
  for (const ing of ingredients ?? []) scoreText(ing.item ?? "", 1, scores);

  let best: string | undefined;
  let bestScore = 0;
  for (const [img, score] of scores) {
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  if (best) return best;

  const s = (slot ?? "").toLowerCase();
  for (const rule of SLOT_FALLBACK) if (rule.keys.some((k) => s.includes(k))) return rule.img;
  return chickenRice;
}
