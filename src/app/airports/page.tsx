// src/app/airports/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  MapPin,
  Plane,
  Wind,
  Thermometer,
  Eye,
 
  Radio,
  Ruler,
  Navigation,
  Info,
  ExternalLink,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  Star,
  StarOff,
 
  Globe,
  CloudSun,
 
  Waves,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

// Типы
interface Runway {
  id: string;
  designation: string;
  length: number;
  width: number;
  surface: 'asphalt' | 'concrete' | 'grass';
  lighting: boolean;
  ils: boolean;
}

interface Frequency {
  name: string;
  frequency: string;
}

interface Weather {
  metar: string;
  temperature: number;
  dewpoint: number;
  wind: {
    direction: number;
    speed: number;
    gust?: number;
  };
  visibility: number;
  pressure: number;
  ceiling?: number;
  conditions: string;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

interface Airport {
  id: string;
  icao: string;
  iata: string;
  name: string;
  nameEn: string;
  city: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  elevation: number;
  timezone: string;
  type: 'international' | 'domestic' | 'regional' | 'military';
  status: 'operational' | 'closed' | 'restricted';
  runways: Runway[];
  frequencies: Frequency[];
  services: string[];
  weather?: Weather;
  isFavorite: boolean;
  lastUpdated: string;
}

// Мок данные аэропортов Казахстана
const AIRPORTS_DATA: Airport[] = [
  {
    id: '1',
    icao: 'UAAA',
    iata: 'ALA',
    name: 'Международный аэропорт Алматы',
    nameEn: 'Almaty International Airport',
    city: 'Алматы',
    region: 'Алматинская область',
    country: 'Казахстан',
    coordinates: { lat: 43.3521, lng: 77.0405 },
    elevation: 681,
    timezone: 'UTC+5',
    type: 'international',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '05L/23R', length: 4500, width: 45, surface: 'asphalt', lighting: true, ils: true },
      { id: 'R2', designation: '05R/23L', length: 4000, width: 45, surface: 'concrete', lighting: true, ils: true }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.100' },
      { name: 'Ground', frequency: '121.700' },
      { name: 'Approach', frequency: '124.800' },
      { name: 'ATIS', frequency: '127.800' }
    ],
    services: ['Fuel', 'Customs', 'Cargo', 'VIP Lounge', 'Maintenance', 'De-icing', 'Catering'],
    weather: {
      metar: 'UAAA 211000Z 18008KT 9999 FEW040 18/04 Q1018',
      temperature: 18,
      dewpoint: 4,
      wind: { direction: 180, speed: 8 },
      visibility: 9999,
      pressure: 1018,
      ceiling: 4000,
      conditions: 'Малооблачно',
      category: 'VFR'
    },
    isFavorite: true,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '2',
    icao: 'UACC',
    iata: 'NQZ',
    name: 'Международный аэропорт Нурсултан Назарбаев',
    nameEn: 'Nursultan Nazarbayev International Airport',
    city: 'Астана',
    region: 'Акмолинская область',
    country: 'Казахстан',
    coordinates: { lat: 51.0222, lng: 71.4669 },
    elevation: 355,
    timezone: 'UTC+5',
    type: 'international',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '04/22', length: 3500, width: 45, surface: 'concrete', lighting: true, ils: true },
      { id: 'R2', designation: '16/34', length: 3000, width: 45, surface: 'asphalt', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.500' },
      { name: 'Ground', frequency: '121.900' },
      { name: 'Approach', frequency: '125.200' },
      { name: 'ATIS', frequency: '126.400' }
    ],
    services: ['Fuel', 'Customs', 'Cargo', 'VIP Lounge', 'Maintenance', 'De-icing', 'Catering', 'Hotels'],
    weather: {
      metar: 'UACC 211000Z 27012G18KT 8000 SCT030 BKN050 14/02 Q1022',
      temperature: 14,
      dewpoint: 2,
      wind: { direction: 270, speed: 12, gust: 18 },
      visibility: 8000,
      pressure: 1022,
      ceiling: 3000,
      conditions: 'Переменная облачность',
      category: 'MVFR'
    },
    isFavorite: true,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '3',
    icao: 'UAKK',
    iata: 'KGF',
    name: 'Аэропорт Сары-Арка',
    nameEn: 'Sary-Arka Airport',
    city: 'Караганда',
    region: 'Карагандинская область',
    country: 'Казахстан',
    coordinates: { lat: 49.6708, lng: 73.3344 },
    elevation: 546,
    timezone: 'UTC+5',
    type: 'domestic',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '02/20', length: 3200, width: 42, surface: 'concrete', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '119.100' },
      { name: 'Ground', frequency: '121.800' }
    ],
    services: ['Fuel', 'Customs', 'Cargo'],
    weather: {
      metar: 'UAKK 211000Z 32006KT 9999 SKC 16/01 Q1020',
      temperature: 16,
      dewpoint: 1,
      wind: { direction: 320, speed: 6 },
      visibility: 9999,
      pressure: 1020,
      conditions: 'Ясно',
      category: 'VFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '4',
    icao: 'UAOO',
    iata: 'URA',
    name: 'Аэропорт Орал Ак Жол',
    nameEn: 'Oral Ak Zhol Airport',
    city: 'Уральск',
    region: 'Западно-Казахстанская область',
    country: 'Казахстан',
    coordinates: { lat: 51.1508, lng: 51.5431 },
    elevation: 38,
    timezone: 'UTC+5',
    type: 'domestic',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '08/26', length: 2800, width: 40, surface: 'asphalt', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.800' },
      { name: 'Ground', frequency: '121.600' }
    ],
    services: ['Fuel', 'Customs'],
    weather: {
      metar: 'UAOO 211000Z 09010KT 6000 BR SCT015 10/08 Q1015',
      temperature: 10,
      dewpoint: 8,
      wind: { direction: 90, speed: 10 },
      visibility: 6000,
      pressure: 1015,
      ceiling: 1500,
      conditions: 'Дымка',
      category: 'MVFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '5',
    icao: 'UAAH',
    iata: 'CIT',
    name: 'Аэропорт Шымкент',
    nameEn: 'Shymkent Airport',
    city: 'Шымкент',
    region: 'Туркестанская область',
    country: 'Казахстан',
    coordinates: { lat: 42.3642, lng: 69.4789 },
    elevation: 422,
    timezone: 'UTC+5',
    type: 'international',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '12/30', length: 3100, width: 44, surface: 'concrete', lighting: true, ils: true }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.300' },
      { name: 'Ground', frequency: '121.500' },
      { name: 'Approach', frequency: '124.500' }
    ],
    services: ['Fuel', 'Customs', 'Cargo', 'VIP Lounge'],
    weather: {
      metar: 'UAAH 211000Z 22015KT 9999 FEW050 24/08 Q1012',
      temperature: 24,
      dewpoint: 8,
      wind: { direction: 220, speed: 15 },
      visibility: 9999,
      pressure: 1012,
      conditions: 'Малооблачно',
      category: 'VFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '6',
    icao: 'UACP',
    iata: 'PWQ',
    name: 'Аэропорт Павлодар',
    nameEn: 'Pavlodar Airport',
    city: 'Павлодар',
    region: 'Павлодарская область',
    country: 'Казахстан',
    coordinates: { lat: 52.1950, lng: 77.0739 },
    elevation: 122,
    timezone: 'UTC+5',
    type: 'domestic',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '07/25', length: 2500, width: 38, surface: 'concrete', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.600' },
      { name: 'Ground', frequency: '121.700' }
    ],
    services: ['Fuel'],
    isFavorite: false,
    lastUpdated: '2026-04-21T09:30:00Z'
  },
  {
    id: '7',
    icao: 'UATT',
    iata: 'GUW',
    name: 'Международный аэропорт Атырау',
    nameEn: 'Atyrau International Airport',
    city: 'Атырау',
    region: 'Атырауская область',
    country: 'Казахстан',
    coordinates: { lat: 46.8933, lng: 51.8214 },
    elevation: -22,
    timezone: 'UTC+5',
    type: 'international',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '13/31', length: 3048, width: 45, surface: 'asphalt', lighting: true, ils: true }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.200' },
      { name: 'Ground', frequency: '121.900' },
      { name: 'Approach', frequency: '125.600' }
    ],
    services: ['Fuel', 'Customs', 'Cargo', 'VIP Lounge', 'Maintenance'],
    weather: {
      metar: 'UATT 211000Z 36008KT 3000 HZ FEW020 22/12 Q1010',
      temperature: 22,
      dewpoint: 12,
      wind: { direction: 360, speed: 8 },
      visibility: 3000,
      pressure: 1010,
      ceiling: 2000,
      conditions: 'Дымка',
      category: 'IFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '8',
    icao: 'UAUU',
    iata: 'PLX',
    name: 'Аэропорт Семей',
    nameEn: 'Semey Airport',
    city: 'Семей',
    region: 'Область Абай',
    country: 'Казахстан',
    coordinates: { lat: 50.3513, lng: 80.2344 },
    elevation: 195,
    timezone: 'UTC+5',
    type: 'domestic',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '05/23', length: 2600, width: 40, surface: 'concrete', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.400' }
    ],
    services: ['Fuel'],
    isFavorite: false,
    lastUpdated: '2026-04-21T09:00:00Z'
  },
  {
    id: '9',
    icao: 'UACK',
    iata: 'KSN',
    name: 'Аэропорт Костанай',
    nameEn: 'Kostanay Airport',
    city: 'Костанай',
    region: 'Костанайская область',
    country: 'Казахстан',
    coordinates: { lat: 53.2069, lng: 63.5503 },
    elevation: 170,
    timezone: 'UTC+5',
    type: 'domestic',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '09/27', length: 2800, width: 42, surface: 'asphalt', lighting: true, ils: false }
    ],
    frequencies: [
      { name: 'Tower', frequency: '119.200' },
      { name: 'Ground', frequency: '121.800' }
    ],
    services: ['Fuel', 'Customs'],
    weather: {
      metar: 'UACK 211000Z 25005KT CAVOK 12/00 Q1024',
      temperature: 12,
      dewpoint: 0,
      wind: { direction: 250, speed: 5 },
      visibility: 9999,
      pressure: 1024,
      conditions: 'CAVOK',
      category: 'VFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  },
  {
    id: '10',
    icao: 'UAAA',
    iata: 'SCO',
    name: 'Международный аэропорт Актау',
    nameEn: 'Aktau International Airport',
    city: 'Актау',
    region: 'Мангистауская область',
    country: 'Казахстан',
    coordinates: { lat: 43.8601, lng: 51.0919 },
    elevation: 22,
    timezone: 'UTC+5',
    type: 'international',
    status: 'operational',
    runways: [
      { id: 'R1', designation: '12/30', length: 3000, width: 45, surface: 'concrete', lighting: true, ils: true }
    ],
    frequencies: [
      { name: 'Tower', frequency: '118.700' },
      { name: 'Ground', frequency: '121.600' },
      { name: 'Approach', frequency: '125.100' }
    ],
    services: ['Fuel', 'Customs', 'Cargo', 'VIP Lounge'],
    weather: {
      metar: 'UATE 211000Z 28018G25KT 9999 FEW030 20/06 Q1016',
      temperature: 20,
      dewpoint: 6,
      wind: { direction: 280, speed: 18, gust: 25 },
      visibility: 9999,
      pressure: 1016,
      conditions: 'Малооблачно, порывистый ветер',
      category: 'VFR'
    },
    isFavorite: false,
    lastUpdated: '2026-04-21T10:00:00Z'
  }
];

