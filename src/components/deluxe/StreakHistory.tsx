import { useCallback, useEffect, useState } from "react";
import { Flame, MinusCircle, PlusCircle, Sparkles } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

interface EventRow {
  id: string;
  event_date: string;
  event_type: "start" | "increment" | "reset";
  current_len: number;
  previous_len: number | null;
}
interface StreakRow {
  current_len: number;
  longest_len: number;
  last_active_date: string | null;
}

const LOOKBACK_DAYS = 14;

const TYPE_META: Record<EventRow["event_type"], { label: string; tone: string; icon: typeof Flame }> = {
  start: { label: "Streak started", tone: "text-gold", icon: Sparkles },
  increment: { label: "Streak +1", tone: "text-emerald-400", icon: PlusCircle },
  reset: { label: "Streak reset", tone: "text-rose-400", icon: MinusCircle },
};

export function StreakHistory() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [streak, setStreak] = useState<StreakRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const since = format(subDays(new Date(), 60), "yyyy-MM-dd");
    const [ev, st] = await Promise.all([
      supabase.from("streak_events").select("id,event_date,event_type,current_len,previous_len")
        .eq("user_id", user.id).gte("event_date", since)
        .order("event_date", { ascending: false }).limit(30),
      supabase.from("streaks").select("current_len,longest_len,last_active_date").eq("user_id", user.id).maybeSingle(),
    ]);
    setEvents((ev.data as EventRow[]) ?? []);
    setStreak((st.data as StreakRow) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  // Realtime refresh when a new event lands
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`streak-history-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "streak_events", filter: `user_id=eq.${user.id}` },
        () => { void load(); })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "streaks", filter: `user_id=eq.${user.id}` },
        () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, load]);

  // Build day-grid for last 14 days
  const today = new Date();
  const days = Array.from({ length: LOOKBACK_DAYS }).map((_, i) => {
    const d = subDays(today, LOOKBACK_DAYS - 1 - i);
    const iso = format(d, "yyyy-MM-dd");
    const ev = events.find((e) => e.event_date === iso);
    const isActive = ev !== undefined;
    const isReset = ev?.event_type === "reset";
    return { date: d, iso, active: isActive, reset: isReset, label: format(d, "EEE d") };
  });

  return (
    <section
      className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5"
      aria-labelledby="streak-history-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-gold" />
          <SectionLabel id="streak-history-heading">Streak History</SectionLabel>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {streak?.current_len ?? 0}<span className="text-foreground/40">d current · {streak?.longest_len ?? 0}d best</span>
        </div>
      </div>

      {/* 14-day grid */}
      <ol
        className="mt-3 grid grid-cols-7 gap-1.5 sm:grid-cols-14"
        aria-label={`Activity over the last ${LOOKBACK_DAYS} days`}
      >
        {days.map((d) => (
          <li key={d.iso} className="flex flex-col items-center">
            <div
              role="img"
              aria-label={`${d.label}: ${d.reset ? "reset" : d.active ? "active" : "inactive"}`}
              title={`${d.label}${d.reset ? " · reset" : d.active ? " · active" : ""}`}
              className={`h-7 w-7 border ${
                d.reset
                  ? "border-rose-400/50 bg-rose-400/10"
                  : d.active
                    ? "border-gold/60 bg-gold-gradient"
                    : "border-gold/10 bg-deluxe-black/40"
              }`}
            />
            <div className="mt-1 text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              {format(d.date, "d")}
            </div>
          </li>
        ))}
      </ol>

      {/* Recent events */}
      <div className="mt-4">
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Recent activity</div>
        {loading ? (
          <div className="mt-2 h-20 animate-pulse border border-gold/10 bg-deluxe-black/30" />
        ) : events.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground/70">
            No streak activity yet. Earn any score today to start your streak.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5" aria-label="Recent streak events">
            {events.slice(0, 6).map((e) => {
              const meta = TYPE_META[e.event_type];
              const Icon = meta.icon;
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between border border-gold/10 bg-deluxe-black/30 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${meta.tone}`} aria-hidden />
                    <span className="text-foreground">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground tabular-nums">
                    <span>
                      {e.previous_len ?? 0} → <span className={meta.tone}>{e.current_len}</span>
                    </span>
                    <span>{format(parseISO(e.event_date), "MMM d")}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
