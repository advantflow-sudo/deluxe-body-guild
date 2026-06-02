
-- Exercise library
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  muscle_group text NOT NULL,
  compartment text NOT NULL,
  equipment text NOT NULL DEFAULT 'bodyweight',
  cues text,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises read all authed" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises admin write" ON public.exercises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Workout blocks (sections within a workout)
CREATE TABLE public.workout_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  label text NOT NULL,
  compartment text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  rest_sec integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_workout_blocks_workout ON public.workout_blocks(workout_id, sort_order);
GRANT SELECT ON public.workout_blocks TO authenticated;
GRANT ALL ON public.workout_blocks TO service_role;
ALTER TABLE public.workout_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks read all authed" ON public.workout_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocks admin write" ON public.workout_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Exercise pool per block (3+ exercises that rotate)
CREATE TABLE public.workout_block_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.workout_blocks(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(block_id, exercise_id)
);
CREATE INDEX idx_wbe_block ON public.workout_block_exercises(block_id, sort_order);
GRANT SELECT ON public.workout_block_exercises TO authenticated;
GRANT ALL ON public.workout_block_exercises TO service_role;
ALTER TABLE public.workout_block_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wbe read all authed" ON public.workout_block_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "wbe admin write" ON public.workout_block_exercises FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Per-session record of which exercise was picked per block
CREATE TABLE public.workout_session_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  block_id uuid NOT NULL REFERENCES public.workout_blocks(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wsb_user_workout ON public.workout_session_blocks(user_id, workout_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_session_blocks TO authenticated;
GRANT ALL ON public.workout_session_blocks TO service_role;
ALTER TABLE public.workout_session_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wsb own all" ON public.workout_session_blocks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
