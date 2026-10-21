import { apiRequest } from "./api";

/** Table record returned by the backend. */
export type TableApiRecord = {
  id: string;
  outletId: string;
  name: string;
  status: "Tersedia" | "Digunakan" | "Perawatan";
};

function isTableApiRecord(value: unknown): value is TableApiRecord {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("id" in value) ||
    !("outletId" in value) ||
    !("name" in value) ||
    !("status" in value)
  )
    return false;
  return (
    typeof value.id === "string" &&
    typeof value.outletId === "string" &&
    typeof value.name === "string" &&
    (value.status === "Tersedia" ||
      value.status === "Digunakan" ||
      value.status === "Perawatan")
  );
}

/** Table fields accepted by create and update endpoints. */
export type TableInput = {
  outletId: string;
  name: string;
  status: "Tersedia" | "Perawatan";
};

/** Backend operations for dashboard table management. */
export const tableApi = {
  async list(): Promise<TableApiRecord[]> {
    const records = await apiRequest<unknown>("/tables");
    if (!Array.isArray(records) || !records.every(isTableApiRecord))
      throw new Error("Invalid table list response.");
    return records;
  },

  create(input: TableInput): Promise<TableApiRecord> {
    return apiRequest<TableApiRecord>("/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  update(
    id: string,
    input: { name: string; status?: "Tersedia" | "Perawatan" },
  ): Promise<TableApiRecord> {
    return apiRequest<TableApiRecord>(`/tables/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async archive(id: string): Promise<void> {
    await apiRequest<unknown>(`/tables/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
