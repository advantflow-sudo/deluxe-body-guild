import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Trophy, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/challenges")({
  component: ChallengesPage,
});

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  week_start: string;
  week_end: string;
  metric: string;
  target_per_member: number;
  team_size: number;
}
interface Team {
  id: string;
  challenge_id: string;
  name: string;
  members: { user_id: string; display_name: string | null; avatar_url: string | null; week_total: number }[];
  totalPoints: number;
  iAmIn: boolean;
}

function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teamsByChallenge, setTeamsByChallenge] = useState<Record<string, Team[]>>({});
  const [newTeamName, setNewTeamName] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ch } = await supabase
      .from("weekly_team_challenges")
      .select("*").eq("is_active", true).order("week_start", { ascending: false }).limit(10);
    setChallenges((ch ?? []) as Challenge[]);

    if (!ch?.length) { setLoading(false); return; }

    const { data: teams } = await supabase
      .from("team_challenge_teams").select("id,name,challenge_id").in("challenge_id", ch.map((c) => c.id));
    const teamIds = (teams ?? []).map((t) => t.id);
    const [{ data: members }, { data: lb }] = await Promise.all([
      teamIds.length
        ? supabase.from("team_challenge_members").select("team_id,user_id").in("team_id", teamIds)
        : Promise.resolve({ data: [] as { team_id: string; user_id: string }[] }),
      // pull weekly leaderboard for any week ch covers; use the first challenge's week_start (assume same)
      supabase.from("leaderboard_weekly").select("user_id,week_total,week_start"),
    ]);
    const userIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("id,display_name,avatar_url").in("id", userIds)
      : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]));

    const byCh: Record<string, Team[]> = {};
    for (const c of ch) {
      const cTeams = (teams ?? []).filter((t) => t.challenge_id === c.id);
      const result: Team[] = cTeams.map((t) => {
        const tm = (members ?? []).filter((m) => m.team_id === t.id);
        const enrichedMembers = tm.map((m) => {
          const total = (lb ?? []).find((x) => x.user_id === m.user_id && x.week_start === c.week_start)?.week_total ?? 0;
          return {
            user_id: m.user_id,
            display_name: profMap.get(m.user_id)?.display_name ?? null,
            avatar_url: profMap.get(m.user_id)?.avatar_url ?? null,
            week_total: total,
          };
        });
        return {
          id: t.id, challenge_id: t.challenge_id, name: t.name,
          members: enrichedMembers,
          totalPoints: enrichedMembers.reduce((a, b) => a + b.week_total, 0),
          iAmIn: tm.some((m) => m.user_id === user.id),
        };
      }).sort((a, b) => b.totalPoints - a.totalPoints);
      byCh[c.id] = result;
    }
    setTeamsByChallenge(byCh);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const join = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_challenge_members").insert({ team_id: teamId, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Joined team");
    void load();
  };
  const leave = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_challenge_members").delete().eq("team_id", teamId).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    void load();
  };
  const createTeam = async (challengeId: string) => {
    if (!user) return;
    const name = (newTeamName[challengeId] ?? "").trim();
    if (!name) return toast.error("Team name required");
    const { data: t, error } = await supabase.from("team_challenge_teams").insert({ challenge_id: challengeId, name }).select().single();
    if (error || !t) return toast.error(error?.message ?? "Failed");
    await supabase.from("team_challenge_members").insert({ team_id: t.id, user_id: user.id });
    setNewTeamName((s) => ({ ...s, [challengeId]: "" }));
    toast.success("Team created");
    void load();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-28">
      <header className="space-y-1">
        <SectionLabel>Compete Together</SectionLabel>
        <h1 className="font-display text-2xl text-gold">Weekly Challenges</h1>
      </header>

      {loading ? (
        <div className="text-foreground/50">Loading...</div>
      ) : challenges.length === 0 ? (
        <div className="border border-gold/20 bg-deluxe-charcoal/40 p-6 text-center text-sm text-foreground/50">
          No active challenges this week. Check back Monday.
        </div>
      ) : challenges.map((c) => {
        const teams = teamsByChallenge[c.id] ?? [];
        const iAmInAny = teams.some((t) => t.iAmIn);
        return (
          <article key={c.id} className="border border-gold/25 bg-deluxe-charcoal/50 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="font-display text-xl text-foreground">{c.title}</h2>
                {c.description && <p className="mt-1 text-sm text-foreground/60">{c.description}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                  <span>Week of {c.week_start}</span>
                  <span>Goal: {c.target_per_member} {c.metric}</span>
                  <span>Team size: {c.team_size}</span>
                </div>
              </div>
              <Trophy className="h-6 w-6 text-gold" />
            </div>

            <div className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-sm text-foreground/40">No teams yet — be the first.</div>
              ) : teams.map((t, idx) => (
                <div key={t.id} className={`border ${t.iAmIn ? "border-gold/60 bg-gold/5" : "border-gold/15 bg-deluxe-black/40"} p-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="font-display text-sm text-gold">#{idx + 1}</div>
                      <div>
                        <div className="text-sm text-foreground">{t.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">
                          {t.members.length}/{c.team_size} members
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-display text-lg text-gold">{t.totalPoints}</div>
                        <div className="text-[9px] uppercase tracking-[0.2em] text-foreground/40">pts</div>
                      </div>
                      {t.iAmIn ? (
                        <button onClick={() => leave(t.id)} className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 hover:text-red-400">Leave</button>
                      ) : t.members.length < c.team_size && !iAmInAny ? (
                        <button onClick={() => join(t.id)} className="border border-gold/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10">Join</button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!iAmInAny && (
              <div className="flex gap-2 border-t border-gold/15 pt-3">
                <input
                  value={newTeamName[c.id] ?? ""}
                  onChange={(e) => setNewTeamName((s) => ({ ...s, [c.id]: e.target.value }))}
                  placeholder="Create a new team..."
                  maxLength={40}
                  className="flex-1 border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-gold/50 focus:outline-none"
                />
                <OutlineButton onClick={() => createTeam(c.id)} className="!px-3 !py-2 !text-[10px]"><Plus className="h-3 w-3" />New</OutlineButton>
              </div>
            )}
          </article>
        );
      })}

      <div className="pt-4 text-center">
        <Link to="/app" className="text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-gold">← Back</Link>
      </div>
    </div>
  );
}
