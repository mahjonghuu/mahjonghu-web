import { apiRequest } from "./api";

/** Outlet fields returned by the backend summary and mutation endpoints. */
export type OutletApiRecord = {
  id: string | number;
  name: string;
  city: string;
  address: string;
  active?: boolean;
  isActive?: boolean;
  tableCount?: number;
  openingHour: number;
  closingHour: number;
  occupiedTableCount?: number;
};

/** Editable outlet fields accepted by create and update endpoints. */
export type OutletInput = {
  name: string;
  city: string;
  address: string;
  active: boolean;
  openingHour: number;
  closingHour: number;
};


/** Outlet API operations used by the dashboard workspace. */
export const outletApi = {
  async list(): Promise<OutletApiRecord[]> {
    const records = await apiRequest<unknown>("/outlets");
    if (!Array.isArray(records))
      throw new Error("Respons daftar outlet tidak valid.");
    return records as OutletApiRecord[];
  },

  /** Creates an outlet and returns the backend record. */
  create(input: OutletInput): Promise<OutletApiRecord> {
    return apiRequest<OutletApiRecord>("/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Updates an outlet by its stable identifier. */
  update(id: string, input: OutletInput): Promise<OutletApiRecord> {
    return apiRequest<OutletApiRecord>(`/outlets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Archives an outlet; archived records are excluded from list results. */
  async archive(id: string): Promise<void> {
    await apiRequest<unknown>(`/outlets/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
