import { useCallback, useEffect, useState } from "react";
import { Apple, CloudOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Input } from "@/components/ui/input";
import { enqueueOrApply, useOnline, useQueueSize } from "@/lib/offlineQueue";

const todayIso = () => new Date().toISOString().slice(0, 10);

interface MealRow {
  id: string;
  meal_label: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  photo_path?: string | null;
  pending?: boolean;
}

export function NutritionQuickLog({ onLogged }: { onLogged?: () => void } = {}) {
  const { user } = useAuth();
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const online = useOnline();
  const queued = useQueueSize();

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("id,meal_label,calories,protein_g,carbs_g,fat_g,photo_path")
      .eq("user_id", user.id)
      .eq("log_date", todayIso())
      .order("logged_at", { ascending: false });
    if (error && online) toast.error(error.message);
    const rows = (data as MealRow[]) ?? [];
    setMeals((current) => {
      const pending = current.filter((r) => r.pending);
      return [...pending, ...rows];
    });
    // Private bucket: thumbnails need short-lived signed URLs.
    const paths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("meal-photos").createSignedUrls(paths, 3600);
      if (signed) {
        setThumbs((prev) => {
          const next = { ...prev };
          signed.forEach((s) => { if (s.path && s.signedUrl) next[s.path] = s.signedUrl; });
          return next;
        });
      }
    }
    setLoading(false);
  }, [user, online]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (online && queued === 0 && !loading) {
      setMeals((m) => m.filter((r) => !r.pending));
      void load();
    }
  }, [online, queued, loading, load]);

  const add = async () => {
    if (!user) return;
    const cal = parseInt(calories, 10);
    if (!cal || cal <= 0) return toast.error("Enter calories");
    const num = (v: string) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    };
    const p = num(protein);
    const c = num(carbs);
    const f = num(fat);
    const meal_label = label.trim() || "Meal";
    const tempId = `temp-${Date.now()}`;
    setMeals((m) => [
      { id: tempId, meal_label, calories: cal, protein_g: p, carbs_g: c, fat_g: f, pending: true },
      ...m,
    ]);
    setSaving(true);
    const result = await enqueueOrApply({
      kind: "nutritionInsert", userId: user.id, date: todayIso(),
      meal_label, calories: cal, protein_g: p, carbs_g: c, fat_g: f,
    });
    setSaving(false);
    if (!result.ok) {
      setMeals((m) => m.filter((r) => r.id !== tempId));
      toast.error(`Couldn't log meal: ${result.error}`);
      return;
    }
    setLabel(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    onLogged?.();
    if (result.queued) {
      toast("Saved offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
    } else {
      void load();
    }
  };

  const remove = async (id: string) => {
    if (!user || id.startsWith("temp-")) return;
    const snapshot = meals;
    const photoPath = meals.find((r) => r.id === id)?.photo_path ?? null;
    setMeals((m) => m.filter((r) => r.id !== id));
    setDeletingId(id);
    const result = await enqueueOrApply({ kind: "nutritionDelete", id, userId: user.id });
    setDeletingId(null);
    if (!result.ok) {
      setMeals(snapshot);
      toast.error(`Couldn't remove meal: ${result.error}`);
    } else {
      // The meal photo is deleted with the meal — nothing is retained.
      if (photoPath && !result.queued) {
        await supabase.storage.from("meal-photos").remove([photoPath]);
        setThumbs((prev) => {
          const next = { ...prev };
          delete next[photoPath];
          return next;
        });
      }
      onLogged?.();
      if (result.queued) {
        toast("Removed offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
      }
    }
  };

  const totals = meals.reduce(
    (s, m) => ({
      kcal: s.kcal + Number(m.calories ?? 0),
      protein: s.protein + Number(m.protein_g ?? 0),
      carbs: s.carbs + Number(m.carbs_g ?? 0),
      fat: s.fat + Number(m.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5" aria-labelledby="nutrition-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Apple className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel id="nutrition-heading">Quick log</SectionLabel>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" aria-label="Saving meal" />}
          {!online && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Offline — entries queued" />}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums" aria-live="polite">
          {totals.kcal.toLocaleString()} <span className="text-foreground/40">kcal today</span>
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

      <div className="mt-2 grid grid-cols-3 gap-2">
        {([
          ["Protein g", protein, setProtein],
          ["Carbs g", carbs, setCarbs],
          ["Fat g", fat, setFat],
        ] as const).map(([lab, val, set]) => (
          <Input
            key={lab}
            type="number"
            inputMode="decimal"
            placeholder={lab}
            value={val}
            onChange={(e) => set(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
            disabled={saving}
            aria-label={lab}
            className="bg-deluxe-black/40 border-gold/20 text-foreground placeholder:text-muted-foreground/60"
          />
        ))}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/70">
        Macros are optional, but adding them keeps your weekly protein, carb and fat totals accurate.
      </p>

      {loading ? (
        <div className="mt-3 space-y-1.5" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse border border-gold/10 bg-deluxe-black/30" />
          ))}
        </div>
      ) : meals.length > 0 ? (
        <>
          <ul className="mt-3 space-y-1.5" aria-label="Meals logged today">
            {meals.map((m) => (
              <li
                key={m.id}
                className={`flex items-center justify-between gap-2 border border-gold/10 bg-deluxe-black/30 px-3 py-2 text-xs ${m.pending || m.id.startsWith("temp-") ? "opacity-60" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {m.photo_path && thumbs[m.photo_path] ? (
                    <img
                      src={thumbs[m.photo_path]}
                      alt={`Photo of ${m.meal_label ?? "meal"}`}
                      loading="lazy"
                      className="h-9 w-9 shrink-0 border border-gold/20 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <div className="truncate text-foreground">{m.meal_label || "Meal"}</div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
                      P {Math.round(Number(m.protein_g ?? 0))}g · C {Math.round(Number(m.carbs_g ?? 0))}g · F {Math.round(Number(m.fat_g ?? 0))}g
                    </div>
                  </div>
                </div>
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
          <div className="mt-2 flex justify-end gap-3 text-[10px] uppercase tracking-[0.18em] text-gold tabular-nums">
            <span>P {Math.round(totals.protein)}g</span>
            <span>C {Math.round(totals.carbs)}g</span>
            <span>F {Math.round(totals.fat)}g</span>
          </div>
        </>
      ) : (
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">No meals logged yet</p>
      )}
    </section>
  );
}
