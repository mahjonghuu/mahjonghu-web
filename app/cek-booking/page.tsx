"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api";
import styles from "./page.module.css";

type BookingResult = {
  outletName: string;
  tableName: string;
  startsAt: string;
  durationHours: number;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "expired";
};
type LookupResult = { bookings: BookingResult[] };

const bookingLabels: Record<BookingResult["status"], string> = {
  pending: "Menunggu pembayaran",
  confirmed: "Dikonfirmasi",
  in_progress: "Sedang berlangsung",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};
const bookingDateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Looks up a guest's reservations by checkout phone without exposing payment details. */
export default function CheckBookingPage() {
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function checkBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const found = await apiRequest<LookupResult>("/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      setResult(found);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Booking belum bisa diperiksa. Coba lagi nanti.",
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="Kembali ke beranda MahjongHu"
        >
          <Image src="/logo-transparent.webp" alt="" width={48} height={48} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <Link href="/">← Kembali ke beranda</Link>
      </header>
      <div className={styles.content}>
        <p className={styles.eyebrow}>MAHJONGHU / RESERVASI</p>
        <h1>
          Cek booking kamu<span>.</span>
        </h1>
        <p className={styles.intro}>
          Masukkan nomor telepon yang digunakan saat memesan untuk melihat
          status booking meja kamu.
        </p>
        <div className={styles.layout}>
          <form
            className={styles.card}
            onSubmit={(event) => void checkBooking(event)}
          >
            <h2>Temukan pesananmu</h2>
            <label htmlFor="booking-phone">Nomor telepon saat booking</label>
            <input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Contoh: 0895 1234 5678"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <p className={styles.help}>
              Gunakan nomor yang kamu isi saat checkout. Kamu bisa menulisnya
              dengan awalan 0 atau +62.
            </p>
            <button type="submit" disabled={checking}>
              {checking ? "Memeriksa…" : "Cek status booking →"}
            </button>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
          </form>
          <section
            className={styles.results}
            aria-live="polite"
            aria-label="Hasil cek booking"
          >
            {result && result.bookings.length > 0 ? (
              <>
                <p className={styles.eyebrow}>HASIL PENCARIAN</p>
                <h2>Booking ditemukan</h2>
                <ul className={styles.bookingList}>
                  {result.bookings.map((booking, index) => (
                    <li key={index}>
                      <span className={styles.bookingIndex}>
                        Reservasi {index + 1}
                      </span>
                      <strong>
                        {booking.tableName} · {booking.outletName}
                      </strong>
                      <span>
                        {bookingDateTime.format(new Date(booking.startsAt))} ·{" "}
                        {booking.durationHours} jam
                      </span>
                      <span className={styles.status}>
                        {bookingLabels[booking.status]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.help}>
                  Booking menunggu pembayaran belum dikonfirmasi. Jika status
                  reservasi perlu ditanyakan, hubungi owner.
                </p>
              </>
            ) : result ? (
              <div className={styles.empty}>
                <span aria-hidden="true">胡</span>
                <h2>Belum ada booking</h2>
                <p>
                  Tidak ada booking untuk nomor tersebut. Periksa kembali nomor
                  telepon yang digunakan saat checkout.
                </p>
              </div>
            ) : (
              <div className={styles.empty}>
                <span aria-hidden="true">胡</span>
                <h2>Rencana mainmu, satu tempat.</h2>
                <p>
                  Detail meja, waktu, dan status booking akan tampil di sini
                  setelah datamu cocok.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
