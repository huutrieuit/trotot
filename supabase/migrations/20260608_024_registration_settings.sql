-- Thêm setting kiểm soát phương thức đăng ký
INSERT INTO public.site_settings (key, value) VALUES
  ('registration_sso_only', 'false')
ON CONFLICT (key) DO NOTHING;
