import Link from "next/link";
import { ShieldCheck, LayoutDashboard, PlusSquare, ListChecks, Users, LayoutList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const ALL_NAV = [
  { href: "/admin",            icon: LayoutDashboard, label: "Tổng quan",    adminOnly: false },
  { href: "/admin/dang-tin",   icon: PlusSquare,      label: "Đăng tin",     adminOnly: false },
  { href: "/admin/duyet-tin",  icon: ListChecks,      label: "Duyệt tin",    adminOnly: false },
  { href: "/admin/quan-ly-tin",icon: LayoutList,      label: "Quản lý tin",  adminOnly: false },
  { href: "/admin/users",      icon: Users,           label: "Người dùng",   adminOnly: true  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = "guest";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    role = profile?.role ?? "guest";
  }
  const isFullAdmin = role === "admin";
  const nav = ALL_NAV.filter((item) => !item.adminOnly || isFullAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin topbar */}
      <header className="bg-gray-900 text-white h-14 flex items-center px-4 gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck size={18} className="text-orange-400" />
          <span className="font-bold text-sm">
            <span className="text-blue-400">Trọ</span>
            <span className="text-orange-400">Tốt</span>
            <span className="text-gray-400 font-normal ml-1.5">
              {isFullAdmin ? "Admin" : "Sub Admin"}
            </span>
          </span>
        </div>

        <nav className="flex items-center gap-1 ml-4 overflow-x-auto no-scrollbar">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap">
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto shrink-0">
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Trang chủ
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
