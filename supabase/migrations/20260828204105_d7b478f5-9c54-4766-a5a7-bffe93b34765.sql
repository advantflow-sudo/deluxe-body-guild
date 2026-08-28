-- ============ Daily mission XP: auditable + anti-farming ============
CREATE UNIQUE INDEX IF NOT EXISTS xp_events_mission_unique
  ON public.xp_events (user_id, event_date, reason)
  WHERE reason IN ('mission_workout','mission_water','mission_protein','mission_mindset');

CREATE OR REPLACE FUNCTION public.award_mission_xp(_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _amount int;
  _today date := (now() AT TIME ZONE 'utc')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

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
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'utc')::date;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_object_agg(reason, amount), '{}'::jsonb)
  FROM public.xp_events
  WHERE user_id = auth.uid()
    AND event_date = (now() AT TIME ZONE 'utc')::date
    AND reason IN ('mission_workout','mission_water','mission_protein','mission_mindset');
$$;

-- ============ AI Nutritionist meal plans ============
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  kcal_target integer NOT NULL DEFAULT 0,
  protein_target_g integer NOT NULL DEFAULT 0,
  carbs_target_g integer NOT NULL DEFAULT 0,
  fat_target_g integer NOT NULL DEFAULT 0,
  water_target_ml integer NOT NULL DEFAULT 2500,
  weight_basis text NOT NULL DEFAULT 'raw',
  meals jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO service_role;

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own meal plans"
  ON public.meal_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER meal_plans_set_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();