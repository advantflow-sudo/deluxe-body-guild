-- Add sleep_hours to daily_stats
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS sleep_hours numeric(3,1) NOT NULL DEFAULT 0;

-- Nutrition logs
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  meal_label text,
  calories integer NOT NULL DEFAULT 0,
  protein_g numeric(6,1) NOT NULL DEFAULT 0,
  carbs_g numeric(6,1) NOT NULL DEFAULT 0,
  fat_g numeric(6,1) NOT NULL DEFAULT 0,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT ALL ON public.nutrition_logs TO service_role;

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own nutrition rows" ON public.nutrition_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS nutrition_logs_user_date_idx ON public.nutrition_logs(user_id, log_date);

-- Enable realtime for the score-relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.nutrition_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habit_logs;