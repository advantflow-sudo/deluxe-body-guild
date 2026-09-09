-- 1. SECURITY DEFINER execute hardening
REVOKE EXECUTE ON FUNCTION public.can_join_challenge_team(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_subscription_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_local_date(uuid) FROM authenticated;

-- 3. Public avatars bucket: stop object listing via the Data API
--    (public URLs keep working; they bypass RLS by design)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars own read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Partner invites: redeemer can read their own consumed invite
CREATE POLICY "invites consumer read" ON public.partner_invites
  FOR SELECT TO authenticated
  USING (auth.uid() = consumed_by);

-- 5. Workout sessions: explicit owner-only update
CREATE POLICY "sessions own update" ON public.workout_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
