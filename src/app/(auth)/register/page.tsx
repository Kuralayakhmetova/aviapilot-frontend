"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Wifi,
  CheckCircle2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context"; // ✅ добавлен импорт
import { setAccessToken, authApi } from "@/lib/api";  // ✅ добавлен импорт

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function parseName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

function parseApiError(err: unknown): {
  field?: keyof FormErrors;
  message: string;
} {
  const e = err as {
    response?: { data?: { message?: string | string[]; statusCode?: number } };
  };
  const status = e?.response?.data?.statusCode;
  const raw = e?.response?.data?.message;
  const text = Array.isArray(raw)
    ? raw[0]
    : (raw ?? "Ошибка сервера. Попробуйте позже.");

  if (
    status === 409 ||
    (typeof text === "string" && text.toLowerCase().includes("email"))
  ) {
    return { field: "email", message: "Этот email уже зарегистрирован" };
  }

  if (typeof text === "string" && text.toLowerCase().includes("password")) {
    return { field: "password", message: text };
  }

  return { message: typeof text === "string" ? text : "Неизвестная ошибка" };
}

// ─────────────────────────────────────────────
// OAUTH PROVIDERS CONFIG
// ─────────────────────────────────────────────

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
        className="hud-label block"
        style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}
      >
        {label}
      </label>

      <div className="relative group">
        <Icon
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: error ? "var(--red-alert)" : "var(--text-muted)" }}
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
  error && "border-[--red-alert] focus:border-[--red-alert] focus:shadow-none"
)}
          style={error ? { boxShadow: "0 0 0 1px var(--red-alert)" } : undefined}
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
// COMPONENT: Password Strength Meter
// ─────────────────────────────────────────────
interface StrengthRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: StrengthRule[] = [
  { label: "Минимум 8 символов", test: (pw) => pw.length >= 8 },
  { label: "Заглавная буква (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Строчная буква (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "Цифра (0-9)", test: (pw) => /\d/.test(pw) },
  { label: "Спецсимвол (!@#$...)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const STRENGTH_CONFIG = [
  { label: "Слабый", color: "var(--red-alert)" },
  { label: "Слабый", color: "var(--red-alert)" },
  { label: "Средний", color: "var(--amber-warning)" },
  { label: "Хороший", color: "var(--cyan-primary)" },
  { label: "Надёжный", color: "var(--green-ok)" },
  { label: "Отличный", color: "var(--green-ok)" },
];

function PasswordStrengthMeter({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const config = STRENGTH_CONFIG[passed];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2.5 pt-1"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-1 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{ background: i < passed ? config.color : "rgba(26,86,168,0.15)" }}
            />
          ))}
        </div>
        <span
          className="text-[0.6rem] font-medium shrink-0 uppercase"
          style={{ color: config.color, letterSpacing: "0.08em" }}
        >
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <div
              key={rule.label}
              className="flex items-center gap-1.5 text-[0.65rem]"
              style={{ color: ok ? "var(--green-ok)" : "var(--text-dim)" }}
            >
              {ok ? (
                <Check size={10} />
              ) : (
                <div className="w-[10px] h-[10px] rounded-full border border-current opacity-40" />
              )}
              <span className={ok ? "" : "opacity-60"}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth(); // ✅ получаем setUser из контекста

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const [regSuccess, setRegSuccess] = useState(false);

  // ── Clear field error on change ─────────────
  const clearError = useCallback(
    (field: keyof FormErrors) =>
      setErrors((prev) => ({ ...prev, [field]: undefined })),
    []
  );

  // ── Validation ──────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = "Введите ваше имя";
    } else if (name.trim().length < 2) {
      next.name = "Минимум 2 символа";
    }

    if (!email.trim()) {
      next.email = "Введите email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Некорректный формат email";
    }

    if (!password) {
      next.password = "Введите пароль";
    } else if (password.length < 8) {
      next.password = "Минимум 8 символов";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Подтвердите пароль";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Пароли не совпадают";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit → POST /auth/register ─────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const { firstName, lastName } = parseName(name);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const url = `${apiUrl}/auth/register`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data: AuthResponse & { message?: string | string[]; statusCode?: number } =
        await res.json();

      if (!res.ok) {
        throw { response: { data } };
      }

      // ✅ Устанавливаем user в контекст — AppContent увидит его и покажет Sidebar/TopBar
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
        });
      }

      // ✅ Получаем accessToken через refresh (httpOnly cookie уже выставлен сервером)
      try {
        const newToken = await authApi.refresh();
        setAccessToken(newToken);
      } catch {
        // не критично — токен подтянется при следующем запросе
      }

      setRegSuccess(true);
      await new Promise((r) => setTimeout(r, 600));
      router.push("/dashboard");
    } catch (err: unknown) {
      const { field, message } = parseApiError(err);
      if (field) {
        setErrors({ [field]: message });
      } else {
        setErrors({ general: message });
      }
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
              background: "linear-gradient(135deg, var(--blue-primary) 0%, var(--blue-bright) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Plane
              size={34}
              className="text-white"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
            />
          </motion.div>
        </div>

        <h1
          className="text-[1.75rem] font-bold tracking-tight"
          style={{ color: "var(--text-primary)", textShadow: "0 0 30px rgba(26,86,168,0.5)" }}
        >
          AviaPilot
        </h1>

        <div className="flex items-center justify-center gap-2 mt-1.5">
          <div
            className="h-px w-12"
            style={{ background: "linear-gradient(90deg, transparent, var(--blue-primary))" }}
          />
          <p
            className="hud-label"
            style={{ fontSize: "0.6rem", letterSpacing: "0.22em", opacity: 0.6 }}
          >
            PILOT MANAGEMENT SYSTEM
          </p>
          <div
            className="h-px w-12"
            style={{ background: "linear-gradient(90deg, var(--blue-primary), transparent)" }}
          />
        </div>

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
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Регистрация
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: "#f59e0b" }}
            >
              Войти
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
              <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: "var(--red-alert)" }} />
              <p className="text-sm" style={{ color: "#fca5a5" }}>
                {errors.general}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Success State ────────────────────────── */}
        <AnimatePresence>
          {regSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 p-3 rounded-lg mb-4"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle2 size={15} style={{ color: "var(--green-ok)" }} />
              <p className="text-sm" style={{ color: "#6ee7b7" }}>
                Регистрация успешна. Переход...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FORM ─────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <InputField
            id="name"
            label="ПОЛНОЕ ИМЯ"
            type="text"
            value={name}
            onChange={(v) => { setName(v); clearError("name"); }}
            placeholder="Иван Петров"
            Icon={User}
            error={errors.name}
            autoComplete="name"
             rightSlot={<span className="w-[16px]" />}
          />

          <InputField
            id="email"
            label="EMAIL АДРЕС"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); clearError("email"); }}
            placeholder="pilot@aviation.kz"
            Icon={Mail}
            error={errors.email}
            autoComplete="email"
             rightSlot={<span className="w-[16px]" />}
          />

          <InputField
            id="password"
            label="ПАРОЛЬ"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(v) => { setPassword(v); clearError("password"); }}
            placeholder="••••••••••"
            Icon={Lock}
            error={errors.password}
            autoComplete="new-password"
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

          <AnimatePresence>
            {password && <PasswordStrengthMeter password={password} />}
          </AnimatePresence>

          <InputField
            id="confirmPassword"
            label="ПОДТВЕРЖДЕНИЕ ПАРОЛЯ"
            type={showConfirmPwd ? "text" : "password"}
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); clearError("confirmPassword"); }}
            placeholder="••••••••••"
            Icon={Lock}
            error={errors.confirmPassword}
            autoComplete="new-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirmPwd((v) => !v)}
                aria-label={showConfirmPwd ? "Скрыть пароль" : "Показать пароль"}
                className="transition-colors hover:text-[--text-primary]"
                style={{ color: "var(--text-muted)" }}
              >
                {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {/* Terms Agreement */}
          <div className="flex items-start gap-2.5 pt-1">
            <div
              onClick={() => setAgreeTerms((v) => !v)}
              role="checkbox"
              aria-checked={agreeTerms}
              tabIndex={0}
              onKeyDown={(e) => e.key === " " && setAgreeTerms((v) => !v)}
              className={cn(
                "w-4 h-4 mt-0.5 rounded flex items-center justify-center transition-all duration-200 border cursor-pointer shrink-0",
                agreeTerms
                  ? "border-[--blue-bright]"
                  : "border-[rgba(26,86,168,0.4)] hover:border-[rgba(26,86,168,0.7)]"
              )}
              style={
                agreeTerms
                  ? { background: "linear-gradient(135deg, var(--blue-primary), var(--blue-bright))" }
                  : { background: "rgba(7,20,40,0.5)" }
              }
            >
              {agreeTerms && (
                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="2">
                  <path d="M1 4l2.5 2.5L9 1" />
                </svg>
              )}
            </div>
            <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Я принимаю{" "}
              <Link href="/terms" className="transition-colors hover:opacity-80" style={{ color: "var(--cyan-primary)" }}>
                условия использования
              </Link>{" "}
              и{" "}
              <Link href="/privacy" className="transition-colors hover:opacity-80" style={{ color: "var(--cyan-primary)" }}>
                политику конфиденциальности
              </Link>
            </span>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || regSuccess || !agreeTerms}
            whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            className={cn(
              "btn-primary w-full flex items-center justify-center gap-2 mt-2",
              !agreeTerms && "opacity-50 cursor-not-allowed"
            )}
            style={{ padding: "13px 20px" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Создаём аккаунт...</span>
              </>
            ) : regSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Аккаунт создан</span>
              </>
            ) : (
              <>
                <span>Создать аккаунт</span>
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

      
   

        {/* Card bottom accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-50"
          style={{ background: "linear-gradient(90deg, transparent, var(--blue-primary), transparent)" }}
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
          style={{ fontSize: "0.58rem", color: "var(--text-dim)", letterSpacing: "0.15em" }}
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
