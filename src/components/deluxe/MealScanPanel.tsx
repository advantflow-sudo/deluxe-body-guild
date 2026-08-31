import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, ChevronRight, Loader2, RotateCw, Sparkles, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useScanQuota } from "@/hooks/useScanQuota";
import { supabase } from "@/integrations/supabase/client";
import { fileToScaledDataUrl } from "@/lib/imageUtils";
import { reportError } from "@/lib/monitoring";
import { analyzeMeal } from "@/lib/ai.functions";
import { MealScanError, SCAN_FAILURE_COPY, withScanRetry, type ScanFailure } from "@/lib/mealScan";
import { TodayNutritionRings } from "@/components/deluxe/TodayNutritionRings";

export type MealScan = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g?: number;
  portion_estimate?: string;
  confidence: "low" | "medium" | "high";
  items?: string[];
  possible_allergens?: string[];
  uncertainty?: string;
  suggestions?: string[];
  notes?: string;
};

/** Turn a scaled data URL back into a JPEG blob for private storage upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head ?? "")?.[1] ?? "image/jpeg";
  const bin = atob(b64 ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function Btn({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-2 bg-gold-gradient px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function List({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{label}</div>
      <ul className="ml-4 list-disc text-sm text-foreground">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}

/**
 * Food-photo scanner: snap → analyze → review/edit → confirm into nutrition_logs.
 * Photos are stored in the member's private folder; scan quality metadata
 * (confidence, allergens, uncertainty) is persisted with the meal.
 */
