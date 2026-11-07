import { apiRequest } from "./api";

/** Dashboard roles exposed by the backend session endpoint. */
export type DashboardRole = "owner" | "employee";

/** Verified dashboard session and its current outlet scope. */
export type DashboardSession = {
  authenticated: true;
  role: DashboardRole;
  outletId: string | null;
};

/** Reads the current dashboard identity from the backend without reusing a cached response. */
export const sessionApi = {
  me: () =>
    apiRequest<DashboardSession>("/auth/me", { cache: "no-store" }),
};
