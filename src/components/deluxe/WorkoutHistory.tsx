import { useEffect, useState } from "react";
import { CalendarClock, Flame, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel } from "@/components/deluxe/ui";

interface SessionRow {
  id: string;
  duration_min: number;
  calories: number | null;
  completed_at: string;
  workout_id: string | null;
  workouts: { title: string; category: string } | null;
}

export function WorkoutHistory({ userId, refreshKey = 0 }: { userId: string; refreshKey?: number }) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from("workout_sessions")
      .select("id, duration_min, calories, completed_at, workout_id, workouts(title, category)")
      .eq("user_id", userId)
      .gt("duration_min", 0)
      .order("completed_at", { ascending: false })
      .limit(8)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setRows((data ?? []) as unknown as SessionRow[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  return (
    <div className="mt-10">
      <SectionLabel>Recent sessions</SectionLabel>
      {loading && (
        <div className="mt-3 space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse border border-gold/10 bg-deluxe-forest/10" />)}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">No completed sessions yet — finish a workout to see it here.</p>
      )}
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between border border-gold/10 bg-deluxe-forest/10 px-4 py-3">
            <div>
              <div className="text-sm text-foreground">{r.workouts?.title ?? "Workout"}</div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <CalendarClock className="h-3 w-3" />
                {new Date(r.completed_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gold">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.duration_min}m</span>
              {r.calories != null && <span className="flex items-center gap-1 text-muted-foreground"><Flame className="h-3 w-3" />{r.calories}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
