"use server";

import { createClient } from "@/lib/supabase/server";
import { sendListingReportNotification } from "@/lib/email";

export async function toggleSaveListing(listingId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: "auth_required" };

  const { data: existing } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    await supabase.from("saved_listings").delete()
      .eq("user_id", user.id).eq("listing_id", listingId);
    return { saved: false };
  }

  await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: listingId });
  return { saved: true };
}

export async function reportPhone(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth_required" };

  const { error } = await supabase.from("credit_reports").insert({
    user_id: user.id,
    listing_id: listingId,
    reason: "Số không liên lạc được",
  });

  if (error && error.code !== "23505") return { error: error.message };
  return {};
}

const VALID_REPORT_REASONS = [
  "Tin giả / không có thật",
  "Thông tin sai lệch",
  "Giá không đúng thực tế",
  "Tin trùng lặp",
  "Chủ trọ lừa đảo",
] as const;

export async function reportListing(params: {
  listingId: string;
  listingTitle: string;
  citySlug: string;
  reason: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth_required" };

  if (!VALID_REPORT_REASONS.includes(params.reason as typeof VALID_REPORT_REASONS[number])) {
    return { error: "Lý do không hợp lệ" };
  }

  const { error } = await supabase.from("listing_reports").insert({
    user_id: user.id,
    listing_id: params.listingId,
    reason: params.reason,
  });

  if (error?.code === "23505") return { error: "duplicate" };
  if (error) return { error: error.message };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    await sendListingReportNotification({
      userEmail: user.email ?? "unknown",
      listingId: params.listingId,
      listingTitle: params.listingTitle,
      listingUrl: `${siteUrl}/${params.citySlug}/phong-tro/${params.listingId}`,
      reason: params.reason,
      adminUrl: `${siteUrl}/admin/bao-cao-tin`,
    });
  } catch { /* email failure must not break the report */ }

  return {};
}
