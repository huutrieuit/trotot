"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin, Maximize2, Users, Wifi, AirVent, Car, ShieldCheck,
  ChevronLeft, Heart, Share2, X, Eye,
  WashingMachine, UtensilsCrossed, Wind, PawPrint, BadgeCheck, Loader2,
} from "lucide-react";
import { formatPrice, formatArea, cn } from "@/lib/utils";
import { toggleSaveListing } from "@/app/actions/save";
import ImageGallery from "@/components/listings/ImageGallery";
import PhoneReveal from "@/components/listings/PhoneReveal";
import ListingCard from "@/components/listings/ListingCard";
import ClaimBanner from "@/components/listings/ClaimBanner";
import type { Listing } from "@/types";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

const AMENITY_ICONS: Record<string, { icon: React.ElementType; label: string }> = {
  wifi:     { icon: Wifi,            label: "Wifi miễn phí" },
  ac:       { icon: AirVent,         label: "Điều hòa" },
  washer:   { icon: WashingMachine,  label: "Máy giặt" },
  parking:  { icon: Car,             label: "Chỗ để xe" },
  security: { icon: ShieldCheck,     label: "An ninh 24/7" },
  kitchen:  { icon: UtensilsCrossed, label: "Bếp nấu ăn" },
  balcony:  { icon: Wind,            label: "Ban công" },
  pet:      { icon: PawPrint,        label: "Nuôi thú cưng" },
};

const ROOM_TYPE_LABEL: Record<string, string> = {
  phong_tro:       "Phòng trọ",
  chung_cu:        "Căn hộ mini",
  nha_nguyen_can:  "Nhà nguyên căn",
  homestay:        "Homestay",
};

interface Props {
  listing: Listing;
  related: Listing[];
  citySlug: string;
  currentUserId: string | null;
  isSaved: boolean;
  isVerified: boolean;
  showLandlordInfo: boolean;
}

