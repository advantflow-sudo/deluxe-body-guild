import { type ReactNode } from "react";
import { Apple, Dumbbell, Droplet, Moon, Sparkles, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { DeluxeScoreBreakdown } from "@/hooks/useDeluxeScore";

export type ScoreCategory = "training" | "water" | "nutrition" | "sleep" | "goals";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ScoreCategory | null;
  score: DeluxeScoreBreakdown;
}

const ICONS: Record<ScoreCategory, typeof Dumbbell> = {
  training: Dumbbell,
  water: Droplet,
  nutrition: Apple,
  sleep: Moon,
  goals: Sparkles,
};

interface Section {
  title: string;
  earned: number;
  max: number;
  rule: string;
  rows: { label: string; value: ReactNode }[];
}

function buildSection(category: ScoreCategory, score: DeluxeScoreBreakdown): Section {
  const d = score.details;
  switch (category) {
    case "training":
      return {
        title: "Training",
        earned: score.training, max: 20,
        rule: "Complete at least one workout today = 20 pts.",
        rows: [
          { label: "Workouts today", value: d.workoutCount },
          { label: "Threshold", value: "≥ 1 session" },
          { label: "Result", value: score.training === 20 ? "Awarded" : "Pending" },
        ],
      };
    case "water":
      return {
        title: "Water",
        earned: score.water, max: 10,
        rule: `pts = min(10, round(ml / ${d.waterTargetMl} × 10))`,
        rows: [
          { label: "Logged today", value: `${d.waterMl} ml` },
          { label: "Target", value: `${d.waterTargetMl} ml` },
          { label: "Progress", value: `${Math.min(100, Math.round((d.waterMl / d.waterTargetMl) * 100))}%` },
        ],
      };
    case "nutrition":
      return {
        title: "Nutrition",
        earned: score.nutrition, max: 15,
        rule: `Logged any meal = 10. Within ${d.calorieMin}–${d.calorieMax} kcal = +5.`,
        rows: [
          { label: "Meals logged", value: d.mealCount },
          { label: "Calories today", value: `${d.totalCalories.toLocaleString()} kcal` },
          { label: "Target window", value: `${d.calorieMin}–${d.calorieMax} kcal` },
        ],
      };
    case "sleep":
      return {
        title: "Sleep",
        earned: score.sleep, max: 15,
        rule: `pts = min(15, round(hours / ${d.sleepTargetHours} × 15))`,
        rows: [
          { label: "Logged", value: `${d.sleepHours.toFixed(1)} h` },
          { label: "Target", value: `${d.sleepTargetHours} h` },
          { label: "Progress", value: `${Math.min(100, Math.round((d.sleepHours / d.sleepTargetHours) * 100))}%` },
        ],
      };
    case "goals":
      return {
        title: "Daily Goals",
        earned: score.dailyGoals, max: 40,
        rule: "Each completed goal = 8 pts, up to 5 goals (40 pts).",
        rows: [
          { label: "Completed", value: `${d.goalsCompleted} / ${d.goalSlots}` },
          { label: "Active goals set", value: d.goalsTotal },
          { label: "Per goal", value: "8 pts" },
        ],
      };
  }
}

export function ScoreBreakdownDrawer({ open, onOpenChange, category, score }: Props) {
  if (!category) return null;
  const section = buildSection(category, score);
  const Icon = ICONS[category];
  const pct = section.max > 0 ? Math.min(100, (section.earned / section.max) * 100) : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-t border-gold/30 bg-deluxe-black text-foreground">
        <DrawerHeader className="px-5 pt-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center border border-gold/40 bg-deluxe-forest/30">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Category</div>
                <DrawerTitle className="font-display text-xl text-foreground">{section.title}</DrawerTitle>
              </div>
            </div>
            <DrawerClose
              className="flex h-8 w-8 items-center justify-center border border-gold/20 text-muted-foreground hover:text-gold"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-5 pb-7">
          <div className="flex items-end justify-between border-b border-gold/15 pb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Earned today</div>
              <div className="font-display text-3xl text-foreground tabular-nums">
                {section.earned}<span className="text-base text-muted-foreground"> / {section.max}</span>
              </div>
            </div>
            <div className="w-32 text-right">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Progress</div>
              <div className="mt-1 h-1.5 w-full bg-gold/10">
                <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <dl className="mt-4 space-y-2.5">
            {section.rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between border border-gold/10 bg-deluxe-forest/15 px-3 py-2.5 text-sm">
                <dt className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{r.label}</dt>
                <dd className="font-medium text-foreground tabular-nums">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border border-gold/15 bg-gold/5 p-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Formula</div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">{section.rule}</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
