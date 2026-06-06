"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Home, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { InAppBrowserWarning, useInAppBrowser } from "@/components/InAppBrowserWarning";

type Role = "tenant" | "landlord";

const PENDING_REF_KEY = "trotot_pending_ref";

export default function DangKyPage() {
  const [role, setRole] = useState<Role>("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirm: "", fullName: "" });
  const [error, setError] = useState("");
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const inAppBrowser = useInAppBrowser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setPendingRef(ref.toUpperCase());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, role },
      },
    });
    setLoading(false);
    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("already exists")) {
        setError("Email này đã được đăng ký rồi. Hãy đăng nhập hoặc dùng email khác.");
      } else if (msg.includes("invalid email")) {
        setError("Email không hợp lệ.");
      } else if (msg.includes("password")) {
        setError("Mật khẩu không hợp lệ.");
      } else {
        setError(signUpError.message);
      }
      return;
    }
    if (pendingRef) localStorage.setItem(PENDING_REF_KEY, pendingRef);
    setDone(true);
  };

  const handleGoogle = async () => {
    if (inAppBrowser) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold text-blue-600">Trọ</span>
          <span className="text-xl font-bold text-orange-500">Tốt</span>
        </Link>
        <Link href="/dang-nhap" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          Đã có tài khoản? <span className="font-semibold text-blue-600">Đăng nhập</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {done ? (
            <div className="text-center py-10">
              <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Kiểm tra hộp thư <span className="font-semibold text-gray-700">{form.email}</span> để xác minh tài khoản trước khi đăng nhập.
              </p>
              <Link href="/dang-nhap"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                Đến trang đăng nhập
              </Link>
            </div>
          ) : (
          <>
          {/* Referral banner */}
          {pendingRef && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-4 text-sm text-purple-700">
              <span className="text-base">🎁</span>
              <div>
                <span className="font-semibold">Bạn được mời bởi bạn bè!</span>{" "}
                Đăng ký ngay để cả 2 nhận <strong>+2 credit</strong> miễn phí.
              </div>
            </div>
          )}

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
            <p className="text-sm text-gray-500 mt-1">Miễn phí – không cần thẻ tín dụng</p>
          </div>

          {/* In-app browser warning */}
          <InAppBrowserWarning />

          {/* Role picker – đặt trước cả Google và Email để áp dụng cho cả 2 */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Bạn muốn làm gì?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("tenant")}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all",
                  role === "tenant"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <Home size={24} className={role === "tenant" ? "text-blue-600" : "text-gray-400"} />
                <span className={cn("text-sm font-semibold", role === "tenant" ? "text-blue-700" : "text-gray-600")}>
                  Tìm phòng thuê
                </span>
                <span className="text-[11px] text-gray-400 text-center">Tôi cần tìm phòng trọ</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("landlord")}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all",
                  role === "landlord"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <Building2 size={24} className={role === "landlord" ? "text-orange-500" : "text-gray-400"} />
                <span className={cn("text-sm font-semibold", role === "landlord" ? "text-orange-600" : "text-gray-600")}>
                  Cho thuê phòng
                </span>
                <span className="text-[11px] text-gray-400 text-center">Tôi có phòng cho thuê</span>
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={inAppBrowser}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng ký bằng Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">hoặc dùng email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Họ và tên</label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Bằng cách đăng ký, bạn đồng ý với{" "}
            <Link href="/chinh-sach" className="text-blue-500 hover:underline">Điều khoản sử dụng</Link>{" "}
            và{" "}
            <Link href="/chinh-sach" className="text-blue-500 hover:underline">Chính sách bảo mật</Link>.
          </p>
          </>
          )}
        </div>
      </main>
    </div>
  );
}
