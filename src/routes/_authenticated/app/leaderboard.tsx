import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/leaderboard")({
  component: LeaderboardPage,
});

interface Row {
  user_id: string;
  week_total: number;
  active_days: number;
  streak_peak: number;
  display_name: string | null;
  avatar_url: string | null;
}

function weekStart() {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

function LeaderboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<"global" | "friends">("global");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      const ws = weekStart();

      let userIds: string[] | null = null;
      if (scope === "friends") {
        const { data } = await supabase.from("user_followers").select("followed_id").eq("follower_id", user.id);
        userIds = [user.id, ...(data ?? []).map((r) => r.followed_id)];
      }

      let q = supabase.from("leaderboard_weekly").select("*").eq("week_start", ws).order("week_total", { ascending: false }).limit(50);
      if (userIds) q = q.in("user_id", userIds);
      const { data: lb } = await q;

      const ids = (lb ?? []).map((r) => r.user_id).filter((v): v is string => !!v);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,display_name,avatar_url").in("id", ids)
        : { data: [] };
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

      setRows((lb ?? []).map((r) => ({
        user_id: r.user_id!,
        week_total: r.week_total ?? 0,
        active_days: r.active_days ?? 0,
        streak_peak: r.streak_peak ?? 0,
        display_name: profMap.get(r.user_id!)?.display_name ?? null,
        avatar_url: profMap.get(r.user_id!)?.avatar_url ?? null,
      })));
      setLoading(false);
    })();
  }, [user, scope]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
      <header className="space-y-1">
        <SectionLabel>Weekly Standing</SectionLabel>
        <h1 className="font-display text-2xl text-gold">Leaderboard</h1>
      </header>

      <div className="inline-flex border border-gold/30 bg-deluxe-charcoal/60">
        {(["global", "friends"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors ${scope === s ? "bg-gold text-deluxe-black" : "text-foreground/60 hover:text-gold"}`}
          >{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-foreground/50">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="border border-gold/20 bg-deluxe-charcoal/40 p-6 text-center text-sm text-foreground/50">
          No activity this week yet. Be the first to log a workout.
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, idx) => {
            const isMe = r.user_id === user?.id;
            const medal = idx === 0 ? "text-yellow-400" : idx === 1 ? "text-zinc-300" : idx === 2 ? "text-amber-700" : "text-foreground/40";
            return (
              <li
                key={r.user_id}
                className={`flex items-center gap-3 border px-3 py-2.5 ${isMe ? "border-gold/60 bg-gold/5" : "border-gold/15 bg-deluxe-charcoal/40"}`}
              >
                <div className={`w-6 text-center font-display text-lg ${medal}`}>{idx + 1}</div>
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" loading="lazy" decoding="async" className="h-9 w-9 rounded-full border border-gold/30 object-cover" />
                ) : (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-deluxe-black text-[10px] text-gold">
                    {(r.display_name ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm text-foreground">{r.display_name ?? "Member"} {isMe && <span className="text-[10px] text-gold">(you)</span>}</div>
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                    <span>{r.active_days}d active</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-amber-500" />{r.streak_peak}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl text-gold">{r.week_total}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40">pts</div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="pt-4 text-center">
        <Link to="/app" className="text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-gold">← Back</Link>
      </div>
    </div>
  );
}
