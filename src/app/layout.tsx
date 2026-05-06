// src/app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { JetBrains_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { AppContent } from "@/components/layout/AppContent";
import { ThemeProvider } from "@/lib/ThemeProvider"; // ← свой провайдер

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={jetbrainsMono.variable}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {/* HUD Effects — только в тёмной теме (CSS скрывает в светлой) */}
              <div
                className="hud-vignette pointer-events-none fixed inset-0 z-50"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
                <div
                  className="absolute inset-0 opacity-[0.015]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              {/* Scanlines — только в тёмной теме */}
              <div
                className="hud-scanlines pointer-events-none fixed inset-0 z-40"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.025) 1px, rgba(255,255,255,0.025) 2px)",
                  backgroundSize: "100% 2px",
                }}
              />

              <AppContent>{children}</AppContent>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
