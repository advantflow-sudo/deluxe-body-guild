DROP POLICY IF EXISTS "posts read public or premium-by-premium" ON public.community_posts;
CREATE POLICY "posts read public or premium-by-premium"
ON public.community_posts FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR auth.uid() = user_id
  OR (visibility = 'premium' AND public.is_premium_member(auth.uid()))
);

DROP POLICY IF EXISTS "comments read visible posts" ON public.post_comments;
CREATE POLICY "comments read visible posts"
ON public.post_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.community_posts p
  WHERE p.id = post_comments.post_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid()
         OR (p.visibility = 'premium' AND public.is_premium_member(auth.uid())))
));

DROP POLICY IF EXISTS "likes read visible posts" ON public.post_likes;
CREATE POLICY "likes read visible posts"
ON public.post_likes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.community_posts p
  WHERE p.id = post_likes.post_id
    AND (p.visibility = 'public' OR p.user_id = auth.uid()
         OR (p.visibility = 'premium' AND public.is_premium_member(auth.uid())))
));