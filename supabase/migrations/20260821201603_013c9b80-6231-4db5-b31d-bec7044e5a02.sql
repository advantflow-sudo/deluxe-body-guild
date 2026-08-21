CREATE TABLE public.app_error_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'browser',
  severity TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  route TEXT,
  user_agent TEXT,
  release TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  alerted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_error_events TO service_role;
GRANT SELECT ON public.app_error_events TO authenticated;

ALTER TABLE public.app_error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read error events"
ON public.app_error_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX app_error_events_created_at_idx ON public.app_error_events (created_at DESC);
CREATE INDEX app_error_events_severity_idx ON public.app_error_events (severity, created_at DESC);