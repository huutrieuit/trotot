"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search, LogOut, User, ChevronDown, LayoutList, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface AuthUser {
  name: string;
  avatar_url: string | null;
  credits: number | null;
  role: string | null;
}

interface Props {
  citySlug: string;
  cityName: string;
  user?: AuthUser | null;
}

export default function Header({ citySlug, cityName, user }: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const base = `/${citySlug}`;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    setDrawerOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = user?.name?.trim()?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={base} className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-blue-600">Trọ</span>
            <span className="text-xl font-bold text-orange-500">Tốt</span>
            <span className="hidden sm:inline text-xs text-gray-400 ml-1 font-normal">{cityName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href={`${base}/tim-phong`} className="hover:text-blue-600 transition-colors">Tìm phòng</Link>
            <Link href={`${base}/dang-tin`} className="hover:text-blue-600 transition-colors">Đăng tin</Link>
            <Link href="/gia-ca" className="hover:text-blue-600 transition-colors">Bảng giá</Link>
            {(user?.role === "admin" || user?.role === "sub_admin") && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 text-white bg-gray-900 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <ShieldCheck size={13} className="text-orange-400" />
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                  {user.credits !== null && (
                    <span className="text-[11px] font-semibold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                      {user.credits} cr
                    </span>
                  )}
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      {user.credits !== null && (
                        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Credit hiện tại</span>
                          <span className="text-sm font-bold text-orange-500">{user.credits} credit</span>
                        </div>
                      )}
                      <Link href={`${base}/dashboard`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutList size={15} />
                        Tin đăng của tôi
                      </Link>
                      <Link href={`${base}/tai-khoan`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={15} />
                        Tài khoản của tôi
                      </Link>
                      <Link href={`${base}/mua-credit`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50">
                        <CreditCard size={15} />
                        Mua thêm credit
                      </Link>
                      {(user.role === "admin" || user.role === "sub_admin") && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-900 font-semibold hover:bg-gray-900 hover:text-white rounded-lg mx-1 transition-colors">
                            <ShieldCheck size={15} className="text-orange-400" />
                            Trang quản trị
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <LogOut size={15} />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/dang-nhap" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Đăng nhập</Link>
                <Link href="/dang-ky" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Đăng ký</Link>
              </>
            )}
          </div>

          {/* Mobile icons */}
          <div className="flex md:hidden items-center gap-2">
            <Link href={`${base}/tim-phong`} className="p-2 text-gray-500"><Search size={20} /></Link>
            <button onClick={() => setDrawerOpen(true)} className="p-2 text-gray-500" aria-label="Mở menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setDrawerOpen(false)} />}

      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg">
            <span className="text-blue-600">Trọ</span><span className="text-orange-500">Tốt</span>
            <span className="text-xs text-gray-400 ml-1 font-normal">{cityName}</span>
          </span>
          <button onClick={() => setDrawerOpen(false)} className="p-1 text-gray-500"><X size={22} /></button>
        </div>

        {/* Mobile user info */}
        {user && (
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-3 mb-2">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <Link href={`${base}/tai-khoan`} onClick={() => setDrawerOpen(false)}
                  className="text-xs text-blue-600">Xem tài khoản</Link>
              </div>
            </div>
            {user.credits !== null && (
              <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-100">
                <span className="text-xs text-gray-500">Credit của tôi</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-orange-500">{user.credits} credit</span>
                  <Link href={`${base}/mua-credit`} onClick={() => setDrawerOpen(false)}
                    className="text-[11px] font-semibold text-white bg-orange-500 hover:bg-orange-600 px-2 py-0.5 rounded-full transition-colors">
                    Mua thêm
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="p-4 flex flex-col gap-1">
          {[
            { href: `${base}/tim-phong`, label: "Tìm phòng" },
            { href: `${base}/dang-tin`, label: "Đăng tin cho thuê" },
            ...(user ? [{ href: `${base}/dashboard`, label: "Tin đăng của tôi" }] : []),
            { href: "/gia-ca", label: "Bảng giá" },
            ...(!user ? [
              { href: "/dang-nhap", label: "Đăng nhập" },
              { href: "/dang-ky", label: "Đăng ký" },
            ] : []),
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
              className="px-3 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
              {item.label}
            </Link>
          ))}

          {user && (user.role === "admin" || user.role === "sub_admin") && (
            <Link href="/admin" onClick={() => setDrawerOpen(false)}
              className="px-3 py-3 rounded-lg text-gray-900 bg-gray-900 text-white hover:bg-gray-800 font-semibold transition-colors flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-400" />
              Trang quản trị
            </Link>
          )}

          {user && (
            <button onClick={handleLogout}
              className="px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-colors text-left flex items-center gap-2">
              <LogOut size={16} />
              Đăng xuất
            </button>
          )}
        </nav>

        <div className="absolute bottom-8 left-4 right-4">
          <Link href={`${base}/dang-tin`} onClick={() => setDrawerOpen(false)}
            className="block w-full bg-orange-500 text-white text-center font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors">
            Đăng tin miễn phí
          </Link>
        </div>
      </div>
    </>
  );
}
