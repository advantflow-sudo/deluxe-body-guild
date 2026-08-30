import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fallbackTargets } from "@/lib/targets";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

type Log = { log_date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number };
type Totals = { kcal: number; protein: number; carbs: number; fat: number };

const EMPTY: Totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

function weekDates() {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
  return out;
}

export function WeeklyNutritionSummary({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [targets, setTargets] = useState<Totals>({ kcal: 2200, protein: 150, carbs: 220, fat: 70 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const dates = weekDates();
      const [logRes, planRes, extRes] = await Promise.all([
        supabase
          .from("nutrition_logs")
          .select("log_date,calories,protein_g,carbs_g,fat_g")
          .eq("user_id", user.id)
          .gte("log_date", dates[0]!),
        supabase
          .from("meal_plans")
          .select("kcal_target,protein_target_g,carbs_target_g,fat_target_g")
          .eq("user_id", user.id)
          .order("plan_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("user_profiles_ext").select("weight_kg").eq("user_id", user.id).maybeSingle(),
      ]);

      setLogs((logRes.data ?? []) as Log[]);
      if (planRes.data) {
        setTargets({
          kcal: Number(planRes.data.kcal_target),
          protein: Number(planRes.data.protein_target_g),
          carbs: Number(planRes.data.carbs_target_g),
          fat: Number(planRes.data.fat_target_g),
        });
      } else {
        // Unified fallback targets (audit M2) — same engine as the nutrition plan.
        const t = fallbackTargets(Number(extRes.data?.weight_kg ?? 75));
        setTargets({ kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat });
      }
      setLoading(false);
    })();
  }, [user, refreshKey]);

  if (loading) return <div className="mt-5 h-40 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;

  const dates = weekDates();
  const byDay = dates.map((d) => {
    const rows = logs.filter((l) => l.log_date === d);
    return {
      date: d,
      day: new Date(`${d}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow" }),
      kcal: rows.reduce((s, r) => s + Number(r.calories ?? 0), 0),
      meals: rows.length,
    };
  });

  const totals: Totals = logs.reduce(
    (s, r) => ({
      kcal: s.kcal + Number(r.calories ?? 0),
      protein: s.protein + Number(r.protein_g ?? 0),
      carbs: s.carbs + Number(r.carbs_g ?? 0),
      fat: s.fat + Number(r.fat_g ?? 0),
    }),
    EMPTY,
  );

  const loggedDays = byDay.filter((d) => d.meals > 0).length;
  const maxKcal = Math.max(targets.kcal, ...byDay.map((d) => d.kcal), 1);
  const paceDays = Math.max(1, loggedDays);

  const metrics = [
    { key: "kcal", label: "Calories", value: totals.kcal, daily: targets.kcal, unit: "kcal" },
    { key: "protein", label: "Protein", value: totals.protein, daily: targets.protein, unit: "g" },
    { key: "carbs", label: "Carbs", value: totals.carbs, daily: targets.carbs, unit: "g" },
    { key: "fat", label: "Fats", value: totals.fat, daily: targets.fat, unit: "g" },
  ];

  const macrosMissing = totals.kcal > 0 && totals.protein + totals.carbs + totals.fat === 0;
  const avgProtein = totals.protein / paceDays;

  return (
    <section className="mt-6 border border-gold/20 bg-deluxe-forest/12 p-5">
      <SectionLabel>This week in nutrition</SectionLabel>
      <h2 className="mt-1 font-display text-lg text-foreground">7-day totals vs your goals.</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {loggedDays} of 7 days logged · {logs.length} meal{logs.length === 1 ? "" : "s"} recorded. Daily goal:{" "}
        {targets.kcal} kcal · {targets.protein}g protein.
      </p>

      <div className="mt-4 flex items-end gap-1.5" role="img" aria-label="Daily calories logged this week">
        {byDay.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end bg-gold/5">
              <div
                className={`w-full transition-all duration-500 ${d.kcal >= targets.kcal * 0.85 ? "bg-gold-gradient" : "bg-gold/35"}`}
                style={{ height: `${Math.min(100, (d.kcal / maxKcal) * 100)}%` }}
                title={`${d.day}: ${Math.round(d.kcal)} kcal`}
              />
            </div>
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {metrics.map((m) => {
          const avg = m.value / paceDays;
          const pct = m.daily > 0 ? Math.min(100, Math.round((avg / m.daily) * 100)) : 0;
          const onTrack = pct >= 85;
          return (
            <li key={m.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{m.label}</span>
                <span className={`text-xs ${onTrack ? "text-gold" : "text-foreground"}`}>
                  {Math.round(avg).toLocaleString()} / {Math.round(m.daily).toLocaleString()} {m.unit}
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    avg/day · {pct}% · {Math.round(m.value).toLocaleString()} {m.unit} total
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1 w-full bg-gold/10">
                <div
                  className={`h-full transition-all duration-500 ${onTrack ? "bg-gold-gradient" : "bg-gold/45"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {loggedDays === 0
          ? "No meals logged in the last 7 days — log one to start tracking your macros."
          : macrosMissing
            ? "Your meals have calories but no macros. Add protein, carbs and fat when logging so these totals are accurate."
            : avgProtein >= targets.protein * 0.85
              ? "Protein intake is on target — ideal for lean muscle retention."
              : "Protein is trailing your daily goal. Log a high-protein meal today to close the gap."}
      </p>
    </section>
  );
}
