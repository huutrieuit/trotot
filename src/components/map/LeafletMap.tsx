"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  lat: number;
  lng: number;
  address?: string;
  zoom?: number;
  className?: string;
}

// SVG pin icon — avoids webpack asset-path issues with Leaflet's default marker
const PIN_SVG = `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#f97316"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

export default function LeafletMap({ lat, lng, address, zoom = 16, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  useEffect(() => {
    if (!lat || !lng || !containerRef.current) return;
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

      const map = L.map(containerRef.current).setView([lat, lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      if (address) marker.bindPopup(`<span style="font-size:13px">${address}</span>`).openPopup();

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, address, zoom]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full rounded-2xl overflow-hidden", className)}
    />
  );
}
