import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhoneOff } from "lucide-react";
import PhoneReportCard from "./PhoneReportCard";

export default async function PhoneReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "sub_admin") redirect("/");

  const { data: reports } = await supabase
    .from("credit_reports")
    .select("id, reason, status, created_at, user_id, listing_id, listings(id, title, address, city, contact_phone)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((reports ?? []).map((r) => r.user_id))];
  const { data: reporters } = userIds.length > 0
    ? await supabase.from("profiles").select("user_id, email, full_name").in("user_id", userIds)
    : { data: [] };

  const reporterMap = Object.fromEntries((reporters ?? []).map((p) => [p.user_id, p]));
  const rows = reports ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <PhoneOff size={22} className="text-red-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Báo cáo số điện thoại</h1>
          <p className="text-sm text-gray-500">
            {rows.length > 0 ? `${rows.length} báo cáo đang chờ xử lý` : "Không có báo cáo nào đang chờ"}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <PhoneOff size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Không có báo cáo nào đang chờ xử lý</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((report) => {
            const listing = Array.isArray(report.listings) ? report.listings[0] : report.listings;
            const reporter = reporterMap[report.user_id];
            if (!listing) return null;
            return (
              <PhoneReportCard
                key={report.id}
                id={report.id}
                reporterEmail={reporter?.email ?? "—"}
                reporterName={reporter?.full_name ?? ""}
                listingId={listing.id}
                listingTitle={listing.title}
                listingAddress={listing.address}
                listingPhone={listing.contact_phone}
                citySlug={listing.city}
                createdAt={report.created_at}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
