import { Sparkles, TrendingUp } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";

interface Props {
  workoutCompletedToday: boolean;
  steps: number;
  waterMl: number;
  caloriesBurned: number;
  streak: number;
}

const STEP_GOAL = 10_000;
const WATER_GOAL_ML = 2_500;
const CAL_GOAL = 600;

interface Component {
  label: string;
  earned: number;
  max: number;
  hit: boolean;
}

function getRating(score: number): { label: string; tone: string } {
  if (score >= 90) return { label: "Elite", tone: "text-gold" };
  if (score >= 75) return { label: "Strong", tone: "text-emerald-400" };
  if (score >= 50) return { label: "Improving", tone: "text-amber-400" };
  return { label: "Rebuild", tone: "text-rose-400" };
}

export function DeluxeScoreCard({
  workoutCompletedToday,
  steps,
  waterMl,
  caloriesBurned,
  streak,
}: Props) {
  const components: Component[] = [
    {
      label: "Workout",
      max: 30,
      hit: workoutCompletedToday,
      earned: workoutCompletedToday ? 30 : 0,
    },
    {
      label: "Steps",
      max: 20,
      hit: steps >= STEP_GOAL,
      earned: Math.round(Math.min(1, steps / STEP_GOAL) * 20),
    },
    {
      label: "Water",
      max: 20,
      hit: waterMl >= WATER_GOAL_ML,
      earned: Math.round(Math.min(1, waterMl / WATER_GOAL_ML) * 20),
    },
    {
      label: "Calories",
      max: 15,
      hit: caloriesBurned >= CAL_GOAL,
      earned: Math.round(Math.min(1, caloriesBurned / CAL_GOAL) * 15),
    },
    {
      label: "Streak",
      max: 15,
      hit: streak >= 7,
      earned: Math.round(Math.min(1, streak / 7) * 15),
    },
  ];

  const score = components.reduce((sum, c) => sum + c.earned, 0);
  const rating = getRating(score);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <section className="mt-5 border border-gold/30 bg-deluxe-forest/30 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        <SectionLabel>Deluxe Score</SectionLabel>
      </div>

      <div className="mt-4 flex items-center gap-5 sm:gap-6">
        {/* Circular score */}
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(212,175,55,0.15)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#deluxeGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="deluxeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d97a" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-3xl text-foreground sm:text-4xl">{score}</div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">/ 100</div>
          </div>
        </div>

        {/* Rating + breakdown */}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Today's Rating</div>
          <div className={`font-display text-2xl sm:text-3xl ${rating.tone}`}>{rating.label}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-gold" />
            {100 - score === 0 ? "Perfect day" : `${100 - score} pts to Elite`}
          </div>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {components.map((c) => (
          <div key={c.label} className="text-center">
            <div
              className={`mx-auto h-1 w-full ${
                c.hit ? "bg-gold-gradient" : c.earned > 0 ? "bg-gold/40" : "bg-gold/10"
              }`}
            />
            <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {c.label}
            </div>
            <div className={`text-[10px] ${c.hit ? "text-gold" : "text-foreground/70"}`}>
              {c.earned}/{c.max}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
