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
      aria-live="polite"
      aria-label={`Workout recommendation for ${muscleLabel}`}
    >
      {/* Header */}
      <div className="border-b border-gold/20 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.32em]" style={{ color }}>
          Selected
        </div>
        <h3 className="mt-0.5 font-display text-lg uppercase tracking-wide text-foreground sm:text-xl">
          {muscleLabel}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[10px] italic text-muted-foreground">{tagline}</p>
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
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 text-left transition hover:bg-gold/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:px-4 sm:py-2.5"
              >
                {/* Demo */}
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-gold/25 bg-deluxe-black sm:h-12 sm:w-12">
                  {ex.video && !reduceMotion ? (
                    <video
                      src={ex.video}
                      poster={ex.image}
                      autoPlay muted loop playsInline
                      preload="metadata"
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src={ex.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                  <span className="absolute left-0.5 top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-deluxe-black/80 text-[8px] font-bold text-gold">
                    {idx + 1}
                  </span>
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className="truncate font-display text-[13px] text-foreground sm:text-sm">{ex.name}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-gold/80">
                    {ex.sets} × {ex.reps}
                  </div>
                  {!isOpen && (
                    <div className="mt-0.5 line-clamp-1 text-[10px] italic text-muted-foreground">
                      &ldquo;{ex.cue}&rdquo;
                    </div>
                  )}
                </div>

                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180 text-gold" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  id={`ex-detail-${idx}`}
                  className={`border-t border-gold/15 bg-deluxe-black/40 px-3 py-2.5 text-[11px] text-muted-foreground sm:px-4 ${reduceMotion ? "" : "animate-fade-in"}`}
                >
                  <div className="mb-1 text-[9px] uppercase tracking-[0.22em] text-gold/80">Form cue</div>
                  <p className="mb-2 text-foreground/85">&ldquo;{ex.cue}&rdquo;</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/app/workouts"
                      onClick={() => haptic("selection")}
                      className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
      <div className="border-t border-gold/20 px-3 py-3 sm:px-4">
        <Link
          to="/app/workouts"
          onClick={() => haptic("success")}
          aria-label={`Start full ${muscleLabel} workout in Train`}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.28em] text-deluxe-black transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-deluxe-black"
        >
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          Start Workout
        </Link>

        <p className="mt-1.5 text-center text-[9px] text-muted-foreground">
          Opens the full {muscleLabel.toLowerCase()} session in Train.
        </p>
      </div>
    </div>
  );
}

