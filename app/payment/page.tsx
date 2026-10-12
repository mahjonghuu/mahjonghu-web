"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatRupiah } from "../../lib/currency";
import styles from "./page.module.css";

type Session = {
  table: string;
  start: string;
  end: string;
  hours: number;
  amount: number;
};

function PaymentDetails() {
  const params = useSearchParams();
  const outlet = params.get("outlet");
  const date = params.get("date");
  let sessions: Session[] = [];
  try {
    const parsed: unknown = JSON.parse(params.get("sessions") ?? "[]");
    if (Array.isArray(parsed)) sessions = parsed as Session[];
  } catch {
    sessions = [];
  }
  const total = Number(params.get("total"));
  const hasSelection = Boolean(
    outlet && date && sessions.length && Number.isFinite(total),
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="MahjongHu beranda">
          <Image src="/logo-transparent.webp" alt="" width={56} height={56} />
          <span>
            Mahjong<span>Hu</span>
          </span>
        </Link>
        <span className={styles.headerLabel}>BOOKING PREVIEW / 02</span>
      </header>

      <div className={styles.content}>
        <div className={styles.topline}>
          <Link href="/#booking" className={styles.back}>
            <span aria-hidden="true">←</span> Kembali ke pilihan meja
          </Link>
          <span className={styles.step}>02 / 02 &nbsp;·&nbsp; RINCIAN</span>
        </div>

        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span /> YOUR GAME PLAN, UP CLOSE
          </p>
          <h1>
            Rincian <em>permainanmu.</em>
          </h1>
          <p>
            Cek kembali pilihan meja dan estimasi biaya, lalu lengkapi data
            kontakmu. Ini masih simulasi, belum ada reservasi yang dibuat.
          </p>
        </div>

        {hasSelection ? (
          <div className={styles.layout}>
            <section className={styles.contact} aria-labelledby="contact-title">
              <div className={styles.cardHeading}>
                <span className={styles.sectionIndex}>DATA KONTAK</span>
                <h2 id="contact-title">Siapa yang akan main?</h2>
                <p>Siapkan informasi kontak untuk rencana mainmu.</p>
              </div>
              <div className={styles.fields}>
                <label>
                  <span>Nama lengkap</span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nama sesuai identitas"
                    required
                  />
                </label>
                <label>
                  <span>Nomor telepon</span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Contoh: 0812 3456 7890"
                    required
                  />
                </label>
                <label>
                  <span>Alamat email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    required
                  />
                </label>
              </div>
              <div className={styles.action}>
                <button type="button" disabled>
                  Pembayaran belum tersedia
                </button>
                <p>
                  Data kontak belum disimpan atau dikirim. Belum ada pembayaran
                  maupun penahanan meja.
                </p>
              </div>
            </section>

            <aside className={styles.summary} aria-labelledby="summary-title">
              <div className={styles.summaryTop}>
                <div className={styles.summaryHeading}>
                  <span>RINGKASAN PILIHAN</span>
                  <span className={styles.tile} aria-hidden="true">
                    胡
                  </span>
                </div>
                <h2 id="summary-title">
                  Meja untuk
                  <br />
                  <em>momenmu.</em>
                </h2>
                <div className={styles.location}>
                  <div>
                    <span>OUTLET</span>
                    <strong>{outlet}</strong>
                  </div>
                  <div>
                    <span>TANGGAL MAIN</span>
                    <strong>{date?.split("-").reverse().join(" / ")}</strong>
                  </div>
                </div>
              </div>
              <div className={styles.summaryBody}>
                <div className={styles.listHeading}>
                  <strong>Rincian sewa meja</strong>
                  <span>
                    {params.get("tables")} meja · {params.get("hours")} jam-meja
                  </span>
                </div>
                <ul className={styles.sessions}>
                  {sessions.map((session, index) => (
                    <li key={`${session.table}-${session.start}-${index}`}>
                      <div>
                        <strong>{session.table}</strong>
                        <span>
                          {session.start}–{session.end} · {session.hours} jam ×{" "}
                          {formatRupiah(session.amount / session.hours)}
                        </span>
                      </div>
                      <strong>{formatRupiah(session.amount)}</strong>
                    </li>
                  ))}
                </ul>
                <div className={styles.total}>
                  <span>
                    Total estimasi <small>Sewa meja saja</small>
                  </span>
                  <strong>{formatRupiah(total)}</strong>
                </div>
                <p className={styles.summaryNote}>
                  Ini bukan tagihan atau bukti reservasi. Ketersediaan meja
                  dapat berubah sebelum pemesanan tersedia.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <section className={styles.empty} aria-labelledby="empty-title">
            <span aria-hidden="true">▦</span>
            <h2 id="empty-title">Belum ada pilihan meja.</h2>
            <p>
              Pilih outlet, tanggal, dan jam main terlebih dahulu untuk melihat
              rinciannya.
            </p>
            <Link href="/#booking">
              Pilih meja <span aria-hidden="true">↗</span>
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

/** Standalone public preview of selected tables and contact fields; no booking or payment is submitted. */
export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentDetails />
    </Suspense>
  );
}
