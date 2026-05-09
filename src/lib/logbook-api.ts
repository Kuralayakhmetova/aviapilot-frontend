const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

async function handleResponse(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    console.error("API ERROR:", res.status, text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return text ? JSON.parse(text) : null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json();
      const token = data?.data?.accessToken ?? data?.accessToken ?? null;
      if (token) {
        localStorage.setItem("accessToken", token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function apiFetch(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = getAccessToken();
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 && retry) {
    const ok = await refreshAccessToken();
    if (ok) return apiFetch(url, options, false);
    throw new Error("Сессия истекла. Войдите снова.");
  }
  return res;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LogbookEntryRaw {
  id: string;
  userId: string;

  acType: string;
  acReg: string;

  date: string;
  arrDate?: string | null;
  depIcao: string;
  arrIcao: string;
  depTime: string;
  arrTime: string;

  totalTime: number;
  picTime: number | null;
  sicTime: number | null;
  nightTime: number | null;
  ifrTime: number | null;
  actualImc: number | null;
  simInstrument: number | null;

  leftSeatPerson: string;
  leftSeatPos: string;
  rightSeatPerson: string;
  rightSeatPos: string;

  flightAttendants: string[];
  engineers: string[];
  technicians: string[];
  mechanics: string[];

  exerciseNumber?: string | null;
  maxAltitude?: number | null;
  minAltitude?: number | null;

  cloudiness?: number | null;
  cloudBase?: number | null;
  cloudTop?: number | null;
  visibility?: number | null;

  approachType?: string | null;

  landingsDay: number;
  landingsNight: number;

  passengers?: number | null;
  cargo?: number | null;

  operationType: string;
  role: string;
  rules: string;
  status: string;
  crossCountry: boolean;
  remarks?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateLogbookEntryPayload {
  acType: string;
  acReg: string;

  date: string;
  arrDate?: string;
  depIcao: string;
  arrIcao: string;
  depTime: string;
  arrTime: string;

  totalTime: number;
  picTime?: number;
  sicTime?: number;
  nightTime?: number;
  ifrTime?: number;
  actualImc?: number;
  simInstrument?: number;

  leftSeatPerson: string;
  leftSeatPos: string;
  rightSeatPerson: string;
  rightSeatPos: string;

  flightAttendants?: string[];
  engineers?: string[];
  technicians?: string[];
  mechanics?: string[];

    leftSeatCrewId?:  string;
  rightSeatCrewId?: string;
  attendantIds?:    string[];
  engineerIds?:     string[];
  technicianIds?:   string[];
  
  exerciseNumber?: string;
  maxAltitude?: number | null;
  minAltitude?: number | null;

  cloudiness?: number;
  cloudBase?: number | null;
  cloudTop?: number | null;
  visibility?: number;

  approachType?: string;

  landingsDay?: number;
  landingsNight?: number;

  passengers?: number | null;
  cargo?: number | null;

  operationType: string;
  role: string;
  rules: string;
  status?: string;
  crossCountry?: boolean;
  remarks?: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function apiGetLogbook(): Promise<LogbookEntryRaw[]> {
  const res = await apiFetch("/logbook");
  const data = await handleResponse(res);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.entries)) return data.entries;
  return [];
}

export async function apiCreateLogbookEntry(
  payload: CreateLogbookEntryPayload,
): Promise<LogbookEntryRaw> {
  const res = await apiFetch("/logbook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data?.data ?? data;
}

export async function apiUpdateLogbookEntry(
  id: string,
  payload: Partial<CreateLogbookEntryPayload>,
): Promise<LogbookEntryRaw> {
  const res = await apiFetch(`/logbook/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  return data?.data ?? data;
}

export async function apiDeleteLogbookEntry(id: string): Promise<void> {
  const res = await apiFetch(`/logbook/${id}`, { method: "DELETE" });
  await handleResponse(res);
}
