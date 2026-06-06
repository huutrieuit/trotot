"use client";

import { useState } from "react";
import { Check, CheckCircle2, MessageCircle, Phone, Send, Loader2, Zap, QrCode, Copy, CheckCheck } from "lucide-react";
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
  qrUrls: Record<string, string>;
  showPhoneSupport: boolean;
  showManualTransfer: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function MuaCreditClient({ packages, userEmail, bank, zalo, qrUrls, showPhoneSupport, showManualTransfer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  const pkg = packages.find((p) => p.id === selected) ?? null;
  const emailPrefix = userEmail.split("@")[0].toUpperCase();
  const transferNote = pkg ? `TROTOT ${emailPrefix} ${pkg.credits}` : "";
  const qrUrl = pkg ? (qrUrls[pkg.id] ?? "") : "";

  const copy = (text: string, type: "account" | "note") => {
    navigator.clipboard.writeText(text);
    if (type === "account") { setCopiedAccount(true); setTimeout(() => setCopiedAccount(false), 2000); }
    else { setCopiedNote(true); setTimeout(() => setCopiedNote(false), 2000); }
  };

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
    if (result && typeof result.error === "string") setError(result.error);
    else setDone(true);
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
      {/* ── Chọn gói ── */}
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

      {/* ── Thanh toán QR ── */}
      {pkg && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Thanh toán</h2>
            <p className="text-xs text-gray-400 mt-0.5">Quét QR hoặc chuyển khoản thủ công</p>
          </div>

          {/* QR section */}
          <div className="px-5 pt-4 pb-5">
            {qrUrl ? (
              <div className="flex flex-col items-center mb-5">
                <div className="w-52 h-52 rounded-2xl overflow-hidden border-2 border-orange-100 bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt={`QR ${pkg.name}`} className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Quét để thanh toán <span className="font-bold text-orange-500">{fmt(pkg.price)}</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center mb-5 py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <QrCode size={36} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">QR chưa được cấu hình</p>
                <p className="text-xs text-gray-400">Vui lòng chuyển khoản thủ công bên dưới</p>
              </div>
            )}

            {/* Bank info – chỉ hiện khi admin bật chuyển khoản thủ công */}
            {showManualTransfer && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Ngân hàng</span>
                  <span className="font-medium text-gray-800">{bank.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">Chủ tài khoản</span>
                  <span className="font-medium text-gray-800">{bank.owner || "—"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-gray-500 text-xs">Số tài khoản</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 font-mono">{bank.account || "—"}</span>
                    {bank.account && (
                      <button onClick={() => copy(bank.account, "account")} className="text-blue-500 hover:text-blue-700">
                        {copiedAccount ? <CheckCheck size={13} /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2.5">
                  <span className="text-gray-500 text-xs">Số tiền</span>
                  <span className="font-bold text-orange-500">{fmt(pkg.price)}</span>
                </div>
              </div>
            )}

            {/* Transfer note */}
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-amber-600 mb-1 font-medium">Nội dung chuyển khoản</p>
                  <p className="font-mono font-bold text-sm text-amber-900 tracking-wide">{transferNote}</p>
                </div>
                <button onClick={() => copy(transferNote, "note")}
                  className="shrink-0 flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 rounded-lg px-2 py-1 transition-colors">
                  {copiedNote ? <><CheckCheck size={12} /> Đã copy</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <p className="text-[11px] text-amber-600 mt-2">Ghi đúng nội dung để admin nhận ra giao dịch của bạn.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Liên hệ & thông báo ── */}
      {pkg && (
        <div className="space-y-2">
          <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#0068FF] hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-opacity">
            <MessageCircle size={18} />
            Nhắn Zalo xác nhận thanh toán
          </a>
          {showPhoneSupport && zalo && (
            <a href={`tel:${zalo}`}
              className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-700 hover:border-blue-300 font-medium py-2.5 rounded-xl transition-colors text-sm">
              <Phone size={16} />
              Gọi hỗ trợ: {zalo}
            </a>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-1">
            <p className="font-semibold text-gray-900 text-sm mb-0.5">Đã chuyển khoản?</p>
            <p className="text-xs text-gray-500 mb-3">
              Bấm thông báo để admin nhận ngay và xử lý — không cần đợi Zalo.
            </p>
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>}
            <button
              onClick={handleNotify}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? "Đang gửi..." : `Thông báo đã thanh toán ${fmt(pkg.price)}`}
            </button>
          </div>
        </div>
      )}

      {!pkg && (
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-4">
          <Zap size={15} className="text-gray-300" />
          Chọn gói bên trên để xem hướng dẫn thanh toán
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        Credit không có hạn sử dụng · Không hoàn tiền sau khi đã cộng vào tài khoản
      </p>
    </div>
  );
}
