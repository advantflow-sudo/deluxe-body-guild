
-- 1) connected_devices: revoke token columns from client roles
REVOKE SELECT, INSERT, UPDATE (access_token, refresh_token) ON public.connected_devices FROM authenticated;
REVOKE SELECT, INSERT, UPDATE (access_token, refresh_token) ON public.connected_devices FROM anon;
-- service_role retains full access via GRANT ALL defaults below
GRANT ALL ON public.connected_devices TO service_role;

-- 2) streak_events: remove client INSERT policy; only SECURITY DEFINER functions write
DROP POLICY IF EXISTS "users insert own streak events" ON public.streak_events;
REVOKE INSERT, UPDATE, DELETE ON public.streak_events FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.streak_events FROM anon;
GRANT ALL ON public.streak_events TO service_role;

-- 3) challenge_participants: replace blanket ALL with scoped policies that
--    forbid client-controlled UPDATEs to the progress field.
DROP POLICY IF EXISTS "cp own all" ON public.challenge_participants;

CREATE POLICY "cp read own"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "cp join self"
  ON public.challenge_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(progress, 0) = 0);

CREATE POLICY "cp leave own"
  ON public.challenge_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE policy: progress must be mutated by SECURITY DEFINER functions
-- (service_role bypasses RLS for server-side activity reconciliation).
REVOKE UPDATE ON public.challenge_participants FROM authenticated;
REVOKE UPDATE ON public.challenge_participants FROM anon;
GRANT ALL ON public.challenge_participants TO service_role;

-- 4) partnerships: explicitly block direct client INSERTs.
--    All pairings go through accept_partner_invite() / auto_match_partner()
--    SECURITY DEFINER functions, which bypass RLS as the function owner.
REVOKE INSERT ON public.partnerships FROM authenticated;
REVOKE INSERT ON public.partnerships FROM anon;
GRANT ALL ON public.partnerships TO service_role;

-- Add a restrictive deny-insert policy as defense-in-depth so even a future
-- accidental grant cannot let clients insert pairings.
DROP POLICY IF EXISTS "partnerships block client insert" ON public.partnerships;
CREATE POLICY "partnerships block client insert"
  ON public.partnerships AS RESTRICTIVE FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);
