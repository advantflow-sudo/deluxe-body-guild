import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Play, Dumbbell } from "lucide-react";
import { MUSCLE_EXERCISES, type ExerciseRec } from "@/config/muscle-exercises";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { haptic } from "@/hooks/useHaptics";

interface Props {
  muscleKey: string | null;
  muscleLabel: string;
  color: string;
  tagline: string;
}

/**
 * Premium in-page workout recommendation card shown between the front & back
 * body figures on the Target Your Body page. Never navigates away on its own —
 * exercise details expand inline; only Start Workout deep-links to /app/workouts.
 */
export function MuscleRecommendationBox({ muscleKey, muscleLabel, color, tagline }: Props) {
  const { reduceMotion } = useReduceMotion();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const exercises: ExerciseRec[] | undefined = muscleKey ? MUSCLE_EXERCISES[muscleKey] : undefined;

  // Reset expansion whenever the muscle changes
  useEffect(() => { setOpenIdx(null); }, [muscleKey]);

  if (!muscleKey || !exercises) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-gold/25 bg-deluxe-forest/10 p-6 text-center">
        <Dumbbell className="mb-3 h-8 w-8 text-gold/60" />
        <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Awaiting selection</div>
        <p className="mt-2 max-w-[220px] text-xs text-muted-foreground">
          Tap any glowing muscle on the body to see three tailored exercises with demos.
        </p>
      </div>
    );
  }

  const anim = reduceMotion ? "" : "animate-fade-in";

  return (
    <div
      key={muscleKey}
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-gold/30 bg-gradient-to-b from-deluxe-forest/25 to-deluxe-black/70 shadow-[0_0_40px_rgba(201,162,76,0.08)] ${anim}`}
      role="region"
      aria-label={`Workout recommendation for ${muscleLabel}`}
    >
      {/* Header */}
      <div className="border-b border-gold/20 p-4 sm:p-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color }}>
          Selected
        </div>
        <h3 className="mt-1 font-display text-2xl uppercase tracking-wide text-foreground sm:text-3xl">
          {muscleLabel}
        </h3>
        <p className="mt-1 text-[11px] italic text-muted-foreground">{tagline}</p>
      </div>

      {/* Exercises */}
      <ol className="flex-1 divide-y divide-gold/15">
        {exercises.map((ex, idx) => {
          const isOpen = openIdx === idx;
          return (
            <li key={ex.name} className={reduceMotion ? "" : "animate-fade-in"}>
              <button
                type="button"
                onClick={() => { haptic("selection"); setOpenIdx(isOpen ? null : idx); }}
                aria-expanded={isOpen}
                aria-controls={`ex-detail-${idx}`}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 text-left transition hover:bg-gold/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-4"
              >
                {/* Demo */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gold/25 bg-deluxe-black sm:h-16 sm:w-16">
                  {ex.video && !reduceMotion ? (
                    <video
                      src={ex.video}
                      poster={ex.image}
                      autoPlay muted loop playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src={ex.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-deluxe-black/80 text-[9px] font-bold text-gold">
                    {idx + 1}
                  </span>
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className="truncate font-display text-sm text-foreground sm:text-base">{ex.name}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-gold/80">
                    {ex.sets} × {ex.reps}
                  </div>
                  {!isOpen && (
                    <div className="mt-1 line-clamp-1 text-[11px] italic text-muted-foreground">
                      &ldquo;{ex.cue}&rdquo;
                    </div>
                  )}
                </div>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180 text-gold" : ""}`}
                />
              </button>

              {isOpen && (
                <div
                  id={`ex-detail-${idx}`}
                  className={`border-t border-gold/15 bg-deluxe-black/40 p-4 text-xs text-muted-foreground ${reduceMotion ? "" : "animate-fade-in"}`}
                >
                  <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gold/80">Form cue</div>
                  <p className="mb-3 text-foreground/85">&ldquo;{ex.cue}&rdquo;</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/app/workouts"
                      search={{ q: ex.searchKey } as never}
                      onClick={() => haptic("selection")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10"
                    >
                      Full details
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Start Workout */}
      <div className="border-t border-gold/20 p-4 sm:p-5">
        <Link
          to="/app/workouts"
          search={{ muscle: muscleKey } as never}
          onClick={() => haptic("success")}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-deluxe-black transition hover:brightness-110"
        >
          <Play className="h-4 w-4 fill-current" />
          Start Workout
        </Link>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Opens the full {muscleLabel.toLowerCase()} session in Train.
        </p>
      </div>
    </div>
  );
}
