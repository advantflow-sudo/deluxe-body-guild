CREATE TABLE public.grocery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item text NOT NULL,
  amount text,
  source_meal text,
  plan_date date NOT NULL DEFAULT CURRENT_DATE,
  checked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, item)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grocery_items TO authenticated;
GRANT ALL ON public.grocery_items TO service_role;

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members manage their own grocery items"
ON public.grocery_items FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER grocery_items_set_updated_at
BEFORE UPDATE ON public.grocery_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();