-- Thêm setting kiểm soát xác nhận email khi đăng ký
INSERT INTO public.site_settings (key, value) VALUES
  ('require_email_confirm', 'true')
ON CONFLICT (key) DO NOTHING;
