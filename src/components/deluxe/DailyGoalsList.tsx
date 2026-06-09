import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, CloudOff, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { enqueueOrApply, useOnline, useQueueSize } from "@/lib/offlineQueue";

const SLOTS = 5;
const todayIso = () => new Date().toISOString().slice(0, 10);

interface Habit { id: string; name: string; icon: string | null; target_value: number; unit: string | null; sort_order: number }

export function DailyGoalsList() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const online = useOnline();
  const queued = useQueueSize();

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from("habits")
        .select("id,name,icon,target_value,unit,sort_order")
        .eq("user_id", user.id).eq("active", true)
        .order("sort_order", { ascending: true }).limit(SLOTS),
      supabase.from("habit_logs")
        .select("habit_id").eq("user_id", user.id).eq("log_date", todayIso()),
    ]);
    setHabits((h as Habit[]) ?? []);
    setLogged(new Set(((l ?? []) as { habit_id: string }[]).map((r) => r.habit_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (online && queued === 0 && !loading) void load(); }, [online, queued, loading, load]);

  const toggle = async (habit: Habit) => {
    if (!user || pending.has(habit.id)) return;
    const wasDone = logged.has(habit.id);

    setLogged((s) => {
      const n = new Set(s);
      if (wasDone) n.delete(habit.id); else n.add(habit.id);
      return n;
    });
    setPending((s) => new Set(s).add(habit.id));

    const result = await enqueueOrApply({
      kind: "habitToggle", userId: user.id, habit_id: habit.id,
      date: todayIso(), value: habit.target_value, on: !wasDone,
    });

    setPending((s) => { const n = new Set(s); n.delete(habit.id); return n; });

    if (!result.ok) {
      setLogged((s) => {
        const n = new Set(s);
        if (wasDone) n.add(habit.id); else n.delete(habit.id);
        return n;
      });
      toast.error(result.error ?? "Could not save");
    } else if (result.queued) {
      toast("Saved offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
    }
  };

  const completed = Array.from(logged).filter((id) => habits.some((h) => h.id === id)).length;
  const emptySlots = Math.max(0, SLOTS - habits.length);

  return (
    <section
      className="mt-5 border border-gold/30 bg-deluxe-forest/30 p-4 sm:p-5"
      aria-labelledby="goals-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel id="goals-heading">Daily Goals</SectionLabel>
          {!online && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Offline — toggles queued" />}
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums"
          aria-live="polite"
        >
          {completed}/{SLOTS} <span className="text-foreground/40">· {completed * 8} pts</span>
        </div>
      </div>

      <div
        className="mt-3 h-1 w-full bg-gold/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={(completed / SLOTS) * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${completed} of ${SLOTS} goals completed`}
      >
        <div
          className="h-full bg-gold-gradient transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${(completed / SLOTS) * 100}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5" aria-label="Today's goals">
        {loading && habits.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-10 animate-pulse border border-gold/10 bg-deluxe-black/30" aria-hidden />
          ))
        ) : (
          <>
            {habits.map((h) => {
              const done = logged.has(h.id);
              const isPending = pending.has(h.id);
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => toggle(h)}
                    disabled={isPending}
                    role="switch"
                    aria-checked={done}
                    aria-label={`${h.name}: ${done ? "completed" : "not completed"}, 8 points`}
                    className={`group flex w-full items-center gap-3 border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${
                      done ? "border-gold/40 bg-gold/5" : "border-gold/15 bg-deluxe-black/40 hover:border-gold/40"
                    } ${isPending ? "opacity-60" : ""}`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${done ? "bg-gold text-deluxe-black" : "border border-gold/40"}`} aria-hidden>
                      {done && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {h.icon && <span className="mr-1.5" aria-hidden>{h.icon}</span>}{h.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {h.target_value} {h.unit ?? ""}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gold/70">+8</span>
                  </button>
                </li>
              );
            })}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <li key={`empty-${i}`}>
                <Link
                  to="/app/habits"
                  className="flex items-center justify-between border border-dashed border-gold/20 p-2.5 text-xs text-muted-foreground hover:border-gold/50 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                  aria-label="Add a goal"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add a goal
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </section>
  );
}
