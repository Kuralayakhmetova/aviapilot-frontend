"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plane, Clock, Users, Fuel,
  MapPin, Radio, Wind, Thermometer,
  Eye, Gauge, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { MOCK_FLIGHTS } from "@/data/flights.mock";
import { FlightStatusBadge } from "@/components/flights/FlightStatusBadge";

// ─────────────────────────────────────────────
// INFO BLOCK
// ─────────────────────────────────────────────
function InfoRow({
  label,
  value,
  mono = false,
  color,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-4"
      style={{ borderBottom: "1px solid rgba(26,86,168,0.08)" }}
    >
      <span
        className="hud-label text-[10px] shrink-0"
        style={{ opacity: 0.45, letterSpacing: "0.1em" }}
      >
        {label}
      </span>
      <span
        className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────
function SectionCard({
  title,
  icon: Icon,
  children,
  accent = "var(--blue-bright)",
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(7,20,40,0.5)",
        border: "1px solid rgba(26,86,168,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(26,86,168,0.12)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
          }}
        >
          <Icon size={13} style={{ color: accent }} />
        </div>
        <span
          className="hud-label text-[11px] font-semibold"
          style={{ color: "var(--text-secondary)", letterSpacing: "0.1em" }}
        >
          {title}
        </span>
      </div>

      <div className="px-5 pb-4">{children}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// CREW MEMBER ROW
// ─────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  PIC: "КВС",
  FO:  "Второй пилот",
  SO:  "Штурман",
  FA:  "Бортпроводник",
  FA2: "Бортпроводник 2",
  FA3: "Бортпроводник 3",
};

// ─────────────────────────────────────────────
// FLIGHT DETAIL PAGE
// ─────────────────────────────────────────────
export default function FlightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flight = MOCK_FLIGHTS.find((f) => f.id === params.id);

  if (!flight) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Plane size={40} style={{ color: "var(--text-dim)", opacity: 0.3 }} />
        <p style={{ color: "var(--text-muted)" }}>Рейс не найден</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{
            background: "rgba(26,86,168,0.1)",
            border: "1px solid rgba(26,86,168,0.3)",
            color: "var(--blue-bright)",
          }}
        >
          <ArrowLeft size={14} />
          Назад
        </button>
      </div>
    );
  }

  const blockHours = Math.floor(flight.blockTime / 60);
  const blockMins  = flight.blockTime % 60;

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* ── HEADER ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       transition-all duration-200"
            style={{
              background: "rgba(26,86,168,0.1)",
              border: "1px solid rgba(26,86,168,0.25)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,86,168,0.5)";
              (e.currentTarget as HTMLElement).style.color = "var(--blue-bright)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(26,86,168,0.25)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1
                className="font-mono text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {flight.flightNumber}
              </h1>
              <FlightStatusBadge status={flight.status} size="lg" />
            </div>
            <p
              className="hud-label text-[10px] mt-0.5"
              style={{ opacity: 0.4, letterSpacing: "0.12em" }}
            >
              {flight.callsign} · {flight.registration} · {flight.aircraft}
            </p>
          </div>
        </div>

        {/* Route summary */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p
              className="font-mono text-2xl font-bold"
              style={{ color: "var(--cyan-primary)" }}
            >
              {flight.departure.iata}
            </p>
            <p
              className="hud-label text-[10px]"
              style={{ opacity: 0.4 }}
            >
              {flight.departure.icao}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 px-2">
            <motion.div
              animate={
                flight.status === "active"
                  ? { x: [0, 6, 0], opacity: [1, 0.6, 1] }
                  : {}
              }
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Plane
                size={18}
                style={{
                  color:
                    flight.status === "active"
                      ? "var(--green-ok)"
                      : "var(--text-dim)",
                }}
              />
            </motion.div>
            <span
              className="font-mono text-[10px]"
              style={{ color: "var(--text-dim)", opacity: 0.5 }}
            >
              {flight.distance} nm
            </span>
          </div>

          <div className="text-left">
            <p
              className="font-mono text-2xl font-bold"
              style={{ color: "var(--blue-bright)" }}
            >
              {flight.arrival.iata}
            </p>
            <p
              className="hud-label text-[10px]"
              style={{ opacity: 0.4 }}
            >
              {flight.arrival.icao}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── CONTENT GRID ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4">

          {/* Schedule */}
          <SectionCard
            title="РАСПИСАНИЕ"
            icon={Clock}
            accent="var(--cyan-primary)"
            delay={0.05}
          >
            <div className="grid grid-cols-2 gap-x-6">
              <div>
                <InfoRow
                  label="STD (ПЛАН ВЫЛЕТ)"
                  value={flight.std}
                  mono
                  color="var(--text-secondary)"
                />
                <InfoRow
                  label="ETD (РАСЧ. ВЫЛЕТ)"
                  value={flight.etd ?? "—"}
                  mono
                  color="var(--blue-bright)"
                />
                <InfoRow
                  label="ATD (ФАКТ. ВЫЛЕТ)"
                  value={flight.atd ?? "—"}
                  mono
                  color={
                    flight.atd ? "var(--green-ok)" : "var(--text-dim)"
                  }
                />
              </div>
              <div>
                <InfoRow
                  label="STA (ПЛАН ПРИЛЁТ)"
                  value={flight.sta}
                  mono
                  color="var(--text-secondary)"
                />
                <InfoRow
                  label="ETA (РАСЧ. ПРИЛЁТ)"
                  value={flight.eta ?? "—"}
                  mono
                  color="var(--blue-bright)"
                />
                <InfoRow
                  label="ATA (ФАКТ. ПРИЛЁТ)"
                  value={flight.ata ?? "—"}
                  mono
                  color={
                    flight.ata ? "var(--green-ok)" : "var(--text-dim)"
                  }
                />
              </div>
            </div>

            <div
              className="mt-3 pt-3 grid grid-cols-3 gap-4"
              style={{ borderTop: "1px solid rgba(26,86,168,0.1)" }}
            >
              {[
                {
                  label: "БЛОК-ВРЕМЯ",
                  value: `${blockHours}ч ${blockMins}м`,
                  color: "var(--cyan-primary)",
                },
                {
                  label: "РАССТОЯНИЕ",
                  value: `${flight.distance} nm`,
                  color: "var(--text-secondary)",
                },
                {
                  label: "ЭШЕЛОН",
                  value: `FL${flight.altitude}`,
                  color: "var(--blue-bright)",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 rounded-xl"
                  style={{
                    background: "rgba(26,86,168,0.06)",
                    border: "1px solid rgba(26,86,168,0.12)",
                  }}
                >
                  <p
                    className="hud-label text-[10px] mb-1"
                    style={{ opacity: 0.4 }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="font-mono font-bold text-base"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Route */}
          <SectionCard
            title="МАРШРУТ"
            icon={MapPin}
            accent="var(--blue-bright)"
            delay={0.1}
          >
            <div
              className="mt-3 p-3 rounded-xl font-mono text-xs leading-relaxed"
              style={{
                background: "rgba(26,86,168,0.06)",
                border: "1px solid rgba(26,86,168,0.12)",
                color: "var(--text-secondary)",
                wordBreak: "break-all",
              }}
            >
              {flight.route}
            </div>

            {flight.alternate && (
              <div className="mt-3">
                <InfoRow
                  label="ЗАПАСНОЙ АЭРОДРОМ"
                  value={`${flight.alternate.icao} / ${flight.alternate.iata} — ${flight.alternate.city}`}
                  color="var(--amber-warn)"
                />
              </div>
            )}
          </SectionCard>

          {/* Crew */}
          <SectionCard
            title="ЭКИПАЖ"
            icon={Users}
            accent="var(--green-ok)"
            delay={0.15}
          >
            {flight.crew.length === 0 ? (
              <p
                className="text-sm py-4 text-center"
                style={{ color: "var(--text-dim)", opacity: 0.5 }}
              >
                Экипаж не назначен
              </p>
            ) : (
              <div className="space-y-2 mt-3">
                {flight.crew.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl
                               transition-all duration-200"
                    style={{
                      background: "rgba(26,86,168,0.05)",
                      border: "1px solid rgba(26,86,168,0.1)",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center
                                 shrink-0 font-mono text-xs font-bold"
                      style={{
                        background:
                          member.role === "PIC"
                            ? "rgba(6,182,212,0.15)"
                            : member.role === "FO"
                            ? "rgba(26,86,168,0.15)"
                            : "rgba(100,116,139,0.15)",
                        border: `1px solid ${
                          member.role === "PIC"
                            ? "rgba(6,182,212,0.3)"
                            : member.role === "FO"
                            ? "rgba(26,86,168,0.3)"
                            : "rgba(100,116,139,0.2)"
                        }`,
                        color:
                          member.role === "PIC"
                            ? "var(--cyan-primary)"
                            : member.role === "FO"
                            ? "var(--blue-bright)"
                            : "#94a3b8",
                      }}
                    >
                      {member.name.split(" ")[0][0]}
                      {member.name.split(" ")[1]?.[0] ?? ""}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {member.name}
                      </p>
                      <p
                        className="font-mono text-[10px]"
                        style={{ color: "var(--text-dim)", opacity: 0.6 }}
                      >
                        {member.license}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-1
                                   rounded-lg"
                        style={{
                          background:
                            member.role === "PIC"
                              ? "rgba(6,182,212,0.1)"
                              : "rgba(26,86,168,0.1)",
                          border: `1px solid ${
                            member.role === "PIC"
                              ? "rgba(6,182,212,0.25)"
                              : "rgba(26,86,168,0.2)"
                          }`,
                          color:
                            member.role === "PIC"
                              ? "var(--cyan-primary)"
                              : "var(--blue-bright)",
                        }}
                      >
                        {member.role}
                      </span>
                      <p
                        className="text-[10px] mt-1"
                        style={{ color: "var(--text-dim)", opacity: 0.5 }}
                      >
                        {member.hoursTotal.toLocaleString()} ч
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Aircraft */}
          <SectionCard
            title="ВОЗДУШНОЕ СУДНО"
            icon={Plane}
            accent="var(--blue-bright)"
            delay={0.08}
          >
            <div className="mt-1">
              <div
                className="text-center py-4 rounded-xl mb-3"
                style={{
                  background: "rgba(26,86,168,0.06)",
                  border: "1px solid rgba(26,86,168,0.12)",
                }}
              >
                <p
                  className="font-mono font-bold text-3xl"
                  style={{ color: "var(--blue-bright)" }}
                >
                  {flight.aircraft}
                </p>
                <p
                  className="font-mono text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {flight.registration}
                </p>
              </div>

              {flight.paxCount !== undefined && (
                <InfoRow
                  label="ПАССАЖИРЫ"
                  value={`${flight.paxCount} / ${flight.totalSeats ?? "—"}`}
                  mono
                  color="var(--text-secondary)"
                />
              )}
              {flight.cargoWeight !== undefined && (
                <InfoRow
                  label="ГРУЗ"
                  value={`${flight.cargoWeight} кг`}
                  mono
                />
              )}
            </div>
          </SectionCard>

          {/* Fuel */}
          <SectionCard
            title="ТОПЛИВО"
            icon={Fuel}
            accent="var(--amber-warn)"
            delay={0.12}
          >
            <div className="mt-1 space-y-1">
              <InfoRow
                label="ПЛАН (КГ)"
                value={flight.fuelPlanned.toLocaleString()}
                mono
                color="var(--text-secondary)"
              />
              {flight.fuelActual !== undefined && (
                <>
                  <InfoRow
                    label="ФАКТ (КГ)"
                    value={flight.fuelActual.toLocaleString()}
                    mono
                    color={
                      flight.fuelActual <= flight.fuelPlanned
                        ? "var(--green-ok)"
                        : "var(--red-alert)"
                    }
                  />
                  <InfoRow
                    label="РАЗНИЦА"
                    value={`${flight.fuelPlanned - flight.fuelActual > 0 ? "+" : ""}${(flight.fuelPlanned - flight.fuelActual).toLocaleString()} кг`}
                    mono
                    color={
                      flight.fuelPlanned - flight.fuelActual >= 0
                        ? "var(--green-ok)"
                        : "var(--red-alert)"
                    }
                  />
                </>
              )}
            </div>
          </SectionCard>

          {/* Delay info */}
          {(flight.status === "delayed" || flight.delayMinutes) && (
            <SectionCard
              title="ЗАДЕРЖКА"
              icon={AlertTriangle}
              accent="var(--amber-warn)"
              delay={0.16}
            >
              <div className="mt-1 space-y-1">
                <InfoRow
                  label="КОД ЗАДЕРЖКИ"
                  value={flight.delayCode ?? "—"}
                  mono
                  color="var(--amber-warn)"
                />
                <InfoRow
                  label="ВРЕМЯ (МИН)"
                  value={flight.delayMinutes ? `+${flight.delayMinutes}` : "—"}
                  mono
                  color="var(--amber-warn)"
                />
              </div>
              {flight.delayReason && (
                <div
                  className="mt-3 p-3 rounded-xl text-xs"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    color: "var(--text-muted)",
                  }}
                >
                  {flight.delayReason}
                </div>
              )}
            </SectionCard>
          )}

          {/* Remarks */}
          {flight.remarks && (
            <SectionCard
              title="ПРИМЕЧАНИЯ"
              icon={Radio}
              accent="var(--text-dim)"
              delay={0.18}
            >
              <p
                className="text-xs mt-3 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {flight.remarks}
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
