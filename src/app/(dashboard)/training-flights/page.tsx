"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetchCrewMembers } from "@/lib/crew-api";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrewLocal { id: string; name: string; role: string; }

interface ApiError {
  response?: { data?: { message?: string } };
  message?: string;
}

interface TrainingFlight {
  id: string;
  flightNumber: string;
  callSign: string;
  acType: string;
  acReg: string;
  timeOfDay: string;
  leftSeatCrewId?: string;
  leftSeatPos: string;
  leftSeatName: string;
  rightSeatCrewId?: string;
  rightSeatPos: string;
  rightSeatName: string;
  landingSeatPos?: string;
  attendantIds: string[];
  engineerIds: string[];
  technicianIds: string[];
  mechanicIds: string[];
  attendantNames: string[];
  engineerNames: string[];
  technicianNames: string[];
  mechanicNames: string[];
  exerciseNumber?: string;
  takeoffDate: string;
  takeoffTime: string;
  landingDate: string;
  landingTime: string;
  totalTime: number;
  closedCabinTime: number;
  smuTotal: number;
  smuClouds: number;
  altMax?: number;
  altMin?: number;
  visibility?: number;
  cloudiness?: number;
  cloudTop?: number;
  cloudBase?: number;
  takeoffMinimum: boolean;
  approachRmsA: boolean;
  approachRmsD: boolean;
  approachRmsR: boolean;
  approachViz: boolean;
  approachCount: number;
  landingsCount: number;
  remarks?: string;
  createdAt: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BG = {
  base:   "#141824",  // страница
  card:   "#1e2330",  // карточки / stat-блоки
  input:  "#252b3b",  // поля ввода, вложенные блоки
  hover:  "#2d3446",  // hover / кнопки-toggle
  deep:   "#111520",  // строки expanded, modal header/footer
  modal:  "#1a1f2e",  // модальное окно
} as const;

const BORDER = {
  default: "#2d3446",
  blue:    "rgba(74,124,247,0.22)",
  blueHi:  "rgba(74,124,247,0.45)",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const minToHHMM = (m: number) =>
  `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;

const calcMinutes = (td: string, tt: string, ld: string, lt: string): number => {
  if (!td || !tt || !ld || !lt) return 0;
  const dep = new Date(`${td}T${tt}:00Z`);
  const arr = new Date(`${ld}T${lt}:00Z`);
  const diff = arr.getTime() - dep.getTime();
  return diff > 0 ? Math.round(diff / 60000) : 0;
};

function getErrorMessage(e: unknown): string {
  const err = e as ApiError;
  return err?.response?.data?.message ?? err?.message ?? "Ошибка сохранения";
}

const CATEGORY_TO_ROLE: Record<string, string> = {
  COMMANDER: "КВС", SECOND_PILOT: "ВП", INSTRUCTOR: "ЛИ",
  ENGINEER: "БИ", TECHNICIAN: "БТ", MECHANIC: "БМ", FLIGHT_ATTENDANT: "БП",
};

function mapCrew(m: {
  id: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  category: string;
}): CrewLocal {
  return {
    id: m.id,
    name: [m.lastName, m.firstName, m.middleName].filter(Boolean).join(" "),
    role: CATEGORY_TO_ROLE[m.category] ?? m.category,
  };
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  inp: {
    background: BG.input,
    border: `1px solid ${BORDER.default}`,
    borderRadius: 6,
    padding: "7px 11px",
    color: "#e2e8f0",
    fontSize: 12,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  lbl: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: 4,
    display: "block",
  },
  card: {
    background: BG.card,
    border: `1px solid ${BORDER.default}`,
    borderRadius: 10,
    padding: "14px 16px",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 10,
    color: "#4a7cf7",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontWeight: 800,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
};

// ─── CheckBox ─────────────────────────────────────────────────────────────────

function CB({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 7,
      cursor: "pointer", fontSize: 12,
      color: checked ? "#60a5fa" : "#64748b",
      userSelect: "none",
    }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 16, height: 16, borderRadius: 3,
          border: `1.5px solid ${checked ? "#4a7cf7" : BORDER.default}`,
          background: checked ? "#4a7cf7" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, cursor: "pointer",
        }}
      >
        {checked && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>
      {label}
    </label>
  );
}

// ─── MultiPickCrew ────────────────────────────────────────────────────────────

function MultiPickCrew({ label, options, selectedIds, onChange }: {
  label: string; options: CrewLocal[]; selectedIds: string[];
  onChange: (ids: string[], names: string[]) => void;
}) {
  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next, next.map(nid => options.find(o => o.id === nid)?.name ?? nid));
  };

  return (
    <div>
      <label style={S.lbl}>{label}</label>
      {options.length === 0
        ? <div style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>Нет сотрудников</div>
        : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {options.map(c => {
              const on = selectedIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  style={{
                    padding: "3px 9px", borderRadius: 5, fontSize: 11,
                    cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    border: "none",
                    background: on ? "rgba(74,124,247,0.15)" : BG.input,
                    color: on ? "#60a5fa" : "#64748b",
                    outline: on ? "1px solid rgba(74,124,247,0.45)" : `1px solid ${BORDER.default}`,
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )
      }
      {selectedIds.length > 0 && (
        <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>
          ✓ {selectedIds.map(id => options.find(o => o.id === id)?.name ?? id).join(", ")}
        </div>
      )}
    </div>
  );
}

// ─── MinutesInput ─────────────────────────────────────────────────────────────

function MinutesInput({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  const [local, setLocal] = useState(minToHHMM(value));
  useEffect(() => setLocal(minToHHMM(value)), [value]);

  const commit = (raw: string) => {
    const [h, m] = raw.split(":").map(Number);
    const mins = ((h || 0) * 60) + (m || 0);
    onChange(mins);
    setLocal(minToHHMM(mins));
  };

  return (
    <div>
      <label style={S.lbl}>{label}</label>
      <input
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={e => commit(e.target.value)}
        placeholder="0:00"
        style={S.inp}
      />
    </div>
  );
}

// ─── FormState ────────────────────────────────────────────────────────────────

type FormState = {
  flightNumber: string; callSign: string; acType: string; acReg: string;
  timeOfDay: string;
  leftSeatCrewId: string; leftSeatPos: string; leftSeatName: string;
  rightSeatCrewId: string; rightSeatPos: string; rightSeatName: string;
  landingSeatPos: string;
  attendantIds: string[]; engineerIds: string[]; technicianIds: string[]; mechanicIds: string[];
  attendantNames: string[]; engineerNames: string[]; technicianNames: string[]; mechanicNames: string[];
  exerciseNumber: string;
  takeoffDate: string; takeoffTime: string; landingDate: string; landingTime: string;
  closedCabinTime: number; smuTotal: number; smuClouds: number;
  altMax: string; altMin: string;
  visibility: number; cloudiness: number; cloudTop: string; cloudBase: string;
  takeoffMinimum: boolean;
  approachRmsA: boolean; approachRmsD: boolean; approachRmsR: boolean; approachViz: boolean;
  approachCount: string; landingsCount: string;
  remarks: string;
};

const emptyForm: FormState = {
  flightNumber: "", callSign: "", acType: "", acReg: "", timeOfDay: "DAY",
  leftSeatCrewId: "", leftSeatPos: "КВС", leftSeatName: "",
  rightSeatCrewId: "", rightSeatPos: "ВП", rightSeatName: "",
  landingSeatPos: "",
  attendantIds: [], engineerIds: [], technicianIds: [], mechanicIds: [],
  attendantNames: [], engineerNames: [], technicianNames: [], mechanicNames: [],
  exerciseNumber: "",
  takeoffDate: "", takeoffTime: "", landingDate: "", landingTime: "",
  closedCabinTime: 0, smuTotal: 0, smuClouds: 0,
  altMax: "", altMin: "",
  visibility: 10, cloudiness: 0, cloudTop: "", cloudBase: "",
  takeoffMinimum: false,
  approachRmsA: false, approachRmsD: false, approachRmsR: false, approachViz: false,
  approachCount: "0", landingsCount: "1",
  remarks: "",
};

function flightToForm(f: TrainingFlight): FormState {
  return {
    flightNumber: f.flightNumber, callSign: f.callSign ?? "",
    acType: f.acType, acReg: f.acReg, timeOfDay: f.timeOfDay,
    leftSeatCrewId: f.leftSeatCrewId ?? "", leftSeatPos: f.leftSeatPos, leftSeatName: f.leftSeatName,
    rightSeatCrewId: f.rightSeatCrewId ?? "", rightSeatPos: f.rightSeatPos, rightSeatName: f.rightSeatName,
    landingSeatPos: f.landingSeatPos ?? "",
    attendantIds: f.attendantIds ?? [], engineerIds: f.engineerIds ?? [],
    technicianIds: f.technicianIds ?? [], mechanicIds: f.mechanicIds ?? [],
    attendantNames: f.attendantNames ?? [], engineerNames: f.engineerNames ?? [],
    technicianNames: f.technicianNames ?? [], mechanicNames: f.mechanicNames ?? [],
    exerciseNumber: f.exerciseNumber ?? "",
    takeoffDate: f.takeoffDate, takeoffTime: f.takeoffTime,
    landingDate: f.landingDate, landingTime: f.landingTime,
    closedCabinTime: f.closedCabinTime, smuTotal: f.smuTotal, smuClouds: f.smuClouds,
    altMax: f.altMax  != null ? String(f.altMax)  : "",
    altMin: f.altMin  != null ? String(f.altMin)  : "",
    visibility: f.visibility ?? 10, cloudiness: f.cloudiness ?? 0,
    cloudTop:  f.cloudTop  != null ? String(f.cloudTop)  : "",
    cloudBase: f.cloudBase != null ? String(f.cloudBase) : "",
    takeoffMinimum: f.takeoffMinimum,
    approachRmsA: f.approachRmsA, approachRmsD: f.approachRmsD,
    approachRmsR: f.approachRmsR, approachViz: f.approachViz,
    approachCount: String(f.approachCount), landingsCount: String(f.landingsCount),
    remarks: f.remarks ?? "",
  };
}

function buildPayload(form: FormState) {
  return {
    flightNumber: form.flightNumber, callSign: form.callSign,
    acType: form.acType, acReg: form.acReg, timeOfDay: form.timeOfDay,
    leftSeatCrewId: form.leftSeatCrewId || undefined,
    leftSeatPos: form.leftSeatPos, leftSeatName: form.leftSeatName,
    rightSeatCrewId: form.rightSeatCrewId || undefined,
    rightSeatPos: form.rightSeatPos, rightSeatName: form.rightSeatName,
    landingSeatPos: form.landingSeatPos || undefined,
    attendantIds: form.attendantIds.filter(Boolean),
    engineerIds: form.engineerIds.filter(Boolean),
    technicianIds: form.technicianIds.filter(Boolean),
    mechanicIds: form.mechanicIds.filter(Boolean),
    attendantNames: form.attendantNames.filter(Boolean),
    engineerNames: form.engineerNames.filter(Boolean),
    technicianNames: form.technicianNames.filter(Boolean),
    mechanicNames: form.mechanicNames.filter(Boolean),
    exerciseNumber: form.exerciseNumber || undefined,
    takeoffDate: form.takeoffDate, takeoffTime: form.takeoffTime,
    landingDate: form.landingDate, landingTime: form.landingTime,
    closedCabinTime: form.closedCabinTime, smuTotal: form.smuTotal, smuClouds: form.smuClouds,
    altMax: form.altMax  ? Number(form.altMax)  : undefined,
    altMin: form.altMin  ? Number(form.altMin)  : undefined,
    visibility: form.visibility, cloudiness: form.cloudiness,
    cloudTop:  form.cloudTop  ? Number(form.cloudTop)  : undefined,
    cloudBase: form.cloudBase ? Number(form.cloudBase) : undefined,
    takeoffMinimum: form.takeoffMinimum,
    approachRmsA: form.approachRmsA, approachRmsD: form.approachRmsD,
    approachRmsR: form.approachRmsR, approachViz: form.approachViz,
    approachCount: Number(form.approachCount),
    landingsCount: Number(form.landingsCount),
    remarks: form.remarks || undefined,
  };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function FlightModal({ crew, onClose, onSaved, editFlight }: {
  crew: CrewLocal[];
  onClose: () => void;
  onSaved: (f: TrainingFlight) => void;
  editFlight?: TrainingFlight;
}) {
  const [form, setForm] = useState<FormState>(editFlight ? flightToForm(editFlight) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!editFlight;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const totalMin = calcMinutes(form.takeoffDate, form.takeoffTime, form.landingDate, form.landingTime);

  const leftOptions  = crew.filter(c => ["КВС", "ЛИ"].includes(c.role));
  const rightOptions = crew.filter(c => ["ВП",  "ЛИ"].includes(c.role));
  const faOptions    = crew.filter(c => c.role === "БП");
  const engOptions   = crew.filter(c => c.role === "БИ");
  const techOptions  = crew.filter(c => c.role === "БТ");
  const mechOptions  = crew.filter(c => c.role === "БМ");

  const handleSave = async () => {
    if (!form.flightNumber || !form.acType || !form.acReg ||
        !form.takeoffDate || !form.takeoffTime || !form.landingDate || !form.landingTime) {
      setError("Заполните обязательные поля: № полёта, ВС, время взлёта и посадки");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload(form);
      let data: TrainingFlight;
      if (isEdit && editFlight) {
        const res = await api.patch<TrainingFlight>(`/training-flights/${editFlight.id}`, payload);
        data = res.data;
      } else {
        const res = await api.post<TrainingFlight>("/training-flights", payload);
        data = res.data;
      }
      onSaved(data);
      onClose();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ─── Reusable inner-card style for crew seats ──────────────────────────────
  const seatCard = (accentColor: string): React.CSSProperties => ({
    background: BG.input,
    borderRadius: 8,
    padding: 12,
    border: `1px solid ${accentColor}22`,
  });

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: BG.modal,
          border: `1px solid ${BORDER.default}`,
          borderRadius: 16,
          width: 760,
          maxHeight: "94vh",
          overflowY: "auto",
          boxShadow: "0 40px 100px rgba(0,0,0,0.65)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${BORDER.default}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            position: "sticky", top: 0,
            background: BG.deep,
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
              {isEdit ? "✏️ Редактировать УТП" : "📋 Новый УТП"}
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
              {isEdit ? `Изменение полёта ${editFlight?.flightNumber}` : "Учебно-тренировочный полёт"}
            </div>
          </div>
          {totalMin > 0 && (
            <div style={{
              padding: "6px 14px",
              background: "rgba(74,124,247,0.12)",
              border: "1px solid rgba(74,124,247,0.28)",
              borderRadius: 8, fontSize: 13, color: "#60a5fa", fontWeight: 800,
            }}>
              ⏱ {minToHHMM(totalMin)}
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${BORDER.default}`,
              color: "#64748b", width: 28, height: 28,
              borderRadius: 6, cursor: "pointer", fontSize: 14,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ВС */}
          <div style={S.card}>
            <div style={S.cardTitle}>✈ Воздушное судно</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {([
                { l: "№ полёта *",    k: "flightNumber" as const, ph: "УТП-001" },
                { l: "Позывной борта", k: "callSign"     as const, ph: "KAZ123"  },
                { l: "Тип ВС *",      k: "acType"       as const, ph: "Ан-26"   },
                { l: "Борт. номер *",  k: "acReg"        as const, ph: "UP-A2601"},
              ] as const).map(f => (
                <div key={f.k}>
                  <label style={S.lbl}>{f.l}</label>
                  <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={S.inp} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={S.lbl}>Время суток</label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["DAY", "NIGHT"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => set("timeOfDay", v)}
                    style={{
                      padding: "6px 18px", borderRadius: 6, border: "none",
                      cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                      background: form.timeOfDay === v
                        ? (v === "DAY" ? "rgba(245,158,11,0.15)" : "rgba(129,140,248,0.15)")
                        : BG.hover,
                      color: form.timeOfDay === v
                        ? (v === "DAY" ? "#f59e0b" : "#818cf8")
                        : "#64748b",
                      outline: form.timeOfDay === v
                        ? `1px solid ${v === "DAY" ? "rgba(245,158,11,0.40)" : "rgba(129,140,248,0.40)"}`
                        : `1px solid ${BORDER.default}`,
                    }}
                  >
                    {v === "DAY" ? "☀ День" : "🌙 Ночь"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Время */}
          <div style={S.card}>
            <div style={S.cardTitle}>⏱ Время полёта</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {([
                { l: "Дата взлёта *",  k: "takeoffDate" as const, t: "date" },
                { l: "Время взлёта *", k: "takeoffTime" as const, t: "time" },
                { l: "Дата посадки *", k: "landingDate" as const, t: "date" },
                { l: "Время посадки *",k: "landingTime" as const, t: "time" },
              ] as const).map(f => (
                <div key={f.k}>
                  <label style={S.lbl}>{f.l}</label>
                  <input type={f.t} value={form[f.k]} onChange={e => set(f.k, e.target.value)} style={S.inp} />
                </div>
              ))}
            </div>
            {totalMin > 0 && (
              <div style={{
                marginTop: 10, padding: "8px 12px",
                background: "rgba(74,124,247,0.08)",
                border: "1px solid rgba(74,124,247,0.22)",
                borderRadius: 7, fontSize: 12, color: "#60a5fa",
              }}>
                ✓ Общий налёт: <strong>{minToHHMM(totalMin)}</strong>
              </div>
            )}
          </div>

          {/* Экипаж */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              👥 Экипаж
              <span style={{ color: "#64748b", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 9 }}>
                ({crew.length} из БД)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {/* Левое кресло */}
              <div style={seatCard("#60a5fa")}>
                <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  ✈ Левое кресло
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {(["КВС", "ЛИ"] as const).map(p => (
                    <button key={p} onClick={() => set("leftSeatPos", p)} style={{
                      flex: 1, padding: "4px", borderRadius: 5, border: "none",
                      cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                      background: form.leftSeatPos === p ? "rgba(74,124,247,0.20)" : BG.hover,
                      color: form.leftSeatPos === p ? "#60a5fa" : "#64748b",
                      outline: form.leftSeatPos === p ? "1px solid rgba(74,124,247,0.45)" : `1px solid ${BORDER.default}`,
                    }}>{p}</button>
                  ))}
                </div>
                <label style={S.lbl}>ФИО ({leftOptions.length} доступно)</label>
                <select
                  value={form.leftSeatCrewId}
                  onChange={e => {
                    const c = leftOptions.find(x => x.id === e.target.value);
                    set("leftSeatCrewId", e.target.value);
                    set("leftSeatName", c?.name ?? "");
                  }}
                  style={S.inp}
                >
                  <option value="">— Выбрать —</option>
                  {leftOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} · {c.role}</option>
                  ))}
                </select>
                {form.leftSeatName && (
                  <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 3 }}>✓ {form.leftSeatName}</div>
                )}
              </div>

              {/* Правое кресло */}
              <div style={seatCard("#34d399")}>
                <div style={{ fontSize: 9, color: "#34d399", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  ✈ Правое кресло
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {(["ВП", "ЛИ"] as const).map(p => (
                    <button key={p} onClick={() => set("rightSeatPos", p)} style={{
                      flex: 1, padding: "4px", borderRadius: 5, border: "none",
                      cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit",
                      background: form.rightSeatPos === p ? "rgba(52,211,153,0.20)" : BG.hover,
                      color: form.rightSeatPos === p ? "#34d399" : "#64748b",
                      outline: form.rightSeatPos === p ? "1px solid rgba(52,211,153,0.45)" : `1px solid ${BORDER.default}`,
                    }}>{p}</button>
                  ))}
                </div>
                <label style={S.lbl}>ФИО ({rightOptions.length} доступно)</label>
                <select
                  value={form.rightSeatCrewId}
                  onChange={e => {
                    const c = rightOptions.find(x => x.id === e.target.value);
                    set("rightSeatCrewId", e.target.value);
                    set("rightSeatName", c?.name ?? "");
                  }}
                  style={S.inp}
                >
                  <option value="">— Выбрать —</option>
                  {rightOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} · {c.role}</option>
                  ))}
                </select>
                {form.rightSeatName && (
                  <div style={{ fontSize: 10, color: "#34d399", marginTop: 3 }}>✓ {form.rightSeatName}</div>
                )}
              </div>
            </div>

            {/* С какого кресла посадка */}
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              background: BG.input, borderRadius: 8,
              border: `1px solid ${BORDER.default}`,
            }}>
              <label style={{ ...S.lbl, marginBottom: 8 }}>С какого кресла выполнена посадка</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { v: "LEFT",  label: `✈ Левое (${form.leftSeatName || form.leftSeatPos})`,    color: "#60a5fa" },
                  { v: "RIGHT", label: `✈ Правое (${form.rightSeatName || form.rightSeatPos})`,  color: "#34d399" },
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => set("landingSeatPos", form.landingSeatPos === opt.v ? "" : opt.v)}
                    style={{
                      flex: 1, padding: "7px", borderRadius: 6, border: "none",
                      cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                      background: form.landingSeatPos === opt.v ? `${opt.color}18` : BG.hover,
                      color: form.landingSeatPos === opt.v ? opt.color : "#64748b",
                      outline: form.landingSeatPos === opt.v
                        ? `1px solid ${opt.color}45`
                        : `1px solid ${BORDER.default}`,
                    }}
                  >
                    {form.landingSeatPos === opt.v ? "✓ " : ""}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Остальной экипаж */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <MultiPickCrew label={`Бортпроводники (БП) — ${faOptions.length}`}   options={faOptions}   selectedIds={form.attendantIds}  onChange={(ids, names) => setForm(p => ({ ...p, attendantIds: ids,   attendantNames: names }))} />
              <MultiPickCrew label={`Бортинженеры (БИ) — ${engOptions.length}`}    options={engOptions}   selectedIds={form.engineerIds}   onChange={(ids, names) => setForm(p => ({ ...p, engineerIds: ids,    engineerNames: names }))} />
              <MultiPickCrew label={`Борттехники (БТ) — ${techOptions.length}`}    options={techOptions}  selectedIds={form.technicianIds} onChange={(ids, names) => setForm(p => ({ ...p, technicianIds: ids, technicianNames: names }))} />
              <MultiPickCrew label={`Бортмеханики (БМ) — ${mechOptions.length}`}  options={mechOptions}  selectedIds={form.mechanicIds}   onChange={(ids, names) => setForm(p => ({ ...p, mechanicIds: ids,   mechanicNames: names }))} />
            </div>
          </div>

          {/* Задание */}
          <div style={S.card}>
            <div style={S.cardTitle}>📝 Задание</div>
            <div>
              <label style={S.lbl}>Номер упражнения</label>
              <input value={form.exerciseNumber} onChange={e => set("exerciseNumber", e.target.value)} placeholder="УТП-14 / Упр. 23..." style={S.inp} />
            </div>
          </div>

          {/* Спецналёт */}
          <div style={S.card}>
            <div style={S.cardTitle}>📊 Спецналёт</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <MinutesInput label="Закрытая кабина (Ч:ММ)" value={form.closedCabinTime} onChange={v => set("closedCabinTime", v)} />
              <MinutesInput label="СМУ всего (Ч:ММ)"       value={form.smuTotal}        onChange={v => set("smuTotal", v)} />
              <MinutesInput label="СМУ в облаках (Ч:ММ)"   value={form.smuClouds}       onChange={v => set("smuClouds", v)} />
            </div>
          </div>

          {/* Высота */}
          <div style={S.card}>
            <div style={S.cardTitle}>📐 Высота полёта</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.lbl}>Макс. высота (м)</label>
                <input type="number" value={form.altMax} onChange={e => set("altMax", e.target.value)} placeholder="9500" style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Мин. высота (м)</label>
                <input type="number" value={form.altMin} onChange={e => set("altMin", e.target.value)} placeholder="300" style={S.inp} />
              </div>
            </div>
          </div>

          {/* Метео */}
          <div style={S.card}>
            <div style={S.cardTitle}>🌤 Метеоусловия</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={S.lbl}>Видимость ({form.visibility}/10)</label>
                <input type="range" min={0} max={10} value={form.visibility} onChange={e => set("visibility", Number(e.target.value))} style={{ width: "100%", accentColor: "#34d399" }} />
              </div>
              <div>
                <label style={S.lbl}>Облачность ({form.cloudiness}/10)</label>
                <input type="range" min={0} max={10} value={form.cloudiness} onChange={e => set("cloudiness", Number(e.target.value))} style={{ width: "100%", accentColor: "#60a5fa" }} />
              </div>
              <div>
                <label style={S.lbl}>НГО облаков (м)</label>
                <input type="number" value={form.cloudBase} onChange={e => set("cloudBase", e.target.value)} placeholder="1200" style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>ВГО облаков (м)</label>
                <input type="number" value={form.cloudTop} onChange={e => set("cloudTop", e.target.value)} placeholder="3500" style={S.inp} />
              </div>
            </div>
            <CB label="Взлёт при взлётном минимуме погоды" checked={form.takeoffMinimum} onChange={v => set("takeoffMinimum", v)} />
          </div>

          {/* Заход / Посадки */}
          <div style={S.card}>
            <div style={S.cardTitle}>🛬 Заход / Посадки</div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.lbl}>Способ управления самолётом</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <CB label="РМС/А" checked={form.approachRmsA} onChange={v => set("approachRmsA", v)} />
                <CB label="РМС/Д" checked={form.approachRmsD} onChange={v => set("approachRmsD", v)} />
                <CB label="РМС/Р" checked={form.approachRmsR} onChange={v => set("approachRmsR", v)} />
                <CB label="ВИЗ"   checked={form.approachViz}  onChange={v => set("approachViz",  v)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.lbl}>Кол-во заходов</label>
                <input type="number" min={0} value={form.approachCount} onChange={e => set("approachCount", e.target.value)} style={S.inp} />
              </div>
              <div>
                <label style={S.lbl}>Кол-во посадок</label>
                <input type="number" min={0} value={form.landingsCount} onChange={e => set("landingsCount", e.target.value)} style={S.inp} />
              </div>
            </div>
          </div>

          {/* Примечания */}
          <div style={S.card}>
            <div style={S.cardTitle}>💬 Примечания</div>
            <textarea
              value={form.remarks}
              onChange={e => set("remarks", e.target.value)}
              rows={2}
              placeholder="Особые условия, замечания..."
              style={{ ...S.inp, resize: "none" }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.28)",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 12, color: "#f87171",
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${BORDER.default}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", bottom: 0,
          background: BG.deep,
        }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            {totalMin > 0
              ? `Налёт: ${minToHHMM(totalMin)} · ${Number(form.landingsCount)} посадок`
              : "Заполните время взлёта и посадки"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px", borderRadius: 7,
                border: `1px solid ${BORDER.default}`,
                background: "none", color: "#64748b",
                cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              }}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "8px 22px", borderRadius: 7, border: "none",
                background: saving
                  ? "rgba(29,78,216,0.50)"
                  : "linear-gradient(135deg,#4a7cf7,#1d4ed8)",
                color: "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              {saving ? "⏳ Сохранение..." : isEdit ? "✓ Сохранить изменения" : "✓ Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FlightCard ───────────────────────────────────────────────────────────────

