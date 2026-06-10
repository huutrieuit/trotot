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
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, listingId }),
    }).catch(() => {});
  }, [path, listingId]);

  return null;
}
