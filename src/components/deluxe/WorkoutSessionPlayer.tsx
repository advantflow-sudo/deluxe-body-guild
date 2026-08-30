import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, Pause, Play, PlayCircle, TimerReset, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { ShareButton } from "@/components/deluxe/ShareButton";
import { exerciseClip, formReference } from "@/config/exercise-media";
import type { Workout } from "@/components/deluxe/WorkoutDetail";

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
  workout, blocks, sessionId, userId, onClose,
}: { workout: Workout; blocks: Block[]; sessionId: string; userId: string; onClose: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
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

  const finish = async () => {
    setRunning(false);
    setFinishing(true);
    const durationMin = Math.max(1, Math.round(seconds / 60));
    const calories = workout.calories
      ? Math.round((workout.calories * durationMin) / Math.max(1, workout.duration_min))
      : null;

    const { error: uErr } = await supabase
      .from("workout_sessions")
      .update({ duration_min: durationMin, calories, completed_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (uErr) { setFinishing(false); return toast.error(uErr.message); }

    const { data: xp } = await supabase.rpc("award_xp", { _reason: "workout" });
    await supabase.rpc("touch_streak");

    setFinishing(false);
    setDone(true);
    haptic("success");
    toast.success(xp ? `+${xp} XP earned` : "Session logged");
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
                <SectionLabel>Track your sets</SectionLabel>
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
                            </div>

                            {open && (
                              <div className="border border-t-0 border-gold/15 bg-deluxe-black/50 p-3">
                                {clip ? (
                                  <video
                                    src={clip}
                                    poster={form.image}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="metadata"
                                    aria-label={`${ex?.name ?? "Exercise"} demonstration clip`}
                                    className="h-44 w-full border border-gold/20 object-cover"
                                  />
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
