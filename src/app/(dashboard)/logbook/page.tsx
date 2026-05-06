"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  apiGetLogbook,
  apiCreateLogbookEntry,
  apiDeleteLogbookEntry,
  apiUpdateLogbookEntry,
  type LogbookEntryRaw,
  type CreateLogbookEntryPayload,
} from "@/lib/logbook-api";
import { apiFetchCrewMembers } from "@/lib/crew-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlightRole = "PIC" | "SIC" | "DUAL" | "INSTRUCTOR";
type FlightRules = "VFR" | "IFR" | "SVFR";
type FlightStatus =
  | "COMPLETED"
  | "IN_PROGRESS"
  | "SCHEDULED"
  | "CANCELLED"
  | "DELAYED";
type ApproachType =
  | "РМС/Р"
  | "РМС/Д"
  | "РМС/А"
  | "ВИЗ"
  | "ILS"
  | "RNAV"
  | "VOR"
  | "NDB";
type LeftSeatPosition = "КВС" | "ЛИ";
type RightSeatPosition = "ВП" | "ЛИ";

interface CrewMemberLocal {
  id: string;
  name: string;
  role: string;
  license?: string;
}

interface LogbookEntry {
  id: string;
  acType: string;
  acReg: string;
  date: string;
  arrDate?: string;
  depIcao: string;
  arrIcao: string;
  depTime: string;
  arrTime: string;
  totalTime: string;
  picTime: string;
  sicTime: string;
  nightTime: string;
  ifrTime: string;
  actualImc: string;
  simInstrument: string;
  leftSeatPerson: string;
  leftSeatPos: LeftSeatPosition;
  rightSeatPerson: string;
  rightSeatPos: RightSeatPosition;
  flightAttendants: string[];
  engineers: string[];
  technicians: string[];
  mechanics: string[];
  exerciseNumber?: string;
  maxAltitude?: number;
  minAltitude?: number;
  cloudiness?: number;
  cloudBase?: number;
  cloudTop?: number;
  visibility?: number;
  approachType?: ApproachType;
  landingsDay: number;
  landingsNight: number;
  passengers?: number;
  cargo?: number;
  operationType: "Commercial" | "Training" | "Ferry" | "Private" | "Check";
  role: FlightRole;
  rules: FlightRules;
  status: FlightStatus;
  crossCountry: boolean;
  remarks?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = {
  base:    "#141824",   // страница
  card:    "#1e2330",   // карточки / таблица
  input:   "#252b3b",   // поля ввода, вложенные блоки
  hover:   "#2d3446",   // hover строк
  deep:    "#111520",   // глубокий фон (expanded row, modal)
  modal:   "#1a1f2e",   // модальное окно
  section: "#1e2330",   // секции формы
  inset:   "#252b3b",   // вложенные карточки в форме
} as const;

const BORDER = {
  default: "#2d3446",
  blue:    "rgba(59,130,246,0.25)",
  blueHi:  "rgba(59,130,246,0.45)",
} as const;

// ─── Crew API mapping ─────────────────────────────────────────────────────────

const CATEGORY_TO_ROLE: Record<string, string> = {
  COMMANDER:      "КВС",
  SECOND_PILOT:   "ВП",
  INSTRUCTOR:     "ЛИ",
  ENGINEER:       "БИ",
  TECHNICIAN:     "БТ",
  MECHANIC:       "БМ",
  FLIGHT_ATTENDANT: "БП",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiCrew(member: any): CrewMemberLocal {
  return {
    id: member.id,
    name: [member.lastName, member.firstName, member.middleName]
      .filter(Boolean)
      .join(" "),
    role: CATEGORY_TO_ROLE[member.category] ?? member.category,
    license: member.licenseExpiry
      ? `до ${String(member.licenseExpiry).slice(0, 7)}`
      : undefined,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeToMin = (t: string): number => {
  if (!t || t === "-") return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minToHHMM = (m: number): string =>
  `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

const calcFlightTime = (
  depTime: string,
  arrTime: string,
  depDate?: string,
  arrDate?: string,
): string => {
  if (!depTime || !arrTime) return "";
  const [dh, dm] = depTime.split(":").map(Number);
  const [ah, am] = arrTime.split(":").map(Number);
  const depMinutes = dh * 60 + dm;
  const arrMinutes = ah * 60 + am;
  if (depDate && arrDate && depDate !== arrDate) {
    const dep = new Date(`${depDate}T${depTime}:00Z`);
    const arr = new Date(`${arrDate}T${arrTime}:00Z`);
    const diffMs = arr.getTime() - dep.getTime();
    if (diffMs > 0) return minToHHMM(Math.round(diffMs / 60000));
  }
  let diff = arrMinutes - depMinutes;
  if (diff <= 0) diff += 24 * 60;
  return minToHHMM(diff);
};

const normalizeStatus = (
  status: unknown,
  fallback: FlightStatus = "COMPLETED",
): FlightStatus => {
  if (!status) return fallback;
  const upper = String(status).toUpperCase() as FlightStatus;
  const valid: FlightStatus[] = [
    "COMPLETED", "IN_PROGRESS", "SCHEDULED", "CANCELLED", "DELAYED",
  ];
  return valid.includes(upper) ? upper : fallback;
};

function rawToEntry(e: LogbookEntryRaw): LogbookEntry {
  return {
    id: e.id,
    acType: e.acType,
    acReg: e.acReg,
    date: e.date?.slice(0, 10) ?? "",
    arrDate: e.arrDate ? e.arrDate.slice(0, 10) : undefined,
    depIcao: e.depIcao,
    arrIcao: e.arrIcao,
    depTime: e.depTime ?? "",
    arrTime: e.arrTime ?? "",
    totalTime: minToHHMM(Number(e.totalTime) || 0),
    picTime: minToHHMM(Number(e.picTime) || 0),
    sicTime: minToHHMM(Number(e.sicTime) || 0),
    nightTime: minToHHMM(Number(e.nightTime) || 0),
    ifrTime: minToHHMM(Number(e.ifrTime) || 0),
    actualImc: minToHHMM(Number(e.actualImc) || 0),
    simInstrument: minToHHMM(Number(e.simInstrument) || 0),
    leftSeatPerson: e.leftSeatPerson ?? "",
    leftSeatPos: (e.leftSeatPos ?? "КВС") as LeftSeatPosition,
    rightSeatPerson: e.rightSeatPerson ?? "",
    rightSeatPos: (e.rightSeatPos ?? "ВП") as RightSeatPosition,
    flightAttendants: Array.isArray(e.flightAttendants) ? e.flightAttendants : [],
    engineers: Array.isArray(e.engineers) ? e.engineers : [],
    technicians: Array.isArray(e.technicians) ? e.technicians : [],
    mechanics: Array.isArray(e.mechanics) ? e.mechanics : [],
    exerciseNumber: e.exerciseNumber ?? undefined,
    maxAltitude: e.maxAltitude ?? undefined,
    minAltitude: e.minAltitude ?? undefined,
    cloudiness: e.cloudiness ?? undefined,
    cloudBase: e.cloudBase ?? undefined,
    cloudTop: e.cloudTop ?? undefined,
    visibility: e.visibility ?? undefined,
    approachType: e.approachType ? (e.approachType as ApproachType) : undefined,
    landingsDay: e.landingsDay ?? 0,
    landingsNight: e.landingsNight ?? 0,
    passengers: e.passengers ?? undefined,
    cargo: e.cargo ?? undefined,
    operationType: (e.operationType ?? "Commercial") as LogbookEntry["operationType"],
    role: (e.role ?? "PIC") as FlightRole,
    rules: (e.rules ?? "IFR") as FlightRules,
    status: normalizeStatus(e.status),
    crossCountry: e.crossCountry ?? true,
    remarks: e.remarks ?? undefined,
  };
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  background: BG.input,
  border: `1px solid ${BORDER.default}`,
  borderRadius: 7,
  padding: "7px 11px",
  color: "#e2e8f0",
  fontSize: 12,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const lbl: React.CSSProperties = {
  fontSize: 10,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
  marginBottom: 4,
  display: "block",
};

const section: React.CSSProperties = {
  background: BG.section,
  border: `1px solid ${BORDER.default}`,
  borderRadius: 12,
  padding: "16px 18px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 10,
  color: "#3b82f6",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 800,
  marginBottom: 14,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 9,
  color: "#64748b",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  borderBottom: `1px solid ${BORDER.default}`,
  background: BG.deep,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 14px",
  borderBottom: `1px solid ${BORDER.default}`,
  verticalAlign: "middle",
};

// ─── SearchInput ──────────────────────────────────────────────────────────────

function SearchInput({ onSearch }: { onSearch: (v: string) => void }) {
  const [local, setLocal] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(v), 150);
  };

  return (
    <input
      value={local}
      onChange={handleChange}
      placeholder="Поиск по ICAO, ВС..."
      style={{ ...inp, paddingLeft: 32 }}
    />
  );
}

// ─── ScaleBar ─────────────────────────────────────────────────────────────────

function ScaleBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 8,
            borderRadius: 2,
            background: i < value ? color : BG.hover,
            border: `1px solid ${i < value ? color + "60" : BORDER.default}`,
          }}
        />
      ))}
      <span style={{ fontSize: 11, color, marginLeft: 4, fontWeight: 700 }}>
        {value}/{max}
      </span>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: BG.card,
        border: `1px solid ${accent}25`,
        borderRadius: 11,
        padding: "14px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg,${accent}88,transparent)`,
        }}
      />
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: `${color}15`,
        color,
        border: `1px solid ${color}30`,
        letterSpacing: "0.06em",
      }}
    >
      {text}
    </span>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<FlightStatus, { label: string; color: string }> = {
  COMPLETED:   { label: "Выполнен",     color: "#4ade80" },
  IN_PROGRESS: { label: "В воздухе",    color: "#60a5fa" },
  SCHEDULED:   { label: "Запланирован", color: "#a78bfa" },
  CANCELLED:   { label: "Отменён",      color: "#f87171" },
  DELAYED:     { label: "Задержан",     color: "#fbbf24" },
};

const getStatusCfg = (status: FlightStatus) =>
  STATUS_CFG[status] ?? { label: status ?? "—", color: "#64748b" };

const APPROACH_TYPES: ApproachType[] = [
  "РМС/Р", "РМС/Д", "РМС/А", "ВИЗ", "ILS", "RNAV", "VOR", "NDB",
];
const OP_TYPES = ["Commercial", "Training", "Ferry", "Private", "Check"];

const ROLE_COLOR: Record<FlightRole, string> = {
  PIC:        "#34d399",
  SIC:        "#60a5fa",
  DUAL:       "#fbbf24",
  INSTRUCTOR: "#c084fc",
};

// ─── EntryRow ─────────────────────────────────────────────────────────────────

function EntryRow({
  e,
  isOpen,
  onToggle,
  onDelete,
  onEdit,
}: {
  e: LogbookEntry;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const sc = getStatusCfg(e.status);
  const isOvernight = e.arrDate && e.arrDate !== e.date;

  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          cursor: "pointer",
          background: isOpen ? BG.hover : hovered ? BG.card : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td style={tdStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{e.date}</div>
          {isOvernight && (
            <div style={{ fontSize: 10, color: "#818cf8", marginTop: 2 }}>🌙 +1 {e.arrDate}</div>
          )}
        </td>
        <td style={tdStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{e.acType}</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{e.acReg}</div>
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa" }}>{e.depIcao}</span>
            <span style={{ color: BORDER.default }}>→</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#34d399" }}>{e.arrIcao}</span>
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>
            {e.depTime} –{" "}
            {isOvernight ? (
              <span style={{ color: "#818cf8" }}>{e.arrDate} {e.arrTime}</span>
            ) : (
              e.arrTime
            )}{" "}
            UTC
          </div>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
            {e.totalTime}
          </span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 13, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>
            {e.picTime !== "0:00" ? e.picTime : "—"}
          </span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 13, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>
            {e.sicTime !== "0:00" ? e.sicTime : "—"}
          </span>
        </td>
        <td style={tdStyle}>
          <div style={{ fontSize: 11, color: "#818cf8" }}>🌙 {e.nightTime !== "0:00" ? e.nightTime : "—"}</div>
          <div style={{ fontSize: 11, color: "#f59e0b" }}>IMC {e.actualImc !== "0:00" ? e.actualImc : "—"}</div>
        </td>
        <td style={tdStyle}>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {e.leftSeatPos}: <span style={{ color: "#94a3b8" }}>{e.leftSeatPerson?.split(" ")[0]}</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {e.rightSeatPos}: <span style={{ color: "#94a3b8" }}>{e.rightSeatPerson?.split(" ")[0]}</span>
          </div>
          {(e.flightAttendants?.length ?? 0) > 0 && (
            <div style={{ fontSize: 10, color: "#475569" }}>БП: {e.flightAttendants.length}чел.</div>
          )}
        </td>
        <td style={tdStyle}>
          <div style={{ fontSize: 11, color: "#fbbf24" }}>☀ {e.landingsDay}</div>
          <div style={{ fontSize: 11, color: "#818cf8" }}>🌙 {e.landingsNight}</div>
        </td>
        <td style={tdStyle}>
          {e.approachType && (
            <div style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>{e.approachType}</div>
          )}
        </td>
        <td style={tdStyle}>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 800,
              background: `${ROLE_COLOR[e.role]}15`,
              color: ROLE_COLOR[e.role],
              border: `1px solid ${ROLE_COLOR[e.role]}30`,
            }}
          >
            {e.role}
          </span>
        </td>
        <td style={tdStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: sc.color }}>● {sc.label}</span>
            <span style={{ fontSize: 12, color: "#475569", marginLeft: "auto" }}>{isOpen ? "▲" : "▼"}</span>
          </div>
        </td>
      </tr>

      {isOpen && (
        <tr>
          <td
            colSpan={12}
            style={{ padding: "0 0 1px 0", background: BG.deep }}
          >
            <div
              style={{
                padding: "20px 24px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 16,
              }}
            >
              {/* Условия полёта */}
              <div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                  Условия полёта
                </div>
                {[
                  { label: "IFR",            value: e.ifrTime },
                  { label: "VFR",            value: e.rules === "VFR" ? e.totalTime : "0:00" },
                  { label: "Actual IMC",     value: e.actualImc },
                  { label: "Sim. Instrument",value: e.simInstrument },
                  { label: "Макс. высота",   value: e.maxAltitude ? `FL${Math.floor(e.maxAltitude / 100)}` : "—" },
                  { label: "Мин. высота",    value: e.minAltitude ? `${e.minAltitude} ft` : "—" },
                ].map((r) => (
                  <div
                    key={r.label}
                    style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER.default}` }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                      {r.value || "—"}
                    </span>
                  </div>
                ))}
                {e.exerciseNumber && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>№ упражнения</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa" }}>{e.exerciseNumber}</span>
                  </div>
                )}
              </div>

              {/* Заход */}
              <div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                  Заход на посадку
                </div>
                {e.approachType && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: BG.hover, color: "#60a5fa" }}>
                      {e.approachType}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ background: BG.input, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24" }}>{e.landingsDay}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>☀ Дневные</div>
                  </div>
                  <div style={{ background: BG.input, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#818cf8" }}>{e.landingsNight}</div>
                    <div style={{ fontSize: 9, color: "#64748b" }}>🌙 Ночные</div>
                  </div>
                </div>
                {e.cloudiness !== undefined && (
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Метеоусловия
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Облачность</div>
                        <ScaleBar value={e.cloudiness} max={10} color="#60a5fa" />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Видимость</div>
                        <ScaleBar value={e.visibility ?? 0} max={10} color="#34d399" />
                      </div>
                      {e.cloudBase && (
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          НГО: <span style={{ color: "#94a3b8" }}>{e.cloudBase} ft</span>
                          &nbsp;·&nbsp; ВГО: <span style={{ color: "#94a3b8" }}>{e.cloudTop} ft</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Экипаж */}
              <div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                  Экипаж
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    { label: `✈ Лев. кресло (${e.leftSeatPos})`,  value: e.leftSeatPerson,  color: "#34d399" },
                    { label: `✈ Прав. кресло (${e.rightSeatPos})`, value: e.rightSeatPerson, color: "#60a5fa" },
                  ].map((r) => (
                    <div key={r.label} style={{ background: BG.input, borderRadius: 7, padding: "8px 12px" }}>
                      <div style={{ fontSize: 9, color: "#475569" }}>{r.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginTop: 2 }}>{r.value}</div>
                    </div>
                  ))}
                  {(e.flightAttendants?.length ?? 0) > 0 && (
                    <div style={{ background: BG.input, borderRadius: 7, padding: "8px 12px" }}>
                      <div style={{ fontSize: 9, color: "#475569" }}>БП (бортпроводники)</div>
                      <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 2 }}>{e.flightAttendants.join(", ")}</div>
                    </div>
                  )}
                  {(e.engineers?.length ?? 0) > 0 && (
                    <div style={{ background: BG.input, borderRadius: 7, padding: "8px 12px" }}>
                      <div style={{ fontSize: 9, color: "#475569" }}>Бортинженер(ы)</div>
                      <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 2 }}>{e.engineers.join(", ")}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Дополнительно */}
              <div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 700 }}>
                  Дополнительно
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {isOvernight && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER.default}` }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Дата прилёта</span>
                      <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 700 }}>🌙 {e.arrDate}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER.default}` }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Тип операции</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{e.operationType}</span>
                  </div>
                  {e.passengers !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER.default}` }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Пассажиры</span>
                      <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>{e.passengers} чел.</span>
                    </div>
                  )}
                  {e.cargo !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER.default}` }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>Груз</span>
                      <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>{e.cargo} кг</span>
                    </div>
                  )}
                  {e.crossCountry && (
                    <div style={{ padding: "5px 0" }}>
                      <Badge text="Cross-Country" color="#60a5fa" />
                    </div>
                  )}
                </div>
                {e.remarks && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Примечания
                    </div>
                    <div
                      style={{
                        background: BG.input,
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        color: "#94a3b8",
                        lineHeight: 1.6,
                        borderLeft: "2px solid #fbbf24",
                      }}
                    >
                      {e.remarks}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onEdit(); }}
                    style={{
                      flex: 1, padding: "8px", borderRadius: 7,
                      border: `1px solid ${BORDER.default}`,
                      background: BG.hover,
                      color: "#60a5fa", cursor: "pointer",
                      fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                    }}
                  >
                    ✏ Редактировать
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onDelete(); }}
                    style={{
                      padding: "8px 14px", borderRadius: 7,
                      border: "1px solid rgba(248,113,113,0.25)",
                      background: "rgba(248,113,113,0.08)",
                      color: "#f87171", cursor: "pointer",
                      fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                    }}
                  >
                    🗑 Удалить
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── FormState & emptyForm ────────────────────────────────────────────────────

type FormState = {
  acType: string;
  acReg: string;
  date: string;
  arrDate: string;
  depIcao: string;
  arrIcao: string;
  depTime: string;
  arrTime: string;
  totalTime: string;
  picTime: string;
  sicTime: string;
  nightTime: string;
  ifrTime: string;
  actualImc: string;
  simInstrument: string;
  leftSeatPerson: string;
  leftSeatPos: LeftSeatPosition;
  leftSeatCrewId: string;
  rightSeatCrewId: string;
  attendantIds: string[];
  engineerIds: string[];
  technicianIds: string[];
  rightSeatPerson: string;
  rightSeatPos: RightSeatPosition;
  flightAttendants: string[];
  engineers: string[];
  technicians: string[];
  mechanics: string[];
  exerciseNumber: string;
  maxAltitude: string;
  minAltitude: string;
  cloudiness: string;
  cloudBase: string;
  cloudTop: string;
  visibility: string;
  approachType: string;
  landingsDay: string;
  landingsNight: string;
  passengers: string;
  cargo: string;
  operationType: string;
  role: FlightRole;
  rules: FlightRules;
  status: FlightStatus;
  crossCountry: boolean;
  remarks: string;
};

const emptyForm: FormState = {
  acType: "",
  acReg: "",
  date: "",
  arrDate: "",
  depIcao: "",
  arrIcao: "",
  depTime: "",
  arrTime: "",
  totalTime: "",
  picTime: "",
  sicTime: "",
  nightTime: "0:00",
  ifrTime: "",
  actualImc: "0:00",
  simInstrument: "0:00",
  leftSeatPerson: "",
  leftSeatPos: "КВС",
  leftSeatCrewId: "",
  rightSeatCrewId: "",
  attendantIds: [],
  engineerIds: [],
  technicianIds: [],
  rightSeatPerson: "",
  rightSeatPos: "ВП",
  flightAttendants: [],
  engineers: [],
  technicians: [],
  mechanics: [],
  exerciseNumber: "",
  maxAltitude: "",
  minAltitude: "",
  cloudiness: "5",
  cloudBase: "",
  cloudTop: "",
  visibility: "10",
  approachType: "РМС/Р",
  landingsDay: "1",
  landingsNight: "0",
  passengers: "",
  cargo: "",
  operationType: "Commercial",
  role: "PIC",
  rules: "IFR",
  status: "COMPLETED",
  crossCountry: true,
  remarks: "",
};

// ─── MultiSelect ──────────────────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: CrewMemberLocal[];
  selectedIds: string[];
  onChange: (ids: string[], names: string[]) => void;
}) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    const names = next.map((nid) => options.find((o) => o.id === nid)?.name ?? nid);
    onChange(next, names);
  };

  return (
    <div>
      <label style={lbl}>{label}</label>
      {options.length === 0 ? (
        <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic", padding: "6px 0" }}>
          Нет доступных членов экипажа
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {options.map((c) => {
            const on = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  border: "none",
                  background: on ? "rgba(59,130,246,0.15)" : BG.input,
                  color: on ? "#60a5fa" : "#64748b",
                  outline: on
                    ? "1px solid rgba(59,130,246,0.40)"
                    : `1px solid ${BORDER.default}`,
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}
      {selectedIds.length > 0 && (
        <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
          Выбрано:{" "}
          {selectedIds
            .map((id) => options.find((o) => o.id === id)?.name ?? id)
            .join(", ")}
        </div>
      )}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label: l,
  value,
  onChange,
  type = "text",
  placeholder = "",
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label style={lbl}>{l}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ ...inp, ...(readOnly ? { color: "#60a5fa", cursor: "default" } : {}) }}
      />
    </div>
  );
}

// ─── FormSelect ───────────────────────────────────────────────────────────────

function FormSelect({
  label: l,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={lbl}>{l}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inp}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── ModalForm ────────────────────────────────────────────────────────────────

interface ModalFormProps {
  initialForm: FormState;
  crewMembers: CrewMemberLocal[];
  onSave: (form: FormState) => Promise<void>;
  isSaving: boolean;
  error: string;
}

function ModalForm({ initialForm, crewMembers, onSave, isSaving, error }: ModalFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);

  const set = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) =>
      setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  const handleTimeChange = useCallback(
    (field: "depTime" | "arrTime", value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        const dep = field === "depTime" ? value : prev.depTime;
        const arr = field === "arrTime" ? value : prev.arrTime;
        if (dep && arr) {
          const total = calcFlightTime(dep, arr, next.date || undefined, next.arrDate || undefined);
          const isPic = next.role === "PIC" || next.role === "INSTRUCTOR";
          const isSic = next.role === "SIC" || next.role === "DUAL";
          next.totalTime = total;
          next.picTime = isPic ? total : "0:00";
          next.sicTime = isSic ? total : "0:00";
          next.ifrTime = next.rules === "IFR" ? total : "0:00";
        }
        return next;
      });
    },
    [],
  );

  const handleDateChange = useCallback(
    (field: "date" | "arrDate", value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        if (next.depTime && next.arrTime) {
          const total = calcFlightTime(
            next.depTime, next.arrTime,
            next.date || undefined, next.arrDate || undefined,
          );
          const isPic = next.role === "PIC" || next.role === "INSTRUCTOR";
          const isSic = next.role === "SIC" || next.role === "DUAL";
          next.totalTime = total;
          next.picTime = isPic ? total : "0:00";
          next.sicTime = isSic ? total : "0:00";
          next.ifrTime = next.rules === "IFR" ? total : "0:00";
        }
        return next;
      });
    },
    [],
  );

  const handleRoleChange = useCallback((role: FlightRole) => {
    setForm((prev) => ({
      ...prev, role,
      picTime: role === "PIC" || role === "INSTRUCTOR" ? prev.totalTime : "0:00",
      sicTime: role === "SIC" || role === "DUAL" ? prev.totalTime : "0:00",
    }));
  }, []);

  const handleRulesChange = useCallback((rules: FlightRules) => {
    setForm((prev) => ({
      ...prev, rules,
      ifrTime: rules === "IFR" ? prev.totalTime : "0:00",
    }));
  }, []);

  const handleLeftSeatSelect = useCallback(
    (id: string) => {
      const member = crewMembers.find((c) => c.id === id);
      setForm((prev) => ({
        ...prev, leftSeatCrewId: id, leftSeatPerson: member?.name ?? "",
      }));
    },
    [crewMembers],
  );

  const handleRightSeatSelect = useCallback(
    (id: string) => {
      const member = crewMembers.find((c) => c.id === id);
      setForm((prev) => ({
        ...prev, rightSeatCrewId: id, rightSeatPerson: member?.name ?? "",
      }));
    },
    [crewMembers],
  );

  const handleFormSave = async () => {
    if (!form.date || !form.depIcao || !form.arrIcao || !form.acType || !form.acReg) return;
    await onSave(form);
  };

  const leftSeatOptions  = crewMembers.filter((c) => ["КВС", "ЛИ"].includes(c.role));
  const rightSeatOptions = crewMembers.filter((c) => ["ВП", "ЛИ"].includes(c.role));
  const faOptions        = crewMembers.filter((c) => c.role === "БП");
  const engOptions       = crewMembers.filter((c) => c.role === "БИ");
  const techOptions      = crewMembers.filter((c) => ["БТ", "БМ"].includes(c.role));

  const isOvernight = form.arrDate && form.arrDate !== form.date;

  return (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      {crewMembers.length === 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 8,
            fontSize: 12,
            color: "#f59e0b",
          }}
        >
          ⚠ Нет данных экипажа. Добавьте сотрудников в разделе «Летный состав».
        </div>
      )}

      {/* ВС */}
      <div style={section}>
        <div style={sectionTitle}>✈ Воздушное судно</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Тип ВС" value={form.acType} onChange={(v) => set("acType", v)} placeholder="A320-271N" />
          <Field label="Бортовой номер" value={form.acReg} onChange={(v) => set("acReg", v)} placeholder="UP-A2001" />
        </div>
      </div>

      {/* Маршрут */}
      <div style={section}>
        <div style={sectionTitle}>🗺 Маршрут</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Дата вылета</label>
            <input type="date" value={form.date} onChange={(e) => handleDateChange("date", e.target.value)} style={inp} />
          </div>
          <Field label="Аэропорт вылета (ICAO)" value={form.depIcao} onChange={(v) => set("depIcao", v)} placeholder="UAAA" />
          <Field label="Время вылета (UTC)" value={form.depTime} onChange={(v) => handleTimeChange("depTime", v)} type="time" />

          <div>
            <label style={lbl}>Дата прилёта (если другая)</label>
            <input type="date" value={form.arrDate} onChange={(e) => handleDateChange("arrDate", e.target.value)} style={inp} />
            {!form.arrDate && (
              <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                Оставьте пустым если = дате вылета
              </div>
            )}
          </div>
          <Field label="Аэропорт прилёта (ICAO)" value={form.arrIcao} onChange={(v) => set("arrIcao", v)} placeholder="UACC" />
          <Field label="Время прилёта (UTC)" value={form.arrTime} onChange={(v) => handleTimeChange("arrTime", v)} type="time" />
        </div>

        {isOvernight && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "rgba(129,140,248,0.08)",
              border: "1px solid rgba(129,140,248,0.25)",
              borderRadius: 8,
              fontSize: 12,
              color: "#818cf8",
            }}
          >
            🌙 Ночной перелёт: вылет <strong>{form.date}</strong> → прилёт <strong>{form.arrDate}</strong>
            {form.totalTime && <span style={{ marginLeft: 12, color: "#34d399" }}>⏱ {form.totalTime}</span>}
          </div>
        )}
      </div>

      {/* Налёт */}
      <div style={section}>
        <div style={sectionTitle}>
          ⏱ Налёт
          <span style={{ color: "#475569", fontWeight: 400, fontSize: 9, textTransform: "none", letterSpacing: 0 }}>
            (рассчитывается автоматически с учётом дат)
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Field label="Общий (TOTAL)" value={form.totalTime} readOnly placeholder="авто" />
          <Field label="PIC (Командир)" value={form.picTime} readOnly placeholder="авто" />
          <Field label="SIC (Второй)" value={form.sicTime} readOnly placeholder="авто" />
          <Field label="Ночной налёт" value={form.nightTime} onChange={(v) => set("nightTime", v)} placeholder="0:00" />
          <Field label="IFR" value={form.ifrTime} readOnly placeholder="авто" />
          <Field label="Actual IMC" value={form.actualImc} onChange={(v) => set("actualImc", v)} placeholder="0:25" />
        </div>
        {form.totalTime && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: BG.input,
              borderRadius: 8,
              fontSize: 12,
              color: "#34d399",
            }}
          >
            ✓ Налёт рассчитан: <strong>{form.totalTime}</strong>
            {isOvernight && (
              <span style={{ marginLeft: 8, color: "#818cf8", fontSize: 11 }}>
                🌙 с учётом разницы дат
              </span>
            )}
          </div>
        )}
      </div>

      {/* Экипаж */}
      <div style={section}>
        <div style={sectionTitle}>
          👥 Экипаж
          <span style={{ fontSize: 10, color: "#475569", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
            ({crewMembers.length} сотрудников загружено из БД)
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {/* Левое кресло */}
          <div
            style={{
              background: BG.input,
              borderRadius: 9,
              padding: 14,
              border: "1px solid rgba(59,130,246,0.20)",
            }}
          >
            <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              ✈ Левое кресло
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={lbl}>Должность</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["КВС", "ЛИ"] as LeftSeatPosition[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => set("leftSeatPos", p)}
                      style={{
                        flex: 1, padding: "5px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: form.leftSeatPos === p ? "rgba(59,130,246,0.20)" : BG.hover,
                        color: form.leftSeatPos === p ? "#60a5fa" : "#64748b",
                        fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                        outline: form.leftSeatPos === p
                          ? "1px solid rgba(59,130,246,0.45)"
                          : `1px solid ${BORDER.default}`,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>
                  ФИО{" "}
                  <span style={{ color: "#475569", fontWeight: 400, textTransform: "none", marginLeft: 4 }}>
                    ({leftSeatOptions.length} доступно)
                  </span>
                </label>
                <select
                  value={form.leftSeatCrewId}
                  onChange={(e) => handleLeftSeatSelect(e.target.value)}
                  style={inp}
                >
                  <option value="">— Выбрать —</option>
                  {leftSeatOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.role}{c.license ? ` · ${c.license}` : ""}
                    </option>
                  ))}
                </select>
                {form.leftSeatPerson && (
                  <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 4 }}>
                    ✓ {form.leftSeatPerson}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правое кресло */}
          <div
            style={{
              background: BG.input,
              borderRadius: 9,
              padding: 14,
              border: "1px solid rgba(52,211,153,0.20)",
            }}
          >
            <div style={{ fontSize: 10, color: "#34d399", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              ✈ Правое кресло
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={lbl}>Должность</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["ВП", "ЛИ"] as RightSeatPosition[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => set("rightSeatPos", p)}
                      style={{
                        flex: 1, padding: "5px", borderRadius: 6, border: "none", cursor: "pointer",
                        background: form.rightSeatPos === p ? "rgba(52,211,153,0.20)" : BG.hover,
                        color: form.rightSeatPos === p ? "#34d399" : "#64748b",
                        fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                        outline: form.rightSeatPos === p
                          ? "1px solid rgba(52,211,153,0.45)"
                          : `1px solid ${BORDER.default}`,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>
                  ФИО{" "}
                  <span style={{ color: "#475569", fontWeight: 400, textTransform: "none", marginLeft: 4 }}>
                    ({rightSeatOptions.length} доступно)
                  </span>
                </label>
                <select
                  value={form.rightSeatCrewId}
                  onChange={(e) => handleRightSeatSelect(e.target.value)}
                  style={inp}
                >
                  <option value="">— Выбрать —</option>
                  {rightSeatOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.role}{c.license ? ` · ${c.license}` : ""}
                    </option>
                  ))}
                </select>
                {form.rightSeatPerson && (
                  <div style={{ fontSize: 10, color: "#34d399", marginTop: 4 }}>
                    ✓ {form.rightSeatPerson}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <MultiSelect
            label={`Бортпроводники (БП) — ${faOptions.length} доступно`}
            options={faOptions}
            selectedIds={form.attendantIds}
            onChange={(ids, names) => setForm((p) => ({ ...p, attendantIds: ids, flightAttendants: names }))}
          />
          <MultiSelect
            label={`Бортинженеры (БИ) — ${engOptions.length} доступно`}
            options={engOptions}
            selectedIds={form.engineerIds}
            onChange={(ids, names) => setForm((p) => ({ ...p, engineerIds: ids, engineers: names }))}
          />
          <MultiSelect
            label={`Борттехники / Бортмеханики — ${techOptions.length} доступно`}
            options={techOptions}
            selectedIds={form.technicianIds}
            onChange={(ids, names) => setForm((p) => ({ ...p, technicianIds: ids, technicians: names }))}
          />
        </div>
      </div>

      {/* Параметры полёта */}
      <div style={section}>
        <div style={sectionTitle}>📐 Параметры полёта</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Field label="Номер упражнения" value={form.exerciseNumber} onChange={(v) => set("exerciseNumber", v)} placeholder="УВ-12 или —" />
          <Field label="Макс. высота (ft)" value={form.maxAltitude} onChange={(v) => set("maxAltitude", v)} type="number" placeholder="37000" />
          <Field label="Мин. высота (ft)" value={form.minAltitude} onChange={(v) => set("minAltitude", v)} type="number" placeholder="1200" />
        </div>
      </div>

      {/* Метеоусловия */}
      <div style={section}>
        <div style={sectionTitle}>🌤 Метеоусловия</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Облачность (0–10)</label>
            <input type="range" min={0} max={10} value={form.cloudiness} onChange={(e) => set("cloudiness", e.target.value)} style={{ width: "100%", accentColor: "#60a5fa" }} />
            <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, textAlign: "center" }}>{form.cloudiness} / 10</div>
          </div>
          <div>
            <label style={lbl}>Видимость (0–10)</label>
            <input type="range" min={0} max={10} value={form.visibility} onChange={(e) => set("visibility", e.target.value)} style={{ width: "100%", accentColor: "#34d399" }} />
            <div style={{ fontSize: 12, color: "#34d399", fontWeight: 700, textAlign: "center" }}>{form.visibility} / 10</div>
          </div>
          <Field label="НГО (нижн. граница, ft)" value={form.cloudBase} onChange={(v) => set("cloudBase", v)} placeholder="2500" />
          <Field label="ВГО (верхн. граница, ft)" value={form.cloudTop} onChange={(v) => set("cloudTop", v)} placeholder="18000" />
        </div>
      </div>

      {/* Заход */}
      <div style={section}>
        <div style={sectionTitle}>🛬 Заход на посадку</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <FormSelect label="Способ захода" value={form.approachType} onChange={(v) => set("approachType", v)} options={APPROACH_TYPES} />
          <Field label="Посадки дневные" value={form.landingsDay} onChange={(v) => set("landingsDay", v)} type="number" />
          <Field label="Посадки ночные" value={form.landingsNight} onChange={(v) => set("landingsNight", v)} type="number" />
        </div>
      </div>

      {/* Перевозка */}
      <div style={section}>
        <div style={sectionTitle}>📦 Перевозка</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Field label="Пассажиры (чел.)" value={form.passengers} onChange={(v) => set("passengers", v)} type="number" placeholder="142" />
          <Field label="Груз (кг)" value={form.cargo} onChange={(v) => set("cargo", v)} type="number" placeholder="3400" />
          <FormSelect label="Тип операции" value={form.operationType} onChange={(v) => set("operationType", v)} options={OP_TYPES} />
          <div>
            <label style={lbl}>Cross-Country</label>
            <button
              onClick={() => set("crossCountry", !form.crossCountry)}
              style={{
                width: "100%", padding: "7px", borderRadius: 7, border: "none", cursor: "pointer",
                background: form.crossCountry ? "rgba(59,130,246,0.15)" : BG.input,
                color: form.crossCountry ? "#60a5fa" : "#64748b",
                outline: form.crossCountry
                  ? "1px solid rgba(59,130,246,0.40)"
                  : `1px solid ${BORDER.default}`,
                fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              {form.crossCountry ? "✓ Да" : "Нет"}
            </button>
          </div>
        </div>
      </div>

      {/* Прочее */}
      <div style={section}>
        <div style={sectionTitle}>⚙ Прочее</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <FormSelect label="Функция" value={form.role} onChange={(v) => handleRoleChange(v as FlightRole)} options={["PIC", "SIC", "DUAL", "INSTRUCTOR"]} />
          <FormSelect label="Правила полёта" value={form.rules} onChange={(v) => handleRulesChange(v as FlightRules)} options={["IFR", "VFR", "SVFR"]} />
          <FormSelect label="Статус" value={form.status} onChange={(v) => set("status", v as FlightStatus)} options={["COMPLETED", "SCHEDULED", "IN_PROGRESS", "DELAYED", "CANCELLED"]} />
        </div>
        <div>
          <label style={lbl}>Примечания</label>
          <textarea
            value={form.remarks}
            onChange={(e) => set("remarks", e.target.value)}
            rows={3}
            placeholder="Особые условия, замечания, ATC..."
            style={{ ...inp, resize: "none" }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.30)",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            color: "#f87171",
          }}
        >
          ⚠ {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={handleFormSave}
          disabled={isSaving}
          style={{
            padding: "9px 24px", borderRadius: 8, border: "none",
            background: isSaving
              ? "rgba(29,78,216,0.5)"
              : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(59,130,246,0.30)",
          }}
        >
          {isSaving ? "⏳ Сохранение..." : "✓ Сохранить"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.70)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: BG.modal,
          border: `1px solid ${BORDER.default}`,
          borderRadius: 16,
          width: 720,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.60)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${BORDER.default}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{title}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${BORDER.default}`,
              color: "#64748b",
              width: 30, height: 30,
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>

        {children}

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${BORDER.default}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 8,
              border: `1px solid ${BORDER.default}`,
              background: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AddModal ─────────────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
  onSaved: (entry: LogbookEntry) => void;
  crewMembers: CrewMemberLocal[];
}

