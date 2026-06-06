import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutList, MapPin, Clock } from "lucide-react";
import DeleteButton from "./DeleteButton";
import { formatPrice } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:  { label: "Đang hiển thị", className: "bg-green-100 text-green-700" },
  pending: { label: "Chờ duyệt",     className: "bg-amber-100 text-amber-700" },
  hidden:  { label: "Bị ẩn",         className: "bg-gray-100 text-gray-500" },
  rented:  { label: "Đã cho thuê",   className: "bg-blue-100 text-blue-700" },
};

export default async function QuanLyTinPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "sub_admin") redirect("/");

  const { status } = await searchParams;
  const statusFilter = status && ["active", "pending", "hidden", "rented"].includes(status) ? status : null;

  let query = supabase
    .from("listings")
    .select("id, title, city, address, price, status, created_at, profiles!landlord_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data } = await query;
  const listings = data ?? [];

  const FILTERS = [
    { value: null, label: "Tất cả" },
    { value: "active", label: "Đang hiển thị" },
    { value: "pending", label: "Chờ duyệt" },
    { value: "hidden", label: "Bị ẩn" },
    { value: "rented", label: "Đã cho thuê" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <LayoutList size={22} className="text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý tin đăng</h1>
          <p className="text-sm text-gray-500">{listings.length} tin{statusFilter ? ` (${STATUS_LABEL[statusFilter]?.label})` : ""}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map(({ value, label }) => {
          const href = value ? `/admin/quan-ly-tin?status=${value}` : "/admin/quan-ly-tin";
          const active = statusFilter === value || (!statusFilter && value === null);
          return (
            <a
              key={label}
              href={href}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {listings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <LayoutList size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Không có tin nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiêu đề</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chủ nhà</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày đăng</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((listing) => {
                  const statusCfg = STATUS_LABEL[listing.status] ?? STATUS_LABEL.hidden;
                  const rawProfile = listing.profiles as { full_name: string }[] | { full_name: string } | null;
                  const landlord = Array.isArray(rawProfile) ? (rawProfile[0] ?? null) : rawProfile;
                  return (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                        <p className="flex items-center gap-0.5 text-[11px] text-gray-400 mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span className="line-clamp-1">{listing.address}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-semibold text-xs whitespace-nowrap">
                        {formatPrice(listing.price)}/th
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {landlord?.full_name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(listing.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DeleteButton listingId={listing.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
