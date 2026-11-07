import { apiRequest } from "./api";

/** Employee account returned by the owner-only employee endpoints. */
export type EmployeeRecord = {
  id: string;
  email: string;
  outletId: string;
  outletName: string;
  isActive: boolean;
  createdAt: string;
};

/** Owner input for creating an employee account. */
export type EmployeeCreateInput = {
  email: string;
  password: string;
  outletId: string;
};

/** Owner edits; omitted fields keep their current value. */
export type EmployeeUpdateInput = {
  email?: string;
  password?: string;
  outletId?: string;
  isActive?: boolean;
};

/** Owner-only employee provisioning operations. */
export const employeeApi = {
  async list(outletId?: string): Promise<EmployeeRecord[]> {
    const query = new URLSearchParams({ includeInactive: "true" });
    if (outletId) query.set("outletId", outletId);
    const records = await apiRequest<unknown>(`/employees?${query.toString()}`);
    if (!Array.isArray(records)) {
      throw new Error("Invalid employee list response.");
    }
    return records as EmployeeRecord[];
  },

  create(input: EmployeeCreateInput): Promise<EmployeeRecord> {
    return apiRequest<EmployeeRecord>("/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: EmployeeUpdateInput): Promise<EmployeeRecord> {
    return apiRequest<EmployeeRecord>(`/employees/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Deactivates an employee while preserving the account and history. */
  async deactivate(id: string): Promise<void> {
    await apiRequest<unknown>(`/employees/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