function AddModal({ onClose, onSaved, crewMembers }: AddModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (form: FormState) => {
    if (!form.date || !form.depIcao || !form.arrIcao || !form.acType || !form.acReg) {
      setError("Заполните обязательные поля: ВС, дата, маршрут");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: CreateLogbookEntryPayload = {
        acType: form.acType, acReg: form.acReg,
        date: form.date, arrDate: form.arrDate || undefined,
        depIcao: form.depIcao, arrIcao: form.arrIcao,
        depTime: form.depTime, arrTime: form.arrTime,
        totalTime: timeToMin(form.totalTime),
        picTime: timeToMin(form.picTime),
        sicTime: timeToMin(form.sicTime),
        nightTime: timeToMin(form.nightTime),
        ifrTime: timeToMin(form.ifrTime),
        actualImc: timeToMin(form.actualImc),
        simInstrument: timeToMin(form.simInstrument),
        leftSeatPerson: form.leftSeatPerson, leftSeatPos: form.leftSeatPos,
        rightSeatPerson: form.rightSeatPerson, rightSeatPos: form.rightSeatPos,
        flightAttendants: form.flightAttendants,
        engineers: form.engineers,
        technicians: form.technicians,
        mechanics: form.mechanics,
        exerciseNumber: form.exerciseNumber || undefined,
        maxAltitude: form.maxAltitude ? Number(form.maxAltitude) : null,
        minAltitude: form.minAltitude ? Number(form.minAltitude) : null,
        cloudiness: Number(form.cloudiness),
        cloudBase: form.cloudBase ? Number(form.cloudBase) : null,
        cloudTop: form.cloudTop ? Number(form.cloudTop) : null,
        visibility: Number(form.visibility),
        approachType: form.approachType || undefined,
        landingsDay: Number(form.landingsDay),
        landingsNight: Number(form.landingsNight),
        passengers: form.passengers ? Number(form.passengers) : null,
        cargo: form.cargo ? Number(form.cargo) : null,
        operationType: form.operationType,
        role: form.role, rules: form.rules, status: form.status,
        crossCountry: form.crossCountry,
        remarks: form.remarks || undefined,
        leftSeatCrewId: form.leftSeatCrewId || undefined,
        rightSeatCrewId: form.rightSeatCrewId || undefined,
        attendantIds: form.attendantIds,
        engineerIds: form.engineerIds,
        technicianIds: form.technicianIds,
      };
      console.log("📤 Sending CREATE payload:", { payload });
      const saved = await apiCreateLogbookEntry(payload);
      onSaved(rawToEntry(saved));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Добавить запись"
      subtitle="Лётная книжка · ICAO/EASA FCL.050"
      onClose={onClose}
    >
      <ModalForm
        initialForm={emptyForm}
        crewMembers={crewMembers}
        onSave={handleSave}
        isSaving={saving}
        error={error}
      />
    </ModalShell>
  );
}

// ─── EditModal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  entry: LogbookEntry;
  onClose: () => void;
  onSaved: (entry: LogbookEntry) => void;
  crewMembers: CrewMemberLocal[];
}

