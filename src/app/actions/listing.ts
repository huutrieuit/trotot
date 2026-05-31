"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ListingStatus } from "@/types";

async function requireOwner(listingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");
  return { supabase, userId: user.id };
}

export async function setListingStatus(listingId: string, status: ListingStatus, citySlug: string) {
  const { supabase, userId } = await requireOwner(listingId);
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .eq("landlord_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/${citySlug}/dashboard`);
}

export async function deleteListing(listingId: string, citySlug: string) {
  const { supabase, userId } = await requireOwner(listingId);

  // Remove storage files first (best-effort — don't block on failure)
  const { data: images } = await supabase
    .from("listing_images")
    .select("url")
    .eq("listing_id", listingId);

  if (images && images.length > 0) {
    const paths = images.map((img) => {
      const url = new URL(img.url);
      // path after /object/public/listing-images/
      return decodeURIComponent(url.pathname.split("/listing-images/")[1] ?? "");
    }).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }
  }

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId)
    .eq("landlord_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/${citySlug}/dashboard`);
}
