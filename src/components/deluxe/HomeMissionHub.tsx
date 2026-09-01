import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check, Dumbbell, Droplet, Beef, Sparkles, Flame, Trophy, Moon, Undo2, ChevronRight, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { haptic } from "@/hooks/useHaptics";
import { XpRing } from "@/components/deluxe/XpRing";
import { Confetti } from "@/components/deluxe/Confetti";
import { StreakBadges } from "@/components/deluxe/StreakBadges";
import { proteinTargetG, waterTargetMl as waterTargetFor, XP_RANKS } from "@/lib/targets";
import { enqueueOrApply } from "@/lib/offlineQueue";

type Reason = "mission_workout" | "mission_water" | "mission_protein" | "mission_mindset";

const ACTIONS: {
  reason: Reason;
  label: string;
  short: string;
  xp: number;
  icon: typeof Dumbbell;
  to: "/app/workouts" | "/app/nutrition" | "/app/coach";
  cta: string;
}[] = [
  { reason: "mission_workout", label: "Workout or planned recovery", short: "Train", xp: 50, icon: Dumbbell, to: "/app/workouts", cta: "Start today's session" },
  { reason: "mission_water", label: "Hydration target", short: "Hydrate", xp: 20, icon: Droplet, to: "/app/nutrition", cta: "Log water" },
  { reason: "mission_protein", label: "Protein target", short: "Protein", xp: 20, icon: Beef, to: "/app/nutrition", cta: "Log a meal" },
  { reason: "mission_mindset", label: "Mindset check-in", short: "Mindset", xp: 10, icon: Sparkles, to: "/app/coach", cta: "Check in" },
];

const today = () => new Date().toISOString().slice(0, 10);

interface Summary { total_xp: number; rank: string; next_rank_at: number; progress_pct: number }

