import { apiRequest } from "./api";

/** Outlet fields returned by the backend summary and mutation endpoints. */
export type OutletApiRecord = {
  id: string | number;
  name: string;
  city: string;
  address: string;
  active?: boolean;
  isActive?: boolean;
  visibility: "public" | "private";
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
  visibility: "public" | "private";
  openingHour: number;
  closingHour: number;
};

/** Member grant returned by the owner-only outlet access endpoints. */
export type OutletAccessRecord = {
  userId: string;
  email: string;
  expiresAt: string | null;
  createdAt: string;
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

  /** Lists member grants for an outlet. */
  access(id: string): Promise<OutletAccessRecord[]> {
    return apiRequest<OutletAccessRecord[]>(
      `/outlets/${encodeURIComponent(id)}/access`,
    );
  },

  /** Creates or renews a member grant by email. */
  grantAccess(
    id: string,
    email: string,
    expiresAt?: string,
  ): Promise<OutletAccessRecord> {
    return apiRequest<OutletAccessRecord>(
      `/outlets/${encodeURIComponent(id)}/access`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...(expiresAt ? { expiresAt } : {}) }),
      },
    );
  },

  /** Revokes a member grant. */
  async revokeAccess(id: string, userId: string): Promise<void> {
    await apiRequest<unknown>(
      `/outlets/${encodeURIComponent(id)}/access/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    );
  },

  /** Archives an outlet; archived records are excluded from list results. */
  async archive(id: string): Promise<void> {
    await apiRequest<unknown>(`/outlets/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
