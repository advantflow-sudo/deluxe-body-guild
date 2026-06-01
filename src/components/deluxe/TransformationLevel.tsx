import { Medal, Trophy, Crown, Sparkles } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";

const TIERS = [
  { name: "Rookie", min: 0, Icon: Sparkles, color: "text-muted-foreground" },
  { name: "Bronze", min: 500, Icon: Medal, color: "text-amber-600" },
  { name: "Silver", min: 2000, Icon: Medal, color: "text-zinc-300" },
  { name: "Gold", min: 5000, Icon: Trophy, color: "text-gold" },
  { name: "Deluxe", min: 12000, Icon: Crown, color: "text-gold" },
] as const;

export function TransformationLevel({ points }: { points: number }) {
  const currentIdx = TIERS.reduce((acc, t, i) => (points >= t.min ? i : acc), 0);
  const current = TIERS[currentIdx];
  const next = TIERS[currentIdx + 1];
  const pct = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100;
  const CurIcon = current.Icon;

  return (
    <div className="border border-gold/30 bg-gold-gradient/10 p-5">
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel>Transformation Level</SectionLabel>
          <div className="mt-2 flex items-center gap-2">
            <CurIcon className={`h-6 w-6 ${current.color}`} />
            <span className="font-display text-2xl text-foreground">{current.name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{points.toLocaleString()} pts</p>
        </div>
        {next && (
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Next</div>
            <div className="font-display text-sm text-gold">{next.name}</div>
            <div className="text-[10px] text-muted-foreground">{(next.min - points).toLocaleString()} pts away</div>
          </div>
        )}
      </div>

      {next && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-gold/10">
            <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-5 gap-2">
        {TIERS.map((t, i) => {
          const Ic = t.Icon;
          const reached = i <= currentIdx;
          return (
            <div
              key={t.name}
              className={`flex flex-col items-center gap-1 border p-2 text-center transition ${
                reached ? "border-gold/40 bg-gold/5" : "border-gold/10 opacity-40"
              }`}
            >
              <Ic className={`h-4 w-4 ${reached ? t.color : "text-muted-foreground"}`} />
              <span className="text-[9px] uppercase tracking-[0.12em] text-foreground">{t.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
