-- Thêm vai trò sub_admin: có quyền duyệt/xóa tin nhưng không quản lý user

-- 1. Cập nhật constraint role trên bảng profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('tenant', 'landlord', 'admin', 'sub_admin'));

-- 2. Cập nhật hàm is_admin() để sub_admin cũng được duyệt/xóa tin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'sub_admin')
  );
$$;

-- Hàm riêng cho kiểm tra full admin (quản lý user)
CREATE OR REPLACE FUNCTION is_full_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- 3. Cho phép sub_admin xóa tin đăng của người khác (RLS)
-- Listings: admin hoặc sub_admin có thể xóa bất kỳ tin nào
DROP POLICY IF EXISTS "Admin can delete any listing" ON listings;
CREATE POLICY "Admin can delete any listing" ON listings
  FOR DELETE USING (is_admin());
