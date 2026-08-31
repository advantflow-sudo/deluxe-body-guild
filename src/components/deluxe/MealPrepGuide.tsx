/**
 * Meal-prep phase for the Deluxe meal plan.
 *
 * "Cook this meal" opens this guide: mise en place (ingredient checklist with
 * raw/cooked basis), timed step-by-step cooking with a per-step timer, and a
 * shopping list the member can copy or download for the whole day.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Check, ChefHat, Clock, Copy, Download, ListChecks, Pause, Play, Plus, ShoppingBasket, Trash2, TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/hooks/useHaptics";
import { useGroceryList } from "@/hooks/useGroceryList";


export interface PrepIngredient {
  item: string;
  amount: string;
  basis?: "raw" | "cooked" | "n/a" | string;
}

export interface PrepMeal {
  name: string;
  slot: string;
  prep_minutes?: number;
  ingredients?: PrepIngredient[];
  steps?: string[];
}

/** Pull an explicit duration out of a step ("simmer for 8 minutes" → 8). */
export function stepMinutes(step: string): number | null {
  const m = step.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*(min|minute|minutes)\b/i);
  if (m) return Math.round(Number(m[2] ?? m[1]));
  const s = step.match(/(\d+)\s*(sec|second|seconds)\b/i);
  if (s) return Math.max(1, Math.round(Number(s[1]) / 60));
  return null;
}

/** Aggregate ingredients across meals into a de-duplicated shopping list. */
export function buildShoppingList(meals: PrepMeal[]): { item: string; amounts: string[] }[] {
  const map = new Map<string, { item: string; amounts: string[] }>();
  for (const meal of meals) {
    for (const ing of meal.ingredients ?? []) {
      const key = ing.item.trim().toLowerCase();
      if (!key) continue;
      const entry = map.get(key) ?? { item: ing.item.trim(), amounts: [] };
      if (ing.amount) entry.amounts.push(ing.amount.trim());
      map.set(key, entry);
    }
  }
  return [...map.values()].sort((a, b) => a.item.localeCompare(b.item));
}

function shoppingListText(meals: PrepMeal[]): string {
  const lines = buildShoppingList(meals).map(
    (row) => `- ${row.item}${row.amounts.length ? ` — ${row.amounts.join(" + ")}` : ""}`,
  );
  return `Deluxe Fitness · shopping list\n\n${lines.join("\n")}\n`;
}

function StepTimer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          window.clearInterval(id);
          setRunning(false);
          haptic("success");
          toast.success("Step timer done");
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <span className="mt-1 inline-flex items-center gap-2 border border-gold/25 bg-deluxe-black/60 px-2 py-1">
      <span className="font-display text-xs tabular-nums text-gold">{mm}:{ss}</span>
      <button
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pause step timer" : "Start step timer"}
        className="text-muted-foreground transition hover:text-gold"
      >
        {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <button
        onClick={() => { setRunning(false); setLeft(minutes * 60); }}
        aria-label="Reset step timer"
        className="text-muted-foreground transition hover:text-gold"
      >
        <TimerReset className="h-3 w-3" />
      </button>
    </span>
  );
}

