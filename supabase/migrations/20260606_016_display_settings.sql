-- Thêm tùy chọn hiển thị vào site_settings
-- show_phone_support:   hiện/ẩn nút Gọi hỗ trợ trên trang mua credit
-- show_manual_transfer: hiện/ẩn thông tin chuyển khoản thủ công trên trang mua credit
INSERT INTO public.site_settings (key, value) VALUES
  ('show_phone_support',   'false'),
  ('show_manual_transfer', 'false')
ON CONFLICT (key) DO NOTHING;
