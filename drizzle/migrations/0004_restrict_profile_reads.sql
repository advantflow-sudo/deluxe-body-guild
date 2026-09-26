DROP POLICY IF EXISTS "wbe read all authed" ON public.workout_block_exercises;

DROP POLICY IF EXISTS "Profiles readable by signed-in members" ON public.profiles;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER VIEW public.public_profiles SET (security_invoker = off);
REVOKE ALL ON public.public_profiles FROM anon, public;
GRANT SELECT ON public.public_profiles TO authenticated;