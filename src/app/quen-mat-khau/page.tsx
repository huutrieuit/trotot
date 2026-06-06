"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

export default function QuenMatKhauPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    // PKCE flow: phải đi qua /auth/callback để exchange code trước
    const redirectTo = `${window.location.origin}/auth/callback?next=/dat-lai-mat-khau`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center">
        <Link href="/dang-nhap" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700">
          <ArrowLeft size={18} />
          <span className="text-sm">Quay lại đăng nhập</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MailCheck size={30} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Kiểm tra hộp thư!</h2>
              <p className="text-sm text-gray-500 mb-1">
                Chúng tôi đã gửi link đặt lại mật khẩu đến
              </p>
              <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Không thấy email? Kiểm tra thư mục Spam hoặc{" "}
                <button onClick={() => setSent(false)} className="text-blue-500 hover:underline">
                  thử lại
                </button>.
              </p>
              <Link
                href="/dang-nhap"
                className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Về trang đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Nhập email đã đăng ký – chúng tôi sẽ gửi link đặt lại mật khẩu.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
