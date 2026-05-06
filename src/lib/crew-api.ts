// lib/crew-api.ts
import api from "@/lib/api";
import axios from "axios";
import { getAccessToken } from "@/lib/api";

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────
export type CrewCategory =
  | "COMMANDER"
  | "SECOND_PILOT"
  | "INSTRUCTOR"
  | "ENGINEER"
  | "TECHNICIAN"
  | "MECHANIC"
  | "FLIGHT_ATTENDANT";

export type CrewPosition =
  | "COMMANDER"
  | "SECOND_PILOT"
  | "INSTRUCTOR"
  | "ENGINEER"
  | "TECHNICIAN"
  | "MECHANIC"
  | "FLIGHT_ATTENDANT";

export type RANKS =
  | "Лейтенант"
  | "Старший лейтенант"
  | "Капитан"
  | "Майор"
  | "Подполковник"
  | "Полковник";

export type CrewStatus = "active" | "inactive" | "on_leave";

export type SortField =
  | "firstName"
  | "lastName"
  | "category"
  | "position"
  | "totalFlightHours"
  | "hireDate";

// ─────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────
export interface CrewMember {
  id: string;
  category: CrewCategory;
  position: string;
  rank: RANKS;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  address?: string;
  photo?: string;

  licenseNumber?: string;
  licenseType?: "ATPL-A" | "CPL-A" | "PPL-A" | "FE" | "CC" | "AM";
  licenseExpiry?: string;
  medicalCert?: string;
  medicalExpiry?: string;
  medicalClass?: 1 | 2 | 3;

  education?: string;
  graduationYear?: number;

  acTypePrimary?: string;
  acTypeSecondary?: string;
  acClass?: "1" | "2" | "3";

  totalFlightHours: number;
  totalHoursPrimary: number;
  totalHoursYear: number;
  totalPicHours: number;
  totalSicHours: number;
  totalNightHours: number;
  totalIfrHours: number;
  totalLandings: number;

  checkRideDate?: string;
  simCheckDate?: string;
  lineCheckDate?: string;
  profCheckDate?: string;

  allowNight: boolean;
  allowImc: boolean;
  allowSmu: boolean;
  allowUmp: boolean;
  allowMountain: boolean;
  allowSeaplane: boolean;
  allowCargo: boolean;
  allowDangerous: boolean;
  allowInstructor: boolean;
  allowExaminer: boolean;

  isActive: boolean;
  hireDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────
export interface CrewFilters {
  search?: string;
  category?: CrewCategory;
  status?: "active" | "inactive";
  allowNight?: boolean;
  allowImc?: boolean;
}

// ─────────────────────────────────────────────
// ПАГИНИРОВАННЫЙ ОТВЕТ (если сервер оборачивает)
// ─────────────────────────────────────────────
interface PaginatedResponse<T> {
  data:  T[];
  items?: T[];
  total?: number;
  page?:  number;
  limit?: number;
}

// ─────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────
export const CATEGORY_LABELS: Record<CrewCategory, string> = {
  COMMANDER:        "Командир ВС",
  SECOND_PILOT:     "Второй пилот",
  INSTRUCTOR:       "Инструктор",
  ENGINEER:         "Бортинженер",
  TECHNICIAN:       "Бортовой техник",
  MECHANIC:         "Бортмеханик",
  FLIGHT_ATTENDANT: "Бортпроводник",
};

export const CATEGORY_SHORT: Record<CrewCategory, string> = {
  COMMANDER:        "КВС",
  SECOND_PILOT:     "ВП",
  INSTRUCTOR:       "ЛИ",
  ENGINEER:         "БИ",
  TECHNICIAN:       "БТ",
  MECHANIC:         "БМ",
  FLIGHT_ATTENDANT: "БП",
};

// ─────────────────────────────────────────────
// ERROR HELPER
// ─────────────────────────────────────────────
export interface ApiValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
  details?: ApiValidationError[];
}

export function extractApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : "Неизвестная ошибка";
  }

  const data    = err.response?.data as ApiErrorResponse | undefined;
  const status  = err.response?.status;

  console.error("─── API Error ───────────────────────────");
  console.error("Status  :", status);
  console.error("URL     :", err.config?.url);
  console.error("Method  :", err.config?.method?.toUpperCase());
  console.error("Payload :", err.config?.data);
  console.error("Response:", JSON.stringify(data, null, 2));
  console.error("─────────────────────────────────────────");

  if (!data) return `HTTP ${status ?? "?"} — нет ответа от сервера`;
  if (Array.isArray(data.message)) return data.message.join(" | ");
  return data.message ?? `HTTP ${status}`;
}

