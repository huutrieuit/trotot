-- 025: Make area nullable (area is optional in listing form)
ALTER TABLE public.listings
  ALTER COLUMN area DROP NOT NULL,
  ALTER COLUMN area SET DEFAULT NULL;

-- Fix existing rows with area = 0 (sentinel for "not provided") → null
UPDATE public.listings SET area = NULL WHERE area = 0;
