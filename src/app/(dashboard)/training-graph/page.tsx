"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Wrench, Plus, Trash2, Download, Upload,
  Printer, Save, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const BG = {
  base:  "#141824",
  card:  "#1e2330",
  input: "#252b3b",
  hover: "#2d3446",
  deep:  "#111520",
} as const;

const BORDER = {
  default: "#2d3446",
  blue:    "rgba(74,124,247,0.22)",
  blueHi:  "rgba(74,124,247,0.45)",
} as const;

const TEXT = {
  primary:   "#e2e8f0",
  secondary: "#94a3b8",
  muted:     "#64748b",
  dim:       "#475569",
} as const;

const STATUS = {
  green:  "#22c55e",
  amber:  "#f59e0b",
  red:    "#ef4444",
  blue:   "#3b82f6",
  cyan:   "#22d3ee",
} as const;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type TabType = "pilots" | "engineers";

interface CheckDate {
  day: string;
  night: string;
}

interface PilotRow {
  id: string; num: number;
  position: string; rank: string; fullName: string;
  birthDate: string; education: string;
  aircraftType: string; aircraftClass: string;
  totalHours: string; lastYearHours: string; currentYearHours: string;
  minDay: string; minNight: string;
  readyPmuDay: string; readyPmuNight: string;
  readySmuDay: string; readySmuNight: string;
  readyUapDay: string; readyUapNight: string;
  checkTechnique: CheckDate; checkNavigation: CheckDate; checkCombat: CheckDate;
  checkMedical: string; checkDuplicate: string; checkSelfFlight: string;
  checkMvlpvvb: string; checkZlpvvb: string; checkKvs: string;
  selfDay: CheckDate; selfNight: CheckDate;
  vkk: string; vkkReturn: string;
  updatedAt: string; notes: string;
}

interface EngineerRow {
  id: string; num: number;
  position: string; rank: string; fullName: string;
  birthDate: string; education: string;
  aircraftType: string; aircraftClass: string;
  totalHours: string; lastYearHours: string; currentYearHours: string;
  checkNoDispatching: CheckDate; checkBoarding: CheckDate;
  checkCrewPrep: CheckDate; checkMiddleAid: CheckDate;
  checkCombat: CheckDate; checkWithSingle: CheckDate;
  checkControlFlight: CheckDate; checkInstructors: CheckDate;
  vkk: string; vkkReturn: string;
  updatedAt: string; notes: string;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

function toRecord<T>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj as object));
}

function getCheckDate(obj: unknown, field: string): CheckDate {
  const rec = Object.fromEntries(Object.entries(obj as object));
  const val = rec[field];
  if (val && typeof val === "object" && "day" in val) return val as CheckDate;
  return { day: "", night: "" };
}

const emptyPilot = (num: number): PilotRow => ({
  id: uid(), num,
  position: "", rank: "", fullName: "", birthDate: "",
  education: "", aircraftType: "", aircraftClass: "",
  totalHours: "", lastYearHours: "", currentYearHours: "",
  minDay: "", minNight: "",
  readyPmuDay: "+", readyPmuNight: "+",
  readySmuDay: "+", readySmuNight: "+",
  readyUapDay: "+", readyUapNight: "+",
  checkTechnique: { day: "", night: "" },
  checkNavigation: { day: "", night: "" },
  checkCombat: { day: "", night: "" },
  checkMedical: "", checkDuplicate: "", checkSelfFlight: "",
  checkMvlpvvb: "", checkZlpvvb: "", checkKvs: "",
  selfDay: { day: "", night: "" },
  selfNight: { day: "", night: "" },
  vkk: "", vkkReturn: "",
  updatedAt: new Date().toLocaleDateString("ru-RU"),
  notes: "",
});

