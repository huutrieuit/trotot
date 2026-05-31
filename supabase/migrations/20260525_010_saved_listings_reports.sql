-- 010: Saved listings + credit reports
-- Run in Supabase SQL Editor

-- Lưu phòng yêu thích
CREATE TABLE IF NOT EXISTS public.saved_listings (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_listings: owner all"
  ON public.saved_listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Báo cáo số điện thoại không liên lạc được
CREATE TABLE IF NOT EXISTS public.credit_reports (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  reason     text NOT NULL DEFAULT 'Số không liên lạc được',
  status     text NOT NULL DEFAULT 'pending', -- pending | refunded | rejected
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.credit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_reports: owner read/insert"
  ON public.credit_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "credit_reports: owner insert"
  ON public.credit_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credit_reports: admin all"
  ON public.credit_reports FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
