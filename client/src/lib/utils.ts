import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "SAR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-LY", {
    calendar: "gregory",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string) {
  if (!name) return ""; // التحقق من أن الاسم موجود وليس فارغًا
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * توليد رمز عشوائي مكون من 6 أرقام للحوالات المالية
 * @returns رمز مكون من 6 أرقام كنص
 */
export function generateTransferCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
