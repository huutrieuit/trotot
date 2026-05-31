"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setUserRole } from "@/app/actions/admin";

const ROLES = [
  { value: "tenant", label: "Người thuê" },
  { value: "landlord", label: "Chủ nhà" },
  { value: "admin", label: "Admin" },
] as const;

type Role = "tenant" | "landlord" | "admin";

export default function RoleSelect({ userId, currentRole }: { userId: string; currentRole: Role }) {
  const [role, setRole] = useState<Role>(currentRole);
  const [pending, startTransition] = useTransition();

  const handleChange = (newRole: Role) => {
    if (newRole === role) return;
    startTransition(async () => {
      await setUserRole(userId, newRole);
      setRole(newRole);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {pending && <Loader2 size={13} className="animate-spin text-gray-400" />}
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as Role)}
        disabled={pending}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 bg-white disabled:opacity-60 cursor-pointer"
      >
        {ROLES.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