// ─────────────────────────────────────────────
// NORMALIZE — вытаскивает массив из любого
// формата ответа сервера
// ─────────────────────────────────────────────
function normalizeArrayResponse<T>(raw: unknown): T[] {
  // Прямой массив
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // { data: [...] }
    if (Array.isArray(obj["data"]))  return obj["data"]  as T[];
    // { items: [...] }
    if (Array.isArray(obj["items"])) return obj["items"] as T[];
    // { members: [...] }
    if (Array.isArray(obj["members"])) return obj["members"] as T[];
    // { crew: [...] }
    if (Array.isArray(obj["crew"])) return obj["crew"] as T[];
  }

  console.warn("⚠️ normalizeArrayResponse: неожиданный формат ответа", raw);
  return [];
}

// ─────────────────────────────────────────────
// SANITIZE — убираем пустые строки / undefined
// ─────────────────────────────────────────────
function sanitizePayload(data: Partial<CrewMember>): Partial<CrewMember> {
  const result: Partial<CrewMember> = {};

  for (const key of Object.keys(data) as (keyof CrewMember)[]) {
    const value = data[key];
    if (value === undefined) continue;
    if (value === "") continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (result as any)[key] = value;
  }

  return result;
}

// ─────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────
export async function apiFetchCrewMembers(
  filters?: CrewFilters,
  sortBy: SortField = "lastName",
  sortOrder: "asc" | "desc" = "asc"
): Promise<CrewMember[]> {
  const params = new URLSearchParams();

  if (filters?.search)   params.append("search",   filters.search);
  if (filters?.category) params.append("category", filters.category);

  if (filters?.status === "active")   params.append("isActive", "true");
  if (filters?.status === "inactive") params.append("isActive", "false");

  if (filters?.allowNight !== undefined)
    params.append("allowNight", String(filters.allowNight));
  if (filters?.allowImc !== undefined)
    params.append("allowImc", String(filters.allowImc));

  params.append("sortBy",    sortBy);
  params.append("sortOrder", sortOrder);

  try {
    const response = await api.get<
      CrewMember[] | PaginatedResponse<CrewMember>
    >(`/crew?${params.toString()}`);

    // ← Логируем реальный ответ сервера для диагностики
    console.log(
      "📥 GET /crew raw response.data:",
      JSON.stringify(response.data, null, 2).slice(0, 500)
    );

    return normalizeArrayResponse<CrewMember>(response.data);

  } catch (err) {
    // Пробрасываем с понятным сообщением
    const message = extractApiError(err);
    throw new Error(message);
  }
}

export async function apiFetchCrewMember(id: string): Promise<CrewMember> {
  try {
    const response = await api.get<CrewMember>(`/crew/${id}`);
    return response.data;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function apiCreateCrewMember(
  data: Partial<CrewMember>
): Promise<CrewMember> {
  const payload = sanitizePayload(data);
    console.log("📤 TOKEN:", getAccessToken()); 
  console.log("📤 CREATE crew payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await api.post<CrewMember>(`/crew`, payload);
    return response.data;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function apiUpdateCrewMember(
  id: string,
  data: Partial<CrewMember>
): Promise<CrewMember> {
  const payload = sanitizePayload(data);
  console.log("📤 UPDATE crew payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await api.put<CrewMember>(`/crew/${id}`, payload);
    return response.data;
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

export async function apiDeleteCrewMember(id: string): Promise<void> {
  try {
    await api.delete(`/crew/${id}`);
  } catch (err) {
    throw new Error(extractApiError(err));
  }
}

// ─────────────────────────────────────────────
// UNIFIED API OBJECT
// ─────────────────────────────────────────────
export const crewApi = {
  getAll: (
    filters?: CrewFilters,
    sortBy: SortField = "lastName",
    sortOrder: "asc" | "desc" = "asc",
  ) => apiFetchCrewMembers(filters, sortBy, sortOrder),

  getOne:  (id: string)                        => apiFetchCrewMember(id),
  create:  (data: Partial<CrewMember>)          => apiCreateCrewMember(data),
  update:  (id: string, data: Partial<CrewMember>) => apiUpdateCrewMember(id, data),
  delete:  (id: string)                        => apiDeleteCrewMember(id),
};
