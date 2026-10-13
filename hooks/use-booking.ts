import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Slot = { table: number; hour: number };
type BookingSession = { table: number; start: number; end: number };

const BOOKING_STATE_KEY = "mahjonghu:booking-state";
type StoredBooking = { outletId: string; date: string; selected: Slot[] };
/** Outlet data required to query availability and calculate a booking estimate. */
export type BookingOutlet = {
  id: string;
  name: string;
  tableNames: string[];
  address: string;
  tables: number;
  tableIds: string[];
  tableRates: number[];
  price: number;
  openingHour: number;
  closingHour: number;
};
type AvailableTable = { tableId: string };

/** Hour starts shown in the booking grid; each interval lasts one hour. */
export const bookingHours = (outlet: BookingOutlet) =>
  Array.from(
    { length: outlet.closingHour - outlet.openingHour },
    (_, index) => outlet.openingHour + index,
  );

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function tableLabel(table: number) {
  return `Meja ${String(table).padStart(2, "0")}`;
}

/** Combines adjacent selected hours on a table into one session. */
function sessionsFor(slots: Slot[]): BookingSession[] {
  const sorted = [...slots].sort(
    (a, b) => a.table - b.table || a.hour - b.hour,
  );
  const sessions: BookingSession[] = [];
  for (const slot of sorted) {
    const previous = sessions.at(-1);
    if (previous?.table === slot.table && previous.end === slot.hour) {
      previous.end += 1;
    } else {
      sessions.push({
        table: slot.table,
        start: slot.hour,
        end: slot.hour + 1,
      });
    }
  }
  return sessions;
}

/** Owns the selected booking date, live availability, slot selection, and estimate. Does not create a booking hold. */
export function useBooking(outlet: BookingOutlet) {
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Slot[]>([]);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        sessionStorage.getItem(BOOKING_STATE_KEY) ?? "null",
      ) as StoredBooking | null;
      if (stored?.outletId === outlet.id) {
        setDate(stored.date);
        setSelected(stored.selected);
      }
    } catch {
      sessionStorage.removeItem(BOOKING_STATE_KEY);
    }
    setRestored(true);
  }, [outlet.id]);

  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem(
      BOOKING_STATE_KEY,
      JSON.stringify({ outletId: outlet.id, date, selected }),
    );
  }, [date, outlet.id, restored, selected]);
  const [preview, setPreview] = useState(false);
  const [availability, setAvailability] = useState<
    | { key: string; status: "success"; byHour: Record<number, string[]> }
    | { key: string; status: "error"; message: string }
    | null
  >(null);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const todayDate = today();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= todayDate;
  const availabilityKey = `${outlet.id}:${date}:${availabilityAttempt}`;
  const currentAvailability =
    availability?.key === availabilityKey ? availability : null;
  const availabilityLoading = validDate && currentAvailability === null;
  const availabilityError =
    currentAvailability?.status === "error" ? currentAvailability.message : "";
  const availableByHour =
    currentAvailability?.status === "success"
      ? currentAvailability.byHour
      : null;
  const sessions = sessionsFor(selected);
  const tableCount = new Set(selected.map((slot) => slot.table)).size;
  const rateOfTable = (table: number) =>
    outlet.tableRates[table - 1] ?? outlet.price;
  const total = selected.reduce(
    (sum, slot) => sum + rateOfTable(slot.table),
    0,
  );
  const nameOfTable = (table: number) =>
    outlet.tableNames[table - 1] ?? tableLabel(table);

  useEffect(() => {
    if (!validDate) return;

    let current = true;
    Promise.all(
      bookingHours(outlet).map(async (hour) => {
        const startsAt = new Date(
          `${date}T${String(hour).padStart(2, "0")}:00:00`,
        );
        if (startsAt.getTime() <= Date.now()) return [hour, []] as const;

        const query = new URLSearchParams({
          outletId: outlet.id,
          startsAt: startsAt.toISOString(),
          durationHours: "1",
        });
        const tables = await apiRequest<AvailableTable[]>(
          `/bookings/availability?${query}`,
        );
        return [hour, tables.map((table) => table.tableId)] as const;
      }),
    )
      .then((results) => {
        if (current)
          setAvailability({
            key: availabilityKey,
            status: "success",
            byHour: Object.fromEntries(results),
          });
      })
      .catch(() => {
        if (current)
          setAvailability({
            key: availabilityKey,
            status: "error",
            message: "Ketersediaan meja gagal dimuat.",
          });
      });

    return () => {
      current = false;
    };
  }, [
    date,
    outlet.id,
    outlet.openingHour,
    outlet.closingHour,
    validDate,
    availabilityKey,
    outlet,
  ]);

  function isSlotAvailable(table: number, hour: number) {
    return Boolean(
      availableByHour?.[hour]?.includes(outlet.tableIds[table - 1] ?? ""),
    );
  }

  function isSlotUnavailable(table: number, hour: number) {
    return availableByHour !== null && !isSlotAvailable(table, hour);
  }

  function changeDate(value: string) {
    setDate(value);
    setSelected([]);
    setPreview(false);
  }

  function toggleSlot(table: number, hour: number) {
    if (!validDate || !isSlotAvailable(table, hour)) return;
    setSelected((current) =>
      current.some((slot) => slot.table === table && slot.hour === hour)
        ? current.filter((slot) => slot.table !== table || slot.hour !== hour)
        : [...current, { table, hour }],
    );
    setPreview(false);
  }

  function clearSelection() {
    setSelected([]);
    setPreview(false);
  }

  function showPreview() {
    setPreview(true);
  }

  function retryAvailability() {
    setAvailabilityAttempt((attempt) => attempt + 1);
  }
  function removeSession(session: BookingSession) {
    setSelected((current) =>
      current.filter(
        (slot) =>
          slot.table !== session.table ||
          slot.hour < session.start ||
          slot.hour >= session.end,
      ),
    );
    setPreview(false);
  }

  return {
    date,
    selected,
    preview,
    sessions,
    tableCount,
    total,
    validDate,
    today: todayDate,
    availabilityLoading,
    availabilityError,
    nameOfTable,
    rateOfTable,
    isSlotAvailable,
    isSlotUnavailable,
    changeDate,
    toggleSlot,
    clearSelection,
    removeSession,
    showPreview,
    retryAvailability,
  };
}
