import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Dumbbell, Droplet, Beef, Sparkles, Undo2, HeartPulse, Flame, Trophy, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { useConfirm } from "@/components/deluxe/ConfirmDialog";
import { StreakBadges } from "@/components/deluxe/StreakBadges";

type Reason = "mission_workout" | "mission_water" | "mission_protein" | "mission_mindset";

const ACTIONS: {
  reason: Reason;
  label: string;
  xp: number;
  icon: typeof Dumbbell;
  to: "/app/workouts" | "/app/habits" | "/app/nutrition" | "/app/coach";
}[] = [
  { reason: "mission_workout", label: "Workout or planned recovery", xp: 50, icon: Dumbbell, to: "/app/workouts" },
  { reason: "mission_water", label: "Hydration target", xp: 20, icon: Droplet, to: "/app/habits" },
  { reason: "mission_protein", label: "Protein target", xp: 20, icon: Beef, to: "/app/nutrition" },
  { reason: "mission_mindset", label: "Mindset check-in", xp: 10, icon: Sparkles, to: "/app/coach" },
];

const today = () => new Date().toISOString().slice(0, 10);

interface Evidence {
  mission_workout: boolean;
  mission_water: boolean;
  mission_protein: boolean;
  mission_mindset: boolean;
}

export function DailyXpMission() {
  const { user } = useAuth();
  const [awarded, setAwarded] = useState<Partial<Record<Reason, number>>>({});
  const [evidence, setEvidence] = useState<Evidence>({
    mission_workout: false,
    mission_water: false,
    mission_protein: false,
    mission_mindset: false,
  });
  const [proteinTarget, setProteinTarget] = useState(120);
  const [waterMl, setWaterMl] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [busy, setBusy] = useState<Reason | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, complete_today: false });
  const confirmDialog = useConfirm();

  const load = useCallback(async () => {
    if (!user) return;
    const d = today();
    const [xpRes, streakRes, sessions, recovery, stats, nutrition, ext, mission] = await Promise.all([
      supabase.rpc("get_mission_xp_today"),
      supabase.rpc("get_xp_streak"),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("completed_at", `${d}T00:00:00Z`),
      supabase.from("recovery_logs").select("id,readiness").eq("user_id", user.id).eq("log_date", d).maybeSingle(),
      supabase.from("daily_stats").select("water_ml").eq("user_id", user.id).eq("stat_date", d).maybeSingle(),
      supabase.from("nutrition_logs").select("protein_g").eq("user_id", user.id).eq("log_date", d),
      supabase.from("user_profiles_ext").select("weight_kg").eq("user_id", user.id).maybeSingle(),
      supabase.from("daily_missions").select("completed_at").eq("user_id", user.id).eq("mission_date", d).maybeSingle(),
    ]);

    setAwarded((xpRes.data as Partial<Record<Reason, number>>) ?? {});
    if (streakRes.data) setStreak(streakRes.data as unknown as typeof streak);

    const weight = Number(ext.data?.weight_kg ?? 75);
    // Unified targets — same formulas the nutrition plan uses (audit M2).
    const target = proteinTargetG(weight);
    const waterTarget = waterTargetMl(weight);
    setProteinTarget(target);
    setWaterTargetMl(waterTarget);

    const water = Number(stats.data?.water_ml ?? 0);
    const protein = (nutrition.data ?? []).reduce((s, r) => s + Number(r.protein_g ?? 0), 0);
    setWaterMl(water);
    setProteinG(protein);

    setEvidence({
      // Planned recovery counts as valid workout progress.
      mission_workout: (sessions.data?.length ?? 0) > 0 || !!recovery.data,
      mission_water: water >= waterTarget,
      mission_protein: protein >= target,
      mission_mindset: !!mission.data?.completed_at || !!recovery.data,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const claim = async (reason: Reason) => {
    setBusy(reason);
    const { error } = await supabase.rpc("award_mission_xp", { _reason: reason });
    setBusy(null);
    if (error) return toast.error(error.message);
    haptic("success");
    await load();
  };

  const undo = async (reason: Reason) => {
    setBusy(reason);
    const { error } = await supabase.rpc("revoke_mission_xp", { _reason: reason });
    setBusy(null);
    if (error) return toast.error(error.message);
    haptic("warning");
    toast.success("Log reversed");
    await load();
  };

  const claimAll = async () => {
    const pending = ACTIONS.filter((a) => evidence[a.reason] && !awarded[a.reason]);
    if (pending.length === 0) return;
    const total = pending.reduce((s2, a) => s2 + a.xp, 0);
    const ok = await confirmDialog({
      title: `Claim ${total} XP?`,
      description: `Locking in ${pending.map((p) => p.label.toLowerCase()).join(", ")}. Each action is recorded once for today and can be reversed individually.`,
      confirmLabel: `Claim ${total} XP`,
      tone: "default",
      icon: <Sparkles className="h-5 w-5" />,
    });
    if (!ok) return;
    setClaimingAll(true);
    for (const a of pending) {
      const { error } = await supabase.rpc("award_mission_xp", { _reason: a.reason });
      if (error) {
        setClaimingAll(false);
        return toast.error(error.message);
      }
    }
    setClaimingAll(false);
    haptic("success");
    await load();
    toast.success(`+${total} XP claimed — mission logged for today`);
  };

  const earned = ACTIONS.reduce((s, a) => s + (awarded[a.reason] ?? 0), 0);
  const pct = Math.min(100, earned);

  if (loading) {
    return <div className="mt-5 h-44 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;
  }

  return (
    <section id="mission" className="mt-5 scroll-mt-24 border border-gold/25 bg-deluxe-forest/15 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Daily Mission</SectionLabel>
          <h2 className="mt-1 font-display text-xl text-foreground">100 XP a day.</h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Every XP event is logged once per action per day — repeated taps cannot inflate progress.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-2xl text-gold-gradient">{earned}</div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">of 100 XP</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 border border-gold/30 bg-deluxe-black/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-gold">
          <Flame className="h-3.5 w-3.5" /> {streak.current_streak} day XP streak
        </span>
        <span className="inline-flex items-center gap-1.5 border border-gold/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Best {streak.longest_streak}
        </span>
        {streak.complete_today && (
          <span className="inline-flex items-center gap-1.5 bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-deluxe-black">
            <Check className="h-3.5 w-3.5" /> Today secured
          </span>
        )}
      </div>

      <div className="mt-4 h-1 w-full bg-gold/10">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const done = !!awarded[a.reason];
          const ready = evidence[a.reason];
          const detail =
            a.reason === "mission_water"
              ? `${waterMl} / 2000 ml`
              : a.reason === "mission_protein"
                ? `${Math.round(proteinG)} / ${proteinTarget} g`
                : null;
          return (
            <li
              key={a.reason}
              className={`flex items-center gap-3 border p-3 ${
                done ? "border-gold/40 bg-gold/5" : "border-gold/15 bg-deluxe-black/40"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-gold text-deluxe-black" : "border border-gold/30 text-gold"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-foreground">{a.label}</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  +{a.xp} XP{detail ? ` · ${detail}` : ""}
                </div>
              </div>
              {done ? (
                <button
                  onClick={() => undo(a.reason)}
                  disabled={busy === a.reason}
                  aria-label={`Reverse ${a.label} log`}
                  className="flex min-h-11 items-center gap-1 px-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
              ) : ready ? (
                <button
                  onClick={() => claim(a.reason)}
                  disabled={busy === a.reason}
                  className="min-h-11 border border-gold/50 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
                >
                  Claim
                </button>
              ) : (
                <Link
                  to={a.to}
                  className="min-h-11 px-2 pt-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                >
                  Go
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 border border-gold/20 bg-deluxe-black/40 p-3">
        <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Pre-claim readiness</div>
        <ul className="mt-2 space-y-1.5">
          {ACTIONS.map((a) => {
            const done = !!awarded[a.reason];
            const ready = evidence[a.reason];
            const missing =
              a.reason === "mission_water"
                ? `${Math.max(0, 2000 - waterMl)} ml of water to go`
                : a.reason === "mission_protein"
                  ? `${Math.max(0, proteinTarget - Math.round(proteinG))} g of protein to go`
                  : a.reason === "mission_workout"
                    ? "Log a workout or recovery check-in"
                    : "Complete today's mindset check-in";
            return (
              <li key={`ready-${a.reason}`} className="flex items-center gap-2 text-[11px]">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] ${
                    done || ready ? "bg-gold text-deluxe-black" : "border border-gold/25 text-muted-foreground"
                  }`}
                >
                  {done || ready ? <Check className="h-2.5 w-2.5" /> : <CircleDashed className="h-2.5 w-2.5" />}
                </span>
                <span className={done || ready ? "text-foreground" : "text-muted-foreground"}>
                  {done ? `${a.label} — claimed` : ready ? `${a.label} — ready to claim` : missing}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {ACTIONS.every((a) => awarded[a.reason])
            ? "Everything claimed for today."
            : ACTIONS.every((a) => evidence[a.reason] || awarded[a.reason])
              ? "All four requirements met — the full 100 XP is available."
              : `${ACTIONS.filter((a) => !evidence[a.reason] && !awarded[a.reason]).length} requirement(s) still outstanding before a full 100 XP day.`}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Streak badges</div>
          <Link to="/app/badges" className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold">
            Badge gallery →
          </Link>
        </div>
        <div className="mt-2">

          <StreakBadges current={streak.current_streak} best={streak.longest_streak} />
        </div>
      </div>

      {(() => {
        const readyCount = ACTIONS.filter((a) => evidence[a.reason] && !awarded[a.reason]).length;
        const readyXp = ACTIONS.filter((a) => evidence[a.reason] && !awarded[a.reason]).reduce((s2, a) => s2 + a.xp, 0);
        if (earned >= 100) {
          return (
            <p className="mt-4 border border-gold/30 bg-gold/5 p-3 text-center text-[11px] uppercase tracking-[0.18em] text-gold">
              Full 100 XP secured — streak extended to {streak.current_streak} days
            </p>
          );
        }
        return (
          <button
            onClick={claimAll}
            disabled={claimingAll || readyCount === 0}
            className="mt-4 w-full min-h-12 bg-gold-gradient px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {claimingAll
              ? "Claiming…"
              : readyCount === 0
                ? "Complete an action to claim"
                : `Claim ${readyXp} XP${readyXp === 100 ? "" : ` (${readyCount} ready)`}`}
          </button>
        );
      })()}

      <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
        <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
        A logged recovery check-in counts as valid workout progress, so planned rest, injury adjustments and
        medically appropriate days off never break your streak.
      </p>
    </section>
  );
}
