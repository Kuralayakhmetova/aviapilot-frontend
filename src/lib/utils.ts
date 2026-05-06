import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Объединение классов Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Форматирование времени UTC
export function formatUTC(date: Date = new Date()): string {
  return date.toUTCString().slice(17, 22) + " UTC";
}

// Форматирование даты для авиации (DD MMM YYYY)
export function formatAviaDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Форматирование налёта (часы:минуты)
export function formatFlightHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

// Получить статус цвет
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "badge-green",
    completed: "badge-cyan",
    pending: "badge-amber",
    cancelled: "badge-red",
    draft: "badge-blue",
    expired: "badge-red",
    valid: "badge-green",
  };
  return map[status.toLowerCase()] ?? "badge-blue";
}

// Получить инициалы
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Сокращение числа (1200 → 1.2K)
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
