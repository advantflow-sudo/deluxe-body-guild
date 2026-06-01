DROP POLICY IF EXISTS "teams create authed" ON public.team_challenge_teams;

CREATE POLICY "teams create authed"
ON public.team_challenge_teams
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.weekly_team_challenges wc WHERE wc.id = challenge_id)
);