"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldOff, ShieldCheck, UserMinus, Trash2, AlertTriangle, X } from "lucide-react";
import { blockUser, unblockUser, demoteStaff, deleteUser } from "@/app/actions/admin";

interface Props {
  userId: string;
  name: string;
  blocked: boolean;
}

type Confirm = "demote" | "delete" | null;

export default function StaffActions({ userId, name, blocked }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState("");

  const run = (fn: () => Promise<void>) => {
    setError("");
    startTransition(async () => {
      try { await fn(); }
      catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {/* Confirm overlay */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {confirm === "demote" ? "Gỡ quyền nhân viên?" : "Xóa tài khoản?"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {confirm === "demote"
                    ? <>Tài khoản <strong>{name}</strong> sẽ trở thành người dùng thông thường.</>
                    : <>Tài khoản <strong>{name}</strong> sẽ bị xóa vĩnh viễn. Không thể hoàn tác.</>
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const fn = confirm === "demote"
                    ? () => demoteStaff(userId)
                    : () => deleteUser(userId);
                  setConfirm(null);
                  run(fn);
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

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Block / Unblock */}
        <button
          onClick={() => run(blocked ? () => unblockUser(userId) : () => blockUser(userId))}
          disabled={isPending}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
            blocked
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          {isPending
            ? <Loader2 size={11} className="animate-spin" />
            : blocked ? <ShieldCheck size={11} /> : <ShieldOff size={11} />
          }
          {blocked ? "Mở khóa" : "Khóa"}
        </button>

        {/* Demote */}
        <button
          onClick={() => setConfirm("demote")}
          disabled={isPending}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <UserMinus size={11} />
          Gỡ NV
        </button>

        {/* Delete */}
        <button
          onClick={() => setConfirm("delete")}
          disabled={isPending}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          <Trash2 size={11} />
          Xóa
        </button>
      </div>
    </div>
  );
}
