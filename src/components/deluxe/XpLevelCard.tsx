import { useEffect, useState } from "react";
import { Zap, Trophy, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { StreakBadges } from "@/components/deluxe/StreakBadges";

type Summary = {
  total_xp: number;
  today_xp: number;
  rank: string;
  rank_floor: number;
  next_rank_at: number;
  progress_pct: number;
};

const RANKS = ["Beginner", "Consistent", "Warrior", "Elite", "Beast", "Legend"];

const DAILY = [
  { label: "Workout", xp: 50, reason: "workout" },
  { label: "Water target", xp: 20, reason: "water" },
  { label: "Protein target", xp: 20, reason: "protein" },
  { label: "Mindset habit", xp: 10, reason: "habit" },
];

export function XpLevelCard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [earned, setEarned] = useState<string[]>([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: s }, { data: st }, { data: today }] = await Promise.all([
        supabase.rpc("get_xp_summary"),
        supabase.rpc("get_xp_streak"),
        supabase
          .from("xp_events")
          .select("reason")
          .eq("user_id", user.id)
          .eq("event_date", new Date().toISOString().slice(0, 10)),
      ]);
      if (today) setEarned(today.map((r) => r.reason));
      if (s) setSummary(s as unknown as Summary);
      if (st) setStreak(st as unknown as typeof streak);
    };
    load();
  }, [user]);

  const pct = summary ? Math.min(100, Number(summary.progress_pct) || 0) : 0;
  const rankIndex = summary ? Math.max(0, RANKS.indexOf(summary.rank)) : 0;

  return (
    <div className="mt-5">
      <SectionLabel>Level &amp; XP</SectionLabel>
      <div className="mt-3 border border-gold/20 bg-deluxe-forest/25 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.24em] text-gold">
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-3 w-3" /> {summary?.rank ?? "—"}</span>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-3 w-3" /> {streak.current_streak} day streak
                <span className="text-muted-foreground">· best {streak.longest_streak}</span>
              </span>
            </div>
            <div className="mt-1 font-display text-2xl text-foreground">
              {(summary?.total_xp ?? 0).toLocaleString()}
              <span className="ml-1 text-xs text-muted-foreground">XP</span>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <Zap className="h-3 w-3 text-gold" /> Today
            </div>
            <div className="font-display text-lg text-foreground">{summary?.today_xp ?? 0}<span className="text-xs text-muted-foreground">/100</span></div>
          </div>
        </div>

        <div className="mt-3 h-1.5 w-full bg-deluxe-black/70">
          <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{RANKS[rankIndex]}</span>
          <span>
            {summary && summary.next_rank_at > summary.total_xp
              ? `${(summary.next_rank_at - summary.total_xp).toLocaleString()} XP to ${RANKS[Math.min(RANKS.length - 1, rankIndex + 1)]}`
              : "Max rank"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {DAILY.map((d) => {
            const done = earned.includes(d.reason);
            return (
              <div
                key={d.reason}
                className={`flex items-center justify-between border px-2.5 py-2 text-[10px] uppercase tracking-[0.18em] ${
                  done ? "border-gold/50 bg-gold-gradient/10 text-gold" : "border-gold/15 bg-deluxe-black/40 text-muted-foreground"
                }`}
              >
                <span className="truncate">{d.label}</span>
                <span className="ml-2 shrink-0">+{d.xp}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-gold/10 pt-3">
          <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Streak badges</div>
          <div className="mt-2">
            <StreakBadges current={streak.current_streak} best={streak.longest_streak} />
          </div>
        </div>
      </div>
    </div>
  );
}
