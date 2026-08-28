import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Apple, Beef, Wheat, Droplets, Sparkles, ChefHat, Repeat, MessageCircle,
  Check, Clock, Loader2, BookmarkPlus, Bookmark, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PremiumGate } from "@/components/deluxe/PremiumGate";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { WeeklyNutritionSummary } from "@/components/deluxe/WeeklyNutritionSummary";
import { haptic } from "@/hooks/useHaptics";

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

async function streamChat(prompt: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok || !res.body) throw new Error("The nutritionist is unavailable right now.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") return acc;
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content as string | undefined;
        if (c) acc += c;
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  return acc;
}

function extractJson<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Could not read the plan. Please try again.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

function computeTargets(ext: any) {
  const w = Number(ext?.weight_kg ?? 75);
  const h = Number(ext?.height_cm ?? 175);
  const a = Number(ext?.age ?? 30);
  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const goal = String(ext?.fitness_goal ?? "").toLowerCase();
  const factor = goal.includes("lose") || goal.includes("lean") ? 1.35 : goal.includes("muscle") ? 1.65 : 1.5;
  const kcal = Math.round((bmr * factor) / 10) * 10;
  const protein = Math.max(80, Math.round(w * 1.8));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(60, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, water: Math.round((w * 35) / 100) * 100 };
}

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

  const generate = async () => {
    if (!user || !targets) return;
    setGenerating(true);
    try {
      const raw = await streamChat(
        `You are an elite sports nutritionist. Build TODAY's meal plan for a ${ext.age ?? 30}yo ${ext.weight_kg ?? 75}kg ${ext.height_cm ?? 175}cm ${ext.training_level ?? "intermediate"} athlete whose goal is "${ext.fitness_goal ?? "lean muscle"}".
Targets: ${targets.kcal} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat, ${targets.water}ml water.
Return ONLY minified JSON, no markdown, matching:
{"weight_basis":"raw","notes":"short coaching note","meals":[{"name":"","slot":"Breakfast","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"prep_minutes":0,"ingredients":[{"item":"","amount":"120g","basis":"raw"}],"steps":["numbered instruction"]}]}
Rules: exactly 4 meals; every ingredient amount MUST state a unit and whether the weight is raw or cooked; meal macros must sum within 5% of the targets; steps must be timed and numbered; simple UK supermarket ingredients.`,
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
      toast.error(e.message ?? "Could not build your plan");
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
    try {
      const raw = await streamChat(
        `Replace this meal with a different one that keeps the SAME macro targets (±5%) and the same slot. Preserve exclusions and preferences for goal "${ext?.fitness_goal ?? "lean muscle"}".
Current meal JSON: ${JSON.stringify(meal)}
Return ONLY minified JSON for the single replacement meal in the identical shape, with ingredient amounts stating units and raw/cooked basis.`,
      );
      const next = extractJson<Meal>(raw);
      const meals = plan.meals.map((m, i) => (i === index ? { ...next, logged: false } : m));
      await persistMeals(meals);
      haptic("success");
      toast.success("Meal swapped — targets preserved");
    } catch (e: any) {
      toast.error(e.message ?? "Could not swap that meal");
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
    try {
      const raw = await streamChat(
        `You are the Deluxe Fitness nutritionist. Member goal: ${ext?.fitness_goal ?? "lean muscle"}. Today's plan: ${JSON.stringify(plan?.meals ?? [])}.
Question: ${question}
Answer in under 120 words. Always state whether weights are raw or cooked. Never give medical advice; suggest a professional where relevant.`,
      );
      setAnswer(raw.trim());
    } catch (e: any) {
      toast.error(e.message ?? "Could not reach the nutritionist");
    } finally {
      setAsking(false);
    }
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
      <p className="mt-1 text-xs text-muted-foreground">
        Exact portions with raw or cooked weights stated, so your macros are never off.
      </p>

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

      <div className="mt-5 space-y-4">
        {(plan?.meals ?? []).map((m, i) => (
          <article key={`${m.name}-${i}`} className="border border-gold/15 bg-deluxe-forest/15 p-4">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.22em] text-gold">{m.slot}</div>
                <h2 className="mt-0.5 font-display text-lg text-foreground">{m.name}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{Math.round(m.kcal)} kcal</span>
                  <span>P {m.protein_g}g</span>
                  <span>C {m.carbs_g}g</span>
                  <span>F {m.fat_g}g</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.prep_minutes}m</span>
                </div>
              </div>
              {m.logged && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-deluxe-black">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </header>

            <ul className="mt-3 space-y-1">
              {(m.ingredients ?? []).map((ing, k) => (
                <li key={k} className="flex items-baseline justify-between gap-3 text-sm text-foreground">
                  <span>{ing.item}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ing.amount}
                    {ing.basis && ing.basis !== "n/a" ? ` (${ing.basis})` : ""}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-gold/10 pt-3">
              <button
                onClick={() => { haptic("selection"); setOpenCook(openCook === i ? null : i); }}
                aria-expanded={openCook === i}
                className="inline-flex min-h-11 items-center gap-1.5 border border-gold/40 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
              >
                <ChefHat className="h-3.5 w-3.5" /> Cook this meal
              </button>
              <button
                onClick={() => swapMeal(i)}
                disabled={swapping === i}
                className="inline-flex min-h-11 items-center gap-1.5 border border-gold/20 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:border-gold/50 hover:text-gold"
              >
                {swapping === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Repeat className="h-3.5 w-3.5" />}
                Swap meal
              </button>
              <button
                onClick={() => logMeal(i)}
                disabled={m.logged}
                className="inline-flex min-h-11 items-center gap-1.5 border border-gold/20 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:border-gold/50 hover:text-gold disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" /> {m.logged ? "Logged" : "Mark eaten"}
              </button>
            </div>

            {openCook === i && (
              <ol className="mt-3 space-y-2 border-t border-gold/10 pt-3">
                {(m.steps ?? []).map((s, k) => (
                  <li key={k} className="flex gap-3 text-sm text-foreground">
                    <span className="font-display text-gold">{k + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        ))}
      </div>

      <WeeklyNutritionSummary refreshKey={loggedCount} />

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
      <section className="mt-8 border border-gold/20 bg-deluxe-forest/20 p-4">
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
      </section>
    </div>
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
