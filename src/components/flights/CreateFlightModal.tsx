"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plane, MapPin, Clock, Users,
  Fuel, FileText, ChevronRight, ChevronLeft,
  Check, AlertTriangle, Info,
} from "lucide-react";
import type { FlightCategory, AircraftType } from "@/types/flight";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: FlightFormData) => void;
}

interface FlightFormData {
  flightNumber: string;
  callsign: string;
  category: FlightCategory;
  depIcao: string;
  arrIcao: string;
  altIcao: string;
  std: string;
  sta: string;
  aircraft: AircraftType | "";
  registration: string;
  route: string;
  altitude: string;
  fuelPlanned: string;
  paxCount: string;
  remarks: string;
}

const INITIAL_DATA: FlightFormData = {
  flightNumber: "",
  callsign: "",
  category: "passenger",
  depIcao: "",
  arrIcao: "",
  altIcao: "",
  std: "",
  sta: "",
  aircraft: "",
  registration: "",
  route: "",
  altitude: "",
  fuelPlanned: "",
  paxCount: "",
  remarks: "",
};

const STEPS = [
  { id: 1, label: "Основное",   icon: FileText  },
  { id: 2, label: "Маршрут",    icon: MapPin    },
  { id: 3, label: "Расписание", icon: Clock     },
  { id: 4, label: "Воздушное",  icon: Plane     },
  { id: 5, label: "Подтверд.",  icon: Check     },
];

const CATEGORIES: { value: FlightCategory; label: string }[] = [
  { value: "passenger", label: "Пассажирский" },
  { value: "cargo",     label: "Грузовой"     },
  { value: "training",  label: "Учебный"      },
  { value: "charter",   label: "Чартер"       },
  { value: "ferry",     label: "Перегон"      },
];

const AIRCRAFT_TYPES: AircraftType[] = [
  "B737","B738","B739","B772","B773","B77W",
  "A319","A320","A321","E190","CRJ9",
];

