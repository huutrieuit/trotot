-- Bảng báo cáo tin giả (tách biệt với credit_reports dùng cho báo cáo SĐT)
CREATE TABLE IF NOT EXISTS listing_reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason      text        NOT NULL DEFAULT 'Tin giả / không có thật',
  status      text        NOT NULL DEFAULT 'pending', -- pending | dismissed
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

-- Người dùng chỉ xem và tạo report của chính họ
CREATE POLICY "Owner select own listing reports"
  ON listing_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner insert own listing reports"
  ON listing_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin (bao gồm sub_admin) có toàn quyền
CREATE POLICY "Admin full access listing reports"
  ON listing_reports FOR ALL
  USING (is_admin());
