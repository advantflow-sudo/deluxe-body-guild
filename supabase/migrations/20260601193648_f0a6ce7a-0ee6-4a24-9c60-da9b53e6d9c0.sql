
-- 1. Server-validated reward points: drop client INSERT policy + add RPC
DROP POLICY IF EXISTS "points own insert" ON public.reward_points;

CREATE OR REPLACE FUNCTION public.award_points(_reason text, _delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _last integer;
  _new integer;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Server-side caps to prevent abuse
  IF _delta > 1000 OR _delta < -100000 THEN
    RAISE EXCEPTION 'Invalid delta';
  END IF;
  IF _reason IS NULL OR length(_reason) > 200 THEN
    RAISE EXCEPTION 'Invalid reason';
  END IF;

  SELECT balance_after INTO _last
    FROM public.reward_points
    WHERE user_id = _user
    ORDER BY created_at DESC
    LIMIT 1;

  _new := COALESCE(_last, 0) + _delta;
  IF _new < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  INSERT INTO public.reward_points(user_id, delta, balance_after, reason)
  VALUES (_user, _delta, _new, _reason);

  RETURN _new;
END;
$$;

REVOKE ALL ON FUNCTION public.award_points(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_points(text, integer) TO authenticated;

-- 2. Remove sensitive connected_devices from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.connected_devices;