export function MealPrepGuide({
  meal,
  waterMl,
  weightBasis,
  allMeals,
}: {
  meal: PrepMeal;
  waterMl?: number;
  weightBasis?: string;
  allMeals?: PrepMeal[];
}) {
  const [checkedIng, setCheckedIng] = useState<Set<string>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [showList, setShowList] = useState(false);

  const steps = meal.steps ?? [];
  const ingredients = meal.ingredients ?? [];
  const timings = useMemo(() => steps.map(stepMinutes), [steps]);
  const timedTotal = timings.reduce<number>((a, t) => a + (t ?? 0), 0);
  const activeMinutes = timedTotal || meal.prep_minutes || 0;
  const list = useMemo(() => buildShoppingList(allMeals ?? [meal]), [allMeals, meal]);

  const toggleIng = (key: string) => {
    haptic("selection");
    setCheckedIng((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleStep = (i: number) => {
    haptic("selection");
    setDoneSteps((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(shoppingListText(allMeals ?? [meal]));
      toast.success("Shopping list copied");
    } catch {
      toast.error("Couldn't copy — use download instead");
    }
  };

  const downloadList = () => {
    const blob = new Blob([shoppingListText(allMeals ?? [meal])], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deluxe-shopping-list.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 border-t border-gold/10 pt-4">
      {/* Phase header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gold">
          <ChefHat className="h-3.5 w-3.5" /> Prep phase · {meal.slot}
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Clock className="h-3 w-3 text-gold" />
          {activeMinutes > 0 ? `${activeMinutes} min total` : "Timing on the steps"}
          <span className="text-gold">
            {doneSteps.size}/{steps.length} steps
          </span>
        </div>
      </div>

      {/* 1. Mise en place */}
      <div className="mt-3 border border-gold/15 bg-deluxe-black/50">
        <div className="flex items-center gap-2 border-b border-gold/10 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          <ListChecks className="h-3 w-3 text-gold" /> 1 · Mise en place
          {weightBasis ? <span className="text-gold">{weightBasis} weights</span> : null}
        </div>
        <ul>
          {ingredients.map((ing, k) => {
            const key = `${ing.item}-${k}`;
            const on = checkedIng.has(key);
            return (
              <li key={key} className="border-b border-gold/5 last:border-0">
                <button
                  onClick={() => toggleIng(key)}
                  className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    on ? "text-gold" : "text-foreground hover:bg-gold/5"
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className={`mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${on ? "border-gold bg-gold/20" : "border-gold/30"}`}>
                      {on && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className={on ? "line-through" : ""}>{ing.item}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ing.amount}
                    {ing.basis && ing.basis !== "n/a" ? (
                      <span className="ml-1 text-[9px] uppercase tracking-[0.16em] text-gold">{ing.basis}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
          {!!waterMl && waterMl > 0 && (
            <li className="border-t border-gold/10 px-3 py-2 text-sm text-muted-foreground">
              Pour {waterMl} ml water to drink with this meal.
            </li>
          )}
        </ul>
      </div>

      {/* 2. Timed cooking steps */}
      <div className="mt-3 border border-gold/15 bg-deluxe-black/50">
        <div className="border-b border-gold/10 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          2 · Cook it · step by step
        </div>
        <ol className="divide-y divide-gold/5">
          {steps.length === 0 && (
            <li className="px-3 py-3 text-xs text-muted-foreground">
              No steps saved for this meal — swap it or ask the nutritionist for a method.
            </li>
          )}
          {steps.map((s, k) => {
            const done = doneSteps.has(k);
            const mins = timings[k];
            return (
              <li key={k} className="flex gap-3 px-3 py-3">
                <button
                  onClick={() => toggleStep(k)}
                  aria-pressed={done}
                  aria-label={`Mark step ${k + 1} ${done ? "not done" : "done"}`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border font-display text-xs ${
                    done ? "border-gold bg-gold/20 text-gold" : "border-gold/30 text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : k + 1}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-relaxed ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {s}
                  </p>
                  {mins ? <StepTimer minutes={mins} /> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 3. Shopping list */}
      <div className="mt-3 border border-gold/15 bg-deluxe-black/50">
        <button
          onClick={() => setShowList((v) => !v)}
          aria-expanded={showList}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-gold"
        >
          <span className="flex items-center gap-2">
            <ShoppingBasket className="h-3 w-3 text-gold" /> 3 · Shopping list
            <span className="text-gold">{list.length} items</span>
          </span>
          <span className="text-gold">{showList ? "Hide" : "Show"}</span>
        </button>
        {showList && (
          <div className="border-t border-gold/10 p-3">
            <ul className="space-y-1.5">
              {list.map((row) => (
                <li key={row.item} className="flex items-baseline justify-between gap-3 text-sm text-foreground">
                  <span>{row.item}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{row.amounts.join(" + ")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => void copyList()}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-gold/30 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
              >
                <Copy className="h-3 w-3" /> Copy list
              </button>
              <button
                onClick={downloadList}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-gold/30 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold hover:bg-gold/10"
              >
                <Download className="h-3 w-3" /> Download
              </button>
            </div>
            {allMeals?.length ? (
              <p className="mt-2 text-[10px] text-muted-foreground">
                Covers every meal in today's plan.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
