"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, Phone, Clock, MapPin } from "lucide-react";
import { refundPhoneReport, rejectPhoneReport } from "@/app/actions/admin";

interface Props {
  id: string;
  reporterEmail: string;
  reporterName: string;
  listingTitle: string;
  listingAddress: string;
  listingPhone: string;
  citySlug: string;
  listingId: string;
  createdAt: string;
}

export default function PhoneReportCard({
  id, reporterEmail, reporterName,
  listingTitle, listingAddress, listingPhone,
  citySlug, listingId, createdAt,
}: Props) {
  const [done, setDone] = useState<"refunded" | "rejected" | null>(null);
  const [pending, startTransition] = useTransition();

  const handleRefund = () => {
    startTransition(async () => {
      const result = await refundPhoneReport(id);
      if (result?.error) { alert(`Lỗi: ${result.error}`); return; }
      setDone("refunded");
    });
  };

  const handleReject = () => {
    if (!confirm(`Từ chối báo cáo của ${reporterEmail}?`)) return;
    startTransition(async () => {
      const result = await rejectPhoneReport(id);
      if (result?.error) { alert(`Lỗi: ${result.error}`); return; }
      setDone("rejected");
    });
  };

  if (done) {
    return (
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
        done === "refunded" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}>
        {done === "refunded"
          ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          : <XCircle size={18} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-medium text-gray-600">
          {done === "refunded"
            ? `Đã hoàn 1 credit cho ${reporterEmail}`
            : `Đã từ chối báo cáo của ${reporterEmail}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
        <Phone size={18} className="text-red-500" />
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
          <p className="flex items-center gap-1 text-xs font-medium text-red-600">
            <Phone size={11} className="shrink-0" /> {listingPhone}
            <span className="text-gray-400 font-normal ml-1">— bị báo không liên lạc được</span>
          </p>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleRefund}
            disabled={pending}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Hoàn 1 credit
          </button>
          <button
            onClick={handleReject}
            disabled={pending}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 font-medium px-3 py-2 rounded-xl text-xs transition-colors"
          >
            <XCircle size={13} />
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
