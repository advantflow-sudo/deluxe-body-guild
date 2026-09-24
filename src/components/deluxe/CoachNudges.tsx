/**
 * Proactive Coach — messages the Coach starts itself, built from the member's
 * real data (set logs, nutrition, sessions, recovery). Each carries an action.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dumbbell, Beef, RotateCcw, BatteryLow, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTargets } from "@/hooks/useTargets";

type Nudge = {
  id: string;
  icon: typeof Dumbbell;
  text: string;
  cta: string;
  to: "/app/workouts" | "/app/nutrition" | "/app/coach";
  search?: Record<string, string>;
};

const localDate = () => new Date().toLocaleDateString("en-CA");
const DISMISS_KEY = () => `df_nudges_dismissed_${localDate()}`;

export function CoachNudges() {
  const { user } = useAuth();
  const { targets, loading } = useTargets();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try { setDismissed(JSON.parse(localStorage.getItem(DISMISS_KEY()) ?? "[]")); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;
    void (async () => {
      const today = localDate();
      const [{ data: sets }, { data: food }, { data: last }, { data: rec }] = await Promise.all([
        supabase.from("workout_set_logs").select("reps,weight_kg,session_id,created_at,exercises(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(40),
        supabase.from("nutrition_logs").select("protein_g").eq("user_id", user.id).eq("log_date", today),
        supabase.from("workout_sessions").select("completed_at").eq("user_id", user.id).not("completed_at", "is", null).gt("duration_min", 0).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("recovery_logs").select("readiness,soreness").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      ]);
      const out: Nudge[] = [];
      const trainedToday = last?.completed_at && new Date(last.completed_at).toLocaleDateString("en-CA") === today;

      // Missed days → comeback session
      const daysSince = last?.completed_at ? Math.floor((Date.now() - new Date(last.completed_at).getTime()) / 864e5) : null;
      if (daysSince !== null && daysSince >= 3) {
        out.push({ id: "comeback", icon: RotateCcw, text: `You've missed ${daysSince} days. I've prepared a shorter comeback session — same movements, fewer sets.`, cta: "Start comeback", to: "/app/workouts", search: { mode: "short" } });
      }

      // Low readiness → lighter day
      if (rec && (rec.readiness < 50 || rec.soreness >= 4) && !trainedToday) {
        out.push({ id: "recovery", icon: BatteryLow, text: `Readiness is ${rec.readiness}/100 today. I'd keep it light — shorter session, same objective.`, cta: "Light session", to: "/app/workouts", search: { mode: "short" } });
      }

      // Progression target from the last logged session
      if (sets?.length && !trainedToday && out.length === 0) {
        const sid = sets[0].session_id;
        const top = sets.filter((s) => s.session_id === sid).sort((a, b) => Number(b.weight_kg) - Number(a.weight_kg) || b.reps - a.reps)[0];
        const name = (top.exercises as { name?: string } | null)?.name;
        if (name && Number(top.weight_kg) > 0) {
          out.push({ id: `prog_${sid}`, icon: Dumbbell, text: `You hit ${Number(top.weight_kg)}kg × ${top.reps} on ${name} last session. Target ${top.reps + 1} today?`, cta: "Train", to: "/app/workouts" });
        }
      }

      // Protein gap (only after midday so it's meaningful)
      const protein = Math.round((food ?? []).reduce((s, f) => s + Number(f.protein_g), 0));
      const gap = targets.protein - protein;
      if (new Date().getHours() >= 12 && gap >= 15) {
        out.push({ id: "protein", icon: Beef, text: `You're ${gap}g short of today's ${targets.protein}g protein target.`, cta: "Plan a meal", to: "/app/nutrition" });
      }

      if (!cancelled) setNudges(out.slice(0, 3));
    })();
    return () => { cancelled = true; };
  }, [user, loading, targets.protein]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(DISMISS_KEY(), JSON.stringify(next));
  };

  const visible = nudges.filter((n) => !dismissed.includes(n.id));
  if (!visible.length) return null;

  return (
    <div className="mt-3 space-y-2" aria-label="Messages from your Coach">
      {visible.map((n) => (
        <div key={n.id} className="flex items-start gap-3 border border-gold/20 bg-deluxe-forest/15 p-3">
          <n.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gold">Coach</div>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground">{n.text}</p>
            <Link to={n.to} search={n.search as never} className="mt-2 inline-block border border-gold/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold hover:text-deluxe-black">
              {n.cta}
            </Link>
          </div>
          <button onClick={() => dismiss(n.id)} aria-label="Dismiss" className="text-muted-foreground hover:text-gold">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
