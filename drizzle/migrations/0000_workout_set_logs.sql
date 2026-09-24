CREATE TABLE public.workout_set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  block_id uuid,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id),
  set_number integer NOT NULL,
  reps integer NOT NULL DEFAULT 0,
  weight_kg numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, block_id, exercise_id, set_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_set_logs TO authenticated;
GRANT ALL ON public.workout_set_logs TO service_role;
ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own set logs" ON public.workout_set_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND reps BETWEEN 0 AND 200 AND weight_kg BETWEEN 0 AND 1000);
CREATE INDEX workout_set_logs_user_ex ON public.workout_set_logs(user_id, exercise_id, created_at DESC);
CREATE POLICY "Own memory update" ON public.ai_coach_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);