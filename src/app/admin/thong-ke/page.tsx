import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Eye, TrendingUp, BarChart2, Users } from "lucide-react";

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default async function ThongKePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  const role = profile?.role;
  if (role !== "admin" && role !== "sub_admin") redirect("/");

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const d7  = new Date(Date.now() - 6  * 86400000).toISOString().slice(0, 10);
  const d30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const [
    { data: todayRows },
    { data: weekRows },
    { data: monthRows },
    { data: chartRows },
    { data: topListings },
  ] = await Promise.all([
    // Lượt xem hôm nay
    admin.from("page_views").select("count").eq("view_date", today),
    // 7 ngày
    admin.from("page_views").select("count").gte("view_date", d7),
    // 30 ngày
    admin.from("page_views").select("count").gte("view_date", d30),
    // Chart: 30 ngày gần nhất theo ngày
    admin
      .from("page_views")
      .select("view_date, count")
      .gte("view_date", d30)
      .order("view_date", { ascending: true }),
    // Top listings theo lượt xem
    admin
      .from("listings")
      .select("id, title, city, view_count, contact_count, status")
      .gt("view_count", 0)
      .order("view_count", { ascending: false })
      .limit(10),
  ]);

  const sum = (rows: { count: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.count ?? 0), 0);

  const todayViews = sum(todayRows);
  const weekViews  = sum(weekRows);
  const monthViews = sum(monthRows);

  // Aggregate chart data by date
  type DayMap = Record<string, number>;
  const dayMap: DayMap = {};
  for (const row of chartRows ?? []) {
    dayMap[row.view_date] = (dayMap[row.view_date] ?? 0) + (row.count ?? 0);
  }

  // Fill last 30 days (including zeros)
  const chartData: { date: string; count: number; label: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    chartData.push({
      date: key,
      count: dayMap[key] ?? 0,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
    });
  }

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Thống kê lượt truy cập</h1>
        <p className="text-sm text-gray-500 mt-0.5">Số người xem website và các tin đăng</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Hôm nay",   value: todayViews, icon: TrendingUp, color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "7 ngày",    value: weekViews,  icon: BarChart2,  color: "text-violet-600", bg: "bg-violet-50" },
          { label: "30 ngày",   value: monthViews, icon: Users,      color: "text-green-600",  bg: "bg-green-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 bg-white shadow-sm">
              <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{formatNum(value)}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart - 30 ngày */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Lượt truy cập 30 ngày gần nhất</h2>
        <div className="flex items-end gap-[3px] h-36 overflow-x-auto no-scrollbar pb-1">
          {chartData.map(({ date, count, label }) => (
            <div key={date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: "24px", flex: "1 0 0" }}>
              <div
                className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                style={{ height: `${Math.max((count / maxCount) * 120, count > 0 ? 4 : 0)}px` }}
                title={`${label}: ${count} lượt`}
              />
              {chartData.length <= 14 && (
                <span className="text-[9px] text-gray-400 rotate-45 origin-left whitespace-nowrap">{label}</span>
              )}
            </div>
          ))}
        </div>
        {chartData.length > 14 && (
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
            <span>{chartData[0].label}</span>
            <span>{chartData[Math.floor(chartData.length / 2)].label}</span>
            <span>{chartData[chartData.length - 1].label}</span>
          </div>
        )}
      </div>

      {/* Top listings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Eye size={15} className="text-gray-400" />
          Top tin được xem nhiều nhất
        </h2>
        {(topListings ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có dữ liệu lượt xem</p>
        ) : (
          <div className="space-y-2">
            {(topListings ?? []).map((listing, idx) => (
              <div key={listing.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  idx === 0 ? "bg-amber-100 text-amber-600" :
                  idx === 1 ? "bg-gray-100 text-gray-500" :
                  idx === 2 ? "bg-orange-100 text-orange-600" :
                  "bg-gray-50 text-gray-400"
                }`}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-xs text-gray-400">{listing.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-blue-600">{formatNum(listing.view_count)}</p>
                  <p className="text-xs text-gray-400">{listing.contact_count} liên hệ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
