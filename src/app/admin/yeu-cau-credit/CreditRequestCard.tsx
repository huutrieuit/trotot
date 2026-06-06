"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Loader2, Zap, Clock } from "lucide-react";
import { approveCreditRequest, rejectCreditRequest } from "@/app/actions/admin";

interface Props {
  id: string;
  userId: string;
  userEmail: string;
  packageName: string;
  credits: number;
  amount: number;
  createdAt: string;
}

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function CreditRequestCard({ id, userId, userEmail, packageName, credits, amount, createdAt }: Props) {
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveCreditRequest(id, userId, credits);
      setDone("approved");
    });
  };

  const handleReject = () => {
    if (!confirm(`Từ chối yêu cầu của ${userEmail}?`)) return;
    startTransition(async () => {
      await rejectCreditRequest(id);
      setDone("rejected");
    });
  };

  if (done) {
    return (
      <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
        done === "approved" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}>
        {done === "approved"
          ? <CheckCircle2 size={18} className="text-green-500 shrink-0" />
          : <XCircle size={18} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-medium text-gray-600">
          {done === "approved"
            ? `Đã cộng ${credits} credit cho ${userEmail}`
            : `Đã từ chối yêu cầu của ${userEmail}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
        <Zap size={18} className="text-orange-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{userEmail}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Gói <span className="font-medium text-gray-700">{packageName}</span>
              {" · "}<span className="text-orange-500 font-bold">{credits} credit</span>
              {" · "}<span className="text-green-600 font-semibold">{fmt(amount)}</span>
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
            <Clock size={11} />
            {new Date(createdAt).toLocaleString("vi-VN")}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleApprove}
            disabled={pending}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Duyệt — cộng {credits} credit
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
