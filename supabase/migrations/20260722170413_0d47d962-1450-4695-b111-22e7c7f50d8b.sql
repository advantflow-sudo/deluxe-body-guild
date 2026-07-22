
-- 1. Reward claims: atomic RPC + remove client insert policy
CREATE OR REPLACE FUNCTION public.claim_reward(_reward_id uuid)
RETURNS public.reward_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _reward public.rewards_catalog;
  _balance integer;
  _new_balance integer;
  _claim public.reward_claims;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _reward FROM public.rewards_catalog WHERE id = _reward_id AND active = true;
  IF _reward.id IS NULL THEN RAISE EXCEPTION 'Reward not available'; END IF;

  SELECT balance_after INTO _balance
    FROM public.reward_points
    WHERE user_id = _user
    ORDER BY created_at DESC
    LIMIT 1;

  _balance := COALESCE(_balance, 0);
  IF _balance < _reward.cost_points THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  _new_balance := _balance - _reward.cost_points;

  INSERT INTO public.reward_points(user_id, delta, balance_after, reason)
  VALUES (_user, -_reward.cost_points, _new_balance, 'Claimed: ' || _reward.title);

  INSERT INTO public.reward_claims(user_id, reward_id)
  VALUES (_user, _reward_id)
  RETURNING * INTO _claim;

  RETURN _claim;
END;
$$;

DROP POLICY IF EXISTS "claims own insert" ON public.reward_claims;
REVOKE INSERT ON public.reward_claims FROM authenticated;

-- 2. Connected devices: add UPDATE policy scoped to owner
CREATE POLICY "devices update own" ON public.connected_devices
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