function FlightCard({ f, onDelete, onEdit }: {
  f: TrainingFlight;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const approaches = [
    f.approachRmsA && "РМС/А",
    f.approachRmsD && "РМС/Д",
    f.approachRmsR && "РМС/Р",
    f.approachViz  && "ВИЗ",
  ].filter(Boolean).join(", ");

  const rowDivider: React.CSSProperties = {
    display: "flex", justifyContent: "space-between",
    padding: "4px 0",
    borderBottom: `1px solid ${BORDER.default}`,
  };

  return (
    <div style={{
      background: BG.card,
      border: `1px solid ${BORDER.default}`,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 8,
    }}>
      {/* Заголовок */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: f.timeOfDay === "NIGHT" ? "rgba(129,140,248,0.15)" : "rgba(245,158,11,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {f.timeOfDay === "NIGHT" ? "🌙" : "☀"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>{f.flightNumber}</span>
            {f.callSign && (
              <span style={{
                fontSize: 10, color: "#60a5fa",
                background: "rgba(96,165,250,0.10)",
                padding: "1px 7px", borderRadius: 4,
                border: "1px solid rgba(96,165,250,0.25)",
              }}>{f.callSign}</span>
            )}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{f.acType} · {f.acReg}</span>
            {f.exerciseNumber && (
              <span style={{
                fontSize: 10, color: "#a78bfa",
                background: "rgba(167,139,250,0.08)",
                padding: "1px 7px", borderRadius: 4,
              }}>Упр. {f.exerciseNumber}</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {f.takeoffDate} {f.takeoffTime} → {f.landingDate} {f.landingTime} ·
            <span style={{ color: "#34d399", fontWeight: 700, marginLeft: 6 }}>⏱ {minToHHMM(f.totalTime)}</span>
            {f.landingsCount > 0 && (
              <span style={{ color: "#fbbf24", marginLeft: 8 }}>↓ {f.landingsCount} посадок</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: "#64748b", textAlign: "right" }}>
            <div>
              {f.leftSeatPos}:&nbsp;
              <span style={{ color: f.leftSeatName ? "#94a3b8" : "#475569" }}>
                {f.leftSeatName || "—"}
              </span>
            </div>
            <div>
              {f.rightSeatPos}:&nbsp;
              <span style={{ color: f.rightSeatName ? "#94a3b8" : "#475569" }}>
                {f.rightSeatName || "—"}
              </span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            style={{
              padding: "5px 10px", borderRadius: 6,
              border: "1px solid rgba(74,124,247,0.28)",
              background: "rgba(74,124,247,0.08)",
              color: "#60a5fa", cursor: "pointer",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            ✏️
          </button>
          <span style={{ color: "#475569", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Детали */}
      {open && (
        <div style={{
          padding: "14px 16px 16px",
          borderTop: `1px solid ${BORDER.default}`,
          background: BG.deep,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>

            {/* Спецналёт */}
            <div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Спецналёт</div>
              {[
                { l: "Закрытая кабина", v: minToHHMM(f.closedCabinTime) },
                { l: "СМУ всего",       v: minToHHMM(f.smuTotal) },
                { l: "СМУ в облаках",   v: minToHHMM(f.smuClouds) },
              ].map(r => (
                <div key={r.l} style={rowDivider}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{r.l}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Метео */}
            <div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Метеоусловия</div>
              {[
                { l: "Видимость",   v: f.visibility  != null ? `${f.visibility}/10`  : "—" },
                { l: "Облачность",  v: f.cloudiness  != null ? `${f.cloudiness}/10`  : "—" },
                { l: "НГО",         v: f.cloudBase   != null ? `${f.cloudBase} м`    : "—" },
                { l: "ВГО",         v: f.cloudTop    != null ? `${f.cloudTop} м`     : "—" },
                { l: "Высота макс", v: f.altMax      != null ? `${f.altMax} м`       : "—" },
                { l: "Высота мин",  v: f.altMin      != null ? `${f.altMin} м`       : "—" },
              ].map(r => (
                <div key={r.l} style={rowDivider}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{r.l}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.v}</span>
                </div>
              ))}
            </div>

            {/* Заход / Посадки */}
            <div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Заход / Посадки</div>
              <div style={{ marginBottom: 8 }}>
                {approaches ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {([f.approachRmsA && "РМС/А", f.approachRmsD && "РМС/Д", f.approachRmsR && "РМС/Р", f.approachViz && "ВИЗ"] as (string | false)[])
                      .filter((a): a is string => Boolean(a))
                      .map(a => (
                        <span key={a} style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                          background: "rgba(96,165,250,0.10)", color: "#60a5fa",
                          border: "1px solid rgba(96,165,250,0.25)",
                        }}>{a}</span>
                      ))}
                  </div>
                ) : <span style={{ fontSize: 11, color: "#475569" }}>—</span>}
              </div>
              {[
                { l: "Заходов", v: f.approachCount },
                { l: "Посадок", v: f.landingsCount },
              ].map(r => (
                <div key={r.l} style={rowDivider}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24" }}>{r.v}</span>
                </div>
              ))}
              {f.takeoffMinimum && (
                <div style={{ marginTop: 6, fontSize: 10, color: "#f87171" }}>⚠ Взлёт при взлётном минимуме</div>
              )}
              {f.landingSeatPos && (
                <div style={{ marginTop: 6, fontSize: 10, color: "#34d399" }}>
                  ✈ Посадка с {f.landingSeatPos === "LEFT" ? "левого" : "правого"} кресла
                </div>
              )}
            </div>

            {/* Экипаж */}
            <div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 700 }}>Экипаж</div>
              {[
                ...f.attendantNames.map(n  => ({ r: "БП", n })),
                ...f.engineerNames.map(n   => ({ r: "БИ", n })),
                ...f.technicianNames.map(n => ({ r: "БТ", n })),
                ...f.mechanicNames.map(n   => ({ r: "БМ", n })),
              ].map((m, i) => (
                <div key={i} style={rowDivider}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{m.r}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{m.n}</span>
                </div>
              ))}
              {f.remarks && (
                <div style={{
                  marginTop: 10, padding: "7px 10px",
                  background: BG.input,
                  borderRadius: 6, fontSize: 11, color: "#94a3b8",
                  borderLeft: "2px solid #fbbf24",
                }}>
                  {f.remarks}
                </div>
              )}
            </div>
          </div>

          {/* Кнопки внизу карточки */}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: "1px solid rgba(74,124,247,0.28)",
                background: "rgba(74,124,247,0.08)",
                color: "#60a5fa", cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              }}
            >
              ✏️ Редактировать
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: "6px 14px", borderRadius: 6,
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
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrainingFlightsPage() {
  const [flights, setFlights]       = useState<TrainingFlight[]>([]);
  const [crew, setCrew]             = useState<CrewLocal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editFlight, setEditFlight] = useState<TrainingFlight | undefined>(undefined);
  const [search, setSearch]         = useState("");

  const fetchFlights = useCallback(async () => {
    try {
      const { data } = await api.get<TrainingFlight[]>("/training-flights");
      setFlights(Array.isArray(data) ? data : (data as { data: TrainingFlight[] })?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchCrew = useCallback(async () => {
    try {
      const members = await apiFetchCrewMembers({}, "lastName", "asc");
      setCrew(members.map(mapCrew));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchFlights(); fetchCrew(); }, [fetchFlights, fetchCrew]);

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись?")) return;
    try {
      await api.delete(`/training-flights/${id}`);
      setFlights(p => p.filter(f => f.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleEdit  = (flight: TrainingFlight) => { setEditFlight(flight); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setEditFlight(undefined); };

  const handleSaved = (saved: TrainingFlight) => {
    setFlights(prev => {
      const idx = prev.findIndex(f => f.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
  };

  const filtered = flights.filter(f => {
    const q = search.toLowerCase();
    return !q
      || f.flightNumber.toLowerCase().includes(q)
      || f.acType.toLowerCase().includes(q)
      || f.acReg.toLowerCase().includes(q)
      || f.leftSeatName.toLowerCase().includes(q)
      || f.rightSeatName.toLowerCase().includes(q);
  });

  const totalHours    = flights.reduce((a, f) => a + f.totalTime, 0);
  const totalLandings = flights.reduce((a, f) => a + f.landingsCount, 0);
  const nightFlights  = flights.filter(f => f.timeOfDay === "NIGHT").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: BG.base,
      color: "#e2e8f0",
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${BG.card}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER.default}; border-radius: 2px; }
        select option { background: ${BG.modal}; }
        input[type=range] { height: 4px; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg,#1e3a8a,#4a7cf7)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🎯</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: 0, letterSpacing: "-0.01em" }}>УТП</h1>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Учебно-тренировочные полёты</div>
            </div>
          </div>
          <button
            onClick={() => { setEditFlight(undefined); setShowModal(true); }}
            style={{
              padding: "9px 20px", borderRadius: 9, border: "none",
              background: "linear-gradient(135deg,#4a7cf7,#1d4ed8)",
              color: "#fff", cursor: "pointer",
              fontSize: 12, fontWeight: 800, fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(74,124,247,0.30)",
            }}
          >
            + Добавить полёт
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: "Всего полётов", v: String(flights.length),  c: "#4a7cf7" },
            { l: "Общий налёт",   v: minToHHMM(totalHours),   c: "#34d399" },
            { l: "Посадок",       v: String(totalLandings),    c: "#fbbf24" },
            { l: "Ночных",        v: String(nightFlights),     c: "#818cf8" },
          ].map(s => (
            <div key={s.l} style={{
              background: BG.card,
              border: `1px solid ${s.c}22`,
              borderRadius: 10, padding: "14px 16px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg,${s.c}88,transparent)`,
              }} />
              <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 14 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Поиск по номеру, ВС, экипажу..."
            style={{ ...S.inp, paddingLeft: 12 }}
          />
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>⏳ Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div>Записей нет. Добавьте первый учебно-тренировочный полёт!</div>
          </div>
        ) : (
          filtered.map(f => (
            <FlightCard
              key={f.id}
              f={f}
              onDelete={() => handleDelete(f.id)}
              onEdit={() => handleEdit(f)}
            />
          ))
        )}
      </div>

      {showModal && (
        <FlightModal
          crew={crew}
          onClose={handleClose}
          onSaved={handleSaved}
          editFlight={editFlight}
        />
      )}
    </div>
  );
}
