// src/components/layout/TopBar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Search, Wind, Eye, Thermometer, Gauge,
  ChevronDown, X, Wifi, AlertTriangle, Info,
  CheckCircle, Clock, RefreshCw, LogOut, Sun, Moon, Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, User } from "@/lib/auth-context";
import { useTheme } from "@/lib/ThemeProvider";

// ─────────────────────────────────────────────
// DESIGN TOKENS (локальные — без CSS vars)
// ─────────────────────────────────────────────
const C = {
  bgBase:        "#141824",
  bgCard:        "#1e2330",
  bgInput:       "#252b3b",
  bgHover:       "#2d3446",
  border:        "#2d3446",
  borderFocus:   "#3b82f6",

  textPrimary:   "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted:     "#64748b",

  blue:          "#3b82f6",
  blueDark:      "#2563eb",
  blueAlpha:     "rgba(59,130,246,0.15)",
  borderBlue:    "rgba(59,130,246,0.25)",

  green:         "#22c55e",
  greenAlpha:    "rgba(34,197,94,0.10)",

  amber:         "#f59e0b",
  amberAlpha:    "rgba(245,158,11,0.15)",

  red:           "#f87171",
  redAlpha:      "rgba(239,68,68,0.10)",

  cyan:          "#22d3ee",
  cyanAlpha:     "rgba(34,211,238,0.10)",

  purple:        "#a855f7",
} as const;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface MetarData {
  icao: string;
  temp: number;
  dewpoint: number;
  wind: { dir: number; speed: number; gust?: number };
  visibility: number;
  pressure: number;
  clouds: string;
  raw: string;
  category: "VFR" | "MVFR" | "IFR" | "LIFR";
  updatedAt: Date;
}

interface Notification {
  id: string;
  type: "info" | "warn" | "ok" | "alert";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// ─────────────────────────────────────────────
// PAGE TITLES
// ─────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard":     { title: "Дашборд",       sub: "ОБЗОР СИСТЕМЫ" },
  "/flights":       { title: "Полёты",         sub: "УПРАВЛЕНИЕ РЕЙСАМИ" },
  "/schedule":      { title: "Расписание",     sub: "ПЛАН ПОЛЁТОВ" },
  "/map":           { title: "Карта",          sub: "НАВИГАЦИЯ" },
  "/airports":      { title: "Аэропорты",      sub: "БАЗА АЭРОДРОМОВ" },
  "/routes":        { title: "Маршруты",       sub: "ПЛАНИРОВАНИЕ МАРШРУТОВ" },
  "/weather":       { title: "Погода",         sub: "METAR / TAF / SIGMET" },
  "/notam":         { title: "NOTAM",          sub: "ИЗВЕЩЕНИЯ ПИЛОТАМ" },
  "/crew":          { title: "Экипаж",         sub: "УПРАВЛЕНИЕ ПЕРСОНАЛОМ" },
  "/logbook":       { title: "Логбук",         sub: "ЖУРНАЛ ПОЛЁТОВ" },
  "/licenses":      { title: "Лицензии",       sub: "СВИДЕТЕЛЬСТВА И ДОПУСКИ" },
  "/utp":           { title: "УТП",            sub: "УЧЕБНО-ТРЕНИРОВОЧНЫЕ ПОЛЁТЫ" },
  "/documents":     { title: "Документы",      sub: "АРХИВ ДОКУМЕНТАЦИИ" },
  "/finance":       { title: "Финансы",        sub: "ФИНАНСОВЫЙ УЧЁТ" },
  "/notifications": { title: "Уведомления",    sub: "ЦЕНТР УВЕДОМЛЕНИЙ" },
  "/settings":      { title: "Настройки",      sub: "ПАРАМЕТРЫ СИСТЕМЫ" },
};

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const MOCK_METAR: MetarData[] = [
  {
    icao: "UAAA", temp: 18, dewpoint: 8,
    wind: { dir: 270, speed: 12, gust: 18 },
    visibility: 9999, pressure: 1013, clouds: "FEW025",
    raw: "UAAA 121230Z 27012G18KT 9999 FEW025 18/08 Q1013",
    category: "VFR", updatedAt: new Date(),
  },
  {
    icao: "UACC", temp: 14, dewpoint: 6,
    wind: { dir: 300, speed: 8 },
    visibility: 6000, pressure: 1018, clouds: "BKN030",
    raw: "UACC 121230Z 30008KT 6000 BKN030 14/06 Q1018",
    category: "MVFR", updatedAt: new Date(),
  },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "alert", title: "NOTAM активен",           message: "Ограничение воздушного пространства над UAAA до 18:00 UTC", time: "5 мин",  read: false },
  { id: "2", type: "warn",  title: "Погодное предупреждение", message: "Прогнозируется гроза в районе Алматы 14:00–16:00 UTC",       time: "23 мин", read: false },
  { id: "3", type: "ok",    title: "Рейс KZ702 подтверждён",  message: "ALA→NQZ, вылет 09:15 UTC, экипаж назначен",                  time: "1 ч",    read: false },
  { id: "4", type: "info",  title: "Обновление системы",      message: "Запланировано техническое обслуживание 23:00–01:00 UTC",      time: "2 ч",    read: true  },
  { id: "5", type: "info",  title: "Новый пилот добавлен",    message: "К. Ахметов добавлен в состав экипажа рейса KZ305",           time: "3 ч",    read: true  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getCategoryStyle(cat: MetarData["category"]) {
  const map = {
    VFR:  { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.35)",  color: "#22c55e",  text: "VFR"  },
    MVFR: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", color: "#3b82f6",  text: "MVFR" },
    IFR:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#f87171",  text: "IFR"  },
    LIFR: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)", color: "#a855f7",  text: "LIFR" },
  };
  return map[cat];
}

