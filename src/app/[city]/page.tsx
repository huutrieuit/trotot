import Link from "next/link";
import { Search, MapPin, ShieldCheck, Zap, Star, ChevronRight, Home, Building2, House, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { getCityConfig } from "@/config/cities";
import ListingCard from "@/components/listings/ListingCard";
import PageTracker from "@/components/analytics/PageTracker";
import { getListingsByCity, getSiteStats } from "@/lib/db/listings";

interface Props {
  params: Promise<{ city: string }>;
}

const ROOM_TYPES = [
  { type: "phong_tro", label: "Phòng trọ", icon: Home, color: "bg-blue-50 text-blue-600 border-blue-100", desc: "Giá từ 1,5 triệu" },
  { type: "chung_cu", label: "Căn hộ mini", icon: Building2, color: "bg-purple-50 text-purple-600 border-purple-100", desc: "Đủ tiện nghi" },
  { type: "nha_nguyen_can", label: "Nhà nguyên căn", icon: House, color: "bg-orange-50 text-orange-600 border-orange-100", desc: "Rộng rãi tự do" },
];

const DISTRICT_META: Record<string, { emoji: string; bg: string; border: string; tag: string }> = {
  "Phường Hải Châu":     { emoji: "🌊", bg: "bg-sky-50",    border: "border-sky-100",    tag: "Trung tâm" },
  "Phường Hòa Cường":    { emoji: "🏠", bg: "bg-rose-50",   border: "border-rose-100",   tag: "Dân sinh" },
  "Phường Thanh Khê":    { emoji: "🏙️", bg: "bg-indigo-50", border: "border-indigo-100", tag: "Đông dân" },
  "Phường An Khê":       { emoji: "🌳", bg: "bg-green-50",  border: "border-green-100",  tag: "Xanh mát" },
  "Phường An Hải":       { emoji: "🌅", bg: "bg-orange-50", border: "border-orange-100", tag: "Ven biển" },
  "Phường Sơn Trà":      { emoji: "🦅", bg: "bg-teal-50",   border: "border-teal-100",   tag: "Gần biển" },
  "Phường Ngũ Hành Sơn": { emoji: "⛰️", bg: "bg-stone-50",  border: "border-stone-100",  tag: "Yên tĩnh" },
  "Phường Hòa Khánh":    { emoji: "🏭", bg: "bg-gray-50",   border: "border-gray-100",   tag: "Gần KCN" },
  "Phường Liên Chiểu":   { emoji: "🎓", bg: "bg-blue-50",   border: "border-blue-100",   tag: "Gần ĐH" },
  "Phường Cẩm Lệ":       { emoji: "🏘️", bg: "bg-amber-50",  border: "border-amber-100",  tag: "Giá tốt" },
  "Phường Hội An":       { emoji: "🏮", bg: "bg-yellow-50", border: "border-yellow-100", tag: "Di sản" },
  "Phường Điện Bàn":     { emoji: "🌾", bg: "bg-lime-50",   border: "border-lime-100",   tag: "Ngoại ô" },
};

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const base = `/${citySlug}`;
  const [listings, { totalListings, totalUsers }] = await Promise.all([
    getListingsByCity(citySlug, 6),
    getSiteStats(citySlug),
  ]);

  return (
    <div>
      <PageTracker path={`/${citySlug}`} />
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-[#0e2a6e] via-blue-700 to-blue-600 text-white overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-blue-500/20 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full bg-blue-900/30 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div aria-hidden="true" className="absolute top-1/2 left-1/3 w-[220px] h-[220px] rounded-full bg-orange-500/10 blur-2xl -translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-20">
          {/* Live badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-sm px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
              {totalListings > 0 ? (
                <>
                  <span className="text-green-300 font-semibold">{totalListings} phòng</span>
                  <span className="text-blue-200"> đang cho thuê tại {city.shortName}</span>
                </>
              ) : (
                <span className="text-blue-200">Nền tảng thuê trọ đang ra mắt tại {city.shortName}</span>
              )}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-3 leading-tight tracking-tight">
            Tìm phòng trọ lý tưởng<br />
            <span className="text-orange-400">tại {city.name}</span>
          </h1>
          <p className="text-blue-100/90 text-center text-sm md:text-base mb-8 max-w-lg mx-auto">
            {city.description}
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto ring-4 ring-white/10">
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-gray-50 rounded-xl">
              <MapPin size={18} className="text-orange-400 shrink-0" />
              <input
                type="text"
                placeholder={`Khu vực, địa chỉ tại ${city.shortName}...`}
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
            </div>
            <Link
              href={`${base}/tim-phong`}
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-orange-600/20"
            >
              <Search size={18} />
              Tìm ngay
            </Link>
          </div>

          {/* Quick tags */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar pb-1 flex-nowrap sm:justify-center">
            <span className="text-blue-300/70 text-xs shrink-0 hidden sm:inline">Phổ biến:</span>
            {["Dưới 2 triệu", "Gần ĐH Duy Tân", "Có điều hòa", "Liên Chiểu", "Hải Châu"].map((tag) => (
              <Link
                key={tag}
                href={`${base}/tim-phong?q=${encodeURIComponent(tag)}`}
                className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { value: totalListings > 0 ? `${totalListings}+` : "--", label: "Tin đang hiển thị", color: "text-blue-600" },
            { value: totalUsers > 0 ? `${totalUsers}+` : "--",       label: "Người dùng",         color: "text-violet-600" },
            { value: "Miễn phí",                                      label: "Đăng tin chủ nhà",   color: "text-green-600" },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center px-2">
              <div className={`text-2xl md:text-3xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Loại phòng ── */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {ROOM_TYPES.map(({ type, label, icon: Icon, color, desc }) => (
            <Link
              key={type}
              href={`${base}/tim-phong?type=${type}`}
              className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:shadow-sm hover:-translate-y-0.5 ${color}`}
            >
              <Icon size={16} className="shrink-0" />
              <div>
                <div>{label}</div>
                <div className="text-[10px] font-normal opacity-60 -mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Khu vực ── */}
      <section className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Khu vực tại {city.shortName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Chọn khu vực bạn muốn tìm phòng</p>
          </div>
          <Link href={`${base}/tim-phong`} className="text-sm text-blue-600 font-medium flex items-center gap-0.5 hover:underline">
            Tất cả <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {city.districts.slice(0, 6).map((district) => {
            const meta = DISTRICT_META[district] ?? { emoji: "📍", bg: "bg-gray-50", border: "border-gray-100", tag: "Xem phòng" };
            return (
              <Link
                key={district}
                href={`${base}/tim-phong?district=${encodeURIComponent(district)}`}
                className={`group flex items-center gap-3 ${meta.bg} ${meta.border} border rounded-xl p-3 hover:shadow-md transition-all hover:-translate-y-0.5`}
              >
                <span className="text-2xl shrink-0">{meta.emoji}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{district}</div>
                  <div className="text-xs text-blue-500 flex items-center gap-0.5 mt-0.5">
                    {meta.tag}
                    <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Phòng mới đăng ── */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Phòng mới đăng tại {city.shortName}</h2>
            {listings.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Cập nhật mới nhất từ chủ nhà</p>
            )}
          </div>
          <Link href={`${base}/tim-phong`} className="text-sm text-blue-600 font-medium flex items-center gap-0.5 hover:underline">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>

        {listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} citySlug={citySlug} />
              ))}
            </div>
            <div className="mt-5 text-center">
              <Link
                href={`${base}/tim-phong`}
                className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Xem thêm phòng tại {city.shortName}
                <ChevronRight size={15} />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Home size={26} className="text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">Chưa có tin đăng nào</p>
            <p className="text-sm text-gray-500 mt-1 mb-5 max-w-xs mx-auto">
              Bạn có phòng trọ muốn cho thuê tại {city.shortName}? Hãy đăng tin miễn phí ngay hôm nay!
            </p>
            <Link
              href={`${base}/dang-tin`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Đăng tin đầu tiên – Miễn phí
            </Link>
          </div>
        )}
      </section>

      {/* ── Cách hoạt động ── */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg font-extrabold text-gray-900">TrọTốt hoạt động như thế nào?</h2>
            <p className="text-sm text-gray-500 mt-1.5">Đơn giản – nhanh chóng – an toàn</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: "1", icon: Search, color: "bg-blue-600 shadow-blue-200",
                title: "Tìm kiếm",
                desc: "Lọc theo khu vực, giá, tiện ích. Xem ảnh thật và vị trí trên bản đồ.",
              },
              {
                step: "2", icon: Zap, color: "bg-orange-500 shadow-orange-200",
                title: "Liên hệ nhanh",
                desc: "Gửi yêu cầu xem phòng hoặc nhắn tin qua Zalo trực tiếp với chủ nhà.",
              },
              {
                step: "3", icon: ShieldCheck, color: "bg-green-600 shadow-green-200",
                title: "An toàn & Tin cậy",
                desc: "Chủ nhà xác minh SĐT, tin đăng kiểm duyệt – không lo lừa đảo.",
              },
            ].map(({ step, icon: Icon, color, title, desc }) => (
              <div key={step} className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span aria-hidden="true" className="absolute top-4 right-4 text-5xl font-black text-gray-100 leading-none select-none">
                  {step}
                </span>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Tại sao chọn TrọTốt?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ShieldCheck, label: "Tin đăng\nxác thực",       bg: "bg-green-50",  border: "border-green-100",  color: "text-green-600" },
            { icon: MapPin,      label: "Vị trí\nchính xác",        bg: "bg-blue-50",   border: "border-blue-100",   color: "text-blue-600" },
            { icon: Star,        label: "Đánh giá\ntừ người thuê",  bg: "bg-amber-50",  border: "border-amber-100",  color: "text-amber-500" },
            { icon: TrendingUp,  label: "Kết nối\ntức thì",         bg: "bg-purple-50", border: "border-purple-100", color: "text-purple-600" },
          ].map(({ icon: Icon, label, bg, border, color }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center hover:shadow-sm transition-shadow`}>
              <Icon size={26} className={`${color} mx-auto mb-2`} />
              <p className="text-xs text-gray-600 whitespace-pre-line font-semibold leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA chủ nhà ── */}
      <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12 px-4 overflow-hidden">
        <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 bg-orange-400/30 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-48 h-48 bg-orange-700/20 rounded-full blur-2xl -translate-x-1/4 translate-y-1/3 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/15 text-orange-100 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <Home size={11} />
            Dành cho chủ nhà
          </div>
          <h2 className="text-2xl font-extrabold mb-2 leading-tight">
            Bạn có phòng cho thuê<br />tại {city.shortName}?
          </h2>
          <p className="text-orange-100 text-sm mb-6">
            Đăng tin miễn phí, tiếp cận hàng trăm người thuê thật.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`${base}/dang-tin`}
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
            >
              Đăng tin ngay – Miễn phí
            </Link>
            <Link
              href="/gia-ca"
              className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
            >
              Xem bảng giá gói
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div>
              <span className="text-xl font-extrabold text-white">Trọ<span className="text-orange-400">Tốt</span></span>
              <p className="text-xs mt-1 text-gray-500">Tìm phòng trọ lý tưởng · {city.name}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/ve-chung-toi" className="hover:text-white transition-colors">Về chúng tôi</Link>
              <Link href="/chinh-sach"   className="hover:text-white transition-colors">Chính sách</Link>
              <Link href="/lien-he"      className="hover:text-white transition-colors">Liên hệ</Link>
            </div>
          </div>
          <p className="text-xs text-center border-t border-gray-800 pt-4">
            © 2026 TrọTốt. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
