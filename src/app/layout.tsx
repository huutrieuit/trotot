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
        {/* DEBUG – xóa sau khi fix xong */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var log = function(msg, color) {
              var el = document.getElementById('_dbg');
              if (!el) { el = document.createElement('div'); el.id='_dbg'; el.style.cssText='position:fixed;bottom:70px;left:4px;right:4px;z-index:99999;font-size:11px;pointer-events:none;'; document.body.appendChild(el); }
              var line = document.createElement('div');
              line.style.cssText='background:'+color+';color:#fff;padding:2px 6px;margin-top:2px;border-radius:3px;word-break:break-all;';
              line.textContent = msg;
              el.appendChild(line);
              setTimeout(function(){ line.remove(); }, 10000);
            };
            window.addEventListener('error', function(e){ log('JS ERROR: '+e.message+' ('+e.filename.split('/').pop()+':'+e.lineno+')', '#b00'); });
            window.addEventListener('unhandledrejection', function(e){ log('PROMISE ERR: '+(e.reason && e.reason.message ? e.reason.message : e.reason), '#900'); });
            document.addEventListener('click', function(e){ log('CLICK: '+e.target.tagName+'.'+e.target.className.toString().split(' ')[0], '#007'); }, true);
            window.addEventListener('load', function() {
              var ns = Array.from(document.scripts).filter(function(s){ return s.src.indexOf('/_next/')>-1; });
              log('Next.js scripts in DOM: '+ns.length, ns.length>0?'#555':'#b00');
              setTimeout(function(){
                var btns = document.querySelectorAll('button');
                var hasReact = false;
                btns.forEach(function(n){ if(Object.keys(n).some(function(k){return k.startsWith('__react');})){hasReact=true;} });
                log('React fiber on buttons: '+(hasReact?'YES - React OK':'NO - React NOT hydrated'), hasReact?'green':'#b00');
              }, 2000);
            });
          })();
        ` }} />
      </body>
    </html>
  );
}
