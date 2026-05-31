"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Home, Building2, House, Hotel, Check, ImagePlus, X,
  Wifi, AirVent, Car, ShieldCheck, WashingMachine,
  UtensilsCrossed, Wind, PawPrint, Loader2, CheckCircle2,
  Link as LinkIcon, FileText, Globe, Phone,
} from "lucide-react";
import { getAllCities } from "@/config/cities";
import { cn } from "@/lib/utils";
import type { RoomType, Amenities, ListingSource } from "@/types";
import { createClient } from "@/lib/supabase/client";

/* ─── Types ─── */
interface AdminForm {
  // Nguồn
  source: Exclude<ListingSource, "claimed">;
  source_note: string;
  source_url: string;
  // Location
  city: string;
  district: string;
  // Phòng
  room_type: RoomType;
  title: string;
  address: string;
  area: string;
  max_occupants: string;
  gender_preference: "all" | "male" | "female";
  price: string;
  deposit: string;
  description: string;
  amenities: Partial<Amenities>;
  // Liên hệ (hiển thị cho người thuê)
  contact_phone: string;
  contact_phone2: string;
  // Ảnh
  images: File[];
}

const INITIAL: AdminForm = {
  source: "admin",
  source_note: "",
  source_url: "",
  city: "da-nang",
  district: "",
  room_type: "phong_tro",
  title: "",
  address: "",
  area: "",
  max_occupants: "1",
  gender_preference: "all",
  price: "",
  deposit: "",
  description: "",
  amenities: {},
  contact_phone: "",
  contact_phone2: "",
  images: [],
};

const ROOM_TYPES: { value: RoomType; label: string; icon: React.ElementType }[] = [
  { value: "phong_tro", label: "Phòng trọ", icon: Home },
  { value: "chung_cu", label: "Căn hộ", icon: Building2 },
  { value: "nha_nguyen_can", label: "Nhà nguyên căn", icon: House },
  { value: "homestay", label: "Homestay", icon: Hotel },
];

const AMENITY_LIST: { key: keyof Amenities; icon: React.ElementType; label: string }[] = [
  { key: "wifi", icon: Wifi, label: "Wifi" },
  { key: "ac", icon: AirVent, label: "Điều hòa" },
  { key: "washer", icon: WashingMachine, label: "Máy giặt" },
  { key: "parking", icon: Car, label: "Chỗ để xe" },
  { key: "security", icon: ShieldCheck, label: "An ninh 24/7" },
  { key: "kitchen", icon: UtensilsCrossed, label: "Bếp nấu ăn" },
  { key: "balcony", icon: Wind, label: "Ban công" },
  { key: "pet", icon: PawPrint, label: "Nuôi thú cưng" },
];

const SOURCE_OPTIONS: { value: Exclude<ListingSource, "claimed">; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "admin", label: "Admin đăng thay", desc: "Lấy từ FB, Zalo, tự khảo sát...", icon: Globe },
  { value: "landlord", label: "Chủ nhà tự đăng (hỗ trợ)", desc: "Admin nhập hộ chủ nhà gặp khó khăn kỹ thuật", icon: FileText },
];

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

