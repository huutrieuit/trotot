-- 021: Make lat/lng nullable + add post_listing RPC with credit deduction

-- 1. Make lat/lng nullable (0,0 is meaningless; null = "not geocoded")
ALTER TABLE public.listings
  ALTER COLUMN lat DROP NOT NULL,
  ALTER COLUMN lat SET DEFAULT NULL,
  ALTER COLUMN lng DROP NOT NULL,
  ALTER COLUMN lng SET DEFAULT NULL;

-- Fix existing rows that have 0,0 sentinel → null
UPDATE public.listings SET lat = NULL, lng = NULL WHERE lat = 0 AND lng = 0;

-- 2. RPC: create listing and deduct credits atomically
CREATE OR REPLACE FUNCTION public.post_listing(
  p_city            text,
  p_title           text,
  p_description     text,
  p_address         text,
  p_district        text,
  p_lat             double precision,
  p_lng             double precision,
  p_price           integer,
  p_area            integer,
  p_room_type       text,
  p_max_occupants   integer,
  p_gender_preference text,
  p_contact_phone   text,
  p_contact_phone2  text,
  p_amenities       jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_listing_id uuid;
  CREDIT_COST  constant integer := 2;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  -- Deduct credits atomically (ROWCOUNT = 0 if credits < cost)
  UPDATE profiles
  SET credits = credits - CREDIT_COST
  WHERE user_id = v_uid AND credits >= CREDIT_COST;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  -- Create listing
  INSERT INTO listings (
    landlord_id, city, source,
    title, description, address, district,
    lat, lng, price, area,
    room_type, max_occupants, gender_preference,
    contact_phone, contact_phone2,
    amenities, status
  )
  VALUES (
    v_uid, p_city, 'landlord',
    p_title, p_description, p_address, p_district,
    NULLIF(p_lat, 0), NULLIF(p_lng, 0),
    p_price, NULLIF(p_area, 0),
    p_room_type, p_max_occupants, p_gender_preference,
    p_contact_phone, NULLIF(p_contact_phone2, ''),
    p_amenities, 'pending'
  )
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_listing TO authenticated;
