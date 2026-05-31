import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import ApprovalCard from "./ApprovalCard";
import type { Listing } from "@/types";

const SELECT = "*, listing_images(*), profiles!landlord_id(*)";

function mapListing(row: Record<string, unknown>): Listing {
  const imgs = ((row.listing_images as Record<string, unknown>[]) ?? [])
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((i) => ({ id: i.id as string, listing_id: i.listing_id as string, url: i.url as string, order: i.order as number }));
  const p = row.profiles as Record<string, unknown> | null;
  return {
    ...(row as unknown as Listing),
    images: imgs,
    landlord: p ? {
      user_id: p.user_id as string, full_name: p.full_name as string,
      avatar_url: p.avatar_url as string | null, phone: (p.phone ?? "") as string,
      verified_phone: p.verified_phone as boolean, verified_id: p.verified_id as boolean,
    } : undefined,
  };
}

export default async function DuyetTinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data } = await supabase
    .from("listings")
    .select(SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const listings = (data ?? []).map((r) => mapListing(r as Record<string, unknown>));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ListChecks size={22} className="text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Duyệt tin đăng</h1>
          <p className="text-sm text-gray-500">
            {listings.length > 0 ? `${listings.length} tin đang chờ duyệt` : "Không có tin nào chờ duyệt"}
          </p>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ListChecks size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-600">Tất cả tin đã được xử lý</p>
          <p className="text-sm text-gray-400 mt-1">Không có tin nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ApprovalCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