// ─────────────────────────────────────────────
// UTC CLOCK
// ─────────────────────────────────────────────
function UtcClock() {
  const [dt, setDt] = useState({ time: "", date: "" });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setDt({
        time: `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`,
        date: now
          .toLocaleDateString("ru-RU", {
            day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
          })
          .replace(".", "")
          .toUpperCase(),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
      style={{
        background: C.cyanAlpha,
        border: `1px solid rgba(34,211,238,0.20)`,
      }}
    >
      <Clock size={11} style={{ color: C.cyan }} />
      <div className="leading-none">
        <div
          className="font-mono text-sm font-semibold tabular-nums"
          style={{ color: C.cyan }}
        >
          {dt.time}
        </div>
        <div
          className="font-mono text-[9px] opacity-60"
          style={{ color: C.cyan }}
        >
          UTC
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOCAL CLOCK
// ─────────────────────────────────────────────
function LocalClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("ru-RU", {
          timeZone: "Asia/Almaty",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
      style={{
        background: C.blueAlpha,
        border: `1px solid ${C.borderBlue}`,
      }}
    >
      <Clock size={11} style={{ color: C.blue }} />
      <div className="leading-none">
        <div
          className="font-mono text-sm font-semibold tabular-nums"
          style={{ color: C.blue }}
        >
          {time}
        </div>
        <div
          className="font-mono text-[9px] opacity-60"
          style={{ color: C.blue }}
        >
          ALM
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// METAR CHIP
// ─────────────────────────────────────────────
function MetarChip({
  data,
  onClick,
  isActive,
}: {
  data: MetarData;
  onClick: () => void;
  isActive: boolean;
}) {
  const cat = getCategoryStyle(data.category);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150"
      style={{
        background: isActive ? cat.bg : C.bgInput,
        border: `1px solid ${isActive ? cat.border : C.border}`,
      }}
    >
      <span
        className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
        style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
      >
        {cat.text}
      </span>
      <span
        className="font-mono text-xs font-semibold"
        style={{ color: C.textPrimary }}
      >
        {data.icao}
      </span>
      <div
        className="hidden xl:flex items-center gap-2 text-[11px]"
        style={{ color: C.textMuted }}
      >
        <span className="flex items-center gap-0.5">
          <Thermometer size={9} />{data.temp}°
        </span>
        <span className="flex items-center gap-0.5">
          <Wind size={9} />{data.wind.speed}kts
        </span>
      </div>
      <ChevronDown
        size={10}
        className={cn("transition-transform duration-200", isActive && "rotate-180")}
        style={{ color: C.textMuted }}
      />
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// METAR PANEL
// ─────────────────────────────────────────────
function MetarPanel({ data, onClose }: { data: MetarData; onClose: () => void }) {
  const cat = getCategoryStyle(data.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 right-0 z-50 w-[340px] rounded-xl overflow-hidden"
      style={{
        background: "#111827",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="font-mono text-lg font-bold"
            style={{ color: C.textPrimary }}
          >
            {data.icao}
          </span>
          <span
            className="font-mono text-xs font-bold px-2 py-1 rounded"
            style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
          >
            {cat.text}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors
                     hover:bg-white/5"
          style={{ color: C.textMuted }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-0 p-4">
        {[
          { icon: Thermometer, label: "TEMP/DEW",  value: `${data.temp}° / ${data.dewpoint}°`,  color: "#f97316" },
          { icon: Wind,        label: "ВЕТЕР",      value: `${String(data.wind.dir).padStart(3,"0")}° / ${data.wind.speed}kts${data.wind.gust ? ` G${data.wind.gust}` : ""}`, color: C.cyan },
          { icon: Eye,         label: "ВИДИМОСТЬ",  value: data.visibility >= 9999 ? "10+ км" : `${(data.visibility / 1000).toFixed(1)} км`, color: C.blue },
          { icon: Gauge,       label: "QNH",        value: `${data.pressure} hPa`, color: C.textSecondary },
          { icon: Wind,        label: "ОБЛАЧНОСТЬ", value: data.clouds,             color: C.textSecondary },
          { icon: RefreshCw,   label: "ОБНОВЛЁН",   value: "только что",            color: C.green },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center p-3 text-center"
            style={{
              borderRight: `1px solid ${C.border}`,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <Icon size={13} style={{ color, marginBottom: 4 }} />
            <div
              className="text-[9px] uppercase tracking-widest mb-1"
              style={{ color: C.textMuted }}
            >
              {label}
            </div>
            <div
              className="font-mono text-xs font-medium"
              style={{ color: C.textPrimary }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Raw METAR */}
      <div className="px-4 pb-4">
        <div
          className="text-[9px] uppercase tracking-widest mb-1.5"
          style={{ color: C.textMuted }}
        >
          RAW METAR
        </div>
        <div
          className="font-mono text-[11px] p-2.5 rounded-lg leading-relaxed"
          style={{
            background: C.bgInput,
            border: `1px solid ${C.border}`,
            color: C.textSecondary,
          }}
        >
          {data.raw}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// NOTIFICATIONS PANEL
// ─────────────────────────────────────────────
const NOTIF_ICON_MAP = {
  info:  { icon: Info,          color: "#3b82f6" },
  warn:  { icon: AlertTriangle, color: "#f59e0b" },
  ok:    { icon: CheckCircle,   color: "#22c55e" },
  alert: { icon: AlertTriangle, color: "#f87171" },
} as const;

function NotificationsPanel({
  notifications,
  onClose,
  onMarkRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 right-0 z-50 w-[360px] rounded-xl overflow-hidden"
      style={{
        background: "#111827",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top accent */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${C.blue}, ${C.cyan}, transparent)`,
        }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: C.textPrimary }}>
            Уведомления
          </span>
          {unread > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono"
              style={{
                background: C.amberAlpha,
                border: `1px solid rgba(245,158,11,0.35)`,
                color: C.amber,
              }}
            >
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-[11px] transition-opacity hover:opacity-70"
            style={{ color: C.blue }}
            onClick={() => notifications.forEach((n) => onMarkRead(n.id))}
          >
            Прочитать все
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded
                       hover:bg-white/5 transition-colors"
            style={{ color: C.textMuted }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {notifications.map((notif) => {
          const { icon: NIcon, color } = NOTIF_ICON_MAP[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => onMarkRead(notif.id)}
              className="flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150"
              style={{
                borderBottom: `1px solid rgba(45,52,70,0.6)`,
                background: notif.read ? "transparent" : "rgba(59,130,246,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.bgHover + "60";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = notif.read
                  ? "transparent"
                  : "rgba(59,130,246,0.04)";
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}35`,
                }}
              >
                <NIcon size={12} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-xs font-semibold leading-snug truncate"
                    style={{
                      color: notif.read ? C.textSecondary : C.textPrimary,
                    }}
                  >
                    {notif.title}
                  </span>
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: C.textMuted }}
                  >
                    {notif.time}
                  </span>
                </div>
                <p
                  className="text-[11px] mt-0.5 leading-relaxed"
                  style={{ color: C.textMuted }}
                >
                  {notif.message}
                </p>
              </div>
              {!notif.read && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: C.amber }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 text-center"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <button
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: C.blue }}
        >
          Все уведомления →
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// USER MENU PANEL
// ─────────────────────────────────────────────
function UserMenuPanel({
  user,
  onLogout,
}: {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full mt-2 right-0 z-50 w-[220px] rounded-xl overflow-hidden"
      style={{
        background: "#111827",
        border: `1px solid ${C.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}
    >
      {/* Top accent */}
      <div
        className="h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)`,
        }}
      />

      {/* User info */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div
          className="text-sm font-semibold truncate"
          style={{ color: C.textPrimary }}
        >
          {user?.firstName || "Гость"}
        </div>
        <div
          className="text-xs mt-0.5 truncate"
          style={{ color: C.textMuted }}
        >
          {user?.email || "guest"}
        </div>
      </div>

      {/* Actions */}
      <div className="p-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                     transition-colors duration-150 hover:bg-red-500/10"
          style={{ color: C.red }}
        >
          <LogOut size={14} />
          <span className="text-sm font-medium">Выйти из системы</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN TOPBAR
// ─────────────────────────────────────────────
export function TopBar() {
  const pathname        = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeMetar,       setActiveMetar]       = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu,      setShowUserMenu]       = useState(false);
  const [showSearch,        setShowSearch]         = useState(false);
  const [searchQuery,       setSearchQuery]        = useState("");
  const [notifications,     setNotifications]     = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [lang,              setLang]              = useState<"RU" | "KZ" | "EN">("RU");
  const [showLangMenu,      setShowLangMenu]       = useState(false);

  const metarRef    = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);
  const langRef     = useRef<HTMLDivElement>(null);

  const pageInfo    = PAGE_TITLES[pathname] ?? { title: "AviaPilot", sub: "PILOT MANAGEMENT SYSTEM" };
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getUserInitials = (first: string, last: string) =>
    `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
  const userInitials = user
    ? getUserInitials(user.firstName ?? "", user.lastName ?? "")
    : "?";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (metarRef.current    && !metarRef.current.contains(e.target as Node))    setActiveMetar(null);
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (langRef.current     && !langRef.current.contains(e.target as Node))     setShowLangMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search
  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  // ── Shared icon button styles ──────────────────────────────────
  const iconBtnStyle: React.CSSProperties = {
    background: C.bgInput,
    border: `1px solid ${C.border}`,
    color: C.textMuted,
  };

  const onEnterIconBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = C.borderFocus;
    (e.currentTarget as HTMLElement).style.color = C.textPrimary;
  };
  const onLeaveIconBtn = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = C.border;
    (e.currentTarget as HTMLElement).style.color = C.textMuted;
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 px-4 lg:px-6"
      style={{
        height: 60,
        background: C.bgCard,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {/* ── LEFT ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Переключить тему"
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg
                     transition-all duration-150"
          style={iconBtnStyle}
          onMouseEnter={onEnterIconBtn}
          onMouseLeave={onLeaveIconBtn}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Page title */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h1
                className="text-base font-semibold leading-none truncate"
                style={{ color: C.textPrimary }}
              >
                {pageInfo.title}
              </h1>
              <p
                className="mt-1 text-[10px] uppercase tracking-[0.18em] leading-none"
                style={{ color: C.textMuted }}
              >
                {pageInfo.sub}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── RIGHT ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <AnimatePresence mode="wait">
          {showSearch ? (
            <motion.div
              key="search-open"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative overflow-hidden hidden sm:block"
            >
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: C.textMuted }}
              />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
                style={{
                  background: C.bgInput,
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); }
                }}
              />
            </motion.div>
          ) : (
            <motion.button
              key="search-closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(true)}
              aria-label="Поиск"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg
                         transition-all duration-150"
              style={iconBtnStyle}
              onMouseEnter={onEnterIconBtn}
              onMouseLeave={onLeaveIconBtn}
            >
              <Search size={14} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* METAR chips */}
        <div ref={metarRef} className="hidden md:flex items-center gap-1.5 relative">
          {MOCK_METAR.map((m) => (
            <div key={m.icao} className="relative">
              <MetarChip
                data={m}
                isActive={activeMetar === m.icao}
                onClick={() =>
                  setActiveMetar((prev) => (prev === m.icao ? null : m.icao))
                }
              />
              <AnimatePresence>
                {activeMetar === m.icao && (
                  <MetarPanel data={m} onClose={() => setActiveMetar(null)} />
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* LIVE dot */}
          <div
            className="flex items-center gap-1 px-1.5 py-1 rounded"
            style={{ background: C.greenAlpha }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: C.green }}
            />
            <span
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: C.green, opacity: 0.8 }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Clocks */}
        <div className="hidden lg:flex items-center gap-1.5">
          <UtcClock />
          <LocalClock />
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications((v) => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg
                       transition-all duration-150"
            style={{
              background: showNotifications ? C.blueAlpha : C.bgInput,
              border: `1px solid ${showNotifications ? C.blue : C.border}`,
              color: showNotifications ? C.textPrimary : C.textMuted,
            }}
            aria-label={`Уведомления${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 flex items-center
                           justify-center rounded-full text-[9px] font-bold font-mono"
                style={{
                  background: C.amber,
                  color: "#000",
                  boxShadow: `0 0 8px ${C.amber}`,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </motion.button>
          <AnimatePresence>
            {showNotifications && (
              <NotificationsPanel
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkRead={markRead}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Online status */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
          style={{
            background: C.greenAlpha,
            border: `1px solid rgba(34,197,94,0.20)`,
          }}
        >
          <Wifi size={11} style={{ color: C.green }} />
          <span
            className="text-[9px] font-bold tracking-widest uppercase"
            style={{ color: C.green, opacity: 0.85 }}
          >
            ONLINE
          </span>
        </div>

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setShowLangMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       transition-all duration-150"
            style={iconBtnStyle}
            onMouseEnter={onEnterIconBtn}
            onMouseLeave={onLeaveIconBtn}
          >
            <Languages size={12} />
            <span className="text-xs font-mono font-semibold">{lang}</span>
          </button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full mt-1 right-0 rounded-lg overflow-hidden z-50"
                style={{
                  background: "#111827",
                  border: `1px solid ${C.border}`,
                  minWidth: "80px",
                }}
              >
                {(["RU", "KZ", "EN"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setShowLangMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2
                               text-xs font-mono font-semibold transition-colors duration-100"
                    style={{
                      color: lang === l ? C.blue : C.textMuted,
                      background: lang === l ? C.blueAlpha : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = C.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        lang === l ? C.blueAlpha : "transparent";
                    }}
                  >
                    {lang === l && (
                      <span style={{ color: C.blue }}>✓</span>
                    )}
                    {l}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                       transition-all duration-150"
            style={{
              background: showUserMenu ? C.blueAlpha : C.bgInput,
              border: `1px solid ${showUserMenu ? C.blue : C.border}`,
            }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         font-bold text-xs shrink-0"
              style={{
                background: "linear-gradient(135deg, #1e3a5f, #1e4080)",
                border: `1px solid rgba(59,130,246,0.30)`,
                color: "#60a5fa",
              }}
            >
              {userInitials}
            </div>

            {/* Name + email — xl only */}
            <div className="hidden xl:flex xl:flex-col xl:min-w-0 xl:max-w-[140px] text-left">
              <span
                className="text-xs font-medium leading-none truncate block"
                style={{ color: C.textPrimary }}
              >
                {user
                  ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                  : "Гость"}
              </span>
              <span
                className="text-[10px] mt-0.5 leading-none truncate block"
                style={{ color: C.textMuted }}
              >
                {user?.email ?? "guest"}
              </span>
            </div>

            <ChevronDown
              size={12}
              className={cn(
                "hidden xl:block shrink-0 transition-transform duration-200",
                showUserMenu && "rotate-180",
              )}
              style={{ color: C.textMuted }}
            />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <UserMenuPanel
                user={user}
                onClose={() => setShowUserMenu(false)}
                onLogout={logout}
              />
            )}
          </AnimatePresence>
        </div>

      </div>
      {/* end RIGHT */}
    </header>
  );
}
