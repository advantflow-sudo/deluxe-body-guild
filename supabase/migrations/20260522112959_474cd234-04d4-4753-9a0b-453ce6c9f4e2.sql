
-- Add token storage to connected_devices
ALTER TABLE public.connected_devices
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Unique constraint for upsert (user_id, provider)
DO $$ BEGIN
  ALTER TABLE public.connected_devices
    ADD CONSTRAINT connected_devices_user_provider_unique UNIQUE (user_id, provider);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
END $$;

-- OAuth state table for CSRF protection during the redirect dance
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  state text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Only the service role (server) touches this; no user policies needed.
-- Add a restrictive policy so no anon/authed access.
CREATE POLICY "no client access to oauth_states"
  ON public.oauth_states FOR ALL
  USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_expires_idx ON public.oauth_states(expires_at);

-- Unique (user_id, metric_type, recorded_at) on device_metrics so re-syncs upsert cleanly
DO $$ BEGIN
  ALTER TABLE public.device_metrics
    ADD CONSTRAINT device_metrics_unique_point UNIQUE (user_id, provider, metric_type, recorded_at);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL;
END $$;
