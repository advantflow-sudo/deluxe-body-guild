CREATE TABLE public.health_sync_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT ON public.health_sync_tokens TO authenticated;
GRANT ALL ON public.health_sync_tokens TO service_role;
ALTER TABLE public.health_sync_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own health token status" ON public.health_sync_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Issues a fresh personal sync key (shown once) and invalidates any previous one.
CREATE OR REPLACE FUNCTION public.create_health_sync_token()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _raw text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  _raw := 'dfh_' || encode(extensions.gen_random_bytes(24), 'hex');
  INSERT INTO public.health_sync_tokens(user_id, token_hash)
    VALUES (auth.uid(), encode(extensions.digest(_raw, 'sha256'), 'hex'))
    ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, created_at = now(), last_used_at = NULL;
  RETURN _raw;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_health_sync_token() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_health_sync_token() TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_health_sync_token()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.health_sync_tokens WHERE user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.revoke_health_sync_token() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_health_sync_token() TO authenticated;