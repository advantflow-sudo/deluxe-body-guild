
CREATE TABLE public.connected_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  last_synced_at TIMESTAMPTZ,
  external_user_id TEXT,
  scopes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices own all" ON public.connected_devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER connected_devices_updated_at
  BEFORE UPDATE ON public.connected_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.device_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.connected_devices(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX device_metrics_user_recorded_idx
  ON public.device_metrics (user_id, recorded_at DESC);

CREATE INDEX device_metrics_user_type_recorded_idx
  ON public.device_metrics (user_id, metric_type, recorded_at DESC);

ALTER TABLE public.device_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics own all" ON public.device_metrics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.device_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connected_devices;