export function HomeMissionHub() {
  const { user } = useAuth();
  const [awarded, setAwarded] = useState<Partial<Record<Reason, number>>>({});
  const [evidence, setEvidence] = useState<Record<Reason, boolean>>({
    mission_workout: false, mission_water: false, mission_protein: false, mission_mindset: false,
  });
  const [targets, setTargets] = useState({ protein: 120, water: 2000 });
  const [live, setLive] = useState({ waterMl: 0, proteinG: 0, sleepHours: 0 });
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, complete_today: false });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [points, setPoints] = useState(0);
  const [challenge, setChallenge] = useState<{ title: string; progress: number; target: number; reward: number } | null>(null);
  const [busy, setBusy] = useState<Reason | "all" | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [pop, setPop] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const d = today();
    const [xpRes, streakRes, sumRes, sessions, recovery, stats, nutrition, ext, mission, pts, part] = await Promise.all([
      supabase.rpc("get_mission_xp_today"),
      supabase.rpc("get_xp_streak"),
      supabase.rpc("get_xp_summary"),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).not("completed_at", "is", null).gt("duration_min", 0).gte("completed_at", `${d}T00:00:00Z`),
      supabase.from("recovery_logs").select("id").eq("user_id", user.id).eq("log_date", d).maybeSingle(),
      supabase.from("daily_stats").select("water_ml,sleep_hours").eq("user_id", user.id).eq("stat_date", d).maybeSingle(),
      supabase.from("nutrition_logs").select("protein_g").eq("user_id", user.id).eq("log_date", d),
      supabase.from("user_profiles_ext").select("weight_kg").eq("user_id", user.id).maybeSingle(),
      supabase.from("daily_missions").select("completed_at").eq("user_id", user.id).eq("mission_date", d).maybeSingle(),
      supabase.from("reward_points").select("balance_after").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("challenge_participants").select("progress,challenges(title,goal_target,points_reward)").eq("user_id", user.id).is("completed_at", null).order("joined_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setAwarded((xpRes.data as Partial<Record<Reason, number>>) ?? {});
    if (streakRes.data) setStreak(streakRes.data as unknown as typeof streak);
    if (sumRes.data) setSummary(sumRes.data as unknown as Summary);
    if (pts.data) setPoints(Number(pts.data.balance_after ?? 0));

    const ch = part.data as unknown as { progress: number; challenges: { title: string; goal_target: number; points_reward: number } | null } | null;
    setChallenge(ch?.challenges ? { title: ch.challenges.title, progress: Number(ch.progress ?? 0), target: Number(ch.challenges.goal_target ?? 1), reward: Number(ch.challenges.points_reward ?? 0) } : null);

    const weight = Number(ext.data?.weight_kg ?? 75);
    const protein = proteinTargetG(weight);
    const water = waterTargetFor(weight);
    setTargets({ protein, water });

    const waterMl = Number(stats.data?.water_ml ?? 0);
    const proteinG = (nutrition.data ?? []).reduce((s, r) => s + Number(r.protein_g ?? 0), 0);
    setLive({ waterMl, proteinG, sleepHours: Number(stats.data?.sleep_hours ?? 0) });

    setEvidence({
      mission_workout: (sessions.data?.length ?? 0) > 0 || !!recovery.data,
      mission_water: waterMl >= water,
      mission_protein: proteinG >= protein,
      mission_mindset: !!mission.data?.completed_at || !!recovery.data,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const earned = ACTIONS.reduce((s, a) => s + (awarded[a.reason] ?? 0), 0);
  const remaining = Math.max(0, 100 - earned);
  const readyList = ACTIONS.filter((a) => evidence[a.reason] && !awarded[a.reason]);
  const nextAction = ACTIONS.find((a) => !evidence[a.reason] && !awarded[a.reason]) ?? null;

  const flash = (text: string) => {
    setPop(text);
    window.setTimeout(() => setPop(null), 1400);
  };

  const claim = async (reasons: Reason[], key: Reason | "all") => {
    if (reasons.length === 0) return;
    setBusy(key);
    for (const r of reasons) {
      const { error } = await supabase.rpc("award_mission_xp", { _reason: r });
      if (error) { setBusy(null); return toast.error(error.message); }
    }
    const gained = reasons.reduce((s, r) => s + (ACTIONS.find((a) => a.reason === r)?.xp ?? 0), 0);
    setBusy(null);
    haptic("success");
    flash(`+${gained} XP`);
    if (earned + gained >= 100) {
      setCelebrate(true);
      toast.success("100 XP day secured — streak extended.");
    }
    await load();
  };

  const undo = async (reason: Reason) => {
    setBusy(reason);
    const { error } = await supabase.rpc("revoke_mission_xp", { _reason: reason });
    setBusy(null);
    if (error) return toast.error(error.message);
    haptic("warning");
    await load();
  };

  // One-tap hydration. Water can be logged as often as the member likes, but
  // the hydration XP is only awarded on the tap that first crosses the target.
  const addWater = async (amount: number) => {
    if (!user) return;
    setBusy("mission_water");
    const before = live.waterMl;
    const next = Math.max(0, Math.min(8000, before + amount));
    const result = await enqueueOrApply({ kind: "dailyStats", userId: user.id, date: today(), patch: { water_ml: next } });
    setBusy(null);
    if (!result.ok) return toast.error(`Couldn't save hydration: ${result.error}`);
    haptic("light");
    setLive((p) => ({ ...p, waterMl: next }));
    flash(`+${amount} ml`);
    const crossedNow = before < targets.water && next >= targets.water;
    if (!result.queued && crossedNow && !awarded.mission_water) {
      await supabase.rpc("award_xp", { _reason: "water" });
      toast.success("Hydration target hit — claim your 20 XP.");
    }
    await load();
  };

  const checkInMindset = async () => {
    if (!user) return;
    setBusy("mission_mindset");
    const d = today();
    const existing = await supabase.from("daily_missions").select("id").eq("user_id", user.id).eq("mission_date", d).maybeSingle();
    const { error } = existing.data?.id
      ? await supabase.from("daily_missions").update({ completed_at: new Date().toISOString() }).eq("id", existing.data.id)
      : await supabase.from("daily_missions").insert({ user_id: user.id, mission_date: d, completed_at: new Date().toISOString() });
    setBusy(null);
    if (error) return toast.error(error.message);
    haptic("success");
    flash("Checked in");
    await load();
  };

  if (loading) return <div className="mt-5 h-72 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;

  const rankIndex = summary ? Math.max(0, XP_RANKS.findIndex((r) => r.name === summary.rank)) : 0;
  const nextRank = XP_RANKS[Math.min(XP_RANKS.length - 1, rankIndex + 1)];

  // Proactive coach recommendation — the single highest-value next move.
  const coach = readyList.length > 0
    ? {
        title: `Claim ${readyList.reduce((s, a) => s + a.xp, 0)} XP now`,
        body: `${readyList.map((a) => a.label.toLowerCase()).join(" and ")} ${readyList.length > 1 ? "are" : "is"} complete and waiting to be banked.`,
      }
    : nextAction
      ? {
          title: nextAction.cta,
          body:
            nextAction.reason === "mission_water"
              ? `${Math.max(0, targets.water - live.waterMl)} ml to go — tap +250 or +500 ml below.`
              : nextAction.reason === "mission_protein"
                ? `${Math.max(0, targets.protein - Math.round(live.proteinG))} g of protein left today. Your Plan has the exact meals.`
                : nextAction.reason === "mission_workout"
                  ? "Training is worth 50 XP — the biggest single move of your day."
                  : "A 60-second mindset check-in closes your day at 100 XP.",
        }
      : { title: "Perfect day logged", body: `All four actions banked. Streak now ${streak.current_streak} day${streak.current_streak === 1 ? "" : "s"}.` };

  return (
    <section id="mission" className="relative mt-5 scroll-mt-24 overflow-hidden border border-gold/25 bg-gradient-to-br from-deluxe-forest/35 to-deluxe-black p-5">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      {pop && (
        <div className="pointer-events-none absolute left-1/2 top-8 z-10 -translate-x-1/2 animate-[xpPop_1.3s_ease-out_forwards] font-display text-2xl text-gold-gradient">
          {pop}
        </div>
      )}

      {/* Ring + headline stats */}
      <div className="flex items-center gap-5">
        <XpRing value={earned} total={100} />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.24em] text-gold">Daily Mission</div>
          <div className="mt-1 font-display text-xl leading-tight text-foreground">
            {remaining === 0 ? "Day complete" : `${remaining} XP to go`}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 border border-gold/30 bg-deluxe-black/50 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-gold">
              <Flame className="h-3 w-3" /> {streak.current_streak} day
            </span>
            <span className="inline-flex items-center gap-1 border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              <Trophy className="h-3 w-3" /> Best {streak.longest_streak}
            </span>
            <Link to="/app/rewards" className="inline-flex items-center gap-1 border border-gold/15 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground hover:border-gold/50 hover:text-gold">
              <Sparkles className="h-3 w-3 text-gold" /> {points.toLocaleString()} pts
            </Link>
          </div>
        </div>
      </div>

      {/* Level progression */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em]">
          <span className="text-gold">{summary?.rank ?? "Beginner"}</span>
          <span className="text-muted-foreground">
            {summary && summary.next_rank_at > summary.total_xp
              ? `${(summary.next_rank_at - summary.total_xp).toLocaleString()} XP to ${nextRank.name}`
              : "Max rank"}
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full bg-gold/10">
          <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${Math.min(100, Number(summary?.progress_pct ?? 0))}%` }} />
        </div>
      </div>

      {/* Proactive coach card */}
      <div className="mt-4 border border-gold/30 bg-deluxe-black/50 p-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold">
            <Wand2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gold">AI Coach · next best action</div>
            <div className="mt-0.5 text-sm text-foreground">{coach.title}</div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{coach.body}</p>
          </div>
          <Link to="/app/coach" className="shrink-0 self-center text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold">
            Ask
          </Link>
        </div>
      </div>

      {/* Dominant Next Mission action */}
      <div className="mt-4">
        {readyList.length > 0 ? (
          <button
            onClick={() => claim(readyList.map((a) => a.reason), "all")}
            disabled={busy === "all"}
            className="w-full min-h-14 bg-gold-gradient px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition disabled:opacity-40"
          >
            {busy === "all" ? "Claiming…" : `Claim ${readyList.reduce((s, a) => s + a.xp, 0)} XP`}
          </button>
        ) : nextAction && nextAction.reason === "mission_water" ? (
          <button
            onClick={() => addWater(500)}
            disabled={busy === "mission_water"}
            className="w-full min-h-14 bg-gold-gradient px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition disabled:opacity-40"
          >
            Next mission · +500 ml water
          </button>
        ) : nextAction && nextAction.reason === "mission_mindset" ? (
          <button
            onClick={checkInMindset}
            disabled={busy === "mission_mindset"}
            className="w-full min-h-14 bg-gold-gradient px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition disabled:opacity-40"
          >
            Next mission · mindset check-in
          </button>
        ) : nextAction ? (
          <Link
            to={nextAction.to}
            className="flex w-full min-h-14 items-center justify-center bg-gold-gradient px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black"
          >
            Next mission · {nextAction.cta}
          </Link>
        ) : (
          <div className="border border-gold/30 bg-gold/5 p-4 text-center text-[11px] uppercase tracking-[0.18em] text-gold">
            100 XP secured — see you tomorrow
          </div>
        )}
      </div>

      {/* Compact action strip */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {ACTIONS.map((a) => {
          const done = !!awarded[a.reason];
          const ready = evidence[a.reason];
          const Icon = a.icon;
          return (
            <button
              key={a.reason}
              onClick={() => {
                if (done) return undo(a.reason);
                if (ready) return claim([a.reason], a.reason);
                if (a.reason === "mission_water") return addWater(250);
                if (a.reason === "mission_mindset") return checkInMindset();
                window.location.assign(a.to);
              }}
              disabled={busy === a.reason}
              className={`flex flex-col items-center gap-1 border px-1 py-2.5 text-[8px] uppercase tracking-[0.14em] transition ${
                done ? "border-gold/50 bg-gold/10 text-gold" : ready ? "border-gold/40 text-gold" : "border-gold/15 text-muted-foreground hover:border-gold/40 hover:text-gold"
              } disabled:opacity-50`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current">
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span>{done ? "Done" : ready ? "Claim" : a.short}</span>
              <span className="text-[8px] opacity-70">{done ? <Undo2 className="h-2.5 w-2.5" /> : `+${a.xp}`}</span>
            </button>
          );
        })}
      </div>

      {/* Compact water / protein / sleep indicators */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Meter icon={Droplet} label="Water" value={`${(live.waterMl / 1000).toFixed(1)}L`} pct={(live.waterMl / targets.water) * 100} />
        <Meter icon={Beef} label="Protein" value={`${Math.round(live.proteinG)}g`} pct={(live.proteinG / targets.protein) * 100} />
        <Meter icon={Moon} label="Sleep" value={`${live.sleepHours || 0}h`} pct={(live.sleepHours / 8) * 100} />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => addWater(250)} disabled={busy === "mission_water"} className="flex-1 min-h-11 border border-gold/40 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10 disabled:opacity-50">
          +250 ml
        </button>
        <button onClick={() => addWater(500)} disabled={busy === "mission_water"} className="flex-1 min-h-11 border border-gold/40 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10 disabled:opacity-50">
          +500 ml
        </button>
        <Link to="/app/nutrition" className="flex flex-1 min-h-11 items-center justify-center border border-gold/25 text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:border-gold/60 hover:text-gold">
          Log meal
        </Link>
      </div>

      {/* Daily challenge progress */}
      {challenge && (
        <Link to="/app/challenges" className="mt-3 block border border-gold/20 bg-deluxe-black/40 p-3 hover:border-gold/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold">Active challenge · +{challenge.reward} pts</div>
              <div className="truncate text-sm text-foreground">{challenge.title}</div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gold" />
          </div>
          <div className="mt-2 h-1 w-full bg-gold/10">
            <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${Math.min(100, (challenge.progress / Math.max(1, challenge.target)) * 100)}%` }} />
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {challenge.progress} / {challenge.target}
          </div>
        </Link>
      )}

      {/* Streak milestone badges */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Streak badges</div>
          <Link to="/app/badges" className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold">Gallery →</Link>
        </div>
        <div className="mt-2">
          <StreakBadges current={streak.current_streak} best={streak.longest_streak} />
        </div>
      </div>
    </section>
  );
}

function Meter({ icon: Icon, label, value, pct }: { icon: typeof Droplet; label: string; value: string; pct: number }) {
  const p = Math.min(100, Math.max(0, Math.round(pct || 0)));
  return (
    <div className="border border-gold/15 bg-deluxe-black/40 p-2.5">
      <div className="flex items-center justify-between">
        <Icon className="h-3.5 w-3.5 text-gold" />
        <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 font-display text-base text-foreground">{value}</div>
      <div className="mt-1 h-0.5 w-full bg-gold/10">
        <div className="h-full bg-gold-gradient transition-all duration-700" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
