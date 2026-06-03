import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import RefApplier from "@/components/RefApplier";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrọTốt – Tìm phòng trọ lý tưởng",
  description: "Tìm phòng trọ, căn hộ tại Đà Nẵng, Hồ Chí Minh, Hà Nội nhanh chóng và tin cậy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`h-full ${beVietnam.variable}`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        {children}
        <RefApplier />
      </body>
    </html>
  );
}
