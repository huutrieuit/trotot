-- ============================================================
-- TrọTốt – Migration v6: Landlord delete own listings
-- Run in: Supabase → SQL Editor → New query
-- ============================================================

-- Chủ nhà có thể xoá tin của mình
create policy "listings: landlord delete own"
  on public.listings for delete
  using (auth.uid() = landlord_id);
