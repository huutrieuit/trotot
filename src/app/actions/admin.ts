"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Chỉ full admin (role = 'admin') — dùng cho quản lý user
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

// Admin hoặc sub_admin — dùng cho thao tác với tin đăng
async function requireAnyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "sub_admin") throw new Error("Forbidden");
  return supabase;
}

export async function approveListing(id: string) {
  const supabase = await requireAnyAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duyet-tin");
}

export async function rejectListing(id: string) {
  const supabase = await requireAnyAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "hidden" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duyet-tin");
}

export async function deleteListing(id: string) {
  const supabase = await requireAnyAdmin();

  // Xóa file ảnh khỏi Storage trước
  const { data: images } = await supabase
    .from("listing_images")
    .select("url")
    .eq("listing_id", id);

  if (images && images.length > 0) {
    const paths = images.map((img) => {
      const url = new URL(img.url);
      return decodeURIComponent(url.pathname.split("/listing-images/")[1] ?? "");
    }).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }
  }

  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duyet-tin");
  revalidatePath("/admin/quan-ly-tin");
}

export async function setUserRole(userId: string, role: "tenant" | "landlord" | "admin" | "sub_admin") {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function approveCreditRequest(requestId: string, userId: string, credits: number) {
  const supabase = await requireAdmin();
  // Atomic: cộng credit + đánh dấu approved trong 1 transaction, chặn double-approval
  const { error } = await supabase.rpc("approve_credit_request", {
    p_request_id: requestId,
    p_user_id:    userId,
    p_credits:    credits,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/yeu-cau-credit");
}

export async function rejectCreditRequest(requestId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("credit_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/yeu-cau-credit");
}

export async function blockUser(userId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles").update({ blocked: true }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  // Ban ở tầng auth để vô hiệu hoá session ngay lập tức
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, { ban_duration: "87600h" });
  } catch { /* service role chưa cấu hình — chỉ block ở tầng app */ }
  revalidatePath("/admin/users");
  revalidatePath("/admin/nhan-vien");
}

export async function unblockUser(userId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles").update({ blocked: false }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  } catch { /* service role chưa cấu hình */ }
  revalidatePath("/admin/users");
  revalidatePath("/admin/nhan-vien");
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Không có quyền thực hiện thao tác này." };
  }
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      return { error: "Thiếu SUPABASE_SERVICE_ROLE_KEY. Nếu đã set trên Vercel → cần Redeploy. Local → restart dev server." };
    }
    return { error: msg || "Không thể xóa tài khoản." };
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/nhan-vien");
  return {};
}

export async function demoteStaff(userId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles").update({ role: "tenant" }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/nhan-vien");
}

export async function refundPhoneReport(reportId: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAnyAdmin();
    const { error } = await supabase.rpc("resolve_phone_report", {
      p_report_id: reportId,
      p_action: "refunded",
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/bao-cao-sdt");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" };
  }
}

export async function rejectPhoneReport(reportId: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAnyAdmin();
    const { error } = await supabase.rpc("resolve_phone_report", {
      p_report_id: reportId,
      p_action: "rejected",
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/bao-cao-sdt");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" };
  }
}

export async function dismissListingReport(reportId: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAnyAdmin();
    const { error } = await supabase
      .from("listing_reports")
      .update({ status: "dismissed" })
      .eq("id", reportId);
    if (error) return { error: error.message };
    revalidatePath("/admin/bao-cao-tin");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" };
  }
}

export async function deleteListingFromReport(reportId: string, listingId: string): Promise<{ error?: string }> {
  try {
    const supabase = await requireAnyAdmin();

    const { data: images } = await supabase
      .from("listing_images")
      .select("url")
      .eq("listing_id", listingId);

    if (images && images.length > 0) {
      const paths = images.map((img) => {
        try {
          const url = new URL(img.url);
          return decodeURIComponent(url.pathname.split("/listing-images/")[1] ?? "");
        } catch { return ""; }
      }).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("listing-images").remove(paths);
      }
    }

    // ON DELETE CASCADE sẽ xóa listing_reports khi xóa listing
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) return { error: error.message };

    revalidatePath("/admin/bao-cao-tin");
    revalidatePath("/admin/quan-ly-tin");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" };
  }
}

export async function adjustCredits(userId: string, delta: number) {
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
    throw new Error("Số credit không hợp lệ (1–1000).");
  }
  const supabase = await requireAdmin();
  // Atomic: GREATEST(0, credits + delta) trong SQL, không cần SELECT trước
  const { error } = await supabase.rpc("adjust_credits", {
    p_user_id: userId,
    p_delta:   delta,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
