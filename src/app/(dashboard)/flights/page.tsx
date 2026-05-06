"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlightStatus = "COMPLETED" | "IN_PROGRESS" | "SCHEDULED" | "CANCELLED" | "DELAYED";
type FlightRole = "PIC" | "SIC" | "DUAL" | "INSTRUCTOR";
type FlightRules = "VFR" | "IFR" | "SVFR";

interface Flight {
  id: string;
  flightNumber: string;
  date: string;
  departure: { icao: string; name: string; time: string };
  arrival: { icao: string; name: string; time: string };
  aircraft: { registration: string; type: string; category: string };
  totalTime: string; // HH:MM
  picTime: string;
  sicTime: string;
  nightTime: string;
  ifrTime: string;
  landings: { day: number; night: number };
  role: FlightRole;
  rules: FlightRules;
  status: FlightStatus;
  remarks?: string;
  distance?: number; // NM
  crossCountry: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FLIGHTS: Flight[] = [
  {
    id: "1",
    flightNumber: "KC101",
    date: "2025-01-15",
    departure: { icao: "UAAA", name: "Алматы", time: "06:30" },
    arrival: { icao: "UACC", name: "Астана", time: "08:15" },
    aircraft: { registration: "UP-A2001", type: "A320-271N", category: "SEL" },
    totalTime: "1:45",
    picTime: "1:45",
    sicTime: "-",
    nightTime: "-",
    ifrTime: "1:45",
    landings: { day: 1, night: 0 },
    role: "PIC",
    rules: "IFR",
    status: "COMPLETED",
    distance: 1082,
    crossCountry: true,
    remarks: "Нормальный полёт, споттер на перроне",
  },
  {
    id: "2",
    flightNumber: "KC102",
    date: "2025-01-15",
    departure: { icao: "UACC", name: "Астана", time: "10:00" },
    arrival: { icao: "UAAA", name: "Алматы", time: "11:40" },
    aircraft: { registration: "UP-A2001", type: "A320-271N", category: "SEL" },
    totalTime: "1:40",
    picTime: "1:40",
    sicTime: "-",
    nightTime: "-",
    ifrTime: "1:40",
    landings: { day: 1, night: 0 },
    role: "PIC",
    rules: "IFR",
    status: "COMPLETED",
    distance: 1082,
    crossCountry: true,
  },
  {
    id: "3",
    flightNumber: "KC205",
    date: "2025-01-14",
    departure: { icao: "UAAA", name: "Алматы", time: "22:30" },
    arrival: { icao: "LTFM", name: "Стамбул", time: "02:45" },
    aircraft: { registration: "UP-B7601", type: "B767-300ER", category: "MEL" },
    totalTime: "4:15",
    picTime: "-",
    sicTime: "4:15",
    nightTime: "4:15",
    ifrTime: "4:15",
    landings: { day: 0, night: 1 },
    role: "SIC",
    rules: "IFR",
    status: "COMPLETED",
    distance: 3812,
    crossCountry: true,
    remarks: "Турбулентность FL280, обход грозы",
  },
  {
    id: "4",
    flightNumber: "KC206",
    date: "2025-01-13",
    departure: { icao: "LTFM", name: "Стамбул", time: "06:00" },
    arrival: { icao: "UAAA", name: "Алматы", time: "12:10" },
    aircraft: { registration: "UP-B7601", type: "B767-300ER", category: "MEL" },
    totalTime: "5:10",
    picTime: "-",
    sicTime: "5:10",
    nightTime: "1:00",
    ifrTime: "5:10",
    landings: { day: 1, night: 0 },
    role: "SIC",
    rules: "IFR",
    status: "COMPLETED",
    distance: 3812,
    crossCountry: true,
  },
  {
    id: "5",
    flightNumber: "KC301",
    date: "2025-01-18",
    departure: { icao: "UAAA", name: "Алматы", time: "14:00" },
    arrival: { icao: "UBBB", name: "Баку", time: "16:30" },
    aircraft: { registration: "UP-A2003", type: "A320-271N", category: "SEL" },
    totalTime: "2:30",
    picTime: "2:30",
    sicTime: "-",
    nightTime: "-",
    ifrTime: "2:30",
    landings: { day: 1, night: 0 },
    role: "PIC",
    rules: "IFR",
    status: "SCHEDULED",
    distance: 2450,
    crossCountry: true,
  },
  {
    id: "6",
    flightNumber: "KC115",
    date: "2025-01-17",
    departure: { icao: "UAAA", name: "Алматы", time: "09:15" },
    arrival: { icao: "UAAA", name: "Алматы", time: "09:15" },
    aircraft: { registration: "UP-A2002", type: "A320-271N", category: "SEL" },
    totalTime: "0:45",
    picTime: "0:45",
    sicTime: "-",
    nightTime: "-",
    ifrTime: "-",
    landings: { day: 3, night: 0 },
    role: "PIC",
    rules: "VFR",
    status: "COMPLETED",
    crossCountry: false,
    remarks: "Учебные касания (touch & go) ВПП 05L",
  },
  {
    id: "7",
    flightNumber: "KC501",
    date: "2025-01-16",
    departure: { icao: "UAAA", name: "Алматы", time: "23:45" },
    arrival: { icao: "OMDB", name: "Дубай", time: "03:15" },
    aircraft: { registration: "UP-B7602", type: "B767-300ER", category: "MEL" },
    totalTime: "4:30",
    picTime: "-",
    sicTime: "4:30",
    nightTime: "4:30",
    ifrTime: "4:30",
    landings: { day: 0, night: 1 },
    role: "SIC",
    rules: "IFR",
    status: "DELAYED",
    distance: 3400,
    crossCountry: true,
    remarks: "Задержка вылета 45 мин — погода UAAA",
  },
  {
    id: "8",
    flightNumber: "KC404",
    date: "2025-01-12",
    departure: { icao: "UAAA", name: "Алматы", time: "07:00" },
    arrival: { icao: "URKK", name: "Краснодар", time: "09:20" },
    aircraft: { registration: "UP-A2004", type: "A321-200", category: "SEL" },
    totalTime: "2:20",
    picTime: "2:20",
    sicTime: "-",
    nightTime: "-",
    ifrTime: "2:20",
    landings: { day: 1, night: 0 },
    role: "PIC",
    rules: "IFR",
    status: "CANCELLED",
    distance: 2100,
    crossCountry: true,
    remarks: "Отмена: закрытие воздушного пространства",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeToMinutes = (t: string) => {
  if (!t || t === "-") return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minutesToHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
};

const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; bg: string; dot: string }> = {
  COMPLETED:   { label: "Выполнен",    color: "#4ade80", bg: "rgba(74,222,128,0.08)",  dot: "#4ade80" },
  IN_PROGRESS: { label: "В воздухе",   color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  dot: "#60a5fa" },
  SCHEDULED:   { label: "Запланирован",color: "#a78bfa", bg: "rgba(167,139,250,0.08)", dot: "#a78bfa" },
  CANCELLED:   { label: "Отменён",     color: "#f87171", bg: "rgba(248,113,113,0.08)", dot: "#f87171" },
  DELAYED:     { label: "Задержан",    color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  dot: "#fbbf24" },
};

const ROLE_CONFIG: Record<FlightRole, { label: string; color: string }> = {
  PIC:        { label: "PIC",        color: "#34d399" },
  SIC:        { label: "SIC",        color: "#60a5fa" },
  DUAL:       { label: "DUAL",       color: "#f59e0b" },
  INSTRUCTOR: { label: "INSTR",      color: "#c084fc" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FlightStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
      border: `1px solid ${cfg.color}22`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot,
        boxShadow: status === "IN_PROGRESS" ? `0 0 6px ${cfg.dot}` : "none" }} />
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }: { role: FlightRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 4,
      background: `${cfg.color}15`, color: cfg.color,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      border: `1px solid ${cfg.color}30`,
    }}>{cfg.label}</span>
  );
}

