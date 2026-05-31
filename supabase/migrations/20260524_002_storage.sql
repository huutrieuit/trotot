-- ============================================================
-- TrọTốt – Migration v2: Storage bucket cho ảnh phòng
-- Run in: Supabase → SQL Editor → New query
-- ============================================================

-- Tạo bucket công khai để lưu ảnh listing
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,  -- 5MB per file
  array['image/jpeg','image/jpg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Policy: public đọc ảnh
create policy "listing-images: public read"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Policy: user đã đăng nhập được upload (thư mục đầu = user_id của họ)
create policy "listing-images: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: chủ ảnh được xóa
create policy "listing-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
