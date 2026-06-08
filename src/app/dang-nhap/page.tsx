import { createClient } from "@/lib/supabase/server";
import DangNhapForm from "./DangNhapForm";

export default async function DangNhapPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "registration_sso_only")
    .single();

  const ssoOnly = data?.value === "true";

  return <DangNhapForm ssoOnly={ssoOnly} />;
}
