-- ============================================================
-- TrọTốt – Database Migration v1
-- Created: 2026-05-24
-- Run in: Supabase → SQL Editor → New query
-- ============================================================

-- ─── 1. PROFILES ──────────────────────────────────────────
-- Mở rộng auth.users, tự động tạo khi user đăng ký
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  avatar_url  text,
  phone       text,
  role        text not null default 'tenant' check (role in ('tenant', 'landlord', 'admin')),
  verified_phone boolean not null default false,
  verified_id    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Trigger: tự tạo profile khi user đăng ký
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. LISTINGS ──────────────────────────────────────────
create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  landlord_id      uuid references public.profiles(user_id) on delete set null,
  city             text not null,
  source           text not null default 'landlord'
                     check (source in ('landlord', 'admin', 'claimed')),
  source_note      text,
  source_url       text,
  title            text not null,
  description      text not null default '',
  address          text not null,
  district         text not null,
  lat              double precision not null default 0,
  lng              double precision not null default 0,
  price            integer not null,
  area             integer not null,
  room_type        text not null
                     check (room_type in ('phong_tro','chung_cu','nha_nguyen_can','homestay')),
  max_occupants    integer not null default 2,
  gender_preference text not null default 'all'
                     check (gender_preference in ('all','male','female')),
  amenities        jsonb not null default '{
    "wifi":false,"ac":false,"washer":false,"parking":false,
    "security":false,"elevator":false,"kitchen":false,"balcony":false,"pet":false
  }'::jsonb,
  status           text not null default 'pending'
                     check (status in ('pending','active','rented','hidden')),
  view_count       integer not null default 0,
  contact_count    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index on public.listings (city, status);
create index on public.listings (landlord_id);
create index on public.listings (status, created_at desc);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ─── 3. LISTING IMAGES ────────────────────────────────────
create table public.listing_images (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  url         text not null,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

create index on public.listing_images (listing_id, "order");

-- ─── 4. CLAIM REQUESTS ────────────────────────────────────
-- Khi chủ nhà muốn nhận về tin do admin đăng
create table public.claim_requests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  user_id     uuid not null references public.profiles(user_id) on delete cascade,
  phone       text not null,
  note        text,
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ─── 5. CREDITS ───────────────────────────────────────────
-- Hệ thống credit cho chủ nhà (monetization)
create table public.credits (
  user_id     uuid primary key references public.profiles(user_id) on delete cascade,
  balance     integer not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

create table public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(user_id) on delete cascade,
  amount      integer not null,          -- dương: nạp, âm: tiêu
  type        text not null
                check (type in ('topup','post_listing','boost','refund')),
  listing_id  uuid references public.listings(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index on public.credit_transactions (user_id, created_at desc);

-- ─── 6. ROW LEVEL SECURITY ────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.listings            enable row level security;
alter table public.listing_images      enable row level security;
alter table public.claim_requests      enable row level security;
alter table public.credits             enable row level security;
alter table public.credit_transactions enable row level security;

-- Profiles: public đọc được (hiện tên chủ nhà); user tự sửa profile của mình
create policy "profiles: public read"
  on public.profiles for select using (true);
create policy "profiles: owner update"
  on public.profiles for update using (auth.uid() = user_id);

-- Listings: active listings công khai; chủ nhà quản lý tin của mình
create policy "listings: public read active"
  on public.listings for select
  using (status = 'active' or auth.uid() = landlord_id);

create policy "listings: landlord insert"
  on public.listings for insert
  with check (auth.uid() = landlord_id);

create policy "listings: landlord update own"
  on public.listings for update
  using (auth.uid() = landlord_id);

-- Listing images: public đọc; chủ nhà quản lý ảnh tin của mình
create policy "listing_images: public read"
  on public.listing_images for select using (true);

create policy "listing_images: owner manage"
  on public.listing_images for all
  using (
    listing_id in (
      select id from public.listings where landlord_id = auth.uid()
    )
  );

-- Claim requests: user tự xem và tạo claim của mình
create policy "claims: user read own"
  on public.claim_requests for select using (auth.uid() = user_id);

create policy "claims: user insert"
  on public.claim_requests for insert with check (auth.uid() = user_id);

-- Credits: chỉ chủ sở hữu xem
create policy "credits: owner read"
  on public.credits for select using (auth.uid() = user_id);

create policy "credit_tx: owner read"
  on public.credit_transactions for select using (auth.uid() = user_id);
