import Link from "next/link";
import { Check, Zap, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const PACKAGES = [
  { name: "Gói Cơ bản", credits: 5, price: 25_000, pricePerCredit: 5_000, badge: "", highlight: false },
  { name: "Gói Tiêu chuẩn", credits: 20, price: 80_000, pricePerCredit: 4_000, badge: "Phổ biến", highlight: true },
  { name: "Gói Cao cấp", credits: 50, price: 150_000, pricePerCredit: 3_000, badge: "Tiết kiệm nhất", highlight: false },
];

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function GiaCaPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("key, value");
  const zalo = (settings ?? []).find((r) => r.key === "zalo")?.value ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          <Zap size={14} />
          Hệ thống Credit
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Bảng giá Credit</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Dùng credit để xem số điện thoại chủ nhà. Mỗi lần xem tốn 1 credit.
          Credit không có hạn sử dụng.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: "1", text: "Mua credit theo gói phù hợp" },
          { icon: "2", text: "Tìm phòng ưng ý trên TrọTốt" },
          { icon: "3", text: "Dùng 1 credit xem SĐT chủ nhà" },
        ].map((step) => (
          <div key={step.icon} className="bg-gray-50 rounded-2xl p-4 text-center">
            <div className="w-8 h-8 bg-orange-500 text-white text-sm font-bold rounded-full flex items-center justify-center mx-auto mb-2">
              {step.icon}
            </div>
            <p className="text-xs text-gray-600">{step.text}</p>
          </div>
        ))}
      </div>

      {/* Packages */}
      <h2 className="font-semibold text-gray-900 mb-4 text-lg">Chọn gói</h2>
      <div className="space-y-4 mb-8">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.name}
            className={`relative bg-white rounded-2xl border-2 p-5 ${pkg.highlight ? "border-orange-400 shadow-md" : "border-gray-200"}`}
          >
            {pkg.badge && (
              <span className={`absolute -top-3 left-5 text-[11px] font-bold px-3 py-0.5 rounded-full ${pkg.highlight ? "bg-orange-500 text-white" : "bg-blue-500 text-white"}`}>
                {pkg.badge}
              </span>
            )}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{pkg.name}</p>
                <p className="text-2xl font-bold text-orange-500 mt-0.5">{pkg.credits} credit</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(pkg.pricePerCredit)} / credit</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{fmt(pkg.price)}</p>
                <p className="text-xs text-gray-400">một lần thanh toán</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
              {[
                `Xem được ${pkg.credits} số điện thoại`,
                "Không hết hạn",
                "Áp dụng toàn quốc",
              ].map((feat) => (
                <span key={feat} className="flex items-center gap-1 text-xs text-gray-500">
                  <Check size={11} className="text-green-500 shrink-0" />
                  {feat}
                </span>
              ))}
            </div>
            <Link
              href="/da-nang/mua-credit"
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${pkg.highlight ? "bg-orange-500 hover:bg-orange-600 text-white" : "border border-gray-200 hover:border-orange-300 text-gray-700"}`}
            >
              Mua ngay <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      {/* Refund guarantee */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex gap-3">
        <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">Cam kết hoàn credit</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Nếu số điện thoại không liên lạc được, báo cáo trong trang chi tiết — admin sẽ hoàn 1 credit trong 24h.
          </p>
        </div>
      </div>

      {/* Free credits note */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8 flex gap-3">
        <Zap size={18} className="text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Tặng 3 credit khi đăng ký</p>
          <p className="text-xs text-green-600 mt-0.5">Tài khoản mới nhận ngay 3 credit miễn phí để thử xem số điện thoại.</p>
        </div>
      </div>

      {/* FAQ */}
      <h2 className="font-semibold text-gray-900 mb-4 text-lg">Câu hỏi thường gặp</h2>
      <div className="space-y-3">
        {[
          {
            q: "Credit có hết hạn không?",
            a: "Không. Credit không có hạn sử dụng, dùng đến khi nào hết thì thôi.",
          },
          {
            q: "Xem lại số điện thoại đã xem có tốn credit không?",
            a: "Không. Mỗi số điện thoại chỉ tốn 1 credit lần đầu. Xem lại hoàn toàn miễn phí.",
          },
          {
            q: "Thanh toán bằng cách nào?",
            a: "Chuyển khoản ngân hàng. Sau khi chuyển, gửi ảnh biên lai qua Zalo — admin sẽ cộng credit trong 15 phút (giờ hành chính).",
          },
          {
            q: "Có hoàn tiền không?",
            a: "Credit không hoàn tiền sau khi đã được cộng vào tài khoản.",
          },
        ].map((item) => (
          <div key={item.q} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="font-semibold text-gray-900 text-sm mb-1.5">{item.q}</p>
            <p className="text-sm text-gray-500">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-2">Cần hỗ trợ?</p>
        <a href={`tel:${zalo}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
          <Phone size={15} />
          Liên hệ Zalo hỗ trợ
        </a>
      </div>
    </div>
  );
}
