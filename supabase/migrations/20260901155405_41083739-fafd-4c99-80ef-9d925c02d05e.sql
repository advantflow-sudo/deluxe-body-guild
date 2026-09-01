REVOKE EXECUTE ON FUNCTION public.user_local_date(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_local_date(uuid) TO service_role;