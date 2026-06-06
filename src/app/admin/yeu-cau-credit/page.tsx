import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import CreditRequestCard from "./CreditRequestCard";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:  { label: "Chờ duyệt",  className: "bg-amber-100 text-amber-700" },
  approved: { label: "Đã duyệt",   className: "bg-green-100 text-green-700" },
  rejected: { label: "Từ chối",    className: "bg-gray-100 text-gray-500" },
};

export default async function YeuCauCreditPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "sub_admin") redirect("/");

  const { status } = await searchParams;
  const statusFilter = status && ["pending", "approved", "rejected"].includes(status) ? status : "pending";

  const { data } = await supabase
    .from("credit_requests")
    .select("*")
    .eq("status", statusFilter)
    .order("created_at", { ascending: false });

  const { count: pendingCount } = await supabase
    .from("credit_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const requests = data ?? [];

  const FILTERS = [
    { value: "pending",  label: `Chờ duyệt${pendingCount ? ` (${pendingCount})` : ""}` },
    { value: "approved", label: "Đã duyệt" },
    { value: "rejected", label: "Từ chối" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap size={22} className="text-orange-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Yêu cầu nạp credit</h1>
          <p className="text-sm text-gray-500">
            {pendingCount ? `${pendingCount} yêu cầu đang chờ duyệt` : "Không có yêu cầu nào chờ duyệt"}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(({ value, label }) => (
          <a
            key={value}
            href={`/admin/yeu-cau-credit?status=${value}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === value
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Zap size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-500">
            {statusFilter === "pending" ? "Không có yêu cầu nào đang chờ" : "Không có dữ liệu"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {statusFilter !== "pending" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gói</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiền</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((r) => {
                    const st = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs text-gray-700">{r.user_email}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.package_name}</td>
                        <td className="px-4 py-3 text-xs font-bold text-orange-500">{r.credits}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-600">{r.amount.toLocaleString("vi-VN")}đ</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {statusFilter === "pending" && requests.map((r) => (
            <CreditRequestCard
              key={r.id}
              id={r.id}
              userId={r.user_id}
              userEmail={r.user_email}
              packageName={r.package_name}
              credits={r.credits}
              amount={r.amount}
              createdAt={r.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
