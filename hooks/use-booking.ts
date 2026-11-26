import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { HappyHour, PricingMode, RateTier } from "@/lib/outlet";
import { operatingHourDate } from "@/lib/operating-hours";

type Slot = { table: number; hour: number };
type BookingSession = { table: number; start: number; end: number };

const BOOKING_STATE_KEY = "mahjonghu:booking-state";
type StoredBooking = { outletId: string; date: string; selected: unknown };
const MAX_SESSION_HOURS = 10;
/** Outlet data required to query availability and calculate a booking estimate. */
export type BookingOutlet = {
  id: string;
  name: string;
  tableNames: string[];
  address: string;
  tables: number;
  tableIds: string[];
  rate: number;
  rateTiers: RateTier[];
  pricingMode: PricingMode;
  happyHour: HappyHour | null;
  openingHour: number;
  closingHour: number;
};
type AvailableTable = { tableId: string };

/** Half-hour starts in operating-day order that fit at least one hour before closing. */
export const bookingHours = ({ openingHour, closingHour }: BookingOutlet) =>
  bookingStarts(openingHour, operatingClose(openingHour, closingHour));

function operatingClose(openingHour: number, closingHour: number) {
  return closingHour < openingHour ? closingHour + 24 : closingHour;
}

function bookingStarts(openingHour: number, close: number) {
  return Array.from(
    { length: (close - openingHour - 1) * 2 + 1 },
    (_, index) => openingHour + index / 2,
  );
}

/** Queries the tables available for one complete interval. */
async function availableTables(outletId: string, startsAt: Date) {
  const query = new URLSearchParams({
    outletId,
    startsAt: startsAt.toISOString(),
    durationHours: "1",
  });
  const tables = await apiRequest<AvailableTable[]>(`/bookings/availability?${query}`);
  return tables.map((table) => table.tableId);
}

/** ISO weekday for a slot on the selected outlet operating date, independent of browser timezone. */
function slotWeekday(date: string, hour: number) {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + Math.floor(hour / 24));
  return day.getUTCDay() || 7;
}

/** Earliest operating date still open in Jakarta, including an overnight session. */
function nearestOperatingDate(outlet: BookingOutlet, now: number) {
  const jakartaTime = new Date(now + 7 * 60 * 60 * 1000);
  if (outlet.closingHour < outlet.openingHour && jakartaTime.getUTCHours() < outlet.closingHour) {
    jakartaTime.setUTCDate(jakartaTime.getUTCDate() - 1);
  }
  return jakartaTime.toISOString().slice(0, 10);
}

function tableLabel(table: number) {
  return `Table ${String(table).padStart(2, "0")}`;
}

