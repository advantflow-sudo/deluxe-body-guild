import { supabase } from "@/integrations/supabase/client";

export type Recap = {
  workout: string;
  type: string;
  durationMin: number;
  calories: number | null;
  exercises: { name: string; sets: number; topKg: number; topReps: number }[];
  workingSets: number;
  totalReps: number;
  volumeKg: number;
  prevVolumeKg: number | null;
  pbs: { name: string; kg: number; reps: number }[];
  muscles: Record<string, number>;
  xp: number;
  streak: number;
};

type SetRow = { reps: number; weight_kg: number; exercise_id: string; exercises: { name: string; muscle_group: string } | null };

/** Build the recap from what was actually logged in this session. */
export async function buildRecap(opts: {
  sessionId: string; userId: string; workoutId: string; workoutTitle: string; workoutType: string;
  durationMin: number; calories: number | null; xp: number; streak: number;
  checked: { exerciseId: string; name: string; muscle: string; sets: number }[];
}): Promise<Recap> {
  const { data: rows } = await supabase
    .from("workout_set_logs").select("reps,weight_kg,exercise_id,exercises(name,muscle_group)")
    .eq("session_id", opts.sessionId);
  const sets = ((rows ?? []) as unknown as SetRow[]).filter((r) => r.reps > 0);

  const byEx = new Map<string, { name: string; muscle: string; sets: number; topKg: number; topReps: number }>();
  for (const s of sets) {
    const cur = byEx.get(s.exercise_id) ?? { name: s.exercises?.name ?? "Exercise", muscle: s.exercises?.muscle_group ?? "", sets: 0, topKg: 0, topReps: 0 };
    cur.sets += 1;
    const kg = Number(s.weight_kg);
    if (kg > cur.topKg || (kg === cur.topKg && s.reps > cur.topReps)) { cur.topKg = kg; cur.topReps = s.reps; }
    byEx.set(s.exercise_id, cur);
  }
  // Exercises ticked off without logged sets still count as trained.
  for (const c of opts.checked) if (!byEx.has(c.exerciseId)) byEx.set(c.exerciseId, { name: c.name, muscle: c.muscle, sets: c.sets, topKg: 0, topReps: 0 });

  const muscles: Record<string, number> = {};
  for (const e of byEx.values()) if (e.muscle && !["cardio", "recovery", "wellbeing"].includes(e.muscle)) muscles[e.muscle] = (muscles[e.muscle] ?? 0) + e.sets;

  const volumeKg = Math.round(sets.reduce((s, r) => s + r.reps * Number(r.weight_kg), 0));
  const totalReps = sets.reduce((s, r) => s + r.reps, 0);

  // Previous comparable session (same workout) and all-time bests before today.
  const { data: prev } = await supabase.from("workout_sessions").select("id,recap")
    .eq("user_id", opts.userId).eq("workout_id", opts.workoutId).neq("id", opts.sessionId)
    .not("completed_at", "is", null).gt("duration_min", 0).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  const prevVolumeKg = (prev?.recap as { volumeKg?: number } | null)?.volumeKg ?? null;

  const pbs: Recap["pbs"] = [];
  const ids = [...byEx.keys()];
  if (ids.length && sets.length) {
    const { data: hist } = await supabase.from("workout_set_logs").select("exercise_id,weight_kg")
      .eq("user_id", opts.userId).in("exercise_id", ids).neq("session_id", opts.sessionId).order("weight_kg", { ascending: false }).limit(500);
    const best = new Map<string, number>();
    for (const h of hist ?? []) best.set(h.exercise_id, Math.max(best.get(h.exercise_id) ?? 0, Number(h.weight_kg)));
    for (const [id, e] of byEx) if (e.topKg > 0 && best.has(id) && e.topKg > (best.get(id) ?? 0)) pbs.push({ name: e.name, kg: e.topKg, reps: e.topReps });
  }

  return {
    workout: opts.workoutTitle, type: opts.workoutType, durationMin: opts.durationMin, calories: opts.calories,
    exercises: [...byEx.values()].map(({ name, sets, topKg, topReps }) => ({ name, sets, topKg, topReps })),
    workingSets: [...byEx.values()].reduce((s, e) => s + e.sets, 0), totalReps, volumeKg, prevVolumeKg, pbs, muscles,
    xp: opts.xp, streak: opts.streak,
  };
}

export function recapPostText(r: Recap) {
  const parts = [`Finished ${r.workout} · ${r.durationMin} min · ${r.workingSets} sets`];
  if (r.volumeKg) parts.push(`${r.volumeKg.toLocaleString()} kg volume`);
  if (r.pbs.length) parts.push(`New PB: ${r.pbs.map((p) => `${p.name} ${p.kg}kg × ${p.reps}`).join(", ")}`);
  const m = Object.keys(r.muscles);
  if (m.length) parts.push(`Trained: ${m.join(", ")}`);
  return parts.join("\n");
}
