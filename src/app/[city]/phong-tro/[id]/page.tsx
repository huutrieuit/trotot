import { notFound } from "next/navigation";
import { getCityConfig } from "@/config/cities";
import { getListingById, getRelatedListings } from "@/lib/db/listings";
import { createClient } from "@/lib/supabase/server";
import RoomDetailClient from "./RoomDetailClient";

interface Props {
  params: Promise<{ city: string; id: string }>;
}

export default async function RoomDetailPage({ params }: Props) {
  const { city: citySlug, id } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const [listing, supabase] = await Promise.all([
    getListingById(id, citySlug),
    createClient(),
  ]);
  if (!listing) notFound();

  const [related, { data: { user } }] = await Promise.all([
    getRelatedListings(citySlug, listing.district, id),
    supabase.auth.getUser(),
  ]);

  const isVerified = listing.source === "admin" || listing.landlord?.verified_phone === true;

  let isSaved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .single();
    isSaved = !!data;
  }

  return (
    <RoomDetailClient
      listing={listing}
      related={related}
      citySlug={citySlug}
      currentUserId={user?.id ?? null}
      isSaved={isSaved}
      isVerified={isVerified}
    />
  );
}