export default function AdminDangTinPage() {
  const [form, setForm] = useState<AdminForm>(INITIAL);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cities = getAllCities().filter((c) => c.available);
  const selectedCity = cities.find((c) => c.slug === form.city);

  const set = <K extends keyof AdminForm>(key: K, val: AdminForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleAmenity = (key: keyof Amenities) =>
    setForm((f) => ({ ...f, amenities: { ...f.amenities, [key]: !f.amenities[key] } }));

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 30 - form.images.length);
    setForm((f) => ({ ...f, images: [...f.images, ...newFiles] }));
    newFiles.forEach((file) => setPreviews((p) => [...p, URL.createObjectURL(file)]));
  };

  const removeImage = (i: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      // 1. Insert listing — admin posts go live immediately (status: active)
      const { data: listing, error: listingErr } = await supabase
        .from("listings")
        .insert({
          landlord_id: user.id,
          city: form.city,
          source: form.source,
          source_note: form.source_note.trim() || null,
          source_url: form.source_url.trim() || null,
          title: form.title.trim(),
          description: form.description.trim(),
          address: form.address.trim(),
          district: form.district,
          price: parseInt(form.price, 10),
          area: parseInt(form.area, 10),
          room_type: form.room_type,
          max_occupants: parseInt(form.max_occupants, 10),
          gender_preference: form.gender_preference,
          contact_phone: form.contact_phone.trim() || null,
          contact_phone2: form.contact_phone2.trim() || null,
          amenities: {
            wifi: !!form.amenities.wifi,
            ac: !!form.amenities.ac,
            washer: !!form.amenities.washer,
            parking: !!form.amenities.parking,
            security: !!form.amenities.security,
            elevator: false,
            kitchen: !!form.amenities.kitchen,
            balcony: !!form.amenities.balcony,
            pet: !!form.amenities.pet,
          },
          status: "active",
        })
        .select("id")
        .single();

      if (listingErr || !listing) throw listingErr ?? new Error("Không thể tạo tin");

      // 2. Upload images
      const imageUrls: string[] = [];
      for (let i = 0; i < form.images.length; i++) {
        const file = form.images[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${listing.id}/${i}-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { upsert: true });
        if (uploadErr) throw new Error(`Upload ảnh ${i + 1} thất bại: ${uploadErr.message}`);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // 3. Save image records
      if (imageUrls.length > 0) {
        const { error: imgErr } = await supabase.from("listing_images").insert(
          imageUrls.map((url, order) => ({ listing_id: listing.id, url, order }))
        );
        if (imgErr) throw new Error(`Lưu ảnh thất bại: ${imgErr.message}`);
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert(`Đăng tin thất bại: ${err instanceof Error ? err.message : "Lỗi không xác định"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng tin thành công!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Tin đã được tạo với nguồn <strong>{form.source === "admin" ? "TrọTốt xác thực" : "Chủ nhà đăng"}</strong>.
          Tin sẽ hiển thị ngay sau khi admin duyệt.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setForm(INITIAL); setPreviews([]); setSuccess(false); }}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Đăng tin mới
          </button>
          <a href="/admin/duyet-tin"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 transition-colors text-sm">
            Xem danh sách tin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Đăng tin (Admin)</h1>
        <p className="text-sm text-gray-500 mt-0.5">Đăng tin không giới hạn, không tính quota chủ nhà.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Nguồn tin ── */}
        <Section title="Nguồn tin" icon={Globe}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {SOURCE_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
              <button key={value} type="button" onClick={() => set("source", value)}
                className={cn("flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all text-left",
                  form.source === value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white")}>
                <div className="flex items-center gap-2">
                  <Icon size={16} className={form.source === value ? "text-blue-600" : "text-gray-400"} />
                  <span className={cn("font-semibold text-sm", form.source === value ? "text-blue-700" : "text-gray-700")}>{label}</span>
                </div>
                <span className="text-[11px] text-gray-400">{desc}</span>
              </button>
            ))}
          </div>

          <Field label="Ghi chú nguồn" hint="Hiển thị dưới badge xác thực (tuỳ chọn)">
            <input type="text" value={form.source_note}
              onChange={(e) => set("source_note", e.target.value)}
              placeholder='VD: "Lấy từ group FB Thuê trọ Đà Nẵng, đã gọi xác nhận SĐT chủ nhà"'
              className={inputCls} />
          </Field>

          <Field label="Link nguồn gốc (nếu có)">
            <div className="relative">
              <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="url" value={form.source_url}
                onChange={(e) => set("source_url", e.target.value)}
                placeholder="https://facebook.com/groups/..."
                className={cn(inputCls, "pl-9")} />
            </div>
          </Field>
        </Section>

        {/* ── Số điện thoại liên hệ ── */}
        <Section title="Số điện thoại liên hệ" icon={Phone}>
          <p className="text-xs text-gray-400 -mt-1 mb-3">SĐT hiển thị cho người thuê gọi / nhắn Zalo trực tiếp trên trang tin.</p>
          <Field label="SĐT chính *">
            <input type="tel" required value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="09xx xxx xxx" className={inputCls} />
          </Field>
          <Field label="SĐT phụ (Zalo, Viber...)" className="mt-3">
            <input type="tel" value={form.contact_phone2}
              onChange={(e) => set("contact_phone2", e.target.value)}
              placeholder="Tuỳ chọn" className={inputCls} />
          </Field>
        </Section>

        {/* ── Vị trí ── */}
        <Section title="Vị trí" icon={Home}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Thành phố *">
              <select value={form.city} onChange={(e) => { set("city", e.target.value); set("district", ""); }} className={inputCls}>
                {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Phường / Khu vực *">
              <select value={form.district} onChange={(e) => set("district", e.target.value)} className={inputCls} required>
                <option value="">-- Chọn phường / khu vực --</option>
                {selectedCity?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Địa chỉ chi tiết *">
            <input type="text" required value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Số nhà, tên đường..." className={inputCls} />
          </Field>
        </Section>

        {/* ── Thông tin phòng ── */}
        <Section title="Thông tin phòng" icon={Home}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {ROOM_TYPES.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => set("room_type", value)}
                className={cn("flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all",
                  form.room_type === value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300")}>
                <Icon size={18} className={form.room_type === value ? "text-blue-600" : "text-gray-400"} />
                <span className={cn("text-sm font-semibold", form.room_type === value ? "text-blue-700" : "text-gray-700")}>{label}</span>
              </button>
            ))}
          </div>

          <Field label="Tiêu đề *">
            <input type="text" required value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Phòng trọ cao cấp gần ĐH Duy Tân, full nội thất"
              className={inputCls} maxLength={100} />
          </Field>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <Field label="Diện tích (m²) *">
              <input type="number" required value={form.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="25" min="5" className={inputCls} />
            </Field>
            <Field label="Số người tối đa">
              <select value={form.max_occupants} onChange={(e) => set("max_occupants", e.target.value)} className={inputCls}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={String(n)}>{n} người</option>)}
              </select>
            </Field>
            <Field label="Đối tượng">
              <select value={form.gender_preference} onChange={(e) => set("gender_preference", e.target.value as AdminForm["gender_preference"])} className={inputCls}>
                <option value="all">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Tiện ích & Giá ── */}
        <Section title="Tiện ích & Giá" icon={Wifi}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {AMENITY_LIST.map(({ key, icon: Icon, label }) => {
              const checked = !!form.amenities[key];
              return (
                <button key={key} type="button" onClick={() => toggleAmenity(key)}
                  className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all",
                    checked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300")}>
                  <Icon size={15} className={checked ? "text-blue-600" : "text-gray-400"} />
                  <span className={cn("text-sm font-medium", checked ? "text-blue-700" : "text-gray-700")}>{label}</span>
                  {checked && <Check size={13} className="ml-auto text-blue-600" />}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá thuê / tháng (VNĐ) *">
              <input type="number" required value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="2500000" min="100000" className={inputCls} />
              {form.price && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ≈ {Number(form.price).toLocaleString("vi-VN")}đ
                </p>
              )}
            </Field>
            <Field label="Tiền đặt cọc (VNĐ)">
              <input type="number" value={form.deposit}
                onChange={(e) => set("deposit", e.target.value)}
                placeholder="Tuỳ chọn" min="0" className={inputCls} />
            </Field>
          </div>
          <Field label="Mô tả *" className="mt-3">
            <textarea rows={4} required value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả chi tiết về phòng, khu vực, quy định..."
              className={cn(inputCls, "resize-none")} maxLength={1000} />
          </Field>
        </Section>

        {/* ── Ảnh ── */}
        <Section title="Ảnh phòng" icon={ImagePlus}>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all mb-3">
            <ImagePlus size={28} className="text-blue-400" />
            <p className="text-sm font-semibold text-gray-700">Chọn ảnh (không giới hạn với admin)</p>
            <p className="text-xs text-gray-400">JPG, PNG · Tối đa 5MB/ảnh</p>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => addImages(e.target.files)} />

          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                  <Image src={src} alt="" fill className="object-cover" sizes="100px" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                      Bìa
                    </span>
                  )}
                  <button onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Đang đăng..." : "Đăng tin (Admin)"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Tin được đánh dấu nguồn <strong>"{form.source === "admin" ? "TrọTốt xác thực" : "Chủ nhà đăng"}"</strong> và hiển thị ngay sau duyệt.
          </p>
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon size={14} className="text-blue-600" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