const emptyEngineer = (num: number): EngineerRow => ({
  id: uid(), num,
  position: "", rank: "", fullName: "", birthDate: "",
  education: "", aircraftType: "", aircraftClass: "",
  totalHours: "", lastYearHours: "", currentYearHours: "",
  checkNoDispatching: { day: "", night: "" },
  checkBoarding: { day: "", night: "" },
  checkCrewPrep: { day: "", night: "" },
  checkMiddleAid: { day: "", night: "" },
  checkCombat: { day: "", night: "" },
  checkWithSingle: { day: "", night: "" },
  checkControlFlight: { day: "", night: "" },
  checkInstructors: { day: "", night: "" },
  vkk: "", vkkReturn: "",
  updatedAt: new Date().toLocaleDateString("ru-RU"),
  notes: "",
});

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const INITIAL_PILOTS: PilotRow[] = [
  {
    ...emptyPilot(1), id: "p1",
    position: "Начальник АО", rank: "п/п-к",
    fullName: "Нурланович Дулан Канатбекович",
    birthDate: "16.09.1984", education: "ВА СВО-06",
    aircraftType: "Су-93", aircraftClass: "2",
    totalHours: "2521", lastYearHours: "331", currentYearHours: "11",
    minDay: "60ч0.5", minNight: "100ч1.0",
    readyPmuDay: "+", readyPmuNight: "+",
    readySmuDay: "+", readySmuNight: "+",
    readyUapDay: "+", readyUapNight: "+",
    checkTechnique:  { day: "11.08.25", night: "11.08.25" },
    checkNavigation: { day: "11.06.25", night: "" },
    checkCombat:     { day: "17.07.25", night: "17.07.25" },
    checkMedical: "17.07.25", checkDuplicate: "15.11.26", checkSelfFlight: "",
    checkMvlpvvb: "02.07.25", checkZlpvvb: "27.06.25", checkKvs: "30.04.25",
    selfDay:   { day: "09.04.25", night: "09.04.25" },
    selfNight: { day: "09.04.25", night: "09.04.25" },
    vkk: "", vkkReturn: "05.11.26",
    updatedAt: "02.04.2026", notes: "",
  },
  {
    ...emptyPilot(2), id: "p2",
    position: "Зам. НО", rank: "п/п-к",
    fullName: "Вафин Рамиль Дамирович",
    birthDate: "12.07.1987", education: "ВВАУЗ 2009",
    aircraftType: "B300", aircraftClass: "1",
    totalHours: "4138.22", lastYearHours: "1601.25", currentYearHours: "25.00",
    minDay: "60ч0.5", minNight: "60ч0.5",
    readyPmuDay: "+", readyPmuNight: "+",
    readySmuDay: "+", readySmuNight: "+",
    readyUapDay: "+", readyUapNight: "+",
    checkTechnique:  { day: "15.16.25", night: "15.16.25" },
    checkNavigation: { day: "36.16.25", night: "36.16.25" },
    checkCombat:     { day: "16.16.25", night: "16.16.25" },
    checkMedical: "", checkDuplicate: "17.36.25", checkSelfFlight: "17.36.25",
    checkMvlpvvb: "27.06.25", checkZlpvvb: "27.06.25", checkKvs: "26.06.25",
    selfDay:   { day: "19.04.25", night: "19.04.25" },
    selfNight: { day: "19.04.25", night: "19.04.25" },
    vkk: "", vkkReturn: "12.07.25",
    updatedAt: "23.02.2026", notes: "",
  },
];

const INITIAL_ENGINEERS: EngineerRow[] = [
  {
    ...emptyEngineer(1), id: "e1",
    position: "Бортовой техник", rank: "капитан",
    fullName: "Каменн А.М.",
    birthDate: "19.12.1991", education: "Актюбинский ВИСНО 2013",
    aircraftType: "Як-42 / Ан-74", aircraftClass: "2",
    totalHours: "1954", lastYearHours: "598 / 1356", currentYearHours: "17 / 0",
    checkNoDispatching:  { day: "25.10.25", night: "25.10.25" },
    checkBoarding:       { day: "25.10.25", night: "25.10.25" },
    checkCrewPrep:       { day: "22.12.25", night: "22.12.25" },
    checkMiddleAid:      { day: "14.03.2023", night: "09.10.2023" },
    checkCombat:         { day: "", night: "" },
    checkWithSingle:     { day: "", night: "" },
    checkControlFlight:  { day: "", night: "" },
    checkInstructors:    { day: "", night: "" },
    vkk: "20.02.25", vkkReturn: "12.07.25",
    updatedAt: "05.02.26", notes: "",
  },
  {
    ...emptyEngineer(2), id: "e2",
    position: "Старший бортовой техник", rank: "майор",
    fullName: "Спиков Г.А.",
    birthDate: "25.10.1987", education: "Актюбинский ВИСНО 2009",
    aircraftType: "Як-42", aircraftClass: "1",
    totalHours: "2352.22", lastYearHours: "1300.41", currentYearHours: "34",
    checkNoDispatching:  { day: "10.06.25", night: "10.06.25" },
    checkBoarding:       { day: "11.01.26", night: "11.01.26" },
    checkCrewPrep:       { day: "", night: "" },
    checkMiddleAid:      { day: "06.02.25", night: "" },
    checkCombat:         { day: "", night: "" },
    checkWithSingle:     { day: "", night: "" },
    checkControlFlight:  { day: "", night: "" },
    checkInstructors:    { day: "", night: "" },
    vkk: "07.04.26", vkkReturn: "26.05.26",
    updatedAt: "05.04.26", notes: "",
  },
];

// ─────────────────────────────────────────────
// EDITABLE CELL
// ─────────────────────────────────────────────
function Cell({ value, onChange, small, highlight }: {
  value: string;
  onChange: (v: string) => void;
  small?: boolean;
  highlight?: "green" | "red" | "yellow";
}) {
  const bg =
    highlight === "green"  ? "rgba(34,197,94,0.14)"  :
    highlight === "red"    ? "rgba(239,68,68,0.14)"   :
    highlight === "yellow" ? "rgba(245,158,11,0.12)"  :
    "transparent";

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full outline-none border-0 text-center"
      style={{
        fontSize: small ? "10px" : "11px",
        color: TEXT.primary,
        background: bg,
        padding: "2px 2px",
        minWidth: "48px",
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}
    />
  );
}

