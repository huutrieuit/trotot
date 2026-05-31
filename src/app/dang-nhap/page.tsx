"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function DangNhapForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setError("Sai email hoặc mật khẩu. Vui lòng thử lại.");
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
  };

  return (
    <div className="w-full max-w-md">
      {/* Redirect notice */}
      {redirectTo !== "/" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm text-amber-700">
          <LogIn size={16} className="shrink-0" />
          Vui lòng đăng nhập để tiếp tục.
        </div>
      )}

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
        <p className="text-sm text-gray-500 mt-1">Chào mừng bạn trở lại!</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Đăng nhập bằng Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">hoặc dùng email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600">Mật khẩu</label>
            <Link href="/quen-mat-khau" className="text-xs text-blue-500 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Chưa có tài khoản?{" "}
        <Link
          href={`/dang-ky${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-blue-600 font-semibold hover:underline"
        >
          Đăng ký miễn phí
        </Link>
      </p>
    </div>
  );
}

export default function DangNhapPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold text-blue-600">Trọ</span>
          <span className="text-xl font-bold text-orange-500">Tốt</span>
        </Link>
        <Link href="/dang-ky" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
          Chưa có tài khoản? <span className="font-semibold text-blue-600">Đăng ký</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {/* Suspense required because useSearchParams() needs it */}
        <Suspense fallback={<div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}>
          <DangNhapForm />
        </Suspense>
      </main>
    </div>
  );
}
