import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, Pause, Play, PlayCircle, TimerReset, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { ShareButton } from "@/components/deluxe/ShareButton";
import { exerciseMedia, formReference } from "@/config/exercise-media";
import type { Workout } from "@/components/deluxe/WorkoutDetail";
import { SetLogger } from "@/components/deluxe/SetLogger";
import { WorkoutRecap } from "@/components/deluxe/WorkoutRecap";
import { buildRecap, type Recap } from "@/lib/workoutRecap";

interface Exercise {
  id: string;
  name: string;
  slug?: string | null;
  muscle_group: string;
  equipment: string;
  cues: string | null;
  is_premium: boolean;
}


interface BlockExercise {
  id: string;
  exercise_id: string;
  sort_order: number;
  exercises: Exercise | null;
}

interface Block {
  id: string;
  label: string;
  compartment: string;
  sets: number;
  reps: string;
  rest_sec: number;
  sort_order: number;
  workout_block_exercises: BlockExercise[];
}

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function WorkoutSessionPlayer({
  workout, blocks: initialBlocks, sessionId, userId, onClose,
}: { workout: Workout; blocks: Block[]; sessionId: string; userId: string; onClose: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [shortMode, setShortMode] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null);
  const coachNotes = useRef<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [rest, setRest] = useState<{ sec: number; label: string } | null>(null);
  const [openDemo, setOpenDemo] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const restRef = useRef<number | null>(null);

  const totalExercises = blocks.reduce((n, b) => n + b.workout_block_exercises.length, 0);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [running]);

  useEffect(() => {
    if (!rest) return;
    if (rest.sec <= 0) { setRest(null); haptic("success"); return; }
    restRef.current = window.setTimeout(() => setRest((r) => (r ? { ...r, sec: r.sec - 1 } : r)), 1000);
    return () => { if (restRef.current) window.clearTimeout(restRef.current); };
  }, [rest]);

  const toggleExercise = async (block: Block, be: BlockExercise) => {
    const key = be.id;
    const isDone = completed.has(key);
    haptic(isDone ? "light" : "medium");
    if (isDone) {
      setCompleted((prev) => { const n = new Set(prev); n.delete(key); return n; });
      await supabase
        .from("workout_session_blocks")
        .delete()
        .eq("session_id", sessionId)
        .eq("block_id", block.id)
        .eq("exercise_id", be.exercise_id);
      return;
    }
    setCompleted((prev) => new Set(prev).add(key));
    const { error } = await supabase.from("workout_session_blocks").insert({
      session_id: sessionId, user_id: userId, workout_id: workout.id,
      block_id: block.id, exercise_id: be.exercise_id, completed: true,
    });
    if (error) {
      toast.error(error.message);
      setCompleted((prev) => { const n = new Set(prev); n.delete(key); return n; });
      return;
    }
    if (block.rest_sec > 0) setRest({ sec: block.rest_sec, label: block.label });
  };

  const toggleShort = () => {
    const next = !shortMode;
    setShortMode(next);
    setBlocks(initialBlocks.map((b) => ({ ...b, sets: next ? Math.max(1, Math.ceil(b.sets * 0.6)) : b.sets, rest_sec: next ? Math.round(b.rest_sec * 0.7) : b.rest_sec, workout_block_exercises: blocks.find((x) => x.id === b.id)?.workout_block_exercises ?? b.workout_block_exercises })));
    const msg = next
      ? "Short on time: I've cut each block to about 60% of the sets and shortened rests. Same exercises, so the training objective stays the same."
      : "Back to the full session.";
    coachNotes.current.push(msg);
    toast.message("Coach", { description: msg });
  };

  const swapExercise = async (block: Block, be: BlockExercise) => {
    const cur = be.exercises;
    if (!cur) return;
    setSwapping(be.id);
    const inWorkout = new Set(blocks.flatMap((b) => b.workout_block_exercises.map((x) => x.exercise_id)));
    const { data } = await supabase.from("exercises").select("id,name,slug,muscle_group,equipment,cues,is_premium").eq("muscle_group", cur.muscle_group).neq("id", cur.id).limit(20);
    setSwapping(null);
    const options = (data ?? []).filter((e) => !inWorkout.has(e.id));
    const pick = options.find((e) => e.equipment !== cur.equipment) ?? options[0];
    if (!pick) return toast.message("Coach", { description: `No other ${cur.muscle_group} exercise available — keep ${cur.name} and lower the weight if needed.` });
    if (completed.has(be.id)) await supabase.from("workout_session_blocks").delete().eq("session_id", sessionId).eq("block_id", block.id).eq("exercise_id", be.exercise_id);
    setCompleted((prev) => { const n = new Set(prev); n.delete(be.id); return n; });
    setBlocks((all) => all.map((b) => b.id !== block.id ? b : { ...b, workout_block_exercises: b.workout_block_exercises.map((x) => x.id === be.id ? { ...x, exercise_id: pick.id, exercises: pick as Exercise } : x) }));
    const msg = `Swapped ${cur.name} for ${pick.name} (${pick.equipment}). Same ${cur.muscle_group} work, same ${block.sets}×${block.reps} volume.`;
    coachNotes.current.push(msg);
    toast.message("Coach", { description: msg });
  };

  const finish = async () => {
    setRunning(false);
    setFinishing(true);
    const durationMin = Math.max(1, Math.round(seconds / 60));
    const calories = workout.calories
      ? Math.round((workout.calories * durationMin) / Math.max(1, workout.duration_min))
      : null;

    const { error: uErr } = await supabase
      .from("workout_sessions")
      .update({ duration_min: durationMin, calories, completed_at: new Date().toISOString(), ...(coachNotes.current.length ? { notes: `Coach changes: ${coachNotes.current.join(" ")}`.slice(0, 1000) } : {}) })
      .eq("id", sessionId);
    if (uErr) { setFinishing(false); return toast.error(uErr.message); }

    const { data: before } = await supabase.rpc("get_xp_summary");
    const { data: xp } = await supabase.rpc("award_xp", { _reason: "workout" });
    const { data: streakRow } = await supabase.rpc("touch_streak");
    const earned = Math.max(0, Number(xp ?? 0) - Number((before as { total_xp?: number } | null)?.total_xp ?? 0));
    const checked = blocks.flatMap((b) => b.workout_block_exercises.filter((be) => completed.has(be.id)).map((be) => ({ exerciseId: be.exercise_id, name: be.exercises?.name ?? "Exercise", muscle: be.exercises?.muscle_group ?? "", sets: b.sets })));
    try {
      const r = await buildRecap({ sessionId, userId, workoutId: workout.id, workoutTitle: workout.title, workoutType: workout.category, durationMin, calories, xp: earned, streak: Number((streakRow as { current_len?: number } | null)?.current_len ?? 0), checked });
      setRecap(r);
      await supabase.from("workout_sessions").update({ recap: r as never }).eq("id", sessionId);
    } catch (e) { console.error("recap failed", e); }
    // Reward points are what the rewards catalogue spends — earn them here too.
    await supabase.rpc("award_points", { _reason: "Workout completed", _delta: 50 });

    setFinishing(false);
    setDone(true);
    haptic("success");
    toast.success(earned ? `+${earned} XP · +50 points earned` : "Session logged · +50 points");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-deluxe-black/90 backdrop-blur-md sm:items-center sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto border border-gold/30 bg-deluxe-black p-6 sm:p-8">
        {!done && (
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-gold" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        )}

        {!done ? (
          <>
            <div className="flex items-start justify-between gap-2 pr-8">
              <div>
                <SectionLabel>{workout.category}</SectionLabel>
                <h2 className="mt-1 font-display text-2xl text-foreground">{workout.title}</h2>
              </div>
            </div>

            <div className="my-6 text-center">
              <div className="font-display text-6xl text-gold tabular-nums">{fmt(seconds)}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Target {workout.duration_min} min
              </div>
              <OutlineButton onClick={() => { haptic(running ? "light" : "medium"); setRunning((r) => !r); }} className="mt-4">
                {running ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
              </OutlineButton>
            </div>

            {rest && (
              <div className="mb-6 flex items-center justify-between border border-gold/30 bg-gold/5 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gold">
                  <TimerReset className="h-4 w-4" /> Rest after {rest.label}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl text-gold tabular-nums">{fmt(rest.sec)}</span>
                  <button onClick={() => setRest(null)} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">Skip</button>
                </div>
              </div>
            )}

            {totalExercises > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionLabel>Track your sets</SectionLabel>
                  <button onClick={toggleShort} aria-pressed={shortMode} className={`border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${shortMode ? "border-gold bg-gold text-deluxe-black" : "border-gold/40 text-gold"}`}>
                    <Clock className="mr-1 inline h-3 w-3" />Short on time
                  </button>
                </div>
                {blocks.map((b) => (
                  <div key={b.id} className="border border-gold/15 bg-deluxe-forest/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-base text-foreground">{b.label}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{b.sets}×{b.reps}</div>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {b.workout_block_exercises.map((be) => {
                        const isDone = completed.has(be.id);
                        const ex = be.exercises;
                        const open = openDemo === be.id;
                        const media = exerciseMedia(ex?.slug ?? ex?.name);
                        const clip = media.clip;
                        const form = formReference(ex?.name, ex?.muscle_group, b.compartment, b.label);
                        return (
                          <li key={be.id}>
                            <div
                              className={`flex items-center gap-2 border px-3 py-2 text-sm transition ${
                                isDone ? "border-gold/40 bg-gold/10 text-gold" : "border-gold/10 text-foreground"
                              }`}
                            >
                              <button
                                onClick={() => toggleExercise(b, be)}
                                className="flex flex-1 items-center gap-2 text-left"
                              >
                                {isDone ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className={isDone ? "line-through" : ""}>{ex?.name ?? "Exercise"}</span>
                              </button>
                              <button
                                onClick={() => { haptic("selection"); setOpenDemo(open ? null : be.id); }}
                                aria-expanded={open}
                                aria-label={`${open ? "Hide" : "Show"} demo and form check for ${ex?.name ?? "exercise"}`}
                                className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold"
                              >
                                <PlayCircle className="h-4 w-4" /> {open ? "Hide" : "Demo"}
                              </button>
                              <button
                                onClick={() => swapExercise(b, be)}
                                disabled={swapping === be.id}
                                aria-label={`Swap ${ex?.name ?? "exercise"} for an alternative`}
                                className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-gold disabled:opacity-40"
                              >
                                {swapping === be.id ? "…" : "Swap"}
                              </button>
                            </div>

                            <SetLogger
                              key={`${be.exercise_id}-${b.sets}`}
                              sessionId={sessionId}
                              userId={userId}
                              blockId={b.id}
                              exerciseId={be.exercise_id}
                              sets={b.sets}
                              targetReps={b.reps}
                            />

                            {open && (
                              <div className="border border-t-0 border-gold/15 bg-deluxe-black/50 p-3">
                                {clip ? (
                                  <>
                                    <video
                                      src={clip}
                                      poster={form.image}
                                      autoPlay
                                      loop
                                      muted
                                      controls
                                      playsInline
                                      preload="metadata"
                                      aria-label={`${media.exact ? ex?.name ?? "Exercise" : media.clipOf} demonstration video`}
                                      className="h-52 w-full border border-gold/20 bg-black object-cover"
                                    />
                                    <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                      {media.exact ? (
                                        <>Video · {ex?.name ?? "Exercise"} demo</>
                                      ) : (
                                        <>
                                          Pattern video · <span className="text-gold">{media.clipOf}</span> — same
                                          mechanics as {ex?.name}
                                        </>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <img
                                    src={form.image}
                                    alt={`${form.label} form reference`}
                                    loading="lazy"
                                    width={1024}
                                    height={768}
                                    className="h-44 w-full border border-gold/20 object-cover"
                                  />
                                )}
                                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                                  <img
                                    src={form.image}
                                    alt={`${form.label} form check reference`}
                                    loading="lazy"
                                    width={1024}
                                    height={768}
                                    className="hidden h-24 w-full border border-gold/20 object-cover sm:block"
                                  />
                                  <div>
                                    <div className="text-[10px] uppercase tracking-[0.22em] text-gold">
                                      Form check · {form.label}
                                    </div>
                                    <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                                      {(ex?.cues ? [ex.cues, ...form.cues.slice(0, 2)] : form.cues).map((c) => (
                                        <li key={c}>· {c}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                  </div>
                ))}
                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {completed.size}/{totalExercises} exercises checked off
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No block breakdown available — just track your time.</p>
            )}

            <GoldButton onClick={finish} disabled={finishing || seconds === 0} className="mt-8 w-full">
              {finishing ? "Saving…" : "Finish Session"}
            </GoldButton>
          </>
        ) : recap ? (
          <WorkoutRecap recap={recap} sessionId={sessionId} userId={userId} onClose={onClose} />
        ) : (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
            <h2 className="mt-4 font-display text-2xl text-foreground">Session complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.max(1, Math.round(seconds / 60))} min logged · {completed.size}/{totalExercises || 0} exercises tracked
            </p>
            <div className="mt-5 flex justify-center">
              <ShareButton
                title={`Deluxe Fitness — ${workout.title}`}
                text={`Just finished ${workout.title} on Deluxe Fitness`}
                url={`/app/workouts?w=${workout.id}`}
                label="Share"
              />
            </div>
            <GoldButton onClick={onClose} className="mt-6 w-full">Done</GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}
