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
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};
const bookingDateTime = new Intl.DateTimeFormat("en-GB", {
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
          : "Could not check your bookings. Please try again later.",
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
          aria-label="Back to MahjongHu home"
        >
          <Image src="/logo-transparent.webp" alt="" width={48} height={48} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <Link href="/">← Back to home</Link>
      </header>
      <div className={styles.content}>
        <p className={styles.eyebrow}>MAHJONGHU / RESERVATIONS</p>
        <h1>
          Check your booking<span>.</span>
        </h1>
        <p className={styles.intro}>
          Enter the phone number you used when booking to see the status of your
          table reservation.
        </p>
        <div className={styles.layout}>
          <form
            className={styles.card}
            onSubmit={(event) => void checkBooking(event)}
          >
            <h2>Find your reservation</h2>
            <label htmlFor="booking-phone">Booking phone number</label>
            <input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="Example: 0895 1234 5678"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <p className={styles.help}>
              Use the number you entered at checkout. You can start it with 0 or
              +62.
            </p>
            <button type="submit" disabled={checking}>
              {checking ? "Checking…" : "Check booking status →"}
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
            aria-label="Booking lookup results"
          >
            {result && result.bookings.length > 0 ? (
              <>
                <p className={styles.eyebrow}>SEARCH RESULTS</p>
                <h2>Bookings found</h2>
                <ul className={styles.bookingList}>
                  {result.bookings.map((booking, index) => (
                    <li key={index}>
                      <span className={styles.bookingIndex}>
                        Reservation {index + 1}
                      </span>
                      <strong>
                        {booking.tableName} · {booking.outletName}
                      </strong>
                      <span>
                        {bookingDateTime.format(new Date(booking.startsAt))} ·{" "}
                        {booking.durationHours} hours
                      </span>
                      <span className={styles.status}>
                        {bookingLabels[booking.status]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.help}>
                  Bookings awaiting payment are not confirmed. If you have
                  questions about your reservation status, contact the owner.
                </p>
              </>
            ) : result ? (
              <div className={styles.empty}>
                <span aria-hidden="true">胡</span>
                <h2>No bookings yet</h2>
                <p>
                  No bookings were found for this number. Check the phone number
                  you used at checkout.
                </p>
              </div>
            ) : (
              <div className={styles.empty}>
                <span aria-hidden="true">胡</span>
                <h2>Your plans, all in one place.</h2>
                <p>
                  Your table, time, and booking status will appear here once we
                  find your details.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
