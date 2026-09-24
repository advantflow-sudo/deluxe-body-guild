import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Crown, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";
import { CommunityTabBar } from "@/components/deluxe/CommunityTabBar";

export const Route = createFileRoute("/_authenticated/app/leagues")({
  head: () => ({
    meta: [
      { title: "Deluxe Leagues | Deluxe Fitness" },
      { name: "description", content: "Compete in a small weekly league of up to 10 members with fair, capped daily scoring." },
      { property: "og:title", content: "Deluxe Leagues | Deluxe Fitness" },
      { property: "og:description", content: "Small weekly leagues with fair, capped daily scoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaguesPage,
});

interface Standing {
  league_id: string; league_name: string; week_start: string; user_id: string;
  display_name: string | null; avatar_url: string | null; points: number; active_days: number;
}

function currentWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function LeaguesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_league_standings");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Standing[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);

  const join = async () => {
    setJoining(true);
    const { error } = await supabase.rpc("join_weekly_league");
    setJoining(false);
    if (error) return toast.error(error.message);
    toast.success("You're in this week's league");
    void load();
  };

  const inThisWeek = rows.length > 0 && rows[0].week_start >= currentWeekStart();
  const myRank = rows.findIndex((r) => r.user_id === user?.id) + 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
      <header className="space-y-1">
        <SectionLabel>Community</SectionLabel>
        <h1 className="font-display text-3xl text-foreground">Deluxe Leagues</h1>
        <p className="text-sm text-muted-foreground">
          Up to 10 members per league, reset every Monday. Each day counts for at most 100 points, so consistency beats one big day.
        </p>
      </header>
      <CommunityTabBar active="leagues" onSelect={() => {}} />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading league…</p>
      ) : !inThisWeek ? (
        <div className="mt-6 border border-gold/30 bg-deluxe-black/60 p-5 text-center">
          <Shield className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 text-sm text-foreground">You're not in a league this week yet.</p>
          <GoldButton onClick={join} disabled={joining} className="mt-4">
            {joining ? "Joining…" : "Join this week's league"}
          </GoldButton>
        </div>
      ) : (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-gold">{rows[0].league_name}</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {rows.length}/10 · you're #{myRank}
            </span>
          </div>
          <ol className="mt-3 divide-y divide-gold/10 border border-gold/20">
            {rows.map((r, i) => (
              <li key={r.user_id} className={`flex items-center gap-3 px-3 py-2.5 ${r.user_id === user?.id ? "bg-gold/10" : ""}`}>
                <span className="w-6 text-center font-display text-gold tabular-nums">{i === 0 && r.points > 0 ? <Crown className="mx-auto h-4 w-4" /> : i + 1}</span>
                <Link to="/app/u/$userId" params={{ userId: r.user_id }} className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-deluxe-surface text-xs text-gold">
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> : (r.display_name ?? "M").slice(0, 1)}
                  </span>
                  <span className="truncate text-sm text-foreground">{r.user_id === user?.id ? "You" : r.display_name ?? "Member"}</span>
                </Link>
                <span className="text-[10px] text-muted-foreground">{r.active_days}/7 days</span>
                <span className="w-14 text-right font-display text-gold tabular-nums">{r.points}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">Points come from your daily Deluxe Score (workout, habits, mindset, social).</p>
        </section>
      )}
    </div>
  );
}
