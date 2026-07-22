
-- ============ connected_devices: split ALL policy, keep tokens server-only ============
DROP POLICY IF EXISTS "devices own all" ON public.connected_devices;

CREATE POLICY "devices select own"
  ON public.connected_devices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "devices insert own"
  ON public.connected_devices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy for authenticated: token mutations must go through server (service_role).
CREATE POLICY "devices delete own"
  ON public.connected_devices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Safe view without token columns for client reads
CREATE OR REPLACE VIEW public.connected_devices_safe
WITH (security_invoker = true) AS
SELECT id, user_id, provider, display_name, status, scopes,
       external_user_id, token_expires_at, last_synced_at,
       created_at, updated_at
FROM public.connected_devices;

GRANT SELECT ON public.connected_devices_safe TO authenticated;

-- ============ team_challenge_teams: add UPDATE/DELETE (admin only) ============
CREATE POLICY "teams update admin"
  ON public.team_challenge_teams FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "teams delete admin"
  ON public.team_challenge_teams FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT UPDATE, DELETE ON public.team_challenge_teams TO authenticated;
