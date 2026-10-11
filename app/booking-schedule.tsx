"use client";

import { useRef } from "react";
import { formatRupiah } from "../lib/currency";
import {
  BOOKING_HOURS,
  useBooking,
  type BookingOutlet,
} from "@/hooks/use-booking";
import styles from "./booking-schedule.module.css";

const hourLabel = (hour: number) => `${hour}:00`;

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
  const booking = useBooking(outlet);
  const {
    date,
    selected,
    preview,
    sessions,
    tableCount,
    total,
    validDate,
    today,
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
  } = booking;
  const receipt = useRef<HTMLHeadingElement>(null);
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
          Satu meja atau satu circle besar?
          <br />
          Pilih semua meja dan jam yang kamu butuhkan.
        </p>
      </div>
      <div className={styles.controls}>
        <label>
          <span>01 / PILIH OUTLET</span>
          <select
            aria-label="Pilih outlet"
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
          <span>02 / TANGGAL MAIN</span>
          <input
            ref={dateInput}
            aria-label="Tanggal main"
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
          Hari ini <span aria-hidden="true">↗</span>
        </button>
        <div className={styles.rate}>
          <span>HARGA MULAI DARI / MEJA / JAM</span>
          <strong>{formatRupiah(outlet.price)}</strong>
        </div>
      </div>
      <p className={styles.contextNote}>
        Pilihan berlaku untuk satu outlet dan tanggal. Ganti outlet atau tanggal
        akan mengosongkan pilihan.
      </p>
      <div className={styles.bookingLayout}>
        <div className={styles.schedulePanel}>
          <div className={styles.scheduleHeading}>
            <div>
              <h3>{outlet.name}</h3>
              <p>{outlet.tables} meja · 4 pemain / meja · 12:00–22:00</p>
            </div>
            <span className={styles.demoBadge}>LIVE AVAILABILITY</span>
          </div>
          <div className={styles.legend} aria-label="Legenda ketersediaan">
            <span>
              <i />
              Tersedia
            </span>
            <span>
              <i className={styles.selectedKey} />
              Pilihanmu
            </span>
            <span>
              <i className={styles.bookedKey} />
              Tidak tersedia
            </span>
            <small>1 kotak = 1 jam / meja</small>
          </div>
          {availabilityLoading && date && (
            <p role="status">Memuat ketersediaan meja...</p>
          )}
          {availabilityError && (
            <p role="alert">
              {availabilityError}{" "}
              <button type="button" onClick={retryAvailability}>
                Coba lagi
              </button>
            </p>
          )}
          {!validDate && (
            <div className={styles.dateNotice} role="status">
              {date
                ? "Pilih tanggal hari ini atau setelahnya untuk melanjutkan."
                : "Pilih tanggal atau klik Hari ini untuk mulai memilih slot."}
              <button type="button" onClick={() => dateInput.current?.focus()}>
                Pilih tanggal <span aria-hidden="true">↑</span>
              </button>
            </div>
          )}
          <div
            className={styles.gridScroll}
            tabIndex={0}
            role="region"
            aria-label="Jadwal meja, geser horizontal untuk melihat semua jam"
          >
            <table className={styles.scheduleTable}>
              <caption className={styles.srOnly}>
                Jadwal {outlet.name}
                {date && `, ${date}`}. Setiap slot berdurasi satu jam. Pilih
                beberapa slot untuk memesan beberapa meja atau jam.
              </caption>
              <thead>
                <tr>
                  <th scope="col">MEJA / JAM</th>
                  {BOOKING_HOURS.map((hour) => (
                    <th scope="col" key={hour}>
                      {hourLabel(hour)}
                      <span>{hourLabel(hour + 1)}</span>
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
                        <small>4 pemain</small>
                      </span>
                    </th>
                    {BOOKING_HOURS.map((hour) => {
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
                            aria-label={`${nameOfTable(table)}, ${hourLabel(hour)}–${hourLabel(hour + 1)}, ${availabilityLoading ? "memuat ketersediaan" : availabilityError ? "ketersediaan gagal dimuat" : unavailable ? "tidak tersedia" : active ? "dipilih, klik untuk hapus" : "tersedia"}`}
                            onClick={() => toggleSlot(table, hour)}
                          >
                            <span aria-hidden="true">
                              {unavailable ? "—" : active ? "✓" : "+"}
                            </span>
                            <small>
                              {availabilityLoading
                                ? "Memuat"
                                : availabilityError
                                  ? "Gagal"
                                  : unavailable
                                    ? "Tidak tersedia"
                                    : active
                                      ? "Dipilih"
                                      : "Pilih"}
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
            <span>← Geser untuk melihat jam lainnya →</span>
            <span>Klik lagi untuk membatalkan slot.</span>
          </div>
        </div>
        <aside className={styles.summary} aria-labelledby="selection-title">
          <div className={styles.summaryHeader}>
            <span className={styles.eyebrow}>YOUR GAME PLAN</span>
            <span aria-hidden="true">胡</span>
          </div>
          <h3 id="selection-title">Pilihan kamu</h3>
          <p className={styles.summaryOutlet}>
            {outlet.name}
            <span>
              {date
                ? date.split("-").reverse().join(" / ")
                : "Belum ada tanggal dipilih"}
            </span>
          </p>
          {selected.length === 0 ? (
            <div className={styles.empty}>
              <span aria-hidden="true">▦</span>
              <strong>Good times start with a slot.</strong>
              <p>
                Klik kotak pada jadwal. Pilih beberapa jam di meja yang sama,
                atau ajak lebih banyak teman dengan beberapa meja.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.selectionCount} aria-live="polite">
                {tableCount} meja <span>·</span> {selected.length} jam-meja{" "}
                <button type="button" onClick={clearSelection}>
                  Hapus semua
                </button>
              </div>
              <ul className={styles.sessionList}>
                {sessions.map((session) => (
                  <li key={`${session.table}-${session.start}`}>
                    <div>
                      <strong>{nameOfTable(session.table)}</strong>
                      <span>
                        {hourLabel(session.start)}–{hourLabel(session.end)} ·{" "}
                        {session.end - session.start} jam
                      </span>
                      <b>
                        {formatRupiah(
                          (session.end - session.start) *
                            rateOfTable(session.table),
                        )}
                      </b>
                    </div>
                    <button
                      type="button"
                      aria-label={`Hapus ${nameOfTable(session.table)} jam ${hourLabel(session.start)}–${hourLabel(session.end)}`}
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
            Tarif meja sesuai daftar harga × {selected.length} jam-meja
            <small>Jam-meja = total jam dari seluruh meja yang dipilih.</small>
          </div>
          <div className={styles.total} aria-live="polite">
            <span>Estimasi pembayaran</span>
            <strong>{formatRupiah(total)}</strong>
          </div>
          <button
            className={styles.checkout}
            type="button"
            disabled={!selected.length || !validDate}
            onClick={() => {
              showPreview();
              requestAnimationFrame(() => {
                receipt.current?.scrollIntoView({ block: "center" });
                receipt.current?.focus({ preventScroll: true });
              });
            }}
          >
            Lihat rincian pembayaran <span aria-hidden="true">↗</span>
          </button>
          <p className={styles.disclaimer}>
            Simulasi saja. Belum ada reservasi, penahanan meja, atau pembayaran
            nyata.
          </p>
        </aside>
      </div>
      {preview && (
        <section className={styles.receipt} aria-labelledby="payment-title">
          <div className={styles.receiptHeading}>
            <div>
              <p className={styles.eyebrow}>ALL SET, ON PAPER.</p>
              <h3 id="payment-title" ref={receipt} tabIndex={-1}>
                Rincian pembayaran demo
              </h3>
              <p>
                {outlet.name} · {date.split("-").reverse().join(" / ")}
              </p>
            </div>
            <span className={styles.demoBadge}>BELUM DIBAYAR · DEMO</span>
          </div>
          <div className={styles.receiptRows}>
            {sessions.map((session) => (
              <div key={`${session.table}-${session.start}`}>
                <span>
                  <strong>{nameOfTable(session.table)}</strong>
                  <small>
                    {hourLabel(session.start)}–{hourLabel(session.end)} ·{" "}
                    {session.end - session.start} jam ×{" "}
                    {formatRupiah(rateOfTable(session.table))}
                  </small>
                </span>
                <strong>
                  {formatRupiah(
                    (session.end - session.start) * rateOfTable(session.table),
                  )}
                </strong>
              </div>
            ))}
          </div>
          <div className={styles.receiptTotal}>
            <span>
              {tableCount} meja · {selected.length} jam-meja
              <strong>Total estimasi</strong>
            </span>
            <strong>{formatRupiah(total)}</strong>
          </div>
          <p className={styles.disclaimer}>
            Total demo hanya menghitung sewa meja. Ini bukan bukti reservasi
            atau tagihan nyata; belum ada integrasi pembayaran. Mengubah pilihan
            akan menutup rincian ini.
          </p>
        </section>
      )}
      <p className={styles.demoFootnote}>
        Tarif berasal dari backend; status slot diperiksa langsung untuk outlet
        dan tanggal yang dipilih. Pilihan belum membuat reservasi atau hold.
      </p>
    </section>
  );
}
