import { type FlightStatus } from "@/types/flight";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<FlightStatus, {
  label: string;
  bg: string;
  border: string;
  color: string;
  dot?: string;
  pulse?: boolean;
}> = {
  scheduled: {
    label: "ПО ПЛАНУ",
    bg: "rgba(26,86,168,0.15)",
    border: "rgba(26,86,168,0.4)",
    color: "var(--blue-bright)",
    dot: "var(--blue-bright)",
  },
  boarding: {
    label: "ПОСАДКА",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.45)",
    color: "var(--amber-warn)",
    dot: "var(--amber-warn)",
    pulse: true,
  },
  active: {
    label: "В ПОЛЁТЕ",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.45)",
    color: "var(--green-ok)",
    dot: "var(--green-ok)",
    pulse: true,
  },
  landed: {
    label: "ПРИЗЕМЛИЛСЯ",
    bg: "rgba(6,182,212,0.15)",
    border: "rgba(6,182,212,0.4)",
    color: "var(--cyan-primary)",
    dot: "var(--cyan-primary)",
  },
  completed: {
    label: "ВЫПОЛНЕН",
    bg: "rgba(100,116,139,0.12)",
    border: "rgba(100,116,139,0.3)",
    color: "#94a3b8",
    dot: "#94a3b8",
  },
  delayed: {
    label: "ЗАДЕРЖАН",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
    color: "var(--amber-warn)",
    dot: "var(--amber-warn)",
    pulse: true,
  },
  cancelled: {
    label: "ОТМЕНЁН",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    color: "var(--red-alert)",
    dot: "var(--red-alert)",
  },
  diverted: {
    label: "УХОД НА ЗАП.",
    bg: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.4)",
    color: "#c084fc",
    dot: "#c084fc",
    pulse: true,
  },
};

interface Props {
  status: FlightStatus;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

export function FlightStatusBadge({
  status,
  size = "md",
  showDot = true,
}: Props) {
  const cfg = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-1",
    lg: "text-xs px-2.5 py-1.5",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold rounded-lg",
        sizeClasses
      )}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            cfg.pulse && "animate-pulse"
          )}
          style={{ background: cfg.dot }}
        />
      )}
      {cfg.label}
    </span>
  );
}

export function getStatusConfig(status: FlightStatus) {
  return STATUS_CONFIG[status];
}
