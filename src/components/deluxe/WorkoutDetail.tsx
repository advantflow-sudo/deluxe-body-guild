import { useEffect, useState } from "react";
import { Clock, Flame, Dumbbell, X, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { WorkoutSessionPlayer } from "@/components/deluxe/WorkoutSessionPlayer";
import { exerciseClip, formReference } from "@/config/exercise-media";


export interface Workout {
  id: string;
  title: string;
  category: string;
  level: string;
  type: string;
  duration_min: number;
  calories: number | null;
  description: string | null;
  is_premium: boolean;
}

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

export function WorkoutDetail({ workout, userId, onClose }: { workout: Workout; userId: string; onClose: () => void }) {
  const { isPremium } = usePremium();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const locked = workout.is_premium && !isPremium;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from("workout_blocks")
      .select("*, workout_block_exercises(*, exercises(*))")
      .eq("workout_id", workout.id)
      .order("sort_order")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        const rows = (data ?? []).map((b: any) => ({
          ...b,
          workout_block_exercises: (b.workout_block_exercises ?? []).sort((a: any, c: any) => a.sort_order - c.sort_order),
        }));
        setBlocks(rows as Block[]);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [workout.id]);

  const startSession = async () => {
    setStarting(true);
    const { data, error: err } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, workout_id: workout.id, duration_min: 0, calories: null })
      .select("id")
      .single();
    setStarting(false);
    if (err || !data) return toast.error(err?.message ?? "Could not start session");
    haptic("medium");
    setSessionId(data.id);
  };

  if (sessionId) {
    return (
      <WorkoutSessionPlayer
        workout={workout}
        blocks={blocks}
        sessionId={sessionId}
        userId={userId}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-deluxe-black/90 backdrop-blur-md sm:items-center sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto border border-gold/30 bg-deluxe-black p-6 sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-gold" aria-label="Close">
          <X className="h-5 w-5" />
        </button>

        <SectionLabel>{workout.category} · {workout.level}</SectionLabel>
        <h2 className="mt-2 font-display text-2xl text-foreground pr-8">{workout.title}</h2>
        {workout.description && <p className="mt-2 text-sm text-muted-foreground">{workout.description}</p>}
        <div className="mt-4 flex items-center gap-4 text-xs text-gold">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.duration_min} min</span>
          {workout.calories && <span className="flex items-center gap-1 text-muted-foreground"><Flame className="h-3 w-3" />{workout.calories} kcal</span>}
        </div>

        {locked ? (
          <div className="mt-8 border border-gold/30 bg-deluxe-forest/20 p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-3 text-sm text-muted-foreground">This workout is reserved for Premium and Deluxe members.</p>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <SectionLabel>Blocks</SectionLabel>
              {loading && (
                <div className="mt-4 space-y-2">
                  {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse border border-gold/10 bg-deluxe-forest/10" />)}
                </div>
              )}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              {!loading && !error && blocks.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">No structured blocks yet for this workout — start the session and track your time.</p>
              )}
              <div className="mt-4 space-y-4">
                {blocks.map((b) => (
                  <div key={b.id} className="border border-gold/15 bg-deluxe-forest/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-display text-base text-foreground">{b.label}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{b.compartment}</div>
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {b.sets} sets · {b.reps} reps · {b.rest_sec}s rest
                    </div>
                    <ul className="mt-3 space-y-2">
                      {b.workout_block_exercises.map((be) => {
                        const ex = be.exercises;
                        const clip = exerciseClip(ex?.slug ?? ex?.name);
                        const form = formReference(ex?.name, ex?.muscle_group, b.compartment, b.label);
                        return (
                          <li key={be.id} className="flex items-center gap-3 text-sm text-foreground">
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
                                className="h-12 w-16 shrink-0 border border-gold/20 object-cover"
                              />
                            ) : (
                              <img
                                src={form.image}
                                alt={`${form.label} form reference`}
                                loading="lazy"
                                width={1024}
                                height={768}
                                className="h-12 w-16 shrink-0 border border-gold/20 object-cover"
                              />
                            )}
                            <Dumbbell className="h-3.5 w-3.5 shrink-0 text-gold" />
                            <span>{ex?.name ?? "Exercise"}</span>
                            {ex?.is_premium && !isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
                            {ex?.equipment && (
                              <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{ex.equipment}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                  </div>
                ))}
              </div>
            </div>

            <GoldButton onClick={startSession} disabled={starting} className="mt-8 w-full">
              {starting ? "Starting…" : <>Start Session <ChevronRight className="h-3 w-3" /></>}
            </GoldButton>
          </>
        )}
        <OutlineButton onClick={onClose} className="mt-3 w-full">Close</OutlineButton>
      </div>
    </div>
  );
}
