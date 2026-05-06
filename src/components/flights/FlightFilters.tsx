"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, ChevronDown,
  Calendar, Plane, MapPin, SlidersHorizontal,
} from "lucide-react";
import type { FlightFilters, FlightStatus, FlightCategory } from "@/types/flight";
import { cn } from "@/lib/utils";

interface Props {
  filters: FlightFilters;
  onChange: (f: FlightFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS: { value: FlightStatus | "all"; label: string }[] = [
  { value: "all",       label: "Все статусы"    },
  { value: "active",    label: "В полёте"       },
  { value: "scheduled", label: "По плану"       },
  { value: "boarding",  label: "Посадка"        },
  { value: "delayed",   label: "Задержан"       },
  { value: "completed", label: "Выполнен"       },
  { value: "cancelled", label: "Отменён"        },
  { value: "diverted",  label: "Уход на запас." },
];

const CATEGORY_OPTIONS: { value: FlightCategory | "all"; label: string }[] = [
  { value: "all",       label: "Все типы"   },
  { value: "passenger", label: "Пассажирский" },
  { value: "cargo",     label: "Грузовой"   },
  { value: "training",  label: "Учебный"    },
  { value: "charter",   label: "Чартер"     },
  { value: "ferry",     label: "Перегон"    },
];

// ─────────────────────────────────────────────
// SELECT DROPDOWN
// ─────────────────────────────────────────────
function SelectFilter<T extends string>({
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  icon: React.ElementType;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
          "transition-all duration-200 whitespace-nowrap",
        )}
        style={{
          background: open
            ? "rgba(26,86,168,0.2)"
            : "rgba(7,20,40,0.6)",
          border: `1px solid ${open
            ? "rgba(26,86,168,0.5)"
            : "rgba(26,86,168,0.2)"}`,
          color: value !== "all"
            ? "var(--text-primary)"
            : "var(--text-muted)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Icon size={13} style={{ color: "var(--blue-bright)" }} />
        <span className="text-xs">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={11}
          className={cn("transition-transform duration-200", open && "rotate-180")}
          style={{ color: "var(--text-dim)" }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1.5 left-0 z-20 rounded-xl overflow-hidden min-w-[160px]"
              style={{
                background: "rgba(4,14,30,0.97)",
                border: "1px solid rgba(26,86,168,0.3)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-all duration-150"
                  style={{
                    color: opt.value === value
                      ? "var(--cyan-primary)"
                      : "var(--text-secondary)",
                    background: opt.value === value
                      ? "rgba(26,86,168,0.15)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (opt.value !== value)
                      (e.currentTarget as HTMLElement).style.background = "rgba(26,86,168,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    if (opt.value !== value)
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {opt.value === value && (
                    <div
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ background: "var(--cyan-primary)" }}
                    />
                  )}
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN FILTERS
// ─────────────────────────────────────────────
export function FlightFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    filters.status !== "all",
    filters.category !== "all",
    filters.aircraft !== "all",
    filters.search !== "",
    filters.departure !== "",
    filters.arrival !== "",
    filters.dateFrom !== "",
    filters.dateTo !== "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    onChange({
      search: "",
      status: "all",
      category: "all",
      aircraft: "all",
      dateFrom: "",
      dateTo: "",
      departure: "",
      arrival: "",
    });
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(7,20,40,0.5)",
        border: "1px solid rgba(26,86,168,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3 p-4">

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Рейс, маршрут, ВС, пилот..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none transition-all duration-200"
            style={{
              background: "rgba(7,20,40,0.6)",
              border: "1px solid rgba(26,86,168,0.25)",
              color: "var(--text-primary)",
              backdropFilter: "blur(8px)",
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.55)";
              (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(26,86,168,0.1)";
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <SelectFilter
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange({ ...filters, status: v })}
          icon={Filter}
          placeholder="Статус"
        />

        {/* Category filter */}
        <SelectFilter
          value={filters.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => onChange({ ...filters, category: v })}
          icon={Plane}
          placeholder="Тип рейса"
        />

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all duration-200"
          )}
          style={{
            background: showAdvanced
              ? "rgba(26,86,168,0.2)"
              : "rgba(7,20,40,0.6)",
            border: `1px solid ${showAdvanced
              ? "rgba(26,86,168,0.5)"
              : "rgba(26,86,168,0.2)"}`,
            color: showAdvanced ? "var(--blue-bright)" : "var(--text-muted)",
          }}
        >
          <SlidersHorizontal size={12} />
          Расширенный
          {activeFiltersCount > 0 && !showAdvanced && (
            <span
              className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1"
              style={{
                background: "rgba(245,158,11,0.25)",
                border: "1px solid rgba(245,158,11,0.4)",
                color: "var(--amber-warn)",
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Reset */}
        {activeFiltersCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all duration-200"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "var(--red-alert)",
            }}
          >
            <X size={12} />
            Сбросить ({activeFiltersCount})
          </motion.button>
        )}

        {/* Results count */}
        <div className="ml-auto">
          <span className="hud-label text-[10px]" style={{ opacity: 0.5 }}>
            {filteredCount} из {totalCount} рейсов
          </span>
        </div>
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-wrap gap-3 px-4 pb-4"
              style={{ borderTop: "1px solid rgba(26,86,168,0.1)" }}
            >
              <div className="w-full pt-3">
                <p
                  className="hud-label text-[10px] mb-3"
                  style={{ opacity: 0.4 }}
                >
                  РАСШИРЕННЫЕ ФИЛЬТРЫ
                </p>
              </div>

              {/* Departure airport */}
              <div className="relative">
                <MapPin
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--cyan-primary)" }}
                />
                <input
                  type="text"
                  value={filters.departure}
                  onChange={(e) =>
                    onChange({ ...filters, departure: e.target.value.toUpperCase() })
                  }
                  placeholder="ВЫЛЕТ (ICAO)"
                  maxLength={4}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl w-32 outline-none font-mono uppercase"
                  style={{
                    background: "rgba(7,20,40,0.6)",
                    border: "1px solid rgba(26,86,168,0.25)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.5)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                  }}
                />
              </div>

              {/* Arrival airport */}
              <div className="relative">
                <MapPin
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--amber-warn)" }}
                />
                <input
                  type="text"
                  value={filters.arrival}
                  onChange={(e) =>
                    onChange({ ...filters, arrival: e.target.value.toUpperCase() })
                  }
                  placeholder="ПРИЛЁТ (ICAO)"
                  maxLength={4}
                  className="pl-8 pr-3 py-2 text-xs rounded-xl w-32 outline-none font-mono uppercase"
                  style={{
                    background: "rgba(7,20,40,0.6)",
                    border: "1px solid rgba(26,86,168,0.25)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.5)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                  }}
                />
              </div>

              {/* Date from */}
              <div className="relative">
                <Calendar
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--blue-bright)" }}
                />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    onChange({ ...filters, dateFrom: e.target.value })
                  }
                  className="pl-8 pr-3 py-2 text-xs rounded-xl outline-none"
                  style={{
                    background: "rgba(7,20,40,0.6)",
                    border: "1px solid rgba(26,86,168,0.25)",
                    color: "var(--text-primary)",
                    colorScheme: "dark",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.5)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                  }}
                />
              </div>

              {/* Date to */}
              <div className="relative">
                <Calendar
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--blue-bright)" }}
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    onChange({ ...filters, dateTo: e.target.value })
                  }
                  className="pl-8 pr-3 py-2 text-xs rounded-xl outline-none"
                  style={{
                    background: "rgba(7,20,40,0.6)",
                    border: "1px solid rgba(26,86,168,0.25)",
                    color: "var(--text-primary)",
                    colorScheme: "dark",
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.5)";
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
