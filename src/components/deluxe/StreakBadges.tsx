import { Flame, Crown, Gem, Medal, Lock } from "lucide-react";

export type Milestone = {
  days: number;
  name: string;
  icon: typeof Flame;
  blurb: string;
};

export const MILESTONES: Milestone[] = [
  { days: 3, name: "Ignition", icon: Flame, blurb: "3 perfect days in a row" },
  { days: 7, name: "Sterling Week", icon: Medal, blurb: "7 perfect days in a row" },
  { days: 14, name: "Gold Standard", icon: Gem, blurb: "14 perfect days in a row" },
  { days: 30, name: "Deluxe Crown", icon: Crown, blurb: "30 perfect days in a row" },
];

export function nextMilestone(best: number) {
  return MILESTONES.find((m) => best < m.days) ?? null;
}

/**
 * Luxury achievement badges for XP streak milestones.
 * `current` drives the "live" glow, `best` drives what is permanently unlocked.
 */
export function StreakBadges({
  current,
  best,
  compact = false,
}: {
  current: number;
  best: number;
  compact?: boolean;
}) {
  const next = nextMilestone(best);

  return (
    <div>
      <div className={`grid grid-cols-4 gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {MILESTONES.map((m) => {
          const Icon = m.icon;
          const unlocked = best >= m.days;
          const live = current >= m.days;
          return (
            <div
              key={m.days}
              title={unlocked ? `${m.name} — ${m.blurb}` : `Locked · ${m.blurb}`}
              aria-label={
                unlocked
                  ? `${m.name} badge unlocked at ${m.days} day streak`
                  : `${m.name} badge locked, needs a ${m.days} day streak`
              }
              className={`flex flex-col items-center gap-1 border px-1.5 py-2.5 text-center transition ${
                unlocked
                  ? "border-gold/45 bg-gradient-to-b from-gold/12 to-transparent"
                  : "border-gold/10 bg-deluxe-black/40 opacity-55"
              } ${live ? "shadow-[0_0_18px_-6px_hsl(var(--gold))]" : ""}`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  unlocked ? "bg-gold text-deluxe-black" : "border border-gold/25 text-muted-foreground"
                }`}
              >
                {unlocked ? <Icon className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
              </span>
              <span
                className={`text-[8px] uppercase tracking-[0.14em] ${
                  unlocked ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {m.name}
              </span>
              <span className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{m.days}d</span>
            </div>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {next
            ? `${next.days - best} more perfect ${next.days - best === 1 ? "day" : "days"} to unlock ${next.name}.`
            : "Every streak badge unlocked — you are in Deluxe Crown territory."}
        </p>
      )}
    </div>
  );
}
