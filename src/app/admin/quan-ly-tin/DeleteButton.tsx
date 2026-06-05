"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteListing } from "@/app/actions/admin";

export default function DeleteButton({ listingId }: { listingId: string }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Xóa vĩnh viễn tin này? Không thể khôi phục.")) return;
    startTransition(async () => {
      await deleteListing(listingId);
      setDone(true);
    });
  };

  if (done) {
    return <span className="text-xs text-red-400 font-medium">Đã xóa</span>;
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium transition-colors"
      title="Xóa tin"
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      Xóa
    </button>
  );
}
