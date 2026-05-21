import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, Footprints, Droplet, Activity, Sparkles, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/")({
  component: HomeTab,
});

const QUOTES = [
  "Discipline is the highest form of self-respect.",
  "The body achieves what the mind believes.",
  "Champions are made in the off-season.",
  "Excellence is a daily ritual.",
  "Train as if your future self is watching.",
];

interface Workout { id: string; title: string; category: string; duration_min: number; level: string; calories: number | null }

function HomeTab() {
  const { user } = useAuth();
  const [name, setName] = useState("Athlete");
  const [today, setToday] = useState<Workout | null>(null);
  const [stats, setStats] = useState({ steps: 0, calories: 0, water_ml: 0, streak: 0 });
  const [points, setPoints] = useState(0);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: ext }, { data: w }, { data: ds }, { data: pts }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_profiles_ext").select("training_level, preferred_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("workouts").select("id,title,category,duration_min,level,calories").limit(20),
        supabase.from("daily_stats").select("*").eq("user_id", user.id).eq("stat_date", new Date().toISOString().slice(0, 10)).maybeSingle(),
        supabase.from("reward_points").select("balance_after").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (prof?.display_name) setName(prof.display_name.split(" ")[0]);
      if (w && w.length) {
        const match = w.find((x) => x.level === ext?.training_level) ?? w[0];
        setToday(match as Workout);
      }
      if (ds) setStats({ steps: ds.steps, calories: ds.calories, water_ml: ds.water_ml, streak: ds.streak });
      if (pts) setPoints(pts.balance_after);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <SectionLabel>Today</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Good day, {name}.</h1>
      <p className="mt-1 text-xs italic text-muted-foreground">"{quote}"</p>

      {today && (
        <Link to="/app/workouts" className="mt-6 block border border-gold/30 bg-gold-gradient/10 p-6 transition hover:border-gold">
          <SectionLabel>Today's Workout</SectionLabel>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-foreground">{today.title}</h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {today.category} · {today.duration_min} min · {today.level}
              </p>
            </div>
            <ChevronRight className="h-6 w-6 text-gold" />
          </div>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard icon={Footprints} label="Steps" value={stats.steps.toLocaleString()} />
        <StatCard icon={Flame} label="Calories" value={stats.calories.toLocaleString()} />
        <StatCard icon={Droplet} label="Water" value={`${(stats.water_ml / 1000).toFixed(1)}L`} />
        <StatCard icon={Activity} label="Streak" value={`${stats.streak}d`} />
      </div>

      <Link to="/app/rewards" className="mt-6 flex items-center justify-between border border-gold/20 bg-deluxe-forest/30 p-5 hover:border-gold/50">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Reward Points</div>
            <div className="font-display text-2xl text-foreground">{points.toLocaleString()}</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gold" />
      </Link>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="border border-gold/15 bg-deluxe-forest/20 p-4">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl text-foreground">{value}</div>
    </div>
  );
}
