import { apiRequest } from "./api";

/** Booking fields returned by the internal dashboard endpoint. */
export type BookingRecord = {
  id: string;
  reference: string;
  outletId: string;
  outletName: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerContact: string;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  totalAmountIdr: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "expired";
  holdExpiresAt: string | null;
};

/** Loads bookings for the internal operations dashboard. */
export const bookingApi = {
  list: () => apiRequest<BookingRecord[]>("/bookings"),
};
