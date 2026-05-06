"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plane, LayoutDashboard, GraduationCap,
  Users, Timer, BookOpen, BarChart3,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSidebar } from "@/lib/SidebarContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeType?: "info" | "warn" | "ok";
  isNew?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",        label: "Дашборд",                    href: "/dashboard",        icon: LayoutDashboard },
  { id: "crew-data",        label: "Летный состав",      href: "/crew",             icon: Users },
  { id: "logbook",          label: "Маршрутные полёты",           href: "/logbook",          icon: BookOpen },
  { id: "training-flights", label: "Учебно-тренировочные полёты", href: "/training-flights", icon: GraduationCap, isNew: true },
  { id: "chronometry",      label: "Хронометраж",                 href: "/schedule",         icon: Timer },
  { id: "training-graph",   label: "График натренированности",    href: "/training-graph",   icon: BarChart3 },
];

// ─────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────
const BADGE_STYLES = {
  info: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.35)", color: "#60a5fa" },
  warn: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", color: "#fbbf24" },
  ok:   { bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.35)",  color: "#4ade80" },
} as const;

function NavBadge({
  value,
  type = "info",
}: {
  value: number | string;
  type?: keyof typeof BADGE_STYLES;
}) {
  const s = BADGE_STYLES[type];
  return (
    <span
      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                 font-mono leading-none shrink-0 tabular-nums"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        minWidth: 18,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────
// Nav Item
// ─────────────────────────────────────────────
function SidebarItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch
      className="block outline-none rounded-lg
                 focus-visible:ring-1 focus-visible:ring-blue-500"
    >
      <div
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg",
          "transition-all duration-150",
          isCollapsed && "justify-center px-2",
          isActive
            ? "bg-[#252b3b] text-white"
            : "text-slate-400 hover:bg-[#1e2740] hover:text-slate-200",
        )}
      >
        {/* Active accent bar */}
        {isActive && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2
                       w-0.5 h-5 rounded-full"
            style={{
              background: "linear-gradient(180deg, #3b82f6, #60a5fa)",
              boxShadow: "0 0 8px rgba(59,130,246,0.6)",
            }}
          />
        )}

        {/* Icon */}
        <div className="relative shrink-0">
          <Icon
            size={18}
            className={cn(
              "transition-colors duration-150",
              isActive ? "text-blue-400" : "text-slate-500",
            )}
          />
          {/* Dot badge in collapsed mode */}
          {isCollapsed && item.badge !== undefined && (
            <div
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{
                background:
                  item.badgeType === "warn"
                    ? "#f59e0b"
                    : item.badgeType === "ok"
                    ? "#22c55e"
                    : "#3b82f6",
              }}
            />
          )}
        </div>

        {/* Label + badges (expanded only) */}
        {!isCollapsed && (
          <>
            <span
              className={cn(
                "flex-1 text-[0.8rem] font-medium leading-snug",
                "transition-colors duration-150",
                isActive ? "text-slate-100" : "text-slate-400",
              )}
              style={{ whiteSpace: "normal" }}
            >
              {item.label}
            </span>

            {item.isNew && item.badge === undefined && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                           uppercase tracking-wider shrink-0"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "#60a5fa",
                }}
              >
                NEW
              </span>
            )}

            {item.badge !== undefined && (
              <NavBadge value={item.badge} type={item.badgeType} />
            )}
          </>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────
