-- Streak history events
CREATE TABLE IF NOT EXISTS public.streak_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_type text NOT NULL CHECK (event_type IN ('start','increment','reset')),
  current_len integer NOT NULL DEFAULT 0,
  previous_len integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.streak_events TO authenticated;
GRANT ALL ON public.streak_events TO service_role;

ALTER TABLE public.streak_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own streak events" ON public.streak_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Insert path is touch_streak (security definer), but allow direct insert in case we ever need it
CREATE POLICY "users insert own streak events" ON public.streak_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS streak_events_user_date_idx ON public.streak_events(user_id, event_date DESC);

-- Replace touch_streak to log events
CREATE OR REPLACE FUNCTION public.touch_streak()
RETURNS public.streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _today date := CURRENT_DATE;
  _yesterday date := CURRENT_DATE - 1;
  _wk date := date_trunc('week', CURRENT_DATE)::date;
  _s public.streaks;
  _prev int;
  _new_current int;
  _event text;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _s FROM public.streaks WHERE user_id = _user;
  IF _s.user_id IS NULL THEN
    INSERT INTO public.streaks(user_id, current_len, longest_len, last_active_date, freezes_reset_week)
    VALUES (_user, 1, 1, _today, _wk)
    RETURNING * INTO _s;
    INSERT INTO public.streak_events(user_id, event_date, event_type, current_len, previous_len)
    VALUES (_user, _today, 'start', 1, 0);
    RETURN _s;
  END IF;

  IF _s.last_active_date = _today THEN
    RETURN _s;
  ELSIF _s.last_active_date = _yesterday THEN
    _prev := COALESCE(_s.current_len, 0);
    _new_current := _prev + 1;
    _event := 'increment';
  ELSE
    _prev := COALESCE(_s.current_len, 0);
    _new_current := 1;
    _event := 'reset';
  END IF;

  UPDATE public.streaks
    SET current_len = _new_current,
        longest_len = GREATEST(longest_len, _new_current),
        last_active_date = _today,
        updated_at = now()
    WHERE user_id = _user
    RETURNING * INTO _s;

  INSERT INTO public.streak_events(user_id, event_date, event_type, current_len, previous_len)
  VALUES (_user, _today, _event, _new_current, _prev);

  RETURN _s;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_streak() TO authenticated;

-- Reminder preference columns
ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS reminder_water_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_sleep_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_goals_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_water_hour integer,
  ADD COLUMN IF NOT EXISTS reminder_goals_hour integer;