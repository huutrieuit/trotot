import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types";

const SELECT = "*, listing_images(*), profiles!landlord_id(*)";

function mapListing(row: Record<string, unknown>): Listing {
  const rawImages = (row.listing_images as Record<string, unknown>[]) ?? [];
  const images = rawImages
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((img) => ({
      id: img.id as string,
      listing_id: img.listing_id as string,
      url: img.url as string,
      order: img.order as number,
    }));

  const p = row.profiles as Record<string, unknown> | null;
  const landlord = p
    ? {
        user_id: p.user_id as string,
        full_name: p.full_name as string,
        avatar_url: p.avatar_url as string | null,
        phone: (p.phone ?? "") as string,
        verified_phone: p.verified_phone as boolean,
        verified_id: p.verified_id as boolean,
      }
    : undefined;

  return { ...(row as unknown as Listing), images, landlord };
}

export async function getListingsByCity(city: string, limit = 6): Promise<Listing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("city", city)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapListing);
}

export async function getListingById(id: string, city: string): Promise<Listing | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("id", id)
    .eq("city", city)
    .single();

  return data ? mapListing(data as Record<string, unknown>) : null;
}

export async function getMyListings(): Promise<Listing[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapListing);
}

export async function getSiteStats(city: string): Promise<{ totalListings: number; totalUsers: number }> {
  const supabase = await createClient();
  const [{ count: totalListings }, { count: totalUsers }] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("city", city).eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);
  return { totalListings: totalListings ?? 0, totalUsers: totalUsers ?? 0 };
}

export async function getRelatedListings(
  city: string,
  district: string,
  excludeId: string,
  limit = 3
): Promise<Listing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("city", city)
    .eq("district", district)
    .eq("status", "active")
    .neq("id", excludeId)
    .limit(limit);

  return (data ?? []).map(mapListing);
}
