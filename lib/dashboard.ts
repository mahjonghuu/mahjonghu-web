import { apiRequest } from "./api";

export type DashboardSummary = {
  outlets: { id: string; name: string; active: boolean }[];
  metrics: {
    revenueIdr: string;
    paidTransactionCount: number;
    playedHours: number;
    occupiedTableCount: number;
    tableCount: number;
    activeOutletCount: number;
    availableTableCount: number;
    tablesByStatus: {
      status: "Tersedia" | "Digunakan" | "Perawatan";
      count: number;
    }[];
  };
  revenueByOutlet: {
    id: string;
    name: string;
    amountIdr: string;
    barPercent: number;
  }[];
  transactions: {
    id: string;
    customer: string;
    outletName: string;
    tableName: string;
    settledAt: string;
    hours: number;
    amountIdr: string;
  }[];
};

/** Requests backend-calculated dashboard aggregates for the selected filters. */
export function getDashboardSummary(filters: {
  from: string;
  to: string;
  outletId: string;
}): Promise<DashboardSummary> {
  const query = new URLSearchParams();
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.outletId !== "all") query.set("outletId", filters.outletId);
  const suffix = query.size ? `?${query.toString()}` : "";
  return apiRequest<DashboardSummary>(`/dashboard/summary${suffix}`);
}
