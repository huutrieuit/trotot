import Link from "next/link";
import { ShieldCheck, LayoutDashboard, PlusSquare, ListChecks, Users } from "lucide-react";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/admin/dang-tin", icon: PlusSquare, label: "Đăng tin" },
  { href: "/admin/duyet-tin", icon: ListChecks, label: "Duyệt tin" },
  { href: "/admin/users", icon: Users, label: "Người dùng" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Admin topbar */}
      <header className="bg-gray-900 text-white h-14 flex items-center px-4 gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-orange-400" />
          <span className="font-bold text-sm">
            <span className="text-blue-400">Trọ</span>
            <span className="text-orange-400">Tốt</span>
            <span className="text-gray-400 font-normal ml-1.5">Admin</span>
          </span>
        </div>

        <nav className="flex items-center gap-1 ml-4">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Về trang chủ
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