// Компонент категории погоды
const WeatherCategory: React.FC<{ category: Weather['category'] }> = ({ category }) => {
  const config = {
    VFR: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'VFR' },
    MVFR: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'MVFR' },
    IFR: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'IFR' },
    LIFR: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'LIFR' }
  };
  
  const cfg = config[category];
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};

// Компонент статуса аэропорта
const StatusBadge: React.FC<{ status: Airport['status'] }> = ({ status }) => {
  const config = {
    operational: { icon: CheckCircle, color: 'text-green-400', label: 'Работает' },
    closed: { icon: XCircle, color: 'text-red-400', label: 'Закрыт' },
    restricted: { icon: AlertTriangle, color: 'text-amber-400', label: 'Ограничен' }
  };
  
  const cfg = config[status];
  const Icon = cfg.icon;
  
  return (
    <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// Компонент типа аэропорта
const TypeBadge: React.FC<{ type: Airport['type'] }> = ({ type }) => {
  const config = {
    international: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Международный' },
    domestic: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Внутренний' },
    regional: { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Региональный' },
    military: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Военный' }
  };
  
  const cfg = config[type];
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};

// Компонент карточки аэропорта (Grid View)
const AirportCard: React.FC<{
  airport: Airport;
  onSelect: (airport: Airport) => void;
  onToggleFavorite: (id: string) => void;
}> = ({ airport, onSelect, onToggleFavorite }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all cursor-pointer group"
      onClick={() => onSelect(airport)}
    >
      {/* Header с ICAO/IATA */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 p-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-white">{airport.icao}</span>
              <span className="text-sm text-slate-400">/ {airport.iata}</span>
            </div>
            <TypeBadge type={airport.type} />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={airport.status} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(airport.id);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {airport.isFavorite ? (
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              ) : (
                <StarOff className="w-5 h-5 text-slate-500 hover:text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Основная информация */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 line-clamp-1">{airport.name}</h3>
        <p className="text-sm text-slate-400 mb-3 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {airport.city}
        </p>
        
        {/* Погода */}
        {airport.weather && (
          <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase">Погода</span>
              <WeatherCategory category={airport.weather.category} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Thermometer className="w-3 h-3" />
                </div>
                <div className="text-white font-medium">{airport.weather.temperature}°C</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Wind className="w-3 h-3" />
                </div>
                <div className="text-white font-medium">
                  {airport.weather.wind.speed}kt
                  {airport.weather.wind.gust && (
                    <span className="text-amber-400">G{airport.weather.wind.gust}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-slate-400">
                  <Eye className="w-3 h-3" />
                </div>
                <div className="text-white font-medium">
                  {airport.weather.visibility >= 9999 ? '10+' : (airport.weather.visibility / 1000).toFixed(1)}km
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ВПП */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <Ruler className="w-4 h-4" />
          <span>ВПП: {airport.runways.map(r => r.designation).join(', ')}</span>
        </div>
        
        {/* Сервисы */}
        <div className="flex flex-wrap gap-1">
          {airport.services.slice(0, 3).map((service, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
              {service}
            </span>
          ))}
          {airport.services.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-500">
              +{airport.services.length - 3}
            </span>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between bg-slate-800/30">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {airport.coordinates.lat.toFixed(2)}°, {airport.coordinates.lng.toFixed(2)}°
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
      </div>
    </motion.div>
  );
};

// Компонент строки аэропорта (List View)
const AirportRow: React.FC<{
  airport: Airport;
  onSelect: (airport: Airport) => void;
  onToggleFavorite: (id: string) => void;
}> = ({ airport, onSelect, onToggleFavorite }) => {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-slate-800/50 cursor-pointer group"
      onClick={() => onSelect(airport)}
    >
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(airport.id);
          }}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          {airport.isFavorite ? (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          ) : (
            <StarOff className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{airport.icao}</span>
          <span className="text-slate-500">/</span>
          <span className="text-cyan-400">{airport.iata}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <div className="text-white text-sm font-medium line-clamp-1">{airport.name}</div>
          <div className="text-xs text-slate-500">{airport.city}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <TypeBadge type={airport.type} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={airport.status} />
      </td>
      <td className="px-4 py-3">
        {airport.weather ? (
          <div className="flex items-center gap-3">
            <WeatherCategory category={airport.weather.category} />
            <span className="text-white">{airport.weather.temperature}°C</span>
            <span className="text-slate-400 text-sm">
              {airport.weather.wind.direction}°/{airport.weather.wind.speed}kt
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-400 text-sm">
        {airport.runways[0]?.designation}
        {airport.runways.length > 1 && ` +${airport.runways.length - 1}`}
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
      </td>
    </motion.tr>
  );
};

// Модальное окно детальной информации
const AirportDetailModal: React.FC<{
  airport: Airport | null;
  onClose: () => void;
}> = ({ airport, onClose }) => {
  if (!airport) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 p-6 border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-8 h-8 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-white">{airport.icao}</span>
                      <span className="text-xl text-slate-400">/ {airport.iata}</span>
                    </div>
                    <TypeBadge type={airport.type} />
                  </div>
                </div>
                <h2 className="text-xl text-white">{airport.name}</h2>
                <p className="text-slate-400">{airport.nameEn}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Основная информация */}
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Общая информация
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Город:</span>
                      <span className="text-white">{airport.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Регион:</span>
                      <span className="text-white">{airport.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Высота:</span>
                      <span className="text-white">{airport.elevation} м</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Часовой пояс:</span>
                      <span className="text-white">{airport.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Координаты:</span>
                      <span className="text-white font-mono text-sm">
                        {airport.coordinates.lat.toFixed(4)}°N, {airport.coordinates.lng.toFixed(4)}°E
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Статус:</span>
                      <StatusBadge status={airport.status} />
                    </div>
                  </div>
                </div>
                
                {/* ВПП */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Взлётно-посадочные полосы
                  </h3>
                  <div className="space-y-3">
                    {airport.runways.map((runway) => (
                      <div key={runway.id} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-cyan-400">{runway.designation}</span>
                          <div className="flex gap-2">
                            {runway.ils && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">ILS</span>
                            )}
                            {runway.lighting && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">LIGHTS</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-slate-500 block">Длина</span>
                            <span className="text-white">{runway.length} м</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Ширина</span>
                            <span className="text-white">{runway.width} м</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Покрытие</span>
                            <span className="text-white capitalize">{runway.surface}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Частоты */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Радиочастоты
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {airport.frequencies.map((freq, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded-lg p-2">
                        <span className="text-xs text-slate-500 block">{freq.name}</span>
                        <span className="text-cyan-400 font-mono">{freq.frequency} MHz</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Погода и сервисы */}
              <div className="space-y-4">
                {/* Погода */}
                {airport.weather && (
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                      <CloudSun className="w-4 h-4" />
                      Текущая погода (METAR)
                      <WeatherCategory category={airport.weather.category} />
                    </h3>
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                      <code className="text-xs text-cyan-300 font-mono break-all">
                        {airport.weather.metar}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-white">{airport.weather.temperature}°C</div>
                        <div className="text-xs text-slate-500">Точка росы: {airport.weather.dewpoint}°C</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <Wind className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-white">
                          {airport.weather.wind.speed}
                          {airport.weather.wind.gust && (
                            <span className="text-amber-400">G{airport.weather.wind.gust}</span>
                          )}
                          <span className="text-sm ml-1">kt</span>
                        </div>
                        <div className="text-xs text-slate-500">Направление: {airport.weather.wind.direction}°</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <Eye className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-white">
                          {airport.weather.visibility >= 9999 ? '10+' : (airport.weather.visibility / 1000).toFixed(1)}
                          <span className="text-sm ml-1">км</span>
                        </div>
                        <div className="text-xs text-slate-500">Видимость</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <Waves className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                        <div className="text-2xl font-bold text-white">{airport.weather.pressure}</div>
                        <div className="text-xs text-slate-500">QNH (гПа)</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center text-slate-400 text-sm">
                      {airport.weather.conditions}
                    </div>
                  </div>
                )}
                
                {/* Сервисы */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Доступные сервисы
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {airport.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Быстрые действия */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">
                    Быстрые действия
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
                      <Plane className="w-4 h-4" />
                      Планировать рейс
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      <Navigation className="w-4 h-4" />
                      Открыть на карте
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      <RefreshCw className="w-4 h-4" />
                      Обновить погоду
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      Подробнее
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Главный компонент страницы
export default function AirportsPage() {
  const [airports, setAirports] = useState<Airport[]>(AIRPORTS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | Airport['type'],
    status: 'all' as 'all' | Airport['status'],
    weatherCategory: 'all' as 'all' | Weather['category'],
    showFavoritesOnly: false
  });
  const [sortBy, setSortBy] = useState<'name' | 'icao' | 'city'>('icao');

  // Фильтрация и поиск
  const filteredAirports = useMemo(() => {
    return airports
      .filter((airport) => {
        // Поиск
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          airport.icao.toLowerCase().includes(searchLower) ||
          airport.iata.toLowerCase().includes(searchLower) ||
          airport.name.toLowerCase().includes(searchLower) ||
          airport.city.toLowerCase().includes(searchLower);
        
        // Фильтры
        const matchesType = filters.type === 'all' || airport.type === filters.type;
        const matchesStatus = filters.status === 'all' || airport.status === filters.status;
        const matchesWeather = filters.weatherCategory === 'all' || airport.weather?.category === filters.weatherCategory;
        const matchesFavorites = !filters.showFavoritesOnly || airport.isFavorite;
        
        return matchesSearch && matchesType && matchesStatus && matchesWeather && matchesFavorites;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'city':
            return a.city.localeCompare(b.city);
          case 'icao':
          default:
            return a.icao.localeCompare(b.icao);
        }
      });
  }, [airports, searchQuery, filters, sortBy]);

  const toggleFavorite = (id: string) => {
    setAirports((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFavorite: !a.isFavorite } : a))
    );
  };

  // Статистика
  const stats = {
    total: airports.length,
    international: airports.filter((a) => a.type === 'international').length,
    vfr: airports.filter((a) => a.weather?.category === 'VFR').length,
    favorites: airports.filter((a) => a.isFavorite).length
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Аэропорты</h1>
              <p className="text-slate-400 text-sm">База данных аэропортов Казахстана</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Обновить данные
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Building2 className="w-4 h-4" />
            Всего аэропортов
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Globe className="w-4 h-4" />
            Международные
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.international}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <CloudSun className="w-4 h-4" />
            VFR условия
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.vfr}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Star className="w-4 h-4" />
            Избранные
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.favorites}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по ICAO, IATA, названию или городу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as typeof filters.type })}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Все типы</option>
              <option value="international">Международные</option>
              <option value="domestic">Внутренние</option>
              <option value="regional">Региональные</option>
            </select>
            
            <select
              value={filters.weatherCategory}
              onChange={(e) => setFilters({ ...filters, weatherCategory: e.target.value as typeof filters.weatherCategory })}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Любая погода</option>
              <option value="VFR">VFR</option>
              <option value="MVFR">MVFR</option>
              <option value="IFR">IFR</option>
              <option value="LIFR">LIFR</option>
            </select>
            
            <button
              onClick={() => setFilters({ ...filters, showFavoritesOnly: !filters.showFavoritesOnly })}
              className={`px-3 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                filters.showFavoritesOnly
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Star className="w-4 h-4" />
              Избранные
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="icao">Сортировка: ICAO</option>
              <option value="name">Сортировка: Название</option>
              <option value="city">Сортировка: Город</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active filters */}
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Найдено: {filteredAirports.length} аэропортов</span>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAirports.map((airport) => (
            <AirportCard
              key={airport.id}
              airport={airport}
              onSelect={setSelectedAirport}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr className="text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">ICAO/IATA</th>
                <th className="px-4 py-3">Название</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Погода</th>
                <th className="px-4 py-3">ВПП</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredAirports.map((airport) => (
                <AirportRow
                  key={airport.id}
                  airport={airport}
                  onSelect={setSelectedAirport}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredAirports.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Аэропорты не найдены</h3>
          <p className="text-slate-400">Попробуйте изменить параметры поиска или фильтры</p>
        </div>
      )}

      {/* Detail Modal */}
      <AirportDetailModal
        airport={selectedAirport}
        onClose={() => setSelectedAirport(null)}
      />
    </div>
  );
}
