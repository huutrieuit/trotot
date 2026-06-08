"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RegisterResult =
  | { type: "email_sent" }
  | { type: "instant" }
  | { type: "already_registered" }
  | { type: "error"; message: string };

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  role: "tenant" | "landlord"
): Promise<RegisterResult> {
  const supabase = await createClient();

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "require_email_confirm")
    .single();

  const requireEmailConfirm = setting?.value !== "false";

  if (requireEmailConfirm) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return { type: "already_registered" };
      }
      if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        return { type: "error", message: "Hệ thống đang gửi quá nhiều email. Vui lòng thử lại sau vài phút." };
      }
      return { type: "error", message: error.message };
    }
    if (!data.user || data.user.identities?.length === 0) {
      return { type: "already_registered" };
    }
    return { type: "email_sent" };
  }

  // Tắt confirm email → tạo user qua admin API, email được xác nhận ngay
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName, role },
      email_confirm: true,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate")) {
        return { type: "already_registered" };
      }
      return { type: "error", message: error.message };
    }
    if (!data.user) return { type: "error", message: "Không thể tạo tài khoản." };
    return { type: "instant" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SUPABASE_SERVICE_ROLE_KEY_MISSING") {
      // Fallback: gửi email bình thường nếu service role chưa cấu hình
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) return { type: "error", message: error.message };
      if (!data.user || data.user.identities?.length === 0) return { type: "already_registered" };
      return { type: "email_sent" };
    }
    return { type: "error", message: msg || "Không thể tạo tài khoản." };
  }
}
