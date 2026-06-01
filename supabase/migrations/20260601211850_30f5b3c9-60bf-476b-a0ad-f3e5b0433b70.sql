
-- ============== PARTNERSHIPS ==============
CREATE TABLE public.partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  pairing_mode text NOT NULL DEFAULT 'invite', -- invite | auto
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT partnerships_distinct CHECK (user_a <> user_b),
  CONSTRAINT partnerships_ordered CHECK (user_a < user_b),
  CONSTRAINT partnerships_unique UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partnerships TO authenticated;
GRANT ALL ON public.partnerships TO service_role;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners read own" ON public.partnerships
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "partners update own" ON public.partnerships
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "partners delete own" ON public.partnerships
  FOR DELETE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
-- INSERT only via SECURITY DEFINER functions

-- ============== INVITES ==============
CREATE TABLE public.partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  email text,
  consumed_by uuid,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_invites TO authenticated;
GRANT ALL ON public.partner_invites TO service_role;
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites inviter all" ON public.partner_invites
  FOR ALL TO authenticated
  USING (auth.uid() = inviter_id)
  WITH CHECK (auth.uid() = inviter_id);

-- ============== NUDGES ==============
CREATE TABLE public.partner_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  kind text NOT NULL DEFAULT 'cheer', -- cheer | callout | challenge
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.partner_nudges TO authenticated;
GRANT ALL ON public.partner_nudges TO service_role;
ALTER TABLE public.partner_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nudges read own" ON public.partner_nudges
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "nudges send own" ON public.partner_nudges
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user AND EXISTS (
    SELECT 1 FROM public.partnerships p
    WHERE p.id = partnership_id
      AND ((p.user_a = from_user AND p.user_b = to_user) OR (p.user_b = from_user AND p.user_a = to_user))
      AND p.status = 'active'
  ));
CREATE POLICY "nudges mark read" ON public.partner_nudges
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user);

-- ============== TEAM CHALLENGES ==============
CREATE TABLE public.weekly_team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  week_start date NOT NULL,
  week_end date NOT NULL,
  metric text NOT NULL DEFAULT 'total_score', -- total_score | workouts | habits_done
  target_per_member integer NOT NULL DEFAULT 0,
  team_size integer NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_team_challenges TO authenticated;
GRANT ALL ON public.weekly_team_challenges TO service_role;
ALTER TABLE public.weekly_team_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtc read all authed" ON public.weekly_team_challenges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "wtc admin write" ON public.weekly_team_challenges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.team_challenge_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.weekly_team_challenges(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.team_challenge_teams TO authenticated;
GRANT ALL ON public.team_challenge_teams TO service_role;
ALTER TABLE public.team_challenge_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams read all authed" ON public.team_challenge_teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams create authed" ON public.team_challenge_teams
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.team_challenge_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.team_challenge_teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.team_challenge_members TO authenticated;
GRANT ALL ON public.team_challenge_members TO service_role;
ALTER TABLE public.team_challenge_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tcm read all authed" ON public.team_challenge_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tcm join self" ON public.team_challenge_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tcm leave self" ON public.team_challenge_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============== LEADERBOARD VIEW ==============
CREATE OR REPLACE VIEW public.leaderboard_weekly
WITH (security_invoker = true) AS
SELECT
  ds.user_id,
  date_trunc('week', ds.score_date)::date AS week_start,
  SUM(ds.total)::int AS week_total,
  COUNT(*) FILTER (WHERE ds.total >= 50)::int AS active_days,
  MAX(ds.streak_day)::int AS streak_peak
FROM public.daily_scores ds
GROUP BY ds.user_id, date_trunc('week', ds.score_date);
GRANT SELECT ON public.leaderboard_weekly TO authenticated;

-- ============== RPCs ==============
CREATE OR REPLACE FUNCTION public.accept_partner_invite(_code text)
RETURNS public.partnerships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _inv public.partner_invites;
  _a uuid; _b uuid;
  _p public.partnerships;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _code IS NULL OR length(_code) < 6 OR length(_code) > 64 THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;
  SELECT * INTO _inv FROM public.partner_invites
    WHERE code = _code AND consumed_at IS NULL AND expires_at > now()
    FOR UPDATE;
  IF _inv.id IS NULL THEN RAISE EXCEPTION 'Invite not found or expired'; END IF;
  IF _inv.inviter_id = _user THEN RAISE EXCEPTION 'Cannot accept your own invite'; END IF;

  IF _inv.inviter_id < _user THEN _a := _inv.inviter_id; _b := _user;
  ELSE _a := _user; _b := _inv.inviter_id; END IF;

  INSERT INTO public.partnerships(user_a, user_b, pairing_mode)
  VALUES (_a, _b, 'invite')
  ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'active', ended_at = NULL
  RETURNING * INTO _p;

  UPDATE public.partner_invites
    SET consumed_at = now(), consumed_by = _user
    WHERE id = _inv.id;

  RETURN _p;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_match_partner()
RETURNS public.partnerships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _me public.user_profiles_ext;
  _match uuid;
  _a uuid; _b uuid;
  _p public.partnerships;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- already paired?
  SELECT * INTO _p FROM public.partnerships
    WHERE (user_a = _user OR user_b = _user) AND status = 'active' LIMIT 1;
  IF _p.id IS NOT NULL THEN RETURN _p; END IF;

  SELECT * INTO _me FROM public.user_profiles_ext WHERE user_id = _user;

  SELECT u.user_id INTO _match
  FROM public.user_profiles_ext u
  WHERE u.user_id <> _user
    AND NOT EXISTS (
      SELECT 1 FROM public.partnerships p
      WHERE p.status = 'active' AND (p.user_a = u.user_id OR p.user_b = u.user_id)
    )
    AND (_me.training_level IS NULL OR u.training_level = _me.training_level)
  ORDER BY random() LIMIT 1;

  IF _match IS NULL THEN
    -- fallback: any unpaired user
    SELECT u.user_id INTO _match
    FROM public.user_profiles_ext u
    WHERE u.user_id <> _user
      AND NOT EXISTS (
        SELECT 1 FROM public.partnerships p
        WHERE p.status = 'active' AND (p.user_a = u.user_id OR p.user_b = u.user_id)
      )
    ORDER BY random() LIMIT 1;
  END IF;

  IF _match IS NULL THEN RAISE EXCEPTION 'No available partner right now'; END IF;

  IF _match < _user THEN _a := _match; _b := _user; ELSE _a := _user; _b := _match; END IF;

  INSERT INTO public.partnerships(user_a, user_b, pairing_mode)
  VALUES (_a, _b, 'auto')
  ON CONFLICT (user_a, user_b) DO UPDATE SET status = 'active', ended_at = NULL
  RETURNING * INTO _p;

  RETURN _p;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_partner_invite()
RETURNS public.partner_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _code text;
  _inv public.partner_invites;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _code := encode(gen_random_bytes(9), 'base64');
  _code := replace(replace(replace(_code, '/', ''), '+', ''), '=', '');
  INSERT INTO public.partner_invites(inviter_id, code)
  VALUES (_user, _code) RETURNING * INTO _inv;
  RETURN _inv;
END;
$$;
