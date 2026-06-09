import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

const SLOTS = 5;
const todayIso = () => new Date().toISOString().slice(0, 10);

interface Habit { id: string; name: string; icon: string | null; target_value: number; unit: string | null; sort_order: number }

export function DailyGoalsList() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  const toggle = async (habit: Habit) => {
    if (!user || pending.has(habit.id)) return;
    const wasDone = logged.has(habit.id);

    // Optimistic
    setLogged((s) => {
      const n = new Set(s);
      if (wasDone) n.delete(habit.id); else n.add(habit.id);
      return n;
    });
    setPending((s) => new Set(s).add(habit.id));

    const { error } = wasDone
      ? await supabase.from("habit_logs")
          .delete()
          .eq("user_id", user.id)
          .eq("habit_id", habit.id)
          .eq("log_date", todayIso())
      : await supabase.from("habit_logs").insert({
          user_id: user.id, habit_id: habit.id,
          log_date: todayIso(), value: habit.target_value,
        });

    setPending((s) => { const n = new Set(s); n.delete(habit.id); return n; });

    if (error) {
      // rollback
      setLogged((s) => {
        const n = new Set(s);
        if (wasDone) n.add(habit.id); else n.delete(habit.id);
        return n;
      });
      toast.error(error.message);
    }
  };

  const completed = Array.from(logged).filter((id) => habits.some((h) => h.id === id)).length;
  const emptySlots = Math.max(0, SLOTS - habits.length);

  return (
    <section className="mt-5 border border-gold/30 bg-deluxe-forest/30 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <SectionLabel>Daily Goals</SectionLabel>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {completed}/{SLOTS} <span className="text-foreground/40">· {completed * 8} pts</span>
        </div>
      </div>

      <div className="mt-3 h-1 w-full bg-gold/10 overflow-hidden">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${(completed / SLOTS) * 100}%` }} />
      </div>

      <div className="mt-3 space-y-1.5">
        {loading && habits.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse border border-gold/10 bg-deluxe-black/30" />
          ))
        ) : (
          <>
            {habits.map((h) => {
              const done = logged.has(h.id);
              const isPending = pending.has(h.id);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => toggle(h)}
                  disabled={isPending}
                  className={`group flex w-full items-center gap-3 border p-2.5 text-left transition-colors ${
                    done ? "border-gold/40 bg-gold/5" : "border-gold/15 bg-deluxe-black/40 hover:border-gold/40"
                  } ${isPending ? "opacity-60" : ""}`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${done ? "bg-gold text-deluxe-black" : "border border-gold/40"}`}>
                    {done && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <span className="flex-1 truncate text-sm text-foreground">
                    {h.icon && <span className="mr-1.5">{h.icon}</span>}{h.name}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {h.target_value} {h.unit ?? ""}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-gold/70">+8</span>
                </button>
              );
            })}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <Link
                key={`empty-${i}`}
                to="/app/habits"
                className="flex items-center justify-between border border-dashed border-gold/20 p-2.5 text-xs text-muted-foreground hover:border-gold/50 hover:text-gold"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Add a goal
                </span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
