"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Home, Building2, House, Hotel,
  Check, Upload, X, ImagePlus, Loader2, CheckCircle2,
  Wifi, AirVent, Car, ShieldCheck, WashingMachine,
  UtensilsCrossed, Wind, PawPrint, Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getCityConfig } from "@/config/cities";
import { cn } from "@/lib/utils";
import type { RoomType, Amenities } from "@/types";
import { createClient } from "@/lib/supabase/client";
import AddressSearch from "@/components/listings/AddressSearch";
import { notifyNewListing } from "@/app/actions/notify";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

const CREDIT_COST = 2;

/* ─── Types ─── */
interface FormData {
  // Step 1
  room_type: RoomType;
  title: string;
  address: string;
  district: string;
  area: string;
  max_occupants: string;
  gender_preference: "all" | "male" | "female";
  contact_phone: string;
  contact_phone2: string;
  // Step 2
  price: string;
  deposit: string;
  description: string;
  amenities: Partial<Amenities>;
  // Step 3
  images: File[];
}

const INITIAL: FormData = {
  room_type: "phong_tro",
  title: "",
  address: "",
  district: "",
  area: "",
  max_occupants: "1",
  gender_preference: "all",
  contact_phone: "",
  contact_phone2: "",
  price: "",
  deposit: "",
  description: "",
  amenities: {},
  images: [],
};

/* ─── Constants ─── */
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

/* ─── Step indicator ─── */
function StepBar({ current }: { current: number }) {
  const steps = ["Thông tin", "Tiện ích & Giá", "Ảnh phòng", "Xác nhận"];
  return (
    <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-0.5">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
              )}>
                {done ? <Check size={13} /> : idx}
              </div>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block",
                active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-1.5 transition-colors", done ? "bg-green-400" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─── */
