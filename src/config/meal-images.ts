import beef from "@/assets/meals/beef.jpg";
import breakfast from "@/assets/meals/breakfast.jpg";
import chickenRice from "@/assets/meals/chicken-rice.jpg";
import fish from "@/assets/meals/fish.jpg";
import salad from "@/assets/meals/salad.jpg";
import snack from "@/assets/meals/snack.jpg";

const RULES: Array<{ img: string; keys: string[] }> = [
  { img: fish, keys: ["salmon", "fish", "tuna", "cod", "prawn", "seafood", "mackerel"] },
  { img: beef, keys: ["beef", "steak", "mince", "lamb", "burger", "bolognese"] },
  { img: chickenRice, keys: ["chicken", "turkey", "rice", "curry", "stir", "pasta", "wrap"] },
  { img: snack, keys: ["shake", "smoothie", "snack", "protein bar", "yogurt bowl", "nuts", "casein"] },
  { img: salad, keys: ["salad", "tofu", "chickpea", "lentil", "vegan", "veggie", "bowl", "halloumi"] },
  { img: breakfast, keys: ["breakfast", "egg", "omelette", "oats", "porridge", "pancake", "toast"] },
];

const SLOT_FALLBACK: Array<{ img: string; keys: string[] }> = [
  { img: breakfast, keys: ["breakfast", "morning"] },
  { img: snack, keys: ["snack", "shake", "pre", "post"] },
  { img: chickenRice, keys: ["lunch"] },
  { img: fish, keys: ["dinner", "evening"] },
];

/** Pick a consistent luxury food image for a meal from its name, ingredients and slot. */
export function mealImage(name: string, slot?: string, ingredients?: Array<{ item: string }>): string {
  const haystack = [name, ...(ingredients ?? []).map((i) => i.item)].join(" ").toLowerCase();
  for (const rule of RULES) if (rule.keys.some((k) => haystack.includes(k))) return rule.img;
  const s = (slot ?? "").toLowerCase();
  for (const rule of SLOT_FALLBACK) if (rule.keys.some((k) => s.includes(k))) return rule.img;
  return chickenRice;
}