// ─────────────────────────────────────────────
// FORM FIELD
// ─────────────────────────────────────────────
function FormField({
  label, required, error, children, hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block hud-label text-[10px]"
        style={{ opacity: 0.6, letterSpacing: "0.12em" }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--red-alert)", marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px]" style={{ color: "var(--text-dim)", opacity: 0.6 }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-[10px]" style={{ color: "var(--red-alert)" }}>
          <AlertTriangle size={9} />
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TEXT INPUT
// ─────────────────────────────────────────────
function TextInput({
  value, onChange, placeholder, mono = false,
  uppercase = false, maxLength, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  uppercase?: boolean;
  maxLength?: number;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) =>
        onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)
      }
      placeholder={placeholder}
      maxLength={maxLength}
      className={cn(
        "w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all duration-200",
        mono && "font-mono"
      )}
      style={{
        background: "rgba(7,20,40,0.7)",
        border: "1px solid rgba(26,86,168,0.25)",
        color: "var(--text-primary)",
        colorScheme: "dark",
      }}
      onFocus={(e) => {
        (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.6)";
        (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(26,86,168,0.1)";
      }}
      onBlur={(e) => {
        (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
        (e.target as HTMLElement).style.boxShadow = "none";
      }}
    />
  );
}

// ─────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = step.id < current;
        const isActive = step.id === current;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDone
                    ? "rgba(16,185,129,0.2)"
                    : isActive
                    ? "rgba(26,86,168,0.3)"
                    : "rgba(26,86,168,0.08)",
                  border: `1px solid ${
                    isDone
                      ? "rgba(16,185,129,0.5)"
                      : isActive
                      ? "rgba(26,86,168,0.6)"
                      : "rgba(26,86,168,0.2)"
                  }`,
                }}
              >
                {isDone ? (
                  <Check size={13} style={{ color: "var(--green-ok)" }} />
                ) : (
                  <Icon
                    size={13}
                    style={{
                      color: isActive ? "var(--blue-bright)" : "var(--text-dim)",
                    }}
                  />
                )}
              </div>
              <span
                className="text-[9px] font-mono whitespace-nowrap"
                style={{
                  color: isActive
                    ? "var(--text-primary)"
                    : isDone
                    ? "var(--green-ok)"
                    : "var(--text-dim)",
                  opacity: isActive || isDone ? 1 : 0.5,
                }}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className="w-8 h-px mx-1 mb-4 transition-all duration-300"
                style={{
                  background: isDone
                    ? "var(--green-ok)"
                    : "rgba(26,86,168,0.2)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// STEP CONTENT
// ─────────────────────────────────────────────
function StepContent({
  step,
  data,
  onChange,
}: {
  step: number;
  data: FlightFormData;
  onChange: (d: Partial<FlightFormData>) => void;
}) {
  // Step 1 — Basic info
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="НОМЕР РЕЙСА" required>
            <TextInput
              value={data.flightNumber}
              onChange={(v) => onChange({ flightNumber: v })}
              placeholder="KZ702"
              mono
              uppercase
              maxLength={7}
            />
          </FormField>
          <FormField label="ПОЗЫВНОЙ CALLSIGN">
            <TextInput
              value={data.callsign}
              onChange={(v) => onChange({ callsign: v })}
              placeholder="KZA702"
              mono
              uppercase
              maxLength={7}
            />
          </FormField>
        </div>

        <FormField label="КАТЕГОРИЯ РЕЙСА" required>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onChange({ category: cat.value })}
                className="px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background:
                    data.category === cat.value
                      ? "rgba(26,86,168,0.25)"
                      : "rgba(7,20,40,0.6)",
                  border: `1px solid ${
                    data.category === cat.value
                      ? "rgba(26,86,168,0.55)"
                      : "rgba(26,86,168,0.2)"
                  }`,
                  color:
                    data.category === cat.value
                      ? "var(--cyan-primary)"
                      : "var(--text-muted)",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="ПРИМЕЧАНИЯ">
          <textarea
            value={data.remarks}
            onChange={(e) => onChange({ remarks: e.target.value })}
            placeholder="Дополнительная информация..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm rounded-xl outline-none resize-none"
            style={{
              background: "rgba(7,20,40,0.7)",
              border: "1px solid rgba(26,86,168,0.25)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.6)";
              (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(26,86,168,0.1)";
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          />
        </FormField>
      </div>
    );
  }

  // Step 2 — Route
  if (step === 2) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="АЭРОДРОМ ВЫЛЕТА (ICAO)" required>
            <TextInput
              value={data.depIcao}
              onChange={(v) => onChange({ depIcao: v })}
              placeholder="UAAA"
              mono uppercase maxLength={4}
            />
          </FormField>
          <FormField label="АЭРОДРОМ ПРИЛЁТА (ICAO)" required>
            <TextInput
              value={data.arrIcao}
              onChange={(v) => onChange({ arrIcao: v })}
              placeholder="UACC"
              mono uppercase maxLength={4}
            />
          </FormField>
          <FormField label="ЗАПАСНОЙ (ICAO)">
            <TextInput
              value={data.altIcao}
              onChange={(v) => onChange({ altIcao: v })}
              placeholder="UACP"
              mono uppercase maxLength={4}
            />
          </FormField>
        </div>

        <FormField label="МАРШРУТ (ICAO формат)" hint="Пример: UAAA DCT TUKUM DCT LOKED DCT UACC">
          <TextInput
            value={data.route}
            onChange={(v) => onChange({ route: v })}
            placeholder="UAAA DCT TUKUM DCT UACC"
            mono uppercase
          />
        </FormField>

        <FormField label="ЭШЕЛОН КРЕЙСЕРСКОГО ПОЛЁТА" hint="В единицах FL (Flight Level)">
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm"
              style={{ color: "var(--text-dim)" }}
            >
              FL
            </span>
            <input
              type="number"
              value={data.altitude}
              onChange={(e) => onChange({ altitude: e.target.value })}
              placeholder="330"
              min={50}
              max={600}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl outline-none font-mono"
              style={{
                background: "rgba(7,20,40,0.7)",
                border: "1px solid rgba(26,86,168,0.25)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.6)";
                (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(26,86,168,0.1)";
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                (e.target as HTMLElement).style.boxShadow = "none";
              }}
            />
          </div>
        </FormField>
      </div>
    );
  }

  // Step 3 — Schedule
  if (step === 3) {
    return (
      <div className="space-y-4">
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{
            background: "rgba(6,182,212,0.06)",
            border: "1px solid rgba(6,182,212,0.2)",
          }}
        >
          <Info size={13} style={{ color: "var(--cyan-primary)", marginTop: 1, shrink: 0 }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Все времена указываются в{" "}
            <strong style={{ color: "var(--cyan-primary)" }}>UTC</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="РАСЧЁТНОЕ ВРЕМЯ ВЫЛЕТА (STD)" required>
            <TextInput
              value={data.std}
              onChange={(v) => onChange({ std: v })}
              type="datetime-local"
            />
          </FormField>
          <FormField label="РАСЧЁТНОЕ ВРЕМЯ ПРИЛЁТА (STA)" required>
            <TextInput
              value={data.sta}
              onChange={(v) => onChange({ sta: v })}
              type="datetime-local"
            />
          </FormField>
        </div>

        {data.std && data.sta && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl"
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Расчётное блок-время:{" "}
              <strong style={{ color: "var(--green-ok)" }}>
                {(() => {
                  const diff =
                    (new Date(data.sta).getTime() -
                      new Date(data.std).getTime()) /
                    60000;
                  if (diff <= 0) return "—";
                  return `${Math.floor(diff / 60)}ч ${diff % 60}мин`;
                })()}
              </strong>
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  // Step 4 — Aircraft
  if (step === 4) {
    return (
      <div className="space-y-4">
        <FormField label="ТИП ВОЗДУШНОГО СУДНА" required>
          <div className="grid grid-cols-4 gap-2">
            {AIRCRAFT_TYPES.map((ac) => (
              <button
                key={ac}
                type="button"
                onClick={() => onChange({ aircraft: ac })}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200"
                style={{
                  background:
                    data.aircraft === ac
                      ? "rgba(26,86,168,0.25)"
                      : "rgba(7,20,40,0.6)",
                  border: `1px solid ${
                    data.aircraft === ac
                      ? "rgba(26,86,168,0.55)"
                      : "rgba(26,86,168,0.2)"
                  }`,
                  color:
                    data.aircraft === ac
                      ? "var(--cyan-primary)"
                      : "var(--text-muted)",
                }}
              >
                {ac}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="БОРТОВОЙ НОМЕР" required hint="Пример: UP-B3811">
          <TextInput
            value={data.registration}
            onChange={(v) => onChange({ registration: v })}
            placeholder="UP-B3811"
            mono uppercase maxLength={8}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="КОЛИЧЕСТВО PAX" hint="Оставьте пустым для грузового/учебного">
            <TextInput
              value={data.paxCount}
              onChange={(v) => onChange({ paxCount: v })}
              placeholder="189"
              type="number"
            />
          </FormField>
          <FormField label="ПЛАНОВЫЙ ОСТАТОК ТОПЛИВА (кг)">
            <div className="relative">
              <Fuel
                size={12}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--amber-warn)" }}
              />
              <input
                type="number"
                value={data.fuelPlanned}
                onChange={(e) => onChange({ fuelPlanned: e.target.value })}
                placeholder="8400"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none font-mono"
                style={{
                  background: "rgba(7,20,40,0.7)",
                  border: "1px solid rgba(26,86,168,0.25)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.6)";
                  (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(26,86,168,0.1)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                  (e.target as HTMLElement).style.boxShadow = "none";
                }}
              />
            </div>
          </FormField>
        </div>
      </div>
    );
  }

  // Step 5 — Confirmation
  if (step === 5) {
    const rows = [
      { label: "Номер рейса",      value: data.flightNumber || "—" },
      { label: "Категория",        value: CATEGORIES.find(c => c.value === data.category)?.label ?? "—" },
      { label: "Вылет",            value: data.depIcao || "—" },
      { label: "Прилёт",          value: data.arrIcao || "—" },
      { label: "Запасной",        value: data.altIcao || "—" },
      { label: "STD",              value: data.std || "—" },
      { label: "STA",              value: data.sta || "—" },
      { label: "Тип ВС",          value: data.aircraft || "—" },
      { label: "Бортовой №",      value: data.registration || "—" },
      { label: "Эшелон",          value: data.altitude ? `FL${data.altitude}` : "—" },
      { label: "Топливо (план)",   value: data.fuelPlanned ? `${data.fuelPlanned} кг` : "—" },
    ].filter(r => r.value !== "—");

    return (
      <div className="space-y-4">
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <Check size={13} style={{ color: "var(--green-ok)", marginTop: 1 }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Проверьте данные перед созданием рейса
          </p>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(26,86,168,0.2)" }}
        >
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: i % 2 === 0 ? "rgba(26,86,168,0.04)" : "transparent",
                borderBottom: i < rows.length - 1 ? "1px solid rgba(26,86,168,0.08)" : "none",
              }}
            >
              <span className="hud-label text-[10px]" style={{ opacity: 0.5 }}>
                {row.label.toUpperCase()}
              </span>
              <span
                className="font-mono text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {data.remarks && (
          <div
            className="p-3 rounded-xl"
            style={{
              background: "rgba(26,86,168,0.06)",
              border: "1px solid rgba(26,86,168,0.15)",
            }}
          >
            <p className="hud-label text-[10px] mb-1" style={{ opacity: 0.4 }}>
              ПРИМЕЧАНИЯ
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {data.remarks}
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────
export function CreateFlightModal({ open, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FlightFormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);

  const updateData = (partial: Partial<FlightFormData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    onSubmit?.(data);
    setSubmitting(false);
    onClose();
    setStep(1);
    setData(INITIAL_DATA);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep(1); setData(INITIAL_DATA); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(2,11,24,0.85)", backdropFilter: "blur(6px)" }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-[640px] rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(4,14,30,0.98)",
                border: "1px solid rgba(26,86,168,0.35)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(26,86,168,0.08)",
                maxHeight: "90vh",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--blue-primary), var(--cyan-primary), transparent)",
                }}
              />

              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(26,86,168,0.15)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "rgba(26,86,168,0.15)",
                      border: "1px solid rgba(26,86,168,0.35)",
                    }}
                  >
                    <Plane size={16} style={{ color: "var(--blue-bright)" }} />
                  </div>
                  <div>
                    <h2
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Создать рейс
                    </h2>
                    <p
                      className="hud-label text-[10px]"
                      style={{ opacity: 0.45 }}
                    >
                      ШАГ {step} ИЗ {STEPS.length}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                    (e.currentTarget as HTMLElement).style.color = "var(--red-alert)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div
                className="px-6 py-4 shrink-0 overflow-x-auto"
                style={{ borderBottom: "1px solid rgba(26,86,168,0.1)" }}
              >
                <StepIndicator current={step} />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                  >
                    <StepContent step={step} data={data} onChange={updateData} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ borderTop: "1px solid rgba(26,86,168,0.15)" }}
              >
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: step === 1 ? "transparent" : "rgba(26,86,168,0.1)",
                    border: `1px solid ${step === 1 ? "transparent" : "rgba(26,86,168,0.25)"}`,
                    color: step === 1 ? "var(--text-dim)" : "var(--text-secondary)",
                    cursor: step === 1 ? "not-allowed" : "pointer",
                    opacity: step === 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={15} />
                  Назад
                </button>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: s.id === step ? 16 : 5,
                        height: 5,
                        background:
                          s.id < step
                            ? "var(--green-ok)"
                            : s.id === step
                            ? "var(--blue-bright)"
                            : "rgba(26,86,168,0.2)",
                      }}
                    />
                  ))}
                </div>

                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--blue-primary), rgba(26,86,168,0.7))",
                      border: "1px solid rgba(26,86,168,0.5)",
                      color: "#fff",
                      boxShadow: "0 0 16px rgba(26,86,168,0.25)",
                    }}
                  >
                    Далее
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: submitting
                        ? "rgba(16,185,129,0.15)"
                        : "linear-gradient(135deg, rgba(16,185,129,0.4), rgba(16,185,129,0.2))",
                      border: "1px solid rgba(16,185,129,0.4)",
                      color: "var(--green-ok)",
                      boxShadow: submitting ? "none" : "0 0 16px rgba(16,185,129,0.2)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="w-3.5 h-3.5 rounded-full border-2 border-transparent"
                          style={{
                            borderTopColor: "var(--green-ok)",
                            borderRightColor: "var(--green-ok)",
                          }}
                        />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        Создать рейс
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
