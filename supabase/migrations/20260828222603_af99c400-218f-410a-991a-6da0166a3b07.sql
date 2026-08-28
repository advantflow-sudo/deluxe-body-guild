ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_start_hour integer NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS quiet_end_hour integer NOT NULL DEFAULT 7;

ALTER TABLE public.user_profiles_ext
  ADD CONSTRAINT quiet_start_hour_range CHECK (quiet_start_hour BETWEEN 0 AND 23),
  ADD CONSTRAINT quiet_end_hour_range CHECK (quiet_end_hour BETWEEN 0 AND 23);

CREATE TABLE IF NOT EXISTS public.reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('push','email','in_app')),
  kind text NOT NULL DEFAULT 'mission_reminder',
  is_test boolean NOT NULL DEFAULT false,
  claimed_xp_at_send integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminder_deliveries_user_sent_idx
  ON public.reminder_deliveries (user_id, sent_at DESC);

GRANT SELECT ON public.reminder_deliveries TO authenticated;
GRANT ALL ON public.reminder_deliveries TO service_role;

ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own reminder log"
  ON public.reminder_deliveries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Returns each reminder with whether the mission was claimed after it was sent.
CREATE OR REPLACE FUNCTION public.get_reminder_history(_limit integer DEFAULT 50)
RETURNS TABLE(id uuid, channel text, kind text, is_test boolean, sent_at timestamptz, claimed_after boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.channel, d.kind, d.is_test, d.sent_at,
         EXISTS (
           SELECT 1 FROM public.xp_events x
           WHERE x.user_id = d.user_id
             AND x.created_at > d.sent_at
             AND x.reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
         ) AS claimed_after
  FROM public.reminder_deliveries d
  WHERE d.user_id = auth.uid()
  ORDER BY d.sent_at DESC
  LIMIT LEAST(COALESCE(_limit, 50), 200);
$$;

DROP FUNCTION IF EXISTS public.cron_mission_reminder_users();
CREATE OR REPLACE FUNCTION public.cron_mission_reminder_users()
RETURNS TABLE(user_id uuid, email_opt_in boolean, claimed_xp integer, push_opt_in boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.user_id,
         u.mission_reminder_email,
         COALESCE((
           SELECT sum(x.amount)::int FROM public.xp_events x
           WHERE x.user_id = u.user_id
             AND x.event_date = (now() AT TIME ZONE COALESCE(u.timezone,'UTC'))::date
             AND x.reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
         ), 0) AS claimed_xp,
         u.mission_reminder_push
  FROM public.user_profiles_ext u
  WHERE u.mission_reminder_enabled = true
    AND u.notifications_enabled = true
    AND COALESCE(u.mission_reminder_hour, 18)
        = EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int
    AND (
      COALESCE(u.mission_reminder_days,'all') = 'all'
      OR (COALESCE(u.mission_reminder_days,'all') = 'weekdays'
          AND EXTRACT(ISODOW FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int <= 5)
      OR (COALESCE(u.mission_reminder_days,'all') = 'weekends'
          AND EXTRACT(ISODOW FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int >= 6)
    )
    AND (
      u.quiet_hours_enabled = false
      OR u.quiet_start_hour = u.quiet_end_hour
      OR (
        CASE
          WHEN u.quiet_start_hour < u.quiet_end_hour THEN
            NOT (EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int >= u.quiet_start_hour
                 AND EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int < u.quiet_end_hour)
          ELSE
            NOT (EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int >= u.quiet_start_hour
                 OR EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int < u.quiet_end_hour)
        END
      )
    )
    AND COALESCE((
          SELECT sum(x.amount)::int FROM public.xp_events x
          WHERE x.user_id = u.user_id
            AND x.event_date = (now() AT TIME ZONE COALESCE(u.timezone,'UTC'))::date
            AND x.reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
        ), 0) < 100;
$$;