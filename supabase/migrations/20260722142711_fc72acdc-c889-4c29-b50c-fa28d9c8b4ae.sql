
ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS body_map_selection jsonb;

CREATE TABLE IF NOT EXISTS public.body_map_selection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muscles text[] NOT NULL DEFAULT '{}',
  view text NOT NULL DEFAULT 'front',
  multi boolean NOT NULL DEFAULT false,
  matched_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.body_map_selection_logs TO authenticated;
GRANT ALL ON public.body_map_selection_logs TO service_role;

ALTER TABLE public.body_map_selection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body map logs"
  ON public.body_map_selection_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body map logs"
  ON public.body_map_selection_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_body_map_logs_user_created
  ON public.body_map_selection_logs (user_id, created_at DESC);
