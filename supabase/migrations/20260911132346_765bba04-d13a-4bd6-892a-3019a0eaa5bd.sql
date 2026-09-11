CREATE OR REPLACE FUNCTION public.shares_challenge_team(_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_challenge_teams t
    JOIN public.team_challenge_teams mine ON mine.challenge_id = t.challenge_id
    JOIN public.team_challenge_members mm ON mm.team_id = mine.id AND mm.user_id = auth.uid()
    WHERE t.id = _team_id
  );
$$;

REVOKE ALL ON FUNCTION public.shares_challenge_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_challenge_team(uuid) TO authenticated;

DROP POLICY IF EXISTS "team members read same challenge" ON public.team_challenge_members;
CREATE POLICY "team members read same challenge"
ON public.team_challenge_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.shares_challenge_team(team_id));