function RulesBadge({ rules }: { rules: FlightRules }) {
  const colors: Record<FlightRules, string> = { VFR: "#34d399", IFR: "#f59e0b", SVFR: "#c084fc" };
  const c = colors[rules];
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 4,
      background: `${c}15`, color: c,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    }}>{rules}</span>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{
      background: "#0f1117", border: `1px solid ${accent}25`,
      borderRadius: 12, padding: "16px 20px",
      display: "flex", flexDirection: "column", gap: 4,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}88, transparent)`,
      }} />
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 11, color: "#475569" }}>{sub}</span>}
    </div>
  );
}

// ─── Add Flight Modal ─────────────────────────────────────────────────────────

function AddFlightModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    flightNumber: "", date: "", depIcao: "", depTime: "",
    arrIcao: "", arrTime: "", aircraft: "", acType: "",
    role: "PIC", rules: "IFR", remarks: "",
  });

  const field = (label: string, key: keyof typeof form, type = "text", options?: string[]) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {options ? (
        <select value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={inputStyle}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={inputStyle} placeholder={label} />
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#0c0e14", border: "1px solid #1e2538",
        borderRadius: 16, width: 560, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #1e2538",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Добавить полёт</div>
            <div style={{ fontSize: 12, color: "#475569" }}>ICAO / EASA формат</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #1e2538", color: "#64748b",
            width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Номер рейса", "flightNumber")}
            {field("Дата вылета", "date", "date")}
          </div>

          <div style={{
            background: "#0a0c11", borderRadius: 10, padding: 16,
            border: "1px solid #1e2538", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {field("Аэропорт вылета (ICAO)", "depIcao")}
              {field("Время вылета (UTC)", "depTime", "time")}
            </div>
            <div style={{ color: "#334155", fontSize: 20, textAlign: "center", paddingBottom: 8 }}>→</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {field("Аэропорт прилёта (ICAO)", "arrIcao")}
              {field("Время прилёта (UTC)", "arrTime", "time")}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Бортовой номер", "aircraft")}
            {field("Тип ВС", "acType")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {field("Функция", "role", "text", ["PIC", "SIC", "DUAL", "INSTRUCTOR"])}
            {field("Правила полёта", "rules", "text", ["IFR", "VFR", "SVFR"])}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Примечания
            </label>
            <textarea value={form.remarks}
              onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: "none" }}
              placeholder="Особые условия, замечания, ATC..." />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #1e2538",
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #1e2538",
            background: "none", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>Отмена</button>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
          }}>Сохранить полёт</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0f1117", border: "1px solid #1e2538", borderRadius: 8,
  padding: "8px 12px", color: "#e2e8f0", fontSize: 13, outline: "none",
  width: "100%", boxSizing: "border-box",
};

// ─── Flight Row ───────────────────────────────────────────────────────────────

function FlightRow({ flight, onClick }: { flight: Flight; onClick: () => void }) {
  return (
    <tr onClick={onClick} style={{ cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#0f1117")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

      <td style={tdStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{flight.flightNumber}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{flight.date}</div>
      </td>

      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.05em" }}>
              {flight.departure.icao}
            </div>
            <div style={{ fontSize: 10, color: "#475569" }}>{flight.departure.time}</div>
          </div>
          <div style={{ color: "#1e2538", fontSize: 18 }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#34d399", letterSpacing: "0.05em" }}>
              {flight.arrival.icao}
            </div>
            <div style={{ fontSize: 10, color: "#475569" }}>{flight.arrival.time}</div>
          </div>
        </div>
        {flight.distance && (
          <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>{flight.distance} NM</div>
        )}
      </td>

      <td style={tdStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{flight.aircraft.type}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{flight.aircraft.registration}</div>
      </td>

      <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{flight.totalTime}</div>
      </td>

      <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>
        <div style={{ fontSize: 13, color: "#34d399" }}>
          {flight.picTime !== "-" ? flight.picTime : "—"}
        </div>
        <div style={{ fontSize: 11, color: "#64748b" }}>
          {flight.sicTime !== "-" ? `SIC ${flight.sicTime}` : ""}
        </div>
      </td>

      <td style={tdStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {flight.nightTime !== "-" && (
            <span style={{ fontSize: 10, color: "#818cf8" }}>🌙 {flight.nightTime}</span>
          )}
          {flight.ifrTime !== "-" && (
            <span style={{ fontSize: 10, color: "#f59e0b" }}>IMC {flight.ifrTime}</span>
          )}
        </div>
      </td>

      <td style={tdStyle}>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          {flight.landings.day > 0 && `☀ ${flight.landings.day}`}
          {flight.landings.night > 0 && ` 🌙 ${flight.landings.night}`}
        </div>
      </td>

      <td style={tdStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RoleBadge role={flight.role} />
          <RulesBadge rules={flight.rules} />
        </div>
      </td>

      <td style={tdStyle}>
        <StatusBadge status={flight.status} />
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid #0f1117", verticalAlign: "middle",
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function FlightDrawer({ flight, onClose }: { flight: Flight; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", justifyContent: "flex-end",
    }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{
        width: 400, background: "#0c0e14", borderLeft: "1px solid #1e2538",
        overflowY: "auto", display: "flex", flexDirection: "column",
        animation: "slideIn 0.2s ease",
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #1e2538",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{flight.flightNumber}</span>
              <StatusBadge status={flight.status} />
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{flight.date}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #1e2538", color: "#64748b",
            width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 14,
          }}>×</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Route */}
          <div style={{ background: "#0a0c11", borderRadius: 12, padding: 16, border: "1px solid #1e2538" }}>
            <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              Маршрут
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#60a5fa" }}>{flight.departure.icao}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{flight.departure.name}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{flight.departure.time} UTC</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{flight.totalTime}</div>
                <div style={{ height: 2, width: 60, background: "linear-gradient(90deg, #60a5fa, #34d399)" }} />
                {flight.distance && <div style={{ fontSize: 10, color: "#475569" }}>{flight.distance} NM</div>}
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#34d399" }}>{flight.arrival.icao}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{flight.arrival.name}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{flight.arrival.time} UTC</div>
              </div>
            </div>
          </div>

          {/* Aircraft */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Воздушное судно
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Тип", flight.aircraft.type],
                ["Регистрация", flight.aircraft.registration],
                ["Категория", flight.aircraft.category],
                ["Правила", flight.rules],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "#0a0c11", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e2538" }}>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Times */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Налёт
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", border: "1px solid #1e2538" }}>
              {[
                { label: "Общий налёт (TOTAL)", value: flight.totalTime, color: "#f1f5f9" },
                { label: "PIC (Командир)", value: flight.picTime, color: "#34d399" },
                { label: "SIC (Второй пилот)", value: flight.sicTime, color: "#60a5fa" },
                { label: "Ночной налёт", value: flight.nightTime, color: "#818cf8" },
                { label: "По приборам (IMC)", value: flight.ifrTime, color: "#f59e0b" },
              ].map(row => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: "#0a0c11",
                }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.value === "-" ? "#334155" : row.color, fontVariantNumeric: "tabular-nums" }}>
                    {row.value === "-" ? "—" : row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Landings */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Посадки
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#0a0c11", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e2538", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#475569" }}>☀ Дневные</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fbbf24" }}>{flight.landings.day}</div>
              </div>
              <div style={{ background: "#0a0c11", borderRadius: 8, padding: "10px 14px", border: "1px solid #1e2538", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#475569" }}>🌙 Ночные</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#818cf8" }}>{flight.landings.night}</div>
              </div>
            </div>
          </div>

          {/* Function */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <RoleBadge role={flight.role} />
            <RulesBadge rules={flight.rules} />
            {flight.crossCountry && (
              <span style={{ fontSize: 10, color: "#64748b", background: "#0f1117", border: "1px solid #1e2538", borderRadius: 4, padding: "2px 7px" }}>
                Cross-Country
              </span>
            )}
          </div>

          {/* Remarks */}
          {flight.remarks && (
            <div>
              <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Примечания
              </div>
              <div style={{
                background: "#0a0c11", borderRadius: 8, padding: 14,
                border: "1px solid #1e2538", fontSize: 13, color: "#94a3b8", lineHeight: 1.6,
              }}>
                {flight.remarks}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlightsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FlightStatus>("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | FlightRole>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

  const filtered = MOCK_FLIGHTS.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.flightNumber.toLowerCase().includes(q) ||
      f.departure.icao.toLowerCase().includes(q) ||
      f.arrival.icao.toLowerCase().includes(q) ||
      f.aircraft.type.toLowerCase().includes(q) ||
      f.aircraft.registration.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
    const matchRole = roleFilter === "ALL" || f.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  // Totals
  const totalMin = filtered.reduce((a, f) => a + timeToMinutes(f.totalTime), 0);
  const picMin   = filtered.reduce((a, f) => a + timeToMinutes(f.picTime), 0);
  const nightMin = filtered.reduce((a, f) => a + timeToMinutes(f.nightTime), 0);
  const totalLandings = filtered.reduce((a, f) => a + f.landings.day + f.landings.night, 0);

  return (
    <div style={{
      minHeight: "100vh", background: "#080a0f", color: "#e2e8f0",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0c11; }
        ::-webkit-scrollbar-thumb { background: #1e2538; border-radius: 2px; }
        select option { background: #0c0e14; }
      `}</style>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>✈</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Полёты</h1>
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              Журнал полётов · ICAO / EASA Annex I · FCL.050
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "⬇", label: "Экспорт" },
              { icon: "⬆", label: "Импорт" },
              { icon: "🖨", label: "Печать" },
            ].map(btn => (
              <button key={btn.label} style={{
                padding: "9px 16px", borderRadius: 8, border: "1px solid #1e2538",
                background: "#0f1117", color: "#94a3b8", cursor: "pointer", fontSize: 12,
                fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit",
              }}>
                <span>{btn.icon}</span> {btn.label}
              </button>
            ))}
            <button onClick={() => setShowModal(true)} style={{
              padding: "9px 18px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              fontFamily: "inherit",
            }}>
              + Добавить полёт
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Общий налёт" value={minutesToHHMM(totalMin)} sub={`${(totalMin / 60).toFixed(1)} ч`} accent="#3b82f6" />
          <StatCard label="Налёт PIC" value={minutesToHHMM(picMin)} sub="Командир ВС" accent="#34d399" />
          <StatCard label="Ночной налёт" value={minutesToHHMM(nightMin)} sub="FCL.060(b)" accent="#818cf8" />
          <StatCard label="Посадки" value={String(totalLandings)} sub={`${filtered.length} полётов`} accent="#f59e0b" />
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }}>
              🔍
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по рейсу, аэропорту, ВС..."
              style={{ ...inputStyle, paddingLeft: 34 }}
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "ALL" | FlightStatus)}
            style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
            <option value="ALL">Все статусы</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as "ALL" | FlightRole)}
            style={{ ...inputStyle, width: "auto", cursor: "pointer" }}>
            <option value="ALL">Все функции</option>
            {Object.entries(ROLE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <span style={{ fontSize: 12, color: "#334155", whiteSpace: "nowrap" }}>
            Показано: {filtered.length} из {MOCK_FLIGHTS.length}
          </span>
        </div>

        {/* Table */}
        <div style={{
          background: "#0c0e14", border: "1px solid #1e2538", borderRadius: 14,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0a0c11" }}>
                {[
                  "Дата / Рейс", "Маршрут", "Воздушное судно",
                  "TOTAL", "PIC / SIC", "Ночь / IMC", "Посадки", "Функция", "Статус"
                ].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px", textAlign: "left", fontSize: 10,
                    color: "#475569", fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", borderBottom: "1px solid #1e2538",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 24px", color: "#334155" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✈</div>
                    <div style={{ fontSize: 14 }}>Полёты не найдены</div>
                  </td>
                </tr>
              ) : (
                filtered.map(f => (
                  <FlightRow key={f.id} flight={f} onClick={() => setSelectedFlight(f)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#1e2538" }}>
          ICAO Annex 1 · EASA FCL.050 · Все времена в UTC
        </div>
      </div>

      {showModal && <AddFlightModal onClose={() => setShowModal(false)} />}
      {selectedFlight && <FlightDrawer flight={selectedFlight} onClose={() => setSelectedFlight(null)} />}
    </div>
  );
}
