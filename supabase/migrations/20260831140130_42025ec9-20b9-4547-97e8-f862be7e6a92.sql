ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

CREATE OR REPLACE FUNCTION public.is_premium_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.user_profiles_ext
    where user_id = _user_id
      and (
        subscription_tier in ('premium','deluxe')
        or (premium_until is not null and premium_until > now())
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.claim_reward(_reward_id uuid)
RETURNS reward_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user uuid := auth.uid();
  _reward public.rewards_catalog;
  _balance integer;
  _new_balance integer;
  _claim public.reward_claims;
  _grants_premium boolean;
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

  -- A membership-type reward grants 30 days of premium immediately, stacking
  -- on any remaining points-granted time.
  _grants_premium := _reward.type = 'membership' OR _reward.title ILIKE '%premium membership%';

  IF _grants_premium THEN
    UPDATE public.user_profiles_ext
       SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + interval '30 days'
     WHERE user_id = _user;
  END IF;

  INSERT INTO public.reward_claims(user_id, reward_id, status)
  VALUES (_user, _reward_id, CASE WHEN _grants_premium THEN 'fulfilled' ELSE 'pending' END)
  RETURNING * INTO _claim;

  RETURN _claim;
END;
$function$;

CREATE TABLE IF NOT EXISTS public.grocery_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner text NOT NULL,
  fulfilment text NOT NULL DEFAULT 'delivery',
  window_date date NOT NULL,
  window_start_hour integer NOT NULL,
  window_end_hour integer NOT NULL,
  address_note text,
  item_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_deliveries TO authenticated;
GRANT ALL ON public.grocery_deliveries TO service_role;

ALTER TABLE public.grocery_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own grocery deliveries"
  ON public.grocery_deliveries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER grocery_deliveries_set_updated_at
  BEFORE UPDATE ON public.grocery_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();