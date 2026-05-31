"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Pencil, Eye, EyeOff, Trash2, CheckCheck,
  RefreshCw, Loader2, ExternalLink,
} from "lucide-react";
import { deleteListing, setListingStatus } from "@/app/actions/listing";
import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/types";

interface Props {
  listingId: string;
  status: ListingStatus;
  citySlug: string;
}

export default function ListingActions({ listingId, status, citySlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const act = (fn: () => Promise<void>) =>
    startTransition(() => fn().catch((e) => alert(e instanceof Error ? e.message : "Có lỗi xảy ra")));

  const btnBase = "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50";

  if (confirmDelete) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-red-600 font-semibold">Xoá tin này?</span>
        <button onClick={() => setConfirmDelete(false)}
          className={cn(btnBase, "border-gray-200 text-gray-600 hover:border-gray-300")}>
          Huỷ
        </button>
        <button onClick={() => act(() => deleteListing(listingId, citySlug))}
          disabled={isPending}
          className={cn(btnBase, "border-red-300 bg-red-50 text-red-600 hover:bg-red-100")}>
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
          Xoá vĩnh viễn
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Edit — always available */}
      <Link href={`/${citySlug}/dashboard/${listingId}/sua`}
        className={cn(btnBase, "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600")}>
        <Pencil size={11} />
        Sửa
      </Link>

      {/* Active → Hide */}
      {status === "active" && (
        <button disabled={isPending}
          onClick={() => act(() => setListingStatus(listingId, "hidden", citySlug))}
          className={cn(btnBase, "border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600")}>
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
          Ẩn
        </button>
      )}

      {/* Active → Rented */}
      {status === "active" && (
        <button disabled={isPending}
          onClick={() => act(() => setListingStatus(listingId, "rented", citySlug))}
          className={cn(btnBase, "border-green-200 bg-green-50 text-green-700 hover:bg-green-100")}>
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
          Đã cho thuê
        </button>
      )}

      {/* Hidden → Reactivate */}
      {status === "hidden" && (
        <button disabled={isPending}
          onClick={() => act(() => setListingStatus(listingId, "active", citySlug))}
          className={cn(btnBase, "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600")}>
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
          Hiện lại
        </button>
      )}

      {/* Rented → Reactivate */}
      {status === "rented" && (
        <button disabled={isPending}
          onClick={() => act(() => setListingStatus(listingId, "active", citySlug))}
          className={cn(btnBase, "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600")}>
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Đăng lại
        </button>
      )}

      {/* View public page */}
      {status === "active" && (
        <Link href={`/${citySlug}/phong-tro/${listingId}`} target="_blank"
          className={cn(btnBase, "border-blue-200 text-blue-600 hover:bg-blue-50")}>
          <ExternalLink size={11} />
          Xem
        </Link>
      )}

      {/* Delete */}
      <button disabled={isPending}
        onClick={() => setConfirmDelete(true)}
        className={cn(btnBase, "border-red-200 text-red-500 hover:bg-red-50 ml-auto")}>
        <Trash2 size={11} />
        Xoá
      </button>
    </div>
  );
}
