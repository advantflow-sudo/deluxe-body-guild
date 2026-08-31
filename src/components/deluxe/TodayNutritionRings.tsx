import { Beef, Flame, Wheat, Droplet } from "lucide-react";
import type { ReactNode } from "react";
import { useTargets } from "@/hooks/useTargets";
import { useNutritionToday } from "@/hooks/useNutritionToday";

function Bar({
  icon,
  label,
  value,
  target,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, (value / Math.max(1, target)) * 100);
  const over = value > target * 1.1;
  return (
    <div className="border border-gold/15 bg-deluxe-black/40 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-gold">{icon}</span>
          {label}
        </span>
        <span className={`text-[11px] tabular-nums ${over ? "text-destructive" : "text-gold"}`}>
          {Math.round(value)}
          <span className="text-muted-foreground">/{Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="mt-2 h-1 w-full bg-gold/10">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Today's real intake vs unified targets (src/lib/targets.ts).
 * Counts every logged meal: plan meals, quick log and food scanner.
 */
export function TodayNutritionRings({ className = "" }: { className?: string }) {
  const { targets, loading: targetsLoading } = useTargets();
  const { totals, loading } = useNutritionToday();

  // Wait for the unified targets too, otherwise the fallback numbers flash first.
  if (loading || targetsLoading || !targets) {
    return <div className={`h-32 animate-pulse border border-gold/15 bg-deluxe-forest/10 ${className}`} />;
  }

  const remaining = Math.max(0, targets.kcal - totals.kcal);

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Today · {totals.meals} {totals.meals === 1 ? "meal" : "meals"} logged
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-gold">{remaining} kcal left</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Bar icon={<Flame className="h-3.5 w-3.5" />} label="kcal" value={totals.kcal} target={targets.kcal} unit="" />
        <Bar icon={<Beef className="h-3.5 w-3.5" />} label="Protein" value={totals.protein} target={targets.protein} unit="g" />
        <Bar icon={<Wheat className="h-3.5 w-3.5" />} label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
        <Bar icon={<Droplet className="h-3.5 w-3.5" />} label="Fat" value={totals.fat} target={targets.fat} unit="g" />
      </div>
    </div>
  );
}
