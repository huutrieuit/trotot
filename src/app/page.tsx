import Link from "next/link";
import { MapPin, ChevronRight, ArrowRight } from "lucide-react";
import { getAllCities } from "@/config/cities";

export default function HomePage() {
  const cities = getAllCities();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          Trọ<span className="text-orange-400">Tốt</span>
        </h1>
        <p className="text-blue-200 text-sm">Tìm phòng trọ lý tưởng · Nhanh · An toàn · Tin cậy</p>
      </div>

      {/* City picker */}
      <div className="w-full max-w-sm space-y-3">
        <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider text-center mb-4">
          Chọn thành phố
        </p>

        {cities.map((city) => (
          city.available ? (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{city.name}</p>
                  <p className="text-xs text-gray-400">{city.districts.length} khu vực · Đang hoạt động</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>
          ) : (
            <div
              key={city.slug}
              className="flex items-center justify-between bg-white/10 border border-white/20 rounded-2xl px-5 py-4 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-white/50" />
                </div>
                <div>
                  <p className="font-bold text-white">{city.name}</p>
                  <p className="text-xs text-blue-300">{city.districts.length} khu vực · Sắp ra mắt</p>
                </div>
              </div>
              <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">Sắp ra mắt</span>
            </div>
          )
        ))}
      </div>

      <p className="mt-10 text-blue-300/60 text-xs text-center">
        © 2026 TrọTốt · Mở rộng thêm thành phố mới sắp tới
      </p>
    </div>
  );
}
