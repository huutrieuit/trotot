"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft, Loader2, CheckCircle2, X, ImagePlus,
  Wifi, AirVent, Car, ShieldCheck, WashingMachine,
  UtensilsCrossed, Wind, PawPrint,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getCityConfig } from "@/config/cities";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Amenities } from "@/types";
import AddressSearch from "@/components/listings/AddressSearch";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

const AMENITY_LIST: { key: keyof Amenities; icon: React.ElementType; label: string }[] = [
  { key: "wifi",     icon: Wifi,            label: "Wifi" },
  { key: "ac",       icon: AirVent,         label: "Điều hòa" },
  { key: "washer",   icon: WashingMachine,  label: "Máy giặt" },
  { key: "parking",  icon: Car,             label: "Chỗ để xe" },
  { key: "security", icon: ShieldCheck,     label: "An ninh 24/7" },
  { key: "kitchen",  icon: UtensilsCrossed, label: "Bếp nấu ăn" },
  { key: "balcony",  icon: Wind,            label: "Ban công" },
  { key: "pet",      icon: PawPrint,        label: "Nuôi thú cưng" },
];

const STATUS_OPTIONS = [
  { value: "active",  label: "Đang hiển thị" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "hidden",  label: "Bị ẩn" },
  { value: "rented",  label: "Đã cho thuê" },
];

interface ExistingImage { id: string; url: string; order: number }

