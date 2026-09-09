ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS timezone_manual boolean NOT NULL DEFAULT false;