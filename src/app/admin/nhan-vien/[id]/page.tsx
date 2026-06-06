import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ShieldCheck, ShieldOff, Phone, Mail,
  Calendar, CreditCard, BadgeCheck, UserCog, KeyRound,
} from "lucide-react";
import StaffDetailActions from "./StaffDetailActions";

interface Props {
  params: Promise<{ id: string }>;
}

function InfoRow({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? "text-orange-600" : "text-gray-800"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function StaffDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();
  if (!me) redirect("/dang-nhap");

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("user_id", me.id).single();
  if (myProfile?.role !== "admin") redirect("/");

  const { data: staff } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, role, credits, blocked, verified_phone, verified_id, created_at")
    .eq("user_id", id)
    .single();

  if (!staff || staff.role !== "sub_admin") notFound();

  // Thử lấy thêm info từ service role (phương thức đăng nhập)
  let loginProvider: string | null = null;
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient.auth.admin.getUserById(id);
    const identities = data?.user?.identities ?? [];
    if (identities.length > 0) {
      const providers = identities.map((i: { provider: string }) => {
        if (i.provider === "google") return "Google";
        if (i.provider === "email") return "Email / Mật khẩu";
        return i.provider;
      });
      loginProvider = providers.join(", ");
    }
  } catch { /* service role chưa cấu hình */ }

  const displayName = staff.full_name || staff.email || "Chưa đặt tên";
  const initial = displayName[0].toUpperCase();
  const joinedDate = new Date(staff.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/admin/nhan-vien"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ChevronLeft size={16} />
        Quay lại danh sách nhân viên
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 ${
            staff.blocked ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-700"
          }`}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {staff.full_name || <span className="text-gray-400 italic font-normal text-base">Chưa đặt tên</span>}
              </h1>
              {staff.blocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                  <ShieldOff size={9} /> Đã khóa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                  <ShieldCheck size={9} /> Hoạt động
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{staff.email || "—"}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                <UserCog size={9} /> Sub Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Info */}
        <div className="space-y-4">
          {/* Contact & account */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Thông tin tài khoản</p>

            <InfoRow icon={Mail}     label="Email"            value={staff.email || "—"} />
            <InfoRow icon={Phone}    label="Số điện thoại"    value={staff.phone || "—"} />
            <InfoRow icon={Calendar} label="Ngày tham gia"    value={joinedDate} />
            {loginProvider && (
              <InfoRow icon={KeyRound} label="Phương thức đăng nhập" value={loginProvider} />
            )}
            <InfoRow
              icon={CreditCard}
              label="Credit hiện có"
              value={`${staff.credits ?? 0} credit`}
              highlight={(staff.credits ?? 0) > 0}
            />
          </div>

          {/* Verification */}
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Xác minh</p>
            <div className="py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} className={staff.verified_phone ? "text-green-500" : "text-gray-300"} />
                  <span className="text-sm text-gray-700">Số điện thoại</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  staff.verified_phone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                }`}>
                  {staff.verified_phone ? "Đã xác minh" : "Chưa xác minh"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} className={staff.verified_id ? "text-green-500" : "text-gray-300"} />
                  <span className="text-sm text-gray-700">CCCD / CMND</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  staff.verified_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                }`}>
                  {staff.verified_id ? "Đã xác minh" : "Chưa xác minh"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Thao tác</p>
            <StaffDetailActions
              userId={staff.user_id}
              name={displayName}
              blocked={staff.blocked ?? false}
            />
          </div>

          {/* Quyền hạn */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quyền hạn Sub Admin</p>
            <div className="space-y-2">
              {[
                { label: "Duyệt / từ chối tin đăng",   allowed: true  },
                { label: "Xóa tin đăng",               allowed: true  },
                { label: "Xem yêu cầu credit",         allowed: true  },
                { label: "Duyệt yêu cầu credit",       allowed: false },
                { label: "Quản lý người dùng",         allowed: false },
                { label: "Quản lý nhân viên",          allowed: false },
                { label: "Thay đổi cài đặt hệ thống",  allowed: false },
              ].map(({ label, allowed }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    allowed ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    <span className={`text-[9px] font-bold ${allowed ? "text-green-600" : "text-gray-400"}`}>
                      {allowed ? "✓" : "✗"}
                    </span>
                  </div>
                  <span className={`text-xs ${allowed ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
