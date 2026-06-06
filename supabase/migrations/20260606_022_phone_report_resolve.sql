-- 022: RPC resolve_phone_report – atomic status update + optional credit refund

CREATE OR REPLACE FUNCTION public.resolve_phone_report(
  p_report_id uuid,
  p_action    text   -- 'refunded' | 'rejected'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reporter_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_action NOT IN ('refunded', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT user_id INTO v_reporter_id
  FROM public.credit_reports
  WHERE id = p_report_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found or already processed';
  END IF;

  UPDATE public.credit_reports
  SET status = p_action
  WHERE id = p_report_id;

  IF p_action = 'refunded' THEN
    UPDATE public.profiles
    SET credits = credits + 1
    WHERE user_id = v_reporter_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_phone_report(uuid, text) TO authenticated;
