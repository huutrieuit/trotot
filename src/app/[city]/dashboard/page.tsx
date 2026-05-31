import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusSquare, Eye, MessageCircle, Clock, CheckCircle2, XCircle, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCityConfig } from "@/config/cities";
import { getMyListings } from "@/lib/db/listings";
import { formatPrice } from "@/lib/utils";
import { notFound } from "next/navigation";
import ListingActions from "./ListingActions";

interface Props {
  params: Promise<{ city: string }>;
}

const STATUS_CONFIG = {
  pending:  { label: "Chờ duyệt",  icon: Clock,          className: "bg-amber-100 text-amber-700" },
  active:   { label: "Đang hiển thị", icon: CheckCircle2, className: "bg-green-100 text-green-700" },
  rented:   { label: "Đã cho thuê", icon: EyeOff,         className: "bg-gray-100 text-gray-600" },
  hidden:   { label: "Đã ẩn",       icon: XCircle,         className: "bg-red-100 text-red-600" },
} as const;

export default async function DashboardPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/dang-nhap?redirect=/${citySlug}/dashboard`);

  const listings = await getMyListings();

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "active").length,
    pending: listings.filter((l) => l.status === "pending").length,
    views: listings.reduce((s, l) => s + l.view_count, 0),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý tin đăng của bạn</p>
        </div>
        <Link href={`/${citySlug}/dang-tin`}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <PlusSquare size={16} />
          Đăng tin mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Tổng tin", value: stats.total, color: "text-blue-600" },
          { label: "Đang hiển thị", value: stats.active, color: "text-green-600" },
          { label: "Chờ duyệt", value: stats.pending, color: "text-amber-600" },
          { label: "Lượt xem", value: stats.views, color: "text-purple-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Listing list */}
      {listings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <PlusSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700 mb-1">Bạn chưa có tin đăng nào</p>
          <p className="text-sm text-gray-400 mb-4">Đăng tin miễn phí ngay để tiếp cận người thuê</p>
          <Link href={`/${citySlug}/dang-tin`}
            className="inline-block bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Đăng tin đầu tiên
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const status = STATUS_CONFIG[listing.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status.icon;
            return (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Card body */}
                <div className="p-4 flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Chưa có ảnh</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">{listing.title}</p>
                      <span className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                        <StatusIcon size={11} />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-blue-600 font-bold text-sm mb-2">
                      {formatPrice(listing.price)}<span className="text-gray-400 font-normal text-xs">/tháng</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Eye size={12} />{listing.view_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{listing.contact_count}</span>
                      <span>{new Date(listing.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {/* Action strip */}
                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/50">
                  <ListingActions
                    listingId={listing.id}
                    status={listing.status}
                    citySlug={citySlug}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
