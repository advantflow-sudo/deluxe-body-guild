DROP POLICY IF EXISTS "workouts read all authed" ON public.workouts;
CREATE POLICY "workouts read free or premium members" ON public.workouts
  FOR SELECT TO authenticated
  USING (is_premium = false OR public.is_premium_member(auth.uid()));

DROP POLICY IF EXISTS "exercises read all authed" ON public.exercises;
CREATE POLICY "exercises read free or premium members" ON public.exercises
  FOR SELECT TO authenticated
  USING (is_premium = false OR public.is_premium_member(auth.uid()));

DROP POLICY IF EXISTS "challenges read all authed" ON public.challenges;
CREATE POLICY "challenges read free or premium members" ON public.challenges
  FOR SELECT TO authenticated
  USING (is_premium = false OR public.is_premium_member(auth.uid()));