
REVOKE EXECUTE ON FUNCTION public.generate_daily_mission() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.compute_daily_score(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_mission() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_daily_mission() TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_daily_score(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_mission() TO authenticated;
