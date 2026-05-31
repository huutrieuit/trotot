import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCityConfig } from "@/config/cities";
import AccountClient from "./AccountClient";
import { getOrCreateReferralCode, getReferralStats } from "@/app/actions/referral";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function TaiKhoanPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/dang-nhap?redirect=/${citySlug}/tai-khoan`);

  const [{ data: profile }, { data: savedRows }, { data: viewedRows }, referralCode, referralStats] = await Promise.all([
    supabase.from("profiles").select("credits, role").eq("user_id", user.id).single(),
    supabase
      .from("saved_listings")
      .select("listing_id, created_at, listings(id, title, price, city, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("phone_reveals")
      .select("listing_id, created_at, listings(id, title, price, city, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getOrCreateReferralCode(),
    getReferralStats(),
  ]);

  const savedListings = (savedRows ?? []).map((r) => {
    const l = r.listings as Record<string, unknown> | null;
    return {
      listingId: r.listing_id as string,
      title: (l?.title as string) ?? "",
      price: (l?.price as number) ?? 0,
      city: (l?.city as string) ?? citySlug,
      address: (l?.address as string) ?? "",
    };
  });

  const { data: profileFull } = await supabase
    .from("profiles").select("referred_by").eq("user_id", user.id).single();
  const hasReferredBy = !!profileFull?.referred_by;

  const viewedListings = (viewedRows ?? []).map((r) => {
    const l = r.listings as Record<string, unknown> | null;
    return {
      listingId: r.listing_id as string,
      title: (l?.title as string) ?? "",
      price: (l?.price as number) ?? 0,
      city: (l?.city as string) ?? citySlug,
      address: (l?.address as string) ?? "",
    };
  });

  return (
    <AccountClient
      citySlug={citySlug}
      userId={user.id}
      email={user.email ?? ""}
      fullName={user.user_metadata?.full_name ?? ""}
      avatarUrl={user.user_metadata?.avatar_url ?? null}
      provider={user.app_metadata?.provider ?? "email"}
      credits={profile?.credits ?? null}
      role={profile?.role ?? "tenant"}
      savedListings={savedListings}
      viewedListings={viewedListings}
      referralCode={referralCode}
      referralCount={referralStats.count}
      hasReferredBy={hasReferredBy}
    />
  );
}
