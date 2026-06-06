import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ListChecks, Users, LayoutDashboard, PlusSquare, TrendingUp, Clock, Settings, Zap } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  const role = profile?.role;
  if (role !== "admin" && role !== "sub_admin") redirect("/");
  const isFullAdmin = role === "admin";

  const [
    { count: totalListings },
    { count: pendingListings },
    { count: activeListings },
    { count: totalUsers },
    { count: pendingCredits },
  ] = await Promise.all([
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("credit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats = [
    { label: "Tổng tin đăng",   value: totalListings ?? 0,  icon: LayoutDashboard, color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Chờ duyệt tin",   value: pendingListings ?? 0, icon: Clock,           color: "text-amber-600",  bg: "bg-amber-50",  href: "/admin/duyet-tin" },
    { label: "Đang hiển thị",   value: activeListings ?? 0,  icon: TrendingUp,      color: "text-green-600",  bg: "bg-green-50" },
    { label: "Yêu cầu credit",  value: pendingCredits ?? 0,  icon: Zap,             color: "text-orange-600", bg: "bg-orange-50", href: "/admin/yeu-cau-credit" },
  ];

  const quickLinks = [
    { href: "/admin/duyet-tin",      icon: ListChecks, label: "Duyệt tin đăng",      desc: `${pendingListings ?? 0} tin đang chờ`,    color: "border-amber-200 hover:border-amber-400",  adminOnly: false },
    { href: "/admin/yeu-cau-credit", icon: Zap,        label: "Yêu cầu nạp credit",  desc: `${pendingCredits ?? 0} đang chờ duyệt`,   color: "border-orange-200 hover:border-orange-400", adminOnly: false },
    { href: "/admin/users",          icon: Users,      label: "Quản lý người dùng",  desc: `${totalUsers ?? 0} tài khoản`,             color: "border-purple-200 hover:border-purple-400", adminOnly: true },
    { href: "/admin/cai-dat",        icon: Settings,   label: "Cài đặt",             desc: "Ngân hàng, Zalo hỗ trợ",                  color: "border-gray-200 hover:border-gray-400",    adminOnly: false },
  ].filter((l) => !l.adminOnly || isFullAdmin);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">TrọTốt Admin Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => {
          const card = (
            <div className={`${bg} rounded-2xl p-4 text-center ${href ? "hover:opacity-80 transition-opacity cursor-pointer" : ""}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 bg-white shadow-sm`}>
                <Icon size={18} className={color} />
              </div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
            </div>
          );
          return href ? <Link key={label} href={href}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tác vụ nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickLinks.map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href}
            className={`bg-white rounded-2xl border-2 p-4 flex items-start gap-3 transition-colors ${color}`}>
            <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
