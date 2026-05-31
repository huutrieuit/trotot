"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusSquare, LayoutList, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  citySlug: string;
}

export default function BottomNav({ citySlug }: Props) {
  const pathname = usePathname();
  const base = `/${citySlug}`;

  const TABS = [
    { href: base, icon: Home, label: "Trang chủ" },
    { href: `${base}/tim-phong`, icon: Search, label: "Tìm phòng" },
    { href: `${base}/dang-tin`, icon: PlusSquare, label: "Đăng tin" },
    { href: `${base}/dashboard`, icon: LayoutList, label: "Tin của tôi" },
    { href: `${base}/tai-khoan`, icon: User, label: "Tài khoản" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors",
                active ? "text-blue-600" : "text-gray-400")}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