/** Combines adjacent selections on the same table for pricing and checkout. */
function sessionsFor(slots: Slot[]): BookingSession[] {
  const sorted = [...slots].sort(
    (a, b) => a.table - b.table || a.hour - b.hour,
  );
  const sessions: BookingSession[] = [];
  for (const slot of sorted) {
    const previous = sessions.at(-1);
    if (previous?.table === slot.table && previous.end === slot.hour) {
      previous.end++;
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

/** Accepts a non-overlapping interval only if its merged session fits the limit. */
function canAddInterval(
  table: number,
  start: number,
  end: number,
  sessions: BookingSession[],
  isHourAvailable?: (hour: number) => boolean,
) {
  let mergedStart = start;
  let mergedEnd = end;
  for (const session of sessions) {
    if (session.table !== table) continue;
    if (session.start < end && start < session.end) return false;
    if (session.end === start) mergedStart = session.start;
    if (session.start === end) mergedEnd = session.end;
  }
  if (mergedEnd - mergedStart > MAX_SESSION_HOURS) return false;
  // Contiguous one-hour checks cover the entire merged interval without gaps.
  if (isHourAvailable) {
    for (let hour = mergedStart; hour < mergedEnd; hour++) {
      if (!isHourAvailable(hour)) return false;
    }
  }
  return true;
}

/** Restores both one-hour blocks and whole-hour intervals from the former duration picker. */
function restoreSelection(stored: unknown, tables: number, openingHour: number, close: number) {
  const selected: Slot[] = [];
  if (!Array.isArray(stored)) return selected;
  for (const entry of stored) {
    if (typeof entry !== "object" || entry === null) continue;
    const { table, hour, durationHours = 1 } = entry as Partial<Slot & { durationHours: number }>;
    if (
      typeof table !== "number" || !Number.isInteger(table) || table < 1 || table > tables ||
      typeof hour !== "number" || !Number.isInteger(hour * 2) || hour < openingHour ||
      !Number.isInteger(durationHours) || durationHours < 1
    ) continue;
    const end = hour + durationHours;
    if (end > close || !canAddInterval(table, hour, end, sessionsFor(selected))) continue;
    for (let start = hour; start < end; start++) selected.push({ table, hour: start });
  }
  return selected;
}

/** Owns the selected booking date, live availability, slot selection, and estimate. Does not create a booking hold. */
export function useBooking(outlet: BookingOutlet) {
  const { id: outletId, openingHour, closingHour, tables } = outlet;
  const close = operatingClose(openingHour, closingHour);
  const [selectionOutlet, setSelectionOutlet] = useState(outletId);
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Slot[]>([]);
  const [restored, setRestored] = useState(false);
  if (selectionOutlet !== outletId) {
    setSelectionOutlet(outletId);
    setDate("");
    setSelected([]);
    setRestored(true);
  }

  useEffect(() => {
    if (restored) return;
    const timer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(
          sessionStorage.getItem(BOOKING_STATE_KEY) ?? "null",
        ) as StoredBooking | null;
        if (stored?.outletId === outletId && typeof stored.date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(stored.date) &&
            Number.isFinite(operatingHourDate(stored.date, 0).getTime())) {
          setDate(stored.date);
          setSelected(restoreSelection(stored.selected, tables, openingHour, close));
        }
      } catch {
        sessionStorage.removeItem(BOOKING_STATE_KEY);
      }
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [outletId, tables, openingHour, close, restored]);

  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem(
      BOOKING_STATE_KEY,
      JSON.stringify({ outletId, date, selected }),
    );
  }, [date, outletId, restored, selected]);
  const [availability, setAvailability] = useState<
    | { key: string; status: "success"; byHour: Record<number, string[]> }
    | { key: string; status: "error"; message: string }
    | null
  >(null);
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const nearestDate = nearestOperatingDate(outlet, now);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= nearestDate;
  const hasExpiredSelection = selected.some(
    (slot) => operatingHourDate(date, slot.hour).getTime() <= now,
  );
  const availabilityKey = `${outletId}:${date}:${availabilityAttempt}`;
  const currentAvailability =
    availability?.key === availabilityKey ? availability : null;
  const availabilityLoading = validDate && currentAvailability === null;
  const availabilityError =
    currentAvailability?.status === "error" ? currentAvailability.message : "";
  const availableByHour =
    currentAvailability?.status === "success"
      ? currentAvailability.byHour
      : null;
  const rateOfSession = (durationHours: number) => {
    let rate = outlet.rate;
    for (const tier of outlet.rateTiers) {
      if (tier.durationHours > durationHours) break;
      rate = tier.rate;
    }
    return rate;
  };
  const selectedSessions = sessionsFor(selected);
  const sessions = selectedSessions.map((session) => {
    const durationHours = session.end - session.start;
    if (outlet.pricingMode === "happy_hour" && outlet.happyHour) {
      const { days, startHour, endHour, rate } = outlet.happyHour;
      const pricedHours = Array.from({ length: durationHours }, (_, index) => {
        const hour = session.start + index;
        const localHour = hour % 24;
        return {
          hour,
          rate: days.includes(slotWeekday(date, hour)) && localHour >= startHour && localHour < endHour ? rate : outlet.rate,
        };
      });
      return {
        ...session,
        hourlyRate: null,
        pricedHours,
        amount: pricedHours.reduce((sum, slot) => sum + slot.rate, 0),
      };
    }
    const hourlyRate = rateOfSession(durationHours);
    return { ...session, hourlyRate, pricedHours: null, amount: durationHours * hourlyRate };
  });
  const tableCount = new Set(selected.map((slot) => slot.table)).size;
  const total = sessions.reduce((sum, session) => sum + session.amount, 0);
  const totalHours = selected.length;
  const nameOfTable = (table: number) =>
    outlet.tableNames[table - 1] ?? tableLabel(table);

  useEffect(() => {
    if (!validDate) return;

    let current = true;
    const requestTime = Date.now();
    Promise.all(
      bookingStarts(openingHour, close).map(async (hour) => {
        const startsAt = operatingHourDate(date, hour);
        if (startsAt.getTime() <= requestTime) return [hour, []] as const;
        return [hour, await availableTables(outletId, startsAt)] as const;
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
            message: "Failed to load table availability.",
          });
      });

    return () => {
      current = false;
    };
  }, [date, outletId, openingHour, close, validDate, availabilityKey]);

  function canAddSlot(table: number, hour: number, currentSessions: BookingSession[], at: number) {
    const tableId = outlet.tableIds[table - 1];
    if (!validDate || !availableByHour || !tableId || hour < openingHour || hour + 1 > close) return false;
    return canAddInterval(table, hour, hour + 1, currentSessions, (start) =>
      Boolean(availableByHour[start]?.includes(tableId)) &&
      operatingHourDate(date, start).getTime() > at,
    );
  }

  function isSlotAvailable(table: number, hour: number) {
    return canAddSlot(table, hour, selectedSessions, now);
  }

  function changeDate(value: string) {
    setDate(value);
    setSelected([]);
  }

  function selectNearestDate() {
    const currentTime = Date.now();
    setNow(currentTime);
    changeDate(nearestOperatingDate(outlet, currentTime));
  }

  function toggleSlot(table: number, hour: number) {
    const at = Date.now();
    setSelected((current) => {
      const matches = (slot: Slot) => slot.table === table && slot.hour === hour;
      if (current.some(matches)) return current.filter((slot) => !matches(slot));
      if (!canAddSlot(table, hour, sessionsFor(current), at)) return current;
      return [...current, { table, hour }];
    });
  }

  function clearSelection() {
    setSelected([]);
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
  }

  return {
    date,
    selected,
    sessions,
    tableCount,
    total,
    validDate,
    totalHours,
    nearestDate,
    hasExpiredSelection,
    selectNearestDate,
    availabilityLoading,
    availabilityError,
    nameOfTable,
    isSlotAvailable,
    toggleSlot,
    changeDate,
    clearSelection,
    removeSession,
    retryAvailability,
  };
}
