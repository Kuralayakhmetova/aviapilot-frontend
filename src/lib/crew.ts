// lib/api/crew.ts
// ─── Единый источник типов — реэкспорт из crew-api ───────────────────────────
export type {
  CrewMember,
  CrewCategory,
  CrewPosition,
  RANKS,
  CrewStatus,
  SortField,
  CrewFilters,
  ApiErrorResponse,
  ApiValidationError,
} from "@/lib/crew-api";
export * from '@/lib/crew-api';

export {
  CATEGORY_LABELS,
  CATEGORY_SHORT,
  extractApiError,
  apiFetchCrewMembers,
  apiFetchCrewMember,
  apiCreateCrewMember,
  apiUpdateCrewMember,
  apiDeleteCrewMember,
} from "@/lib/crew-api";

// ─── Адаптер CrewFilter → CrewFilters (для совместимости с CrewPage) ──────────
import type { CrewCategory, CrewMember } from "@/lib/crew-api";
import {
  apiFetchCrewMembers,
  apiFetchCrewMember,
  apiCreateCrewMember,
  apiUpdateCrewMember,
  apiDeleteCrewMember,
} from "@/lib/crew-api";

export interface CrewFilter {
  search?: string;
  category?: CrewCategory | "all";
  status?: "active" | "inactive" | "on_leave" | "suspended" | "all";
  sortBy?: "lastName" | "firstName" | "totalHours" | "createdAt";
  order?: "ASC" | "DESC";
}

export interface CrewListResult {
  data: CrewMember[];
  total: number;
}

export const crewApi = {
  async getAll(filter?: CrewFilter): Promise<CrewListResult> {
    const data = await apiFetchCrewMembers(
      {
        search: filter?.search,
        category:
          filter?.category && filter.category !== "all"
            ? (filter.category as CrewCategory)
            : undefined,
        status:
          filter?.status && filter.status !== "all"
            ? (filter.status as "active" | "inactive")
            : undefined,
      },
      // sortBy: маппим totalHours → totalFlightHours, createdAt → firstName (fallback)
      filter?.sortBy === "totalHours"
        ? "totalFlightHours"
        : filter?.sortBy === "createdAt"
        ? "lastName"
        : filter?.sortBy ?? "lastName",
      filter?.order === "DESC" ? "desc" : "asc"
    );

    return { data, total: data.length };
  },

  async getById(id: string): Promise<CrewMember> {
    return apiFetchCrewMember(id);
  },

  async create(data: Partial<CrewMember>): Promise<CrewMember> {
    return apiCreateCrewMember(data);
  },

  async update(id: string, data: Partial<CrewMember>): Promise<CrewMember> {
    return apiUpdateCrewMember(id, data);
  },

  async delete(id: string): Promise<void> {
    return apiDeleteCrewMember(id);
  },
};
