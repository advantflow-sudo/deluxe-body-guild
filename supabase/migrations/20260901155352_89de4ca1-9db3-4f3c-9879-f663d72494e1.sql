CREATE OR REPLACE FUNCTION public.user_local_date(_user_id uuid)
RETURNS date
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (now() AT TIME ZONE COALESCE(
    NULLIF((SELECT timezone FROM public.user_profiles_ext WHERE user_id = _user_id), ''),
    'UTC'))::date;
$$;

CREATE OR REPLACE FUNCTION public.award_mission_xp(_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _amount int;
  _today date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _today := public.user_local_date(_uid);

  _amount := CASE _reason
    WHEN 'mission_workout'  THEN 50
    WHEN 'mission_water'    THEN 20
    WHEN 'mission_protein'  THEN 20
    WHEN 'mission_mindset'  THEN 10
    ELSE NULL END;

  IF _amount IS NULL THEN
    RAISE EXCEPTION 'Unknown mission action: %', _reason;
  END IF;

  INSERT INTO public.xp_events (user_id, reason, amount, event_date)
  VALUES (_uid, _reason, _amount, _today)
  ON CONFLICT DO NOTHING;

  RETURN public.get_xp_summary();
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_mission_xp(_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _today := public.user_local_date(_uid);
  IF _reason NOT IN ('mission_workout','mission_water','mission_protein','mission_mindset') THEN
    RAISE EXCEPTION 'Unknown mission action: %', _reason;
  END IF;

  DELETE FROM public.xp_events
  WHERE user_id = _uid AND event_date = _today AND reason = _reason;

  RETURN public.get_xp_summary();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mission_xp_today()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_object_agg(reason, amount), '{}'::jsonb)
  FROM public.xp_events
  WHERE user_id = auth.uid()
    AND event_date = public.user_local_date(auth.uid())
    AND reason IN ('mission_workout','mission_water','mission_protein','mission_mindset');
$$;

CREATE OR REPLACE FUNCTION public.get_xp_streak()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date;
  _current int := 0;
  _longest int := 0;
  _run int := 0;
  _prev date := NULL;
  _r record;
  _today_xp int := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _today := public.user_local_date(_uid);

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