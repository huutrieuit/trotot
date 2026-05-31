-- 008: Admin bypasses credit system when viewing phone numbers
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.reveal_phone(p_listing_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_phone text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  SELECT contact_phone INTO v_phone
  FROM listings
  WHERE id = p_listing_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  -- Admin xem miễn phí, không trừ credit
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = v_uid AND role = 'admin') THEN
    RETURN v_phone;
  END IF;

  -- Chủ nhà xem tin của mình miễn phí
  IF EXISTS (SELECT 1 FROM listings WHERE id = p_listing_id AND landlord_id = v_uid) THEN
    RETURN v_phone;
  END IF;

  -- Đã xem trước rồi → không trừ lần 2
  IF EXISTS (SELECT 1 FROM phone_reveals WHERE user_id = v_uid AND listing_id = p_listing_id) THEN
    RETURN v_phone;
  END IF;

  -- Trừ 1 credit (atomic)
  UPDATE profiles
  SET credits = credits - 1
  WHERE user_id = v_uid AND credits >= 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  INSERT INTO phone_reveals (user_id, listing_id)
  VALUES (v_uid, p_listing_id)
  ON CONFLICT (user_id, listing_id) DO NOTHING;

  UPDATE listings SET contact_count = contact_count + 1 WHERE id = p_listing_id;

  RETURN v_phone;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reveal_phone(uuid) TO authenticated;
