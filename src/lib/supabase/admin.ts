import { createClient } from "@supabase/supabase-js";

// Service role client — server side ONLY, không bao giờ import trong client component
// Cần env var: SUPABASE_SERVICE_ROLE_KEY (không có NEXT_PUBLIC_ prefix)
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
