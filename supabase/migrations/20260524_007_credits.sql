-- 007: Credit system for phone number reveals
-- Run in Supabase SQL Editor

-- 1. Add credits column (new users start with 3 free credits)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 3;

-- 2. Phone reveals tracking
CREATE TABLE IF NOT EXISTS public.phone_reveals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  uuid        NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

ALTER TABLE public.phone_reveals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'phone_reveals' AND policyname = 'phone_reveals: own read'
  ) THEN
    CREATE POLICY "phone_reveals: own read"
      ON public.phone_reveals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Atomic reveal function (SECURITY DEFINER = runs as postgres, uses auth.uid() for caller identity)
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

  -- Get phone number
  SELECT contact_phone INTO v_phone
  FROM listings
  WHERE id = p_listing_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  -- Landlord always sees own listing phone for free
  IF EXISTS (SELECT 1 FROM listings WHERE id = p_listing_id AND landlord_id = v_uid) THEN
    RETURN v_phone;
  END IF;

  -- Already revealed previously → free repeat view
  IF EXISTS (SELECT 1 FROM phone_reveals WHERE user_id = v_uid AND listing_id = p_listing_id) THEN
    RETURN v_phone;
  END IF;

  -- Deduct 1 credit atomically — ROWCOUNT = 0 if credits < 1
  UPDATE profiles
  SET credits = credits - 1
  WHERE user_id = v_uid AND credits >= 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_credits';
  END IF;

  -- Record reveal + bump contact_count
  INSERT INTO phone_reveals (user_id, listing_id)
  VALUES (v_uid, p_listing_id)
  ON CONFLICT (user_id, listing_id) DO NOTHING;

  UPDATE listings SET contact_count = contact_count + 1 WHERE id = p_listing_id;

  RETURN v_phone;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reveal_phone(uuid) TO authenticated;

-- 4. RLS: allow profiles owner to read own credits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles: own select'
  ) THEN
    CREATE POLICY "profiles: own select"
      ON public.profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