export default function DangTinPage() {
  const { city: citySlug } = useParams() as { city: string };
  const city = getCityConfig(citySlug);
  if (!city || !city.available) notFound();

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace(`/dang-nhap?redirect=/${citySlug}/dang-tin`);
    });
  }, [citySlug, router]);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== 4) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("credits").eq("user_id", user.id).single().then(({ data }) => {
        setUserCredits(data?.credits ?? 0);
      });
    });
  }, [step]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleAmenity = (key: keyof Amenities) =>
    setForm((f) => ({
      ...f,
      amenities: { ...f.amenities, [key]: !f.amenities[key] },
    }));

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 10 - form.images.length);
    setForm((f) => ({ ...f, images: [...f.images, ...newFiles] }));
    newFiles.forEach((file) => setPreviews((p) => [...p, URL.createObjectURL(file)]));
  };

  const removeImage = (i: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const isValidPhone = (p: string) => /^0\d{9}$/.test(p);

  const canNext = () => {
    if (step === 1) {
      const phone2 = form.contact_phone2.trim();
      return !!(
        form.title.trim().length >= 10 &&
        form.address.trim() &&
        form.district &&
        isValidPhone(form.contact_phone) &&
        (!phone2 || isValidPhone(phone2))
      );
    }
    if (step === 2) {
      const price = parseInt(form.price.replace(/\D/g, ""), 10);
      return !!(form.price.trim() && !isNaN(price) && price >= 100_000 && form.description.trim());
    }
    if (step === 3) return form.images.length > 0;
    return true;
  };

  const getMissingFields = (): string[] => {
    if (step === 1) {
      const m: string[] = [];
      if (!form.title.trim())                    m.push("Tiêu đề tin đăng");
      else if (form.title.trim().length < 10)    m.push("Tiêu đề cần ít nhất 10 ký tự");
      if (!form.address.trim())                  m.push("Địa chỉ");
      if (!form.district)                        m.push("Phường / Khu vực");
      if (!form.contact_phone.trim())            m.push("Số điện thoại liên hệ");
      else if (!isValidPhone(form.contact_phone)) m.push("SĐT liên hệ không hợp lệ (10 số, bắt đầu bằng 0)");
      const phone2 = form.contact_phone2.trim();
      if (phone2 && !isValidPhone(phone2))       m.push("SĐT phụ không hợp lệ (10 số, bắt đầu bằng 0)");
      return m;
    }
    if (step === 2) {
      const m: string[] = [];
      const price = parseInt(form.price.replace(/\D/g, ""), 10);
      if (!form.price.trim())                     m.push("Giá thuê");
      else if (isNaN(price) || price < 100_000)   m.push("Giá thuê tối thiểu 100,000đ");
      if (!form.description.trim())               m.push("Mô tả phòng");
      return m;
    }
    if (step === 3 && form.images.length === 0) return ["Ít nhất 1 ảnh phòng"];
    return [];
  };

  const goNext = () => {
    if (!canNext()) { setShowErrors(true); return; }
    setShowErrors(false);
    setStep((s) => s + 1);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goBack = () => {
    setShowErrors(false);
    setStep((s) => s - 1);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      // 1. Tạo listing + trừ credit atomically qua RPC
      const { data: listingId, error: rpcErr } = await supabase.rpc("post_listing", {
        p_city: citySlug,
        p_title: form.title.trim(),
        p_description: form.description.trim(),
        p_address: form.address.trim(),
        p_district: form.district,
        p_lat: lat,
        p_lng: lng,
        p_price: parseInt(form.price.replace(/\D/g, ""), 10),
        p_area: form.area ? parseInt(form.area, 10) : 0,
        p_room_type: form.room_type,
        p_max_occupants: parseInt(form.max_occupants, 10),
        p_gender_preference: form.gender_preference,
        p_contact_phone: form.contact_phone.trim(),
        p_contact_phone2: form.contact_phone2.trim(),
        p_amenities: {
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
      });

      if (rpcErr) {
        if (rpcErr.message.includes("no_credits")) {
          setUserCredits(0);
          alert(`Không đủ credit để đăng tin. Cần ${CREDIT_COST} credits.`);
          return;
        }
        throw rpcErr;
      }

      // 2. Upload ảnh lên Storage
      const imageUrls: string[] = [];
      for (let i = 0; i < form.images.length; i++) {
        const file = form.images[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${listingId}/${i}-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, { upsert: true });
        if (uploadErr) throw new Error(`Upload ảnh thất bại: ${uploadErr.message}`);
        if (uploadData) {
          const { data: urlData } = supabase.storage.from("listing-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // 3. Lưu listing_images
      if (imageUrls.length > 0) {
        const { error: imgInsertErr } = await supabase.from("listing_images").insert(
          imageUrls.map((url, order) => ({ listing_id: listingId, url, order }))
        );
        if (imgInsertErr) throw new Error(`Lưu ảnh thất bại: ${imgInsertErr.message}`);
      }

      // Fire-and-forget: notify admin (failure must not block user)
      notifyNewListing({
        listingId,
        title: form.title.trim(),
        address: form.address.trim(),
        price: parseInt(form.price.replace(/\D/g, ""), 10),
        district: form.district,
        contactPhone: form.contact_phone.trim(),
        citySlug,
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Đăng tin thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Success modal ─── */
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 px-0 md:px-4">
        <div className="bg-white rounded-t-3xl md:rounded-2xl p-8 w-full md:max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng tin thành công!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Tin đăng đang được xét duyệt và sẽ hiển thị trong vòng 30 phút.
          </p>
          <div className="flex gap-3">
            <Link href={`/${citySlug}/dashboard`}
              className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-center text-sm">
              Xem Dashboard
            </Link>
            <Link href={`/${citySlug}`}
              className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors text-center text-sm">
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" ref={topRef}>
      {/* Top bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-4 h-12 gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft size={22} />
            </button>
          ) : (
            <Link href={`/${citySlug}`} className="p-1.5 -ml-1 text-gray-500">
              <ChevronLeft size={22} />
            </Link>
          )}
          <span className="font-semibold text-gray-900 flex-1 text-sm">
            Đăng tin cho thuê · {city.shortName}
          </span>
          <span className="text-xs text-gray-400">Bước {step}/4</span>
        </div>
        <StepBar current={step} />
      </div>

      <div className="px-4 py-5 pb-8">
        {/* ── STEP 1: Thông tin cơ bản ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loại phòng</p>
              <div className="grid grid-cols-2 gap-3">
                {ROOM_TYPES.map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => set("room_type", value)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                      form.room_type === value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                    )}>
                    <Icon size={22} className={form.room_type === value ? "text-blue-600" : "text-gray-400"} />
                    <span className={cn("font-semibold text-sm", form.room_type === value ? "text-blue-700" : "text-gray-700")}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Tiêu đề tin đăng *" hint="Ngắn gọn, nêu bật điểm nổi bật">
              <input type="text" value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="VD: Phòng trọ cao cấp gần ĐH Duy Tân, full nội thất"
                className={inputCls} maxLength={100} />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/100</p>
            </Field>

            <Field label="Địa chỉ *" hint="Gõ để tìm gợi ý tự động">
              <AddressSearch
                cityName={city.name}
                districts={city.districts}
                value={form.address}
                onChange={(val) => set("address", val)}
                onSelect={(addr, dist, latVal, lngVal) => {
                  set("address", addr);
                  set("district", dist);
                  setLat(latVal);
                  setLng(lngVal);
                }}
              />
            </Field>

            <Field label="Phường / Khu vực *">
              <select value={form.district} onChange={(e) => set("district", e.target.value)} className={inputCls}>
                <option value="">-- Chọn phường / khu vực --</option>
                {city.districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            {lat !== 0 && lng !== 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500">Xác nhận vị trí trên bản đồ</p>
                  <p className="text-[11px] text-blue-500">Kéo ghim để chỉnh chính xác</p>
                </div>
                <LeafletMap
                  lat={lat} lng={lng} address={form.address}
                  className="h-52"
                  draggable
                  onPositionChange={(la, ln) => { setLat(la); setLng(ln); }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Diện tích (m²)">
                <input type="number" value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="VD: 25" min="5" max="500" className={inputCls} />
              </Field>
              <Field label="Số người tối đa">
                <select value={form.max_occupants} onChange={(e) => set("max_occupants", e.target.value)} className={inputCls}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={String(n)}>{n} người</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Đối tượng phù hợp">
              <div className="flex gap-2">
                {(["all", "male", "female"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => set("gender_preference", g)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                      form.gender_preference === g ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}>
                    {g === "all" ? "Tất cả" : g === "male" ? "Nam" : "Nữ"}
                  </button>
                ))}
              </div>
            </Field>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thông tin liên hệ</p>
              <Field label="Số điện thoại liên hệ *">
                <input type="tel" value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0901234567"
                  className={inputCls} maxLength={10} inputMode="numeric" />
                <p className="text-xs text-gray-400 mt-1">10 số, bắt đầu bằng 0. Số này hiển thị cho người thuê liên hệ.</p>
              </Field>
              <Field label="Số điện thoại phụ (tuỳ chọn)">
                <input type="tel" value={form.contact_phone2}
                  onChange={(e) => set("contact_phone2", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0901234567 (Zalo, Viber,...)"
                  className={inputCls} maxLength={10} inputMode="numeric" />
              </Field>
            </div>
          </div>
        )}

        {/* ── STEP 2: Tiện ích & Giá ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tiện ích có sẵn</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITY_LIST.map(({ key, icon: Icon, label }) => {
                  const checked = !!form.amenities[key];
                  return (
                    <button key={key} type="button" onClick={() => toggleAmenity(key)}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all text-left",
                        checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                      )}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        checked ? "bg-blue-100" : "bg-gray-100")}>
                        <Icon size={16} className={checked ? "text-blue-600" : "text-gray-400"} />
                      </div>
                      <span className={cn("text-sm font-medium", checked ? "text-blue-700" : "text-gray-700")}>{label}</span>
                      {checked && <Check size={14} className="ml-auto text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Giá thuê / tháng (VNĐ) *">
                <div className="relative">
                  <input type="number" value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="VD: 2500000" min="100000" className={cn(inputCls, "pr-14")} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">VNĐ</span>
                </div>
                {form.price && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ≈ {Number(form.price).toLocaleString("vi-VN")}đ/tháng
                  </p>
                )}
              </Field>
              <Field label="Tiền đặt cọc (VNĐ)">
                <div className="relative">
                  <input type="number" value={form.deposit}
                    onChange={(e) => set("deposit", e.target.value)}
                    placeholder="VD: 1 tháng" min="0" className={cn(inputCls, "pr-14")} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">VNĐ</span>
                </div>
              </Field>
            </div>

            <Field label="Mô tả phòng *" hint="Mô tả càng chi tiết, người thuê càng tin tưởng">
              <textarea rows={5} value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Mô tả chi tiết về phòng, khu vực xung quanh, quy định nhà trọ, chi phí điện nước..."
                className={cn(inputCls, "resize-none")} maxLength={1000} />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/1000</p>
            </Field>
          </div>
        )}

        {/* ── STEP 3: Ảnh phòng ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Ảnh phòng</p>
                <p className="text-xs text-gray-500 mt-0.5">Tối đa 10 ảnh · JPG, PNG</p>
              </div>
              <span className="text-sm font-medium text-blue-600">{form.images.length}/10 ảnh</span>
            </div>

            {/* Upload zone */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ImagePlus size={28} className="text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Chọn ảnh từ thiết bị</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG · Tối đa 5MB/ảnh</p>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => addImages(e.target.files)} />

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                    <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600/90 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        Ảnh bìa
                      </span>
                    )}
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={11} />
                    </button>
                  </div>
                ))}
                {form.images.length < 10 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <Upload size={20} className="text-gray-400" />
                  </button>
                )}
              </div>
            )}

            {form.images.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
                <Zap size={16} className="shrink-0" />
                Tin có ảnh thật nhận được gấp 5× lượt xem so với tin không có ảnh.
              </div>
            )}
          </div>
        )}

        {/* ── Validation errors ── */}
        {showErrors && getMissingFields().length > 0 && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold text-red-700 mb-1.5">Vui lòng điền đầy đủ thông tin:</p>
            <ul className="space-y-0.5">
              {getMissingFields().map((f) => (
                <li key={f} className="text-sm text-red-600 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── STEP 4: Xác nhận & Chi phí ── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Credit info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi phí đăng tin</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Đăng 1 tin</span>
                </div>
                <span className="font-bold text-blue-700">{CREDIT_COST} credits</span>
              </div>
              {userCredits !== null && (
                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                  <span className="text-sm text-gray-600">Số dư của bạn</span>
                  <span className={cn("font-bold text-sm", userCredits >= CREDIT_COST ? "text-green-600" : "text-red-500")}>
                    {userCredits} credits
                  </span>
                </div>
              )}
              {userCredits !== null && userCredits < CREDIT_COST && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-red-600 mb-2">Không đủ credit để đăng tin.</p>
                  <Link href={`/${citySlug}/mua-credit`}
                    className="text-xs font-semibold text-blue-700 underline">
                    Mua thêm credit →
                  </Link>
                </div>
              )}
            </div>

            {/* Review summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Xem lại thông tin</p>
              <ReviewRow label="Loại phòng" value={ROOM_TYPES.find((r) => r.value === form.room_type)?.label ?? ""} />
              <ReviewRow label="Tiêu đề" value={form.title || "—"} />
              <ReviewRow label="Địa chỉ" value={form.address ? `${form.address}, ${form.district}` : "—"} />
              <ReviewRow label="Diện tích" value={form.area ? `${form.area} m²` : "—"} />
              <ReviewRow label="Giá thuê" value={form.price ? `${Number(form.price).toLocaleString("vi-VN")}đ/tháng` : "—"} />
              <ReviewRow label="Số ảnh" value={`${form.images.length} ảnh`} />
            </div>
          </div>
        )}
        {/* ── Inline navigation ── */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={goBack}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 font-medium px-5 py-3.5 rounded-2xl hover:border-gray-300 transition-colors text-sm">
              <ChevronLeft size={16} /> Quay lại
            </button>
          ) : (
            <Link href={`/${citySlug}`}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 font-medium px-5 py-3.5 rounded-2xl hover:border-gray-300 transition-colors text-sm">
              <ChevronLeft size={16} /> Thoát
            </Link>
          )}

          {step < 4 ? (
            <button onClick={goNext}
              className="flex-1 flex items-center justify-center gap-1.5 font-semibold py-3.5 rounded-2xl transition-colors text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white">
              Tiếp theo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || (userCredits !== null && userCredits < CREDIT_COST)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {submitting ? "Đang đăng tin..." : `Đăng tin · ${CREDIT_COST} credits`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-right line-clamp-2">{value}</span>
    </div>
  );
}
