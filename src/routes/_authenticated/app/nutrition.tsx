import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Apple, Beef, Wheat, Droplets, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PremiumGate } from "@/components/deluxe/PremiumGate";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/nutrition")({
  component: () => (
    <PremiumGate
      feature="Nutrition AI"
      description="Personalised macros, meal blueprints, and shopping lists curated for your goal."
    >
      <NutritionTab />
    </PremiumGate>
  ),
});

function NutritionTab() {
  const { user } = useAuth();
  const [ext, setExt] = useState<any>(null);
  const [plan, setPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_profiles_ext").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setExt(data));
  }, [user]);

  const targets = ext ? computeTargets(ext) : null;

  const generate = async () => {
    if (!ext) return;
    setLoading(true);
    setPlan("");
    try {
      const messages = [{
        role: "user" as const,
        content: `Build a 1-day premium meal plan for a ${ext.age ?? 30}yo, ${ext.weight_kg ?? 75}kg, ${ext.height_cm ?? 175}cm ${ext.training_level ?? "intermediate"} athlete focused on "${ext.fitness_goal ?? "lean muscle"}". Targets: ${targets?.kcal} kcal, P${targets?.protein}g / C${targets?.carbs}g / F${targets?.fat}g. Return 4 meals with macro breakdown and a short shopping list. Use markdown.`,
      }];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok || !res.body) {
        toast.error("Could not generate plan");
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content as string | undefined;
            if (c) { acc += c; setPlan(acc); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <SectionLabel>Premium • Nutrition</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Your daily targets</h1>

      {targets && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroCard icon={<Sparkles className="h-4 w-4" />} label="kcal" value={targets.kcal} />
          <MacroCard icon={<Beef className="h-4 w-4" />} label="Protein" value={`${targets.protein}g`} />
          <MacroCard icon={<Wheat className="h-4 w-4" />} label="Carbs" value={`${targets.carbs}g`} />
          <MacroCard icon={<Droplets className="h-4 w-4" />} label="Fat" value={`${targets.fat}g`} />
        </div>
      )}

      <div className="mt-6 border border-gold/20 bg-deluxe-forest/20 p-5">
        <div className="flex items-center gap-3">
          <Apple className="h-5 w-5 text-gold" />
          <div>
            <div className="font-display text-lg text-foreground">AI meal plan</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Crafted to your profile</div>
          </div>
        </div>
        <GoldButton onClick={generate} disabled={loading || !ext} className="mt-4 w-full">
          {loading ? "Cooking up your plan…" : "Generate today's plan"}
        </GoldButton>
        {plan && (
          <div className="prose prose-invert mt-5 max-w-none whitespace-pre-wrap text-sm text-foreground">
            {plan}
          </div>
        )}
      </div>
      <div className="h-12" />
    </div>
  );
}

function MacroCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="border border-gold/15 bg-deluxe-forest/20 p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span></div>
      <div className="mt-1 font-display text-2xl text-foreground">{value}</div>
    </div>
  );
}

function computeTargets(ext: any) {
  const weight = ext.weight_kg ?? 75;
  const height = ext.height_cm ?? 175;
  const age = ext.age ?? 30;
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const activity = ext.training_level === "advanced" ? 1.7 : ext.training_level === "intermediate" ? 1.55 : 1.4;
  const goal = (ext.fitness_goal ?? "").toLowerCase();
  const adj = goal.includes("loss") || goal.includes("lean") ? -400 : goal.includes("muscle") || goal.includes("bulk") ? 300 : 0;
  const kcal = Math.round(bmr * activity + adj);
  const protein = Math.round(weight * 2);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  return { kcal, protein, carbs, fat };
}
