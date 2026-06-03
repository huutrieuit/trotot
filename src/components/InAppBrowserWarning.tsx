"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";

function detectInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  return (
    /FBAN|FBAV|FB_IAB|FBIOS|FBDV|Instagram|Line\/|ZaloApp|Twitter|Snapchat|Pinterest|LinkedIn\/|WhatsApp|MicroMessenger/i.test(ua) ||
    (/Android/.test(ua) && /wv\)/.test(ua))
  );
}

function buildOpenInBrowserUrl(): string {
  const url = window.location.href;
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const u = new URL(url);
      return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
    } catch {
      return url;
    }
  }
  return url;
}

export function useInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    setIsInApp(detectInAppBrowser());
  }, []);
  return isInApp;
}

export function InAppBrowserWarning() {
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openUrl, setOpenUrl] = useState("");

  useEffect(() => {
    if (detectInAppBrowser()) {
      setIsInApp(true);
      setOpenUrl(buildOpenInBrowserUrl());
    }
  }, []);

  if (!isInApp) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 text-sm text-orange-700">
      <p className="font-semibold mb-1">Không thể đăng nhập bằng Google tại đây</p>
      <p className="text-xs mb-3 text-orange-600">
        Trình duyệt trong ứng dụng (Facebook, Zalo…) bị Google chặn. Vui lòng mở bằng Chrome hoặc Safari.
      </p>
      <div className="flex gap-2">
        <a
          href={openUrl}
          className="flex-1 text-center bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg"
        >
          Mở trong Chrome
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 border border-orange-300 text-orange-700 text-xs font-medium px-3 py-2 rounded-lg bg-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Đã chép" : "Chép link"}
        </button>
      </div>
    </div>
  );
}
