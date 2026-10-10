"use client";

import Link from "next/link";
import {
  DateRange,
  Icon,
  OutletSelect,
  PageHeading,
  TransactionTable,
} from "./components";
import { rupiah } from "./model";
import { useWorkspace } from "./workspace-state";

/** Dashboard overview route for demo revenue and table operations. */
export default function DashboardPage() {
  const { data, outletFilter, setOutletFilter, from, setFrom, to, setTo } =
    useWorkspace();
  const scopedTables = data.tables.filter(
    (table) => outletFilter === "all" || table.outletId === outletFilter,
  );
  const scopedTransactions = data.transactions.filter(
    (transaction) =>
      (outletFilter === "all" || transaction.outletId === outletFilter) &&
      transaction.date >= from &&
      transaction.date <= to,
  );
  const total = scopedTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const occupied = scopedTables.filter(
    (table) => table.status === "Digunakan",
  ).length;
  const revenueRows = data.outlets
    .filter((outlet) => outletFilter === "all" || outlet.id === outletFilter)
    .map((outlet) => ({
      ...outlet,
      amount: scopedTransactions
        .filter((transaction) => transaction.outletId === outlet.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }));

  return (
    <>
      <PageHeading
        title="Ringkasan bisnis"
        description="Pantau performa bisnis, dari satu tempat."
        action={
          <div className="date-note">
            <span className="calendar-icon">▦</span>
            <span>
              DATA DEMO<small>Oktober 2026</small>
            </span>
          </div>
        }
      />
      <div className="filterbar">
        <OutletSelect
          outlets={data.outlets}
          value={outletFilter}
          onChange={setOutletFilter}
        />
        <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      </div>
      {from > to && (
        <p className="notice error" role="alert">
          Tanggal mulai tidak boleh melewati tanggal akhir.
        </p>
      )}
      <p className="field-help">
        Dashboard, meja, dan laporan masih menggunakan data demo.
      </p>
      <div className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-label">
            Total pendapatan <Icon index={3} />
          </div>
          <h2>{rupiah(total)}</h2>
          <p>
            <span className="stat-dot" /> Transaksi lunas dalam periode
          </p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Transaksi lunas <Icon index={3} />
          </div>
          <h2>
            {scopedTransactions.length}
            <span>transaksi</span>
          </h2>
          <p>
            {scopedTransactions.reduce((sum, t) => sum + t.hours, 0)} jam
            bermain tercatat
          </p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Meja digunakan <Icon index={2} />
          </div>
          <h2>
            {occupied}
            <span>/ {scopedTables.length} meja</span>
          </h2>
          <p>Status operasional saat ini</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Outlet aktif <Icon index={1} />
          </div>
          <h2>
            {
              data.outlets.filter(
                (outlet) =>
                  outlet.active &&
                  (outletFilter === "all" || outlet.id === outletFilter),
              ).length
            }
            <span>outlet</span>
          </h2>
          <p>Siap melayani pelanggan</p>
        </article>
      </div>
      <div className="insights-grid">
        <section className="panel revenue-panel">
          <div className="panel-title">
            <div>
              <h2>Pendapatan per outlet</h2>
              <p>Kontribusi pada periode terpilih</p>
            </div>
            <span className="subtle-label">IDR</span>
          </div>
          <div className="revenue-bars">
            {revenueRows.map((outlet, index) => (
              <div className="revenue-row" key={outlet.id}>
                <div>
                  <span>
                    <span className="outlet-number">0{index + 1}</span>
                    {outlet.name.replace("MahjongHu ", "")}
                  </span>
                  <strong>{rupiah(outlet.amount)}</strong>
                </div>
                <div className="bar-track">
                  <div
                    style={{
                      width: `${total ? (outlet.amount / Math.max(...revenueRows.map((row) => row.amount), 1)) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!revenueRows.length && <p className="empty">Belum ada outlet.</p>}
          </div>
          <div className="panel-foot">
            Pendapatan dihitung dari transaksi lunas, bukan status meja.
          </div>
        </section>
        <section className="panel availability">
          <div className="panel-title">
            <div>
              <h2>Kesiapan meja</h2>
              <p>Status langsung dari workspace</p>
            </div>
            <Icon index={2} />
          </div>
          <div className="availability-total">
            <strong>
              {
                scopedTables.filter(
                  (table) =>
                    table.status === "Tersedia" &&
                    data.outlets.find((outlet) => outlet.id === table.outletId)
                      ?.active,
                ).length
              }
            </strong>
            <span>
              meja siap
              <br />
              untuk bermain
            </span>
          </div>
          <div className="segmented-bar">
            {["Tersedia", "Digunakan", "Perawatan"].map((status, index) => (
              <div
                key={status}
                className={`segment segment-${index}`}
                style={{
                  flex: scopedTables.filter((table) => table.status === status)
                    .length,
                }}
              />
            ))}
          </div>
          <div className="status-list">
            {["Tersedia", "Digunakan", "Perawatan"].map((status, index) => (
              <div key={status}>
                <span>
                  <i className={`legend-dot segment-${index}`} />
                  {status}
                </span>
                <strong>
                  {
                    scopedTables.filter((table) => table.status === status)
                      .length
                  }
                </strong>
              </div>
            ))}
          </div>
          <Link className="text-button" href="/dashboard/table">
            Kelola semua meja <span>↗</span>
          </Link>
        </section>
      </div>
      <section className="panel transactions">
        <div className="panel-title">
          <div>
            <h2>Transaksi terbaru</h2>
            <p>Aktivitas pembayaran terakhir di outlet Anda</p>
          </div>
          <Link className="secondary" href="/dashboard/revenue">
            Lihat laporan ↗
          </Link>
        </div>
        <TransactionTable
          transactions={scopedTransactions}
          tables={data.tables}
          outlets={data.outlets}
          limit={5}
        />
      </section>
    </>
  );
}
