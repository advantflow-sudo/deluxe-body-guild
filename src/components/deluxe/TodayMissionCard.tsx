import { Link } from "@tanstack/react-router";
import { Dumbbell, Flame, Droplet, Footprints, Activity, Gift, ChevronRight, Target } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";

interface Workout {
  id: string;
  title: string;
  category: string;
  duration_min: number;
  level: string;
}

interface Props {
  workout: Workout | null;
  steps: number;
  caloriesBurned: number;
  waterMl: number;
  streak: number;
  weekSessions: number;
}

// Targets
const STEP_GOAL = 10_000;
const WATER_GOAL_ML = 2_500;
const CAL_GOAL = 600; // calories burned/day target
const SESSIONS_PER_REWARD = 3;

export function TodayMissionCard({ workout, steps, caloriesBurned, waterMl, streak, weekSessions }: Props) {
  const sessionsToReward = Math.max(0, SESSIONS_PER_REWARD - (weekSessions % SESSIONS_PER_REWARD));
  const stepsRemaining = Math.max(0, STEP_GOAL - steps);
  const waterRemaining = Math.max(0, WATER_GOAL_ML - waterMl);
  const calRemaining = Math.max(0, CAL_GOAL - caloriesBurned);

  return (
    <section className="mt-5 border border-gold/40 bg-gold-gradient/[0.06] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-gold" />
        <SectionLabel>Today's Mission</SectionLabel>
      </div>

      {/* Primary: today's workout */}
      <Link
        to="/app/workouts"
        className="mt-3 flex items-center justify-between gap-3 border border-gold/30 bg-deluxe-black/40 p-4 transition hover:border-gold"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Dumbbell className="h-5 w-5 shrink-0 text-gold" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Workout</div>
            <div className="font-display text-base text-foreground truncate sm:text-lg">
              {workout?.title ?? "Rest day — log a quick session"}
            </div>
            {workout && (
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {workout.category} · {workout.duration_min} min · {workout.level}
              </div>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gold" />
      </Link>

      {/* Mission grid */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
        <MissionRow
          icon={Flame}
          label="Calories"
          value={`${calRemaining.toLocaleString()} left`}
          progress={Math.min(100, (caloriesBurned / CAL_GOAL) * 100)}
        />
        <MissionRow
          icon={Droplet}
          label="Water"
          value={`${(waterRemaining / 1000).toFixed(1)}L left`}
          progress={Math.min(100, (waterMl / WATER_GOAL_ML) * 100)}
        />
        <MissionRow
          icon={Footprints}
          label="Steps"
          value={`${steps.toLocaleString()} / ${(STEP_GOAL / 1000).toFixed(0)}k`}
          progress={Math.min(100, (steps / STEP_GOAL) * 100)}
        />
        <MissionRow
          icon={Activity}
          label="Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          progress={Math.min(100, (streak / 30) * 100)}
        />
      </div>

      {/* Reward nudge */}
      <Link
        to="/app/rewards"
        className="mt-3 flex items-center justify-between gap-3 border border-gold/20 bg-deluxe-forest/30 px-4 py-3 hover:border-gold/50"
      >
        <div className="flex items-center gap-2.5">
          <Gift className="h-4 w-4 text-gold" />
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground">
            {sessionsToReward === 0
              ? "Reward unlocked — claim it"
              : `Next reward · ${sessionsToReward} workout${sessionsToReward === 1 ? "" : "s"} away`}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gold" />
      </Link>
    </section>
  );
}

function MissionRow({
  icon: Icon,
  label,
  value,
  progress,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="border border-gold/15 bg-deluxe-black/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-gold" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="mt-1.5 font-display text-sm text-foreground sm:text-base">{value}</div>
      <div className="mt-2 h-1 w-full overflow-hidden bg-gold/10">
        <div
          className="h-full bg-gold-gradient transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
