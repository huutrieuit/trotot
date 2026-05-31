"use client";

import { useState } from "react";
import { Check, CheckCircle2, MessageCircle, Phone, Send, Loader2, Zap } from "lucide-react";
import { notifyCreditRequest } from "@/app/actions/notify";
import { cn } from "@/lib/utils";

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular: boolean;
  badge: string;
}

interface Bank {
  name: string;
  account: string;
  owner: string;
  branch: string;
}

interface Props {
  packages: Package[];
  userEmail: string;
  bank: Bank;
  zalo: string;
}

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function MuaCreditClient({ packages, userEmail, bank, zalo }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const pkg = packages.find((p) => p.id === selected) ?? null;
  const emailPrefix = userEmail.split("@")[0].toUpperCase();

  const handleNotify = async () => {
    if (!pkg) return;
    setSending(true);
    setError("");
    const result = await notifyCreditRequest({
      packageName: pkg.name,
      credits: pkg.credits,
      amount: pkg.price,
    });
    setSending(false);
    if (result && typeof result.error === "string") {
      setError(result.error);
    } else {
      setDone(true);
    }
  };

  if (done && pkg) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-green-800 mb-1">Đã gửi thông báo!</p>
        <p className="text-sm text-green-600">
          Admin sẽ kiểm tra và cộng <strong>{pkg.credits} credit</strong> vào tài khoản trong vòng 15 phút (giờ hành chính).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Packages ── */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Chọn gói</h2>
        <div className="space-y-3">
          {packages.map((p) => {
            const isSelected = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "relative w-full text-left bg-white rounded-2xl border-2 p-4 transition-all",
                  isSelected
                    ? "border-orange-400 shadow-md ring-2 ring-orange-100"
                    : p.popular
                    ? "border-orange-200 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {p.badge && (
                  <span className={cn(
                    "absolute -top-2.5 left-4 text-[11px] font-bold px-2.5 py-0.5 rounded-full",
                    p.popular ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {p.badge}
                  </span>
                )}
                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <p className={cn("font-semibold", isSelected ? "text-orange-600" : "text-gray-900")}>{p.name}</p>
                    <p className={cn("text-2xl font-bold mt-0.5", isSelected ? "text-orange-500" : "text-gray-800")}>
                      {p.credits} credit
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(p.pricePerCredit)} / credit</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-bold", isSelected ? "text-orange-500" : "text-gray-900")}>{fmt(p.price)}</p>
                    <p className="text-xs text-gray-400">một lần</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {[`Xem ${p.credits} số ĐT`, "Không hết hạn", "Toàn quốc"].map((f) => (
                    <span key={f} className="flex items-center gap-1 text-xs text-gray-400">
                      <Check size={10} className="text-green-500 shrink-0" />
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Payment instructions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Hướng dẫn thanh toán</h2>

        {!pkg ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            <Zap size={15} className="text-gray-300" />
            Chọn gói bên trên để xem hướng dẫn thanh toán
          </div>
        ) : (
          <ol className="space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div className="flex-1">
                <p className="font-medium mb-2">Chuyển khoản</p>
                <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs space-y-1.5">
                  <p><span className="text-gray-400">Ngân hàng:</span> {bank.name}</p>
                  <p><span className="text-gray-400">Số TK:</span> <strong className="text-gray-900">{bank.account}</strong></p>
                  <p><span className="text-gray-400">Chủ TK:</span> {bank.owner}</p>
                  <p><span className="text-gray-400">Chi nhánh:</span> {bank.branch}</p>
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <p className="text-gray-400">Số tiền:</p>
                    <p className="text-orange-500 font-bold text-sm mt-0.5">{fmt(pkg.price)}</p>
                  </div>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="font-medium mb-2">Nội dung chuyển khoản</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                  <p className="text-amber-800 font-mono font-bold text-sm tracking-wide">
                    TROTOT {emailPrefix} {pkg.credits}
                  </p>
                  <p className="text-amber-600 mt-1.5">
                    Ghi chính xác để admin nhận ra giao dịch của bạn.
                  </p>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-medium">Nhắn Zalo kèm ảnh biên lai</p>
                <p className="text-gray-500 text-xs mt-1">
                  Credit được cộng trong vòng <strong>15 phút</strong> (giờ hành chính).
                </p>
              </div>
            </li>
          </ol>
        )}
      </div>

      {/* ── Contact buttons ── */}
      <div className="space-y-2">
        <a
          href={`https://zalo.me/${zalo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#0068FF] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-opacity"
        >
          <MessageCircle size={18} />
          Nhắn Zalo xác nhận thanh toán
        </a>
        <a
          href={`tel:${zalo}`}
          className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 hover:border-blue-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          <Phone size={16} />
          Gọi hỗ trợ: {zalo}
        </a>
      </div>

      {/* ── Notify admin ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-semibold text-gray-900 mb-1">Đã chuyển khoản?</p>
        <p className="text-xs text-gray-500 mb-4">
          Bấm thông báo để admin nhận email và xử lý ngay — không cần đợi Zalo.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
        )}

        <button
          onClick={handleNotify}
          disabled={!pkg || sending}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "Đang gửi thông báo..." : pkg ? `Thông báo đã thanh toán ${fmt(pkg.price)}` : "Chọn gói để thông báo"}
        </button>
      </div>

      <p className="text-xs text-center text-gray-400">
        Credit không có hạn sử dụng · Không hoàn tiền sau khi đã cộng vào tài khoản
      </p>
    </div>
  );
}
