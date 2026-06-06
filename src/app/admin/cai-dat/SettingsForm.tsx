"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, CheckCircle2, Upload, QrCode } from "lucide-react";

interface Props {
  defaultValues: Record<string, string>;
}

const BANK_FIELDS = [
  { key: "bank_name",    label: "Tên ngân hàng",  placeholder: "Vietcombank" },
  { key: "bank_account", label: "Số tài khoản",   placeholder: "1234567890" },
  { key: "bank_owner",   label: "Chủ tài khoản",  placeholder: "NGUYEN VAN A" },
  { key: "bank_branch",  label: "Chi nhánh",       placeholder: "Chi nhánh Đà Nẵng" },
  { key: "zalo",         label: "Số Zalo hỗ trợ", placeholder: "0364823724", type: "tel" },
];

const QR_PACKAGES = [
  { key: "qr_starter",  label: "Gói Cơ bản (5 credit)" },
  { key: "qr_standard", label: "Gói Tiêu chuẩn (20 credit)" },
  { key: "qr_pro",      label: "Gói Cao cấp (50 credit)" },
];

export default function SettingsForm({ defaultValues }: Props) {
  const [values, setValues] = useState<Record<string, string>>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const allKeys = [...BANK_FIELDS.map((f) => f.key), ...QR_PACKAGES.map((p) => p.key)];

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    const supabase = createClient();
    const upserts = allKeys.map((key) => ({ key, value: values[key] ?? "", updated_at: new Date().toISOString() }));
    const { error: err } = await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
    setSaving(false);
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  const handleQrUpload = async (pkgKey: string, file: File) => {
    if (file.size > 3 * 1024 * 1024) { setError("Ảnh QR tối đa 3MB."); return; }
    setUploading(pkgKey);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `qr/${pkgKey}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setValues((v) => ({ ...v, [pkgKey]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Bank info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800 mb-1">Thông tin thanh toán</h2>
          <p className="text-xs text-gray-400">Hiển thị cho người dùng khi mua credit.</p>
        </div>
        {BANK_FIELDS.map(({ key, label, placeholder, type }) => (
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
      </div>

      {/* QR codes per package */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <QrCode size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">QR Thanh toán theo gói</h2>
          </div>
          <p className="text-xs text-gray-400">Upload ảnh QR hoặc nhập URL cho từng gói. Khi user chọn gói, QR tương ứng sẽ hiện ra.</p>
        </div>

        {QR_PACKAGES.map(({ key, label }) => (
          <div key={key} className="border border-gray-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">{label}</p>
            <div className="flex gap-3">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
                {values[key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={values[key]} alt="QR" className="w-full h-full object-contain" />
                ) : (
                  <QrCode size={28} className="text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                {/* URL input */}
                <input
                  type="url"
                  value={values[key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder="https://... hoặc upload ảnh →"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                {/* Upload button */}
                <button
                  type="button"
                  onClick={() => fileRefs.current[key]?.click()}
                  disabled={uploading === key}
                  className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 border border-orange-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {uploading === key
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Upload size={12} />}
                  {uploading === key ? "Đang upload..." : "Upload ảnh QR"}
                </button>
                <input
                  ref={(el) => { fileRefs.current[key] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(key, f); }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
