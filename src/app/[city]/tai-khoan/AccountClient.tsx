"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Camera, KeyRound, LogOut, Check,
  Loader2, Eye, EyeOff, AlertCircle, User, CreditCard, Zap, ShieldCheck,
  Heart, MapPin, Trash2, Phone, Gift, Copy, CheckCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toggleSaveListing } from "@/app/actions/save";
import { applyReferralCode } from "@/app/actions/referral";
import { cn, formatPrice } from "@/lib/utils";

interface SavedItem {
  listingId: string;
  title: string;
  price: number;
  city: string;
  address: string;
}

interface Props {
  citySlug: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  provider: string;
  credits: number | null;
  role: string;
  savedListings: SavedItem[];
  viewedListings: SavedItem[];
  referralCode: string | null;
  referralCount: number;
  hasReferredBy: boolean;
}

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white";

export default function AccountClient({ citySlug, userId, email, fullName, avatarUrl, provider, credits, role, savedListings, viewedListings, referralCode, referralCount, hasReferredBy }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile
  const [name, setName] = useState(fullName);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Sign out
  const [signingOut, setSigningOut] = useState(false);
  const [saved, setSaved] = useState<SavedItem[]>(savedListings);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refInput, setRefInput] = useState("");
  const [refMsg, setRefMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [applyingRef, setApplyingRef] = useState(false);

  const shareLink = typeof window !== "undefined" && referralCode
    ? `${window.location.origin}/dang-ky?ref=${referralCode}`
    : "";

  const handleCopy = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyRef = async () => {
    if (!refInput.trim()) return;
    setApplyingRef(true);
    setRefMsg(null);
    const { error } = await applyReferralCode(refInput.trim());
    setApplyingRef(false);
    setRefMsg(error
      ? { type: "err", text: error }
      : { type: "ok", text: "Thành công! Cả 2 đã được cộng 2 credit." });
    if (!error) setRefInput("");
  };

  const initials = name?.trim()?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U";
  const isEmailProvider = provider === "email";

  /* ── Avatar upload ── */
  const handleAvatarChange = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: "err", text: "Ảnh quá lớn, tối đa 5MB." });
      return;
    }
    setUploadingAvatar(true);
    setProfileMsg(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updateErr } = await supabase.auth.updateUser({ data: { avatar_url: newUrl } });
      if (updateErr) throw new Error(updateErr.message);
      setCurrentAvatar(newUrl);
      setProfileMsg({ type: "ok", text: "Đã cập nhật ảnh đại diện." });
      router.refresh();
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Upload thất bại." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  /* ── Save profile name ── */
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setProfileMsg({ type: "err", text: "Tên không được để trống." });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw new Error(error.message);
      // Sync to profiles table so listing detail shows updated name
      await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("user_id", userId);
      setProfileMsg({ type: "ok", text: "Đã lưu thông tin." });
      router.refresh();
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Lưu thất bại." });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    if (newPass.length < 6) {
      setPassMsg({ type: "err", text: "Mật khẩu tối thiểu 6 ký tự." });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: "err", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setSavingPass(true);
    setPassMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw new Error(error.message);
      setNewPass("");
      setConfirmPass("");
      setPassMsg({ type: "ok", text: "Đã đổi mật khẩu thành công." });
    } catch (err) {
      setPassMsg({ type: "err", text: err instanceof Error ? err.message : "Đổi mật khẩu thất bại." });
    } finally {
      setSavingPass(false);
    }
  };

  /* ── Unsave listing ── */
  const handleUnsave = async (listingId: string) => {
    setRemovingId(listingId);
    await toggleSaveListing(listingId);
    setSaved((prev) => prev.filter((s) => s.listingId !== listingId));
    setRemovingId(null);
  };

  /* ── Sign out ── */
  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${citySlug}/dashboard`} className="p-1.5 -ml-1 text-gray-500 hover:text-gray-700">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tài khoản</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin cá nhân</p>
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <User size={14} className="text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Thông tin cá nhân</span>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center ring-2 ring-blue-100">
              {currentAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{initials}</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <Loader2 size={20} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700 transition-colors shadow-sm"
              title="Đổi ảnh đại diện"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files)} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">{name || "Chưa đặt tên"}</p>
              {role === "admin" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={10} />
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{email}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="inline-flex items-center text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {provider === "google" ? "Google" : provider === "facebook" ? "Facebook" : "Email / Mật khẩu"}
              </span>
              {role !== "admin" && (
                <span className="inline-flex items-center text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {role === "landlord" ? "Chủ nhà" : "Người thuê"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {profileMsg && (
          <div className={cn(
            "flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 mb-4",
            profileMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          )}>
            {profileMsg.type === "ok" ? <Check size={15} /> : <AlertCircle size={15} />}
            {profileMsg.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên hiển thị</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
            <input
              value={email}
              disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Email không thể thay đổi.</p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || name.trim() === fullName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>
      </div>

      {/* ── Change password (email provider only) ── */}
      {isEmailProvider && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <KeyRound size={14} className="text-orange-500" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Đổi mật khẩu</span>
          </div>

          {passMsg && (
            <div className={cn(
              "flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 mb-4",
              passMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            )}>
              {passMsg.type === "ok" ? <Check size={15} /> : <AlertCircle size={15} />}
              {passMsg.text}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className={cn(inputCls, "pr-10")}
                />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={cn(inputCls, "pr-10",
                    confirmPass && newPass !== confirmPass ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""
                  )}
                />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPass && newPass !== confirmPass && (
                <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
              )}
            </div>
            <button
              onClick={handleChangePassword}
              disabled={savingPass || !newPass || !confirmPass}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {savingPass && <Loader2 size={14} className="animate-spin" />}
              {savingPass ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </div>
      )}

      {/* ── Credit ── */}
      {credits !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-amber-500" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Credit của tôi</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-3xl font-bold text-orange-500">{credits}</p>
              <p className="text-xs text-gray-400 mt-0.5">credit khả dụng · 1 credit = xem 1 số ĐT</p>
            </div>
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
              <CreditCard size={24} className="text-orange-400" />
            </div>
          </div>
          {credits === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-amber-700">
              Bạn đã hết credit. Mua thêm để tiếp tục xem số điện thoại các phòng.
            </div>
          )}
          <Link
            href={`/${citySlug}/mua-credit`}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            <CreditCard size={15} />
            Mua thêm credit
          </Link>
        </div>
      )}

      {/* ── Mời bạn bè ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
            <Gift size={14} className="text-purple-500" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Mời bạn bè</span>
          {referralCount > 0 && (
            <span className="ml-auto text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Đã mời {referralCount} người
            </span>
          )}
        </div>

        <div className="bg-purple-50 rounded-xl p-3 mb-3 text-center">
          <p className="text-xs text-purple-600 mb-1">Mỗi bạn đăng ký qua link của bạn</p>
          <p className="text-sm font-bold text-purple-800">Cả 2 nhận <span className="text-purple-600">+2 credit</span> miễn phí</p>
        </div>

        {referralCode && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
            <span className="font-mono text-sm font-bold text-gray-700 flex-1 tracking-wider">{referralCode}</span>
            <button onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0">
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? "Đã copy" : "Copy link"}
            </button>
          </div>
        )}

        {!hasReferredBy && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Bạn có mã giới thiệu từ người khác?</p>
            <div className="flex gap-2">
              <input
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã 8 ký tự"
                maxLength={8}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono tracking-wider outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
              <button
                onClick={handleApplyRef}
                disabled={applyingRef || refInput.length < 6}
                className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                {applyingRef ? <Loader2 size={14} className="animate-spin" /> : "Áp dụng"}
              </button>
            </div>
            {refMsg && (
              <p className={cn("text-xs mt-1.5 flex items-center gap-1",
                refMsg.type === "ok" ? "text-green-600" : "text-red-600")}>
                {refMsg.type === "ok" ? <Check size={11} /> : <AlertCircle size={11} />}
                {refMsg.text}
              </p>
            )}
          </div>
        )}
        {hasReferredBy && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <Check size={12} /> Bạn đã sử dụng mã giới thiệu.
          </p>
        )}
      </div>

      {/* ── Phòng đã xem ── */}
      {viewedListings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
              <Phone size={14} className="text-blue-500" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">Phòng đã xem SĐT</span>
            <span className="ml-auto text-xs text-gray-400">{viewedListings.length} phòng</span>
          </div>
          <div className="space-y-2">
            {viewedListings.map((item) => (
              <Link
                key={item.listingId}
                href={`/${item.city}/phong-tro/${item.listingId}`}
                className="flex items-center gap-3 bg-gray-50 hover:bg-blue-50 rounded-xl p-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">{formatPrice(item.price)}/tháng</span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <MapPin size={10} /><span className="line-clamp-1">{item.address}</span>
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-blue-500 font-medium">Xem lại →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Phòng đã lưu ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
            <Heart size={14} className="text-red-500" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Phòng đã lưu</span>
          <span className="ml-auto text-xs text-gray-400">{saved.length} phòng</span>
        </div>
        {saved.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Chưa có phòng nào được lưu.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((item) => (
              <div key={item.listingId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/${item.city}/phong-tro/${item.listingId}`}
                    className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                    {item.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">{formatPrice(item.price)}/tháng</span>
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <MapPin size={10} /><span className="line-clamp-1">{item.address}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsave(item.listingId)}
                  disabled={removingId === item.listingId}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Bỏ lưu"
                >
                  {removingId === item.listingId
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Trash2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sign out ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </div>
  );
}
