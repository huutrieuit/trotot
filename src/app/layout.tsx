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
        {/* DEBUG */}
        <script dangerouslySetInnerHTML={{ __html: [
          "(function(){",
          "var b=document.createElement('div');",
          "b.id='_dbg';",
          "b.style.cssText='position:fixed;bottom:70px;left:4px;right:4px;z-index:99999;font-size:11px;pointer-events:none;';",
          "document.body.appendChild(b);",
          "function log(m,c){var d=document.createElement('div');d.style.cssText='background:'+c+';color:#fff;padding:3px 6px;margin-top:2px;border-radius:3px;word-break:break-all;';d.textContent=m;b.appendChild(d);}",
          "log('UA:'+navigator.userAgent.substring(0,100),'#333');",
          "window.onerror=function(m,f,l){log('ERR:'+m+' '+f.split('/').pop()+':'+l,'#c00');return false;};",
          "document.addEventListener('click',function(e){log('CLICK:'+e.target.tagName,'#06c');},true);",
          "window.addEventListener('load',function(){",
          "var sc=document.scripts.length;",
          "log('scripts:'+sc,'#555');",
          "setTimeout(function(){",
          "var ok=false;",
          "document.querySelectorAll('button').forEach(function(n){if(Object.keys(n).some(function(k){return k.indexOf('react')>-1;})){ok=true;}});",
          "log('react-hydrated:'+ok,ok?'#060':'#c00');",
          "},3000);});",
          "})();"
        ].join('') }} />
      </body>
    </html>
  );
}
