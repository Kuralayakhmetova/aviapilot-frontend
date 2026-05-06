// src/app/map/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Map,
  Plane,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  Locate,
  Filter,
  RefreshCw,
  
} from "lucide-react";

// Моковые данные аэропортов Казахстана
const AIRPORTS = [
  { id: "UAAA", name: "Алматы", city: "Алматы", lat: 43.3521, lng: 77.0405, type: "international" },
  { id: "UACC", name: "Нурсултан Назарбаев", city: "Астана", lat: 51.0222, lng: 71.4669, type: "international" },
  { id: "UAKK", name: "Шымкент", city: "Шымкент", lat: 42.3642, lng: 69.4789, type: "international" },
  { id: "UAOO", name: "Караганда", city: "Караганда", lat: 49.6708, lng: 73.3344, type: "domestic" },
  { id: "UATE", name: "Актау", city: "Актау", lat: 43.8601, lng: 51.0919, type: "international" },
  { id: "UATT", name: "Атырау", city: "Атырау", lat: 46.8583, lng: 51.8214, type: "international" },
  { id: "UASP", name: "Петропавловск", city: "Петропавловск", lat: 54.7747, lng: 69.1839, type: "domestic" },
  { id: "UASK", name: "Костанай", city: "Костанай", lat: 53.2069, lng: 63.5503, type: "domestic" },
];

// Моковые активные рейсы
const ACTIVE_FLIGHTS = [
  {
    id: "KC101",
    from: "UAAA",
    to: "UACC",
    aircraft: "A320",
    altitude: 35000,
    speed: 450,
    progress: 0.6,
    status: "airborne",
  },
  {
    id: "KC205",
    from: "UACC",
    to: "UAKK",
    aircraft: "B737",
    altitude: 33000,
    speed: 440,
    progress: 0.3,
    status: "airborne",
  },
  {
    id: "KC312",
    from: "UATE",
    to: "UAAA",
    aircraft: "E190",
    altitude: 31000,
    speed: 420,
    progress: 0.75,
    status: "airborne",
  },
];