function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 shrink-0"
      style={{
        minHeight: 64,
        borderBottom: "1px solid #2d3446",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 12px rgba(59,130,246,0.30)",
        }}
      >
        <Plane size={18} className="text-white" />
      </div>

      {!collapsed && (
        <div className="overflow-hidden">
          <div
            className="font-bold text-[15px] leading-none tracking-tight"
            style={{ color: "#e2e8f0" }}
          >
            AviaPilot
          </div>
          <div
            className="mt-0.5 text-[9px] font-semibold tracking-[0.22em] uppercase"
            style={{ color: "#475569" }}
          >
            Pilot Management
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Online Status
// ─────────────────────────────────────────────
function OnlineStatus() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-lg"
      style={{ background: "rgba(34,197,94,0.07)" }}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span
          className="animate-ping absolute inline-flex h-full w-full
                     rounded-full opacity-60"
          style={{ background: "#22c55e" }}
        />
        <span
          className="relative inline-flex rounded-full h-1.5 w-1.5"
          style={{ background: "#22c55e" }}
        />
      </span>
      <span
        className="text-[9px] font-bold tracking-[0.15em] uppercase"
        style={{ color: "#22c55e" }}
      >
        Система онлайн
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────
function UserProfile({
  initials,
  displayName,
  role,
  collapsed,
  onLogout,
}: {
  initials: string;
  displayName: string;
  role: string;
  collapsed: boolean;
  onLogout: () => void;
}) {
  return (
    <div
      className="shrink-0 p-3"
      style={{ borderTop: "1px solid #2d3446" }}
    >
      {!collapsed && <OnlineStatus />}

      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg",
          "transition-colors duration-150",
          collapsed && "justify-center",
        )}
        style={{
          background: "#1e2330",
          border: "1px solid #2d3446",
        }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center
                     shrink-0 font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, #1e3a5f, #1e4080)",
            border: "1px solid rgba(59,130,246,0.30)",
            color: "#60a5fa",
          }}
        >
          {initials}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden min-w-0">
              <div
                className="text-sm font-semibold truncate leading-none"
                style={{ color: "#e2e8f0" }}
              >
                {displayName}
              </div>
              <div
                className="mt-0.5 text-[10px] truncate uppercase tracking-widest"
                style={{ color: "#475569" }}
              >
                {role}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="shrink-0 p-1.5 rounded-lg transition-all duration-150
                         hover:bg-red-500/10 hover:text-red-400"
              style={{ color: "#475569" }}
              title="Выйти"
            >
              <LogOut size={14} />
            </button>
          </>
        )}
      </div>

      {/* Logout в collapsed */}
      {collapsed && (
        <button
          onClick={onLogout}
          className="w-full mt-2 p-2 rounded-lg flex items-center justify-center
                     transition-all duration-150
                     hover:bg-red-500/10 hover:border-red-500/40"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.20)",
            color: "#f87171",
          }}
          title="Выйти"
        >
          <LogOut size={14} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toggle Button
// ─────────────────────────────────────────────
function ToggleButton({
  collapsed,
  onClick,
}: {
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute -right-3 top-[72px] w-6 h-6 rounded-full
                 hidden lg:flex items-center justify-center z-50
                 transition-all duration-150 hover:scale-110"
      style={{
        background: "#252b3b",
        border: "1px solid #2d3446",
        boxShadow: "0 2px 8px rgba(0,0,0,0.40)",
        color: "#64748b",
      }}
      aria-label={collapsed ? "Развернуть" : "Свернуть"}
    >
      {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
    </button>
  );
}

// ─────────────────────────────────────────────
// Sidebar Content (shared desktop/mobile)
// ─────────────────────────────────────────────
function SidebarContent({
  collapsed,
  pathname,
  displayName,
  initials,
  role,
  onLogout,
  onToggle,
}: {
  collapsed: boolean;
  pathname: string;
  displayName: string;
  initials: string;
  role: string;
  onLogout: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col h-full relative">
      <SidebarLogo collapsed={collapsed} />

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            isActive={
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            }
            isCollapsed={collapsed}
          />
        ))}
      </nav>

      <UserProfile
        initials={initials}
        displayName={displayName}
        role={role}
        collapsed={collapsed}
        onLogout={onLogout}
      />

      <ToggleButton collapsed={collapsed} onClick={onToggle} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : "Гость";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "??";
  const role = user?.role?.toUpperCase() ?? "GUEST";
  const sidebarWidth = collapsed ? 64 : 280;

  // Базовые стили сайдбара
  const sidebarStyle: React.CSSProperties = {
    background: "#1e2330",
    borderRight: "1px solid #2d3446",
  };

  const sharedProps = {
    collapsed,
    pathname,
    displayName,
    initials,
    role,
    onLogout: logout,
    onToggle: toggle,
  };

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9
                   flex items-center justify-center rounded-lg
                   transition-colors duration-150"
        style={{
          background: "#1e2330",
          border: "1px solid #2d3446",
          color: "#94a3b8",
        }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Меню"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Desktop ── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col overflow-visible"
        style={{
          width: sidebarWidth,
          transition: "width 0.15s ease",
          willChange: "width",
          ...sidebarStyle,
        }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Mobile overlay + drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(10,13,20,0.75)" }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col lg:hidden"
              style={{ width: 280, ...sidebarStyle }}
            >
              <SidebarContent {...{ ...sharedProps, collapsed: false }} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
