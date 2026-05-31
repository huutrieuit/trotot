-- 012: Referral system, listing reviews, saved searches
-- Run in Supabase SQL Editor

-- ── Referral code trong profiles ──────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by  text;

DROP POLICY IF EXISTS "profiles: owner update" ON public.profiles;
CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Referral log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_given boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_log: owner read"
  ON public.referral_log FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Trigger: cộng 2 credit cho cả 2 khi referred_by được set
CREATE OR REPLACE FUNCTION public.process_referral()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_referrer_id uuid;
BEGIN
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR OLD.referred_by != NEW.referred_by) THEN
    SELECT user_id INTO v_referrer_id FROM profiles WHERE referral_code = NEW.referred_by;
    IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.user_id THEN
      INSERT INTO referral_log (referrer_id, referred_id)
      VALUES (v_referrer_id, NEW.user_id)
      ON CONFLICT (referred_id) DO NOTHING;
      IF FOUND THEN
        UPDATE profiles SET credits = credits + 2 WHERE user_id = v_referrer_id;
        NEW.credits = COALESCE(NEW.credits, 0) + 2;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_referral ON public.profiles;
CREATE TRIGGER on_referral
  BEFORE UPDATE OF referred_by ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.process_referral();

-- ── Listing reviews ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_reviews (
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  phone_active boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_reviews: public read"
  ON public.listing_reviews FOR SELECT USING (true);

CREATE POLICY "listing_reviews: owner write"
  ON public.listing_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listing_reviews: owner update"
  ON public.listing_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Saved searches ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  city       text NOT NULL,
  label      text NOT NULL,
  district   text,
  room_type  text,
  price_min  integer,
  price_max  integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches: owner all"
  ON public.saved_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