// ─────────────────────────────────────────────
// TH HELPER
// ─────────────────────────────────────────────
function Th({ children, rowSpan, colSpan, w }: {
  children?: React.ReactNode;
  rowSpan?: number; colSpan?: number; w?: string;
}) {
  return (
    <th
      rowSpan={rowSpan} colSpan={colSpan}
      className="text-center px-1 py-1 font-medium border"
      style={{
        fontSize: "9px",
        color: TEXT.secondary,
        borderColor: BORDER.blue,
        background: BG.deep,
        width: w,
        verticalAlign: "middle",
        letterSpacing: "0.03em",
      }}
    >
      {children}
    </th>
  );
}

// ─────────────────────────────────────────────
// DATE HIGHLIGHT HELPER
// ─────────────────────────────────────────────
function highlightDate(dateStr: string): "green" | "red" | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split(".");
  if (parts.length !== 3) return undefined;
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  return d < new Date() ? "red" : "green";
}

// ─────────────────────────────────────────────
// PILOT TABLE ROW
// ─────────────────────────────────────────────
function PilotTableRow({ row, onUpdate, onDelete }: {
  row: PilotRow;
  onUpdate: (id: string, field: string, value: string | CheckDate) => void;
  onDelete: (id: string) => void;
}) {
  const upd = (field: string) => (v: string) => onUpdate(row.id, field, v);
  const updSub = (field: string, sub: "day" | "night") => (v: string) => {
    const cur = getCheckDate(row, field);
    onUpdate(row.id, field, { ...cur, [sub]: v });
  };

  const readyHL = (val: string): "green" | "red" | undefined =>
    val === "+" ? "green" : val === "-" ? "red" : undefined;

  const td = "px-1 py-0.5 border";
  const bc: React.CSSProperties = { borderColor: BORDER.blue };

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: BORDER.blue }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG.hover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <td className={td} style={{ ...bc, color: TEXT.muted, width: "28px", textAlign: "center", fontSize: "11px" }}>{row.num}</td>
      <td className={td} style={{ ...bc, minWidth: "90px"  }}><Cell value={row.position}          onChange={upd("position")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.rank}              onChange={upd("rank")} /></td>
      <td className={td} style={{ ...bc, minWidth: "130px" }}><Cell value={row.fullName}           onChange={upd("fullName")} /></td>
      <td className={td} style={{ ...bc, minWidth: "70px"  }}><Cell value={row.birthDate}          onChange={upd("birthDate")} /></td>
      <td className={td} style={{ ...bc, minWidth: "100px" }}><Cell value={row.education}          onChange={upd("education")} small /></td>
      <td className={td} style={{ ...bc, minWidth: "56px"  }}><Cell value={row.aircraftType}       onChange={upd("aircraftType")} /></td>
      <td className={td} style={{ ...bc, minWidth: "32px"  }}><Cell value={row.aircraftClass}      onChange={upd("aircraftClass")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.totalHours}         onChange={upd("totalHours")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.lastYearHours}      onChange={upd("lastYearHours")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.currentYearHours}   onChange={upd("currentYearHours")} /></td>
      <td className={td} style={{ ...bc, minWidth: "56px"  }}><Cell value={row.minDay}             onChange={upd("minDay")} small /></td>
      <td className={td} style={{ ...bc, minWidth: "56px"  }}><Cell value={row.minNight}           onChange={upd("minNight")} small /></td>
      <td className={td} style={bc}><Cell value={row.readyPmuDay}   onChange={upd("readyPmuDay")}   highlight={readyHL(row.readyPmuDay)} /></td>
      <td className={td} style={bc}><Cell value={row.readyPmuNight} onChange={upd("readyPmuNight")} highlight={readyHL(row.readyPmuNight)} /></td>
      <td className={td} style={bc}><Cell value={row.readySmuDay}   onChange={upd("readySmuDay")}   highlight={readyHL(row.readySmuDay)} /></td>
      <td className={td} style={bc}><Cell value={row.readySmuNight} onChange={upd("readySmuNight")} highlight={readyHL(row.readySmuNight)} /></td>
      <td className={td} style={bc}><Cell value={row.readyUapDay}   onChange={upd("readyUapDay")}   highlight={readyHL(row.readyUapDay)} /></td>
      <td className={td} style={bc}><Cell value={row.readyUapNight} onChange={upd("readyUapNight")} highlight={readyHL(row.readyUapNight)} /></td>
      <td className={td} style={bc}><Cell value={row.checkTechnique.day}   onChange={updSub("checkTechnique","day")}   small highlight={highlightDate(row.checkTechnique.day)} /></td>
      <td className={td} style={bc}><Cell value={row.checkTechnique.night} onChange={updSub("checkTechnique","night")} small highlight={highlightDate(row.checkTechnique.night)} /></td>
      <td className={td} style={bc}><Cell value={row.checkNavigation.day}  onChange={updSub("checkNavigation","day")}  small highlight={highlightDate(row.checkNavigation.day)} /></td>
      <td className={td} style={bc}><Cell value={row.checkNavigation.night}onChange={updSub("checkNavigation","night")}small highlight={highlightDate(row.checkNavigation.night)} /></td>
      <td className={td} style={bc}><Cell value={row.checkCombat.day}      onChange={updSub("checkCombat","day")}      small highlight={highlightDate(row.checkCombat.day)} /></td>
      <td className={td} style={bc}><Cell value={row.checkCombat.night}    onChange={updSub("checkCombat","night")}    small highlight={highlightDate(row.checkCombat.night)} /></td>
      <td className={td} style={bc}><Cell value={row.checkMedical}    onChange={upd("checkMedical")}    small highlight={highlightDate(row.checkMedical)} /></td>
      <td className={td} style={bc}><Cell value={row.checkDuplicate}  onChange={upd("checkDuplicate")}  small highlight={highlightDate(row.checkDuplicate)} /></td>
      <td className={td} style={bc}><Cell value={row.checkSelfFlight} onChange={upd("checkSelfFlight")} small highlight={highlightDate(row.checkSelfFlight)} /></td>
      <td className={td} style={bc}><Cell value={row.checkMvlpvvb}    onChange={upd("checkMvlpvvb")}    small highlight={highlightDate(row.checkMvlpvvb)} /></td>
      <td className={td} style={bc}><Cell value={row.checkZlpvvb}     onChange={upd("checkZlpvvb")}     small highlight={highlightDate(row.checkZlpvvb)} /></td>
      <td className={td} style={bc}><Cell value={row.checkKvs}        onChange={upd("checkKvs")}        small highlight={highlightDate(row.checkKvs)} /></td>
      <td className={td} style={bc}><Cell value={row.selfDay.day}    onChange={updSub("selfDay","day")}    small highlight={highlightDate(row.selfDay.day)} /></td>
      <td className={td} style={bc}><Cell value={row.selfDay.night}  onChange={updSub("selfDay","night")}  small highlight={highlightDate(row.selfDay.night)} /></td>
      <td className={td} style={bc}><Cell value={row.selfNight.day}  onChange={updSub("selfNight","day")}  small highlight={highlightDate(row.selfNight.day)} /></td>
      <td className={td} style={bc}><Cell value={row.selfNight.night}onChange={updSub("selfNight","night")}small highlight={highlightDate(row.selfNight.night)} /></td>
      <td className={td} style={bc}><Cell value={row.vkk}       onChange={upd("vkk")}       small highlight={highlightDate(row.vkk)} /></td>
      <td className={td} style={bc}><Cell value={row.vkkReturn} onChange={upd("vkkReturn")} small highlight={highlightDate(row.vkkReturn)} /></td>
      <td className={td} style={bc}><Cell value={row.updatedAt} onChange={upd("updatedAt")} small /></td>
      <td className={td} style={{ ...bc, minWidth: "80px" }}><Cell value={row.notes} onChange={upd("notes")} /></td>
      <td className={td} style={{ ...bc, textAlign: "center" }}>
        <button
          onClick={() => onDelete(row.id)}
          className="p-1 rounded transition-colors"
          style={{ color: TEXT.dim }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = STATUS.red; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT.dim; }}
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// ENGINEER TABLE ROW
// ─────────────────────────────────────────────
function EngineerTableRow({ row, onUpdate, onDelete }: {
  row: EngineerRow;
  onUpdate: (id: string, field: string, value: string | CheckDate) => void;
  onDelete: (id: string) => void;
}) {
  const upd = (field: string) => (v: string) => onUpdate(row.id, field, v);
  const updSub = (field: string, sub: "day" | "night") => (v: string) => {
    const cur = getCheckDate(row, field);
    onUpdate(row.id, field, { ...cur, [sub]: v });
  };

  const engineerCheckFields = [
    "checkNoDispatching", "checkBoarding", "checkCrewPrep", "checkMiddleAid",
    "checkCombat", "checkWithSingle", "checkControlFlight", "checkInstructors",
  ];

  const td = "px-1 py-0.5 border";
  const bc: React.CSSProperties = { borderColor: BORDER.blue };

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: BORDER.blue }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = BG.hover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <td className={td} style={{ ...bc, color: TEXT.muted, width: "28px", textAlign: "center", fontSize: "11px" }}>{row.num}</td>
      <td className={td} style={{ ...bc, minWidth: "110px" }}><Cell value={row.position}         onChange={upd("position")} /></td>
      <td className={td} style={{ ...bc, minWidth: "56px"  }}><Cell value={row.rank}             onChange={upd("rank")} /></td>
      <td className={td} style={{ ...bc, minWidth: "120px" }}><Cell value={row.fullName}          onChange={upd("fullName")} /></td>
      <td className={td} style={{ ...bc, minWidth: "70px"  }}><Cell value={row.birthDate}         onChange={upd("birthDate")} /></td>
      <td className={td} style={{ ...bc, minWidth: "100px" }}><Cell value={row.education}         onChange={upd("education")} small /></td>
      <td className={td} style={{ ...bc, minWidth: "60px"  }}><Cell value={row.aircraftType}      onChange={upd("aircraftType")} /></td>
      <td className={td} style={{ ...bc, minWidth: "32px"  }}><Cell value={row.aircraftClass}     onChange={upd("aircraftClass")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.totalHours}        onChange={upd("totalHours")} /></td>
      <td className={td} style={{ ...bc, minWidth: "60px"  }}><Cell value={row.lastYearHours}     onChange={upd("lastYearHours")} /></td>
      <td className={td} style={{ ...bc, minWidth: "50px"  }}><Cell value={row.currentYearHours}  onChange={upd("currentYearHours")} /></td>
      {engineerCheckFields.map((field) => {
        const cd = getCheckDate(row, field);
        return (
          <React.Fragment key={field}>
            <td className={td} style={bc}>
              <Cell value={cd.day}   onChange={updSub(field, "day")}   small highlight={highlightDate(cd.day)} />
            </td>
            <td className={td} style={bc}>
              <Cell value={cd.night} onChange={updSub(field, "night")} small highlight={highlightDate(cd.night)} />
            </td>
          </React.Fragment>
        );
      })}
      <td className={td} style={bc}><Cell value={row.vkk}       onChange={upd("vkk")}       small highlight={highlightDate(row.vkk)} /></td>
      <td className={td} style={bc}><Cell value={row.vkkReturn} onChange={upd("vkkReturn")} small highlight={highlightDate(row.vkkReturn)} /></td>
      <td className={td} style={bc}><Cell value={row.updatedAt} onChange={upd("updatedAt")} small /></td>
      <td className={td} style={{ ...bc, minWidth: "80px" }}><Cell value={row.notes} onChange={upd("notes")} /></td>
      <td className={td} style={{ ...bc, textAlign: "center" }}>
        <button
          onClick={() => onDelete(row.id)}
          className="p-1 rounded transition-colors"
          style={{ color: TEXT.dim }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = STATUS.red; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT.dim; }}
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
const STORAGE_KEY = "aviapilot_training_v1";

