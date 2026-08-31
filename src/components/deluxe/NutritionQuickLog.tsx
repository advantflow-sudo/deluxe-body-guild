import { useCallback, useEffect, useRef, useState } from "react";
import { Apple, CloudOff, Loader2, Pencil, Plus, ShieldAlert, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Input } from "@/components/ui/input";
import { enqueueOrApply, useOnline, useQueueSize } from "@/lib/offlineQueue";
import { fileToScaledDataUrl } from "@/lib/imageUtils";
import { dataUrlToBlob } from "@/components/deluxe/MealScanPanel";

const todayIso = () => new Date().toISOString().slice(0, 10);

interface MealRow {
  id: string;
  meal_label: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g?: number | null;
  source?: string | null;
  photo_path?: string | null;
  confidence?: string | null;
  possible_allergens?: string[] | null;
  uncertainty?: string | null;
  pending?: boolean;
}

const CONFIDENCE_TONE: Record<string, string> = {
  high: "border-emerald-400/40 text-emerald-300",
  medium: "border-gold/40 text-gold",
  low: "border-amber-400/50 text-amber-200",
};

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
  const [editing, setEditing] = useState<MealRow | null>(null);
  const online = useOnline();
  const queued = useQueueSize();

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("id,meal_label,calories,protein_g,carbs_g,fat_g,fibre_g,source,photo_path,confidence,possible_allergens,uncertainty")
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
    if (editing?.id === id) setEditing(null);
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
                className={`border border-gold/10 bg-deluxe-black/30 px-3 py-2 text-xs ${m.pending || m.id.startsWith("temp-") ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
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
                        {m.fibre_g ? ` · Fibre ${Math.round(Number(m.fibre_g))}g` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.pending && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Pending sync" />}
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">{m.calories} kcal</span>
                    {!m.id.startsWith("temp-") && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(editing?.id === m.id ? null : m)}
                          className="text-muted-foreground/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                          aria-label={`Rescan or edit ${m.meal_label ?? "meal"}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(m.id)}
                          disabled={deletingId === m.id}
                          className="text-muted-foreground/60 hover:text-rose-400 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                          aria-label={`Remove ${m.meal_label ?? "meal"}`}
                        >
                          {deletingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Scanner quality notes travel with the meal so estimates are never mistaken for exact figures. */}
                {(m.confidence || m.possible_allergens?.length || m.uncertainty) && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.source === "scan" && (
                        <span className="border border-gold/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Photo scan</span>
                      )}
                      {m.confidence && (
                        <span className={`border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] ${CONFIDENCE_TONE[m.confidence] ?? "border-gold/25 text-muted-foreground"}`}>
                          {m.confidence} confidence
                        </span>
                      )}
                    </div>
                    {m.possible_allergens?.length ? (
                      <p className="flex items-start gap-1.5 border border-amber-400/30 bg-amber-400/5 p-1.5 text-[10px] text-amber-200">
                        <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                        <span>Possible allergens: {m.possible_allergens.join(", ")} — photo-based guess, always check the real ingredients.</span>
                      </p>
                    ) : null}
                    {m.uncertainty && (
                      <p className="text-[10px] text-muted-foreground/80">Hard to judge: {m.uncertainty}</p>
                    )}
                  </div>
                )}

                {editing?.id === m.id && (
                  <MealEditor
                    meal={m}
                    userId={user?.id ?? ""}
                    online={online}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void load(); onLogged?.(); }}
                  />
                )}
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

/**
 * Rescan / edit an already-logged meal: replaces the private photo and updates
 * the macros on the SAME nutrition_logs row, so nothing is ever duplicated.
 */
function MealEditor({
  meal,
  userId,
  online,
  onClose,
  onSaved,
}: {
  meal: MealRow;
  userId: string;
  online: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(meal.meal_label ?? "Meal");
  const [kcal, setKcal] = useState(String(Math.round(Number(meal.calories ?? 0))));
  const [p, setP] = useState(String(Math.round(Number(meal.protein_g ?? 0))));
  const [c, setC] = useState(String(Math.round(Number(meal.carbs_g ?? 0))));
  const [f, setF] = useState(String(Math.round(Number(meal.fat_g ?? 0))));
  const [fibre, setFibre] = useState(String(Math.round(Number(meal.fibre_g ?? 0))));
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0));

  const save = async () => {
    if (!userId || busy) return;
    if (!online) { toast.error("Reconnect to edit a logged meal."); return; }
    setBusy(true);
    try {
      let photoPath = meal.photo_path ?? null;
      const previousPath = meal.photo_path ?? null;

      if (newPhoto) {
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const up = await supabase.storage
          .from("meal-photos")
          .upload(path, dataUrlToBlob(newPhoto), { contentType: "image/jpeg", upsert: false });
        if (up.error) throw up.error;
        photoPath = path;
      }

      const { error } = await supabase
        .from("nutrition_logs")
        .update({
          meal_label: name.trim() || "Meal",
          calories: num(kcal),
          protein_g: num(p),
          carbs_g: num(c),
          fat_g: num(f),
          fibre_g: num(fibre),
          photo_path: photoPath,
        })
        .eq("id", meal.id)
        .eq("user_id", userId);

      if (error) {
        // Roll the new upload back so a failed edit never leaves an orphan photo.
        if (newPhoto && photoPath && photoPath !== previousPath) {
          await supabase.storage.from("meal-photos").remove([photoPath]);
        }
        throw error;
      }

      // Only bin the old image once the row points at the replacement.
      if (newPhoto && previousPath && previousPath !== photoPath) {
        await supabase.storage.from("meal-photos").remove([previousPath]);
      }
      toast.success("Meal updated.");
      onSaved();
    } catch (e: any) {
      toast.error(`Couldn't update meal: ${e?.message ?? "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border border-gold/20 bg-deluxe-black/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Rescan / edit</span>
        <button type="button" onClick={onClose} aria-label="Close editor" className="text-muted-foreground hover:text-gold">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Meal name"
        className="mt-2 bg-deluxe-black/40 border-gold/20 text-foreground"
      />

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {([
          ["kcal", kcal, setKcal],
          ["P g", p, setP],
          ["C g", c, setC],
          ["F g", f, setF],
          ["Fibre", fibre, setFibre],
        ] as const).map(([lab, val, set]) => (
          <div key={lab}>
            <input
              value={val}
              onChange={(e) => set(e.target.value)}
              inputMode="numeric"
              aria-label={lab}
              className="w-full border border-gold/20 bg-deluxe-black/40 px-1 py-1.5 text-center text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            />
            <div className="mt-0.5 text-center text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{lab}</div>
          </div>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            setNewPhoto(await fileToScaledDataUrl(file));
          } catch {
            toast.error("That photo couldn't be read — try a smaller or brighter shot.");
          }
        }}
      />

      {newPhoto && <img src={newPhoto} alt="Replacement meal photo" className="mt-2 max-h-40 border border-gold/20" />}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 border border-gold/40 bg-deluxe-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground disabled:opacity-50"
        >
          <Upload className="h-3 w-3" /> {meal.photo_path ? "Replace photo" : "Add photo"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-gold-gradient px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin" />} Save changes
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/70">
        Updates the existing entry — no duplicate meals, and the old photo is deleted once the new one is saved.
      </p>
    </div>
  );
}
