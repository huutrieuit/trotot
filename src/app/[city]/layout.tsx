import { notFound } from "next/navigation";
import { getCityConfig } from "@/config/cities";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

export default async function CityLayout({ children, params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let credits: number | null = null;
  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits, role")
      .eq("user_id", user.id)
      .single();
    credits = profile?.credits ?? null;
    role = profile?.role ?? null;
  }

  const authUser = user
    ? {
        name: user.user_metadata?.full_name ?? user.email ?? "Tài khoản",
        avatar_url: user.user_metadata?.avatar_url ?? null,
        credits,
        role,
      }
    : null;

  return (
    <>
      <Header citySlug={city.slug} cityName={city.name} user={authUser} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav citySlug={city.slug} />
    </>
  );
}
