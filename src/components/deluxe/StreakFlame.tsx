import { Flame, Snowflake } from "lucide-react";

interface Props {
  currentLen: number;
  longestLen?: number;
  freezesRemaining?: number;
  atRisk?: boolean;
}

export function StreakFlame({ currentLen, longestLen = 0, freezesRemaining = 0, atRisk = false }: Props) {
  return (
    <div className="flex items-center gap-3 border border-gold/20 bg-deluxe-forest/20 p-3">
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-gold/5 ${atRisk ? "animate-pulse" : ""}`}>
        <Flame className={`h-6 w-6 ${currentLen > 0 ? "text-gold" : "text-muted-foreground"}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl text-foreground tabular-nums">{currentLen}</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            day{currentLen === 1 ? "" : "s"}
          </span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          Best {longestLen} · {atRisk ? <span className="text-gold">At risk tonight</span> : "Keep going"}
        </div>
      </div>
      {freezesRemaining > 0 && (
        <div title="Streak freeze available" className="flex items-center gap-1 border border-gold/30 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-gold">
          <Snowflake className="h-3 w-3" /> {freezesRemaining}
        </div>
      )}
    </div>
  );
}
