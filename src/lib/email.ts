import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use RESEND_FROM_EMAIL in production once trotot.vn is verified in Resend dashboard.
// Until then, Resend only accepts onboarding@resend.dev as the sender.
const FROM = process.env.RESEND_FROM_EMAIL ?? "TrọTốt <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@trotot.vn";

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><style>
  body { font-family: -apple-system, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 12px; max-width: 520px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px 28px; }
  .header h1 { color: #fff; margin: 0; font-size: 18px; }
  .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
  .body { padding: 24px 28px; }
  .row { display: flex; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 13px; width: 130px; flex-shrink: 0; }
  .value { color: #111827; font-size: 13px; font-weight: 500; }
  .btn { display: inline-block; margin-top: 20px; background: #2563eb; color: #fff !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
  .footer { padding: 16px 28px; background: #f9fafb; border-top: 1px solid #f0f0f0; color: #9ca3af; font-size: 11px; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <h1>🏠 TrọTốt Admin</h1>
    <p>${title}</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">Email tự động từ hệ thống TrọTốt · Không trả lời email này</div>
</div>
</body></html>`;
}

export async function sendNewListingNotification(params: {
  listingId: string;
  title: string;
  address: string;
  price: number;
  district: string;
  userEmail: string;
  contactPhone: string;
  citySlug: string;
}) {
  const priceStr = params.price.toLocaleString("vi-VN") + "đ/tháng";
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/duyet-tin`;

  const body = `
    <div class="row"><span class="label">Tiêu đề</span><span class="value">${params.title}</span></div>
    <div class="row"><span class="label">Địa chỉ</span><span class="value">${params.address}</span></div>
    <div class="row"><span class="label">Khu vực</span><span class="value">${params.district}</span></div>
    <div class="row"><span class="label">Giá thuê</span><span class="value">${priceStr}</span></div>
    <div class="row"><span class="label">SĐT liên hệ</span><span class="value">${params.contactPhone}</span></div>
    <div class="row"><span class="label">Email đăng</span><span class="value">${params.userEmail}</span></div>
    <a href="${adminUrl}" class="btn">Vào trang duyệt tin →</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[TrọTốt] Tin mới cần duyệt: ${params.title}`,
    html: layout("Tin đăng mới cần duyệt", body),
  });
}

export async function sendListingReportNotification(params: {
  userEmail: string;
  listingId: string;
  listingTitle: string;
  listingUrl: string;
  reason: string;
  adminUrl: string;
}) {
  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const body = `
    <div class="row"><span class="label">Người báo cáo</span><span class="value">${params.userEmail}</span></div>
    <div class="row"><span class="label">Lý do</span><span class="value" style="color:#dc2626">${params.reason}</span></div>
    <div class="row"><span class="label">Tin đăng</span><span class="value"><a href="${params.listingUrl}" style="color:#2563eb">${params.listingTitle}</a></span></div>
    <div class="row"><span class="label">Thời gian</span><span class="value">${time}</span></div>
    <a href="${params.adminUrl}" class="btn">Xem báo cáo trong Admin →</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[TrọTốt] Báo cáo tin giả: ${params.listingTitle}`,
    html: layout("Có báo cáo tin giả mới", body),
  });
}

export async function sendCreditRequestNotification(params: {
  userEmail: string;
  userId: string;
  packageName: string;
  credits: number;
  amount: number;
}) {
  const amountStr = params.amount.toLocaleString("vi-VN") + "đ";
  const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const body = `
    <div class="row"><span class="label">Email</span><span class="value">${params.userEmail}</span></div>
    <div class="row"><span class="label">User ID</span><span class="value" style="font-family:monospace;font-size:11px">${params.userId}</span></div>
    <div class="row"><span class="label">Gói</span><span class="value">${params.packageName}</span></div>
    <div class="row"><span class="label">Số credit</span><span class="value">${params.credits} credit</span></div>
    <div class="row"><span class="label">Số tiền</span><span class="value">${amountStr}</span></div>
    <div class="row"><span class="label">Thời gian</span><span class="value">${time}</span></div>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">
      Kiểm tra biên lai chuyển khoản từ Zalo, sau đó cộng credit vào tài khoản trong Supabase.<br>
      Nội dung CK mẫu: <strong>TROTOT ${params.userEmail.split("@")[0].toUpperCase()} ${params.credits}</strong>
    </p>
  `;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[TrọTốt] Yêu cầu mua credit: ${params.userEmail} – ${params.credits} credit (${amountStr})`,
    html: layout("Yêu cầu mua credit mới", body),
  });
}
