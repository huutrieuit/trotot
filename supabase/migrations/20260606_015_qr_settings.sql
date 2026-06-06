-- Thêm keys QR code cho từng gói credit vào site_settings
INSERT INTO public.site_settings (key, value) VALUES
  ('qr_starter',  ''),
  ('qr_standard', ''),
  ('qr_pro',      '')
ON CONFLICT (key) DO NOTHING;
