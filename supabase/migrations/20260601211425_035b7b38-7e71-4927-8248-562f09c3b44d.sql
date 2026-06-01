
-- ============ HABITS ============
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  habit_type text NOT NULL DEFAULT 'custom',
  target_value numeric NOT NULL DEFAULT 1,
  unit text,
  icon text,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habits own all" ON public.habits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habits_user ON public.habits(user_id, active);
CREATE TRIGGER habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ HABIT LOGS ============
CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  value numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habit_logs own all" ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habit_logs_user_date ON public.habit_logs(user_id, log_date DESC);

-- ============ DAILY MISSIONS ============
CREATE TABLE public.daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_id uuid,
  habit_ids uuid[] NOT NULL DEFAULT '{}',
  mindset_prompt text,
  completed_at timestamptz,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_missions TO authenticated;
GRANT ALL ON public.daily_missions TO service_role;
ALTER TABLE public.daily_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions own all" ON public.daily_missions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_missions_user_date ON public.daily_missions(user_id, mission_date DESC);

-- ============ DAILY SCORES ============
CREATE TABLE public.daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_pts int NOT NULL DEFAULT 0,
  habits_pts int NOT NULL DEFAULT 0,
  mindset_pts int NOT NULL DEFAULT 0,
  social_pts int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  streak_day int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_scores TO authenticated;
GRANT ALL ON public.daily_scores TO service_role;
ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores own read" ON public.daily_scores FOR SELECT
  USING (auth.uid() = user_id);
CREATE INDEX idx_scores_user_date ON public.daily_scores(user_id, score_date DESC);