export default function AdminSuaTinPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [cityName, setCityName] = useState("");

  const [title, setTitle]               = useState("");
  const [address, setAddress]           = useState("");
  const [district, setDistrict]         = useState("");
  const [area, setArea]                 = useState("");
  const [price, setPrice]               = useState("");
  const [maxOccupants, setMaxOccupants] = useState("1");
  const [genderPref, setGenderPref]     = useState<"all" | "male" | "female">("all");
  const [contactPhone, setContactPhone]   = useState("");
  const [contactPhone2, setContactPhone2] = useState("");
  const [description, setDescription]   = useState("");
  const [amenities, setAmenities]       = useState<Partial<Amenities>>({});
  const [status, setStatus]             = useState("pending");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const [existingImages, setExistingImages]   = useState<ExistingImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [newFiles, setNewFiles]               = useState<File[]>([]);
  const [newPreviews, setNewPreviews]         = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("id", id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) { router.replace("/admin/quan-ly-tin"); return; }
        setTitle(data.title);
        setAddress(data.address);
        setDistrict(data.district);
        setArea(data.area != null ? String(data.area) : "");
        setPrice(String(data.price));
        setMaxOccupants(String(data.max_occupants));
        setGenderPref(data.gender_preference);
        setContactPhone(data.contact_phone ?? "");
        setContactPhone2(data.contact_phone2 ?? "");
        setDescription(data.description);
        setAmenities(data.amenities ?? {});
        setStatus(data.status ?? "pending");
        const cityConfig = getCityConfig(data.city);
        setDistricts(cityConfig?.districts ?? []);
        setCityName(cityConfig?.name ?? "");
        setLat(data.lat ?? 0);
        setLng(data.lng ?? 0);
        const imgs = ((data.listing_images ?? []) as ExistingImage[]).sort((a, b) => a.order - b.order);
        setExistingImages(imgs);
        setLoading(false);
      });
  }, [id, router]);

  const toggleAmenity = (key: keyof Amenities) =>
    setAmenities((a) => ({ ...a, [key]: !a[key] }));

  const removeExisting = (imgId: string) => {
    setExistingImages((imgs) => imgs.filter((i) => i.id !== imgId));
    setRemovedImageIds((ids) => [...ids, imgId]);
  };

  const addNewFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setNewFiles((f) => [...f, ...arr]);
    arr.forEach((file) => setNewPreviews((p) => [...p, URL.createObjectURL(file)]));
  };

  const removeNewFile = (i: number) => {
    setNewFiles((f) => f.filter((_, idx) => idx !== i));
    setNewPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!title.trim() || !address.trim() || !district || !price || !description.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const { error: updateErr } = await supabase
        .from("listings")
        .update({
          title: title.trim(),
          address: address.trim(),
          district,
          area: area ? parseInt(area, 10) : null,
          price: parseInt(price.replace(/\D/g, ""), 10),
          max_occupants: parseInt(maxOccupants, 10),
          gender_preference: genderPref,
          description: description.trim(),
          contact_phone: contactPhone.trim(),
          contact_phone2: contactPhone2.trim() || null,
          lat: lat || null,
          lng: lng || null,
          amenities: {
            wifi: !!amenities.wifi, ac: !!amenities.ac, washer: !!amenities.washer,
            parking: !!amenities.parking, security: !!amenities.security,
            elevator: false, kitchen: !!amenities.kitchen,
            balcony: !!amenities.balcony, pet: !!amenities.pet,
          },
          status,
        })
        .eq("id", id);

      if (updateErr) throw new Error(updateErr.message);

      if (removedImageIds.length > 0) {
        await supabase.from("listing_images").delete().in("id", removedImageIds);
      }

      const startOrder = existingImages.length;
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `admin/${id}/${Date.now()}-${i}.${ext}`;
        const { data: uploadData, error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { upsert: true });
        if (upErr) throw new Error(`Upload ảnh thất bại: ${upErr.message}`);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          const { error: imgErr } = await supabase.from("listing_images").insert({
            listing_id: id,
            url: urlData.publicUrl,
            order: startOrder + i,
          });
          if (imgErr) throw new Error(`Lưu ảnh thất bại: ${imgErr.message}`);
        }
      }

      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã lưu thay đổi!</h2>
          <p className="text-sm text-gray-500 mb-6">Tin đăng đã được cập nhật.</p>
          <Link href="/admin/quan-ly-tin"
            className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
            Về Quản lý tin
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm flex items-center px-4 h-12 gap-3">
        <Link href="/admin/quan-ly-tin" className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700">
          <ChevronLeft size={22} />
        </Link>
        <span className="font-semibold text-gray-900 text-sm flex-1">Sửa tin (Admin)</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Trạng thái */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Trạng thái tin đăng</h2>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setStatus(value)}
                className={cn("py-2.5 rounded-xl border-2 text-sm font-medium transition-colors",
                  status === value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Thông tin cơ bản */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Tiêu đề tin *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Địa chỉ *</label>
            {cityName ? (
              <AddressSearch
                cityName={cityName}
                districts={districts}
                value={address}
                onChange={(val) => setAddress(val)}
                onSelect={(addr, dist, latVal, lngVal) => {
                  setAddress(addr);
                  setDistrict(dist);
                  setLat(latVal);
                  setLng(lngVal);
                }}
              />
            ) : (
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            )}
          </div>

          {lat !== 0 && lng !== 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-gray-500">Xác nhận vị trí trên bản đồ</p>
                <p className="text-[11px] text-blue-500">Kéo ghim để chỉnh chính xác</p>
              </div>
              <LeafletMap
                lat={lat} lng={lng} address={address}
                className="h-52"
                draggable
                onPositionChange={(la, ln) => { setLat(la); setLng(ln); }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phường / Khu vực *</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)}
                className={cn(inputCls, "bg-white")}>
                <option value="">-- Chọn phường --</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Diện tích (m²)</label>
              <input type="number" value={area} onChange={(e) => setArea(e.target.value)} min={1}
                placeholder="Không bắt buộc" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Giá thuê (đ/tháng) *</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số người tối đa</label>
              <select value={maxOccupants} onChange={(e) => setMaxOccupants(e.target.value)}
                className={cn(inputCls, "bg-white")}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} người</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Đối tượng</label>
            <div className="flex gap-2">
              {(["all", "male", "female"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setGenderPref(v)}
                  className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                    genderPref === v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                  {v === "all" ? "Tất cả" : v === "male" ? "Nam" : "Nữ"}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thông tin liên hệ</p>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số điện thoại chính *</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="09xx xxx xxx" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Số điện thoại phụ (tuỳ chọn)</label>
              <input type="tel" value={contactPhone2} onChange={(e) => setContactPhone2(e.target.value)}
                placeholder="Zalo, Viber,..." className={inputCls} />
            </div>
          </div>
        </section>

        {/* Mô tả */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Mô tả *</h2>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className={cn(inputCls, "resize-none")} />
        </section>

        {/* Tiện ích */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Tiện ích</h2>
          <div className="grid grid-cols-2 gap-2">
            {AMENITY_LIST.map(({ key, icon: Icon, label }) => (
              <button key={key} type="button" onClick={() => toggleAmenity(key)}
                className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                  amenities[key] ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Ảnh */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Ảnh phòng</h2>

          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                  <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                  <button onClick={() => removeExisting(img.id)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {newPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeNewFile(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                    <X size={11} />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-blue-600/80 text-white py-0.5">Mới</span>
                </div>
              ))}
            </div>
          )}

          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => addNewFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center">
            <ImagePlus size={16} />
            Thêm ảnh mới
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Ảnh hiện có: {existingImages.length} · Ảnh mới: {newFiles.length}
          </p>
        </section>

        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
