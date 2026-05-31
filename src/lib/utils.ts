import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} triệu`;
  }
  return `${(price / 1000).toFixed(0)}k`;
}

export function formatArea(area: number): string {
  return `${area} m²`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "Vừa đăng";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 4)}••••${phone.slice(-2)}`;
}
