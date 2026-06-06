-- RPC 1: Duyệt yêu cầu credit (atomic, chống double-approval)
-- Thực hiện cả 2 bước trong 1 transaction: cộng credit + đổi status
CREATE OR REPLACE FUNCTION public.approve_credit_request(
  p_request_id  UUID,
  p_user_id     UUID,
  p_credits     INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Chặn double-approval: chỉ xử lý nếu request vẫn còn pending
  IF NOT EXISTS (
    SELECT 1 FROM public.credit_requests
    WHERE id = p_request_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Atomic: cộng credit mà không cần SELECT trước
  UPDATE public.profiles
  SET credits = credits + p_credits
  WHERE user_id = p_user_id;

  -- Đánh dấu đã duyệt
  UPDATE public.credit_requests
  SET status = 'approved', resolved_at = now()
  WHERE id = p_request_id;
END;
$$;

-- RPC 2: Điều chỉnh credit thủ công (atomic, chống race condition)
-- Dùng GREATEST(0, ...) để credit không bao giờ âm
CREATE OR REPLACE FUNCTION public.adjust_credits(
  p_user_id UUID,
  p_delta   INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.profiles
  SET credits = GREATEST(0, credits + p_delta)
  WHERE user_id = p_user_id;
END;
$$;
