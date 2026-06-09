// Lightweight offline queue for Deluxe score writes.
// Stores pending ops in localStorage; replays on `online` events.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DailyStatsOp = {
  kind: "dailyStats";
  userId: string;
  date: string;
  patch: { water_ml?: number; sleep_hours?: number };
};
type NutritionInsertOp = {
  kind: "nutritionInsert";
  userId: string;
  date: string;
  meal_label: string;
  calories: number;
};
type NutritionDeleteOp = { kind: "nutritionDelete"; id: string; userId: string };
type HabitToggleOp = {
  kind: "habitToggle";
  userId: string;
  habit_id: string;
  date: string;
  value: number;
  on: boolean;
};

export type QueuedOp =
  | DailyStatsOp | NutritionInsertOp | NutritionDeleteOp | HabitToggleOp;

interface Entry { id: string; op: QueuedOp; createdAt: number; tries: number }

const KEY = "df_offline_queue_v1";
const listeners = new Set<() => void>();

function load(): Entry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function save(items: Entry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

export function subscribeQueue(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function queueSize() { return load().length; }

async function runOp(op: QueuedOp): Promise<{ ok: boolean; error?: string }> {
  switch (op.kind) {
    case "dailyStats": {
      const { error } = await supabase.from("daily_stats")
        .upsert({ user_id: op.userId, stat_date: op.date, ...op.patch }, { onConflict: "user_id,stat_date" });
      return error ? { ok: false, error: error.message } : { ok: true };
    }
    case "nutritionInsert": {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: op.userId, log_date: op.date, meal_label: op.meal_label, calories: op.calories,
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    }
    case "nutritionDelete": {
      const { error } = await supabase.from("nutrition_logs").delete().eq("id", op.id).eq("user_id", op.userId);
      return error ? { ok: false, error: error.message } : { ok: true };
    }
    case "habitToggle": {
      if (op.on) {
        const { error } = await supabase.from("habit_logs").insert({
          user_id: op.userId, habit_id: op.habit_id, log_date: op.date, value: op.value,
        });
        return error ? { ok: false, error: error.message } : { ok: true };
      } else {
        const { error } = await supabase.from("habit_logs").delete()
          .eq("user_id", op.userId).eq("habit_id", op.habit_id).eq("log_date", op.date);
        return error ? { ok: false, error: error.message } : { ok: true };
      }
    }
  }
}

let draining = false;
export async function drainQueue(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    let items = load();
    while (items.length > 0) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      const entry = items[0];
      const result = await runOp(entry.op);
      if (result.ok) {
        items = items.slice(1);
        save(items);
      } else {
        entry.tries += 1;
        if (entry.tries >= 3) {
          toast.error(`Sync failed: ${result.error ?? "unknown"}`);
          items = items.slice(1);
          save(items);
        } else {
          items[0] = entry;
          save(items);
          break; // back off; wait for next online tick
        }
      }
    }
  } finally {
    draining = false;
  }
}

/** Run immediately when online; queue when offline. */
export async function enqueueOrApply(op: QueuedOp): Promise<{ ok: boolean; queued?: boolean; error?: string }> {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (!offline) {
    const r = await runOp(op);
    if (r.ok) return { ok: true };
    // network success but server error — surface immediately, don't queue
    return { ok: false, error: r.error };
  }
  const items = load();
  items.push({ id: crypto.randomUUID(), op, createdAt: Date.now(), tries: 0 });
  save(items);
  return { ok: true, queued: true };
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { void drainQueue(); });
  // Best-effort initial drain in case the app was reopened with queued items
  setTimeout(() => { void drainQueue(); }, 1500);
}

// React helpers ------------------------------------------------------

export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function useQueueSize(): number {
  const [n, setN] = useState<number>(typeof window === "undefined" ? 0 : queueSize());
  useEffect(() => subscribeQueue(() => setN(queueSize())), []);
  return n;
}