export default function RoomDetailClient({ listing, related, citySlug, currentUserId, isSaved, isVerified, showLandlordInfo }: Props) {
  const base = `/${citySlug}`;

  const [contactOpen, setContactOpen] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [savingHeart, setSavingHeart] = useState(false);

  const handleToggleSave = async () => {
    if (!currentUserId) return;
    setSavingHeart(true);
    const { saved: next } = await toggleSaveListing(listing.id);
    setSaved(next);
    setSavingHeart(false);
  };

  // Map – auto-geocode if lat/lng missing
  const [mapLat, setMapLat] = useState(listing.lat);
  const [mapLng, setMapLng] = useState(listing.lng);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (mapLat !== 0 && mapLng !== 0) return;
    if (!listing.address) return;
    setGeocoding(true);
    const query = encodeURIComponent(`${listing.address} Vietnam`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          setMapLat(parseFloat(data[0].lat));
          setMapLng(parseFloat(data[0].lon));
        }
      })
      .catch(() => {})
      .finally(() => setGeocoding(false));
  }, [listing.address, mapLat, mapLng]);

  const hasMap = mapLat !== 0 && mapLng !== 0;
  const isAdminSource = listing.source === "admin";

  const phoneRevealProps = {
    listingId: listing.id,
    phone: listing.contact_phone,
    phone2: listing.contact_phone2,
    currentUserId,
    landlordId: listing.landlord_id,
    citySlug,
    isVerified,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back bar (mobile) */}
      <div className="sticky top-14 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border-b border-gray-100 md:hidden">
        <Link href={`${base}/tim-phong`} className="p-1.5 -ml-1 text-gray-600">
          <ChevronLeft size={22} />
        </Link>
        <span className="text-sm font-medium text-gray-800 line-clamp-1 flex-1">{listing.title}</span>
        <button onClick={handleToggleSave} disabled={savingHeart} className={saved ? "text-red-500" : "text-gray-400"}>
          <Heart size={20} fill={saved ? "currentColor" : "none"} />
        </button>
        <button className="text-gray-400"><Share2 size={20} /></button>
      </div>

      <div className="md:px-4 md:py-6">
        {/* ── Gallery ── */}
        <ImageGallery images={listing.images} title={listing.title} />

        <div className="md:flex md:gap-6 md:mt-6">
          {/* ── Left column ── */}
          <div className="flex-1 px-4 md:px-0">
            <div className="mt-4 md:mt-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {ROOM_TYPE_LABEL[listing.room_type]}
                </span>
                {listing.landlord?.verified_id && (
                  <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} /> Đã xác minh
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug mb-2">{listing.title}</h1>
              <p className="flex items-start gap-1.5 text-sm text-gray-500 mb-4">
                <MapPin size={15} className="text-orange-400 mt-0.5 shrink-0" />
                {listing.address}
              </p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-base font-bold text-blue-700">{formatPrice(listing.price)}</div>
                <div className="text-[11px] text-blue-500 mt-0.5">/ tháng</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-base font-bold text-gray-800">
                  <Maximize2 size={14} /> {formatArea(listing.area)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Diện tích</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-base font-bold text-gray-800">
                  <Users size={14} /> {listing.max_occupants}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Người/phòng</div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-3">Tiện ích</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(AMENITY_ICONS).map(([key, { icon: Icon, label }]) => {
                  const has = listing.amenities[key as keyof typeof listing.amenities];
                  return (
                    <div key={key} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                      has ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-300 line-through")}>
                      <Icon size={15} />
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source badge */}
            <ClaimBanner
              source={listing.source}
              sourceNote={listing.source_note}
              listingId={listing.id}
              citySlug={citySlug}
            />

            {/* Description */}
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-2">Mô tả</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Map */}
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-2">Vị trí</h2>
              {geocoding ? (
                <div className="h-44 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Loader2 size={18} className="animate-spin" />
                  Đang tìm vị trí...
                </div>
              ) : hasMap ? (
                <LeafletMap lat={mapLat} lng={mapLng} address={listing.address} className="h-52 md:h-64" />
              ) : (
                <div className="h-44 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <MapPin size={28} className="mx-auto mb-1" />
                    <p className="text-sm">{listing.address}</p>
                    <p className="text-xs mt-0.5">Chưa xác định được toạ độ</p>
                  </div>
                </div>
              )}
            </div>

            {/* Người đăng */}
            <div className="mb-5 bg-gray-50 rounded-2xl p-4">
              {showLandlordInfo && (isAdminSource ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">TT</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm">TrọTốt</p>
                      <BadgeCheck size={15} className="text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {listing.source_note ?? "Tin đăng được TrọTốt xác thực từ nguồn tin cậy"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {listing.landlord?.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{listing.landlord?.full_name ?? "Chủ nhà"}</p>
                    {listing.landlord?.verified_phone && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5 mt-0.5">
                        <ShieldCheck size={11} /> SĐT đã xác minh
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                <Eye size={13} />
                <span>{listing.view_count} lượt xem · {listing.contact_count} lượt liên hệ</span>
              </div>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="pb-6">
                <h2 className="font-semibold text-gray-900 mb-3">Phòng tương tự ở {listing.district}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {related.map((l) => <ListingCard key={l.id} listing={l} citySlug={citySlug} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── Desktop contact card ── */}
          <aside className="hidden md:block w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatPrice(listing.price)}
                  <span className="text-sm font-normal text-gray-400">/tháng</span>
                </div>
                <p className="text-sm text-gray-500">{formatArea(listing.area)} · {ROOM_TYPE_LABEL[listing.room_type]}</p>
              </div>

              <PhoneReveal {...phoneRevealProps} />

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <button onClick={handleToggleSave} disabled={savingHeart} className={cn("flex items-center gap-1.5", saved ? "text-red-500" : "hover:text-gray-700")}>
                  <Heart size={16} fill={saved ? "currentColor" : "none"} />
                  {saved ? "Đã lưu" : "Lưu phòng"}
                </button>
                <button className="flex items-center gap-1.5 hover:text-gray-700">
                  <Share2 size={16} />
                  Chia sẻ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="font-bold text-blue-700">{formatPrice(listing.price)}<span className="text-xs font-normal text-gray-400">/tháng</span></div>
          <div className="text-xs text-gray-500">{formatArea(listing.area)}</div>
        </div>
        <button
          onClick={() => setContactOpen(true)}
          className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
        >
          Liên hệ ngay
        </button>
      </div>

      {/* Mobile contact sheet */}
      {contactOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setContactOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-4 pt-4 pb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Liên hệ</span>
              <button onClick={() => setContactOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Mini landlord info */}
            {showLandlordInfo && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  {isAdminSource ? "TT" : (listing.landlord?.full_name?.[0]?.toUpperCase() ?? "?")}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {isAdminSource ? "TrọTốt" : (listing.landlord?.full_name ?? "Chủ nhà")}
                  </p>
                  {isAdminSource
                    ? <p className="text-xs text-blue-500 flex items-center gap-0.5"><BadgeCheck size={10} /> Đã xác thực</p>
                    : listing.landlord?.verified_phone && <p className="text-xs text-green-600 flex items-center gap-0.5"><ShieldCheck size={10} /> SĐT xác minh</p>
                  }
                </div>
              </div>
            )}

            <PhoneReveal {...phoneRevealProps} />
          </div>
        </>
      )}
    </div>
  );
}
