import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCityConfig } from "@/config/cities";
import MuaCreditClient from "./MuaCreditClient";

interface Props {
  params: Promise<{ city: string }>;
}

const PACKAGES = [
  { id: "starter",  name: "Gói Cơ bản",      credits: 5,  price: 25_000,  pricePerCredit: 5_000, popular: false, badge: "" },
  { id: "standard", name: "Gói Tiêu chuẩn",  credits: 20, price: 80_000,  pricePerCredit: 4_000, popular: true,  badge: "Phổ biến" },
  { id: "pro",      name: "Gói Cao cấp",      credits: 50, price: 150_000, pricePerCredit: 3_000, popular: false, badge: "Tiết kiệm nhất" },
];

export default async function MuaCreditPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/dang-nhap?redirect=/${citySlug}/mua-credit`);

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("credits").eq("user_id", user.id).single(),
    supabase.from("site_settings").select("key, value"),
  ]);

  const currentCredits = profile?.credits ?? 0;
  const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));
  const BANK = {
    name:    s.bank_name    ?? "Vietcombank",
    account: s.bank_account ?? "",
    owner:   s.bank_owner   ?? "",
    branch:  s.bank_branch  ?? "",
  };
  const ZALO = s.zalo ?? "";
  const QR_URLS: Record<string, string> = {
    starter:  s.qr_starter  ?? "",
    standard: s.qr_standard ?? "",
    pro:      s.qr_pro      ?? "",
  };
  const SHOW_PHONE_SUPPORT   = s.show_phone_support   === "true";
  const SHOW_MANUAL_TRANSFER = s.show_manual_transfer === "true";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${citySlug}/tai-khoan`} className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mua Credit</h1>
          <p className="text-sm text-gray-500">Credit dùng để xem số điện thoại phòng trọ</p>
        </div>
      </div>

      {/* Current credits */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-500" />
          <span className="text-sm font-medium text-orange-700">Credit hiện tại của bạn</span>
        </div>
        <span className="text-lg font-bold text-orange-500">{currentCredits} credit</span>
      </div>

      <MuaCreditClient
        packages={PACKAGES}
        userEmail={user.email ?? ""}
        bank={BANK}
        zalo={ZALO}
        qrUrls={QR_URLS}
        showPhoneSupport={SHOW_PHONE_SUPPORT}
        showManualTransfer={SHOW_MANUAL_TRANSFER}
      />
    </div>
  );
}
