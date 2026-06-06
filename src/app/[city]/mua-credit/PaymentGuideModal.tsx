"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag, QrCode, FileText, Bell, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    accent:  "orange",
    bgIcon:  "bg-orange-100",
    colIcon: "text-orange-500",
    bar:     "bg-orange-500",
    icon:    ShoppingBag,
    title:   "Chọn gói credit",
    desc:    "Chọn gói phù hợp với nhu cầu. Gói lớn hơn có giá mỗi credit rẻ hơn — và credit không bao giờ hết hạn.",
    items: [
      "Gói Cơ bản · 5 credit · 25.000đ",
      "Gói Tiêu chuẩn · 20 credit · 80.000đ",
      "Gói Cao cấp · 50 credit · 150.000đ",
    ],
    tip: "Credit dùng được toàn quốc, không giới hạn thời gian.",
  },
  {
    accent:  "blue",
    bgIcon:  "bg-blue-100",
    colIcon: "text-blue-500",
    bar:     "bg-blue-500",
    icon:    QrCode,
    title:   "Quét QR chuyển khoản",
    desc:    "Mở app ngân hàng bất kỳ, chọn Quét QR và quét mã tương ứng với gói bạn đã chọn.",
    items: [
      "Mở app ngân hàng → Chuyển khoản QR",
      "Quét mã QR hiển thị trên màn hình",
      "Số tiền sẽ được điền tự động",
    ],
    tip: "Kiểm tra số tiền và nội dung trước khi xác nhận.",
  },
  {
    accent:  "amber",
    bgIcon:  "bg-amber-100",
    colIcon: "text-amber-500",
    bar:     "bg-amber-500",
    icon:    FileText,
    title:   "Ghi đúng nội dung CK",
    desc:    "Đây là bước quan trọng nhất. Nội dung chuyển khoản giúp admin xác định giao dịch của bạn.",
    items: [
      "Nội dung dạng: TROTOT [EMAIL] [CREDIT]",
      "Ví dụ: TROTOT NGUYENVAN 20",
      "Bấm Copy để sao chép tự động",
    ],
    tip: "Sai nội dung → admin không thể duyệt, phải liên hệ Zalo thủ công.",
  },
  {
    accent:  "green",
    bgIcon:  "bg-green-100",
    colIcon: "text-green-500",
    bar:     "bg-green-500",
    icon:    Bell,
    title:   "Thông báo & nhận credit",
    desc:    "Sau khi chuyển khoản xong, bấm \"Thông báo đã thanh toán\" để admin xử lý ngay — nhanh hơn nhắn Zalo.",
    items: [
      "Bấm nút \"Thông báo đã thanh toán\"",
      "Hoặc nhắn Zalo kèm nội dung CK",
      "Credit cộng ngay sau khi admin duyệt",
    ],
    tip: "Admin duyệt trong 15 phút, giờ hành chính 8h–17h.",
  },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PaymentGuideModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const total = STEPS.length;
  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / total) * 100;

  // Animate modal in/out
  useEffect(() => {
    if (open) {
      setStep(0);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  const navigate = (dir: "next" | "prev") => {
    const newStep = dir === "next" ? step + 1 : step - 1;
    if (newStep < 0 || newStep >= total) return;
    setSlideDir(dir === "next" ? "left" : "right");
    setSliding(true);
    setTimeout(() => {
      setStep(newStep);
      setSliding(false);
    }, 180);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className={cn("h-full transition-all duration-500 ease-out", current.bar)}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
            Hướng dẫn thanh toán
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{step + 1} / {total}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Step content */}
        <div
          className={cn(
            "px-6 pb-2 pt-3 transition-all duration-180",
            sliding
              ? slideDir === "left"
                ? "opacity-0 -translate-x-4"
                : "opacity-0 translate-x-4"
              : "opacity-100 translate-x-0"
          )}
          style={{ minHeight: 320 }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm",
              current.bgIcon
            )}>
              <Icon size={36} className={current.colIcon} />
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === step
                    ? cn("w-5 h-2", current.bar)
                    : i < step
                    ? "w-2 h-2 bg-gray-400"
                    : "w-2 h-2 bg-gray-200"
                )}
              />
            ))}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{current.title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-4">{current.desc}</p>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {current.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  current.bgIcon
                )}>
                  <Check size={10} className={current.colIcon} strokeWidth={3} />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className={cn("rounded-xl px-3.5 py-2.5", current.bgIcon)}>
            <p className={cn("text-xs font-medium leading-relaxed", current.colIcon)}>
              💡 {current.tip}
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-5 flex items-center gap-3">
          {step > 0 ? (
            <button
              onClick={() => navigate("prev")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-3 py-2.5 rounded-xl hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
              Quay lại
            </button>
          ) : (
            <div />
          )}

          <div className="flex-1">
            {step < total - 1 ? (
              <button
                onClick={() => navigate("next")}
                className={cn(
                  "w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-colors text-sm",
                  step === 0 ? "bg-orange-500 hover:bg-orange-600" :
                  step === 1 ? "bg-blue-500 hover:bg-blue-600" :
                  step === 2 ? "bg-amber-500 hover:bg-amber-600" :
                  "bg-green-500 hover:bg-green-600"
                )}
              >
                Tiếp theo
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Bắt đầu thanh toán
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
