"use client";

import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/utils";

interface MapListing {
  id: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  city: string;
}

interface Props {
  listings: MapListing[];
  cityCenter: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

const PIN_SVG = `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#2563eb"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

export default function ListingsMap({ listings, cityCenter, zoom = 12, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  const validListings = listings.filter((l) => l.lat !== 0 && l.lng !== 0);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    import("leaflet").then((L) => {
      if (!mounted || !containerRef.current) return;

      const icon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
      });

      const map = L.map(containerRef.current).setView([cityCenter.lat, cityCenter.lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      validListings.forEach((listing) => {
        const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width:160px;font-family:sans-serif">
            <p style="font-size:13px;font-weight:600;margin:0 0 4px;line-height:1.3">${listing.title}</p>
            <p style="font-size:14px;font-weight:700;color:#2563eb;margin:0 0 6px">${formatPrice(listing.price)}<span style="font-weight:400;color:#9ca3af;font-size:11px">/tháng</span></p>
            <a href="/${listing.city}/phong-tro/${listing.id}" style="display:inline-block;background:#2563eb;color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:8px;text-decoration:none">Xem chi tiết →</a>
          </div>
        `);
      });

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityCenter.lat, cityCenter.lng, zoom]);

  if (validListings.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 ${className}`}>
        <p className="text-sm text-gray-400">Không có phòng nào có vị trí trên bản đồ</p>
      </div>
    );
  }

  return <div ref={containerRef} className={`w-full rounded-2xl overflow-hidden ${className ?? ""}`} />;
}
