"use client";

import { useState, useTransition } from "react";
import { Flag, CheckCircle2, Trash2, Loader2, Clock, MapPin, AlertTriangle } from "lucide-react";
import { dismissListingReport, deleteListingFromReport } from "@/app/actions/admin";

interface Props {
  id: string;
  reporterEmail: string;
  reporterName: string;
  listingId: string;
  listingTitle: string;
  listingAddress: string;
  citySlug: string;
  reason: string;
  createdAt: string;
}

export default function ListingReportCard({
  id, reporterEmail, reporterName,
  listingId, listingTitle, listingAddress,
  citySlug, reason, createdAt,
}: Props) {
  const [done, setDone] = useState<"dismissed" | "deleted" | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDismiss = () => {
    if (!confirm(`Bỏ qua báo cáo này? Tin đăng sẽ không bị xóa.`)) return;
    startTransition(async () => {
      const result = await dismissListingReport(id);
      if (result?.error) { alert(`Lỗi: ${result.error}`); return; }
      setDone("dismissed");
    });
  };

  const handleDelete = () => {
    if (!confirm(`Xóa tin "${listingTitle}"?\n\nThao tác này không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deleteListingFromReport(id, listingId);
      if (result?.error) { alert(`Lỗi: ${result.error}`); return; }
      setDone("deleted");
    });
  };

  if (done) {
    return (
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
        done === "deleted" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
      }`}>
        {done === "deleted"
          ? <Trash2 size={18} className="text-red-400 shrink-0" />
          : <CheckCircle2 size={18} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-medium text-gray-600">
          {done === "deleted"
            ? `Đã xóa tin "${listingTitle}"`
            : `Đã bỏ qua báo cáo của ${reporterEmail}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
        <Flag size={18} className="text-red-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {reporterName || reporterEmail}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{reporterEmail}</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
            <Clock size={11} />
            {new Date(createdAt).toLocaleString("vi-VN")}
          </span>
        </div>

        {/* Lý do báo cáo */}
        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-red-50 rounded-lg w-fit">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <span className="text-xs font-medium text-red-700">{reason}</span>
        </div>

        {/* Thông tin tin đăng */}
        <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-1">
          <a
            href={`/${citySlug}/phong-tro/${listingId}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-700 hover:underline line-clamp-1"
          >
            {listingTitle}
          </a>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" /> {listingAddress}
          </p>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDelete}
            disabled={pending}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Xóa tin
          </button>
          <button
            onClick={handleDismiss}
            disabled={pending}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 font-medium px-3 py-2 rounded-xl text-xs transition-colors"
          >
            <CheckCircle2 size={13} />
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
}
