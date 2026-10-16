import { apiRequest } from "./api";

/** Customer identity returned by the cookie-backed member session. */
export type Customer = { id: string; email: string; role: "customer" };

/** Cookie-backed member identity and one-time email code operations. */
export const customerAuthApi = {
  me: () =>
    apiRequest<{ authenticated: boolean; user: Customer | null }>(
      "/auth/customer/me",
    ),
  requestCode: (email: string) =>
    apiRequest<unknown>("/auth/customer/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
  verifyCode: (email: string, code: string) =>
    apiRequest<unknown>("/auth/customer/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    }),
  logout: () =>
    apiRequest<unknown>("/auth/customer/logout", { method: "POST" }),
};
