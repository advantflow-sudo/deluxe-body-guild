-- 1. AI COACH MEMORY -------------------------------------------------
CREATE TABLE public.ai_coach_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  value text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0.8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_coach_memory_key_len CHECK (char_length(key) BETWEEN 1 AND 80),
  CONSTRAINT ai_coach_memory_value_len CHECK (char_length(value) BETWEEN 1 AND 600),
  CONSTRAINT ai_coach_memory_category_chk CHECK (category IN ('goal','preference','equipment','limitation','progress','general')),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_coach_memory TO authenticated;
GRANT ALL ON public.ai_coach_memory TO service_role;
ALTER TABLE public.ai_coach_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory" ON public.ai_coach_memory FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ai_coach_memory_updated BEFORE UPDATE ON public.ai_coach_memory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. CONVERSATIONS ---------------------------------------------------
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_conversations_title_len CHECK (char_length(title) BETWEEN 1 AND 160)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conversations" ON public.ai_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ai_conversations_updated BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_messages_role_chk CHECK (role IN ('user','assistant')),
  CONSTRAINT ai_messages_content_len CHECK (char_length(content) BETWEEN 1 AND 20000)
);
CREATE INDEX ai_messages_conv_idx ON public.ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.ai_messages FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. RECOVERY / READINESS -------------------------------------------
CREATE TABLE public.recovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  sleep_quality smallint NOT NULL,
  soreness smallint NOT NULL,
  fatigue smallint NOT NULL,
  energy smallint NOT NULL,
  note text,
  readiness smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recovery_scale_chk CHECK (
    sleep_quality BETWEEN 1 AND 5 AND soreness BETWEEN 1 AND 5
    AND fatigue BETWEEN 1 AND 5 AND energy BETWEEN 1 AND 5),
  CONSTRAINT recovery_note_len CHECK (note IS NULL OR char_length(note) <= 500),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recovery_logs TO authenticated;
GRANT ALL ON public.recovery_logs TO service_role;
ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recovery" ON public.recovery_logs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER recovery_logs_updated BEFORE UPDATE ON public.recovery_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.log_recovery(
  _sleep_quality smallint, _soreness smallint, _fatigue smallint, _energy smallint, _note text DEFAULT NULL)
RETURNS public.recovery_logs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user uuid := auth.uid();
  _readiness smallint;
  _row public.recovery_logs;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _sleep_quality NOT BETWEEN 1 AND 5 OR _soreness NOT BETWEEN 1 AND 5
     OR _fatigue NOT BETWEEN 1 AND 5 OR _energy NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Values must be 1-5';
  END IF;
  IF _note IS NOT NULL AND char_length(_note) > 500 THEN RAISE EXCEPTION 'Note too long'; END IF;

  -- readiness: sleep + energy positive, soreness + fatigue negative
  _readiness := GREATEST(0, LEAST(100, ROUND(
      ((_sleep_quality + _energy + (6 - _soreness) + (6 - _fatigue))::numeric - 4) / 16 * 100)))::smallint;

  INSERT INTO public.recovery_logs(user_id, log_date, sleep_quality, soreness, fatigue, energy, note, readiness)
  VALUES (_user, CURRENT_DATE, _sleep_quality, _soreness, _fatigue, _energy, _note, _readiness)
  ON CONFLICT (user_id, log_date) DO UPDATE
    SET sleep_quality = EXCLUDED.sleep_quality, soreness = EXCLUDED.soreness,
        fatigue = EXCLUDED.fatigue, energy = EXCLUDED.energy,
        note = EXCLUDED.note, readiness = EXCLUDED.readiness, updated_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END; $$;

-- 4. XP + LEVELS -----------------------------------------------------
CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  amount integer NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xp_amount_chk CHECK (amount BETWEEN 1 AND 500),
  CONSTRAINT xp_reason_chk CHECK (reason IN ('workout','water','protein','habit','recovery','mission','challenge'))
);
CREATE INDEX xp_events_user_idx ON public.xp_events(user_id, event_date);
CREATE UNIQUE INDEX xp_events_daily_unique ON public.xp_events(user_id, reason, event_date);
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp read" ON public.xp_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.award_xp(_reason text, _amount integer DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user uuid := auth.uid();
  _default integer;
  _total integer;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _default := CASE _reason
    WHEN 'workout' THEN 50 WHEN 'water' THEN 20 WHEN 'protein' THEN 20
    WHEN 'habit' THEN 10 WHEN 'recovery' THEN 10 WHEN 'mission' THEN 10
    WHEN 'challenge' THEN 25 ELSE NULL END;
  IF _default IS NULL THEN RAISE EXCEPTION 'Invalid reason'; END IF;

  INSERT INTO public.xp_events(user_id, reason, amount)
  VALUES (_user, _reason, LEAST(COALESCE(_amount, _default), _default))
  ON CONFLICT (user_id, reason, event_date) DO NOTHING;

  SELECT COALESCE(sum(amount), 0) INTO _total FROM public.xp_events WHERE user_id = _user;
  RETURN _total;
END; $$;

CREATE OR REPLACE FUNCTION public.get_xp_summary()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user uuid := auth.uid();
  _total integer;
  _today integer;
  _rank text;
  _floor integer;
  _next integer;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT COALESCE(sum(amount), 0) INTO _total FROM public.xp_events WHERE user_id = _user;
  SELECT COALESCE(sum(amount), 0) INTO _today FROM public.xp_events
    WHERE user_id = _user AND event_date = CURRENT_DATE;

  IF _total >= 25000 THEN _rank := 'Legend'; _floor := 25000; _next := 25000;
  ELSIF _total >= 12000 THEN _rank := 'Beast'; _floor := 12000; _next := 25000;
  ELSIF _total >= 6000 THEN _rank := 'Elite'; _floor := 6000; _next := 12000;
  ELSIF _total >= 2500 THEN _rank := 'Warrior'; _floor := 2500; _next := 6000;
  ELSIF _total >= 800 THEN _rank := 'Consistent'; _floor := 800; _next := 2500;
  ELSE _rank := 'Beginner'; _floor := 0; _next := 800;
  END IF;

  RETURN jsonb_build_object(
    'total_xp', _total,
    'today_xp', _today,
    'rank', _rank,
    'rank_floor', _floor,
    'next_rank_at', _next,
    'progress_pct', CASE WHEN _next = _floor THEN 100
      ELSE ROUND(((_total - _floor)::numeric / (_next - _floor)) * 100) END
  );
END; $$;