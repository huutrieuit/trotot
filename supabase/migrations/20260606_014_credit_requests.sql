-- Bảng lưu yêu cầu nạp credit của user (thay vì chỉ gửi email)
create table public.credit_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  user_email   text not null,
  package_name text not null,
  credits      integer not null check (credits > 0),
  amount       integer not null check (amount > 0),   -- VNĐ
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  admin_note   text,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

create index on public.credit_requests (status, created_at desc);
create index on public.credit_requests (user_id, created_at desc);

alter table public.credit_requests enable row level security;

-- User chỉ thấy yêu cầu của chính mình
create policy "credit_requests: owner read"
  on public.credit_requests for select using (auth.uid() = user_id);

-- User tự tạo yêu cầu
create policy "credit_requests: owner insert"
  on public.credit_requests for insert with check (auth.uid() = user_id);

-- Admin đọc tất cả
create policy "credit_requests: admin read"
  on public.credit_requests for select using (is_admin());

-- Admin cập nhật status
create policy "credit_requests: admin update"
  on public.credit_requests for update using (is_admin());
