"use client";

import { useState } from "react";
import { BadgeCheck, UserCheck, X, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ListingSource } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  source: ListingSource;
  sourceNote?: string;
  listingId: string;
  citySlug: string;
}

export default function ClaimBanner({ source, sourceNote, listingId, citySlug }: Props) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ phone: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [claimError, setClaimError] = useState("");

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setClaimError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setClaimError("Bạn cần đăng nhập để gửi yêu cầu.");
      return;
    }
    const { error } = await supabase.from("claim_requests").insert({
      listing_id: listingId,
      user_id: user.id,
      phone: claimForm.phone.trim(),
      note: claimForm.note.trim() || null,
    });
    setLoading(false);
    if (error) {
      setClaimError(error.code === "23505" ? "Bạn đã gửi yêu cầu cho tin này rồi." : error.message);
      return;
    }
    setDone(true);
  };

  if (source === "landlord") return null;

  return (
    <>
      {/* Banner */}
      <div className={cn(
        "rounded-2xl p-4 mb-5 border",
        source === "admin"
          ? "bg-blue-50 border-blue-200"
          : "bg-green-50 border-green-200"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            source === "admin" ? "bg-blue-100" : "bg-green-100")}>
            {source === "admin"
              ? <BadgeCheck size={18} className="text-blue-600" />
              : <UserCheck size={18} className="text-green-600" />}
          </div>
          <div className="flex-1">
            <p className={cn("font-semibold text-sm", source === "admin" ? "text-blue-800" : "text-green-800")}>
              {source === "admin" ? "Tin được xác thực bởi TrọTốt" : "Chủ nhà đã xác nhận tin đăng"}
            </p>
            {sourceNote && (
              <p className={cn("text-xs mt-0.5", source === "admin" ? "text-blue-600" : "text-green-600")}>
                {sourceNote}
              </p>
            )}
            {source === "admin" && (
              <button
                onClick={() => setClaimOpen(true)}
                className="mt-2 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
              >
                Đây là phòng của bạn? Nhận tin về tài khoản →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Claim form bottom sheet */}
      {claimOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setClaimOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-4 pt-4 pb-8 md:max-w-md md:mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-900">Nhận tin về tài khoản</span>
              <button onClick={() => setClaimOpen(false)} className="text-gray-400"><X size={20} /></button>
            </div>

            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 size={44} className="text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 mb-1">Gửi yêu cầu thành công!</p>
                <p className="text-sm text-gray-500">
                  Admin TrọTốt sẽ liên hệ xác nhận với bạn trong vòng 24 giờ.
                  Sau khi xác nhận, tin sẽ được chuyển về tài khoản của bạn.
                </p>
                <button onClick={() => setClaimOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-700">
                  Sau khi xác nhận bạn là chủ nhà, bạn có thể chỉnh sửa tin và nhận yêu cầu xem phòng trực tiếp.
                </div>
                <form onSubmit={handleClaim} className="space-y-3">
                  {claimError && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">{claimError}</p>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Số điện thoại liên hệ *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={claimForm.phone}
                        onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Admin sẽ gọi số này để xác minh bạn là chủ nhà.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Ghi chú thêm (tuỳ chọn)</label>
                    <textarea
                      rows={2}
                      placeholder="VD: Tôi là chủ nhà từ tháng 3/2025, phòng nằm ở tầng 2..."
                      value={claimForm.note}
                      onChange={(e) => setClaimForm({ ...claimForm, note: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 resize-none"
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Đang gửi..." : "Gửi yêu cầu nhận tin"}
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
