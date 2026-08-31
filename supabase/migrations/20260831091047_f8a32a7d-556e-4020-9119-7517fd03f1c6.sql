ALTER TABLE public.nutrition_logs
  ADD COLUMN IF NOT EXISTS fibre_g numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS photo_path text;

CREATE POLICY "Members read own meal photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members upload own meal photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members update own meal photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Members delete own meal photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);