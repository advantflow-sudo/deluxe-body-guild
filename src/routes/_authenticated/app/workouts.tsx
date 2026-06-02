import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Clock, Flame, Play, Pause, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/workouts")({
  component: WorkoutsTab,
});

interface Workout {
  id: string; title: string; category: string; level: string;
  type: string; duration_min: number; calories: number | null; description: string | null;
}

function WorkoutsTab() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [category, setCategory] = useState<string>("All");
  const [active, setActive] = useState<Workout | null>(null);

  useEffect(() => {
    supabase.from("workouts").select("*").order("title").then(({ data }) => {
      if (data) setWorkouts(data as Workout[]);
    });
  }, []);

  const categories = ["All", ...Array.from(new Set(workouts.map((w) => w.category)))];
  const filtered = category === "All" ? workouts : workouts.filter((w) => w.category === category);

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Workouts</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Choose your session</h1>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`whitespace-nowrap border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition ${
              category === c ? "border-gold bg-gold text-deluxe-black" : "border-gold/20 text-foreground hover:border-gold/50"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((w) => (
          <button key={w.id} onClick={() => setActive(w)}
            className="block w-full border border-gold/15 bg-deluxe-forest/20 p-5 text-left transition hover:border-gold/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-lg text-foreground">{w.title}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {w.category} · {w.level}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-gold"><Clock className="h-3 w-3" />{w.duration_min}m</div>
                {w.calories && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3" />{w.calories}</div>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && user && (
        <WorkoutPlayer workout={active} userId={user.id} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function WorkoutPlayer({ workout, userId, onClose }: { workout: Workout; userId: string; onClose: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const complete = async () => {
    setRunning(false);
    const durationMin = Math.max(1, Math.round(seconds / 60));
    const points = Math.round(durationMin * 2);
    // Log session
    const { error: sErr } = await supabase.from("workout_sessions").insert({
      user_id: userId, workout_id: workout.id, duration_min: durationMin,
      calories: workout.calories ? Math.round((workout.calories * durationMin) / workout.duration_min) : null,
    });
    if (sErr) return toast.error(sErr.message);
    // Award points server-side (validated by award_points RPC)
    await supabase.rpc("award_points", {
      _reason: `Completed ${workout.title}`,
      _delta: points,
    });
    // Update daily stats
    const today = new Date().toISOString().slice(0, 10);
    const { data: ds } = await supabase.from("daily_stats")
      .select("*").eq("user_id", userId).eq("stat_date", today).maybeSingle();
    if (ds) {
      await supabase.from("daily_stats").update({
        calories: ds.calories + (workout.calories ?? 0),
        streak: ds.streak,
      }).eq("id", ds.id);
    } else {
      await supabase.from("daily_stats").insert({
        user_id: userId, stat_date: today, calories: workout.calories ?? 0, streak: 1,
      });
    }
    setDone(true);
    toast.success(`+${points} points earned`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deluxe-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md border border-gold/30 bg-deluxe-black p-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-gold">
          <X className="h-5 w-5" />
        </button>
        {!done ? (
          <>
            <SectionLabel>{workout.category}</SectionLabel>
            <h2 className="mt-2 font-display text-2xl text-foreground">{workout.title}</h2>
            {workout.description && <p className="mt-2 text-sm text-muted-foreground">{workout.description}</p>}
            <div className="my-8 text-center">
              <div className="font-display text-6xl text-gold tabular-nums">
                {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Target {workout.duration_min} min
              </div>
            </div>
            <div className="flex gap-3">
              <OutlineButton onClick={() => setRunning((r) => !r)} className="flex-1">
                {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> {seconds === 0 ? "Start" : "Resume"}</>}
              </OutlineButton>
              <GoldButton onClick={complete} disabled={seconds === 0} className="flex-1">Finish</GoldButton>
            </div>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
            <h2 className="mt-4 font-display text-2xl text-foreground">Session complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">{Math.round(seconds / 60)} min logged. Points awarded.</p>
            <GoldButton onClick={onClose} className="mt-6 w-full">Done</GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}
