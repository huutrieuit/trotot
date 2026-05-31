"use server";

import { createClient } from "@/lib/supabase/server";

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function getOrCreateReferralCode(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles").select("referral_code").eq("user_id", user.id).single();

  if (profile?.referral_code) return profile.referral_code;

  // Generate unique code (retry if collision)
  let code = makeCode();
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase
      .from("profiles")
      .update({ referral_code: code })
      .eq("user_id", user.id);
    if (!error) return code;
    code = makeCode();
  }
  return null;
}

export async function applyReferralCode(code: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth_required" };

  const { data: profile } = await supabase
    .from("profiles").select("referred_by, referral_code").eq("user_id", user.id).single();

  if (profile?.referred_by) return { error: "Bạn đã dùng mã giới thiệu rồi." };
  if (profile?.referral_code === code.toUpperCase()) return { error: "Không thể dùng mã của chính mình." };

  const { data: referrer } = await supabase
    .from("profiles").select("user_id").eq("referral_code", code.toUpperCase()).single();

  if (!referrer) return { error: "Mã giới thiệu không hợp lệ." };

  const { error } = await supabase
    .from("profiles")
    .update({ referred_by: code.toUpperCase() })
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function getReferralStats(): Promise<{ code: string | null; count: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { code: null, count: 0 };

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("referral_code").eq("user_id", user.id).single(),
    supabase.from("referral_log").select("*", { count: "exact", head: true }).eq("referrer_id", user.id),
  ]);

  return { code: profile?.referral_code ?? null, count: count ?? 0 };
}
