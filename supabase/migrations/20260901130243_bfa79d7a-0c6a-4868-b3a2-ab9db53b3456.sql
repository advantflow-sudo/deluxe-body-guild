ALTER TABLE public.xp_events DROP CONSTRAINT IF EXISTS xp_reason_chk;
ALTER TABLE public.xp_events ADD CONSTRAINT xp_reason_chk CHECK (reason = ANY (ARRAY[
  'workout','water','protein','habit','recovery','mission','challenge',
  'mission_workout','mission_water','mission_protein','mission_mindset'
]));