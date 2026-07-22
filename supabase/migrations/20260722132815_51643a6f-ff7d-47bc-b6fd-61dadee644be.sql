
CREATE TABLE public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  error_message TEXT,
  user_id UUID,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount_total INTEGER,
  currency TEXT,
  tier TEXT,
  payload JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

GRANT SELECT ON public.stripe_webhook_events TO authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe webhook events"
ON public.stripe_webhook_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_stripe_webhook_events_received_at ON public.stripe_webhook_events(received_at DESC);
CREATE INDEX idx_stripe_webhook_events_status ON public.stripe_webhook_events(status);
CREATE INDEX idx_stripe_webhook_events_type ON public.stripe_webhook_events(event_type);
