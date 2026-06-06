-- Thêm trạng thái blocked và email vào profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email   text;

-- Cập nhật trigger để lưu email khi đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('tenant', 'landlord')
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'tenant'
    END,
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Index để tìm nhanh theo blocked
CREATE INDEX IF NOT EXISTS profiles_blocked_idx ON public.profiles (blocked) WHERE blocked = true;
