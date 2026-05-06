// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // HUD Colors
        "hud-cyan": "#00d4ff",
        "hud-blue": "#0066ff",
        "hud-green": "#00ff88",
        "hud-amber": "#ffaa00",
        "hud-red": "#ff3366",
        "hud-purple": "#8b5cf6",
        // Backgrounds
        "bg-primary": "#020b18",
        "bg-secondary": "#041225",
        "bg-card": "rgba(4, 18, 37, 0.8)",
        // CSS variable bridge (работает с ThemeProvider)
        "theme-bg": "var(--bg-base)",
        "theme-surface": "var(--bg-surface)",
        "theme-elevated": "var(--bg-elevated)",
        "theme-card": "var(--bg-card)",
        "theme-text": "var(--text-primary)",
        "theme-muted": "var(--text-muted)",
        "theme-border": "var(--border-color)",
        // Legacy
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        // ← добавлен var(--font-mono) чтобы подхватить JetBrains из Next.js font
        mono: ["var(--font-mono)", "JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "pulse-cyan": "pulse-cyan 2s ease-in-out infinite",
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "pulse-red": "pulse-red 1s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in-left 0.3s ease-out",
        scan: "scan-line 3s linear infinite",
      },
      keyframes: {
        "pulse-cyan": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 8px rgba(0, 212, 255, 0.6)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 16px rgba(0, 212, 255, 0.9)",
          },
        },
        "pulse-green": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 8px rgba(0, 255, 136, 0.6)",
          },
          "50%": {
            opacity: "0.7",
            boxShadow: "0 0 16px rgba(0, 255, 136, 0.9)",
          },
        },
        "pulse-red": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
