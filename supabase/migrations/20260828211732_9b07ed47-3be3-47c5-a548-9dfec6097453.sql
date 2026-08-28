ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS mission_reminder_days text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS mission_reminder_push boolean NOT NULL DEFAULT true;

ALTER TABLE public.user_profiles_ext
  ADD CONSTRAINT user_profiles_ext_mission_reminder_days_chk
  CHECK (mission_reminder_days IN ('all','weekdays','weekends'));

DROP FUNCTION IF EXISTS public.cron_mission_reminder_users();

CREATE FUNCTION public.cron_mission_reminder_users()
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
    AND COALESCE((
          SELECT sum(x.amount)::int FROM public.xp_events x
          WHERE x.user_id = u.user_id
            AND x.event_date = (now() AT TIME ZONE COALESCE(u.timezone,'UTC'))::date
            AND x.reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
        ), 0) < 100;
$$;

REVOKE ALL ON FUNCTION public.cron_mission_reminder_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_mission_reminder_users() TO service_role;