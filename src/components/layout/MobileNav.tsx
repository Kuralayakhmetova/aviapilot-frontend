"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Navigation,
  GraduationCap,
  Users,
 // BookOpen,
} from "lucide-react";

const MOBILE_NAV = [
  { id: "dashboard",       label: "Дашборд",    href: "/dashboard", icon: LayoutDashboard },
  { id: "logbook",   label: "Маршруты",   href: "/logbook",   icon: Navigation, badge: 3 },
  { id: "training",        label: "УТП",        href: "/training-flights",       icon: GraduationCap },
  { id: "crew-data",            label: "Состав",     href: "/crew",      icon: Users },
 // { id: "logbook",         label: "Книжка",     href: "/logbook",   icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        height: "64px",
        background: "rgba(4,14,30,0.95)",
        borderTop: "1px solid rgba(26,86,168,0.2)",
        backdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {MOBILE_NAV.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full outline-none"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className="relative flex flex-col items-center gap-1"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--cyan-primary), var(--blue-bright))",
                    boxShadow: "0 0 8px var(--cyan-primary)",
                  }}
                />
              )}

              <div className="relative">
                <Icon
                  size={20}
                  style={{
                    color: isActive ? "var(--cyan-primary)" : "var(--text-muted)",
                    filter: isActive ? "drop-shadow(0 0 6px var(--cyan-primary))" : "none",
                    transition: "color 0.2s, filter 0.2s",
                  }}
                />
                {item.badge && (
                  <span
                    className="absolute -top-1.5 -right-2 text-[9px] font-bold px-1 rounded-full font-mono leading-none py-0.5"
                    style={{
                      background: "var(--amber-warn)",
                      color: "#000",
                      minWidth: "14px",
                      textAlign: "center",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-medium leading-none"
                style={{
                  color: isActive ? "var(--cyan-primary)" : "var(--text-dim)",
                  transition: "color 0.2s",
                }}
              >
                {item.label}
              </span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
