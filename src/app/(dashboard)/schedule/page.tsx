"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Printer, Clock, Plane,
  ChevronDown, ChevronUp, CheckCircle2,
  Save, Calendar, Filter, FileSpreadsheet, FolderPlus,
} from "lucide-react";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const BG = {
  base:    "#141824",
  card:    "#1e2330",
  input:   "#252b3b",
  hover:   "#2d3446",
  deep:    "#111520",
  modal:   "#1a1f2e",
  overlay: "rgba(20,24,36,0.85)",
} as const;

const BORDER = {
  default: "#2d3446",
  blue:    "rgba(74,124,247,0.22)",
  blueHi:  "rgba(74,124,247,0.45)",
  cyan:    "rgba(34,211,238,0.28)",
} as const;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface FlightRow {
  id: string;
  num: number;
  acType: string;
  acReg: string;
  commanderNum: string;
  commander: string;
  crew: string;
  exerciseNum: string;
  takeoffH: string; takeoffM: string;
  landingH: string; landingM: string;
  flightH: string;  flightM: string;
  kmzTotalH: string; kmzTotalM: string;
  kmzCloudsH: string; kmzCloudsM: string;
  landingsCount: string;
  touchdownCount: string;
  closedCabinH: string; closedCabinM: string;
  weather: string;
}

interface DaySection {
  id: string;
  unitName: string;
  rows: FlightRow[];
}

interface DayLog {
  id: string;
  date: string;
  sections: DaySection[];
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const UNIT_OPTIONS = ["ҚҚМЖ", "ТҚМЖ", "ЖҚМЖ", "АМЖ"];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const emptyRow = (num: number): FlightRow => ({
  id: uid(), num,
  acType: "E35L", acReg: "", commanderNum: "",
  commander: "", crew: "", exerciseNum: "",
  takeoffH: "", takeoffM: "", landingH: "", landingM: "",
  flightH: "", flightM: "",
  kmzTotalH: "-", kmzTotalM: "-",
  kmzCloudsH: "-", kmzCloudsM: "-",
  landingsCount: "1", touchdownCount: "1",
  closedCabinH: "-", closedCabinM: "-",
  weather: "-/-",
});

const emptySection = (unitName = "ҚҚМЖ"): DaySection => ({
  id: uid(), unitName, rows: [emptyRow(1)],
});

const emptyDay = (): DayLog => ({
  id: uid(),
  date: new Date().toISOString().slice(0, 10),
  sections: [emptySection("ҚҚМЖ"), emptySection("ТҚМЖ")],
});

function calcTotal(rows: FlightRow[]) {
  let t = 0;
  for (const r of rows) t += (parseInt(r.flightH) || 0) * 60 + (parseInt(r.flightM) || 0);
  return { h: Math.floor(t / 60), m: t % 60 };
}

function calcDayTotal(sections: DaySection[]) {
  let t = 0;
  for (const s of sections) { const x = calcTotal(s.rows); t += x.h * 60 + x.m; }
  return { h: Math.floor(t / 60), m: t % 60 };
}

function formatDateKaz(dateStr: string): string {
  if (!dateStr) return "";
  const [y, mo, d] = dateStr.split("-");
  const months = ["қаңтар","ақпан","наурыз","сәуір","мамыр","маусым",
                  "шілде","тамыз","қыркүйек","қазан","қараша","желтоқсан"];
  return `${y} жылғы «${d}» ${months[parseInt(mo) - 1]}`;
}

const fmt = (h: number, m: number) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

// ─────────────────────────────────────────────
// SECTION COLORS — updated to palette
// ─────────────────────────────────────────────
const SECTION_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  "ҚҚМЖ": { bg: "rgba(34,211,238,0.08)",   border: "rgba(34,211,238,0.28)",   color: "#22d3ee" },
  "ТҚМЖ": { bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.28)",   color: "#f59e0b" },
  "ЖҚМЖ": { bg: "rgba(34,197,94,0.08)",    border: "rgba(34,197,94,0.28)",    color: "#22c55e" },
  "АМЖ":  { bg: "rgba(168,85,247,0.08)",   border: "rgba(168,85,247,0.28)",   color: "#a855f7" },
};

