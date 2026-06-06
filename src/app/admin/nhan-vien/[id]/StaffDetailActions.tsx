"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldOff, ShieldCheck, UserMinus, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { blockUser, unblockUser, demoteStaff, deleteUser } from "@/app/actions/admin";

interface Props {
  userId: string;
  name: string;
  blocked: boolean;
}

type Confirm = "demote" | "delete" | null;

export default function StaffDetailActions({ userId, name, blocked }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState("");

  const run = (fn: () => Promise<void>, redirectAfter?: string) => {
    setError("");
    startTransition(async () => {
      try {
        await fn();
        if (redirectAfter) router.push(redirectAfter);
        else router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
      }
    });
  };

  return (
    <>
      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {confirm === "demote" ? "Gỡ quyền nhân viên?" : "Xóa tài khoản vĩnh viễn?"}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {confirm === "demote"
                    ? <><strong>{name}</strong> sẽ trở thành người dùng thông thường và mất toàn bộ quyền quản trị.</>
                    : <><strong>{name}</strong> sẽ bị xóa vĩnh viễn cùng toàn bộ dữ liệu. Không thể hoàn tác.</>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirm === "demote") {
                    setConfirm(null);
                    run(() => demoteStaff(userId), "/admin/nhan-vien");
                  } else {
                    setConfirm(null);
                    setError("");
                    startTransition(async () => {
                      const result = await deleteUser(userId);
                      if (result?.error) setError(result.error);
                      else router.push("/admin/nhan-vien");
                    });
                  }
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                  confirm === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {confirm === "delete" ? "Xóa vĩnh viễn" : "Xác nhận gỡ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {/* Block / Unblock */}
        <button
          onClick={() => run(blocked ? () => unblockUser(userId) : () => blockUser(userId))}
          disabled={isPending}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
            blocked
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {isPending
            ? <Loader2 size={16} className="animate-spin" />
            : blocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
          {blocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        </button>

        {/* Demote */}
        <button
          onClick={() => setConfirm("demote")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors disabled:opacity-50"
        >
          <UserMinus size={16} />
          Gỡ quyền nhân viên
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirm("delete")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} />
          Xóa tài khoản vĩnh viễn
        </button>
      </div>
    </>
  );
}
