"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeading } from "../components";
import { rupiah } from "../model";
import { useBookings } from "@/hooks/use-bookings";
import { bookingApi, type BookingRecord } from "@/lib/booking";

const statusLabels: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const statusTone: Record<string, string> = {
  pending: "amber",
  confirmed: "blue",
  in_progress: "green",
  completed: "gray",
  cancelled: "gray",
  expired: "gray",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));

/** Lists persisted guest reservations for internal outlet operations. */
export default function BookingPage() {
  const { bookings, loading, error, refreshing, refresh } = useBookings();
  const [outletFilter, setOutletFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");

  async function cancelBooking(booking: BookingRecord) {
    if (
      !window.confirm(
        `Cancel booking ${booking.reference} (${booking.customerName})? The table slot will become available again. Refunds are not processed automatically.`,
      )
    ) return;
    setCancellingId(booking.id);
    setCancelError("");
    setCancelMessage("");
    try {
      await bookingApi.cancel(booking.id);
      setCancelMessage(`Booking ${booking.reference} was cancelled. Arrange a refund directly with the customer if needed.`);
    } catch (cause) {
      setCancelError(cause instanceof Error ? cause.message : "Could not cancel the booking.");
    } finally {
      await refresh();
      setCancellingId(null);
    }
  }
  const outlets = useMemo(
    () =>
      [
        ...new Map(
          bookings.map((booking) => [booking.outletId, booking.outletName]),
        ),
      ]
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, "en")),
    [bookings],
  );
  const filteredBookings = bookings.filter((booking) => {
    const matchesOutlet =
      outletFilter === "all" || booking.outletId === outletFilter;
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const searchText =
      `${booking.reference} ${booking.customerName} ${booking.customerContact} ${booking.tableName} ${booking.outletName}`.toLowerCase();
    return (
      matchesOutlet && matchesStatus && searchText.includes(query.toLowerCase())
    );
  });
  const activeCount = bookings.filter((booking) =>
    ["pending", "confirmed", "in_progress"].includes(booking.status),
  ).length;

  return (
    <>
      <PageHeading
        title="Bookings"
        description="Track table reservations, customer details, schedules, and booking statuses."
        action={
          <button
            className="secondary"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            {refreshing ? "Loading…" : "Refresh"}
          </button>
        }
      />
      <div className="stats-grid booking-stats">
        <article className="stat-card">
          <div className="stat-label">Total bookings</div>
          <h2>{loading ? "—" : bookings.length}</h2>
          <p>Complete saved booking history</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">Active bookings</div>
          <h2>{loading ? "—" : activeCount}</h2>
          <p>Awaiting payment, confirmed, or in progress</p>
        </article>
      </div>
      <div className="filterbar booking-filters">
        <label className="select-field">
          <span>Outlet</span>
          <select
            value={outletFilter}
            onChange={(event) => setOutletFilter(event.target.value)}
          >
            <option value="all">All outlets</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="booking-search">
          <span className="sr-only">Search bookings</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, contact, or reference"
          />
        </label>
      </div>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {cancelError && <p className="notice error" role="alert">{cancelError}</p>}
      {cancelMessage && <p className="notice" role="status">{cancelMessage}</p>}
      {loading && (
        <p className="field-help" role="status">
          Loading bookings…
        </p>
      )}
      {!loading && !error && (
        <section className="panel booking-panel">
          <div className="panel-title">
            <div>
              <h2>Bookings</h2>
              <p>{filteredBookings.length} bookings shown</p>
            </div>
            <Badge tone="blue">Saved data</Badge>
          </div>
          <div className="table-scroll">
            <table role="table" aria-label="Bookings">
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col">Reference / customer</th>
                  <th scope="col">Outlet / table</th>
                  <th scope="col">Start time</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} role="row">
                    <td role="cell" data-label="Reference / customer">
                      <strong>{booking.customerName}</strong>
                      <small>
                        {booking.reference} · {booking.customerContact}
                      </small>
                    </td>
                    <td role="cell" data-label="Outlet / table">
                      <strong>{booking.outletName}</strong>
                      <small>{booking.tableName}</small>
                    </td>
                    <td role="cell" data-label="Start time">
                      {formatDateTime(booking.startsAt)}
                    </td>
                    <td role="cell" data-label="Duration">
                      {booking.durationHours} hours
                    </td>
                    <td role="cell" data-label="Total" className="money">
                      {rupiah(Number(booking.totalAmountIdr))}
                    </td>
                    <td role="cell" data-label="Status">
                      <Badge tone={statusTone[booking.status] ?? "gray"}>
                        {statusLabels[booking.status] ?? booking.status}
                      </Badge>
                    </td>
                    <td role="cell" data-label="Actions">
                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={cancellingId !== null}
                          onClick={() => void cancelBooking(booking)}
                          aria-label={`Cancel booking ${booking.reference}`}
                        >
                          {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="empty">
                {bookings.length
                  ? "No bookings match these filters."
                  : "No bookings saved yet."}
              </div>
            )}
          </div>
        </section>
      )}
      <p className="field-help">
        Cancellation is only available for confirmed bookings before their start time. Contact the customer to arrange any refund manually; cancellation does not automatically return the payment.
      </p>
    </>
  );
}
