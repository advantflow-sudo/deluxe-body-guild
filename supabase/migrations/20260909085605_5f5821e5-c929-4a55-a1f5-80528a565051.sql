-- 1. Move OAuth tokens into a service-role-only table
CREATE TABLE IF NOT EXISTS public.device_oauth_tokens (
  device_id uuid PRIMARY KEY REFERENCES public.connected_devices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.device_oauth_tokens FROM anon, authenticated;
GRANT ALL ON public.device_oauth_tokens TO service_role;
ALTER TABLE public.device_oauth_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO public.device_oauth_tokens (device_id, user_id, access_token, refresh_token, token_expires_at)
SELECT id, user_id, access_token, refresh_token, token_expires_at
FROM public.connected_devices
WHERE access_token IS NOT NULL OR refresh_token IS NOT NULL
ON CONFLICT (device_id) DO NOTHING;

DROP VIEW IF EXISTS public.connected_devices_safe;

ALTER TABLE public.connected_devices DROP COLUMN access_token;
ALTER TABLE public.connected_devices DROP COLUMN refresh_token;
ALTER TABLE public.connected_devices DROP COLUMN token_expires_at;

DROP TRIGGER IF EXISTS device_oauth_tokens_touch ON public.device_oauth_tokens;
CREATE TRIGGER device_oauth_tokens_touch BEFORE UPDATE ON public.device_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Replace the SECURITY DEFINER view with an invoker view + column-level privacy
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = on) AS
SELECT id, display_name, avatar_url FROM public.profiles;

DROP POLICY IF EXISTS "Profiles readable by owner" ON public.profiles;
CREATE POLICY "Profiles readable by signed-in members" ON public.profiles
FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Internal helpers must not be callable by signed-in members
REVOKE EXECUTE ON FUNCTION public.complete_mission() FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.compute_daily_score(date) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.generate_daily_mission() FROM authenticated, anon;