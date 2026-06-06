"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, CreditCard, LogIn, Loader2, MessageCircle, Lock, ShieldCheck, Flag, CheckCircle2, Zap, ThumbsUp, ThumbsDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maskPhone } from "@/lib/utils";
import { reportPhone } from "@/app/actions/save";
import { submitReview } from "@/app/actions/review";

interface Props {
  listingId: string;
  phone: string;
  phone2?: string | null;
  currentUserId: string | null;
  landlordId: string;
  citySlug: string;
  isVerified?: boolean;
}

type State = "hidden" | "loading" | "revealed" | "no_credits" | "login_required";
type ReviewState = "idle" | "confirm_bad" | "sending" | "done_good" | "done_bad";

export default function PhoneReveal({ listingId, phone, phone2, currentUserId, landlordId, citySlug, isVerified }: Props) {
  const router = useRouter();
  const isOwn = currentUserId === landlordId;
  const [state, setState] = useState<State>(isOwn ? "revealed" : "hidden");
  const [credits, setCredits] = useState<number | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>("idle");

  const handleReveal = async () => {
    if (!currentUserId) { setState("login_required"); return; }

    setState("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("reveal_phone", { p_listing_id: listingId });

      if (error) {
        if (error.message.includes("no_credits")) {
          const { data: profile } = await supabase
            .from("profiles").select("credits").eq("user_id", currentUserId).single();
          setCredits(profile?.credits ?? 0);
          setState("no_credits");
        } else if (error.message.includes("auth_required")) {
          setState("login_required");
        } else {
          setState("hidden");
        }
        return;
      }
      setState("revealed");
      // Fetch remaining credits to show toast
      const supabase2 = createClient();
      const { data: prof } = await supabase2.from("profiles").select("credits").eq("user_id", currentUserId!).single();
      setRemainingCredits(prof?.credits ?? null);
      router.refresh();
    } catch {
      setState("hidden");
    }
  };

  const handleReview = async (active: boolean) => {
    setReviewState("sending");
    await submitReview(listingId, active);
    if (!active) await reportPhone(listingId);
    setReviewState(active ? "done_good" : "done_bad");
  };

  /* ── Already revealed / own listing ── */
  if (state === "revealed") {
    return (
      <div className="space-y-2">
        <a
          href={`tel:${phone}`}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <Phone size={16} />
          {phone}
        </a>
        {phone2 && (
          <a
            href={`tel:${phone2}`}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:border-green-300 transition-colors text-sm"
          >
            <Phone size={15} />
            {phone2}
            <span className="text-xs text-gray-400 ml-0.5">(phụ)</span>
          </a>
        )}
        <a
          href={`https://zalo.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#0068FF] hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-opacity"
        >
          <MessageCircle size={16} />
          Nhắn Zalo
        </a>

        {/* Credit toast */}
        {!isOwn && remainingCredits !== null && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
            <span className="text-xs text-orange-700 flex items-center gap-1">
              <Zap size={11} />
              Còn <strong className="mx-0.5">{remainingCredits}</strong> credit
            </span>
            {remainingCredits <= 2 && (
              <button
                onClick={() => router.push(`/${citySlug}/mua-credit`)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Mua thêm →
              </button>
            )}
          </div>
        )}

        {/* Review: số còn hoạt động không? */}
        {!isOwn && (
          <div className="pt-1">
            {reviewState === "idle" && (
              <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-500 text-center mb-2 flex items-center justify-center gap-1">
                  <Flag size={11} /> Số này còn liên lạc được không?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(true)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 rounded-lg py-1.5 font-medium transition-colors"
                  >
                    <ThumbsUp size={11} /> Còn hoạt động
                  </button>
                  <button
                    onClick={() => setReviewState("confirm_bad")}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg py-1.5 font-medium transition-colors"
                  >
                    <ThumbsDown size={11} /> Không liên lạc được
                  </button>
                </div>
              </div>
            )}
            {reviewState === "confirm_bad" && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <p className="text-xs text-red-700 text-center mb-2">Báo cáo → admin xem xét hoàn 1 credit trong 24h.</p>
                <div className="flex gap-2">
                  <button onClick={() => setReviewState("idle")}
                    className="flex-1 text-xs text-gray-500 border border-gray-200 bg-white rounded-lg py-1.5">Huỷ</button>
                  <button onClick={() => handleReview(false)}
                    className="flex-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg py-1.5 font-medium">Xác nhận</button>
                </div>
              </div>
            )}
            {reviewState === "sending" && (
              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1 py-1">
                <Loader2 size={11} className="animate-spin" /> Đang gửi...
              </p>
            )}
            {reviewState === "done_good" && (
              <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1 py-1">
                <CheckCircle2 size={11} /> Cảm ơn! Cộng đồng cảm ơn bạn.
              </p>
            )}
            {reviewState === "done_bad" && (
              <p className="text-xs text-orange-600 text-center flex items-center justify-center gap-1 py-1">
                <CheckCircle2 size={11} /> Đã gửi báo cáo · Admin xử lý trong 24h.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Need to login ── */
  if (state === "login_required") {
    return (
      <div className="space-y-2">
        <button
          onClick={() => router.push(`/dang-nhap?redirect=/${citySlug}/phong-tro/${listingId}`)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <LogIn size={16} />
          Đăng nhập để xem SĐT
        </button>
        <p className="text-xs text-center text-gray-400">Nhận 3 credit miễn phí khi đăng ký tài khoản</p>
      </div>
    );
  }

  /* ── Out of credits ── */
  if (state === "no_credits") {
    return (
      <div className="space-y-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-800">Hết credit</p>
          <p className="text-xs text-amber-600 mt-0.5">Bạn còn {credits ?? 0} credit · Cần 1 credit để xem SĐT</p>
        </div>
        <button
          onClick={() => router.push(`/${citySlug}/mua-credit`)}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <CreditCard size={16} />
          Mua thêm credit
        </button>
      </div>
    );
  }

  /* ── Default: hidden (with teaser) ── */
  return (
    <div className="space-y-2">
      {isVerified && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <ShieldCheck size={13} className="shrink-0" />
          Số điện thoại đã được xác minh bởi TrọTốt
        </div>
      )}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={15} className="text-gray-400 shrink-0" />
          <span className="font-mono text-base font-bold text-gray-400 tracking-widest select-none">
            {maskPhone(phone)}
          </span>
        </div>
        <Lock size={14} className="text-gray-300" />
      </div>
      <button
        onClick={handleReveal}
        disabled={state === "loading"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
        {state === "loading" ? "Đang xử lý..." : "Xem số đầy đủ · 1 credit"}
      </button>
      <p className="text-[11px] text-center text-gray-400">
        Số không liên lạc được? Admin hoàn credit trong 24h.
      </p>
    </div>
  );
}
