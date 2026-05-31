-- 009: Site settings table (bank info, zalo, etc.)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.site_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed to show bank info to buyers)
CREATE POLICY "site_settings: public read"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admin can write
CREATE POLICY "site_settings: admin write"
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed default values (do nothing if already exists)
INSERT INTO public.site_settings (key, value) VALUES
  ('bank_name',    'Vietcombank'),
  ('bank_account', ''),
  ('bank_owner',   ''),
  ('bank_branch',  'Chi nhánh Đà Nẵng'),
  ('zalo',         '0364823724')
ON CONFLICT (key) DO NOTHING;
