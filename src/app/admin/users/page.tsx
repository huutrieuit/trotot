import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, ShieldCheck, Home, Building2, ShieldOff } from "lucide-react";
import RoleSelect from "./RoleSelect";
import CreditInput from "./CreditInput";
import UserActions from "./UserActions";

const ROLE_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  admin:     { label: "Admin",      className: "bg-red-100 text-red-700",       icon: ShieldCheck },
  sub_admin: { label: "Sub Admin",  className: "bg-purple-100 text-purple-700", icon: ShieldCheck },
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
    .select("user_id, full_name, email, phone, role, credits, blocked, verified_phone, verified_id, created_at")
    .order("created_at", { ascending: false });

  const rows = users ?? [];
  const blockedCount = rows.filter((u) => u.blocked).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-purple-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Người dùng</h1>
            <p className="text-sm text-gray-500">
              {rows.length} tài khoản
              {blockedCount > 0 && <span className="ml-2 text-red-500">· {blockedCount} đang bị khóa</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Người dùng</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SĐT</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vai trò</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Xác minh</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tham gia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((u) => {
                const roleCfg = ROLE_BADGE[u.role] ?? ROLE_BADGE.tenant;
                const RoleIcon = roleCfg.icon;
                const isMe = u.user_id === user.id;
                return (
                  <tr key={u.user_id} className={`hover:bg-gray-50/50 transition-colors ${u.blocked ? "bg-red-50/30" : isMe ? "bg-blue-50/30" : ""}`}>
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${u.blocked ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                          {(u.full_name || u.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900">
                              {u.full_name || <span className="text-gray-400 italic text-xs">Chưa đặt tên</span>}
                            </p>
                            {isMe && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">Bạn</span>}
                            {u.blocked && <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold"><ShieldOff size={8} />Đã khóa</span>}
                          </div>
                          <p className="text-[11px] text-gray-400">{u.email || u.user_id.slice(0, 12) + "…"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{u.phone || <span className="text-gray-300">—</span>}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleCfg.className}`}>
                          <RoleIcon size={10} />
                          {roleCfg.label}
                        </span>
                        {!isMe && (
                          <RoleSelect userId={u.user_id} currentRole={u.role as "tenant" | "landlord" | "admin" | "sub_admin"} />
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

                    <td className="px-4 py-3">
                      <UserActions
                        userId={u.user_id}
                        name={u.full_name || u.email || u.user_id.slice(0, 8)}
                        blocked={u.blocked ?? false}
                        isSelf={isMe}
                      />
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
