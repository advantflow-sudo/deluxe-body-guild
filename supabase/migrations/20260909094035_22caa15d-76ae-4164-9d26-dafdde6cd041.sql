DROP POLICY IF EXISTS "blocks read all authed" ON public.workout_blocks;
DROP POLICY IF EXISTS "workout_blocks read all authed" ON public.workout_blocks;
CREATE POLICY "blocks read free or premium member"
ON public.workout_blocks FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workouts w
  WHERE w.id = workout_blocks.workout_id
    AND (w.is_premium = false OR public.is_premium_member(auth.uid()))
));

DROP POLICY IF EXISTS "block exercises read all authed" ON public.workout_block_exercises;
DROP POLICY IF EXISTS "workout_block_exercises read all authed" ON public.workout_block_exercises;
CREATE POLICY "block exercises read free or premium member"
ON public.workout_block_exercises FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.workout_blocks b
  JOIN public.workouts w ON w.id = b.workout_id
  WHERE b.id = workout_block_exercises.block_id
    AND (w.is_premium = false OR public.is_premium_member(auth.uid()))
));

DROP POLICY IF EXISTS "team members read all" ON public.team_challenge_members;
DROP POLICY IF EXISTS "team_challenge_members read all authed" ON public.team_challenge_members;
CREATE POLICY "team members read same challenge"
ON public.team_challenge_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.team_challenge_teams t
    JOIN public.team_challenge_teams mine ON mine.challenge_id = t.challenge_id
    JOIN public.team_challenge_members mm ON mm.team_id = mine.id AND mm.user_id = auth.uid()
    WHERE t.id = team_challenge_members.team_id
  )
);