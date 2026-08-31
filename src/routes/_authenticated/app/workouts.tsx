import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Flame, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { cacheRecentWorkout, getRecentWorkouts } from "@/lib/registerSW";
import { WorkoutDetail, type Workout } from "@/components/deluxe/WorkoutDetail";
import { WorkoutHistory } from "@/components/deluxe/WorkoutHistory";

export const Route = createFileRoute("/_authenticated/app/workouts")({
  head: () => ({
    meta: [
      { title: "Workouts | Deluxe Fitness" },
      { name: "description", content: "Browse Deluxe sessions, follow guided players and log every set." },
      { property: "og:title", content: "Workouts | Deluxe Fitness" },
      { property: "og:description", content: "Browse Deluxe sessions, follow guided players and log every set." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkoutsTab,
});

function WorkoutsTab() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [active, setActive] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    const cached = getRecentWorkouts();
    if (cached.length) {
      setWorkouts(cached.map((c) => ({
        id: c.id, title: c.title, category: c.type ?? "Recent", level: c.level ?? "",
        type: c.type ?? "", duration_min: 0, calories: null, description: null, is_premium: false,
      })));
    }
    let cancelled = false;
    supabase
      .from("workouts")
      .select("*")
      .order("title")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setWorkouts((data ?? []) as Workout[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    workouts.slice(0, 10).forEach((w) =>
      cacheRecentWorkout({ id: w.id, title: w.title, type: w.type, level: w.level, cached_at: new Date().toISOString() }),
    );
  }, [workouts]);

  const categories = ["All", ...Array.from(new Set(workouts.map((w) => w.category)))];
  const filtered = category === "All" ? workouts : workouts.filter((w) => w.category === category);

  const closeDetail = () => {
    setActive(null);
    setHistoryKey((k) => k + 1);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Workouts</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Choose your session</h1>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button key={c} onClick={() => { haptic("selection"); setCategory(c); }}
            className={`whitespace-nowrap border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition ${
              category === c ? "border-gold bg-gold text-deluxe-black" : "border-gold/20 text-foreground hover:border-gold/50"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse border border-gold/10 bg-deluxe-forest/10" />)}
        </div>
      )}

      {error && (
        <div className="mt-6 border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Couldn't load workouts: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-6 border border-gold/15 bg-deluxe-forest/10 p-6 text-center text-sm text-muted-foreground">
          No workouts found in this category yet.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((w) => {
          const locked = w.is_premium && !isPremium;
          return (
            <button key={w.id} onClick={() => { haptic("medium"); setActive(w); }}
              className="block w-full border border-gold/15 bg-deluxe-forest/20 p-5 text-left transition hover:border-gold/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-display text-lg text-foreground">
                    {w.title}
                    {locked && <Lock className="h-3.5 w-3.5 text-gold" />}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {w.category} · {w.level}
                  </div>
                </div>
                <div className="text-right">
                  {w.duration_min > 0 && <div className="flex items-center gap-1 text-xs text-gold"><Clock className="h-3 w-3" />{w.duration_min}m</div>}
                  {w.calories && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3" />{w.calories}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {user && <WorkoutHistory userId={user.id} refreshKey={historyKey} />}

      {active && user && (
        <WorkoutDetail workout={active} userId={user.id} onClose={closeDetail} />
      )}
    </div>
  );
}
