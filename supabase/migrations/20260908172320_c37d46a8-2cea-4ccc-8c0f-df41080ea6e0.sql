DROP POLICY IF EXISTS "likes read all authed" ON public.post_likes;
CREATE POLICY "likes read visible posts" ON public.post_likes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_likes.post_id
      AND (p.visibility = 'public' OR public.is_premium_member(auth.uid()))
  )
);

DROP POLICY IF EXISTS "comments read all authed" ON public.post_comments;
CREATE POLICY "comments read visible posts" ON public.post_comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = post_comments.post_id
      AND (p.visibility = 'public' OR public.is_premium_member(auth.uid()))
  )
);