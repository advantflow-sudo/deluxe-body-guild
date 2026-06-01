
-- 1) push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own push subs select" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own push subs insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own push subs update" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own push subs delete" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- 2) preference columns
ALTER TABLE public.user_profiles_ext
  ADD COLUMN IF NOT EXISTS reminder_morning_hour int CHECK (reminder_morning_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS reminder_evening_hour int CHECK (reminder_evening_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS weekly_recap_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- 3) helper RPCs — service_role only
CREATE OR REPLACE FUNCTION public.cron_generate_missions_for_active()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u record; _count int := 0; _prompt text;
BEGIN
  FOR _u IN
    SELECT DISTINCT user_id FROM public.user_profiles_ext
  LOOP
    BEGIN
      INSERT INTO public.daily_missions(user_id, mission_date, workout_id, habit_ids, mindset_prompt)
      SELECT _u.user_id, CURRENT_DATE,
             (SELECT id FROM public.workouts ORDER BY random() LIMIT 1),
             COALESCE(array_agg(h.id), '{}'),
             'Excellence is a habit, not an act.'
      FROM public.habits h WHERE h.user_id = _u.user_id AND h.active = true
      ON CONFLICT (user_id, mission_date) DO NOTHING;
      _count := _count + 1;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  RETURN _count;
END $$;
REVOKE ALL ON FUNCTION public.cron_generate_missions_for_active() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_generate_missions_for_active() TO service_role;

CREATE OR REPLACE FUNCTION public.cron_streak_at_risk_users()
RETURNS TABLE(user_id uuid, current_len int) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, s.current_len
  FROM public.streaks s
  LEFT JOIN public.daily_scores d
    ON d.user_id = s.user_id AND d.score_date = CURRENT_DATE
  WHERE s.current_len > 0
    AND (d.total IS NULL OR d.total < 50)
    AND (s.last_active_date IS NULL OR s.last_active_date < CURRENT_DATE);
$$;
REVOKE ALL ON FUNCTION public.cron_streak_at_risk_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_streak_at_risk_users() TO service_role;

CREATE OR REPLACE FUNCTION public.cron_users_for_reminder(_kind text)
RETURNS TABLE(user_id uuid) LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.user_profiles_ext
  WHERE CASE
    WHEN _kind = 'morning' THEN COALESCE(reminder_morning_hour, 8) = EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(timezone,'UTC')))::int
    WHEN _kind = 'evening' THEN COALESCE(reminder_evening_hour, 20) = EXTRACT(HOUR FROM (now() AT TIME ZONE COALESCE(timezone,'UTC')))::int
    ELSE false END;
$$;
REVOKE ALL ON FUNCTION public.cron_users_for_reminder(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_users_for_reminder(text) TO service_role;

CREATE OR REPLACE FUNCTION public.cron_auto_match_unpaired()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u record; _match uuid; _a uuid; _b uuid; _count int := 0;
BEGIN
  FOR _u IN
    SELECT u.user_id FROM public.user_profiles_ext u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.partnerships p
      WHERE p.status='active' AND (p.user_a=u.user_id OR p.user_b=u.user_id))
  LOOP
    SELECT v.user_id INTO _match FROM public.user_profiles_ext v
    WHERE v.user_id <> _u.user_id
      AND NOT EXISTS (
        SELECT 1 FROM public.partnerships p
        WHERE p.status='active' AND (p.user_a=v.user_id OR p.user_b=v.user_id))
    ORDER BY random() LIMIT 1;
    IF _match IS NOT NULL THEN
      IF _match < _u.user_id THEN _a := _match; _b := _u.user_id;
      ELSE _a := _u.user_id; _b := _match; END IF;
      INSERT INTO public.partnerships(user_a, user_b, pairing_mode)
      VALUES (_a, _b, 'auto')
      ON CONFLICT (user_a, user_b) DO NOTHING;
      _count := _count + 1;
    END IF;
  END LOOP;
  RETURN _count;
END $$;
REVOKE ALL ON FUNCTION public.cron_auto_match_unpaired() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_auto_match_unpaired() TO service_role;

-- 4) pg_cron jobs (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE _base text := 'https://project--eba2b5b6-0e26-42b9-b5c5-a2b72735fe8e.lovable.app';
        _secret text;
BEGIN
  -- We must read CRON_SECRET from vault if present; otherwise jobs are scheduled and will 401 until env is set on the worker (the route validates header).
  -- Unschedule duplicates
  PERFORM cron.unschedule(jobname) FROM cron.job WHERE jobname IN (
    'daily-missions-generate','score-recompute-15m','streak-at-risk-hourly',
    'weekly-recap-sunday','auto-match-partners-mon','send-reminders-hourly'
  );

  PERFORM cron.schedule('daily-missions-generate','0 4 * * *', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/daily-missions-generate'));

  PERFORM cron.schedule('score-recompute-15m','*/15 * * * *', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/score-recompute'));

  PERFORM cron.schedule('streak-at-risk-hourly','0 * * * *', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/streak-at-risk-alert'));

  PERFORM cron.schedule('weekly-recap-sunday','0 18 * * 0', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/weekly-recap'));

  PERFORM cron.schedule('auto-match-partners-mon','0 9 * * 1', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/auto-match-partners'));

  PERFORM cron.schedule('send-reminders-hourly','0 * * * *', format($job$
    SELECT net.http_post(url:=%L, headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret', current_setting('app.cron_secret', true)), body:='{}'::jsonb);
  $job$, _base || '/api/public/hooks/send-reminders'));
END $$;
