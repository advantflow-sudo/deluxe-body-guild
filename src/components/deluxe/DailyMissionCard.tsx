import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Dumbbell, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { ScoreRing } from "./ScoreRing";
import { StreakFlame } from "./StreakFlame";

interface Mission {
  id: string;
  workout_id: string | null;
  habit_ids: string[];
  mindset_prompt: string | null;
  completed_at: string | null;
}
interface Habit { id: string; name: string; icon: string | null; target_value: number; unit: string | null }
interface Workout { id: string; title: string; duration_min: number; category: string }
interface Score { workout_pts: number; habits_pts: number; mindset_pts: number; social_pts: number; total: number }
interface Streak { current_len: number; longest_len: number; freezes_remaining: number; last_active_date: string | null }

const today = () => new Date().toISOString().slice(0, 10);

export function DailyMissionCard() {
  const { user } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loggedHabits, setLoggedHabits] = useState<Set<string>>(new Set());
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [score, setScore] = useState<Score>({ workout_pts: 0, habits_pts: 0, mindset_pts: 0, social_pts: 0, total: 0 });
  const [streak, setStreak] = useState<Streak>({ current_len: 0, longest_len: 0, freezes_remaining: 0, last_active_date: null });
  const [loading, setLoading] = useState(true);

  const recompute = useCallback(async () => {
    const { data } = await supabase.rpc("compute_daily_score", { _date: today() });
    if (data) setScore(data as any);
    const { data: s } = await supabase.from("streaks").select("*").maybeSingle();
    if (s) setStreak(s as any);
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Generate or fetch today's mission
    const { data: m, error: mErr } = await supabase.rpc("generate_daily_mission");
    if (mErr) { toast.error(mErr.message); setLoading(false); return; }
    const ms = m as Mission;
    setMission(ms);

    const tasks: Promise<unknown>[] = [];
    if (ms.habit_ids?.length) {
      tasks.push(
        supabase.from("habits").select("id,name,icon,target_value,unit").in("id", ms.habit_ids)
          .then(({ data }) => setHabits((data ?? []) as Habit[])),
      );
    } else setHabits([]);
    if (ms.workout_id) {
      tasks.push(
        supabase.from("workouts").select("id,title,duration_min,category").eq("id", ms.workout_id).maybeSingle()
          .then(({ data }) => setWorkout(data as Workout | null)),
      );
    } else setWorkout(null);
    tasks.push(
      supabase.from("habit_logs").select("habit_id").eq("log_date", today())
        .then(({ data }) => setLoggedHabits(new Set((data ?? []).map((r: any) => r.habit_id)))),
    );
    await Promise.all(tasks);
    await recompute();
    setLoading(false);
  }, [user, recompute]);

  useEffect(() => { void load(); }, [load]);

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const done = loggedHabits.has(habit.id);
    if (done) {
      await supabase.from("habit_logs").delete().eq("user_id", user.id).eq("habit_id", habit.id).eq("log_date", today());
      setLoggedHabits((s) => { const n = new Set(s); n.delete(habit.id); return n; });
    } else {
      const { error } = await supabase.from("habit_logs").insert({
        user_id: user.id, habit_id: habit.id, log_date: today(), value: habit.target_value,
      });
      if (error) { toast.error(error.message); return; }
      setLoggedHabits((s) => new Set(s).add(habit.id));
    }
    await recompute();
  };

  const completeMindset = async () => {
    const { error } = await supabase.rpc("complete_mission");
    if (error) return toast.error(error.message);
    toast.success("Mission complete. +10 pts");
    await load();
  };

  const atRisk = (() => {
    const h = new Date().getHours();
    return h >= 20 && streak.last_active_date !== today() && score.total < 50;
  })();

  if (loading && !mission) {
    return <div className="mt-5 h-48 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;
  }

  const habitsCompletedAll = habits.length > 0 && habits.every((h) => loggedHabits.has(h.id));
  const mindsetDone = !!mission?.completed_at;

  return (
    <section className="mt-5 border border-gold/30 bg-gradient-to-br from-deluxe-forest/40 to-deluxe-black p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Today's Mission</SectionLabel>
          <h2 className="mt-1 font-display text-xl text-foreground sm:text-2xl">Earn your day.</h2>
        </div>
        <ScoreRing
          score={score.total}
          workoutPts={score.workout_pts}
          habitsPts={score.habits_pts}
          mindsetPts={score.mindset_pts}
          socialPts={score.social_pts}
          size={120}
        />
      </div>

      <div className="mt-4">
        <StreakFlame
          currentLen={streak.current_len}
          longestLen={streak.longest_len}
          freezesRemaining={streak.freezes_remaining}
          atRisk={atRisk}
        />
      </div>

      {/* Workout slot */}
      {workout && (
        <Link
          to="/app/workouts"
          className="mt-3 flex items-center justify-between border border-gold/20 bg-deluxe-black/40 p-3 hover:border-gold/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${score.workout_pts > 0 ? "bg-gold text-deluxe-black" : "border border-gold/30 text-gold"}`}>
              {score.workout_pts > 0 ? <Check className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Workout · +40 pts</div>
              <div className="truncate text-sm text-foreground">{workout.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {workout.duration_min}m <ChevronRight className="h-4 w-4 text-gold" />
          </div>
        </Link>
      )}

      {/* Habits checklist */}
      {habits.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Habits · {score.habits_pts}/40 pts
            </div>
            <Link to="/app/habits" className="text-[9px] uppercase tracking-[0.2em] text-gold hover:underline">Edit</Link>
          </div>
          {habits.map((h) => {
            const done = loggedHabits.has(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggleHabit(h)}
                className={`group flex w-full items-center gap-3 border p-2.5 text-left transition-colors ${
                  done ? "border-gold/40 bg-gold/5" : "border-gold/15 bg-deluxe-black/40 hover:border-gold/40"
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-gold text-deluxe-black" : "border border-gold/40"}`}>
                  {done && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className="flex-1 text-sm text-foreground">
                  {h.icon && <span className="mr-1.5">{h.icon}</span>}{h.name}
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {h.target_value} {h.unit ?? ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Link to="/app/habits" className="mt-3 flex items-center justify-between border border-dashed border-gold/30 p-3 text-xs text-muted-foreground hover:border-gold/60">
          <span>Add daily habits to earn up to 40 points</span>
          <ChevronRight className="h-4 w-4 text-gold" />
        </Link>
      )}

      {/* Mindset */}
      {mission?.mindset_prompt && (
        <div className={`mt-3 border p-3 ${mindsetDone ? "border-gold/40 bg-gold/5" : "border-gold/20 bg-deluxe-black/40"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-gold" /> Mindset · +10 pts
            </div>
            {!mindsetDone && habitsCompletedAll && score.workout_pts > 0 && (
              <button onClick={completeMindset} className="text-[9px] uppercase tracking-[0.2em] text-gold hover:underline">
                Mark complete
              </button>
            )}
            {mindsetDone && <Check className="h-4 w-4 text-gold" />}
          </div>
          <p className="mt-1.5 text-sm italic text-foreground">"{mission.mindset_prompt}"</p>
          {!mindsetDone && (!habitsCompletedAll || score.workout_pts === 0) && (
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              Unlocks after workout + all habits
            </p>
          )}
        </div>
      )}
    </section>
  );
}