function getSecColor(name: string) {
  return SECTION_COLORS[name] ?? {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.28)",
    color: "#3b82f6",
  };
}

// ─────────────────────────────────────────────
// EDITABLE CELL
// ─────────────────────────────────────────────
function C({ value, onChange, center, placeholder, mono, w }: {
  value: string; onChange: (v: string) => void;
  center?: boolean; placeholder?: string; mono?: boolean; w?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? ""}
      className="outline-none border-0 w-full"
      style={{
        fontSize: "11px",
        background: "transparent",
        color: "#e2e8f0",
        textAlign: center ? "center" : "left",
        fontFamily: mono ? "'JetBrains Mono','Fira Code',monospace" : "inherit",
        minWidth: w ?? "32px",
        padding: "1px 2px",
      }}
    />
  );
}

// ─────────────────────────────────────────────
// TH
// ─────────────────────────────────────────────
function Th({ children, rowSpan, colSpan, w, vertical }: {
  children?: React.ReactNode;
  rowSpan?: number; colSpan?: number; w?: string; vertical?: boolean;
}) {
  return (
    <th
      rowSpan={rowSpan} colSpan={colSpan}
      className="border px-1 py-1 text-center font-medium"
      style={{
        fontSize: "9px",
        color: "#94a3b8",
        borderColor: BORDER.blue,
        background: BG.deep,
        width: w,
        writingMode: vertical ? "vertical-rl" : "horizontal-tb",
        transform: vertical ? "rotate(180deg)" : undefined,
        verticalAlign: "middle",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </th>
  );
}

// ─────────────────────────────────────────────
// TABLE HEADER
// ─────────────────────────────────────────────
function TableHeader() {
  return (
    <thead>
      <tr>
        <Th rowSpan={4} w="24px">№</Th>
        <Th rowSpan={4}>Тип ВС</Th>
        <Th rowSpan={4}>Борт №</Th>
        <Th rowSpan={4}>Ком. №</Th>
        <Th colSpan={2} rowSpan={2}>Экипаж мүшелерінің тегі</Th>
        <Th rowSpan={4}>Курс №</Th>
        <Th colSpan={2}>Ұшу</Th>
        <Th colSpan={2}>Қону</Th>
        <Th colSpan={2}>Ұшу уақыты</Th>
        <Th colSpan={4}>КМЖда ұшу</Th>
        <Th colSpan={2}>Саны</Th>
        <Th colSpan={2}>Жабық кабинада</Th>
        <Th rowSpan={4}>Метеожағдайлар</Th>
        <Th rowSpan={4} w="22px"></Th>
      </tr>
      <tr>
        <Th>сағ.</Th><Th>мин.</Th>
        <Th>сағ.</Th><Th>мин.</Th>
        <Th>сағ.</Th><Th>мин.</Th>
        <Th colSpan={2}>Барлығы</Th>
        <Th colSpan={2}>Бұлтарда</Th>
        <Th rowSpan={3}>ену</Th>
        <Th rowSpan={3}>қону</Th>
        <Th>сағ.</Th><Th>мин.</Th>
      </tr>
      <tr>
        <Th rowSpan={2}>Командир</Th>
        <Th rowSpan={2}>Экипаж</Th>
        <Th>8</Th><Th>9</Th>
        <Th>10</Th><Th>11</Th>
        <Th>12</Th><Th>13</Th>
        <Th>14</Th><Th>15</Th>
        <Th>16</Th><Th>17</Th>
        <Th>20</Th><Th>21</Th>
      </tr>
      <tr>
        <Th>1</Th><Th>2</Th><Th>3</Th><Th>4</Th><Th>5</Th><Th>6</Th><Th>7</Th>
        <Th colSpan={2}></Th><Th colSpan={2}></Th>
        <Th colSpan={2}></Th><Th colSpan={2}></Th><Th colSpan={2}></Th>
        <Th colSpan={2}></Th><Th colSpan={2}></Th>
      </tr>
    </thead>
  );
}

// ─────────────────────────────────────────────
// FLIGHT ROW
// ─────────────────────────────────────────────
function FlightTableRow({ row, onUpdate, onDelete }: {
  row: FlightRow;
  onUpdate: (field: keyof FlightRow, value: string) => void;
  onDelete: () => void;
}) {
  const u = (f: keyof FlightRow) => (v: string) => onUpdate(f, v);
  const td = "border px-1 py-0.5";
  const bc: React.CSSProperties = { borderColor: BORDER.blue };

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: BORDER.blue }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = BG.hover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <td className={td} style={{ ...bc, width: "24px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>{row.num}</td>
      <td className={td} style={{ ...bc, minWidth: "40px"  }}><C value={row.acType}        onChange={u("acType")}       center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "46px"  }}><C value={row.acReg}         onChange={u("acReg")}        center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "34px"  }}><C value={row.commanderNum}  onChange={u("commanderNum")} center /></td>
      <td className={td} style={{ ...bc, minWidth: "80px"  }}><C value={row.commander}     onChange={u("commander")} /></td>
      <td className={td} style={{ ...bc, minWidth: "80px"  }}><C value={row.crew}          onChange={u("crew")} /></td>
      <td className={td} style={{ ...bc, minWidth: "34px"  }}><C value={row.exerciseNum}   onChange={u("exerciseNum")}  center /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.takeoffH}      onChange={u("takeoffH")}     center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.takeoffM}      onChange={u("takeoffM")}     center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.landingH}      onChange={u("landingH")}     center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.landingM}      onChange={u("landingM")}     center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.flightH}       onChange={u("flightH")}      center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "28px"  }}><C value={row.flightM}       onChange={u("flightM")}      center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.kmzTotalH}     onChange={u("kmzTotalH")}    center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.kmzTotalM}     onChange={u("kmzTotalM")}    center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.kmzCloudsH}    onChange={u("kmzCloudsH")}   center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.kmzCloudsM}    onChange={u("kmzCloudsM")}   center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.landingsCount}  onChange={u("landingsCount")}  center /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.touchdownCount} onChange={u("touchdownCount")} center /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.closedCabinH}   onChange={u("closedCabinH")}  center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "24px"  }}><C value={row.closedCabinM}   onChange={u("closedCabinM")}  center mono /></td>
      <td className={td} style={{ ...bc, minWidth: "52px"  }}><C value={row.weather}        onChange={u("weather")}       center /></td>
      <td className={td} style={{ ...bc, width: "22px", textAlign: "center" }}>
        <button
          onClick={onDelete}
          style={{ color: "#475569", transition: "color 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#475569"; }}
        >
          <Trash2 size={11} />
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// SECTION BLOCK
// ─────────────────────────────────────────────
function SectionBlock({ section, sectionIdx, onUpdateRow, onDeleteRow, onAddRow, onUpdateName, onDelete }: {
  section: DaySection;
  sectionIdx: number;
  onUpdateRow: (rowId: string, field: keyof FlightRow, value: string) => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: () => void;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
}) {
  const total = calcTotal(section.rows);
  const sc = getSecColor(section.unitName);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${sc.border}`, background: BG.card }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-3 py-2 flex-wrap"
        style={{ background: sc.bg, borderBottom: `1px solid ${sc.border}` }}
      >
        <select
          value={UNIT_OPTIONS.includes(section.unitName) ? section.unitName : UNIT_OPTIONS[0]}
          onChange={(e) => onUpdateName(e.target.value)}
          className="outline-none rounded px-2 py-0.5 text-sm font-bold"
          style={{
            background: BG.input,
            border: `1px solid ${sc.border}`,
            color: sc.color,
            fontFamily: "inherit",
          }}
        >
          {UNIT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>

        <span className="text-xs" style={{ color: "#94a3b8" }}>{section.rows.length} ұшу</span>
        <span
          className="font-mono text-sm font-bold"
          style={{ color: sc.color, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
        >
          {fmt(total.h, total.m)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.28)",
              color: "#3b82f6",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.22)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.12)"; }}
          >
            <Plus size={11} /> Жол қосу
          </button>

          {sectionIdx > 0 && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#475569", background: "rgba(239,68,68,0.08)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#475569"; }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: "1080px", background: BG.card }}>
          <TableHeader />
          <tbody>
            {section.rows.map((row) => (
              <FlightTableRow
                key={row.id}
                row={row}
                onUpdate={(field, value) => onUpdateRow(row.id, field, value)}
                onDelete={() => onDeleteRow(row.id)}
              />
            ))}
            {/* Section total row */}
            <tr style={{ background: BG.input }}>
              <td
                colSpan={11}
                className="border px-3 py-1.5 text-xs"
                style={{ borderColor: BORDER.blue, color: "#94a3b8" }}
              >
                Барлығы{" "}
                <span style={{ color: sc.color, fontWeight: 700 }}>{section.unitName}</span>:{" "}
                {section.rows[0]?.acType || "E35L"} №{section.rows[0]?.acReg || "—"} ұшулар саны{" "}
                <span style={{ color: "#e2e8f0" }}>{section.rows.length}</span>, ұшу уақыты{" "}
                <span
                  className="font-bold"
                  style={{ color: sc.color, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
                >
                  {String(total.h).padStart(2, "0")} сағат {String(total.m).padStart(2, "0")} минут
                </span>
              </td>
              <td colSpan={12} className="border" style={{ borderColor: BORDER.blue }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DAY CARD
// ─────────────────────────────────────────────
function DayCard({ log, onUpdate, onDelete }: {
  log: DayLog;
  onUpdate: (updated: DayLog) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const dayTotal = calcDayTotal(log.sections);

  const updSec = (secId: string, updated: DaySection) =>
    onUpdate({ ...log, sections: log.sections.map((s) => s.id === secId ? updated : s) });

  const delSec = (secId: string) =>
    onUpdate({ ...log, sections: log.sections.filter((s) => s.id !== secId) });

  const addSec = () => {
    const existing = log.sections.map((s) => s.unitName);
    const next = UNIT_OPTIONS.find((o) => !existing.includes(o)) ?? "ҚҚМЖ";
    onUpdate({ ...log, sections: [...log.sections, emptySection(next)] });
  };

  const updateRow = (secId: string, rowId: string, field: keyof FlightRow, value: string) => {
    const sec = log.sections.find((s) => s.id === secId)!;
    updSec(secId, { ...sec, rows: sec.rows.map((r) => r.id === rowId ? { ...r, [field]: value } : r) });
  };

  const deleteRow = (secId: string, rowId: string) => {
    const sec = log.sections.find((s) => s.id === secId)!;
    const rows = sec.rows.filter((r) => r.id !== rowId).map((r, i) => ({ ...r, num: i + 1 }));
    updSec(secId, { ...sec, rows });
  };

  const addRow = (secId: string) => {
    const sec = log.sections.find((s) => s.id === secId)!;
    updSec(secId, { ...sec, rows: [...sec.rows, emptyRow(sec.rows.length + 1)] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="rounded-xl overflow-hidden"
      style={{ background: BG.card, border: `1px solid ${BORDER.default}` }}
    >
      {/* Top accent line */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #3b82f6, #22d3ee, transparent)" }} />

      {/* Day header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-wrap"
        style={{ borderBottom: collapsed ? "none" : `1px solid ${BORDER.default}`, background: BG.deep }}
      >
        <Calendar size={13} style={{ color: "#22d3ee" }} />
        <input
          type="date"
          value={log.date}
          onChange={(e) => onUpdate({ ...log, date: e.target.value })}
          className="outline-none text-sm font-semibold"
          style={{ color: "#e2e8f0", background: "transparent", border: "none", fontFamily: "inherit" }}
        />

        <div className="h-4 w-px" style={{ background: BORDER.default }} />

        <span className="text-xs" style={{ color: "#64748b" }}>
          {formatDateKaz(log.date)} ұшулар хронометражы
        </span>

        {/* Section badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {log.sections.map((s) => {
            const sc = getSecColor(s.unitName);
            return (
              <span
                key={s.id}
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}
              >
                {s.unitName} · {s.rows.length} ұш.
              </span>
            );
          })}
        </div>

        {/* Day total */}
        <div
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)" }}
        >
          <Clock size={11} style={{ color: "#22c55e" }} />
          <span
            className="text-sm font-bold"
            style={{ color: "#22c55e", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
          >
            {fmt(dayTotal.h, dayTotal.m)}
          </span>
          <span className="text-xs" style={{ color: "#64748b" }}>жалпы</span>
        </div>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1.5 rounded-lg"
          style={{ color: "#64748b", background: BG.input }}
        >
          {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#64748b", background: "rgba(239,68,68,0.08)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748b"; }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 p-3"
            style={{ background: BG.base }}
          >
            {log.sections.map((sec, i) => (
              <SectionBlock
                key={sec.id}
                section={sec}
                sectionIdx={i}
                onUpdateRow={(rowId, field, val) => updateRow(sec.id, rowId, field, val)}
                onDeleteRow={(rowId) => deleteRow(sec.id, rowId)}
                onAddRow={() => addRow(sec.id)}
                onUpdateName={(name) => updSec(sec.id, { ...sec, unitName: name })}
                onDelete={() => delSec(sec.id)}
              />
            ))}

            {/* Add section */}
            <button
              onClick={addSec}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-full justify-center transition-colors"
              style={{
                background: BG.card,
                border: `1px dashed ${BORDER.default}`,
                color: "#64748b",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.50)";
                (e.currentTarget as HTMLElement).style.color = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = BORDER.default;
                (e.currentTarget as HTMLElement).style.color = "#64748b";
              }}
            >
              <FolderPlus size={13} /> Бөлім қосу (ҚҚМЖ / ТҚМЖ / ЖҚМЖ / АМЖ)
            </button>

            {/* Signatures */}
            <div
              className="flex items-start justify-end gap-8 px-2 pt-1 text-xs"
              style={{ color: "#64748b" }}
            >
              <div>
                <div>Хронометражист капитан</div>
                <div className="mt-1" style={{ color: "#475569" }}>___________________</div>
              </div>
              <div>
                <div>ҰДБ бастығының орынбасары полковник</div>
                <div className="mt-1" style={{ color: "#475569" }}>___________________</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// STORAGE KEY
// ─────────────────────────────────────────────
const STORAGE_KEY = "aviapilot_chrono_v2";

function loadLogs(): DayLog[] {
  if (typeof window === "undefined") return [emptyDay()];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DayLog[];
  } catch { /* ignore */ }
  return [emptyDay()];
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function ChronometryPage() {
  const [logs, setLogs]           = useState<DayLog[]>(loadLogs);
  const [saved, setSaved]         = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo]   = useState("");

  // Load from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
        const token = document.cookie.match(/access_token=([^;]+)/)?.[1] ?? "";
        const res = await fetch(`${API}/chronometry`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json() as DayLog[];
          if (Array.isArray(data) && data.length > 0) {
            setLogs(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch { /* use localStorage */ }
    };
    load();
  }, []);

  const markDirty = () => setHasUnsaved(true);

  const updateLog = useCallback((updated: DayLog) => {
    setLogs((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    markDirty();
  }, []);

  const deleteLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    markDirty();
  }, []);

  const addDay = () => { setLogs((prev) => [...prev, emptyDay()]); markDirty(); };

  const handleSave = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    setIsSyncing(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
      const token = document.cookie.match(/access_token=([^;]+)/)?.[1] ?? "";
      await fetch(`${API}/chronometry/save-all`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(logs),
      });
    } catch { /* saved locally */ }
    finally { setIsSyncing(false); }
    setSaved(true); setHasUnsaved(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const filtered = logs.filter((l) => {
      if (filterFrom && l.date < filterFrom) return false;
      if (filterTo   && l.date > filterTo)   return false;
      return true;
    });
    if (!filtered.length) { alert("Таңдалған кезеңде деректер жоқ."); return; }

    const cols = ["№","Тип ВС","Борт №","Ном.ком.","Командир","Экипаж","Упр.№","Ұшу сағ","Ұшу мин","Қону сағ","Қону мин","Уақыт сағ","Уақыт мин","КМЖ бар.сағ","КМЖ бар.мин","КМЖ бұл.сағ","КМЖ бұл.мин","Ену","Қону","Жаб.сағ","Жаб.мин","Метео"];
    const empty = () => Object.fromEntries(cols.map((c) => [c, ""])) as Record<string, string>;

    const allData: Record<string, string>[] = [];

    for (const log of filtered) {
      const h1 = empty(); h1["№"] = ""; h1["Тип ВС"] = `${formatDateKaz(log.date)} ұшулар хронометражы`;
      allData.push(h1);

      for (const sec of log.sections) {
        const sh = empty(); sh["№"] = sec.unitName;
        allData.push(sh);

        for (const r of sec.rows) {
          allData.push({ "№": String(r.num), "Тип ВС": r.acType, "Борт №": r.acReg, "Ном.ком.": r.commanderNum, "Командир": r.commander, "Экипаж": r.crew, "Упр.№": r.exerciseNum, "Ұшу сағ": r.takeoffH, "Ұшу мин": r.takeoffM, "Қону сағ": r.landingH, "Қону мин": r.landingM, "Уақыт сағ": r.flightH, "Уақыт мин": r.flightM, "КМЖ бар.сағ": r.kmzTotalH, "КМЖ бар.мин": r.kmzTotalM, "КМЖ бұл.сағ": r.kmzCloudsH, "КМЖ бұл.мин": r.kmzCloudsM, "Ену": r.landingsCount, "Қону": r.touchdownCount, "Жаб.сағ": r.closedCabinH, "Жаб.мин": r.closedCabinM, "Метео": r.weather });
        }

        const t = calcTotal(sec.rows);
        const tot = empty();
        tot["№"] = `ИТОГО ${sec.unitName}`; tot["Тип ВС"] = `${sec.rows.length} ұшу`;
        tot["Уақыт сағ"] = String(t.h); tot["Уақыт мин"] = String(t.m);
        allData.push(tot);
        allData.push(empty());
      }

      const dt = calcDayTotal(log.sections);
      const dtRow = empty();
      dtRow["№"] = "КҮН ЖИЫНЫ";
      dtRow["Тип ВС"] = `${log.sections.reduce((a, s) => a + s.rows.length, 0)} ұшу — ${fmt(dt.h, dt.m)}`;
      dtRow["Уақыт сағ"] = String(dt.h); dtRow["Уақыт мин"] = String(dt.m);
      allData.push(dtRow);
      allData.push(empty()); allData.push(empty());
    }

    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    ws["!cols"] = [{ wch: 14 },{ wch: 34 },{ wch: 8 },{ wch: 8 },{ wch: 14 },{ wch: 14 },{ wch: 8 },
                   { wch: 6 },{ wch: 6 },{ wch: 6 },{ wch: 6 },{ wch: 8 },{ wch: 8 },
                   { wch: 8 },{ wch: 8 },{ wch: 8 },{ wch: 8 },{ wch: 6 },{ wch: 6 },
                   { wch: 6 },{ wch: 6 },{ wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, "Хронометраж");
    const from = filterFrom || filtered[0]?.date;
    const to   = filterTo   || filtered[filtered.length - 1]?.date;
    XLSX.writeFile(wb, `Хронометраж_${from}_${to}.xlsx`);
  };

  const visibleLogs   = logs.filter((l) => {
    if (filterFrom && l.date < filterFrom) return false;
    if (filterTo   && l.date > filterTo)   return false;
    return true;
  });
  const allSections   = visibleLogs.flatMap((l) => l.sections);
  const totalFlights  = allSections.reduce((a, s) => a + s.rows.length, 0);
  const grand = (() => {
    let t = 0;
    for (const s of allSections) { const x = calcTotal(s.rows); t += x.h * 60 + x.m; }
    return { h: Math.floor(t / 60), m: t % 60 };
  })();

  // ─── shared input style for filter bar ──────────────────────────────────────
  const filterInput: React.CSSProperties = {
    background: BG.input,
    border: `1px solid ${BORDER.default}`,
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: "12px",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      className="p-6 space-y-4"
      style={{ background: BG.base, minHeight: "100vh", color: "#e2e8f0" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #22d3ee)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#f1f5f9" }}>Хронометраж</h1>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Ұшулар хронометражы ·{" "}
              {UNIT_OPTIONS.map((u, i) => (
                <span key={u} style={{ color: getSecColor(u).color }}>
                  {u}{i < UNIT_OPTIONS.length - 1 ? " / " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: "rgba(34,197,94,0.10)",
                  border: "1px solid rgba(34,197,94,0.28)",
                  color: "#22c55e",
                }}
              >
                <CheckCircle2 size={12} /> Сақталды
              </motion.div>
            )}
          </AnimatePresence>

          {([
            { icon: Save,          label: isSyncing ? "Сақталуда..." : hasUnsaved ? "Сақтау •" : "Сақтау", fn: handleSave,             accent: hasUnsaved },
            { icon: FileSpreadsheet, label: "Excel",                                                          fn: exportExcel,            accent: false },
            { icon: Printer,       label: "Басып шығару",                                                    fn: () => window.print(),   accent: false },
          ] as { icon: React.ElementType; label: string; fn: () => void; accent: boolean }[]).map(({ icon: Icon, label, fn, accent }) => (
            <button
              key={label}
              onClick={fn}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: accent ? "rgba(245,158,11,0.12)" : BG.card,
                border: accent ? "1px solid rgba(245,158,11,0.40)" : `1px solid ${BORDER.default}`,
                color: accent ? "#f59e0b" : "#94a3b8",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = accent ? "#f59e0b" : "#94a3b8"; }}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl flex-wrap"
        style={{ background: BG.card, border: `1px solid ${BORDER.default}` }}
      >
        <Filter size={13} style={{ color: "#64748b" }} />
        <span className="text-xs" style={{ color: "#64748b" }}>Күн бойынша:</span>

        {[
          { label: "Бастап", value: filterFrom, set: setFilterFrom },
          { label: "Дейін",  value: filterTo,   set: setFilterTo   },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "#475569" }}>{label}:</span>
            <input
              type="date"
              value={value}
              onChange={(e) => set(e.target.value)}
              style={filterInput}
            />
          </div>
        ))}

        {(filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterFrom(""); setFilterTo(""); }}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: "#22d3ee", border: "1px solid rgba(34,211,238,0.28)", background: "transparent", fontFamily: "inherit" }}
          >
            Тазарту ×
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs" style={{ color: "#64748b" }}>
            {visibleLogs.length} күн · {totalFlights} ұшу
          </span>
          <div className="flex items-center gap-1.5">
            <Clock size={11} style={{ color: "#22d3ee" }} />
            <span
              className="text-xs font-bold"
              style={{ color: "#22d3ee", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            >
              {fmt(grand.h, grand.m)}
            </span>
            <span className="text-xs" style={{ color: "#475569" }}>жалпы</span>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Барлық күндер",   value: visibleLogs.length,   color: "#3b82f6", bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.20)", Icon: Calendar },
          { label: "Барлық ұшулар",   value: totalFlights,          color: "#22d3ee", bg: "rgba(34,211,238,0.06)",  border: "rgba(34,211,238,0.20)", Icon: Plane    },
          { label: "Жалпы уақыт",     value: fmt(grand.h, grand.m), color: "#22c55e", bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.20)",  Icon: Clock    },
          { label: "Барлық бөлімдер", value: allSections.length,    color: "#f59e0b", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.20)", Icon: Plane    },
        ].map(({ label, value, color, bg, border, Icon }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
            </div>
            <div
              className="text-xl font-bold"
              style={{ color, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Day logs ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <AnimatePresence>
          {visibleLogs.map((log) => (
            <DayCard
              key={log.id}
              log={log}
              onUpdate={updateLog}
              onDelete={() => deleteLog(log.id)}
            />
          ))}
        </AnimatePresence>

        {visibleLogs.length === 0 && (
          <div className="text-center py-12" style={{ color: "#64748b" }}>
            <Clock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Таңдалған кезеңде деректер жоқ</p>
          </div>
        )}
      </div>

      {/* ── Add day ────────────────────────────────────────────────────────── */}
      <button
        onClick={addDay}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
        style={{
          background: BG.card,
          border: `1px dashed ${BORDER.default}`,
          color: "#3b82f6",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG.hover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = BG.card; }}
      >
        <Plus size={15} /> Жаңа күн қосу — Добавить новый день
      </button>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          @page { size: A3 landscape; margin: 8mm; }
          button, select { display: none !important; }
          table { font-size: 7px !important; }
          th, td { padding: 1px 2px !important; }
        }
      `}</style>
    </div>
  );
}
