import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes yêu cầu đăng nhập
const PROTECTED_SEGMENTS = ["/dang-tin", "/dashboard", "/tai-khoan", "/thong-bao"];
// Routes chỉ dành cho admin (role = admin)
const ADMIN_SEGMENTS = ["/admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_SEGMENTS.some((seg) => pathname.includes(seg))
    || ADMIN_SEGMENTS.some((seg) => pathname.startsWith(seg));
}

function isAdminOnly(pathname: string): boolean {
  return ADMIN_SEGMENTS.some((seg) => pathname.startsWith(seg));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  // Nếu chưa cấu hình Supabase (dev chưa có .env), cho qua nhưng log warning
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
    // Supabase chưa được cấu hình → chuyển về trang đăng nhập kèm redirect
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Kiểm tra role admin — đọc từ bảng profiles (single source of truth)
  if (isAdminOnly(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Bảo vệ các segment cần auth, bỏ qua static files và _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
