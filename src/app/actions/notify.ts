"use server";

import { sendNewListingNotification, sendCreditRequestNotification } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function notifyNewListing(params: {
  listingId: string;
  title: string;
  address: string;
  price: number;
  district: string;
  contactPhone: string;
  citySlug: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await sendNewListingNotification({ ...params, userEmail: user.email ?? "unknown" });
  } catch (err) {
    // Notification failure must never break the main flow
    console.error("[notify] listing email failed:", err instanceof Error ? err.message : err);
  }
}

// Danh sách gói hợp lệ — phải khớp với PACKAGES trong mua-credit/page.tsx
// Validate server-side để tránh user tự bịa credits/amount
const VALID_PACKAGES: Record<string, { credits: number; amount: number }> = {
  "Gói Cơ bản":     { credits: 5,  amount: 25_000 },
  "Gói Tiêu chuẩn": { credits: 20, amount: 80_000 },
  "Gói Cao cấp":    { credits: 50, amount: 150_000 },
};

export async function notifyCreditRequest(params: {
  packageName: string;
  credits: number;
  amount: number;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Chưa đăng nhập" };

    // Validate package server-side (tránh user tự chỉnh credits/amount từ client)
    const validPkg = VALID_PACKAGES[params.packageName];
    if (
      !validPkg ||
      validPkg.credits !== params.credits ||
      validPkg.amount !== params.amount
    ) {
      return { error: "Gói không hợp lệ." };
    }

    // Chặn spam: mỗi user chỉ có 1 request pending tại một thời điểm
    const { data: pending } = await supabase
      .from("credit_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (pending) {
      return {
        error: "Bạn đang có yêu cầu chờ xử lý. Admin sẽ duyệt trong 15 phút (giờ hành chính) — không cần gửi thêm.",
      };
    }

    // Lưu yêu cầu vào DB để admin duyệt
    const { error: dbErr } = await supabase.from("credit_requests").insert({
      user_id:      user.id,
      user_email:   user.email ?? "unknown",
      package_name: params.packageName,
      credits:      params.credits,
      amount:       params.amount,
    });
    if (dbErr) throw new Error(dbErr.message);

    // Gửi email thông báo (nếu thất bại cũng không ảnh hưởng request đã lưu)
    try {
      await sendCreditRequestNotification({
        ...params,
        userEmail: user.email ?? "unknown",
        userId: user.id,
      });
    } catch {
      // Email thất bại — request đã lưu, admin vẫn thấy trong bảng
    }

    return { ok: true };
  } catch (err) {
    console.error("[notify] credit request failed:", err instanceof Error ? err.message : err);
    return { error: "Không thể gửi thông báo. Vui lòng liên hệ Zalo." };
  }
}
