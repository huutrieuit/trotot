"use client";

import { useState, useTransition } from "react";
import { Loader2, ShieldOff, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { blockUser, unblockUser, deleteUser } from "@/app/actions/admin";

interface Props {
  userId: string;
  name: string;
  blocked: boolean;
  isSelf: boolean;
}

export default function UserActions({ userId, name, blocked, isSelf }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  if (isSelf) return <span className="text-[11px] text-gray-300">—</span>;

  const run = (fn: () => Promise<void>) => {
    setError("");
    startTransition(async () => {
      try { await fn(); }
      catch (e) { setError(e instanceof Error ? e.message : "Lỗi"); }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-[10px] text-red-500">{error}</p>}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Xóa tài khoản?</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tài khoản <strong>{name}</strong> và toàn bộ dữ liệu sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Hủy
              </button>
              <button
                onClick={() => {
                setConfirmDelete(false);
                setError("");
                startTransition(async () => {
                  const result = await deleteUser(userId);
                  if (result?.error) setError(result.error);
                });
              }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white">
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => run(blocked ? () => unblockUser(userId) : () => blockUser(userId))}
          disabled={isPending}
          title={blocked ? "Mở khóa" : "Khóa tài khoản"}
          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
            blocked
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          {isPending ? <Loader2 size={10} className="animate-spin" /> : blocked ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
          {blocked ? "Mở khóa" : "Khóa"}
        </button>

        <button
          onClick={() => setConfirmDelete(true)}
          disabled={isPending}
          title="Xóa tài khoản"
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          <Trash2 size={10} />
          Xóa
        </button>
      </div>
    </div>
  );
}
