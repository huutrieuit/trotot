"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  defaultValues: Record<string, string>;
}

interface Field {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

const FIELDS: Field[] = [
  { key: "bank_name",    label: "Tên ngân hàng",  placeholder: "Vietcombank" },
  { key: "bank_account", label: "Số tài khoản",   placeholder: "1234567890" },
  { key: "bank_owner",   label: "Chủ tài khoản",  placeholder: "NGUYEN VAN A" },
  { key: "bank_branch",  label: "Chi nhánh",       placeholder: "Chi nhánh Đà Nẵng" },
  { key: "zalo",         label: "Số Zalo hỗ trợ", placeholder: "0364823724", type: "tel" },
];

export default function SettingsForm({ defaultValues }: Props) {
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    const supabase = createClient();
    const upserts = FIELDS.map(({ key }) => ({ key, value: values[key] ?? "", updated_at: new Date().toISOString() }));
    const { error: err } = await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-800 mb-1">Thông tin thanh toán</h2>
        <p className="text-xs text-gray-400">Hiển thị cho người dùng khi mua credit.</p>
      </div>

      {FIELDS.map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input
            type={type ?? "text"}
            value={values[key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      ))}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {saving ? (
          <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
        ) : saved ? (
          <><CheckCircle2 size={16} /> Đã lưu</>
        ) : (
          <><Save size={16} /> Lưu cài đặt</>
        )}
      </button>
    </div>
  );
}
