"use client";

import { useMemo, useState } from "react";
import { Badge, PageHeading } from "../components";
import { rupiah } from "../model";
import { useBookings } from "@/hooks/use-bookings";
import { bookingApi, type BookingRecord } from "@/lib/booking";

const statusLabels: Record<string, string> = {
  pending: "Menunggu pembayaran",
  confirmed: "Dikonfirmasi",
  in_progress: "Berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
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
  new Intl.DateTimeFormat("id-ID", {
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
        `Batalkan booking ${booking.reference} (${booking.customerName})? Slot meja akan kembali tersedia. Refund tidak diproses otomatis.`,
      )
    ) return;
    setCancellingId(booking.id);
    setCancelError("");
    setCancelMessage("");
    try {
      await bookingApi.cancel(booking.id);
      setCancelMessage(`Booking ${booking.reference} berhasil dibatalkan. Urus refund langsung dengan pelanggan bila diperlukan.`);
    } catch (cause) {
      setCancelError(cause instanceof Error ? cause.message : "Gagal membatalkan booking.");
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
        .sort((left, right) => left.name.localeCompare(right.name, "id")),
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
        title="Booking"
        description="Pantau reservasi meja, detail pelanggan, jadwal, dan status booking."
        action={
          <button
            className="secondary"
            onClick={() => void refresh()}
            disabled={refreshing}
          >
            {refreshing ? "Memuat…" : "Muat ulang"}
          </button>
        }
      />
      <div className="stats-grid booking-stats">
        <article className="stat-card">
          <div className="stat-label">Total booking</div>
          <h2>{loading ? "—" : bookings.length}</h2>
          <p>Seluruh riwayat booking tersimpan</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">Booking aktif</div>
          <h2>{loading ? "—" : activeCount}</h2>
          <p>Menunggu pembayaran, dikonfirmasi, atau berlangsung</p>
        </article>
      </div>
      <div className="filterbar booking-filters">
        <label className="select-field">
          <span>Outlet</span>
          <select
            value={outletFilter}
            onChange={(event) => setOutletFilter(event.target.value)}
          >
            <option value="all">Semua outlet</option>
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
            <option value="all">Semua status</option>
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="booking-search">
          <span className="sr-only">Cari booking</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kontak, atau referensi"
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
          Memuat data booking…
        </p>
      )}
      {!loading && !error && (
        <section className="panel booking-panel">
          <div className="panel-title">
            <div>
              <h2>Daftar booking</h2>
              <p>{filteredBookings.length} booking ditampilkan</p>
            </div>
            <Badge tone="blue">Data tersimpan</Badge>
          </div>
          <div className="table-scroll">
            <table role="table" aria-label="Daftar booking">
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col">Referensi / pelanggan</th>
                  <th scope="col">Outlet / meja</th>
                  <th scope="col">Waktu mulai</th>
                  <th scope="col">Durasi</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tindakan</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} role="row">
                    <td role="cell" data-label="Referensi / pelanggan">
                      <strong>{booking.customerName}</strong>
                      <small>
                        {booking.reference} · {booking.customerContact}
                      </small>
                    </td>
                    <td role="cell" data-label="Outlet / meja">
                      <strong>{booking.outletName}</strong>
                      <small>{booking.tableName}</small>
                    </td>
                    <td role="cell" data-label="Waktu mulai">
                      {formatDateTime(booking.startsAt)}
                    </td>
                    <td role="cell" data-label="Durasi">
                      {booking.durationHours} jam
                    </td>
                    <td role="cell" data-label="Total" className="money">
                      {rupiah(Number(booking.totalAmountIdr))}
                    </td>
                    <td role="cell" data-label="Status">
                      <Badge tone={statusTone[booking.status] ?? "gray"}>
                        {statusLabels[booking.status] ?? booking.status}
                      </Badge>
                    </td>
                    <td role="cell" data-label="Tindakan">
                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={cancellingId !== null}
                          onClick={() => void cancelBooking(booking)}
                          aria-label={`Batalkan booking ${booking.reference}`}
                        >
                          {cancellingId === booking.id ? "Membatalkan…" : "Batalkan"}
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
                  ? "Tidak ada booking yang cocok dengan filter."
                  : "Belum ada booking tersimpan."}
              </div>
            )}
          </div>
        </section>
      )}
      <p className="field-help">
        Pembatalan hanya tersedia untuk booking terkonfirmasi sebelum waktu mulai. Hubungi pelanggan untuk urusan refund secara manual; pembatalan tidak mengembalikan uang secara otomatis.
      </p>
    </>
  );
}
