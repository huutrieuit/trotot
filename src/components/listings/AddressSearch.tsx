"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    district?: string;
    quarter?: string;
  };
}

interface Props {
  cityName: string;
  districts: string[];
  value?: string;
  onChange?: (val: string) => void;
  onSelect: (address: string, district: string, lat: number, lng: number) => void;
}

export default function AddressSearch({ cityName, districts, value, onChange, onSelect }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.length < 3) { setResults([]); setOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", `${query} ${cityName} Việt Nam`);
        url.searchParams.set("countrycodes", "vn");
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "6");
        const res = await fetch(url.toString(), {
          headers: { "Accept-Language": "vi", "User-Agent": "TroTot/1.0" },
        });
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer.current);
  }, [query, cityName]);

  const handleSelect = (r: NominatimResult) => {
    // Xây địa chỉ gọn
    const parts = [r.address.house_number, r.address.road].filter(Boolean);
    const address = parts.length > 0 ? parts.join(" ") : r.display_name.split(",")[0].trim();

    // Match quận từ kết quả Nominatim với danh sách quận của city
    const raw = [
      r.address.suburb,
      r.address.city_district,
      r.address.quarter,
      r.address.district,
    ].filter(Boolean).join(" ").toLowerCase();

    const matched = districts.find((d) => {
      const clean = d.toLowerCase().replace(/quận |huyện |thị xã |phường |xã |đặc khu /g, "");
      return raw.includes(clean) || clean.includes(raw.split(" ").pop() ?? "");
    }) ?? "";

    onSelect(address, matched, parseFloat(r.lat), parseFloat(r.lon));
    setQuery(address);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={`Số nhà, tên đường... (gõ để tìm gợi ý)`}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
            {results.map((r, i) => {
              const [main, ...rest] = r.display_name.split(",");
              return (
                <button key={i} type="button" onClick={() => handleSelect(r)}
                  className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors border-b border-gray-50 last:border-0">
                  <MapPin size={14} className="text-orange-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{main.trim()}</p>
                    <p className="text-xs text-gray-400 truncate">{rest.slice(0, 2).join(",")}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
