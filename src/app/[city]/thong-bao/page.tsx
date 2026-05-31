import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronLeft, Search, Trash2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCityConfig } from "@/config/cities";
import { formatPrice, timeAgo } from "@/lib/utils";
import { deleteSavedSearch } from "@/app/actions/search";

interface Props {
  params: Promise<{ city: string }>;
}

export default async function ThongBaoPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/dang-nhap?redirect=/${citySlug}/thong-bao`);

  const { data: searches } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .eq("city", citySlug)
    .order("created_at", { ascending: false });

  const savedSearches = searches ?? [];

  // Với mỗi saved search, fetch listing mới trong 7 ngày khớp filter
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const searchesWithListings = await Promise.all(
    savedSearches.map(async (s) => {
      let query = supabase
        .from("listings")
        .select("id, title, price, address, created_at, listing_images(url)")
        .eq("city", citySlug)
        .eq("status", "active")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(3);

      if (s.district)   query = query.eq("district", s.district);
      if (s.room_type)  query = query.eq("room_type", s.room_type);
      if (s.price_min)  query = query.gte("price", s.price_min);
      if (s.price_max)  query = query.lte("price", s.price_max);

      const { data } = await query;
      return { search: s, listings: data ?? [] };
    })
  );

  const totalNew = searchesWithListings.reduce((acc, s) => acc + s.listings.length, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${citySlug}`} className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-sm text-gray-500">
            {totalNew > 0 ? `${totalNew} phòng mới phù hợp trong 7 ngày qua` : "Cập nhật mới nhất cho bạn"}
          </p>
        </div>
      </div>

      {savedSearches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bell size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500 mb-1">Chưa có tìm kiếm nào được theo dõi</p>
          <p className="text-sm text-gray-400 max-w-xs mb-6">
            Vào trang tìm phòng, lọc theo khu vực/giá bạn muốn, rồi bấm "Theo dõi" để nhận thông báo.
          </p>
          <Link href={`/${citySlug}/tim-phong`}
            className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors">
            <Search size={15} /> Tìm phòng ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searchesWithListings.map(({ search, listings }) => (
            <div key={search.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-blue-500" />
                  <span className="text-sm font-semibold text-gray-800">{search.label}</span>
                  {listings.length > 0 && (
                    <span className="text-[11px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      {listings.length} mới
                    </span>
                  )}
                </div>
                <form action={async () => { "use server"; await deleteSavedSearch(search.id); }}>
                  <button type="submit" className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>

              {/* Listings */}
              {listings.length === 0 ? (
                <div className="px-4 py-5 text-center text-sm text-gray-400">
                  Không có phòng mới nào khớp trong 7 ngày qua.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {listings.map((l) => {
                    const img = (l.listing_images as { url: string }[])?.[0]?.url;
                    return (
                      <Link key={l.id} href={`/${citySlug}/phong-tro/${l.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{l.title}</p>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">{formatPrice(l.price)}/tháng</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {timeAgo(l.created_at)}
                          </p>
                        </div>
                        <span className="text-xs text-blue-500 shrink-0">→</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* View all */}
              <div className="px-4 py-2.5 border-t border-gray-50">
                <Link
                  href={`/${citySlug}/tim-phong${search.district ? `?district=${encodeURIComponent(search.district)}` : ""}${search.room_type ? `&type=${search.room_type}` : ""}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Xem tất cả phòng khớp →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
