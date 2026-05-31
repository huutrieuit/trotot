"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, MapPin, Maximize2, Users } from "lucide-react";
import { approveListing, rejectListing } from "@/app/actions/admin";
import { formatPrice, formatArea } from "@/lib/utils";
import type { Listing } from "@/types";

export default function ApprovalCard({ listing }: { listing: Listing }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const handle = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      if (action === "approve") await approveListing(listing.id);
      else await rejectListing(listing.id);
      setDone(action === "approve" ? "approved" : "rejected");
    } catch (e) {
      console.error(e);
      alert("Thao tác thất bại. Thử lại.");
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
        done === "approved" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}>
        {done === "approved"
          ? <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          : <XCircle size={20} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-medium text-gray-600">
          {done === "approved" ? "Đã duyệt — tin đang hiển thị" : "Đã từ chối — tin bị ẩn"}
        </p>
      </div>
    );
  }

  const img = listing.images[0]?.url;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {img
            ? <img src={img} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Chưa có ảnh</div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{listing.title}</p>
          <p className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <MapPin size={11} className="text-orange-400 shrink-0" />
            {listing.address}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="text-blue-600 font-bold">{formatPrice(listing.price)}/tháng</span>
            <span className="flex items-center gap-0.5"><Maximize2 size={11} />{formatArea(listing.area)}</span>
            <span className="flex items-center gap-0.5"><Users size={11} />{listing.max_occupants} người</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(listing.amenities)
              .filter(([, v]) => v)
              .map(([k]) => (
                <span key={k} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">{k}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
        </div>
      )}

      {/* Image strip */}
      {listing.images.length > 1 && (
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {listing.images.map((img) => (
            <img key={img.id} src={img.url} alt=""
              className="w-16 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
          ))}
        </div>
      )}

      {/* Source info */}
      <div className="px-4 pb-3 text-xs text-gray-400">
        Đăng bởi: {listing.landlord?.full_name ?? "Chủ nhà"} ·{" "}
        {new Date(listing.created_at).toLocaleString("vi-VN")}
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 pb-4">
        <button
          onClick={() => handle("approve")}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Duyệt tin
        </button>
        <button
          onClick={() => handle("reject")}
          disabled={!!loading}
          className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
          Từ chối
        </button>
      </div>
    </div>
  );
}
