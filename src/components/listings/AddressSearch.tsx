"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";

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

function parseCoords(input: string): { lat: number; lng: number } | null {
  const match = input.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < 8 || lat > 24 || lng < 102 || lng > 110) return null; // bounding box VN
  return { lat, lng };
}

export default function AddressSearch({ cityName, districts, value, onChange, onSelect }: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCoords, setShowCoords] = useState(false);
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsApplied, setCoordsApplied] = useState(false);
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
    const parts = [r.address.house_number, r.address.road].filter(Boolean);
    const address = parts.length > 0 ? parts.join(" ") : r.display_name.split(",")[0].trim();

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
    setCoordsApplied(false);
  };

  const handleCoordsApply = () => {
    const coords = parseCoords(coordsInput);
    if (!coords) return;
    const address = query.trim() || coordsInput;
    onSelect(address, "", coords.lat, coords.lng);
    setCoordsApplied(true);
    setShowCoords(false);
  };

  const parsedCoords = parseCoords(coordsInput);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); setCoordsApplied(false); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={`Số nhà, tên đường... (gõ để tìm gợi ý)`}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
        {coordsApplied && !loading && (
          <Navigation size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
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

      {/* Nhập tọa độ từ Google Maps */}
      <div className="mt-1.5">
        <button
          type="button"
          onClick={() => setShowCoords(!showCoords)}
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <Navigation size={11} />
          {showCoords ? "Ẩn nhập tọa độ" : "Không tìm thấy? Nhập tọa độ từ Google Maps"}
        </button>

        {showCoords && (
          <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-gray-500 mb-2">
              Mở Google Maps → Click chuột phải vào vị trí → Copy tọa độ → Dán vào đây
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={coordsInput}
                onChange={(e) => setCoordsInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && parsedCoords && handleCoordsApply()}
                placeholder="Ví dụ: 16.063224, 108.143095"
                className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                  coordsInput && !parsedCoords
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : parsedCoords
                    ? "border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <button
                type="button"
                onClick={handleCoordsApply}
                disabled={!parsedCoords}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Áp dụng
              </button>
            </div>
            {coordsInput && !parsedCoords && (
              <p className="text-xs text-red-500 mt-1">Tọa độ không hợp lệ. Vui lòng kiểm tra lại.</p>
            )}
            {parsedCoords && (
              <p className="text-xs text-green-600 mt-1">
                Lat: {parsedCoords.lat.toFixed(6)}, Lng: {parsedCoords.lng.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
