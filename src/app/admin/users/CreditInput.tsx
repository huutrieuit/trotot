"use client";

import { useState, useTransition } from "react";
import { Plus, Minus, Loader2, Check } from "lucide-react";
import { adjustCredits } from "@/app/actions/admin";

interface Props {
  userId: string;
  currentCredits: number;
}

export default function CreditInput({ userId, currentCredits }: Props) {
  const [amount, setAmount] = useState("5");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  const apply = (sign: 1 | -1) => {
    const n = parseInt(amount, 10);
    if (!n || n < 1) { setErr("Nhập số > 0"); return; }
    setErr("");
    setDone(false);
    startTransition(async () => {
      try {
        await adjustCredits(userId, sign * n);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Lỗi");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-orange-600 w-8 text-right tabular-nums">
          {currentCredits}
        </span>
        <input
          type="number"
          min={1}
          max={1000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center outline-none focus:border-orange-300"
        />
        <button
          onClick={() => apply(1)}
          disabled={pending}
          className="flex items-center gap-0.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors"
          title="Cộng credit"
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : done ? <Check size={11} /> : <Plus size={11} />}
        </button>
        <button
          onClick={() => apply(-1)}
          disabled={pending}
          className="flex items-center gap-0.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 text-xs font-bold px-2 py-1 rounded-lg transition-colors"
          title="Trừ credit"
        >
          <Minus size={11} />
        </button>
      </div>
      {err && <span className="text-[10px] text-red-500 pl-9">{err}</span>}
    </div>
  );
}