function loadFromStorage(): { pilots: PilotRow[]; engineers: EngineerRow[] } {
  if (typeof window === "undefined") return { pilots: INITIAL_PILOTS, engineers: INITIAL_ENGINEERS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { pilots: INITIAL_PILOTS, engineers: INITIAL_ENGINEERS };
    const parsed = JSON.parse(raw);
    return {
      pilots:    parsed.pilots    ?? INITIAL_PILOTS,
      engineers: parsed.engineers ?? INITIAL_ENGINEERS,
    };
  } catch {
    return { pilots: INITIAL_PILOTS, engineers: INITIAL_ENGINEERS };
  }
}

// ─────────────────────────────────────────────
// SHARED BUTTON STYLE HELPER
// ─────────────────────────────────────────────
function actionBtn(accent = false): React.CSSProperties {
  return {
    background: accent ? "rgba(245,158,11,0.12)" : BG.card,
    border: accent ? "1px solid rgba(245,158,11,0.40)" : `1px solid ${BORDER.default}`,
    color: accent ? STATUS.amber : TEXT.secondary,
    fontFamily: "inherit",
  };
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function TrainingGraphPage() {
  const [tab, setTab] = useState<TabType>("pilots");
  const stored = loadFromStorage();
  const [pilots, setPilots]       = useState<PilotRow[]>(stored.pilots);
  const [engineers, setEngineers] = useState<EngineerRow[]>(stored.engineers);
  const [saved, setSaved]         = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markDirty = () => setHasUnsaved(true);

  const saveToStorage = useCallback((p: PilotRow[], e: EngineerRow[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pilots: p, engineers: e }));
      setSaved(true); setHasUnsaved(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Ошибка сохранения. Возможно, переполнено хранилище браузера.");
    }
  }, []);

  const handleSave = () => saveToStorage(pilots, engineers);

  const updatePilot = useCallback((id: string, field: string, value: string | CheckDate) => {
    setPilots((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    markDirty();
  }, []);

  const deletePilot = useCallback((id: string) => {
    setPilots((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, num: i + 1 })));
    markDirty();
  }, []);

  const addPilot = () => { setPilots((prev) => [...prev, emptyPilot(prev.length + 1)]); markDirty(); };

  const updateEngineer = useCallback((id: string, field: string, value: string | CheckDate) => {
    setEngineers((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
    markDirty();
  }, []);

  const deleteEngineer = useCallback((id: string) => {
    setEngineers((prev) => prev.filter((r) => r.id !== id).map((r, i) => ({ ...r, num: i + 1 })));
    markDirty();
  }, []);

  const addEngineer = () => { setEngineers((prev) => [...prev, emptyEngineer(prev.length + 1)]); markDirty(); };

  // ── Flatten for Excel ────────────────────────
  const flattenRow = (r: PilotRow | EngineerRow): Record<string, string> => {
    const out: Record<string, string> = {};
    const rec = toRecord(r);
    for (const key of Object.keys(rec)) {
      if (key === "id") continue;
      const val = rec[key];
      if (val !== null && typeof val === "object" && "day" in (val as object)) {
        const cd = val as CheckDate;
        out[key + "_день"] = cd.day;
        out[key + "_ночь"] = cd.night;
      } else {
        out[key] = String(val ?? "");
      }
    }
    return out;
  };

  const exportExcel = async () => {
    const XLSX = (await import("xlsx")).default;
    const rows = tab === "pilots" ? pilots : engineers;
    const data = rows.map(flattenRow);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === "pilots" ? "Пилоты" : "Инженеры");
    const cols = Object.keys(data[0] || {}).map((k) => ({
      wch: Math.max(k.length, ...data.map((r) => (r[k] ?? "").length), 8),
    }));
    ws["!cols"] = cols;
    XLSX.writeFile(wb, `${tab === "pilots" ? "Пилоты" : "Инженеры"}_натренированность_${new Date().toLocaleDateString("ru-RU")}.xlsx`);
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const XLSX = (await import("xlsx")).default;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const pilotCF    = ["checkTechnique","checkNavigation","checkCombat","selfDay","selfNight"];
    const engineerCF = ["checkNoDispatching","checkBoarding","checkCrewPrep","checkMiddleAid","checkCombat","checkWithSingle","checkControlFlight","checkInstructors"];

    for (const sheetName of wb.SheetNames) {
      const ws   = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

      if (sheetName === "Пилоты") {
        const restored: PilotRow[] = json.map((row, i) => {
          const base = emptyPilot(i + 1);
          const rec  = toRecord(base);
          for (const key of Object.keys(rec)) {
            if (typeof rec[key] === "string" && row[key] !== undefined) rec[key] = row[key];
          }
          for (const f of pilotCF) {
            rec[f] = { day: row[`${f}_день`] ?? "", night: row[`${f}_ночь`] ?? "" } satisfies CheckDate;
          }
          rec["id"] = uid(); rec["num"] = i + 1;
          return rec as unknown as PilotRow;
        });
        if (restored.length) { setPilots(restored); setTab("pilots"); }
      }

      if (sheetName === "Инженеры") {
        const restored: EngineerRow[] = json.map((row, i) => {
          const base = emptyEngineer(i + 1);
          const rec  = toRecord(base);
          for (const key of Object.keys(rec)) {
            if (typeof rec[key] === "string" && row[key] !== undefined) rec[key] = row[key];
          }
          for (const f of engineerCF) {
            rec[f] = { day: row[`${f}_день`] ?? "", night: row[`${f}_ночь`] ?? "" } satisfies CheckDate;
          }
          rec["id"] = uid(); rec["num"] = i + 1;
          return rec as unknown as EngineerRow;
        });
        if (restored.length) { setEngineers(restored); setTab("engineers"); }
      }
    }
    saveToStorage(pilots, engineers);
  };

  const isPilots = tab === "pilots";

  return (
    <div
      className="p-6 space-y-4"
      style={{ background: BG.base, minHeight: "100vh", color: TEXT.primary }}
    >
      {/* ── Header ───────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {isPilots ? <Plane size={20} className="text-white" /> : <Wrench size={20} className="text-white" />}
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: TEXT.primary }}>
              График натренированности
            </h1>
            <p className="text-xs" style={{ color: TEXT.muted }}>
              Таблица анализа уровня подготовки лётного состава · г. Астана
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.28)", color: STATUS.green }}
              >
                <CheckCircle2 size={12} /> Сохранено в браузере
              </motion.div>
            )}
          </AnimatePresence>

          {([
            { icon: Upload,  label: "Импорт Excel",  fn: () => fileInputRef.current?.click(), accent: false },
            { icon: Download,label: "Экспорт Excel",  fn: exportExcel,         accent: false },
            { icon: Save,    label: hasUnsaved ? "Сохранить •" : "Сохранить", fn: handleSave, accent: hasUnsaved },
            { icon: Printer, label: "Печать",         fn: () => window.print(), accent: false },
          ] as { icon: React.ElementType; label: string; fn: () => void; accent: boolean }[]).map(({ icon: Icon, label, fn, accent }) => (
            <button
              key={label}
              onClick={fn}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={actionBtn(accent)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT.primary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = accent ? STATUS.amber : TEXT.secondary; }}
            >
              <Icon size={13} />{label}
            </button>
          ))}
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
        </div>
      </div>

      {/* ── Tab switcher ─────────────────────── */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl w-fit"
        style={{ background: BG.card, border: `1px solid ${BORDER.default}` }}
      >
        {(["pilots", "engineers"] as TabType[]).map((t) => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: tab === t ? "linear-gradient(135deg, #1d4ed8, #3b82f6)" : "transparent",
              color:      tab === t ? "#ffffff" : TEXT.muted,
              border:     tab === t ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
              fontFamily: "inherit",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {t === "pilots" ? <Plane size={14} /> : <Wrench size={14} />}
            {t === "pilots" ? "Пилоты" : "Инженеры / Техники"}
          </motion.button>
        ))}
      </div>

      {/* ── Legend ───────────────────────────── */}
      <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: TEXT.muted }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(34,197,94,0.35)" }} />
          Действующие данные
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(239,68,68,0.35)" }} />
          Просроченные
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: STATUS.green }}>+</span>&nbsp;Готов
          <span className="ml-2" style={{ color: STATUS.red }}>−</span>&nbsp;Не готов
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock size={11} /> Все даты в формате ДД.ММ.ГГ
        </div>
      </div>

      {/* ── Table container ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
          className="rounded-xl overflow-hidden"
          style={{ background: BG.card, border: `1px solid ${BORDER.default}` }}
        >
          {/* Table title */}
          <div
            className="px-4 py-3 text-center text-sm font-semibold"
            style={{
              background: BG.deep,
              borderBottom: `1px solid ${BORDER.default}`,
              color: TEXT.primary,
            }}
          >
            {isPilots
              ? "ТАБЛИЦА АНАЛИЗА УРОВНЯ ПОДГОТОВКИ ЛЁТНОГО СОСТАВА АВИАЦИОННОГО ОТДЕЛА (Г. АСТАНА)"
              : "ДАННЫЕ ЛЁТНОГО СОСТАВА АВИАЦИОННОГО ОТДЕЛА (С МЕСТОМ ДИСЛОКАЦИИ Г. АСТАНА) — БОРТОВЫЕ ТЕХНИКИ И МЕХАНИКИ"}
          </div>

          <div className="overflow-x-auto">
            {isPilots ? (
              <table className="w-full border-collapse" style={{ minWidth: "1800px", background: BG.card }}>
                <thead>
                  <tr>
                    <Th rowSpan={3} w="28px">№</Th>
                    <Th rowSpan={3}>Должность</Th>
                    <Th rowSpan={3}>Воинское звание</Th>
                    <Th rowSpan={3}>Фамилия И.О.</Th>
                    <Th rowSpan={3}>Дата рождения</Th>
                    <Th rowSpan={3}>Образование</Th>
                    <Th rowSpan={3}>Тип ВС</Th>
                    <Th rowSpan={3}>Класс</Th>
                    <Th colSpan={3}>Общий налёт, час</Th>
                    <Th colSpan={2}>Последний минимум лётчика (инструкт.)</Th>
                    <Th colSpan={6}>Готовность к боевым действиям</Th>
                    <Th colSpan={12}>Даты крайних проверок лётной подготовки</Th>
                    <Th colSpan={4}>Дата крайнего самостоятельного полёта</Th>
                    <Th colSpan={2}>ВКК</Th>
                    <Th rowSpan={3}>Обновлено</Th>
                    <Th rowSpan={3}>Примечание</Th>
                    <Th rowSpan={3} w="28px"></Th>
                  </tr>
                  <tr>
                    <Th rowSpan={2}>На всё время</Th>
                    <Th rowSpan={2}>На дан. тип</Th>
                    <Th rowSpan={2}>В текущ. году</Th>
                    <Th rowSpan={2}>День</Th>
                    <Th rowSpan={2}>Ночь</Th>
                    <Th colSpan={2}>ПМУ</Th>
                    <Th colSpan={2}>СМУ</Th>
                    <Th colSpan={2}>УАП</Th>
                    <Th colSpan={2}>Техника пилотирования</Th>
                    <Th colSpan={2}>Навигационная</Th>
                    <Th colSpan={2}>Боевое применение</Th>
                    <Th rowSpan={2}>Пол. дубл.</Th>
                    <Th rowSpan={2}>Пол. доп. (ПСО)</Th>
                    <Th rowSpan={2}>Полёт по приборам</Th>
                    <Th rowSpan={2}>МЛПВВБ</Th>
                    <Th rowSpan={2}>ЗЛПВВБ</Th>
                    <Th rowSpan={2}>КВС</Th>
                    <Th colSpan={2}>День</Th>
                    <Th colSpan={2}>Ночь</Th>
                    <Th rowSpan={2}>Дата прохожд.</Th>
                    <Th rowSpan={2}>Дата возвращения</Th>
                  </tr>
                  <tr>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                    <Th>День</Th><Th>Ночь</Th>
                  </tr>
                </thead>
                <tbody>
                  {pilots.map((row) => (
                    <PilotTableRow key={row.id} row={row} onUpdate={updatePilot} onDelete={deletePilot} />
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse" style={{ minWidth: "1600px", background: BG.card }}>
                <thead>
                  <tr>
                    <Th rowSpan={3} w="28px">№</Th>
                    <Th rowSpan={3}>Должность</Th>
                    <Th rowSpan={3}>Воинское звание</Th>
                    <Th rowSpan={3}>Фамилия И.О.</Th>
                    <Th rowSpan={3}>Дата рождения</Th>
                    <Th rowSpan={3}>Образование</Th>
                    <Th rowSpan={3}>Тип ВС</Th>
                    <Th rowSpan={3}>Класс</Th>
                    <Th colSpan={3}>Уровень подготовки — общий налёт, час</Th>
                    <Th colSpan={16}>Проверки</Th>
                    <Th rowSpan={3}>Дата прохожд. ВКК</Th>
                    <Th rowSpan={3}>Дата возвращения из отряда</Th>
                    <Th rowSpan={3}>Обновлено</Th>
                    <Th rowSpan={3}>Примечание</Th>
                    <Th rowSpan={3} w="28px"></Th>
                  </tr>
                  <tr>
                    <Th rowSpan={2}>На все время</Th>
                    <Th rowSpan={2}>На дан. тип</Th>
                    <Th rowSpan={2}>В тек. году</Th>
                    <Th colSpan={2}>Не десантирование (борт. техника)</Th>
                    <Th colSpan={2}>Влад. на борт. перег. людей (посад. ПСО)</Th>
                    <Th colSpan={2}>Кладовщ. на борт (подгот. ПСО)</Th>
                    <Th colSpan={2}>На промежут. сред. перевязки</Th>
                    <Th colSpan={2}>С единиц. действ.</Th>
                    <Th colSpan={2}>Контрольный полёт по маршруту</Th>
                    <Th colSpan={2}>Лётно-методические навыки</Th>
                    <Th colSpan={2}>Инструктирование</Th>
                  </tr>
                  <tr>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <Th>День</Th>
                        <Th>Ночь</Th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {engineers.map((row) => (
                    <EngineerTableRow key={row.id} row={row} onUpdate={updateEngineer} onDelete={deleteEngineer} />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add row */}
          <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER.default}`, background: BG.card }}>
            <button
              onClick={isPilots ? addPilot : addEngineer}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "rgba(59,130,246,0.10)",
                border: "1px solid rgba(59,130,246,0.28)",
                color: STATUS.blue,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.20)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.10)"; }}
            >
              <Plus size={13} /> Добавить строку
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Stats ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(isPilots ? [
          { label: "Всего пилотов",  value: pilots.length,                                                    color: STATUS.blue,  Icon: Plane as React.ElementType,         bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.20)" },
          { label: "Готовы ПМУ",     value: pilots.filter((p) => p.readyPmuDay === "+" && p.readyPmuNight === "+").length, color: STATUS.green, Icon: CheckCircle2 as React.ElementType, bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.20)"  },
          { label: "Готовы СМУ",     value: pilots.filter((p) => p.readySmuDay === "+" && p.readySmuNight === "+").length, color: STATUS.green, Icon: CheckCircle2 as React.ElementType, bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.20)"  },
          { label: "Не готовы",      value: pilots.filter((p) => p.readyPmuDay === "-" || p.readySmuDay === "-").length,   color: STATUS.red,   Icon: AlertCircle  as React.ElementType, bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.20)"  },
        ] : [
          { label: "Всего инженеров",  value: engineers.length,                                                    color: STATUS.blue,  Icon: Wrench as React.ElementType,        bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.20)" },
          { label: "С ВКК",            value: engineers.filter((e) => !!e.vkk).length,                             color: STATUS.green, Icon: CheckCircle2 as React.ElementType, bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.20)"  },
          { label: "Проверены",        value: engineers.filter((e) => !!e.checkNoDispatching.day).length,           color: STATUS.green, Icon: CheckCircle2 as React.ElementType, bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.20)"  },
          { label: "Без проверок",     value: engineers.filter((e) => !e.checkNoDispatching.day).length,            color: STATUS.red,   Icon: AlertCircle  as React.ElementType, bg: "rgba(239,68,68,0.06)",   border: "rgba(239,68,68,0.20)"  },
        ]).map(({ label, value, color, Icon, bg, border }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <span className="text-xs" style={{ color: TEXT.muted }}>{label}</span>
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          @page { size: A3 landscape; margin: 10mm; }
          button { display: none !important; }
          table { font-size: 7px !important; }
          th, td { padding: 1px 2px !important; }
        }
      `}</style>
    </div>
  );
}
