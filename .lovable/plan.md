# Rotating Workouts

Make every workout pull from a pool of exercises per muscle compartment so consecutive sessions hit different parts of each muscle.

## What you'll see

- Tap a workout (e.g. **Pull Day Power**) and the player shows a structured block list:
  - **Vertical Pull** — *Today: Lat Pulldown* · 4 × 10
  - **Horizontal Pull** — *Today: Chest-Supported Row* · 4 × 10
  - **Lower Back** — *Today: Back Extension* · 3 × 12
  - **Rear Delts / Traps** — *Today: Face Pull* · 3 × 15
  - **Biceps** — *Today: Hammer Curl* · 3 × 12
- Next time you start Pull Day, each block auto-picks a *different* exercise from the pool (e.g. Pull-Up, Single-Arm Row, Good Morning, Reverse Fly, EZ-Bar Curl).
- Tiny **Swap** button on each block lets you cycle manually.
- Cardio/core/recovery workouts get the same rotation (e.g. Sunrise HIIT rotates between sprint intervals, tabata, bodyweight circuits).

## Data model

```text
exercises                — global library (name, muscle_group, compartment,
                           equipment, sets, reps, rest_sec, cues, is_premium)
workout_blocks           — a workout's section (workout_id, label, sort_order,
                           sets, reps, rest_sec, compartment)
workout_block_exercises  — pool of 3+ exercises per block (block_id, exercise_id)
workout_session_blocks   — what got picked per session (session_id, block_id,
                           exercise_id) — used to avoid recent picks
```

## Rotation logic (server-side)

On `startWorkout(workoutId)`:
1. Load the workout's blocks + exercise pools.
2. For each block, look up the last 2 sessions' picks for this user + workout.
3. Pick a random exercise from the pool that's NOT in the recent picks (falls back to least-recent if pool is exhausted).
4. Return the structured session: blocks → picked exercise + prescription.

On `completeWorkout`: persist `workout_session_blocks` so the next rotation can avoid repeats.

## Seed data (all 20 workouts)

- **Strength (8)**: Pull Day, Push Day (Royal), Leg Day Legacy, Glute Goddess, 5×5 Foundations, Upper Body Glow, PPL A, PPL B — full block breakdowns per muscle compartment, 3-5 exercises per block.
- **Cardio (5)**: rotating interval/steady/HIIT protocols.
- **Core (1)**, **Fat Loss (1)**, **Hybrid (1)**, **Conditioning (1)**, **Recovery (2)**, **Wellbeing (1)** — appropriate rotating movement pools.

~120 exercises total across the library.

## Files changed

- `supabase/migrations/*` — 3 new tables + GRANTs + RLS + indexes
- `supabase/insert/*` — exercise library + block + pool seed for all 20 workouts
- `src/lib/workouts.functions.ts` — new `startWorkoutSession`, `completeWorkoutBlock`, `swapBlockExercise` server functions
- `src/routes/_authenticated/app/workouts.tsx` — rewrite `WorkoutPlayer` to show structured blocks with rotation + swap
- `src/integrations/supabase/types.ts` — auto-regenerated

## Out of scope

- Per-exercise weight/reps logging (today it still logs duration + calories at the workout level — the block structure is the rotation skeleton; weight logging can be a follow-up).
- Editing the rotation pools from the UI (admin-only via DB for now).

Ready to build — confirm and I'll ship it.