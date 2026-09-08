CREATE OR REPLACE FUNCTION public.can_join_challenge_team(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_challenge_teams t
      JOIN public.weekly_team_challenges wc ON wc.id = t.challenge_id
      WHERE t.id = _team_id
        AND wc.is_active = true
        AND CURRENT_DATE BETWEEN wc.week_start AND wc.week_end
        AND (
          SELECT count(*) FROM public.team_challenge_members m WHERE m.team_id = t.id
        ) < wc.team_size
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.team_challenge_members m
      JOIN public.team_challenge_teams t2 ON t2.id = m.team_id
      WHERE m.user_id = auth.uid()
        AND t2.challenge_id = (
          SELECT challenge_id FROM public.team_challenge_teams WHERE id = _team_id
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_join_challenge_team(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_join_challenge_team(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can join teams" ON public.team_challenge_members;
DROP POLICY IF EXISTS "Users join teams" ON public.team_challenge_members;
DROP POLICY IF EXISTS "team_challenge_members_insert" ON public.team_challenge_members;

CREATE POLICY "Members join one eligible team per challenge"
ON public.team_challenge_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.can_join_challenge_team(team_id));