function EditModal({ entry, onClose, onSaved, crewMembers }: EditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const initialForm: FormState = {
    acType: entry.acType, acReg: entry.acReg,
    date: entry.date, arrDate: entry.arrDate || "",
    depIcao: entry.depIcao, arrIcao: entry.arrIcao,
    depTime: entry.depTime, arrTime: entry.arrTime,
    totalTime: entry.totalTime, picTime: entry.picTime,
    sicTime: entry.sicTime, nightTime: entry.nightTime,
    ifrTime: entry.ifrTime, actualImc: entry.actualImc,
    simInstrument: entry.simInstrument,
    leftSeatPerson: entry.leftSeatPerson, leftSeatPos: entry.leftSeatPos,
    leftSeatCrewId: "", rightSeatCrewId: "",
    attendantIds: [], engineerIds: [], technicianIds: [],
    rightSeatPerson: entry.rightSeatPerson, rightSeatPos: entry.rightSeatPos,
    flightAttendants: entry.flightAttendants || [],
    engineers: entry.engineers || [],
    technicians: entry.technicians || [],
    mechanics: entry.mechanics || [],
    exerciseNumber: entry.exerciseNumber || "",
    maxAltitude: entry.maxAltitude ? String(entry.maxAltitude) : "",
    minAltitude: entry.minAltitude ? String(entry.minAltitude) : "",
    cloudiness: entry.cloudiness ? String(entry.cloudiness) : "5",
    cloudBase: entry.cloudBase ? String(entry.cloudBase) : "",
    cloudTop: entry.cloudTop ? String(entry.cloudTop) : "",
    visibility: entry.visibility ? String(entry.visibility) : "10",
    approachType: entry.approachType || "РМС/Р",
    landingsDay: String(entry.landingsDay || 0),
    landingsNight: String(entry.landingsNight || 0),
    passengers: entry.passengers ? String(entry.passengers) : "",
    cargo: entry.cargo ? String(entry.cargo) : "",
    operationType: entry.operationType,
    role: entry.role, rules: entry.rules, status: entry.status,
    crossCountry: entry.crossCountry,
    remarks: entry.remarks || "",
  };

  const handleSave = async (form: FormState) => {
    if (!form.date || !form.depIcao || !form.arrIcao || !form.acType || !form.acReg) {
      setError("Заполните обязательные поля: ВС, дата, маршрут");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: CreateLogbookEntryPayload = {
        acType: form.acType, acReg: form.acReg,
        date: form.date, arrDate: form.arrDate || undefined,
        depIcao: form.depIcao, arrIcao: form.arrIcao,
        depTime: form.depTime, arrTime: form.arrTime,
        totalTime: timeToMin(form.totalTime),
        picTime: timeToMin(form.picTime),
        sicTime: timeToMin(form.sicTime),
        nightTime: timeToMin(form.nightTime),
        ifrTime: timeToMin(form.ifrTime),
        actualImc: timeToMin(form.actualImc),
        simInstrument: timeToMin(form.simInstrument),
        leftSeatPerson: form.leftSeatPerson, leftSeatPos: form.leftSeatPos,
        rightSeatPerson: form.rightSeatPerson, rightSeatPos: form.rightSeatPos,
        flightAttendants: form.flightAttendants,
        engineers: form.engineers,
        technicians: form.technicians,
        mechanics: form.mechanics,
        exerciseNumber: form.exerciseNumber || undefined,
        maxAltitude: form.maxAltitude ? Number(form.maxAltitude) : null,
        minAltitude: form.minAltitude ? Number(form.minAltitude) : null,
        cloudiness: Number(form.cloudiness),
        cloudBase: form.cloudBase ? Number(form.cloudBase) : null,
        cloudTop: form.cloudTop ? Number(form.cloudTop) : null,
        visibility: Number(form.visibility),
        approachType: form.approachType || undefined,
        landingsDay: Number(form.landingsDay),
        landingsNight: Number(form.landingsNight),
        passengers: form.passengers ? Number(form.passengers) : null,
        cargo: form.cargo ? Number(form.cargo) : null,
        operationType: form.operationType,
        role: form.role, rules: form.rules, status: form.status,
        crossCountry: form.crossCountry,
        remarks: form.remarks || undefined,
        leftSeatCrewId: form.leftSeatCrewId || undefined,
        rightSeatCrewId: form.rightSeatCrewId || undefined,
        attendantIds: form.attendantIds,
        engineerIds: form.engineerIds,
        technicianIds: form.technicianIds,
      };
      const updated = await apiUpdateLogbookEntry(entry.id, payload);
      onSaved(rawToEntry(updated));
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Редактировать запись"
      subtitle={`✏ ${entry.date} · ${entry.acType} ${entry.acReg}`}
      onClose={onClose}
    >
      <ModalForm
        initialForm={initialForm}
        crewMembers={crewMembers}
        onSave={handleSave}
        isSaving={saving}
        error={error}
      />
    </ModalShell>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LogbookPage() {
  const [entries,       setEntries]       = useState<LogbookEntry[]>([]);
  const [crewMembers,   setCrewMembers]   = useState<CrewMemberLocal[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry,  setEditingEntry]  = useState<LogbookEntry | null>(null);
  const [search,        setSearch]        = useState("");
  const [roleFilter,    setRoleFilter]    = useState<"ALL" | FlightRole>("ALL");

  const fetchEntries = useCallback(async () => {
    try {
      const arr = await apiGetLogbook();
      setEntries(arr.map(rawToEntry));
    } catch (err) {
      console.error("Не удалось загрузить записи:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCrew = useCallback(async () => {
    try {
      const apiCrew = await apiFetchCrewMembers({}, "lastName", "asc");
      setCrewMembers(apiCrew.map(mapApiCrew));
    } catch (err) {
      console.error("Не удалось загрузить экипаж:", err);
    }
  }, []);

  useEffect(() => { fetchEntries(); fetchCrew(); }, [fetchEntries, fetchCrew]);

  const handleAddClose  = useCallback(() => setShowAddModal(false), []);
  const handleEditClose = useCallback(() => {
    setShowEditModal(false);
    setEditingEntry(null);
  }, []);

  const handleEntrySaved = useCallback((entry: LogbookEntry) => {
    setEntries((p) => {
      const idx = p.findIndex((e) => e.id === entry.id);
      if (idx >= 0) { const next = [...p]; next[idx] = entry; return next; }
      return [entry, ...p];
    });
    setExpanded(null);
  }, []);

  const handleOpenEdit = useCallback((entry: LogbookEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
    setExpanded(null);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await apiDeleteLogbookEntry(id);
      setEntries((p) => p.filter((e) => e.id !== id));
      setExpanded(null);
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Дата","ДатаПрилёта","Тип ВС","Борт","Вылет","Прилёт",
      "Вр.вылета","Вр.прилёта","TOTAL","PIC","SIC","Ночь","IFR",
      "ActIMC","SimInstr","Лев.кресло","Лев.должн","Прав.кресло",
      "Прав.должн","БП","БИ","Упражнение","МаксВысота","МинВысота",
      "Облачность","НГО","ВГО","Видимость","Заход","ПосадкиДень",
      "ПосадкиНочь","Пассажиры","Груз","ТипОперации","Функция",
      "Правила","Статус","CrossCountry","Примечания",
    ];
    const rows = entries.map((e) => [
      e.date, e.arrDate ?? "", e.acType, e.acReg,
      e.depIcao, e.arrIcao, e.depTime, e.arrTime,
      e.totalTime, e.picTime, e.sicTime, e.nightTime,
      e.ifrTime, e.actualImc, e.simInstrument,
      e.leftSeatPerson, e.leftSeatPos, e.rightSeatPerson, e.rightSeatPos,
      (e.flightAttendants ?? []).join(";"), (e.engineers ?? []).join(";"),
      e.exerciseNumber ?? "", e.maxAltitude ?? "", e.minAltitude ?? "",
      e.cloudiness ?? "", e.cloudBase ?? "", e.cloudTop ?? "",
      e.visibility ?? "", e.approachType ?? "",
      e.landingsDay, e.landingsNight,
      e.passengers ?? "", e.cargo ?? "",
      e.operationType, e.role, e.rules, e.status,
      e.crossCountry ? "Да" : "Нет", e.remarks ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logbook_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rows.length < 2) return;
        const [header, ...body] = rows;
        const idx = (name: string) => header.indexOf(name);
        const get = (row: string[], name: string) => String(row[idx(name)] ?? "").trim();
        const imported: LogbookEntry[] = body
          .filter((r) => r.some((c) => c !== ""))
          .map((r, i) => ({
            id: `import_${Date.now()}_${i}`,
            date: get(r, "Дата"),
            arrDate: get(r, "ДатаПрилёта") || undefined,
            acType: get(r, "Тип ВС"),
            acReg: get(r, "Борт"),
            depIcao: get(r, "Вылет"),
            arrIcao: get(r, "Прилёт"),
            depTime: get(r, "Вр.вылета"),
            arrTime: get(r, "Вр.прилёта"),
            totalTime: get(r, "TOTAL") || "0:00",
            picTime: get(r, "PIC") || "0:00",
            sicTime: get(r, "SIC") || "0:00",
            nightTime: get(r, "Ночь") || "0:00",
            ifrTime: get(r, "IFR") || "0:00",
            actualImc: get(r, "ActIMC") || "0:00",
            simInstrument: get(r, "SimInstr") || "0:00",
            leftSeatPerson: get(r, "Лев.кресло"),
            leftSeatPos: (get(r, "Лев.должн") || "КВС") as LeftSeatPosition,
            rightSeatPerson: get(r, "Прав.кресло"),
            rightSeatPos: (get(r, "Прав.должн") || "ВП") as RightSeatPosition,
            flightAttendants: get(r, "БП") ? get(r, "БП").split(";").filter(Boolean) : [],
            engineers: get(r, "БИ") ? get(r, "БИ").split(";").filter(Boolean) : [],
            technicians: [], mechanics: [],
            exerciseNumber: get(r, "Упражнение") || undefined,
            maxAltitude: get(r, "МаксВысота") ? Number(get(r, "МаксВысота")) : undefined,
            minAltitude: get(r, "МинВысота") ? Number(get(r, "МинВысота")) : undefined,
            cloudiness: get(r, "Облачность") ? Number(get(r, "Облачность")) : undefined,
            cloudBase: get(r, "НГО") ? Number(get(r, "НГО")) : undefined,
            cloudTop: get(r, "ВГО") ? Number(get(r, "ВГО")) : undefined,
            visibility: get(r, "Видимость") ? Number(get(r, "Видимость")) : undefined,
            approachType: (get(r, "Заход") || undefined) as ApproachType | undefined,
            landingsDay: Number(get(r, "ПосадкиДень")) || 0,
            landingsNight: Number(get(r, "ПосадкиНочь")) || 0,
            passengers: get(r, "Пассажиры") ? Number(get(r, "Пассажиры")) : undefined,
            cargo: get(r, "Груз") ? Number(get(r, "Груз")) : undefined,
            operationType: (get(r, "ТипОперации") || "Commercial") as LogbookEntry["operationType"],
            role: (get(r, "Функция") || "PIC") as FlightRole,
            rules: (get(r, "Правила") || "IFR") as FlightRules,
            status: normalizeStatus(get(r, "Статус")),
            crossCountry: get(r, "CrossCountry") === "Да",
            remarks: get(r, "Примечания") || undefined,
          }));
        setEntries((prev) => [...imported, ...prev]);
      } catch (err) {
        console.error("Ошибка импорта:", err);
        alert("Ошибка при чтении файла.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }, []);

  const handlePrint = useCallback(() => {
    const totMin   = entries.reduce((a, e) => a + timeToMin(e.totalTime), 0);
    const picMin   = entries.reduce((a, e) => a + timeToMin(e.picTime), 0);
    const sicMin   = entries.reduce((a, e) => a + timeToMin(e.sicTime), 0);
    const nightMin = entries.reduce((a, e) => a + timeToMin(e.nightTime), 0);
    const ifrMin   = entries.reduce((a, e) => a + timeToMin(e.ifrTime), 0);

    const rows = entries.map((e) => `
      <tr>
        <td>${e.date}${e.arrDate && e.arrDate !== e.date ? `<br/><span style="color:#6666cc;font-size:9px">→${e.arrDate}</span>` : ""}</td>
        <td>${e.acType}<br/><span style="color:#666;font-size:10px">${e.acReg}</span></td>
        <td><b>${e.depIcao}</b> → <b>${e.arrIcao}</b><br/><span style="color:#666;font-size:10px">${e.depTime}–${e.arrTime} UTC</span></td>
        <td>${e.totalTime}</td>
        <td>${e.picTime !== "0:00" ? e.picTime : "—"}</td>
        <td>${e.sicTime !== "0:00" ? e.sicTime : "—"}</td>
        <td>${e.nightTime !== "0:00" ? e.nightTime : "—"}</td>
        <td>${e.ifrTime !== "0:00" ? e.ifrTime : "—"}</td>
        <td>${e.leftSeatPos}: ${e.leftSeatPerson}<br/>${e.rightSeatPos}: ${e.rightSeatPerson}</td>
        <td>${e.landingsDay + e.landingsNight}</td>
        <td>${e.approachType ?? "—"}</td>
        <td>${e.role}</td>
        <td>${e.status}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Лётная книжка</title>
      <style>
        body{font-family:'Courier New',monospace;font-size:11px;color:#000;margin:20px}
        h1{font-size:18px;margin-bottom:4px}
        table{width:100%;border-collapse:collapse}
        th{background:#1a1a2e;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase}
        td{padding:5px 8px;border-bottom:1px solid #ddd;vertical-align:top;font-size:10px}
        tr:nth-child(even) td{background:#f8f8f8}
        tfoot td{background:#1a1a2e;color:#fff;font-weight:bold;padding:6px 8px}
      </style></head><body>
      <h1>📒 Лётная книжка</h1>
      <p style="font-size:10px;color:#666">ICAO/EASA FCL.050 · ${new Date().toLocaleString("ru-RU")} · ${entries.length} записей</p>
      <table>
        <thead><tr>
          <th>Дата</th><th>ВС</th><th>Маршрут</th><th>TOTAL</th>
          <th>PIC</th><th>SIC</th><th>Ночь</th><th>IFR</th>
          <th>Экипаж</th><th>Посадки</th><th>Заход</th><th>Функция</th><th>Статус</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="3">ИТОГО (${entries.length})</td>
          <td>${minToHHMM(totMin)}</td><td>${minToHHMM(picMin)}</td>
          <td>${minToHHMM(sicMin)}</td><td>${minToHHMM(nightMin)}</td>
          <td>${minToHHMM(ifrMin)}</td>
          <td colspan="5">${entries.reduce((a, e) => a + e.landingsDay + e.landingsNight, 0)} посадок</td>
        </tr></tfoot>
      </table>
      <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
      </body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        const q = search.toLowerCase();
        const ms =
          !q ||
          e.depIcao.toLowerCase().includes(q) ||
          e.arrIcao.toLowerCase().includes(q) ||
          e.acType.toLowerCase().includes(q) ||
          e.acReg.toLowerCase().includes(q);
        return ms && (roleFilter === "ALL" || e.role === roleFilter);
      }),
    [entries, search, roleFilter],
  );

  const totMin   = entries.reduce((a, e) => a + timeToMin(e.totalTime), 0);
  const picMin   = entries.reduce((a, e) => a + timeToMin(e.picTime), 0);
  const sicMin   = entries.reduce((a, e) => a + timeToMin(e.sicTime), 0);
  const nightMin = entries.reduce((a, e) => a + timeToMin(e.nightTime), 0);
  const ifrMin   = entries.reduce((a, e) => a + timeToMin(e.ifrTime), 0);
  const totLand  = entries.reduce((a, e) => a + e.landingsDay + e.landingsNight, 0);
  const totPax   = entries.reduce((a, e) => a + (e.passengers ?? 0), 0);

  const handleToggle = useCallback(
    (id: string) => setExpanded((p) => (p === id ? null : id)),
    [],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG.base,
        color: "#e2e8f0",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${BG.card}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER.default}; border-radius: 2px; }
        select option { background: ${BG.modal}; }
        input[type=range] { height: 4px; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}
            >
              📒
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: 0, letterSpacing: "-0.01em" }}>
                Лётная книжка
              </h1>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Pilot Logbook · ICAO/EASA FCL.050 Format
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
            {[
              { label: "⬇ Экспорт CSV",   onClick: handleExportCSV },
              { label: "⬆ Импорт Excel",  onClick: () => importInputRef.current?.click() },
              { label: "🖨 Печать",        onClick: handlePrint },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: `1px solid ${BORDER.default}`,
                  background: BG.card,
                  color: "#64748b",
                  cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                }}
              >
                {btn.label}
              </button>
            ))}
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 800,
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(59,130,246,0.30)",
              }}
            >
              + Добавить запись
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10, marginBottom: 20 }}>
          <StatCard label="Общий налёт"  value={minToHHMM(totMin)}   sub={`${(totMin / 60).toFixed(1)}ч`} accent="#3b82f6" />
          <StatCard label="PIC"          value={minToHHMM(picMin)}   sub="Командир"     accent="#34d399" />
          <StatCard label="SIC"          value={minToHHMM(sicMin)}   sub="Второй пилот" accent="#60a5fa" />
          <StatCard label="Ночной"       value={minToHHMM(nightMin)} sub="Night time"   accent="#818cf8" />
          <StatCard label="IFR"          value={minToHHMM(ifrMin)}   sub="IMC"          accent="#f59e0b" />
          <StatCard label="Посадки"      value={String(totLand)}     sub={`${entries.length} рейсов`} accent="#f97316" />
          <StatCard label="Пассажиры"    value={String(totPax)}      sub="всего чел."   accent="#ec4899" />
        </div>

        {/* Validity bar */}
        <div
          style={{
            background: BG.card,
            border: `1px solid ${BORDER.default}`,
            borderRadius: 10,
            padding: "12px 20px",
            marginBottom: 18,
            display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: "#64748b" }}>📅 Валидность налёта:</span>
          {[
            {
              label: "90 дней",
              value: minToHHMM(
                entries
                  .filter((e) => Date.now() - new Date(e.date).getTime() <= 90 * 86400_000)
                  .reduce((a, e) => a + timeToMin(e.totalTime), 0),
              ),
            },
            {
              label: "12 месяцев",
              value: minToHHMM(
                entries
                  .filter((e) => Date.now() - new Date(e.date).getTime() <= 365 * 86400_000)
                  .reduce((a, e) => a + timeToMin(e.totalTime), 0),
              ),
            },
            {
              label: "Cross-Country",
              value: minToHHMM(
                entries
                  .filter((e) => e.crossCountry)
                  .reduce((a, e) => a + timeToMin(e.totalTime), 0),
              ),
            },
          ].map((v) => (
            <div key={v.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>{v.label}:</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>
                {v.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span
              style={{
                position: "absolute", left: 11, top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b", fontSize: 12, zIndex: 1,
              }}
            >
              🔍
            </span>
            <SearchInput onSearch={setSearch} />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "ALL" | FlightRole)}
            style={{ ...inp, width: "auto", cursor: "pointer" }}
          >
            <option value="ALL">Все полёты</option>
            <option value="PIC">PIC (Командир)</option>
            <option value="SIC">SIC (Второй пилот)</option>
            <option value="DUAL">DUAL</option>
            <option value="INSTRUCTOR">Инструктор</option>
          </select>
          <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
            Показано: {filtered.length} из {entries.length}
          </span>
        </div>

        {/* Table */}
        <div
          style={{
            background: BG.card,
            border: `1px solid ${BORDER.default}`,
            borderRadius: 14,
            overflow: "auto",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
            <thead>
              <tr>
                {[
                  "Дата","Воздушное судно","Маршрут","TOTAL",
                  "PIC","SIC","Ночь/IMC","Экипаж","Посадки",
                  "Заход","Функция","Статус",
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>Загрузка из БД...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
                    <div>Записей нет. Добавьте первый полёт!</div>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <EntryRow
                    key={e.id}
                    e={e}
                    isOpen={expanded === e.id}
                    onToggle={() => handleToggle(e.id)}
                    onDelete={() => deleteEntry(e.id)}
                    onEdit={() => handleOpenEdit(e)}
                  />
                ))
              )}
            </tbody>

            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: BG.deep }}>
                  <td colSpan={3} style={{ padding: "10px 14px", fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    ИТОГО ({filtered.length} записей)
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>
                    {minToHHMM(filtered.reduce((a, e) => a + timeToMin(e.totalTime), 0))}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#34d399", fontVariantNumeric: "tabular-nums" }}>
                    {minToHHMM(filtered.reduce((a, e) => a + timeToMin(e.picTime), 0))}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}>
                    {minToHHMM(filtered.reduce((a, e) => a + timeToMin(e.sicTime), 0))}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#818cf8", fontVariantNumeric: "tabular-nums" }}>
                    🌙 {minToHHMM(filtered.reduce((a, e) => a + timeToMin(e.nightTime), 0))}
                  </td>
                  <td colSpan={2} style={{ padding: "10px 14px", fontSize: 12, color: "#fbbf24" }}>
                    {filtered.reduce((a, e) => a + e.landingsDay + e.landingsNight, 0)} посадок
                  </td>
                  <td colSpan={3} style={{ padding: "10px 14px", fontSize: 12, color: "#ec4899" }}>
                    {filtered.reduce((a, e) => a + (e.passengers ?? 0), 0)} пасс.
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#2d3446" }}>
          ICAO Annex 1 · EASA Part-FCL FCL.050 · Все времена UTC
        </div>
      </div>

      {showAddModal && (
        <AddModal onClose={handleAddClose} onSaved={handleEntrySaved} crewMembers={crewMembers} />
      )}
      {showEditModal && editingEntry && (
        <EditModal entry={editingEntry} onClose={handleEditClose} onSaved={handleEntrySaved} crewMembers={crewMembers} />
      )}
    </div>
  );
}
