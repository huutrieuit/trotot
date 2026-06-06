import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Mail, Phone, Calendar, Zap, BadgeCheck,
  KeyRound, ShieldOff, ShieldCheck, Building2, Home,
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import RoleSelect from "../RoleSelect";
import CreditInput from "../CreditInput";
import UserActions from "../UserActions";

interface Props { params: Promise<{ id: string }> }

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  admin:     { label: "Admin",        cls: "bg-red-100 text-red-700" },
  sub_admin: { label: "Sub Admin",    cls: "bg-purple-100 text-purple-700" },
  landlord:  { label: "Chủ nhà",     cls: "bg-amber-100 text-amber-700" },
  tenant:    { label: "Người thuê",  cls: "bg-blue-100 text-blue-700" },
};

const LISTING_STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  active:   { label: "Đang hiện",  cls: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  pending:  { label: "Chờ duyệt",  cls: "bg-yellow-100 text-yellow-700", icon: Clock },
  hidden:   { label: "Đã ẩn",      cls: "bg-gray-100 text-gray-500",    icon: XCircle },
  rejected: { label: "Từ chối",    cls: "bg-red-100 text-red-600",      icon: AlertCircle },
};

const CREDIT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Đã duyệt",  cls: "bg-green-100 text-green-700" },
  rejected: { label: "Từ chối",   cls: "bg-red-100 text-red-600" },
};

function fmt(n: number) { return n.toLocaleString("vi-VN") + "đ"; }

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user: me } } = await supabase.auth.getUser();
  if (!me) redirect("/dang-nhap");

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("user_id", me.id).single();
  if (myProfile?.role !== "admin") redirect("/");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, phone, role, credits, blocked, verified_phone, verified_id, created_at")
    .eq("user_id", id)
    .single();

  if (!profile) notFound();

  // Fetch credit requests, listings — song song
  const [{ data: creditRequests }, { data: listings }] = await Promise.all([
    supabase
      .from("credit_requests")
      .select("id, package_name, credits, amount, status, created_at, resolved_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    profile.role === "landlord" || profile.role === "admin" || profile.role === "sub_admin"
      ? supabase
          .from("listings")
          .select("id, title, address, price, status, created_at")
          .eq("landlord_id", id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  // Login method từ service role
  let loginProvider: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(id);
    const identities = data?.user?.identities ?? [];
    loginProvider = identities.map((i: { provider: string }) =>
      i.provider === "google" ? "Google" : "Email / Mật khẩu"
    ).join(", ") || null;
  } catch { /* service role không khả dụng */ }

  const displayName = profile.full_name || profile.email || "Chưa đặt tên";
  const initial = displayName[0].toUpperCase();
  const roleCfg = ROLE_LABEL[profile.role] ?? ROLE_LABEL.tenant;
  const isMe = id === me.id;
  const joinedDate = new Date(profile.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ChevronLeft size={16} />
        Quay lại danh sách người dùng
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${
            profile.blocked ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
          }`}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {profile.full_name || <span className="text-gray-400 italic font-normal text-base">Chưa đặt tên</span>}
              </h1>
              {isMe && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">Bạn</span>}
              {profile.blocked
                ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0"><ShieldOff size={9} />Đã khóa</span>
                : <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0"><ShieldCheck size={9} />Hoạt động</span>
              }
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleCfg.cls} shrink-0`}>
                {roleCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{profile.email || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ── Cột trái (2/3) ── */}
        <div className="md:col-span-2 space-y-4">

          {/* Thông tin cá nhân */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Thông tin tài khoản</p>
            <div className="space-y-3">
              {[
                { icon: Mail,     label: "Email",             value: profile.email || "—" },
                { icon: Phone,    label: "Số điện thoại",     value: profile.phone || "—" },
                { icon: Calendar, label: "Ngày tham gia",     value: joinedDate },
                ...(loginProvider ? [{ icon: KeyRound, label: "Đăng nhập bằng", value: loginProvider }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-400 block">{label}</span>
                    <span className="text-sm font-medium text-gray-800 truncate block">{value}</span>
                  </div>
                </div>
              ))}

              {/* Xác minh */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <BadgeCheck size={13} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-400 block mb-1">Xác minh</span>
                  <div className="flex gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${profile.verified_phone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      SĐT {profile.verified_phone ? "✓" : "✗"}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${profile.verified_id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      CCCD {profile.verified_id ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lịch sử credit */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lịch sử nạp credit</p>
              <span className="text-xs text-gray-400">{creditRequests?.length ?? 0} yêu cầu</span>
            </div>
            {!creditRequests?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">Chưa có yêu cầu nào</p>
            ) : (
              <div className="space-y-2">
                {creditRequests.map((r) => {
                  const st = CREDIT_STATUS[r.status] ?? CREDIT_STATUS.pending;
                  return (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.package_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("vi-VN")}
                          {r.resolved_at && ` → ${new Date(r.resolved_at).toLocaleDateString("vi-VN")}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">+{r.credits} credit</p>
                        <p className="text-xs text-gray-400">{fmt(r.amount)}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tin đăng (nếu có) */}
          {!!listings?.length && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tin đăng</p>
                <span className="text-xs text-gray-400">{listings.length} tin</span>
              </div>
              <div className="space-y-2">
                {listings.map((l) => {
                  const st = LISTING_STATUS[l.status] ?? LISTING_STATUS.hidden;
                  const Icon = st.icon;
                  return (
                    <div key={l.id} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{l.title || "Không có tiêu đề"}</p>
                        <p className="text-xs text-gray-400 truncate">{l.address}</p>
                        <p className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-orange-600">{fmt(l.price)}/th</p>
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${st.cls}`}>
                          <Icon size={8} />{st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Cột phải (1/3) ── */}
        <div className="space-y-4">
          {/* Credit */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Credit</p>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{profile.credits ?? 0}</span>
              <span className="text-sm text-gray-400">credit</span>
            </div>
            <CreditInput userId={profile.user_id} currentCredits={profile.credits ?? 0} />
          </div>

          {/* Vai trò */}
          {!isMe && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vai trò</p>
              <RoleSelect
                userId={profile.user_id}
                currentRole={profile.role as "tenant" | "landlord" | "admin" | "sub_admin"}
              />
            </div>
          )}

          {/* Thao tác */}
          {!isMe && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Thao tác</p>
              <UserActions
                userId={profile.user_id}
                name={displayName}
                blocked={profile.blocked ?? false}
                isSelf={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
