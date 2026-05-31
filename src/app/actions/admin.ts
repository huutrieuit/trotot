"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function approveListing(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duyet-tin");
}

export async function rejectListing(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: "hidden" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/duyet-tin");
}

export async function setUserRole(userId: string, role: "tenant" | "landlord" | "admin") {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function adjustCredits(userId: string, delta: number) {
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) {
    throw new Error("Số credit không hợp lệ (1–1000).");
  }
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Không tìm thấy user.");
  const next = Math.max(0, data.credits + delta);
  const { error: upErr } = await supabase
    .from("profiles")
    .update({ credits: next })
    .eq("user_id", userId);
  if (upErr) throw new Error(upErr.message);
  revalidatePath("/admin/users");
}
