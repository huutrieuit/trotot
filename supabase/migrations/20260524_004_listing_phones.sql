-- ============================================================
-- TrọTốt – Migration v4: Contact phones on listings
-- Run in: Supabase → SQL Editor → New query
-- ============================================================

alter table public.listings
  add column contact_phone  text not null default '',
  add column contact_phone2 text;
