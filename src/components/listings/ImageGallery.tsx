"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  url: string;
}

interface Props {
  images: GalleryImage[];
  title: string;
}

export default function ImageGallery({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const count = images.length;

  const prev = useCallback(() => setActive((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((i) => (i + 1) % count), [count]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDeltaX.current < -50) next();
    else if (touchDeltaX.current > 50) prev();
  };

  useEffect(() => {
    if (!lightbox) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [lightbox, prev, next]);

  if (count === 0) {
    return (
      <div className="aspect-[16/9] md:aspect-[2/1] md:rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chưa có ảnh</p>
      </div>
    );
  }

  return (
    <>
      {/* Main slide */}
      <div
        className="relative aspect-[16/9] md:aspect-[2/1] md:rounded-2xl overflow-hidden bg-gray-900 group cursor-zoom-in select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => setLightbox(true)}
      >
        <Image
          src={images[active].url}
          alt={`${title} – ảnh ${active + 1}`}
          fill
          className="object-cover"
          priority={active === 0}
          sizes="(max-width: 768px) 100vw, 860px"
        />

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm pointer-events-none">
          {active + 1} / {count}
        </div>

        {/* Prev/Next arrows (show on hover desktop, always on mobile tap) */}
        {count > 1 && (
          <>
            <button
              aria-label="Ảnh trước"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              aria-label="Ảnh tiếp"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dot indicators – mobile only, max 8 images */}
        {count > 1 && count <= 8 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full bg-white transition-all",
                  i === active ? "w-4 h-1.5" : "w-1.5 h-1.5 opacity-50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip – desktop */}
      {count > 1 && (
        <div className="hidden md:flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all",
                i === active ? "border-blue-500" : "border-transparent opacity-55 hover:opacity-80"
              )}
            >
              <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
          >
            <X size={20} />
          </button>

          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums pointer-events-none">
            {active + 1} / {count}
          </p>

          {count > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full px-16 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[active].url}
              alt={`${title} – ảnh ${active + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {count > 1 && count <= 12 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  className={cn(
                    "rounded-full bg-white transition-all",
                    i === active ? "w-5 h-2" : "w-2 h-2 opacity-40"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
