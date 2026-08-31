ALTER TABLE public.workout_sessions ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE public.workout_sessions ALTER COLUMN completed_at DROP DEFAULT;
ALTER TABLE public.workout_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS workout_sessions_user_completed_idx ON public.workout_sessions (user_id, completed_at);