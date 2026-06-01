-- Prevent client-side subscription tier escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_subscription_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow when called via SECURITY DEFINER functions / service role (no auth.uid())
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Admins can change tiers
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    -- New rows from clients must start on free
    NEW.subscription_tier := 'free';
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'subscription_tier cannot be changed from the client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_subscription_tier ON public.user_profiles_ext;
CREATE TRIGGER lock_subscription_tier
BEFORE INSERT OR UPDATE ON public.user_profiles_ext
FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_tier_change();

-- Force any existing self-upgraded rows back to free unless an admin upgraded them.
-- (Skipped: we don't have an audit trail; leave existing values alone to avoid downgrading paid users.)

-- Remove device_metrics from realtime publication to avoid row-level broadcast leaks.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'device_metrics'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.device_metrics';
  END IF;
END $$;