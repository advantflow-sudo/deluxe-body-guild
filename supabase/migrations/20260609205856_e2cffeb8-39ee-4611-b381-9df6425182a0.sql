-- Streak touch: increments when prior day was yesterday, resets to 1 on gap, no-op when already touched today.
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
  _new_current int;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _s FROM public.streaks WHERE user_id = _user;
  IF _s.user_id IS NULL THEN
    INSERT INTO public.streaks(user_id, current_len, longest_len, last_active_date, freezes_reset_week)
    VALUES (_user, 1, 1, _today, _wk)
    RETURNING * INTO _s;
    RETURN _s;
  END IF;

  IF _s.last_active_date = _today THEN
    RETURN _s;
  ELSIF _s.last_active_date = _yesterday THEN
    _new_current := COALESCE(_s.current_len, 0) + 1;
  ELSE
    _new_current := 1;
  END IF;

  UPDATE public.streaks
    SET current_len = _new_current,
        longest_len = GREATEST(longest_len, _new_current),
        last_active_date = _today,
        updated_at = now()
    WHERE user_id = _user
    RETURNING * INTO _s;
  RETURN _s;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_streak() TO authenticated;