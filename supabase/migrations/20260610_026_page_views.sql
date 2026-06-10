-- 026: Page view tracking for admin analytics

-- ── Bảng page_views: đếm lượt xem theo ngày + đường dẫn ──────
CREATE TABLE IF NOT EXISTS public.page_views (
  id         bigserial PRIMARY KEY,
  path       text NOT NULL,
  view_date  date NOT NULL DEFAULT CURRENT_DATE,
  count      integer NOT NULL DEFAULT 1,
  UNIQUE(path, view_date)
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Chỉ service role mới được ghi, admin đọc được
CREATE POLICY "page_views: admin read"
  ON public.page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'sub_admin')
    )
  );

-- ── RPC: increment page view (upsert) ─────────────────────────
CREATE OR REPLACE FUNCTION public.increment_page_view(p_path text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.page_views (path, view_date, count)
  VALUES (p_path, CURRENT_DATE, 1)
  ON CONFLICT (path, view_date)
  DO UPDATE SET count = page_views.count + 1;
END;
$$;

-- ── RPC: increment listing view_count ─────────────────────────
CREATE OR REPLACE FUNCTION public.increment_listing_view(p_listing_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id;
END;
$$;
