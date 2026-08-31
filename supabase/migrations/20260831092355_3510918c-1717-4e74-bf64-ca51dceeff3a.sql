ALTER TABLE public.nutrition_logs
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS possible_allergens TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS uncertainty TEXT;

ALTER TABLE public.nutrition_logs
  ADD CONSTRAINT nutrition_logs_confidence_check
  CHECK (confidence IS NULL OR confidence IN ('low','medium','high'));