"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitReview(listingId: string, phoneActive: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth_required" };

  const { error } = await supabase.from("listing_reviews").upsert(
    { user_id: user.id, listing_id: listingId, phone_active: phoneActive },
    { onConflict: "user_id,listing_id" }
  );

  if (error) return { error: error.message };
  return {};
}
