-- ============================================================
-- TrọTốt – Migration v5: Safe add contact phones (idempotent)
-- Run in: Supabase → SQL Editor → New query
-- Bao gồm lại nội dung migration 004 nhưng dùng IF NOT EXISTS
-- để an toàn khi chạy lại nhiều lần
-- ============================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'listings'
      and column_name  = 'contact_phone'
  ) then
    alter table public.listings
      add column contact_phone  text not null default '',
      add column contact_phone2 text;
  end if;
end
$$;
