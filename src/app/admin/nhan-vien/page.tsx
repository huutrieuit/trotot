import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserCog, ShieldCheck, ShieldOff, PlusCircle, Eye } from "lucide-react";
import StaffActions from "./StaffActions";
import Link from "next/link";

export default async function NhanVienPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: me } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (me?.role !== "admin") redirect("/");

  const { data: staff } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, role, blocked, created_at")
    .eq("role", "sub_admin")
    .order("created_at", { ascending: false });

  const rows = staff ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog size={22} className="text-purple-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhân viên</h1>
            <p className="text-sm text-gray-500">{rows.length} sub-admin đang hoạt động</p>
          </div>
        </div>
        {/* Hướng dẫn thêm nhân viên */}
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors"
        >
          <PlusCircle size={15} />
          Thêm nhân viên
        </Link>
      </div>

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700">
        Để thêm nhân viên, vào <strong>Người dùng</strong> → đổi vai trò thành <strong>Sub Admin</strong>.
        Nhân viên có thể duyệt tin, quản lý tin nhưng không thể quản lý người dùng hay thay đổi cài đặt.
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <UserCog size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có nhân viên nào</p>
          <p className="text-sm text-gray-400 mt-1">Vào trang Người dùng để đổi vai trò thành Sub Admin.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nhân viên</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày thêm</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((s) => (
                  <tr key={s.user_id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Info — clickable → detail page */}
                    <td className="px-4 py-3">
                      <Link href={`/admin/nhan-vien/${s.user_id}`} className="flex items-center gap-3 group">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${s.blocked ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-700"}`}>
                          {(s.full_name || s.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                            {s.full_name || <span className="text-gray-400 italic text-xs">Chưa đặt tên</span>}
                          </p>
                          <p className="text-xs text-gray-400">{s.email || s.user_id.slice(0, 12) + "…"}</p>
                        </div>
                      </Link>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {s.blocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          <ShieldOff size={10} /> Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <ShieldCheck size={10} /> Hoạt động
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/nhan-vien/${s.user_id}`}
                          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={11} />
                          Xem
                        </Link>
                        <StaffActions
                          userId={s.user_id}
                          name={s.full_name || s.email || s.user_id.slice(0, 8)}
                          blocked={s.blocked ?? false}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
