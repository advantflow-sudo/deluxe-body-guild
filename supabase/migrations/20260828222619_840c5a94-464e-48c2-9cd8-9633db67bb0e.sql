REVOKE EXECUTE ON FUNCTION public.cron_mission_reminder_users() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_streak_at_risk_users() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_users_for_reminder(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_auto_match_unpaired() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_generate_missions_for_active() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_reminder_history(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reminder_history(integer) TO authenticated;