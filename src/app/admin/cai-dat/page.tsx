import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import SettingsForm from "./SettingsForm";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dang-nhap");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: settings } = await supabase.from("site_settings").select("key, value");
  const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value]));

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={22} className="text-gray-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cài đặt</h1>
          <p className="text-sm text-gray-500">Thông tin ngân hàng & liên lạc</p>
        </div>
      </div>
      <SettingsForm defaultValues={s} />
    </div>
  );
}
