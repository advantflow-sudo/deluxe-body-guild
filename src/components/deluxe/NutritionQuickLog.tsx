import { useCallback, useEffect, useState } from "react";
import { Apple, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Input } from "@/components/ui/input";

const todayIso = () => new Date().toISOString().slice(0, 10);

interface MealRow { id: string; meal_label: string | null; calories: number }

export function NutritionQuickLog() {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("nutrition_logs")
      .select("id,meal_label,calories")
      .eq("user_id", user.id)
      .eq("log_date", todayIso())
      .order("logged_at", { ascending: false });
    setMeals((data as MealRow[]) ?? []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const add = async () => {
    if (!user) return;
    const cal = parseInt(calories, 10);
    if (!cal || cal <= 0) return toast.error("Enter calories");
    setSaving(true);
    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: user.id,
      log_date: todayIso(),
      meal_label: label.trim() || "Meal",
      calories: cal,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setLabel(""); setCalories("");
    await load();
  };

  const total = meals.reduce((s, m) => s + (m.calories ?? 0), 0);

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-3.5 w-3.5 text-gold" />
          <SectionLabel>Nutrition</SectionLabel>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {total.toLocaleString()} <span className="text-foreground/40">kcal today</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Meal (e.g. lunch)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="bg-deluxe-black/40 border-gold/20 text-foreground placeholder:text-muted-foreground/60"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="kcal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className="w-24 bg-deluxe-black/40 border-gold/20 text-foreground placeholder:text-muted-foreground/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving}
          className="flex h-9 w-9 shrink-0 items-center justify-center bg-gold text-deluxe-black hover:bg-gold-light disabled:opacity-50"
          aria-label="Log meal"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {meals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center justify-between border border-gold/10 bg-deluxe-black/30 px-3 py-2 text-xs">
              <span className="truncate text-foreground">{m.meal_label || "Meal"}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">{m.calories} kcal</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
