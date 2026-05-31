"use server";

import { createClient } from "@/lib/supabase/server";

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
