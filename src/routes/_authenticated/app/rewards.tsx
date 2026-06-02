import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Gift, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/rewards")({
  component: RewardsTab,
});

interface Reward { id: string; title: string; description: string | null; cost_points: number; type: string }
interface Challenge { id: string; title: string; description: string | null; goal_target: number; points_reward: number; goal_metric: string }
interface Participation { challenge_id: string; progress: number }

function RewardsTab() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [parts, setParts] = useState<Participation[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: bal }, { data: r }, { data: c }, { data: cp }] = await Promise.all([
      supabase.from("reward_points").select("balance_after").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("rewards_catalog").select("*").eq("active", true).order("cost_points"),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("challenge_participants").select("challenge_id, progress").eq("user_id", user.id),
    ]);
    setBalance(bal?.balance_after ?? 0);
    if (r) setRewards(r as Reward[]);
    if (c) setChallenges(c as Challenge[]);
    if (cp) setParts(cp as Participation[]);
  };
  useEffect(() => { load(); }, [user]);

  const joinChallenge = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("challenge_participants").insert({ user_id: user.id, challenge_id: id });
    if (error) return toast.error(error.message);
    toast.success("Joined challenge");
    load();
  };

  const claim = async (r: Reward) => {
    if (!user) return;
    if (balance < r.cost_points) return toast.error("Not enough points");
    const { error: cErr } = await supabase.from("reward_claims").insert({ user_id: user.id, reward_id: r.id });
    if (cErr) return toast.error(cErr.message);
    const newBal = balance - r.cost_points;
    const { error: pErr } = await supabase.rpc("award_points", {
      _reason: `Claimed: ${r.title}`,
      _delta: -r.cost_points,
    });
    if (pErr) return toast.error(pErr.message);
    toast.success(`Claimed ${r.title}`);
    setBalance(newBal);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Rewards</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Earn. Redeem. Repeat.</h1>

      <div className="mt-6 border border-gold bg-gold-gradient/10 p-6 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-gold" />
        <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Points Balance</div>
        <div className="mt-1 font-display text-5xl text-gold">{balance.toLocaleString()}</div>
      </div>

      <div className="mt-6">
        <SectionLabel>Active Challenges</SectionLabel>
        <div className="mt-3 space-y-3">
          {challenges.map((c) => {
            const p = parts.find((x) => x.challenge_id === c.id);
            const pct = p ? Math.min(100, Math.round((p.progress / c.goal_target) * 100)) : 0;
            return (
              <div key={c.id} className="border border-gold/15 bg-deluxe-forest/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><Target className="h-4 w-4 text-gold" /><span className="font-display text-base text-foreground">{c.title}</span></div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gold">+{c.points_reward} pts</div>
                  </div>
                  {!p && <button onClick={() => joinChallenge(c.id)} className="border border-gold/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10">Join</button>}
                </div>
                {p && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-gold/10"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{p.progress} / {c.goal_target}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <SectionLabel>Rewards Catalog</SectionLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {rewards.map((r) => (
            <div key={r.id} className="flex flex-col border border-gold/15 bg-deluxe-forest/20 p-4">
              <Gift className="h-5 w-5 text-gold" />
              <div className="mt-2 font-display text-base text-foreground">{r.title}</div>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{r.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gold">{r.cost_points} pts</span>
                <button onClick={() => claim(r)} disabled={balance < r.cost_points}
                  className="border border-gold/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10 disabled:opacity-40">
                  Claim
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
