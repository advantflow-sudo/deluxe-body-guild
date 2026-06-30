
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('like','comment')),
  post_id uuid,
  comment_id uuid,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_like_idx
  ON public.notifications (user_id, actor_id, post_id) WHERE kind = 'like';

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.community_posts WHERE id = NEW.post_id;
  IF _owner IS NULL OR _owner = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, actor_id, kind, post_id)
  VALUES (_owner, NEW.user_id, 'like', NEW.post_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM public.community_posts WHERE id = NEW.post_id;
  IF _owner IS NULL OR _owner = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, actor_id, kind, post_id, comment_id, body)
  VALUES (_owner, NEW.user_id, 'comment', NEW.post_id, NEW.id, left(NEW.body, 280));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.tg_unnotify_on_unlike()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.notifications
   WHERE kind = 'like' AND post_id = OLD.post_id AND actor_id = OLD.user_id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS post_likes_notify ON public.post_likes;
CREATE TRIGGER post_likes_notify AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_like();

DROP TRIGGER IF EXISTS post_likes_unnotify ON public.post_likes;
CREATE TRIGGER post_likes_unnotify AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.tg_unnotify_on_unlike();

DROP TRIGGER IF EXISTS post_comments_notify ON public.post_comments;
CREATE TRIGGER post_comments_notify AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_on_comment();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
