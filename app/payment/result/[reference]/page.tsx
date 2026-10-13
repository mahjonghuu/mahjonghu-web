"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import { formatRupiah } from "../../../../lib/currency";
import styles from "./page.module.css";

type PaymentBooking = {
  reference: string;
  outletName: string;
  tableName: string;
  startsAt: string;
  endsAt: string;
  durationHours: number;
  totalAmountIdr: string;
  bookingStatus: string;
};

type PaymentStatus = {
  reference: string;
  status: "pending" | "succeeded" | "failed" | "expired";
  customerName: string;
  amountIdr: string;
  expiresAt: string;
  settledAt: string | null;
  reservationNeedsReview: boolean;
  bookings: PaymentBooking[];
};

/** Shows the verified backend status and the booking details for a DOKU order. */
function PaymentResultDetails() {
  const params = useParams<{ reference: string }>();
  const reference = Array.isArray(params.reference)
    ? params.reference[0]
    : params.reference;
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const next = await apiRequest<PaymentStatus>(
          `/payments/doku/status/${encodeURIComponent(reference)}`,
        );
        if (active) {
          setPayment(next);
          setError("");
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Status belum dapat dimuat.",
          );
        }
      }
    };
    void refresh();
    const poll = window.setInterval(() => {
      if (payment?.status === "pending") void refresh();
    }, 3000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [reference, payment?.status]);

  const remainingSeconds =
    payment?.status === "pending"
      ? Math.max(
          0,
          Math.floor((new Date(payment.expiresAt).getTime() - now) / 1000),
        )
      : 0;
  const statusLabel =
    payment?.status === "succeeded"
      ? payment.reservationNeedsReview
        ? "Pembayaran berhasil · perlu konfirmasi booking"
        : "Pembayaran berhasil"
      : payment?.status === "expired" || payment?.status === "failed"
        ? "Pembayaran gagal atau kedaluwarsa"
        : "Menunggu konfirmasi pembayaran";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="MahjongHu beranda">
          <Image src="/logo-transparent.webp" alt="" width={52} height={52} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <span>PAYMENT STATUS</span>
      </header>
      <div className={styles.content}>
        <Link className={styles.back} href="/#booking">
          ← Kembali ke halaman booking
        </Link>
        {error && !payment ? (
          <section className={styles.card}>
            <p className={styles.eyebrow}>STATUS TIDAK TERSEDIA</p>
            <h1>Status pembayaran belum dapat dimuat.</h1>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Coba lagi
            </button>
          </section>
        ) : !payment ? (
          <section className={styles.card} aria-live="polite">
            <p className={styles.eyebrow}>DOKU CHECKOUT</p>
            <h1>Memeriksa pembayaran…</h1>
            <p>Menunggu status terverifikasi dari server.</p>
          </section>
        ) : (
          <>
            <section
              className={`${styles.card} ${payment.status === "succeeded" ? styles.success : payment.status === "expired" || payment.status === "failed" ? styles.failure : styles.pending}`}
              aria-live="polite"
            >
              <p className={styles.eyebrow}>PAYMENT / {payment.reference}</p>
              <span className={styles.statusIcon} aria-hidden="true">
                {payment.status === "succeeded"
                  ? "✓"
                  : payment.status === "expired" || payment.status === "failed"
                    ? "×"
                    : "· · ·"}
              </span>
              <h1>{statusLabel}</h1>
              {payment.status === "pending" ? (
                <p>Silakan selesaikan pembayaran sebelum hold meja berakhir.</p>
              ) : payment.reservationNeedsReview ? (
                <p>
                  Pembayaran berhasil, tetapi hold meja sudah berakhir atau slot
                  berubah. Tim MahjongHu perlu meninjau booking ini.
                </p>
              ) : payment.status === "succeeded" ? (
                <p>
                  Terima kasih, {payment.customerName}. Pembayaran sudah
                  dikonfirmasi.
                </p>
              ) : (
                <p>
                  Waktu pembayaran 15 menit sudah habis. Hold meja telah
                  dilepas.
                </p>
              )}
              {payment.status === "pending" && (
                <div className={styles.countdown}>
                  <span>SISA WAKTU PEMBAYARAN</span>
                  <strong>
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}
                    :{String(remainingSeconds % 60).padStart(2, "0")}
                  </strong>
                </div>
              )}
            </section>
            <section className={styles.details} aria-labelledby="details-title">
              <div className={styles.detailsHeading}>
                <div>
                  <p className={styles.eyebrow}>RINGKASAN PEMESANAN</p>
                  <h2 id="details-title">Detail pembayaran</h2>
                </div>
                <span>{payment.reference}</span>
              </div>
              {payment.bookings.map((booking) => (
                <article className={styles.booking} key={booking.reference}>
                  <div>
                    <strong>
                      {booking.tableName} · {booking.outletName}
                    </strong>
                    <span>
                      {new Date(booking.startsAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {booking.durationHours} jam
                    </span>
                  </div>
                  <strong>
                    {formatRupiah(Number(booking.totalAmountIdr))}
                  </strong>
                </article>
              ))}
              <div className={styles.total}>
                <span>Total pembayaran</span>
                <strong>{formatRupiah(Number(payment.amountIdr))}</strong>
              </div>
              <p className={styles.note}>
                Status hanya berubah setelah notifikasi DOKU terverifikasi oleh
                server. Halaman ini memeriksa status secara berkala.
              </p>
            </section>
            <Link href="/#booking" className={styles.home}>
              Kembali ke MahjongHu <span aria-hidden="true">↗</span>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <p className={styles.content}>Memuat status pembayaran…</p>
        </main>
      }
    >
      <PaymentResultDetails />
    </Suspense>
  );
}
