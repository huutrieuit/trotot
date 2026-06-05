import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, ShieldCheck, Home, Building2 } from "lucide-react";
import RoleSelect from "./RoleSelect";
import CreditInput from "./CreditInput";

const ROLE_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  admin:     { label: "Admin",      className: "bg-red-100 text-red-700",       icon: ShieldCheck },
  sub_admin: { label: "Sub Admin",  className: "bg-orange-100 text-orange-700", icon: ShieldCheck },
  landlord:  { label: "Chủ nhà",   className: "bg-amber-100 text-amber-700",   icon: Building2 },
  tenant:    { label: "Người thuê", className: "bg-blue-100 text-blue-700",    icon: Home },
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: users } = await supabase
    .from("profiles")
    .select("user_id, full_name, phone, role, credits, verified_phone, verified_id, created_at")
    .order("created_at", { ascending: false });

  // Lấy email từ auth.users qua admin API — dùng service_role nếu có,
  // hoặc chỉ hiển thị user_id rút gọn
  const rows = users ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Users size={22} className="text-purple-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-sm text-gray-500">{rows.length} tài khoản</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Họ tên</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SĐT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Xác minh</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((u) => {
                const roleCfg = ROLE_BADGE[u.role] ?? ROLE_BADGE.tenant;
                const RoleIcon = roleCfg.icon;
                const isMe = u.user_id === user.id;
                return (
                  <tr key={u.user_id} className={`hover:bg-gray-50/50 transition-colors ${isMe ? "bg-blue-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs shrink-0">
                          {(u.full_name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.full_name || <span className="text-gray-400 italic">Chưa đặt tên</span>}
                            {isMe && <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Bạn</span>}
                          </p>
                          <p className="text-[11px] text-gray-400">{u.user_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleCfg.className}`}>
                          <RoleIcon size={10} />
                          {roleCfg.label}
                        </span>
                        {!isMe && (
                          <RoleSelect userId={u.user_id} currentRole={u.role as "tenant" | "landlord" | "admin"} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CreditInput userId={u.user_id} currentCredits={u.credits ?? 0} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={u.verified_phone ? "text-green-600" : "text-gray-300"}>SĐT {u.verified_phone ? "✓" : "✗"}</span>
                        <span className={u.verified_id ? "text-green-600" : "text-gray-300"}>CCCD {u.verified_id ? "✓" : "✗"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
