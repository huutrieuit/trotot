-- Fix trigger handle_new_user: đọc role từ metadata khi đăng ký
-- Trước đây chỉ insert full_name + avatar_url, role luôn default 'tenant'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('tenant', 'landlord') THEN NEW.raw_user_meta_data->>'role'
      ELSE 'tenant'
    END
  );
  RETURN NEW;
END;
$$;
