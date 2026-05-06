"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Plane, Clock, Users, Fuel, ChevronRight,
  ArrowRight, AlertTriangle,
} from "lucide-react";
import type { Flight } from "@/types/flight";
import { FlightStatusBadge } from "./FlightStatusBadge";
import { cn } from "@/lib/utils";

type SortKey = "flightNumber" | "std" | "sta" | "status" | "aircraft" | "distance";
type SortDir = "asc" | "desc";

interface Props {
  flights: Flight[];
  loading?: boolean;
}

// ─────────────────────────────────────────────
// SORT ICON
// ─────────────────────────────────────────────
function SortIcon({
  col,
  active,
  dir,
}: {
  col: SortKey;
  active: SortKey;
  dir: SortDir;
}) {
  if (col !== active)
    return <ChevronsUpDown size={11} style={{ color: "var(--text-dim)" }} />;
  return dir === "asc"
    ? <ChevronUp size={11} style={{ color: "var(--cyan-primary)" }} />
    : <ChevronDown size={11} style={{ color: "var(--cyan-primary)" }} />;
}

// ─────────────────────────────────────────────
// PROGRESS BAR (for flight progress)
// ─────────────────────────────────────────────
function FlightProgress({ flight }: { flight: Flight }) {
  if (flight.status !== "active") return null;

  // Simplified progress based on time
  const progress = 65; // mock 65% complete

  return (
    <div className="mt-1.5">
      <div
        className="h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(26,86,168,0.2)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, var(--blue-primary), var(--cyan-primary))",
            boxShadow: "0 0 6px var(--cyan-primary)",
          }}
        />
      </div>
      <span
        className="font-mono text-[9px] mt-0.5"
        style={{ color: "var(--cyan-primary)", opacity: 0.7 }}
      >
        {progress}% выполнен
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(26,86,168,0.08)",
          border: "1px solid rgba(26,86,168,0.2)",
        }}
      >
        <Plane size={28} style={{ color: "var(--text-dim)", opacity: 0.5 }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Рейсы не найдены
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
        Попробуйте изменить параметры фильтра
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SKELETON ROW
// ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      {[80, 140, 120, 100, 90, 80, 100].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded"
          style={{
            width: w,
            background: "rgba(26,86,168,0.1)",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN TABLE
// ─────────────────────────────────────────────
export function FlightTable({ flights, loading = false }: Props) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("std");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...flights].sort((a, b) => {
    let va: string | number = a[sortKey] ?? "";
    let vb: string | number = b[sortKey] ?? "";
    if (sortDir === "desc") [va, vb] = [vb, va];
    return va < vb ? -1 : va > vb ? 1 : 0;
  });

  // ── HEADER COLUMNS ──
  const COLS = [
    { key: "flightNumber" as SortKey, label: "РЕЙС",     sortable: true,  className: "w-[90px]" },
    { key: null,                       label: "МАРШРУТ",  sortable: false, className: "flex-1 min-w-[160px]" },
    { key: "std" as SortKey,           label: "ВЫЛ / ПРИ", sortable: true, className: "w-[110px]" },
    { key: "aircraft" as SortKey,      label: "БОРТ",     sortable: true,  className: "w-[90px] hidden md:block" },
    { key: null,                       label: "ЭКИПАЖ",   sortable: false, className: "w-[100px] hidden lg:block" },
    { key: "distance" as SortKey,      label: "КМ / НМ",  sortable: true,  className: "w-[80px]  hidden xl:block" },
    { key: "status" as SortKey,        label: "СТАТУС",   sortable: true,  className: "w-[130px]" },
    { key: null,                       label: "",          sortable: false, className: "w-[32px]" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(7,20,40,0.5)",
        border: "1px solid rgba(26,86,168,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── TABLE HEADER ── */}
      <div
        className="flex items-center gap-4 px-5 py-3 text-[10px]"
        style={{
          background: "rgba(26,86,168,0.06)",
          borderBottom: "1px solid rgba(26,86,168,0.15)",
        }}
      >
        {COLS.map((col, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1",
              col.className,
              col.sortable && "cursor-pointer select-none hover:text-[--text-primary] transition-colors"
            )}
            style={{ color: col.sortable && sortKey === col.key ? "var(--cyan-primary)" : "var(--text-dim)" }}
            onClick={() => col.sortable && col.key && handleSort(col.key)}
          >
            <span className="font-mono uppercase tracking-wider">{col.label}</span>
            {col.sortable && col.key && (
              <SortIcon col={col.key} active={sortKey} dir={sortDir} />
            )}
          </div>
        ))}
      </div>

      {/* ── ROWS ── */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {sorted.map((flight, idx) => {
            const isHovered = hoveredRow === flight.id;
            const isActive = flight.status === "active";
            const isDelayed = flight.status === "delayed";
            const isCancelled = flight.status === "cancelled";

            return (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="group relative cursor-pointer"
                style={{
                  borderBottom: "1px solid rgba(26,86,168,0.08)",
                }}
                onMouseEnter={() => setHoveredRow(flight.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => router.push(`/flights/${flight.id}`)}
              >
                {/* Hover background */}
                <div
                  className="absolute inset-0 transition-all duration-200 pointer-events-none"
                  style={{
                    background: isHovered ? "rgba(26,86,168,0.06)" : "transparent",
                    borderLeft: isHovered
                      ? "2px solid var(--cyan-primary)"
                      : "2px solid transparent",
                  }}
                />

                {/* Active flight glow */}
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(16,185,129,0.03) 0%, transparent 30%)",
                    }}
                  />
                )}

                <div className="relative flex items-center gap-4 px-5 py-4">
                  {/* Flight number */}
                  <div className="w-[90px] shrink-0">
                    <div
                      className="font-mono text-sm font-bold"
                      style={{
                        color: isCancelled
                          ? "var(--text-dim)"
                          : "var(--text-primary)",
                        textDecoration: isCancelled ? "line-through" : "none",
                      }}
                    >
                      {flight.flightNumber}
                    </div>
                    <div
                      className="font-mono text-[10px] mt-0.5"
                      style={{ color: "var(--text-dim)", opacity: 0.6 }}
                    >
                      {flight.callsign}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--cyan-primary)" }}
                        >
                          {flight.departure.iata}
                        </span>
                        <div
                          className="text-[9px] mt-0.5"
                          style={{ color: "var(--text-dim)", opacity: 0.7 }}
                        >
                          {flight.departure.icao}
                        </div>
                      </div>

                      {/* Route arrow */}
                      <div className="flex-1 flex items-center gap-1 max-w-[80px]">
                        <div
                          className="flex-1 h-px"
                          style={{ background: "rgba(26,86,168,0.3)" }}
                        />
                        <motion.div
                          animate={
                            isActive
                              ? { x: [0, 4, 0], opacity: [1, 0.6, 1] }
                              : {}
                          }
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Plane
                            size={10}
                            style={{ color: isActive ? "var(--green-ok)" : "var(--text-dim)" }}
                          />
                        </motion.div>
                        <div
                          className="flex-1 h-px"
                          style={{ background: "rgba(26,86,168,0.3)" }}
                        />
                      </div>

                      <div>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: "var(--blue-bright)" }}
                        >
                          {flight.arrival.iata}
                        </span>
                        <div
                          className="text-[9px] mt-0.5"
                          style={{ color: "var(--text-dim)", opacity: 0.7 }}
                        >
                          {flight.arrival.icao}
                        </div>
                      </div>
                    </div>

                    {/* Flight progress */}
                    <FlightProgress flight={flight} />

                    {/* Delay warning */}
                    {isDelayed && flight.delayMinutes && (
                      <div
                        className="flex items-center gap-1 mt-1"
                        style={{ color: "var(--amber-warn)" }}
                      >
                        <AlertTriangle size={9} />
                        <span className="text-[9px] font-mono">
                          +{flight.delayMinutes} мин · {flight.delayReason}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Times */}
                  <div className="w-[110px] shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={10}
                        style={{ color: "var(--text-dim)", opacity: 0.6 }}
                      />
                      <div>
                        <div
                          className="font-mono text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {flight.atd ?? flight.etd ?? flight.std}
                          <span
                            className="mx-1"
                            style={{ color: "var(--text-dim)" }}
                          >
                            →
                          </span>
                          {flight.ata ?? flight.eta ?? flight.sta}
                        </div>
                        <div
                          className="font-mono text-[9px]"
                          style={{ color: "var(--text-dim)", opacity: 0.6 }}
                        >
                          {Math.floor(flight.blockTime / 60)}h{" "}
                          {flight.blockTime % 60}min блок
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aircraft */}
                  <div className="w-[90px] shrink-0 hidden md:block">
                    <div
                      className="font-mono text-xs font-semibold px-2 py-1 rounded-lg inline-block"
                      style={{
                        background: "rgba(26,86,168,0.1)",
                        border: "1px solid rgba(26,86,168,0.25)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {flight.aircraft}
                    </div>
                    <div
                      className="font-mono text-[9px] mt-1"
                      style={{ color: "var(--text-dim)", opacity: 0.6 }}
                    >
                      {flight.registration}
                    </div>
                  </div>

                  {/* Crew */}
                  <div className="w-[100px] shrink-0 hidden lg:block">
                    {flight.crew.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <Users
                            size={10}
                            style={{ color: "var(--text-dim)" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {flight.crew.length} чел.
                          </span>
                        </div>
                        <div
                          className="text-[10px] mt-0.5 truncate"
                          style={{ color: "var(--text-dim)", opacity: 0.7 }}
                        >
                          {flight.crew.find((c) => c.role === "PIC")?.name ?? "—"}
                        </div>
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-dim)", opacity: 0.4 }}
                      >
                        —
                      </span>
                    )}
                  </div>

                  {/* Distance */}
                  <div className="w-[80px] shrink-0 hidden xl:block">
                    <div
                      className="font-mono text-xs font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {flight.distance} nm
                    </div>
                    <div
                      className="font-mono text-[9px]"
                      style={{ color: "var(--text-dim)", opacity: 0.6 }}
                    >
                      {Math.round(flight.distance * 1.852)} km
                    </div>
                  </div>

                  {/* Status */}
                  <div className="w-[130px] shrink-0">
                    <FlightStatusBadge status={flight.status} size="md" />
                    {flight.paxCount !== undefined && (
                      <div
                        className="flex items-center gap-1 mt-1.5"
                        style={{ color: "var(--text-dim)" }}
                      >
                        <Users size={9} />
                        <span className="font-mono text-[9px]">
                          {flight.paxCount}/{flight.totalSeats} PAX
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="w-[32px] shrink-0 flex items-center justify-center">
                    <ChevronRight
                      size={15}
                      className={cn(
                        "transition-all duration-200",
                        isHovered
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-1"
                      )}
                      style={{ color: "var(--cyan-primary)" }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
