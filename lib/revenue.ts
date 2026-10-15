import { apiRequest } from "./api";
import type { DashboardSummary } from "./dashboard";

export type RevenueReport = Omit<DashboardSummary, "transactions"> & {
  metrics: DashboardSummary["metrics"] & { averageTransactionIdr: number };
  transactions: (DashboardSummary["transactions"][number] & {
    outletId: string;
    tableId: string;
  })[];
};

/** Loads backend-calculated revenue aggregates and all matching paid bookings. */
export async function getRevenueReport(filters: {
  from: string;
  to: string;
  outletId: string;
}): Promise<RevenueReport> {
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.outletId !== "all") query.set("outletId", filters.outletId);
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<RevenueReport>(`/dashboard/revenue${suffix}`);
}
