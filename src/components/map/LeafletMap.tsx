"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  lat: number;
  lng: number;
  address?: string;
  zoom?: number;
  className?: string;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}

const PIN_SVG = `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22S28 24.5 28 14C28 6.268 21.732 0 14 0z" fill="#f97316"/>
  <circle cx="14" cy="14" r="6" fill="white"/>
</svg>`;

export default function LeafletMap({ lat, lng, address, zoom = 16, className, draggable = false, onPositionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const markerRef = useRef<ReturnType<typeof import("leaflet")["marker"]> | null>(null);

  // Keep latest callback & address accessible inside async init without redeclaring effect
  const latestRef = useRef({ lat, lng, address, zoom, onPositionChange });
  useEffect(() => { latestRef.current = { lat, lng, address, zoom, onPositionChange }; });

  // Create map once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    import("leaflet").then((L) => {
      if (destroyed || !containerRef.current) return;

      const { lat: initLat, lng: initLng, address: initAddr, zoom: initZoom } = latestRef.current;

      const icon = L.divIcon({
        html: PIN_SVG,
        className: "",
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
      });

      const map = L.map(containerRef.current).setView([initLat, initLng], initZoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([initLat, initLng], { icon, draggable }).addTo(map);
      if (initAddr) marker.bindPopup(`<span style="font-size:13px">${initAddr}</span>`).openPopup();

      if (draggable) {
        marker.on("dragend", () => {
          const { lat: newLat, lng: newLng } = marker.getLatLng();
          latestRef.current.onPositionChange?.(newLat, newLng);
        });
      }

      mapRef.current    = map as never;
      markerRef.current = marker as never;
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current    = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move marker when lat/lng change (e.g. user selects new address from search)
  useEffect(() => {
    if (!markerRef.current || !lat || !lng) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current?.setView([lat, lng], zoom, { animate: true });
    if (address) {
      if (markerRef.current.getPopup()) {
        markerRef.current.setPopupContent(`<span style="font-size:13px">${address}</span>`);
      } else {
        markerRef.current.bindPopup(`<span style="font-size:13px">${address}</span>`);
      }
    }
  }, [lat, lng, address, zoom]);

  return (
    <div ref={containerRef} className={cn("w-full rounded-2xl overflow-hidden isolate", className)} />
  );
}
