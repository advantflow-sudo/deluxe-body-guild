ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind = ANY (ARRAY[
  'like','comment','follow','cheer','mission_ready','system_streak_risk','weekly_recap','challenge','badge',
  'payment_failed','processing_error','signature_failure','crash'
]));