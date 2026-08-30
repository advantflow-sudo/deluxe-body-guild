import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Apple, Beef, Wheat, Droplets, Sparkles, ChefHat, Repeat, MessageCircle,
  Check, Clock, Loader2, BookmarkPlus, Bookmark, Trash2, Flame, Star, Truck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PremiumGate } from "@/components/deluxe/PremiumGate";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { WeeklyNutritionSummary } from "@/components/deluxe/WeeklyNutritionSummary";
import { NutritionQuickLog } from "@/components/deluxe/NutritionQuickLog";
import { mealImage } from "@/config/meal-images";
import { haptic } from "@/hooks/useHaptics";
import { NutritionistErrorBanner } from "@/components/deluxe/NutritionistErrorBanner";
import {
  askNutritionist,
  fallbackGuidance,
  NutritionistError,
  type NutritionistFailure,
} from "@/lib/nutritionist";


export const Route = createFileRoute("/_authenticated/app/nutrition")({
  component: () => (
    <PremiumGate
      feature="AI Nutritionist"
      description="Exact portions, macros, cook instructions and swaps — personalised to your goal."
    >
      <NutritionTab />
    </PremiumGate>
  ),
});

interface Ingredient { item: string; amount: string; basis: "raw" | "cooked" | "n/a" }
interface Meal {
  name: string;
  slot: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_minutes: number;
  ingredients: Ingredient[];
  steps: string[];
  logged?: boolean;
}
interface Plan {
  id?: string;
  kcal_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  water_target_ml: number;
  weight_basis: string;
  meals: Meal[];
  notes?: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

async function streamChat(prompt: string, onRetry?: (attempt: number, waitMs: number) => void) {
  return askNutritionist(prompt, { attempts: 3, onRetry });
}


function extractJson<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Could not read the plan. Please try again.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

// Unified daily targets — single source of truth lives in src/lib/targets.ts (audit M2).
import { computeTargets } from "@/lib/targets";

function NutritionTab() {
  const { user } = useAuth();
  const [ext, setExt] = useState<any>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [swapping, setSwapping] = useState<number | null>(null);
  const [openCook, setOpenCook] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [saved, setSaved] = useState<any[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [apiError, setApiError] = useState<{ kind: NutritionistFailure; detail: string } | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [fallbackAnswer, setFallbackAnswer] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const [extRes, planRes, savedRes] = await Promise.all([
      supabase.from("user_profiles_ext").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("meal_plans").select("*").eq("user_id", user.id).eq("plan_date", today()).maybeSingle(),
      supabase.from("saved_meal_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setExt(extRes.data);
    setSaved(savedRes.data ?? []);
    if (planRes.data) {
      setPlan({ ...(planRes.data as any), meals: (planRes.data as any).meals ?? [] });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const targets = ext ? computeTargets(ext) : null;

  const handleFailure = (e: unknown, retry: () => void) => {
    const kind: NutritionistFailure = e instanceof NutritionistError ? e.kind : "unavailable";
    const detail =
      e instanceof NutritionistError ? e.message : e instanceof Error ? e.message : "Unknown failure.";
    setApiError({ kind, detail });
    setRetryAction(() => retry);
    toast.error(kind === "rate_limited" ? "Nutritionist rate limited" : "Nutritionist unavailable");
  };

  const onRetryNotice = (attempt: number, waitMs: number) => {
    toast.message(`Nutritionist busy — retrying in ${Math.round(waitMs / 100) / 10}s (attempt ${attempt + 1}/3)`);
  };

  const generate = async () => {
    if (!user || !targets) return;
    setGenerating(true);
    setApiError(null);
    try {
      const raw = await streamChat(
        `You are an elite sports nutritionist. Build TODAY's meal plan for a ${ext.age ?? 30}yo ${ext.weight_kg ?? 75}kg ${ext.height_cm ?? 175}cm ${ext.training_level ?? "intermediate"} athlete whose goal is "${ext.fitness_goal ?? "lean muscle"}".
Targets: ${targets.kcal} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat, ${targets.water}ml water.
Return ONLY minified JSON, no markdown, matching:
{"weight_basis":"raw","notes":"short coaching note","meals":[{"name":"","slot":"Breakfast","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"prep_minutes":0,"ingredients":[{"item":"","amount":"120g","basis":"raw"}],"steps":["numbered instruction"]}]}
Rules: exactly 4 meals; every ingredient amount MUST state a unit and whether the weight is raw or cooked; meal macros must sum within 5% of the targets; steps must be timed and numbered; simple UK supermarket ingredients.`,
        onRetryNotice,
      );
      const parsed = extractJson<{ weight_basis: string; notes: string; meals: Meal[] }>(raw);
      const row = {
        user_id: user.id,
        plan_date: today(),
        kcal_target: targets.kcal,
        protein_target_g: targets.protein,
        carbs_target_g: targets.carbs,
        fat_target_g: targets.fat,
        water_target_ml: targets.water,
        weight_basis: parsed.weight_basis ?? "raw",
        meals: parsed.meals as any,
        notes: parsed.notes ?? null,
      };
      const { data, error } = await supabase
        .from("meal_plans")
        .upsert(row, { onConflict: "user_id,plan_date" })
        .select()
        .single();
      if (error) throw error;
      setPlan({ ...(data as any), meals: (data as any).meals ?? [] });
      haptic("success");
      toast.success("Today's meal plan is ready");
    } catch (e: any) {
      handleFailure(e, () => void generate());
    } finally {
      setGenerating(false);
    }
  };

  const persistMeals = async (meals: Meal[]) => {
    if (!plan?.id) return;
    setPlan({ ...plan, meals });
    await supabase.from("meal_plans").update({ meals: meals as any }).eq("id", plan.id);
  };

  const swapMeal = async (index: number) => {
    if (!plan) return;
    const meal = plan.meals[index];
    setSwapping(index);
    setApiError(null);
    try {
      const raw = await streamChat(
        `Replace this meal with a different one that keeps the SAME macro targets (±5%) and the same slot. Preserve exclusions and preferences for goal "${ext?.fitness_goal ?? "lean muscle"}".
Current meal JSON: ${JSON.stringify(meal)}
Return ONLY minified JSON for the single replacement meal in the identical shape, with ingredient amounts stating units and raw/cooked basis.`,
        onRetryNotice,
      );
      const next = extractJson<Meal>(raw);
      const meals = plan.meals.map((m, i) => (i === index ? { ...next, logged: false } : m));
      await persistMeals(meals);
      haptic("success");
      toast.success("Meal swapped — targets preserved");
    } catch (e: any) {
      handleFailure(e, () => void swapMeal(index));
    } finally {
      setSwapping(null);
    }
  };

  const logMeal = async (index: number) => {
    if (!plan || !user) return;
    const meal = plan.meals[index];
    if (meal.logged) return;
    const { error } = await supabase.from("nutrition_logs").insert({
      user_id: user.id,
      log_date: today(),
      meal_label: meal.name,
      calories: Math.round(meal.kcal),
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
    });
    if (error) return toast.error(error.message);
    await persistMeals(plan.meals.map((m, i) => (i === index ? { ...m, logged: true } : m)));
    haptic("success");

    const { data: rows } = await supabase
      .from("nutrition_logs")
      .select("protein_g")
      .eq("user_id", user.id)
      .eq("log_date", today());
    const protein = (rows ?? []).reduce((s, r) => s + Number(r.protein_g ?? 0), 0);
    if (protein >= plan.protein_target_g) {
      await supabase.rpc("award_mission_xp", { _reason: "mission_protein" });
      toast.success("Protein target hit — +20 XP on today's mission");
    } else {
      toast.success(`Logged. ${Math.max(0, Math.round(plan.protein_target_g - protein))}g protein to go`);
    }
  };

  const savePlanToProfile = async () => {
    if (!plan || !user) return;
    const name = window.prompt("Name this plan", `${ext?.fitness_goal ?? "Plan"} · ${plan.kcal_target} kcal`);
    if (!name?.trim()) return;
    setSavingPlan(true);
    const { data, error } = await supabase
      .from("saved_meal_plans")
      .insert({
        user_id: user.id,
        name: name.trim().slice(0, 80),
        kcal_target: plan.kcal_target,
        protein_target_g: plan.protein_target_g,
        carbs_target_g: plan.carbs_target_g,
        fat_target_g: plan.fat_target_g,
        water_target_ml: plan.water_target_ml,
        weight_basis: plan.weight_basis,
        meals: plan.meals as any,
        notes: plan.notes ?? null,
      })
      .select()
      .single();
    setSavingPlan(false);
    if (error) return toast.error(error.message);
    setSaved([data, ...saved]);
    haptic("success");
    toast.success("Saved to your profile");
  };

  const applySaved = async (row: any) => {
    if (!user) return;
    const meals = (row.meals ?? []).map((m: Meal) => ({ ...m, logged: false }));
    const { data, error } = await supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: user.id,
          plan_date: today(),
          kcal_target: row.kcal_target,
          protein_target_g: row.protein_target_g,
          carbs_target_g: row.carbs_target_g,
          fat_target_g: row.fat_target_g,
          water_target_ml: row.water_target_ml,
          weight_basis: row.weight_basis,
          meals: meals as any,
          notes: row.notes,
        },
        { onConflict: "user_id,plan_date" },
      )
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPlan({ ...(data as any), meals: (data as any).meals ?? [] });
    haptic("success");
    toast.success(`"${row.name}" loaded for today`);
  };

  const deleteSaved = async (id: string) => {
    const { error } = await supabase.from("saved_meal_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setSaved(saved.filter((s2) => s2.id !== id));
    toast.success("Removed");
  };

  const ask = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    setFallbackAnswer("");
    setApiError(null);
    try {
      const raw = await streamChat(
        `You are the Deluxe Fitness nutritionist. Member goal: ${ext?.fitness_goal ?? "lean muscle"}. Today's plan: ${JSON.stringify(plan?.meals ?? [])}.
Question: ${question}
Answer in under 120 words. Always state whether weights are raw or cooked. Never give medical advice; suggest a professional where relevant.`,
        onRetryNotice,
      );
      setAnswer(raw.trim());
    } catch (e: any) {
      handleFailure(e, () => void ask());
      setFallbackAnswer(
        fallbackGuidance(question, {
          goal: ext?.fitness_goal ?? null,
          kcal: plan?.kcal_target ?? targets?.kcal ?? 2200,
          protein: plan?.protein_target_g ?? targets?.protein ?? 150,
          carbs: plan?.carbs_target_g ?? targets?.carbs ?? 220,
          fat: plan?.fat_target_g ?? targets?.fat ?? 70,
          water: plan?.water_target_ml ?? targets?.water ?? 2500,
          meals: plan?.meals ?? [],
        }),
      );
    } finally {
      setAsking(false);
    }
  };

  const runRetry = async () => {
    if (!retryAction) return;
    setRetrying(true);
    try {
      await Promise.resolve(retryAction());
    } finally {
      setRetrying(false);
    }
  };


  const askAbout = (meal: Meal) => {
    haptic("selection");
    setQuestion(`About "${meal.name}": `);
    document.getElementById("ask-nutritionist")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };


  const eaten = (plan?.meals ?? []).filter((m) => m.logged);
  const loggedCount = eaten.length;
  const proteinSoFar = eaten.reduce((s, m) => s + Number(m.protein_g ?? 0), 0);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-5 pt-8"><div className="h-64 animate-pulse border border-gold/15 bg-deluxe-forest/10" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Premium • AI Nutritionist</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Today's meal plan</h1>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gold">
        {ext?.fitness_goal ?? "Lean muscle"} plan{plan ? ` · ${plan.weight_basis} weights` : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Exact portions with raw or cooked weights stated, so your macros are never off.
      </p>

      {apiError && (
        <NutritionistErrorBanner
          kind={apiError.kind}
          detail={apiError.detail}
          retrying={retrying || generating || asking || swapping !== null}
          onRetry={retryAction ? () => void runRetry() : undefined}
          onDismiss={() => setApiError(null)}
        />
      )}


      {targets && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroCard icon={<Sparkles className="h-4 w-4" />} label="kcal" value={targets.kcal} />
          <MacroCard icon={<Beef className="h-4 w-4" />} label="Protein" value={`${targets.protein}g`} />
          <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${targets.carbs}g`} />
          <MacroCard icon={<Droplets className="h-4 w-4" />} label="Fat" value={`${targets.fat}g`} />
        </div>
      )}

      {plan && (
        <div className="mt-4 border border-gold/20 bg-deluxe-black/40 p-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>Protein progress · +20 XP at target</span>
            <span className="text-gold">{Math.round(proteinSoFar)} / {plan.protein_target_g}g</span>
          </div>
          <div className="mt-2 h-1 w-full bg-gold/10">
            <div
              className="h-full bg-gold-gradient transition-all duration-500"
              style={{ width: `${Math.min(100, (proteinSoFar / Math.max(1, plan.protein_target_g)) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Weights are <span className="text-gold">{plan.weight_basis}</span> unless a meal says otherwise ·
            hydration target {plan.water_target_ml}ml
          </div>
        </div>
      )}

      {!plan && (
        <div className="mt-6 border border-gold/20 bg-deluxe-forest/20 p-5 text-center">
          <Apple className="mx-auto h-6 w-6 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">
            Generate a personalised plan with exact portions, macros and cook instructions.
          </p>
          <GoldButton onClick={generate} disabled={generating} className="mt-4">
            {generating ? "Building your plan…" : "Build today's plan"}
          </GoldButton>
        </div>
      )}

      {plan?.notes && (
        <p className="mt-5 border-l-2 border-gold pl-3 font-serif text-sm italic text-muted-foreground">
          {plan.notes}
        </p>
      )}

      <div className="mt-5 space-y-6">
        {(plan?.meals ?? []).map((m, i) => {
          const waterPerMeal = plan
            ? Math.round(plan.water_target_ml / Math.max(1, plan.meals.length) / 50) * 50
            : 0;
          const missionPct = plan
            ? Math.min(100, (Number(m.protein_g ?? 0) / Math.max(1, plan.protein_target_g)) * 100)
            : 0;
          return (
            <article key={`${m.name}-${i}`} className="overflow-hidden border border-gold/20 bg-deluxe-forest/15">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={mealImage(m.name, m.slot, m.ingredients)}
                  alt={m.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deluxe-black via-deluxe-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="text-[9px] uppercase tracking-[0.24em] text-gold">{m.slot}</div>
                  <h2 className="mt-1 font-display text-xl text-foreground">{m.name}</h2>
                </div>
                {m.logged && (
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-deluxe-black">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <Chip icon={<Flame className="h-3 w-3" />} label={`${Math.round(m.kcal)} kcal`} />
                  <Chip icon={<Beef className="h-3 w-3" />} label={`${m.protein_g}g protein`} />
                  <Chip icon={<Wheat className="h-3 w-3" />} label={`${m.carbs_g}g carbs`} />
                  <Chip icon={<Droplets className="h-3 w-3" />} label={`${m.fat_g}g fat`} />
                  <Chip icon={<Clock className="h-3 w-3" />} label={`${m.prep_minutes} min`} />
                </div>

                <div className="mt-4 border border-gold/15 bg-deluxe-black/50">
                  <div className="border-b border-gold/10 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                    Ingredients
                  </div>
                  <ul>
                    {(m.ingredients ?? []).map((ing, k) => (
                      <li
                        key={k}
                        className="flex items-baseline justify-between gap-3 border-b border-gold/5 px-3 py-2 text-sm text-foreground last:border-0"
                      >
                        <span>{ing.item}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {ing.amount}
                          {ing.basis && ing.basis !== "n/a" ? (
                            <span className="ml-1 text-[9px] uppercase tracking-[0.16em] text-gold">{ing.basis}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                    {waterPerMeal > 0 && (
                      <li className="flex items-baseline justify-between gap-3 border-t border-gold/10 px-3 py-2 text-sm text-foreground">
                        <span className="flex items-center gap-2">
                          <Droplets className="h-3.5 w-3.5 text-gold" /> Water with meal
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{waterPerMeal} ml</span>
                      </li>
                    )}
                  </ul>
                </div>

                <div className="mt-4 flex items-center gap-3 border border-gold/20 bg-deluxe-black/40 px-3 py-2">
                  <Star className="h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      Protein mission +20 XP
                    </div>
                    <div className="mt-1 h-1 w-full bg-gold/10">
                      <div className="h-full bg-gold-gradient transition-all" style={{ width: `${missionPct}%` }} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { haptic("selection"); setOpenCook(openCook === i ? null : i); }}
                  aria-expanded={openCook === i}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-gold-gradient text-[10px] font-semibold uppercase tracking-[0.24em] text-deluxe-black"
                >
                  <ChefHat className="h-4 w-4" /> {openCook === i ? "Hide instructions" : "Cook this meal"}
                </button>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => swapMeal(i)}
                    disabled={swapping === i}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-gold/30 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10 disabled:opacity-50"
                  >
                    {swapping === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat className="h-3.5 w-3.5" />}
                    Swap meal
                  </button>
                  <button
                    onClick={() => askAbout(m)}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-gold/30 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Ask nutritionist
                  </button>
                </div>

                <button
                  onClick={() => logMeal(i)}
                  disabled={m.logged}
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 border border-gold/20 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:border-gold/50 hover:text-gold disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" /> {m.logged ? "Logged" : "Mark eaten"}
                </button>

                <div className="mt-2 flex items-center justify-center gap-2 border border-dashed border-gold/15 px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-gold/60" /> Deliver this meal · coming soon
                </div>

                {openCook === i && (
                  <ol className="mt-4 space-y-2 border-t border-gold/10 pt-3">
                    {(m.steps ?? []).map((s, k) => (
                      <li key={k} className="flex gap-3 text-sm text-foreground">
                        <span className="font-display text-gold">{k + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </article>
          );
        })}
      </div>


      {plan && (
        <div className="mt-5 flex flex-wrap gap-2">
          <OutlineButton onClick={generate} disabled={generating}>
            {generating ? "Rebuilding…" : "Rebuild plan"}
          </OutlineButton>
          <OutlineButton onClick={savePlanToProfile} disabled={savingPlan}>
            <span className="inline-flex items-center gap-1.5">
              <BookmarkPlus className="h-3.5 w-3.5" />
              {savingPlan ? "Saving…" : "Save to my profile"}
            </span>
          </OutlineButton>
        </div>
      )}

      <NutritionQuickLog onLogged={() => setLogTick((t) => t + 1)} />

      <WeeklyNutritionSummary refreshKey={loggedCount + logTick} />

      {saved.length > 0 && (
        <section className="mt-8">
          <SectionLabel>My saved plans</SectionLabel>
          <ul className="mt-3 space-y-2">
            {saved.map((row) => (
              <li key={row.id} className="flex items-center gap-3 border border-gold/15 bg-deluxe-black/40 p-3">
                <Bookmark className="h-4 w-4 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">{row.name}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {row.kcal_target} kcal · {row.protein_target_g}g protein · {(row.meals ?? []).length} meals
                  </div>
                </div>
                <button
                  onClick={() => applySaved(row)}
                  className="min-h-11 border border-gold/40 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
                >
                  Use today
                </button>
                <button
                  onClick={() => deleteSaved(row.id)}
                  aria-label={`Delete ${row.name}`}
                  className="min-h-11 px-2 text-muted-foreground hover:text-gold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ask the nutritionist */}
      <section id="ask-nutritionist" className="mt-8 border border-gold/20 bg-deluxe-forest/20 p-4">

        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gold" />
          <h2 className="font-display text-lg text-foreground">Ask the nutritionist</h2>
        </div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="Swap the rice for something lower carb? Is 150g chicken raw or cooked?"
          className="mt-3 w-full resize-none border border-gold/20 bg-deluxe-black p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
        />
        <GoldButton onClick={ask} disabled={asking || !question.trim()} className="mt-3 !px-5 !py-2 !text-[10px]">
          {asking ? "Thinking…" : "Ask"}
        </GoldButton>
        {answer && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{answer}</p>}
        {!answer && fallbackAnswer && (
          <div className="mt-3 border border-gold/25 bg-deluxe-black/50 p-3">
            <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Deluxe offline guidance</div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{fallbackAnswer}</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-gold/20 bg-deluxe-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      <span className="text-gold">{icon}</span>
      {label}
    </span>
  );
}


function MacroCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="border border-gold/15 bg-deluxe-black/40 p-3">
      <div className="flex items-center gap-2 text-gold">{icon}</div>
      <div className="mt-2 font-display text-xl text-foreground">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
    </div>
  );
}
