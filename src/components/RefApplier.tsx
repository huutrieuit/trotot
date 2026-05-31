"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyReferralCode } from "@/app/actions/referral";

const PENDING_REF_KEY = "trotot_pending_ref";

export default function RefApplier() {
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_REF_KEY);
    if (!pending) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      applyReferralCode(pending).finally(() => {
        localStorage.removeItem(PENDING_REF_KEY);
      });
    });
  }, []);

  return null;
}
