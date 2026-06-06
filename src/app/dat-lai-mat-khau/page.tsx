"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DatLaiMatKhauPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  // 3 states: "checking" | "ready" | "expired"
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");

  useEffect(() => {
    // Với PKCE flow: session đã được set bởi /auth/callback trước khi vào trang này
    // Chỉ cần kiểm tra getUser() thay vì đợi onAuthStateChange
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStatus(user ? "ready" : "expired");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự."); return; }
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    // Đăng xuất sau khi đổi pass để bắt buộc đăng nhập lại
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
    setTimeout(() => router.push("/dang-nhap"), 2500);
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center">
        <Link href="/dang-nhap" className="text-sm text-gray-500 hover:text-gray-700">← Đăng nhập</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {status === "checking" && (
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Đang xác thực link…</p>
            </div>
          )}

          {status === "expired" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={30} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Link đã hết hạn</h2>
              <p className="text-sm text-gray-500 mb-6">
                Link đặt lại mật khẩu chỉ có hiệu lực một lần và trong thời gian ngắn.
                Vui lòng yêu cầu link mới.
              </p>
              <Link
                href="/quen-mat-khau"
                className="inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Gửi lại link đặt lại
              </Link>
            </div>
          )}

          {status === "ready" && (
            done ? (
              <div className="text-center">
                <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Đặt lại thành công!</h2>
                <p className="text-sm text-gray-500">Đang chuyển đến trang đăng nhập…</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
                  <p className="text-sm text-gray-500 mt-1">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Mật khẩu mới</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        placeholder="Tối thiểu 8 ký tự"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputCls} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Đang lưu..." : "Lưu mật khẩu mới"}
                  </button>
                </form>
              </>
            )
          )}

        </div>
      </main>
    </div>
  );
}
