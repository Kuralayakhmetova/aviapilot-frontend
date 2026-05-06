"use client";

import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { SidebarProvider, useSidebar } from "@/lib/SidebarContext";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// ─────────────────────────────────────────────
// Внутренний layout — знает ширину сайдбара
// ─────────────────────────────────────────────
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? 64 : 280;

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Фиксированный сайдбар */}
      <Sidebar />

      {/* Контент — отступ синхронизирован с шириной сайдбара */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          // Mobile: нет отступа (сайдбар скрыт)
          // Desktop: отступ = ширина сайдбара
          marginLeft: 0,
          transition: "margin-left 0.15s ease",
        }}
      >
        {/* Применяем отступ только на lg+ через inline style + media */}
        <style>{`
          @media (min-width: 1024px) {
            .main-content-area {
              margin-left: ${sidebarWidth}px;
            }
          }
        `}</style>

        <div className="main-content-area flex flex-col min-h-screen transition-[margin] duration-150">
          {/* TopBar — только desktop */}
          <div className="hidden lg:block">
            <TopBar />
          </div>

          {/* Основной контент */}
          <main
            className="flex-1 min-w-0"
            style={{
              // Mobile: отступ снизу под MobileNav (64px)
              paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <style>{`
              @media (min-width: 1024px) {
                .main-content-area main {
                  padding-bottom: 0;
                }
              }
            `}</style>
            {children}
          </main>
        </div>
      </div>

      {/* MobileNav — только mobile */}
      <MobileNav />
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = AUTH_ROUTES.some((route) => pathname?.startsWith(route));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <SidebarProvider>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
      </SidebarProvider>
    );
  }

  return <>{children}</>;
}
