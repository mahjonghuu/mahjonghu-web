"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../../../lib/api";
import { formatRupiah } from "../../../../lib/currency";
import styles from "./page.module.css";

const configuredPhone = (process.env.NEXT_PUBLIC_OWNER_WHATSAPP ?? "").replace(
  /\D/g,
  "",
);
const ownerPhone = configuredPhone.startsWith("0")
  ? `62${configuredPhone.slice(1)}`
  : configuredPhone;

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

const bookingStatusLabels: Record<string, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

/** Shows the verified backend status and the booking details for a DOKU order. */
function PaymentResultDetails() {
  const params = useParams<{ reference: string }>();
  const reference = Array.isArray(params.reference)
    ? params.reference[0]
    : params.reference;
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(0);
  const refresh = useCallback(
    async (manual = true) => {
      if (manual) setChecking(true);
      try {
        const next = await apiRequest<PaymentStatus>(
          `/payments/doku/status/${encodeURIComponent(reference)}`,
        );
        setPayment(next);
        setError("");
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load the status.",
        );
      } finally {
        if (manual) setChecking(false);
      }
    },
    [reference],
  );

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void refresh(false), 0);
    const poll = window.setInterval(() => {
      if (payment?.status === "pending") void refresh(false);
    }, 3000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
      window.clearTimeout(initialCheck);
    };
  }, [payment?.status, refresh]);

  const remainingSeconds =
    payment?.status === "pending"
      ? Math.max(
          0,
          Math.floor((new Date(payment.expiresAt).getTime() - now) / 1000),
        )
      : 0;
  const cancellationMessage = payment
    ? `Hello MahjongHu, I would like to request cancellation of booking ${payment.bookings.map((booking) => booking.reference).join(", ")} (payment ${payment.reference}). Please let me know the process.`
    : "";
  const cancellationLink = /^62\d{8,13}$/.test(ownerPhone)
    ? `https://wa.me/${ownerPhone}?text=${encodeURIComponent(cancellationMessage)}`
    : null;
  const statusLabel =
    payment?.status === "succeeded"
      ? payment.reservationNeedsReview
        ? "Payment successful · booking needs confirmation"
        : "Payment successful"
      : payment?.status === "expired" || payment?.status === "failed"
        ? "Payment failed or expired"
        : "Awaiting payment confirmation";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="MahjongHu home">
          <Image src="/logo-transparent.webp" alt="" width={52} height={52} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <span>PAYMENT STATUS</span>
      </header>
      <div className={styles.content}>
        <Link className={styles.back} href="/#booking">
          ← Back to booking
        </Link>
        {error && !payment ? (
          <section className={styles.card}>
            <p className={styles.eyebrow}>STATUS UNAVAILABLE</p>
            <h1>Could not load payment status.</h1>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={checking}
            >
              {checking ? "Checking…" : "Check payment status"}
            </button>
          </section>
        ) : !payment ? (
          <section className={styles.card} aria-live="polite">
            <p className={styles.eyebrow}>DOKU CHECKOUT</p>
            <h1>Checking payment…</h1>
            <p>Still waiting for the server? Check the payment status again.</p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={checking}
            >
              {checking ? "Checking…" : "Check payment status"}
            </button>
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
                <p>Please complete payment before the table hold expires.</p>
              ) : payment.reservationNeedsReview ? (
                <p>
                  Payment succeeded, but the table hold has expired or the slot
                  has changed. The MahjongHu team needs to review this booking.
                </p>
              ) : payment.status === "succeeded" ? (
                <p>
                  Thank you, {payment.customerName}. Your payment has been
                  confirmed.
                </p>
              ) : (
                <p>
                  The 15-minute payment window has ended. The table hold has
                  been released.
                </p>
              )}
              {payment.status === "pending" && (
                <div className={styles.countdown}>
                  <span>PAYMENT TIME REMAINING</span>
                  <strong>
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}
                    :{String(remainingSeconds % 60).padStart(2, "0")}
                  </strong>
                </div>
              )}
              {payment.status === "pending" && (
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={checking}
                >
                  {checking ? "Checking…" : "Check payment status"}
                </button>
              )}
            </section>
            <section className={styles.details} aria-labelledby="details-title">
              <div className={styles.detailsHeading}>
                <div>
                  <p className={styles.eyebrow}>ORDER SUMMARY</p>
                  <h2 id="details-title">Payment details</h2>
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
                      {new Date(booking.startsAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      })}{" "}
                      · {booking.durationHours} hours
                    </span>
                    <span>
                      Booking status:{" "}
                      {bookingStatusLabels[booking.bookingStatus] ??
                        booking.bookingStatus}
                    </span>
                  </div>
                  <strong>
                    {formatRupiah(Number(booking.totalAmountIdr))}
                  </strong>
                </article>
              ))}
              <div className={styles.total}>
                <span>Total payment</span>
                <strong>{formatRupiah(Number(payment.amountIdr))}</strong>
              </div>
              <p className={styles.note}>
                Payment status updates after DOKU notifications are verified.
                Refresh this page to see booking cancellations by the owner.
              </p>
              <button
                className={styles.refreshStatus}
                type="button"
                disabled={checking}
                onClick={() => void refresh()}
              >
                {checking ? "Checking…" : "Refresh booking status"}
              </button>
              {payment.bookings.some(
                (booking) =>
                  booking.bookingStatus === "confirmed" &&
                  new Date(booking.startsAt).getTime() > now,
              ) && (
                <div className={styles.cancellation}>
                  <strong>Want to cancel your booking?</strong>
                  <p>
                    Contact the owner and include the booking reference above.
                    The owner handles cancellations and any refunds directly;
                    refunds are not processed automatically through this website.
                  </p>
                  {cancellationLink ? (
                    <a
                      href={cancellationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Chat with the owner on WhatsApp ↗
                    </a>
                  ) : (
                    <p>
                      The owner’s WhatsApp contact is unavailable. Contact the
                      venue through its official channels.
                    </p>
                  )}
                </div>
              )}
            </section>
            <Link href="/#booking" className={styles.home}>
              Back to MahjongHu <span aria-hidden="true">↗</span>
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
          <p className={styles.content}>Loading payment status…</p>
        </main>
      }
    >
      <PaymentResultDetails />
    </Suspense>
  );
}
