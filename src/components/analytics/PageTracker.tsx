"use client";

import { useEffect, useRef } from "react";

interface Props {
  path: string;
  listingId?: string;
}

export default function PageTracker({ path, listingId }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Chỉ đếm 1 lần mỗi path/listing trong cùng phiên trình duyệt
    const key = `tracked:${path}${listingId ? `:${listingId}` : ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage không khả dụng (private mode hạn chế) → vẫn track
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, listingId }),
    }).catch(() => {});
  }, [path, listingId]);

  return null;
}
