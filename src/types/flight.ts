export type FlightStatus =
  | "scheduled"
  | "boarding"
  | "active"
  | "landed"
  | "completed"
  | "delayed"
  | "cancelled"
  | "diverted";

export type FlightCategory = "passenger" | "cargo" | "training" | "charter" | "ferry";

export type AircraftType =
  | "B737" | "B738" | "B739"
  | "B772" | "B773" | "B77W"
  | "A320" | "A321" | "A319"
  | "E190" | "CRJ9";

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  elevation: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: "PIC" | "FO" | "SO" | "FA" | "FA2" | "FA3";
  license: string;
  hoursTotal: number;
  photoUrl?: string;
}

export interface FlightWeather {
  dep: {
    icao: string;
    metar: string;
    category: "VFR" | "MVFR" | "IFR" | "LIFR";
    wind: { dir: number; speed: number; gust?: number };
    visibility: number;
    ceiling: number;
    temp: number;
    qnh: number;
  };
  arr: {
    icao: string;
    metar: string;
    category: "VFR" | "MVFR" | "IFR" | "LIFR";
    wind: { dir: number; speed: number; gust?: number };
    visibility: number;
    ceiling: number;
    temp: number;
    qnh: number;
  };
}

export interface Flight {
  id: string;
  flightNumber: string;
  callsign: string;
  category: FlightCategory;
  status: FlightStatus;

  // Route
  departure: Airport;
  arrival: Airport;
  alternate?: Airport;

  // Schedule
  std: string;        // Scheduled Time Departure (UTC)
  sta: string;        // Scheduled Time Arrival (UTC)
  etd?: string;       // Estimated Time Departure
  eta?: string;       // Estimated Time Arrival
  atd?: string;       // Actual Time Departure
  ata?: string;       // Actual Time Arrival
  blockTime: number;  // minutes
  flightTime?: number;// minutes actual

  // Aircraft
  aircraft: AircraftType;
  registration: string;
  totalSeats?: number;
  paxCount?: number;
  cargoWeight?: number;

  // Crew
  crew: CrewMember[];

  // Route details
  route: string;      // ICAO route string
  altitude: number;   // cruise altitude in FL
  distance: number;   // nm
  fuelPlanned: number;// kg
  fuelActual?: number;// kg

  // Weather
  weather?: FlightWeather;

  // Meta
  remarks?: string;
  notams?: string[];
  createdAt: string;
  updatedAt: string;

  // Delay info
  delayCode?: string;
  delayMinutes?: number;
  delayReason?: string;
}

export interface FlightFilters {
  search: string;
  status: FlightStatus | "all";
  category: FlightCategory | "all";
  aircraft: AircraftType | "all";
  dateFrom: string;
  dateTo: string;
  departure: string;
  arrival: string;
}
