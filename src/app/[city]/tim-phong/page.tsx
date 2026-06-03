"use client";

import { useState, useMemo, use, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Search, SlidersHorizontal, X, ChevronDown, LayoutGrid, Map, Bell, BellOff } from "lucide-react";
import { notFound } from "next/navigation";
import { getCityConfig } from "@/config/cities";
import { SearchFilters, SortOption, Listing } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import ListingCard from "@/components/listings/ListingCard";
import FilterSidebar from "@/components/listings/FilterSidebar";
import { saveSearch } from "@/app/actions/search";

const ListingsMap = dynamic(() => import("@/components/map/ListingsMap"), { ssr: false });

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "popular", label: "Phổ biến nhất" },
];

interface Props {
  params: Promise<{ city: string }>;
}

export default function TimPhongPage({ params }: Props) {
  const { city: citySlug } = use(params);
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const [mounted, setMounted] = useState(false);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SortOption>("newest");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [watchSaving, setWatchSaving] = useState(false);
  const [watchDone, setWatchDone] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const hasActiveFilters = !!(filters.district || filters.room_type || filters.price_min != null || filters.price_max != null || query);

  const handleSaveSearch = async () => {
    setWatchSaving(true);
    const parts: string[] = [];
    if (query) parts.push(query);
    if (filters.district) parts.push(filters.district);
    if (filters.room_type) parts.push({ phong_tro: "Phòng trọ", chung_cu: "Căn hộ", nha_nguyen_can: "Nhà nguyên căn", homestay: "Homestay" }[filters.room_type] ?? filters.room_type);
    if (filters.price_max) parts.push(`Dưới ${filters.price_max / 1e6}tr`);
    const label = parts.join(" · ") || "Tất cả phòng";
    await saveSearch({ city: citySlug, label, district: filters.district, room_type: filters.room_type, price_min: filters.price_min, price_max: filters.price_max });
    setWatchSaving(false);
    setWatchDone(true);
    setTimeout(() => setWatchDone(false), 3000);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("listings")
      .select("*, listing_images(*), profiles!landlord_id(*)")
      .eq("city", citySlug)
      .eq("status", "active")
      .then(({ data }) => {
        if (data) setAllListings(data as unknown as Listing[]);
      });
  }, [citySlug]);

  const results = useMemo(() => {
    let list = [...allListings];

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (l) => l.title.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || l.district.toLowerCase().includes(q)
      );
    }

    if (filters.district) list = list.filter((l) => l.district === filters.district);
    if (filters.room_type) list = list.filter((l) => l.room_type === filters.room_type);
    if (filters.price_min != null) list = list.filter((l) => l.price >= filters.price_min!);
    if (filters.price_max != null) list = list.filter((l) => l.price <= filters.price_max!);
    if (filters.gender_preference)
      list = list.filter((l) => l.gender_preference === "all" || l.gender_preference === filters.gender_preference);
    if (filters.amenities) {
      Object.entries(filters.amenities).forEach(([key, val]) => {
        if (val) list = list.filter((l) => l.amenities[key as keyof typeof l.amenities]);
      });
    }

    switch (sort) {
      case "price_asc": list.sort((a, b) => a.price - b.price); break;
      case "price_desc": list.sort((a, b) => b.price - a.price); break;
      case "popular": list.sort((a, b) => b.view_count - a.view_count); break;
      default: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [query, filters, sort, citySlug, allListings]);

  const activeFilterCount = [
    filters.district,
    filters.room_type,
    filters.price_min != null || filters.price_max != null ? 1 : null,
    filters.gender_preference,
    ...Object.values(filters.amenities ?? {}).filter(Boolean),
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Tìm theo địa chỉ, khu vực tại ${city.shortName}...`}
            className="w-full text-sm outline-none text-gray-700 placeholder-gray-400"
          />
          {query && <button onClick={() => setQuery("")} className="text-gray-400"><X size={16} /></button>}
        </div>

        {/* DEBUG: always visible, no md:hidden */}
        <button
          onClick={() => {
            console.log("[DEBUG] Lọc clicked, filterSheetOpen:", filterSheetOpen);
            setFilterSheetOpen(true);
            console.log("[DEBUG] setFilterSheetOpen(true) called");
          }}
          className="relative flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700"
        >
          <SlidersHorizontal size={16} />
          Lọc
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="font-semibold text-gray-900 mb-4">Bộ lọc</p>
            <FilterSidebar filters={filters} onChange={setFilters} districts={city.districts} />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{results.length}</span> phòng tại {city.shortName}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleSaveSearch}
                  disabled={watchSaving || watchDone}
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors",
                    watchDone
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {watchDone ? <BellOff size={11} /> : <Bell size={11} />}
                  {watchDone ? "Đã theo dõi" : "Theo dõi"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                  <LayoutGrid size={13} /> Danh sách
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    viewMode === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                >
                  <Map size={13} /> Bản đồ
                </button>
              </div>

              {viewMode === "list" && (
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-1.5 text-sm text-gray-700 cursor-pointer outline-none"
                  >
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.district && <FilterChip label={filters.district} onRemove={() => setFilters({ ...filters, district: undefined })} />}
              {filters.room_type && (
                <FilterChip
                  label={{ phong_tro: "Phòng trọ", chung_cu: "Căn hộ", nha_nguyen_can: "Nhà nguyên căn", homestay: "Homestay" }[filters.room_type]}
                  onRemove={() => setFilters({ ...filters, room_type: undefined })}
                />
              )}
              {(filters.price_min != null || filters.price_max != null) && (
                <FilterChip
                  label={`${filters.price_min ? filters.price_min / 1e6 + "tr" : "0"} – ${filters.price_max ? filters.price_max / 1e6 + "tr" : "∞"}`}
                  onRemove={() => setFilters({ ...filters, price_min: undefined, price_max: undefined })}
                />
              )}
              {filters.gender_preference && (
                <FilterChip label={filters.gender_preference === "male" ? "Nam" : "Nữ"} onRemove={() => setFilters({ ...filters, gender_preference: undefined })} />
              )}
              <button onClick={() => setFilters({})} className="text-xs text-blue-600 underline">Xóa tất cả</button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Không tìm thấy phòng phù hợp</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : viewMode === "map" ? (
            <ListingsMap
              listings={results.map((l) => ({ id: l.id, title: l.title, price: l.price, lat: l.lat, lng: l.lng, city: citySlug }))}
              cityCenter={city.center}
              zoom={city.zoom}
              className="h-[calc(100vh-220px)] min-h-[400px]"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} citySlug={citySlug} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DEBUG */}
      <div style={{ position: "fixed", top: 8, right: 8, background: "red", color: "white", padding: "4px 8px", fontSize: 12, zIndex: 99999, borderRadius: 4, pointerEvents: "none" }}>
        hydrated={String(mounted)} | filterOpen={String(filterSheetOpen)}
      </div>

      {/* Mobile filter bottom sheet – rendered via portal to avoid stacking-context issues */}
      {filterSheetOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => setFilterSheetOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-900">Bộ lọc</span>
              <button onClick={() => setFilterSheetOpen(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterSidebar filters={filters} onChange={setFilters} districts={city.districts} />
            </div>
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => { setFilters({}); setFilterSheetOpen(false); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700"
              >
                Xóa lọc
              </button>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white"
              >
                Xem {results.length} phòng
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900"><X size={12} /></button>
    </span>
  );
}
