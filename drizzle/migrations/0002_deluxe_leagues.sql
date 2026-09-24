CREATE TABLE public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.league_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);
CREATE INDEX league_members_league_idx ON public.league_members(league_id);
GRANT SELECT ON public.leagues TO authenticated;
GRANT SELECT ON public.league_members TO authenticated;
GRANT ALL ON public.leagues TO service_role;
GRANT ALL ON public.league_members TO service_role;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_league_member(_league_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.league_members WHERE league_id = _league_id AND user_id = auth.uid())
$$;
REVOKE EXECUTE ON FUNCTION public.is_league_member(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_league_member(uuid) TO authenticated;

CREATE POLICY "League members read league" ON public.leagues FOR SELECT TO authenticated USING (public.is_league_member(id));
CREATE POLICY "League members read members" ON public.league_members FOR SELECT TO authenticated USING (public.is_league_member(league_id));

CREATE OR REPLACE FUNCTION public.join_weekly_league()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _d date;
  _ws date;
  _lid uuid;
  _n int;
  _names text[] := ARRAY['Onyx','Gilt','Sovereign','Obsidian','Aurum','Regent','Velvet','Monarch'];
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  _d := public.user_local_date(_uid);
  _ws := _d - ((extract(isodow FROM _d)::int) - 1);
  SELECT league_id INTO _lid FROM public.league_members WHERE user_id = _uid AND week_start = _ws;
  IF _lid IS NOT NULL THEN RETURN _lid; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('league:' || _ws::text));
  SELECT l.id INTO _lid FROM public.leagues l
    WHERE l.week_start = _ws
      AND (SELECT count(*) FROM public.league_members m WHERE m.league_id = l.id) < 10
    ORDER BY l.created_at LIMIT 1;
  IF _lid IS NULL THEN
    SELECT count(*) INTO _n FROM public.leagues WHERE week_start = _ws;
    INSERT INTO public.leagues(week_start, name)
      VALUES (_ws, _names[(_n % array_length(_names,1)) + 1] || ' League ' || (_n / array_length(_names,1) + 1))
      RETURNING id INTO _lid;
  END IF;
  INSERT INTO public.league_members(league_id, user_id, week_start) VALUES (_lid, _uid, _ws);
  RETURN _lid;
END $$;
REVOKE EXECUTE ON FUNCTION public.join_weekly_league() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_weekly_league() TO authenticated;

-- Capped scoring: each day counts at most 100 points so nobody can run away with the week.
CREATE OR REPLACE FUNCTION public.get_league_standings()
RETURNS TABLE(league_id uuid, league_name text, week_start date, user_id uuid, display_name text, avatar_url text, points int, active_days int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (
    SELECT m.league_id, m.week_start FROM public.league_members m
    WHERE m.user_id = auth.uid()
    ORDER BY m.week_start DESC LIMIT 1
  )
  SELECT l.id, l.name, l.week_start, m.user_id, p.display_name, p.avatar_url,
    COALESCE((SELECT sum(LEAST(s.total, 100))::int FROM public.daily_scores s
      WHERE s.user_id = m.user_id AND s.score_date BETWEEN l.week_start AND l.week_start + 6), 0),
    COALESCE((SELECT count(*)::int FROM public.daily_scores s
      WHERE s.user_id = m.user_id AND s.total > 0 AND s.score_date BETWEEN l.week_start AND l.week_start + 6), 0)
  FROM me
  JOIN public.leagues l ON l.id = me.league_id
  JOIN public.league_members m ON m.league_id = l.id
  LEFT JOIN public.profiles p ON p.id = m.user_id
  ORDER BY 7 DESC
$$;
REVOKE EXECUTE ON FUNCTION public.get_league_standings() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_league_standings() TO authenticated;