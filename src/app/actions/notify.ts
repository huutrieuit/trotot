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

export async function notifyCreditRequest(params: {
  packageName: string;
  credits: number;
  amount: number;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Chưa đăng nhập" };

    await sendCreditRequestNotification({
      ...params,
      userEmail: user.email ?? "unknown",
      userId: user.id,
    });

    return { ok: true };
  } catch (err) {
    console.error("[notify] credit email failed:", err instanceof Error ? err.message : err);
    return { error: "Không thể gửi thông báo. Vui lòng liên hệ Zalo." };
  }
}
