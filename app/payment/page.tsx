 "use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useDOKU } from "../../hooks/use-doku";
import { formatRupiah } from "../../lib/currency";
import styles from "./page.module.css";

type Session = {
  table: string;
  tableId: string;
  start: string;
  end: string;
  startsAt: string;
  durationHours: number;
  hours: number;
  amount: number;
};
const playDateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

function PaymentDetails() {
  const params = useSearchParams();
  const outlet = params.get("outlet");
  const outletId = params.get("outletId") ?? "";
  const date = params.get("date");
  const { createCheckout, loading, error } = useDOKU();
  let sessions: Session[] = [];
  try {
    const parsed: unknown = JSON.parse(params.get("sessions") ?? "[]");
    if (Array.isArray(parsed)) sessions = parsed as Session[];
  } catch {
    sessions = [];
  }
  const total = Number(params.get("total"));
  const hasSelection = Boolean(
    outlet &&
    outletId &&
    date &&
    sessions.length &&
    sessions.every((session) => session.tableId && session.startsAt) &&
    Number.isFinite(total),
  );
  const environment =
    process.env.NEXT_PUBLIC_DOKU_ENV === "prod" ? "Production" : "Sandbox";

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createCheckout({
      outletId,
      customerName: String(form.get("name") ?? ""),
      customerPhone: String(form.get("phone") ?? ""),
      customerEmail: String(form.get("email") ?? ""),
      sessions: sessions.map(({ tableId, startsAt, durationHours }) => ({
        tableId,
        startsAt,
        durationHours,
      })),
    });
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="MahjongHu home">
          <Image src="/logo-transparent.webp" alt="" width={56} height={56} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <span className={styles.headerLabel}>DOKU CHECKOUT / {environment.toUpperCase()}</span>
      </header>

      <div className={styles.content}>
        <div className={styles.topline}>
          <Link href="/#booking" className={styles.back}>
            <span aria-hidden="true">←</span> Back to table selection
          </Link>
          <span className={styles.step}>02 / 02 &nbsp;·&nbsp; DETAILS</span>
        </div>

        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span /> YOUR GAME PLAN, UP CLOSE
          </p>
          <h1>
            Your <em>game plan.</em>
          </h1>
          <p>
            Review your tables and estimated cost, then enter your contact
            details. Your tables will be held for 15 minutes once checkout starts.
          </p>
        </div>

        {hasSelection ? (
          <div className={styles.layout}>
            <section className={styles.contact} aria-labelledby="contact-title">
              <form onSubmit={submitCheckout}>
                <div className={styles.cardHeading}>
                  <span className={styles.sectionIndex}>CONTACT DETAILS</span>
                  <h2 id="contact-title">Who’s playing?</h2>
                  <p>These details are used to create your DOKU payment.</p>
                </div>
              <div className={styles.fields}>
                <label>
                  <span>Full name</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Name as shown on your ID"
                    required
                  />
                </label>
                <label>
                  <span>Phone number</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Example: 0812 3456 7890"
                    required
                  />
                </label>
                <label>
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@email.com"
                    required
                  />
                </label>
                </div>
                <div className={styles.action}>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  <button type="submit" disabled={loading}>
                    {loading ? "Connecting to DOKU…" : `Continue to DOKU ${environment}`}
                    {!loading && <span aria-hidden="true">↗</span>}
                  </button>
                  <p>
                    Your slots will be held for 15 minutes. If payment is not
                    completed, the hold will be released automatically.
                  </p>
                </div>
              </form>
            </section>

            <aside className={styles.summary} aria-labelledby="summary-title">
              <div className={styles.summaryTop}>
                <div className={styles.summaryHeading}>
                  <span>YOUR SELECTION</span>
                  <span className={styles.tile} aria-hidden="true">
                    胡
                  </span>
                </div>
                <h2 id="summary-title">
                  Tables for
                  <br />
                  <em>your moment.</em>
                </h2>
                <div className={styles.location}>
                  <div>
                    <span>OUTLET</span>
                    <strong>{outlet}</strong>
                  </div>
                  <div>
                    <span>PLAY DATE</span>
                    <strong>
                      {date && playDateFormat.format(new Date(`${date}T12:00:00+07:00`))}
                    </strong>
                  </div>
                </div>
              </div>
              <div className={styles.summaryBody}>
                <div className={styles.listHeading}>
                  <strong>Table rental details</strong>
                  <span>
                    {params.get("tables")} tables · {params.get("hours")} table-hours
                  </span>
                </div>
                <ul className={styles.sessions}>
                  {sessions.map((session, index) => (
                    <li key={`${session.table}-${session.start}-${index}`}>
                      <div>
                        <strong>{session.table}</strong>
                        <span>
                          {session.start}–{session.end} · {session.hours} hours ×{" "}
                          {formatRupiah(session.amount / session.hours)}
                        </span>
                      </div>
                      <strong>{formatRupiah(session.amount)}</strong>
                    </li>
                  ))}
                </ul>
                <div className={styles.total}>
                  <span>
                    Estimated total <small>Table rental only</small>
                  </span>
                  <strong>{formatRupiah(total)}</strong>
                </div>
                <p className={styles.summaryNote}>
                  This is not a bill or proof of reservation. Table availability
                  may change before your booking is confirmed.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <section className={styles.empty} aria-labelledby="empty-title">
            <span aria-hidden="true">▦</span>
            <h2 id="empty-title">No tables selected yet.</h2>
            <p>
              Choose a venue, date, and time slots to see the details here.
            </p>
            <Link href="/#booking">
              Choose a table <span aria-hidden="true">↗</span>
            </Link>
          </section>
        )}
        <footer className={styles.footer}>
          MAHJONGHU <span>·</span> GOOD TILES. GREAT COMPANY.
        </footer>
      </div>
    </main>
  );
}

/** Shows selected tables and collects contact details before starting DOKU checkout. */
export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentDetails />
    </Suspense>
  );
}