// Конвертация координат в проценты на SVG карте
function coordsToPercent(lat: number, lng: number) {
  // Границы Казахстана приблизительно
  const minLat = 40;
  const maxLat = 56;
  const minLng = 46;
  const maxLng = 88;

  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

// Интерполяция позиции самолета
function getFlightPosition(flight: typeof ACTIVE_FLIGHTS[0]) {
  const fromAirport = AIRPORTS.find((a) => a.id === flight.from);
  const toAirport = AIRPORTS.find((a) => a.id === flight.to);
  if (!fromAirport || !toAirport) return null;

  const lat = fromAirport.lat + (toAirport.lat - fromAirport.lat) * flight.progress;
  const lng = fromAirport.lng + (toAirport.lng - fromAirport.lng) * flight.progress;

  // Вычисляем направление
  const bearing = Math.atan2(
    toAirport.lng - fromAirport.lng,
    toAirport.lat - fromAirport.lat
  ) * (180 / Math.PI);

  return { lat, lng, bearing };
}

// Статистика панель
function StatsPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 left-4 z-50 p-4 rounded-xl"
      style={{
        background: "rgba(4,14,30,0.9)",
        border: "1px solid rgba(26,86,168,0.3)",
        backdropFilter: "blur(12px)",
        minWidth: "200px",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Map size={16} style={{ color: "var(--cyan-primary)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Обзор карты
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Аэропортов</span>
          <span className="text-sm font-mono font-bold" style={{ color: "var(--blue-bright)" }}>
            {AIRPORTS.length}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>В воздухе</span>
          <span className="text-sm font-mono font-bold" style={{ color: "var(--green-ok)" }}>
            {ACTIVE_FLIGHTS.length}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Маршрутов</span>
          <span className="text-sm font-mono font-bold" style={{ color: "var(--amber-warn)" }}>
            {ACTIVE_FLIGHTS.length}
          </span>
        </div>
      </div>

      {/* Live indicator */}
      <div
        className="mt-3 pt-3 flex items-center gap-2"
        style={{ borderTop: "1px solid rgba(26,86,168,0.2)" }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--green-ok)" }}
        />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--green-ok)" }}>
          Live Tracking
        </span>
      </div>
    </motion.div>
  );
}

// Панель активных рейсов
function FlightsPanel({ selectedFlight, onSelectFlight }: { 
  selectedFlight: string | null; 
  onSelectFlight: (id: string | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-20 right-4 z-50 p-4 rounded-xl"
      style={{
        background: "rgba(4,14,30,0.9)",
        border: "1px solid rgba(26,86,168,0.3)",
        backdropFilter: "blur(12px)",
        minWidth: "280px",
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane size={16} style={{ color: "var(--cyan-primary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Активные рейсы
          </span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-mono"
          style={{
            background: "rgba(16,185,129,0.15)",
            color: "var(--green-ok)",
          }}
        >
          {ACTIVE_FLIGHTS.length}
        </span>
      </div>

      <div className="space-y-2">
        {ACTIVE_FLIGHTS.map((flight) => {
          const fromAirport = AIRPORTS.find((a) => a.id === flight.from);
          const toAirport = AIRPORTS.find((a) => a.id === flight.to);
          const isSelected = selectedFlight === flight.id;

          return (
            <motion.div
              key={flight.id}
              className="p-3 rounded-lg transition-all duration-200 cursor-pointer"
              style={{
                background: isSelected ? "rgba(26,86,168,0.25)" : "rgba(26,86,168,0.1)",
                border: `1px solid ${isSelected ? "var(--cyan-primary)" : "rgba(26,86,168,0.2)"}`,
              }}
              onClick={() => onSelectFlight(isSelected ? null : flight.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm" style={{ color: "var(--cyan-primary)" }}>
                  {flight.id}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full uppercase"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "var(--green-ok)",
                  }}
                >
                  {flight.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs mb-2">
                <span style={{ color: "var(--text-secondary)" }}>{fromAirport?.city}</span>
                <Navigation size={10} style={{ color: "var(--text-muted)" }} />
                <span style={{ color: "var(--text-secondary)" }}>{toAirport?.city}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(26,86,168,0.2)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${flight.progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--blue-bright), var(--cyan-primary))",
                  }}
                />
              </div>

              <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span>FL{Math.round(flight.altitude / 100)}</span>
                <span>{flight.speed} kt</span>
                <span>{flight.aircraft}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// SVG Карта
function SVGMap({ selectedFlight, onSelectFlight }: { 
  selectedFlight: string | null; 
  onSelectFlight: (id: string | null) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* SVG Карта */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          transform: `scale(${zoom})`,
          transition: "transform 0.3s ease",
        }}
      >
        {/* Фон с сеткой */}
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path
              d="M 5 0 L 0 0 0 5"
              fill="none"
              stroke="rgba(26,86,168,0.1)"
              strokeWidth="0.1"
            />
          </pattern>
          
          {/* Градиент для маршрутов */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--blue-bright)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--cyan-primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--blue-bright)" stopOpacity="0.3" />
          </linearGradient>

          {/* Glow эффект */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100" height="100" fill="url(#grid)" />

        {/* Контур Казахстана (упрощённый) */}
        <path
          d="M 15 35 Q 20 25 35 20 Q 50 15 65 18 Q 80 22 85 35 Q 88 50 80 65 Q 70 75 55 78 Q 40 80 25 70 Q 15 60 12 45 Q 12 38 15 35"
          fill="rgba(26,86,168,0.05)"
          stroke="rgba(26,86,168,0.2)"
          strokeWidth="0.3"
        />

        {/* Маршруты полётов */}
        {ACTIVE_FLIGHTS.map((flight) => {
          const fromAirport = AIRPORTS.find((a) => a.id === flight.from);
          const toAirport = AIRPORTS.find((a) => a.id === flight.to);
          if (!fromAirport || !toAirport) return null;

          const from = coordsToPercent(fromAirport.lat, fromAirport.lng);
          const to = coordsToPercent(toAirport.lat, toAirport.lng);
          const isSelected = selectedFlight === flight.id;

          return (
            <g key={`route-${flight.id}`}>
              {/* Линия маршрута */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isSelected ? "var(--cyan-primary)" : "rgba(26,86,168,0.4)"}
                strokeWidth={isSelected ? "0.4" : "0.2"}
                strokeDasharray={isSelected ? "none" : "1,1"}
                filter={isSelected ? "url(#glow)" : "none"}
              />
            </g>
          );
        })}

        {/* Аэропорты */}
        {AIRPORTS.map((airport) => {
          const pos = coordsToPercent(airport.lat, airport.lng);
          const isHovered = hoveredAirport === airport.id;
          const isInternational = airport.type === "international";

          return (
            <g
              key={airport.id}
              onMouseEnter={() => setHoveredAirport(airport.id)}
              onMouseLeave={() => setHoveredAirport(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Внешний круг */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 2 : 1.5}
                fill={isInternational ? "rgba(26,86,168,0.3)" : "rgba(26,86,168,0.15)"}
                stroke={isInternational ? "var(--cyan-primary)" : "var(--blue-bright)"}
                strokeWidth="0.2"
                filter={isHovered ? "url(#glow)" : "none"}
              />

              {/* Внутренний круг */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="0.5"
                fill={isInternational ? "var(--cyan-primary)" : "var(--blue-bright)"}
              />

              {/* Название при наведении */}
              {isHovered && (
                <g>
                  <rect
                    x={pos.x + 2}
                    y={pos.y - 3}
                    width={airport.city.length * 1.2 + 2}
                    height="4"
                    rx="0.5"
                    fill="rgba(4,14,30,0.95)"
                    stroke="rgba(26,86,168,0.3)"
                    strokeWidth="0.1"
                  />
                  <text
                    x={pos.x + 3}
                    y={pos.y - 0.5}
                    fontSize="2"
                    fill="var(--text-primary)"
                  >
                    {airport.city}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Самолёты */}
        {ACTIVE_FLIGHTS.map((flight) => {
          const position = getFlightPosition(flight);
          if (!position) return null;

          const pos = coordsToPercent(position.lat, position.lng);
          const isSelected = selectedFlight === flight.id;

          return (
            <g
              key={`plane-${flight.id}`}
              onClick={() => onSelectFlight(isSelected ? null : flight.id)}
              style={{ cursor: "pointer" }}
            >
              {/* Пульсирующий круг */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r="2"
                fill="none"
                stroke="var(--cyan-primary)"
                strokeWidth="0.1"
                animate={{
                  r: [1, 2.5, 1],
                  opacity: [0.8, 0, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />

              {/* Иконка самолёта */}
              <g transform={`translate(${pos.x}, ${pos.y}) rotate(${position.bearing - 90})`}>
                <path
                  d="M 0 -1 L 0.8 0.8 L 0 0.4 L -0.8 0.8 Z"
                  fill={isSelected ? "var(--cyan-primary)" : "var(--green-ok)"}
                  filter="url(#glow)"
                />
              </g>

              {/* Номер рейса */}
              <text
                x={pos.x + 2}
                y={pos.y + 0.5}
                fontSize="1.5"
                fill="var(--cyan-primary)"
                fontWeight="bold"
              >
                {flight.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-4 z-50 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: "rgba(4,14,30,0.9)",
            border: "1px solid rgba(26,86,168,0.3)",
            color: "var(--text-secondary)",
          }}
          title="Приблизить"
        >
          <ZoomIn size={18} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.6))}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: "rgba(4,14,30,0.9)",
            border: "1px solid rgba(26,86,168,0.3)",
            color: "var(--text-secondary)",
          }}
          title="Отдалить"
        >
          <ZoomOut size={18} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(1)}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background: "rgba(4,14,30,0.9)",
            border: "1px solid rgba(26,86,168,0.3)",
            color: "var(--text-secondary)",
          }}
          title="Сбросить"
        >
          <Locate size={18} />
        </motion.button>
      </div>
    </div>
  );
}

// Основной компонент страницы
export default function MapPage() {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw size={24} style={{ color: "var(--cyan-primary)" }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden rounded-xl" style={{ background: "var(--bg-primary)" }}>
      {/* Заголовок страницы */}
      <div
        className="absolute top-0 left-0 right-0 z-50 px-6 py-4"
        style={{
          background: "linear-gradient(180deg, rgba(4,14,30,0.95) 0%, rgba(4,14,30,0) 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--blue-primary), var(--blue-bright))",
                boxShadow: "0 0 20px rgba(26,86,168,0.4)",
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Map size={20} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                Карта полётов
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Отслеживание в реальном времени
              </p>
            </div>
          </div>

          {/* Контролы */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(26,86,168,0.15)",
                border: "1px solid rgba(26,86,168,0.3)",
                color: "var(--text-secondary)",
              }}
              title="Фильтры"
            >
              <Filter size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(26,86,168,0.15)",
                border: "1px solid rgba(26,86,168,0.3)",
                color: "var(--text-secondary)",
              }}
              title="Слои"
            >
              <Layers size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "var(--green-ok)",
              }}
              title="Обновить"
            >
              <RefreshCw size={16} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Карта */}
      <SVGMap selectedFlight={selectedFlight} onSelectFlight={setSelectedFlight} />

      {/* Панели */}
      <StatsPanel />
      <FlightsPanel selectedFlight={selectedFlight} onSelectFlight={setSelectedFlight} />

      {/* Легенда */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 z-50 p-3 rounded-xl flex items-center gap-4"
        style={{
          background: "rgba(4,14,30,0.9)",
          border: "1px solid rgba(26,86,168,0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--cyan-primary)" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Международный</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: "var(--blue-bright)" }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Внутренний</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ 
            background: "var(--green-ok)",
            clipPath: "polygon(50% 0%, 100% 100%, 50% 70%, 0% 100%)",
          }} />
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Самолёт</span>
        </div>
      </motion.div>
    </div>
  );
}
