"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "../lib/currency";
import {
  bookingHours,
  useBooking,
  type BookingOutlet,
} from "@/hooks/use-booking";
import { operatingHourDate, operatingHourLabel } from "@/lib/operating-hours";
import styles from "./booking-schedule.module.css";

const hourLabel = operatingHourLabel;
const playDateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

/** Renders the booking schedule and its non-reserving price preview. */
export default function BookingSchedule({
  outlet,
  outlets,
  onOutletChange,
}: {
  outlet: BookingOutlet;
  outlets: BookingOutlet[];
  onOutletChange: (id: string) => void;
}) {
  const router = useRouter();
  const booking = useBooking(outlet);
  const {
    date,
    selected,
    sessions,
    tableCount,
    total,
    durationValid,
    durationError,
    validDate,
    today,
    availabilityLoading,
    availabilityError,
    nameOfTable,
    isSlotAvailable,
    isSlotUnavailable,
    changeDate,
    toggleSlot,
    clearSelection,
    removeSession,
    retryAvailability,
  } = booking;
  const hours = bookingHours(outlet);
  const openingDayHours = hours.filter((hour) => hour < 24).length;
  const nextDayHours = hours.length - openingDayHours;
  const dateInput = useRef<HTMLInputElement>(null);

  return (
    <section
      id="booking"
      className={styles.booking}
      aria-labelledby="schedule-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>YOUR TABLE. YOUR TIME.</p>
          <h2 id="schedule-title">
            Make room <em>for play.</em>
          </h2>
        </div>
        <p>
          One table or your whole crew?
          <br />
          Choose all the tables and hours you need.
        </p>
      </div>
      <div className={styles.controls}>
        <label>
          <span>01 / CHOOSE A VENUE</span>
          <select
            aria-label="Choose a venue"
            value={outlet.id}
            onChange={(event) => onOutletChange(event.target.value)}
          >
            {outlets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>02 / PLAY DATE</span>
          <input
            ref={dateInput}
            aria-label="Play date"
            type="date"
            required
            min={today}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
          />
        </label>
        <button
          className={styles.today}
          type="button"
          onClick={() => changeDate(today)}
        >
          Today <span aria-hidden="true">↗</span>
        </button>
        <div className={styles.rate}>
          <span>1-HOUR RATE / TABLE</span>
          <strong>{formatRupiah(outlet.rate)}</strong>
        </div>
      </div>
      <p className={styles.contextNote}>
        Your selection applies to one venue and operating date. Hours marked next day
        fall on the following calendar date. Changing venue or date clears your selection.
        One contiguous session per table can last up to 10 hours.
      </p>
      <div className={styles.bookingLayout}>
        <div className={styles.schedulePanel}>
          <div className={styles.scheduleHeading}>
            <div>
              <h3>{outlet.name}</h3>
              <p>{outlet.tables} tables · 4 players / table · {hourLabel(outlet.openingHour)}–{hourLabel(outlet.closingHour < outlet.openingHour ? outlet.closingHour + 24 : outlet.closingHour)}</p>
            </div>
            <span className={styles.demoBadge}>LIVE AVAILABILITY</span>
          </div>
          <div className={styles.legend} aria-label="Availability legend">
            <span>
              <i />
              Available
            </span>
            <span>
              <i className={styles.selectedKey} />
              Your selection
            </span>
            <span>
              <i className={styles.bookedKey} />
              Unavailable
            </span>
            <small>1 slot = 1 hour / table</small>
          </div>
          {availabilityLoading && date && (
            <p role="status">Loading table availability...</p>
          )}
          {availabilityError && (
            <p role="alert">
              {availabilityError}{" "}
              <button type="button" onClick={retryAvailability}>
                Try again
              </button>
            </p>
          )}
          {!validDate && (
            <div className={styles.dateNotice} role="status">
              {date
                ? "Choose today or a later date to continue."
                : "Choose a date or click Today to start selecting slots."}
              <button type="button" onClick={() => dateInput.current?.focus()}>
                Choose a date <span aria-hidden="true">↑</span>
              </button>
            </div>
          )}
          <div
            className={styles.gridScroll}
            tabIndex={0}
            role="region"
            aria-label="Table schedule; scroll horizontally to see all hours"
          >
            <table
              className={styles.scheduleTable}
              style={{ minWidth: Math.max(820, 125 + hours.length * 64) }}
            >
              <caption className={styles.srOnly}>
                Schedule for {outlet.name}
                {date && `, ${date}`}. Each slot lasts one hour. Select multiple
                slots to book more tables or hours.
              </caption>
              <thead>
                {nextDayHours > 0 && (
                  <tr className={styles.dayBand}>
                    <th aria-hidden="true" />
                    <th scope="colgroup" colSpan={openingDayHours}>
                      OPENING DAY
                    </th>
                    <th scope="colgroup" colSpan={nextDayHours}>
                      NEXT DAY
                    </th>
                  </tr>
                )}
                <tr className={nextDayHours > 0 ? styles.hourRowAfterBand : undefined}>
                  <th scope="col">TABLE / HOUR</th>
                  {hours.map((hour) => {
                    const start = `${String(hour % 24).padStart(2, "0")}:00`;
                    const end = `${String((hour + 1) % 24).padStart(2, "0")}:00`;
                    return (
                      <th scope="col" key={hour}>
                        {start}
                        <span>{end}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: outlet.tables },
                  (_, index) => index + 1,
                ).map((table) => (
                  <tr key={table}>
                    <th scope="row">
                      <span className={styles.tableIcon} aria-hidden="true">
                        ▦
                      </span>
                      <span>
                        {nameOfTable(table)}
                        <small>4 players</small>
                      </span>
                    </th>
                    {hours.map((hour) => {
                      const available = isSlotAvailable(table, hour);
                      const unavailable = isSlotUnavailable(table, hour);
                      const blocked =
                        !validDate ||
                        availabilityLoading ||
                        Boolean(availabilityError) ||
                        !available;
                      const active = selected.some(
                        (slot) => slot.table === table && slot.hour === hour,
                      );
                      return (
                        <td key={hour}>
                          <button
                            type="button"
                            data-table={table}
                            data-hour={hour}
                            className={`${styles.slot} ${unavailable ? styles.booked : active ? styles.selected : ""}`}
                            disabled={blocked}
                            aria-pressed={active}
                            aria-label={`${nameOfTable(table)}, ${hourLabel(hour)}–${hourLabel(hour + 1)}, ${availabilityLoading ? "loading availability" : availabilityError ? "availability could not be loaded" : unavailable ? "unavailable" : active ? "selected, click to remove" : "available"}`}
                            onClick={() => toggleSlot(table, hour)}
                          >
                            <span aria-hidden="true">
                              {unavailable ? "—" : active ? "✓" : "+"}
                            </span>
                            <small>
                              {availabilityLoading
                                ? "Loading"
                                : availabilityError
                                  ? "Error"
                                  : unavailable
                                    ? "Unavailable"
                                    : active
                                      ? "Selected"
                                      : "Select"}
                            </small>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.gridFooter}>
            <span>← Scroll to see more hours →</span>
            <span>Click again to deselect a slot.</span>
          </div>
        </div>
        <aside className={styles.summary} aria-labelledby="selection-title">
          <div className={styles.summaryHeader}>
            <span className={styles.eyebrow}>YOUR GAME PLAN</span>
            <span aria-hidden="true">胡</span>
          </div>
          <h3 id="selection-title">Your selection</h3>
          <p className={styles.summaryOutlet}>
            {outlet.name}
            <span>
              {date
                ? playDateFormat.format(new Date(`${date}T12:00:00+07:00`))
                : "No date selected"}
            </span>
          </p>
          {selected.length === 0 ? (
            <div className={styles.empty}>
              <span aria-hidden="true">▦</span>
              <strong>Good times start with a slot.</strong>
              <p>
                Click a slot on the schedule. Choose multiple hours at the same
                table, or bring more friends by choosing multiple tables.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.selectionCount} aria-live="polite">
                {tableCount} tables <span>·</span> {selected.length} table-hours{" "}
                <button type="button" onClick={clearSelection}>
                  Clear all
                </button>
              </div>
              {(!durationValid || durationError) && (
                <p role="alert" className={styles.durationError}>
                  {durationError || "A session exceeds the 10-hour limit. Remove it and select up to 10 contiguous hours."}
                </p>
              )}
              <ul className={styles.sessionList}>
                {sessions.map((session) => (
                  <li key={`${session.table}-${session.start}`}>
                    <div>
                      <strong>{nameOfTable(session.table)}</strong>
                      <span>
                        {hourLabel(session.start)}–{hourLabel(session.end)} ·{" "}
                        {session.end - session.start} hours
                      </span>
                      <b>
                        {session.end - session.start} hours × {formatRupiah(session.hourlyRate)} / hour ={" "}
                        {formatRupiah(session.amount)}
                      </b>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${nameOfTable(session.table)} from ${hourLabel(session.start)} to ${hourLabel(session.end)}`}
                      onClick={() => removeSession(session)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className={styles.priceExplanation}>
            Each contiguous table session uses the hourly rate at its longest
            eligible duration threshold.
            <small>Its entire duration × that rate; separate sessions are priced separately.</small>
          </div>
          <div className={styles.total} aria-live="polite">
            <span>Estimated payment</span>
            <strong>{formatRupiah(total)}</strong>
          </div>
          <button
            className={styles.checkout}
            type="button"
            disabled={!selected.length || !validDate || !durationValid}
            onClick={() => {
              const params = new URLSearchParams({
                outlet: outlet.name,
                outletId: outlet.id,
                date,
                total: String(total),
                tables: String(tableCount),
                hours: String(selected.length),
                sessions: JSON.stringify(
                  sessions.map((session) => ({
                    table: nameOfTable(session.table),
                    tableId: outlet.tableIds[session.table - 1],
                    start: hourLabel(session.start),
                    end: hourLabel(session.end),
                    startsAt: operatingHourDate(date, session.start).toISOString(),
                    durationHours: session.end - session.start,
                    hours: session.end - session.start,
                    hourlyRate: session.hourlyRate,
                    amount: session.amount,
                  })),
                ),
              });
              router.push(`/payment?${params}`);
            }}
          >
            Review payment details <span aria-hidden="true">↗</span>
          </button>
          <p className={styles.disclaimer}>
            Preview only. No reservation, table hold, or payment has been made.
            Final pricing is recalculated from current rates at checkout and
            may differ if the owner changes rates.
          </p>
        </aside>
      </div>
      <p className={styles.demoFootnote}>
        Rates come from the backend; slot availability is checked live for the
        selected venue and date. Selecting slots does not reserve or hold them.
      </p>
    </section>
  );
}
