-- 1. XP streak tracking (days with the full 100 mission XP claimed)
CREATE OR REPLACE FUNCTION public.get_xp_streak()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'utc')::date;
  _current int := 0;
  _longest int := 0;
  _run int := 0;
  _prev date := NULL;
  _r record;
  _today_xp int := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(sum(amount), 0) INTO _today_xp
  FROM public.xp_events
  WHERE user_id = _uid AND event_date = _today
    AND reason IN ('mission_workout','mission_water','mission_protein','mission_mindset');

  FOR _r IN
    SELECT event_date, sum(amount) AS xp
    FROM public.xp_events
    WHERE user_id = _uid
      AND reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
    GROUP BY event_date
    HAVING sum(amount) >= 100
    ORDER BY event_date
  LOOP
    IF _prev IS NOT NULL AND _r.event_date = _prev + 1 THEN
      _run := _run + 1;
    ELSE
      _run := 1;
    END IF;
    _longest := GREATEST(_longest, _run);
    _prev := _r.event_date;
  END LOOP;

  IF _prev = _today OR _prev = _today - 1 THEN
    _current := _run;
  ELSE
    _current := 0;
  END IF;

  RETURN jsonb_build_object(
    'current_streak', _current,
    'longest_streak', _longest,
    'today_xp', _today_xp,
    'complete_today', _today_xp >= 100,
    'last_complete_date', _prev
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_xp_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_xp_streak() TO authenticated;

-- 2. Saved meal plans
CREATE TABLE public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kcal_target integer NOT NULL DEFAULT 0,
  protein_target_g integer NOT NULL DEFAULT 0,
  carbs_target_g integer NOT NULL DEFAULT 0,
  fat_target_g integer NOT NULL DEFAULT 0,
  water_target_ml integer NOT NULL DEFAULT 2000,
  weight_basis text NOT NULL DEFAULT 'raw',
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_meal_plans TO authenticated;
GRANT ALL ON public.saved_meal_plans TO service_role;

ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own saved meal plans"
  ON public.saved_meal_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER saved_meal_plans_set_updated_at
  BEFORE UPDATE ON public.saved_meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX saved_meal_plans_user_idx ON public.saved_meal_plans (user_id, created_at DESC);

-- 3. Mission reminder preferences
ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS mission_reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mission_reminder_hour integer NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS mission_reminder_email boolean NOT NULL DEFAULT false;

-- 4. Which members are due a mission reminder this hour (mission not yet fully claimed)
CREATE OR REPLACE FUNCTION public.cron_mission_reminder_users()
RETURNS TABLE(user_id uuid, email_opt_in boolean, claimed_xp integer)
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
         ), 0) AS claimed_xp
  FROM public.user_profiles_ext u
  WHERE u.mission_reminder_enabled = true
    AND u.notifications_enabled = true
    AND COALESCE(u.mission_reminder_hour, 18)
        = EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(u.timezone,'UTC')))::int
    AND COALESCE((
          SELECT sum(x.amount)::int FROM public.xp_events x
          WHERE x.user_id = u.user_id
            AND x.event_date = (now() AT TIME ZONE COALESCE(u.timezone,'UTC'))::date
            AND x.reason IN ('mission_workout','mission_water','mission_protein','mission_mindset')
        ), 0) < 100;
$$;

REVOKE ALL ON FUNCTION public.cron_mission_reminder_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_mission_reminder_users() TO service_role;