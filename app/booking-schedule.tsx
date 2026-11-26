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
    totalHours,
    toggleSlot,
    validDate,
    nearestDate,
    hasExpiredSelection,
    selectNearestDate,
    availabilityLoading,
    availabilityError,
    nameOfTable,
    isSlotAvailable,
    changeDate,
    clearSelection,
    removeSession,
    retryAvailability,
  } = booking;
  const hours = bookingHours(outlet);
  const openingDayHours = hours.filter((hour) => hour < 24).length;
  const nextDayHours = hours.length - openingDayHours;
  const dateInput = useRef<HTMLInputElement>(null);
  const gridUnavailableLabel = !validDate
    ? "Choose date"
    : availabilityLoading
      ? "Loading"
      : availabilityError
        ? "Error"
        : null;

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
          Pick one-hour blocks for each table.
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
          <span>02 / OPERATING DATE</span>
          <input
            ref={dateInput}
            aria-label="Operating date"
            type="date"
            required
            min={nearestDate}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
          />
        </label>
        <button
          className={styles.today}
          type="button"
          onClick={selectNearestDate}
        >
          Nearest schedule <span aria-hidden="true">↗</span>
        </button>
        <div className={styles.rate}>
          <span>BASE RATE / TABLE-HOUR</span>
          <strong>{formatRupiah(outlet.rate)}</strong>
        </div>
      </div>
      <p className={styles.contextNote}>
        Nearest schedule: {playDateFormat.format(operatingHourDate(nearestDate, 12))} ·{" "}
        {hourLabel(outlet.openingHour)}–{hourLabel(outlet.closingHour < outlet.openingHour ? outlet.closingHour + 24 : outlet.closingHour)}.
        Your selection applies to one venue and operating date. Changing venue or date clears your selection.
        Adjacent blocks on the same table form one session, up to 10 hours.
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
            <small>One-hour blocks start on the hour or half-hour</small>
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
                ? "Choose the nearest operating date or a later date to continue."
                : "Choose a date or click Nearest schedule to see start times."}
              <button type="button" onClick={() => dateInput.current?.focus()}>
                Choose a date <span aria-hidden="true">↑</span>
              </button>
            </div>
          )}
          <div
            className={styles.gridScroll}
            tabIndex={0}
            role="region"
            aria-label="Table schedule; scroll horizontally to see all start times"
          >
            <table
              className={styles.scheduleTable}
              style={{ minWidth: Math.max(820, 125 + hours.length * 64) }}
            >
              <caption className={styles.srOnly}>
                Schedule for {outlet.name}
                {date && `, ${date}`}. Select a one-hour block or select it
                again to remove it.
              </caption>
              <colgroup />
              {openingDayHours > 0 && <colgroup span={openingDayHours} />}
              {nextDayHours > 0 && <colgroup span={nextDayHours} />}
              <thead>
                {nextDayHours > 0 && (
                  <tr className={styles.dayBand}>
                    <th aria-hidden="true" />
                    <th scope="colgroup" colSpan={openingDayHours}>
                      {date ? playDateFormat.format(operatingHourDate(date, 12)) : "OPENING DAY"}
                    </th>
                    <th scope="colgroup" colSpan={nextDayHours}>
                      {date ? playDateFormat.format(operatingHourDate(date, 36)) : "NEXT DAY"}
                    </th>
                  </tr>
                )}
                <tr className={nextDayHours > 0 ? styles.hourRowAfterBand : undefined}>
                  <th scope="col">TABLE / START</th>
                  {hours.map((hour) => (
                    <th scope="col" key={hour} className={hour === 24 ? styles.nextDayStart : undefined}>
                      {hourLabel(hour, false)}
                    </th>
                  ))}
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
                      const picked = selected.some(
                        (slot) => slot.table === table && slot.hour === hour,
                      );
                      const unavailable = !picked && !gridUnavailableLabel &&
                        !isSlotAvailable(table, hour);
                      const blocked = !picked && (Boolean(gridUnavailableLabel) || unavailable);
                      const label = picked
                        ? "Selected"
                        : gridUnavailableLabel ?? (unavailable ? "Unavailable" : "Select");
                      const appearance = picked ? styles.selected : unavailable ? styles.booked : "";
                      return (
                        <td key={hour} className={hour === 24 ? styles.nextDayStart : undefined}>
                          <button
                            type="button"
                            data-table={table}
                            data-hour={hour}
                            className={`${styles.slot} ${appearance}`}
                            disabled={blocked}
                            aria-pressed={picked}
                            aria-label={`${nameOfTable(table)}, ${hourLabel(hour)} to ${hourLabel(hour + 1)}`}
                            onClick={() => toggleSlot(table, hour)}
                          >
                            <span aria-hidden="true">
                              {picked ? "✓" : blocked ? "—" : "+"}
                            </span>
                            <small>{label}</small>
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
            <span>← Scroll to see more start times →</span>
            <span>Select a block to add one hour. Select it again to remove it.</span>
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
          <div role="status" className={styles.srOnly}>
            {sessions.length
              ? `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"} selected, ${totalHours} table-hours.`
              : "No sessions selected."}
          </div>
          {sessions.length === 0 ? (
            <div className={styles.empty}>
              <span aria-hidden="true">▦</span>
              <strong>Good times start here.</strong>
              <p>
                Select a one-hour block in the schedule. Adjacent blocks on
                the same table appear together as one session.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.selectionCount}>
                {tableCount} tables <span>·</span> {totalHours} table-hours{" "}
                <button type="button" onClick={clearSelection}>
                  Clear all
                </button>
              </div>
              {hasExpiredSelection && (
                <p role="alert" className={styles.selectionError}>
                  A selected session has already started. Remove it before continuing.
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
                        {session.pricedHours
                          ? <>{session.pricedHours.map((slot) => (
                              <span key={slot.hour}>{hourLabel(slot.hour)}–{hourLabel(slot.hour + 1)}: {formatRupiah(slot.rate)}</span>
                            ))}Session estimate: {formatRupiah(session.amount)}</>
                          : <>{session.end - session.start} hours × {formatRupiah(session.hourlyRate)} / hour = {formatRupiah(session.amount)}</>}
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
            {outlet.pricingMode === "happy_hour" && outlet.happyHour ? (
              <>
                Happy hour applies to each one-hour block that starts on {outlet.happyHour.days.map((day) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day - 1]).join(", ")} between {String(outlet.happyHour.startHour).padStart(2, "0")}:00 and {String(outlet.happyHour.endHour % 24).padStart(2, "0")}:00 (end time excluded). Other blocks use the base rate.
                <small>After midnight, the next calendar day&apos;s weekday applies. The estimate sums each block and each table session.</small>
              </>
            ) : (
              <>
                Each contiguous table session uses the hourly rate at its longest eligible duration threshold.
                <small>Its entire duration × that rate; separate sessions are priced separately.</small>
              </>
            )}
          </div>
          <div className={styles.total} aria-live="polite">
            <span>Estimated payment</span>
            <strong>{formatRupiah(total)}</strong>
          </div>
          <button
            className={styles.checkout}
            type="button"
            disabled={!sessions.length || !validDate || hasExpiredSelection}
            onClick={() => {
              const params = new URLSearchParams({
                outlet: outlet.name,
                outletId: outlet.id,
                date,
                total: String(total),
                tables: String(tableCount),
                hours: String(totalHours),
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
                    pricedHours: session.pricedHours?.map((slot) => ({
                      start: hourLabel(slot.hour),
                      end: hourLabel(slot.hour + 1),
                      rate: slot.rate,
                    })) ?? null,
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
        Rates come from the backend. Availability is checked live for the
        selected venue and date. Selecting a block does not hold it.
      </p>
    </section>
  );
}
