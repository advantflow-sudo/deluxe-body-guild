REVOKE ALL ON FUNCTION public.award_mission_xp(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_mission_xp(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_mission_xp_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_mission_xp(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_mission_xp(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mission_xp_today() TO authenticated;