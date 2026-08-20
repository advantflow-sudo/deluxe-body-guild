-- 1) connected_devices: keep OAuth tokens out of client-reachable privileges
REVOKE SELECT, INSERT, UPDATE, REFERENCES ON public.connected_devices FROM authenticated;
REVOKE ALL ON public.connected_devices FROM anon;

GRANT SELECT (
  id, user_id, provider, display_name, status, last_synced_at,
  external_user_id, scopes, created_at, updated_at
) ON public.connected_devices TO authenticated;

GRANT INSERT (
  id, user_id, provider, display_name, status, last_synced_at,
  external_user_id, scopes, created_at, updated_at
) ON public.connected_devices TO authenticated;

GRANT UPDATE (
  display_name, status, last_synced_at, external_user_id, scopes, updated_at
) ON public.connected_devices TO authenticated;

GRANT DELETE ON public.connected_devices TO authenticated;
GRANT ALL ON public.connected_devices TO service_role;

-- 2) team_challenge_teams: bind team creation to eligibility
CREATE OR REPLACE FUNCTION public.can_create_challenge_team(_challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.weekly_team_challenges wc
      WHERE wc.id = _challenge_id
        AND wc.is_active = true
        AND CURRENT_DATE BETWEEN wc.week_start AND wc.week_end
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.team_challenge_members m
      JOIN public.team_challenge_teams t ON t.id = m.team_id
      WHERE m.user_id = auth.uid()
        AND t.challenge_id = _challenge_id
    );
$$;

DROP POLICY IF EXISTS "teams create authed" ON public.team_challenge_teams;

CREATE POLICY "teams create eligible" ON public.team_challenge_teams
FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_challenge_team(challenge_id)
  AND char_length(btrim(name)) BETWEEN 2 AND 40
);