-- ============ STREAKS ============
CREATE TABLE public.streaks (
  user_id uuid PRIMARY KEY,
  current_len int NOT NULL DEFAULT 0,
  longest_len int NOT NULL DEFAULT 0,
  last_active_date date,
  freezes_remaining int NOT NULL DEFAULT 1,
  freezes_reset_week date NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.streaks TO authenticated;
GRANT ALL ON public.streaks TO service_role;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks own read" ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

-- ============ RPC: generate_daily_mission ============
CREATE OR REPLACE FUNCTION public.generate_daily_mission()
RETURNS public.daily_missions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _today date := CURRENT_DATE;
  _existing public.daily_missions;
  _profile public.user_profiles_ext;
  _workout_id uuid;
  _habit_ids uuid[];
  _prompts text[] := ARRAY[
    'Excellence is a habit, not an act.',
    'Discipline is the bridge between goals and accomplishment.',
    'Small daily improvements compound into stunning results.',
    'You are what you repeatedly do.',
    'The body achieves what the mind believes.',
    'Strength does not come from winning. It comes from struggle.',
    'Today''s effort is tomorrow''s strength.'
  ];
  _prompt text;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _existing FROM public.daily_missions
    WHERE user_id = _user AND mission_date = _today;
  IF _existing.id IS NOT NULL THEN RETURN _existing; END IF;

  SELECT * INTO _profile FROM public.user_profiles_ext WHERE user_id = _user;

  SELECT id INTO _workout_id FROM public.workouts
    WHERE (_profile.preferred_type IS NULL OR type = _profile.preferred_type OR _profile.preferred_type = 'any')
      AND (_profile.training_level IS NULL OR level = _profile.training_level)
      AND (is_premium = false OR public.is_premium_member(_user))
    ORDER BY random() LIMIT 1;
  IF _workout_id IS NULL THEN
    SELECT id INTO _workout_id FROM public.workouts
      WHERE (is_premium = false OR public.is_premium_member(_user))
      ORDER BY random() LIMIT 1;
  END IF;

  SELECT COALESCE(array_agg(id ORDER BY sort_order), '{}') INTO _habit_ids
    FROM public.habits WHERE user_id = _user AND active = true;

  _prompt := _prompts[1 + (extract(doy from _today)::int % array_length(_prompts, 1))];

  INSERT INTO public.daily_missions(user_id, mission_date, workout_id, habit_ids, mindset_prompt)
  VALUES (_user, _today, _workout_id, _habit_ids, _prompt)
  RETURNING * INTO _existing;
  RETURN _existing;
END;
$$;

-- ============ RPC: compute_daily_score ============
CREATE OR REPLACE FUNCTION public.compute_daily_score(_date date DEFAULT CURRENT_DATE)
RETURNS public.daily_scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _mission public.daily_missions;
  _workout_pts int := 0;
  _habits_pts int := 0;
  _mindset_pts int := 0;
  _social_pts int := 0;
  _total int := 0;
  _habit_total int := 0;
  _habit_done int := 0;
  _result public.daily_scores;
  _streak public.streaks;
  _new_current int;
  _yesterday date := _date - 1;
  _wk date := date_trunc('week', _date)::date;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _mission FROM public.daily_missions
    WHERE user_id = _user AND mission_date = _date;

  -- Workout: 40 pts if any session completed today
  IF EXISTS (SELECT 1 FROM public.workout_sessions
             WHERE user_id = _user AND completed_at::date = _date) THEN
    _workout_pts := 40;
  END IF;

  -- Habits: up to 40 pts, scaled by completion ratio
  SELECT count(*) INTO _habit_total FROM public.habits
    WHERE user_id = _user AND active = true;
  IF _habit_total > 0 THEN
    SELECT count(DISTINCT habit_id) INTO _habit_done FROM public.habit_logs
      WHERE user_id = _user AND log_date = _date;
    _habits_pts := least(40, (_habit_done * 40) / _habit_total);
  END IF;

  -- Mindset: 10 pts if mission marked complete
  IF _mission.completed_at IS NOT NULL THEN _mindset_pts := 10; END IF;

  -- Social: 10 pts if posted or commented today
  IF EXISTS (SELECT 1 FROM public.community_posts
             WHERE user_id = _user AND created_at::date = _date)
     OR EXISTS (SELECT 1 FROM public.post_comments
                WHERE user_id = _user AND created_at::date = _date) THEN
    _social_pts := 10;
  END IF;

  _total := _workout_pts + _habits_pts + _mindset_pts + _social_pts;

  -- Update streak (only when computing for today)
  IF _date = CURRENT_DATE THEN
    SELECT * INTO _streak FROM public.streaks WHERE user_id = _user;
    IF _streak.user_id IS NULL THEN
      INSERT INTO public.streaks(user_id, current_len, longest_len, last_active_date, freezes_reset_week)
      VALUES (_user, 0, 0, NULL, _wk)
      RETURNING * INTO _streak;
    END IF;

    -- Reset weekly freezes
    IF _streak.freezes_reset_week < _wk THEN
      UPDATE public.streaks SET freezes_remaining = 1, freezes_reset_week = _wk
        WHERE user_id = _user RETURNING * INTO _streak;
    END IF;

    IF _total >= 50 THEN
      IF _streak.last_active_date = _date THEN
        _new_current := _streak.current_len;
      ELSIF _streak.last_active_date = _yesterday OR _streak.last_active_date IS NULL THEN
        _new_current := COALESCE(_streak.current_len, 0) + 1;
      ELSE
        -- gap: consume freeze if available
        IF _streak.freezes_remaining > 0 AND _streak.last_active_date = _date - 2 THEN
          _new_current := _streak.current_len + 1;
          UPDATE public.streaks SET freezes_remaining = freezes_remaining - 1
            WHERE user_id = _user;
        ELSE
          _new_current := 1;
        END IF;
      END IF;
      UPDATE public.streaks
        SET current_len = _new_current,
            longest_len = GREATEST(longest_len, _new_current),
            last_active_date = _date,
            updated_at = now()
        WHERE user_id = _user
        RETURNING * INTO _streak;
    END IF;
  END IF;

  INSERT INTO public.daily_scores(user_id, score_date, workout_pts, habits_pts, mindset_pts, social_pts, total, streak_day)
  VALUES (_user, _date, _workout_pts, _habits_pts, _mindset_pts, _social_pts, _total, COALESCE(_streak.current_len, 0))
  ON CONFLICT (user_id, score_date) DO UPDATE
    SET workout_pts = EXCLUDED.workout_pts,
        habits_pts = EXCLUDED.habits_pts,
        mindset_pts = EXCLUDED.mindset_pts,
        social_pts = EXCLUDED.social_pts,
        total = EXCLUDED.total,
        streak_day = EXCLUDED.streak_day,
        updated_at = now()
  RETURNING * INTO _result;

  RETURN _result;
END;
$$;

-- ============ RPC: complete_mission ============
CREATE OR REPLACE FUNCTION public.complete_mission()
RETURNS public.daily_missions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _m public.daily_missions;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.daily_missions
    SET completed_at = COALESCE(completed_at, now())
    WHERE user_id = _user AND mission_date = CURRENT_DATE
    RETURNING * INTO _m;
  PERFORM public.compute_daily_score(CURRENT_DATE);
  RETURN _m;
END;
$$;
