import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Dumbbell, Droplet, Beef, Sparkles, Undo2, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";

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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const d = today();
    const [xpRes, sessions, recovery, stats, nutrition, ext, mission] = await Promise.all([
      supabase.rpc("get_mission_xp_today"),
      supabase.from("workout_sessions").select("id").eq("user_id", user.id).gte("completed_at", `${d}T00:00:00Z`),
      supabase.from("recovery_logs").select("id,readiness").eq("user_id", user.id).eq("log_date", d).maybeSingle(),
      supabase.from("daily_stats").select("water_ml").eq("user_id", user.id).eq("stat_date", d).maybeSingle(),
      supabase.from("nutrition_logs").select("protein_g").eq("user_id", user.id).eq("log_date", d),
      supabase.from("user_profiles_ext").select("weight_kg").eq("user_id", user.id).maybeSingle(),
      supabase.from("daily_missions").select("completed_at").eq("user_id", user.id).eq("mission_date", d).maybeSingle(),
    ]);

    setAwarded((xpRes.data as Partial<Record<Reason, number>>) ?? {});

    const weight = Number(ext.data?.weight_kg ?? 75);
    const target = Math.max(80, Math.round(weight * 1.6));
    setProteinTarget(target);

    const water = Number(stats.data?.water_ml ?? 0);
    const protein = (nutrition.data ?? []).reduce((s, r) => s + Number(r.protein_g ?? 0), 0);
    setWaterMl(water);
    setProteinG(protein);

    setEvidence({
      // Planned recovery counts as valid workout progress.
      mission_workout: (sessions.data?.length ?? 0) > 0 || !!recovery.data,
      mission_water: water >= 2000,
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

  const earned = ACTIONS.reduce((s, a) => s + (awarded[a.reason] ?? 0), 0);
  const pct = Math.min(100, earned);

  if (loading) {
    return <div className="mt-5 h-44 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;
  }

  return (
    <section className="mt-5 border border-gold/25 bg-deluxe-forest/15 p-5">
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

      <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
        <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
        A logged recovery check-in counts as valid workout progress, so planned rest, injury adjustments and
        medically appropriate days off never break your streak.
      </p>
    </section>
  );
}
