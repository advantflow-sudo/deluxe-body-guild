CREATE OR REPLACE FUNCTION public.get_xp_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _total integer;
  _today integer;
  _rank text;
  _floor integer;
  _next integer;
  _date date;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _date := public.user_local_date(_user);
  SELECT COALESCE(sum(amount), 0) INTO _total FROM public.xp_events WHERE user_id = _user;
  SELECT COALESCE(sum(amount), 0) INTO _today FROM public.xp_events
    WHERE user_id = _user AND event_date = _date
      AND reason IN ('mission_workout','mission_water','mission_protein','mission_mindset');

  IF _total >= 25000 THEN _rank := 'Legend'; _floor := 25000; _next := 25000;
  ELSIF _total >= 12000 THEN _rank := 'Beast'; _floor := 12000; _next := 25000;
  ELSIF _total >= 6000 THEN _rank := 'Elite'; _floor := 6000; _next := 12000;
  ELSIF _total >= 2500 THEN _rank := 'Warrior'; _floor := 2500; _next := 6000;
  ELSIF _total >= 800 THEN _rank := 'Consistent'; _floor := 800; _next := 2500;
  ELSE _rank := 'Beginner'; _floor := 0; _next := 800;
  END IF;

  RETURN jsonb_build_object(
    'total_xp', _total,
    'today_xp', _today,
    'rank', _rank,
    'rank_floor', _floor,
    'next_rank_at', _next,
    'progress_pct', CASE WHEN _next = _floor THEN 100
      ELSE ROUND(((_total - _floor)::numeric / (_next - _floor)) * 100) END
  );
END; $function$;