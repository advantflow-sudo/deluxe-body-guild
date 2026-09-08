CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier := OLD.subscription_tier;
  NEW.premium_until := OLD.premium_until;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_subscription_fields_trg ON public.user_profiles_ext;
CREATE TRIGGER protect_subscription_fields_trg
BEFORE UPDATE ON public.user_profiles_ext
FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_fields();