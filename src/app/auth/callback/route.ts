import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Nếu đăng ký lần đầu qua Google và có role được chọn, cập nhật profile
      if (role === "landlord" || role === "tenant") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, created_at")
          .eq("user_id", data.user.id)
          .single();

        // Chỉ ghi đè nếu profile vừa tạo (trong vòng 30 giây) để tránh ghi đè role đã đổi
        const isNew = profile?.created_at
          ? Date.now() - new Date(profile.created_at).getTime() < 30_000
          : false;

        if (isNew && profile?.role === "tenant") {
          await supabase
            .from("profiles")
            .update({ role })
            .eq("user_id", data.user.id);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/dang-nhap?error=auth`);
}
