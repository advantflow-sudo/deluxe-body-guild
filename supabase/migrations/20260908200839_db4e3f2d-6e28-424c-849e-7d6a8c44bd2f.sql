CREATE OR REPLACE FUNCTION public.protect_subscription_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.premium_until := OLD.premium_until;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_subscription_fields() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.protect_subscription_fields() TO anon, authenticated, service_role;