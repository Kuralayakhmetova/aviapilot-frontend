import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AviaPilot — Авторизация",
  description: "Войдите в систему управления полётами AviaPilot",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      
      {/* ── Многослойный HUD-фон ── */}
      <div className="fixed inset-0 -z-10">
        
        {/* Base: глубокий космос */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--bg-base)" }}
        />

        {/* Радарная сетка */}
        <div className="absolute inset-0 bg-radar-grid opacity-40" />

        {/* Атмосферные блики */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 50%, rgba(26,86,168,0.15) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(6,182,212,0.08) 0%, transparent 50%),
              radial-gradient(ellipse 40% 60% at 70% 80%, rgba(26,86,168,0.10) 0%, transparent 50%)
            `,
          }}
        />

        {/* Горизонт (artificial horizon line) */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "50%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(26,86,168,0.3), rgba(6,182,212,0.4), rgba(26,86,168,0.3), transparent)",
          }}
        />

        {/* Scanlines overlay */}
        <div className="scanlines absolute inset-0 opacity-30" />

        {/* Виньетка по краям */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(2,11,24,0.8) 100%)",
          }}
        />
      </div>

      {/* ── Декоративные HUD-элементы ── */}

      {/* Угловые маркеры */}
      {[
        "top-4 left-4",
        "top-4 right-4",
        "bottom-4 left-4",
        "bottom-4 right-4",
      ].map((pos, i) => (
        <div key={i} className={`fixed ${pos} opacity-30`}>
          <div
            className="w-8 h-8"
            style={{
              border: "1px solid var(--blue-primary)",
              borderRadius: "2px",
              background: "transparent",
              boxShadow: "inset 0 0 8px rgba(26,86,168,0.3)",
            }}
          />
        </div>
      ))}

      {/* Верхняя статусная строка */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-2"
        style={{ borderBottom: "1px solid rgba(26,86,168,0.15)" }}
      >
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          SYS:ONLINE
        </span>
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          AVIAPILOT v2.4.1
        </span>
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          SEC:ACTIVE
        </span>
      </div>

      {/* Нижняя статусная строка */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-between items-center px-6 py-2"
        style={{ borderTop: "1px solid rgba(26,86,168,0.15)" }}
      >
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          ICAO:UAAA/UACC
        </span>
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          ENC:AES-256
        </span>
        <span className="hud-label text-[10px]" style={{ opacity: 0.4 }}>
          AUTH:PORTAL
        </span>
      </div>

      {/* ── Контент ── */}
      <div className="relative z-10 w-full flex items-center justify-center p-4 py-16">
        {children}
      </div>
    </div>
  );
}
