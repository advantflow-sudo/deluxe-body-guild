REVOKE EXECUTE ON FUNCTION public.log_recovery(smallint,smallint,smallint,smallint,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.award_xp(text,integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_xp_summary() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.log_recovery(smallint,smallint,smallint,smallint,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_xp_summary() TO authenticated;