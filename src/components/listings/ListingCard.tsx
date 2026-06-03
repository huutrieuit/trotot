import Link from "next/link";
import Image from "next/image";
import { MapPin, Maximize2, Wifi, AirVent, Car, ShieldCheck, BadgeCheck, UserCheck, Eye, Clock, ImageOff } from "lucide-react";
import { Listing, ListingSource } from "@/types";
import { cn, formatPrice, formatArea, timeAgo } from "@/lib/utils";

const SOURCE_BADGE: Record<ListingSource, { label: string; className: string; icon: React.ElementType } | null> = {
  landlord: null,
  admin: {
    label: "TrọTốt xác thực",
    className: "bg-blue-600/90 text-white",
    icon: BadgeCheck,
  },
  claimed: {
    label: "Chủ nhà xác nhận",
    className: "bg-green-600/90 text-white",
    icon: UserCheck,
  },
};

const ROOM_TYPE_LABEL: Record<string, string> = {
  phong_tro: "Phòng trọ",
  chung_cu: "Căn hộ",
  nha_nguyen_can: "Nhà nguyên căn",
  homestay: "Homestay",
};

const GENDER_LABEL: Record<string, string> = {
  all: "",
  male: "Nam",
  female: "Nữ",
};

interface Props {
  listing: Listing;
  citySlug?: string;
  className?: string;
}

export default function ListingCard({ listing, citySlug, className }: Props) {
  const city = citySlug ?? listing.city;
  const coverImage = listing.images?.[0]?.url ?? null;

  const ageMs = Date.now() - new Date(listing.created_at).getTime();
  const isNew = ageMs < 7 * 24 * 60 * 60 * 1000;
  const isHot = listing.view_count >= 80 && !isNew;

  return (
    <Link
      href={`/${city}/phong-tro/${listing.id}`}
      className={cn(
        "group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <ImageOff size={24} className="text-gray-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Chưa có ảnh</span>
          </div>
        )}

        {/* Room type badge */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2 py-0.5 rounded-full">
          {ROOM_TYPE_LABEL[listing.room_type]}
        </span>

        {/* Gender badge */}
        {listing.gender_preference !== "all" && (
          <span
            className={cn(
              "absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full",
              listing.gender_preference === "female"
                ? "bg-pink-100 text-pink-700"
                : "bg-blue-100 text-blue-700"
            )}
          >
            {GENDER_LABEL[listing.gender_preference]}
          </span>
        )}

        {/* Source badge */}
        {(() => {
          const badge = SOURCE_BADGE[listing.source];
          if (!badge) return null;
          const Icon = badge.icon;
          return (
            <div className={cn("absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", badge.className)}>
              <Icon size={10} />
              {badge.label}
            </div>
          );
        })()}

        {/* New / Hot badges */}
        {(isNew || isHot) && (
          <div className="absolute bottom-2 right-2">
            {isNew && (
              <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Mới
              </span>
            )}
            {isHot && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                🔥 Hot
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Price + area */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-extrabold text-blue-600">
            {formatPrice(listing.price)}
            <span className="text-xs font-normal text-gray-400">/tháng</span>
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded-lg">
            <Maximize2 size={11} />
            {formatArea(listing.area)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5 leading-snug">
          {listing.title}
        </h3>

        {/* Address */}
        <p className="flex items-start gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={12} className="mt-0.5 shrink-0 text-orange-400" />
          <span className="line-clamp-1">{listing.address}</span>
        </p>

        {/* Amenity icons + meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            {listing.amenities.wifi && (
              <span title="Wifi" className="text-blue-400"><Wifi size={14} /></span>
            )}
            {listing.amenities.ac && (
              <span title="Điều hòa" className="text-blue-400"><AirVent size={14} /></span>
            )}
            {listing.amenities.parking && (
              <span title="Chỗ để xe" className="text-gray-400"><Car size={14} /></span>
            )}
            {listing.amenities.security && (
              <span title="An ninh 24/7" className="text-green-500"><ShieldCheck size={14} /></span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
            {listing.view_count > 0 && (
              <span className="flex items-center gap-0.5">
                <Eye size={11} />
                {listing.view_count}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Clock size={11} />
              {timeAgo(listing.created_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
