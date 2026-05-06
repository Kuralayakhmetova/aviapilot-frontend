"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Wifi,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}


// ─────────────────────────────────────────────
// UTILITY: UTC Clock
// ─────────────────────────────────────────────
function UtcClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs" style={{ color: "var(--cyan-primary)" }}>
      {time} UTC
    </span>
  );
}

// ─────────────────────────────────────────────
// COMPONENT: Input Field
// ─────────────────────────────────────────────
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  Icon: React.ElementType;
  error?: string;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}

function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  Icon,
  error,
  autoComplete,
  rightSlot,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="hud-label"
        style={{
          display: "block",       // ← было через className, теперь явно
          width: "100%",          // ← растягиваем на всю ширину
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
         
        }}
      >
        {label}
      </label>

      <div className="relative group">
        <Icon
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 "
          style={{
            color: error ? "var(--red-alert)" : "var(--text-muted)",
          }}
        />

        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "avia-input pl-10 pr-10 text-gray-900 placeholder:text-gray-400",
            error &&
              "border-[--red-alert] focus:border-[--red-alert] focus:shadow-none"
          )}
          style={
            error
              ? { boxShadow: "0 0 0 1px var(--red-alert)" }
              : undefined
          }
        />

        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightSlot}
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-xs"
            style={{ color: "var(--red-alert)" }}
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}




// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginSuccess, setLoginSuccess] = useState(false);

  // ── Validation ──────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!email.trim()) {
      next.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Некорректный формат email";
    }

    if (!password) {
      next.password = "Введите пароль";
    } else if (password.length < 6) {
      next.password = "Минимум 6 символов";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ───────────────────────────────────
 const { setUser } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  setIsSubmitting(true);
  setErrors({});

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErrors({
        general: data.message || "Неверный email или пароль",
      });
      return;
    }

    // ✅ Устанавливаем пользователя в контекст
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
      });
    }

    setLoginSuccess(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push("/dashboard");
  } catch {
    setErrors({ general: "Ошибка сервера. Попробуйте позже." });
  } finally {
    setIsSubmitting(false);
  }
};

  

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* ══ LOGO BLOCK ══════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-7"
        >
          {/* Plane icon with glow */}
          <div className="inline-flex items-center justify-center mb-4">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(26,86,168,0.4)",
                  "0 0 40px rgba(26,86,168,0.7)",
                  "0 0 20px rgba(26,86,168,0.4)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--blue-primary) 0%, var(--blue-bright) 100%)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Plane
                size={34}
                className="text-white"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
                }}
              />
            </motion.div>
          </div>

          <h1
            className="text-[1.75rem] font-bold tracking-tight"
            style={{
              color: "var(--text-primary)",
              textShadow: "0 0 30px rgba(26,86,168,0.5)",
            }}
          >
            AviaPilot
          </h1>

          <div className="flex items-center justify-center gap-2 mt-1.5">
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(90deg, transparent, var(--blue-primary))",
              }}
            />
            <p
              className="hud-label"
              style={{
                fontSize: "0.6rem",
                letterSpacing: "0.22em",
                opacity: 0.6,
              }}
            >
              PILOT MANAGEMENT SYSTEM
            </p>
            <div
              className="h-px w-12"
              style={{
                background:
                  "linear-gradient(90deg, var(--blue-primary), transparent)",
              }}
            />
          </div>

          {/* Live UTC */}
          <div className="mt-2 flex items-center justify-center gap-1.5 opacity-70">
            <Wifi size={10} style={{ color: "var(--green-ok)" }} />
            <UtcClock />
          </div>
        </motion.div>

        {/* ══ MAIN CARD ════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="glass-card-heavy relative overflow-hidden"
          style={{ padding: "2rem" }}
        >
          {/* Card top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--blue-primary), var(--cyan-primary), var(--blue-primary), transparent)",
            }}
          />

          {/* ── Heading ─────────────────────────────── */}
          <div className="mb-6">
            <h2
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Вход в систему
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-medium transition-colors hover:opacity-80"
               style={{ color: "#f59e0b" }}
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          {/* ── General Error ────────────────────────── */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <AlertCircle
                  size={15}
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--red-alert)" }}
                />
                <p className="text-sm" style={{ color: "#fca5a5" }}>
                  {errors.general}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Success State ────────────────────────── */}
          <AnimatePresence>
            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 p-3 rounded-lg mb-4"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <CheckCircle2
                  size={15}
                  style={{ color: "var(--green-ok)" }}
                />
                <p className="text-sm" style={{ color: "#6ee7b7" }}>
                  Авторизация успешна. Переход...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORM ─────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <InputField
              id="email"
              label="EMAIL АДРЕС"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="pilot@aviation.kz"
              Icon={Mail}
              error={errors.email}
              autoComplete="email"
            />

            <InputField
              id="password"
              label="ПАРОЛЬ"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="••••••••••"
              Icon={Lock}
              error={errors.password}
              autoComplete="current-password"
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Скрыть пароль" : "Показать пароль"}
                  className="transition-colors hover:text-[--text-primary]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRememberMe((v) => !v)}
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center transition-all duration-200 border",
                    rememberMe
                      ? "border-[--blue-bright]"
                      : "border-[rgba(26,86,168,0.4)] group-hover:border-[rgba(26,86,168,0.7)]"
                  )}
                  style={
                    rememberMe
                      ? {
                          background:
                            "linear-gradient(135deg, var(--blue-primary), var(--blue-bright))",
                        }
                      : { background: "rgba(7,20,40,0.5)" }
                  }
                >
                  {rememberMe && (
                    <svg
                      viewBox="0 0 10 8"
                      className="w-2.5 h-2.5"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M1 4l2.5 2.5L9 1" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Запомнить меня
                </span>
              </label>

              <Link
                href="/forgot-password"
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--cyan-primary)" }}
              >
                Забыли пароль?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting || loginSuccess}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              style={{ padding: "13px 20px" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Проверяем...</span>
                </>
              ) : loginSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Вход выполнен</span>
                </>
              ) : (
                <>
                  <span>Войти в систему</span>
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>
         

          {/* Card bottom accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px opacity-50"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--blue-primary), transparent)",
            }}
          />
        </motion.div>

        {/* ══ SECURITY BADGE ═══════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mt-5"
        >
          <Shield size={11} style={{ color: "var(--text-dim)" }} />
          <span
            className="hud-label"
            style={{
              fontSize: "0.58rem",
              color: "var(--text-dim)",
              letterSpacing: "0.15em",
            }}
          >
            ЗАЩИЩЕНО SSL · AES-256 · JWT
          </span>
        </motion.div>

        <p
          className="text-center mt-2.5"
          style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}
        >
          © {new Date().getFullYear()} AviaPilot Kazakhstan. Все права защищены.
        </p>
      </div>
    </div>
  );
}
