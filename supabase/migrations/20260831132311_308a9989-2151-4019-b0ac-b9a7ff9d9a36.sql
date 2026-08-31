CREATE OR REPLACE FUNCTION public.award_points(_reason text, _delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _last integer;
  _new integer;
  _allowed integer;
  _today_total integer;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _reason IS NULL OR length(_reason) > 200 THEN
    RAISE EXCEPTION 'Invalid reason';
  END IF;

  -- Reward points are earned, never client-specified. Each recognised reason has a
  -- fixed server-side value, so a crafted request cannot mint arbitrary points.
  _allowed := CASE lower(_reason)
    WHEN 'workout completed' THEN 50
    WHEN 'mission completed' THEN 25
    WHEN 'challenge completed' THEN 40
    WHEN 'streak milestone' THEN 30
    WHEN 'referral' THEN 100
    ELSE NULL END;
  IF _allowed IS NULL THEN
    RAISE EXCEPTION 'Invalid reason';
  END IF;
  IF _delta <= 0 THEN
    RAISE EXCEPTION 'Invalid delta';
  END IF;

  -- Daily earn ceiling as a second line of defence against farming.
  SELECT COALESCE(sum(delta), 0) INTO _today_total
    FROM public.reward_points
    WHERE user_id = _user AND delta > 0 AND created_at >= date_trunc('day', now());
  IF _today_total + _allowed > 400 THEN
    RETURN (SELECT COALESCE(balance_after, 0) FROM public.reward_points
             WHERE user_id = _user ORDER BY created_at DESC LIMIT 1);
  END IF;

  SELECT balance_after INTO _last
    FROM public.reward_points
    WHERE user_id = _user
    ORDER BY created_at DESC
    LIMIT 1;

  _new := COALESCE(_last, 0) + _allowed;

  INSERT INTO public.reward_points(user_id, delta, balance_after, reason)
  VALUES (_user, _allowed, _new, _reason);

  RETURN _new;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.award_points(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_points(text, integer) TO authenticated;