export function MealScanPanel({ showRings = true, onSaved }: { showRings?: boolean; onSaved?: () => void } = {}) {
  const fn = useServerFn(analyzeMeal);
  const { user } = useAuth();
  const quota = useScanQuota();
  const [img, setImg] = useState<string | null>(null);
  const [edit, setEdit] = useState<MealScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [scanError, setScanError] = useState<ScanFailure | null>(null);
  const [ringsKey, setRingsKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function analyze(url: string) {
    setEdit(null); setSaved(false); setScanError(null);
    setLoading(true);
    try {
      const r = await withScanRetry(
        () => fn({ data: { imageDataUrl: url, note: note || undefined } }) as Promise<MealScan>,
        {
          attempts: 3,
          onRetry: (attempt, waitMs) =>
            toast.message(`Scanner busy — retrying in ${Math.round(waitMs / 100) / 10}s (attempt ${attempt + 2}/3)`),
        },
      );
      setEdit({ ...r });
      if (r.confidence === "low") {
        toast("I'm not completely sure what this is — please check the foods and portions before saving.");
      }
    } catch (e: any) {
      const kind: ScanFailure = e instanceof MealScanError ? e.kind : "unavailable";
      setScanError(kind);
      reportError({
        message: `meal-scan failed (${kind}): ${e?.message ?? "unknown"}`,
        severity: "error",
        extra: { area: "meal-scan", kind },
      });
    } finally {
      setLoading(false);
    }
  }

  async function onFile(f: File) {
    if (!quota.loading && !quota.canScan) {
      toast.error(`You've used all ${quota.limit} free scans this month — upgrade for unlimited scanning.`);
      return;
    }
    setLoading(true);
    try {
      const url = await fileToScaledDataUrl(f);
      setImg(url);
      await analyze(url);
    } catch (e: any) {
      setScanError("bad_image");
      reportError({
        message: `meal-scan scale failed: ${e?.message ?? "unknown"}`,
        severity: "error",
        extra: { area: "meal-scan", fileKb: Math.round(f.size / 1024), type: f.type },
      });
      setLoading(false);
    }
  }

  async function confirmAndSave() {
    if (!user || !edit || saving || saved) return; // never write the same scan twice
    setSaving(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // Store the photo in the member's own private folder (RLS: uid = folder).
      let photoPath: string | null = null;
      if (img) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const up = await supabase.storage
          .from("meal-photos")
          .upload(path, dataUrlToBlob(img), { contentType: "image/jpeg", upsert: false });
        if (up.error) {
          reportError({ message: `meal-photo upload failed: ${up.error.message}`, severity: "warning", extra: { area: "meal-scan" } });
          toast.message("Photo couldn't be stored — saving the macros only.");
        } else {
          photoPath = path;
        }
      }

      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        log_date: today,
        meal_label: edit.name,
        calories: Math.round(edit.calories),
        protein_g: Math.round(edit.protein_g),
        carbs_g: Math.round(edit.carbs_g),
        fat_g: Math.round(edit.fat_g),
        fibre_g: Math.round(Number(edit.fibre_g ?? 0)),
        source: "scan",
        photo_path: photoPath,
        confidence: edit.confidence ?? null,
        possible_allergens: edit.possible_allergens ?? [],
        uncertainty: edit.uncertainty ?? null,
      });
      if (error) {
        if (photoPath) await supabase.storage.from("meal-photos").remove([photoPath]);
        throw error;
      }
      setSaved(true);
      setRingsKey((k) => k + 1);
      void quota.refresh();
      onSaved?.();
      toast.success("Meal saved to today's nutrition log.");
    } catch (e: any) {
      reportError({ message: `meal-scan save failed: ${e?.message ?? "unknown"}`, severity: "error", extra: { area: "meal-scan" } });
      toast.error("Couldn't save the meal — try again.");
    } finally {
      setSaving(false);
    }
  }

  const num = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0);

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 border border-gold/40 bg-deluxe-black/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground">
          <Upload className="h-3.5 w-3.5" /> {img ? "Retake photo" : "Snap meal photo"}
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. 'large portion')"
          className="min-w-40 flex-1 border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {!quota.loading && !quota.unlimited && (
        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {quota.remaining > 0 ? (
            <>
              {quota.remaining} of {quota.limit} free scans left this month ·{" "}
              <Link to="/pricing" className="text-gold">Go unlimited</Link>
            </>
          ) : (
            <>
              Free scans used up ·{" "}
              <Link to="/pricing" className="text-gold">Upgrade for unlimited</Link>
            </>
          )}
        </p>
      )}
      {img && <img src={img} alt="Meal you just photographed" className="mt-3 max-h-56 border border-gold/20" />}

      {scanError && (
        <div className="mt-3 flex items-start gap-3 border border-red-500/30 bg-red-950/20 p-3" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1 text-[11px] text-muted-foreground">
            <span className="block font-display text-sm text-foreground">{SCAN_FAILURE_COPY[scanError].title}</span>
            {SCAN_FAILURE_COPY[scanError].detail}
          </div>
          {SCAN_FAILURE_COPY[scanError].retryable && img && (
            <button
              onClick={() => void analyze(img)}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 border border-gold/30 bg-deluxe-black/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-gold hover:border-gold/60 disabled:opacity-50"
            >
              <RotateCw className="h-3 w-3" /> Retry scan
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="mt-3 space-y-2" aria-live="polite">
          <div className="text-xs text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin" /> Analyzing your plate…</div>
          <div className="h-2 w-full animate-pulse bg-gold/10" />
        </div>
      )}

      {edit && !loading && (
        <div className="mt-3 border border-gold/15 bg-deluxe-black/50 p-3 text-sm text-foreground">
          {edit.confidence === "low" && (
            <div className="mb-3 border border-amber-400/40 bg-amber-400/10 p-2 text-[11px] text-amber-200">
              Low confidence — review and edit the foods and portions below before saving.
            </div>
          )}
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gold">Meal name</label>
          <input
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            className="mt-1 w-full border border-gold/20 bg-deluxe-black/60 px-3 py-2 font-display text-base text-gold"
          />
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
            {([["kcal", "calories"], ["P (g)", "protein_g"], ["C (g)", "carbs_g"], ["F (g)", "fat_g"], ["Fibre", "fibre_g"]] as const).map(([label, key]) => (
              <div key={key} className="border border-gold/20 p-2">
                <input
                  value={Math.round(Number(edit[key] ?? 0))}
                  onChange={(e) => setEdit({ ...edit, [key]: num(e.target.value) })}
                  inputMode="numeric"
                  className="w-full bg-transparent text-center font-display text-foreground focus:outline-none"
                  aria-label={label}
                />
                <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          {edit.portion_estimate && <div className="mt-2 text-[11px] text-muted-foreground">Portion: {edit.portion_estimate}</div>}
          <div className="mt-1 text-[11px] text-muted-foreground">
            Confidence: {edit.confidence}{edit.items?.length ? ` · ${edit.items.join(", ")}` : ""}
          </div>
          {edit.possible_allergens?.length ? (
            <p className="mt-2 border border-amber-400/30 bg-amber-400/5 p-2 text-[11px] text-amber-200">
              Possible allergens: {edit.possible_allergens.join(", ")}. Photo-based guesswork only — always check the
              actual ingredients if you have an allergy.
            </p>
          ) : null}
          {edit.uncertainty && <p className="mt-2 text-[11px] text-muted-foreground">Hard to judge: {edit.uncertainty}</p>}
          <List label="Suggestions" items={edit.suggestions} />
          {edit.notes && <p className="mt-2 text-[11px] text-muted-foreground">{edit.notes}</p>}
          <p className="mt-2 text-[10px] text-muted-foreground">
            Estimates from one photo — edit anything that looks off before logging. Your photo is stored privately and
            only you can see it.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {saved ? (
              <Link to="/app/nutrition" className="inline-flex items-center gap-2 bg-gold-gradient px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black">
                View in Nutrition <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <Btn onClick={confirmAndSave} loading={saving}>Confirm &amp; log meal</Btn>
            )}
            <button
              onClick={() => { setEdit(null); setImg(null); setSaved(false); }}
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {showRings && (
        <div className="mt-5 border-t border-gold/10 pt-5">
          <TodayNutritionRings key={ringsKey} />
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Every scanned meal lands here instantly
          </p>
        </div>
      )}
    </div>
  );
}
