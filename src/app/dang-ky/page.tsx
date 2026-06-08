import { createClient } from "@/lib/supabase/server";
import DangKyForm from "./DangKyForm";

export default async function DangKyPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "registration_sso_only")
    .single();

  const ssoOnly = data?.value === "true";

  return <DangKyForm ssoOnly={ssoOnly} />;
}
