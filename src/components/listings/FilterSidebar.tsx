"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SearchFilters, RoomType, Amenities } from "@/types";
import { cn } from "@/lib/utils";

const DISTRICT_PREVIEW = 6;

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
  districts: string[];
  className?: string;
}

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "phong_tro", label: "Phòng trọ" },
  { value: "chung_cu", label: "Căn hộ" },
  { value: "nha_nguyen_can", label: "Nhà nguyên căn" },
  { value: "homestay", label: "Homestay" },
];

const PRICE_RANGES = [
  { label: "Dưới 2 triệu", min: 0, max: 2_000_000 },
  { label: "2 – 4 triệu", min: 2_000_000, max: 4_000_000 },
  { label: "4 – 6 triệu", min: 4_000_000, max: 6_000_000 },
  { label: "Trên 6 triệu", min: 6_000_000, max: undefined },
];

const AMENITIES: { key: keyof Amenities; label: string }[] = [
  { key: "wifi", label: "Wifi" },
  { key: "ac", label: "Điều hòa" },
  { key: "washer", label: "Máy giặt" },
  { key: "parking", label: "Chỗ để xe" },
  { key: "security", label: "An ninh 24/7" },
  { key: "kitchen", label: "Bếp nấu" },
  { key: "balcony", label: "Ban công" },
  { key: "pet", label: "Thú cưng" },
];

export default function FilterSidebar({ filters, onChange, districts, className }: Props) {
  const [districtExpanded, setDistrictExpanded] = useState(false);

  // Nếu khu vực đang chọn nằm ngoài vùng preview → tự động mở rộng
  useEffect(() => {
    if (
      filters.district &&
      !districts.slice(0, DISTRICT_PREVIEW).includes(filters.district)
    ) {
      setDistrictExpanded(true);
    }
  }, [filters.district, districts]);

  const toggle = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
  };

  const toggleAmenity = (key: string) => {
    const prev = filters.amenities ?? {};
    const cur = prev[key as keyof typeof prev];
    onChange({ ...filters, amenities: { ...prev, [key]: cur ? undefined : true } });
  };

  const setPriceRange = (min: number, max: number | undefined) => {
    if (filters.price_min === min && filters.price_max === max) {
      onChange({ ...filters, price_min: undefined, price_max: undefined });
    } else {
      onChange({ ...filters, price_min: min, price_max: max });
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* Khu vực */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Khu vực</p>

        {/* Chips phổ biến (luôn hiển thị) */}
        <div className="flex flex-wrap gap-1.5">
          {districts.slice(0, DISTRICT_PREVIEW).map((d) => (
            <DistrictChip
              key={d}
              label={d}
              active={filters.district === d}
              onClick={() => toggle("district", d)}
            />
          ))}
        </div>

        {/* Phần mở rộng */}
        {districtExpanded && districts.length > DISTRICT_PREVIEW && (
          <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 flex flex-wrap gap-1.5">
            {districts.slice(DISTRICT_PREVIEW).map((d) => (
              <DistrictChip
                key={d}
                label={d}
                active={filters.district === d}
                onClick={() => toggle("district", d)}
              />
            ))}
          </div>
        )}

        {/* Toggle xem thêm / thu gọn */}
        {districts.length > DISTRICT_PREVIEW && (
          <button
            onClick={() => setDistrictExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {districtExpanded ? (
              <><ChevronUp size={13} /> Thu gọn</>
            ) : (
              <><ChevronDown size={13} /> Xem thêm {districts.length - DISTRICT_PREVIEW} khu vực</>
            )}
          </button>
        )}
      </div>

      {/* Loại phòng */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loại phòng</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggle("room_type", value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                filters.room_type === value
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-200 text-gray-700 hover:border-blue-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mức giá */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mức giá</p>
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map(({ label, min, max }) => (
            <button
              key={label}
              onClick={() => setPriceRange(min, max)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                filters.price_min === min && filters.price_max === max
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-200 text-gray-700 hover:border-blue-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Đối tượng */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Đối tượng</p>
        <div className="flex gap-2">
          {(["all", "male", "female"] as const).map((g) => (
            <button
              key={g}
              onClick={() => toggle("gender_preference", g === "all" ? undefined : g)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                (g === "all" ? !filters.gender_preference : filters.gender_preference === g)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-200 text-gray-700 hover:border-blue-300"
              )}
            >
              {g === "all" ? "Tất cả" : g === "male" ? "Nam" : "Nữ"}
            </button>
          ))}
        </div>
      </div>

      {/* Tiện ích */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tiện ích</p>
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITIES.map(({ key, label }) => {
            const checked = !!filters.amenities?.[key as keyof typeof filters.amenities];
            return (
              <button
                key={key}
                onClick={() => toggleAmenity(key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
                  checked
                    ? "bg-blue-50 border-blue-400 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center text-xs",
                    checked ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                  )}
                >
                  {checked && "✓"}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({})}
        className="w-full py-2 text-sm text-gray-500 underline hover:text-gray-700"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}

function DistrictChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const short = label
    .replace(/^Phường /, "")
    .replace(/^Xã /, "")
    .replace(/^Đặc khu /, "");

  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap",
        active
          ? "bg-blue-600 border-blue-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-600"
      )}
    >
      {short}
    </button>
  );
}
