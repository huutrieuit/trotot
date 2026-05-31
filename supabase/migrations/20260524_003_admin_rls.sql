-- ============================================================
-- TrọTốt – Migration v3: Admin RLS policies
-- Run in: Supabase → SQL Editor → New query
-- ============================================================

-- Helper: check user is admin via profiles table
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Admin: full access to listings (approve, reject, edit any)
create policy "listings: admin all"
  on public.listings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin: full access to listing_images
create policy "listing_images: admin all"
  on public.listing_images for all
  using (public.is_admin());

-- Admin: full access to claim_requests
create policy "claims: admin all"
  on public.claim_requests for all
  using (public.is_admin());

-- Admin: full access to profiles
create policy "profiles: admin all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());
