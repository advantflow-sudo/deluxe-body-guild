import { useCallback, useEffect, useState } from "react";
import { Apple, CloudOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Input } from "@/components/ui/input";
import { enqueueOrApply, useOnline, useQueueSize } from "@/lib/offlineQueue";

const todayIso = () => new Date().toISOString().slice(0, 10);

interface MealRow { id: string; meal_label: string | null; calories: number; pending?: boolean }

export function NutritionQuickLog() {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const online = useOnline();
  const queued = useQueueSize();

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("id,meal_label,calories")
      .eq("user_id", user.id)
      .eq("log_date", todayIso())
      .order("logged_at", { ascending: false });
    if (error && online) toast.error(error.message);
    // Preserve any locally-pending rows on top
    setMeals((current) => {
      const pending = current.filter((r) => r.pending);
      return [...pending, ...((data as MealRow[]) ?? [])];
    });
    setLoading(false);
  }, [user, online]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (online && queued === 0 && !loading) {
      // queue drained — clear pending flags
      setMeals((m) => m.filter((r) => !r.pending));
      void load();
    }
  }, [online, queued, loading, load]);

  const add = async () => {
    if (!user) return;
    const cal = parseInt(calories, 10);
    if (!cal || cal <= 0) return toast.error("Enter calories");
    const meal_label = label.trim() || "Meal";
    const tempId = `temp-${Date.now()}`;
    setMeals((m) => [{ id: tempId, meal_label, calories: cal, pending: true }, ...m]);
    setSaving(true);
    const result = await enqueueOrApply({
      kind: "nutritionInsert", userId: user.id, date: todayIso(),
      meal_label, calories: cal,
    });
    setSaving(false);
    if (!result.ok) {
      setMeals((m) => m.filter((r) => r.id !== tempId));
      toast.error(`Couldn't log meal: ${result.error}`);
      return;
    }
    setLabel(""); setCalories("");
    if (result.queued) {
      toast("Saved offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
    } else {
      // Refetch to swap the temp row for the real one
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!user || id.startsWith("temp-")) return;
    const snapshot = meals;
    setMeals((m) => m.filter((r) => r.id !== id));
    setDeletingId(id);
    const result = await enqueueOrApply({ kind: "nutritionDelete", id, userId: user.id });
    setDeletingId(null);
    if (!result.ok) {
      setMeals(snapshot);
      toast.error(`Couldn't remove meal: ${result.error}`);
    } else if (result.queued) {
      toast("Removed offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
    }
  };

  const total = meals.reduce((s, m) => s + (m.calories ?? 0), 0);

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5" aria-labelledby="nutrition-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel id="nutrition-heading">Nutrition</SectionLabel>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" aria-label="Saving meal" />}
          {!online && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Offline — entries queued" />}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums" aria-live="polite">
          {total.toLocaleString()} <span className="text-foreground/40">kcal today</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Meal (e.g. lunch)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
          disabled={saving}
          aria-label="Meal name"
          className="bg-deluxe-black/40 border-gold/20 text-foreground placeholder:text-muted-foreground/60"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="kcal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
          disabled={saving}
          aria-label="Calories"
          className="w-24 bg-deluxe-black/40 border-gold/20 text-foreground placeholder:text-muted-foreground/60"
        />
        <button
          type="button"
          onClick={add}
          disabled={saving}
          aria-label="Log meal"
          className="flex h-9 w-9 shrink-0 items-center justify-center bg-gold text-deluxe-black hover:bg-gold-light disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {loading ? (
        <div className="mt-3 space-y-1.5" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse border border-gold/10 bg-deluxe-black/30" />
          ))}
        </div>
      ) : meals.length > 0 ? (
        <ul className="mt-3 space-y-1.5" aria-label="Meals logged today">
          {meals.map((m) => (
            <li
              key={m.id}
              className={`flex items-center justify-between border border-gold/10 bg-deluxe-black/30 px-3 py-2 text-xs ${m.pending || m.id.startsWith("temp-") ? "opacity-60" : ""}`}
            >
              <span className="truncate text-foreground">{m.meal_label || "Meal"}</span>
              <div className="flex items-center gap-2">
                {m.pending && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Pending sync" />}
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">{m.calories} kcal</span>
                {!m.id.startsWith("temp-") && (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={deletingId === m.id}
                    className="text-muted-foreground/60 hover:text-rose-400 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                    aria-label={`Remove ${m.meal_label ?? "meal"}`}
                  >
                    {deletingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">No meals logged yet</p>
      )}
    </section>
  );
}
