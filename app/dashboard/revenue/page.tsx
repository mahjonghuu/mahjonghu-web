"use client";

import { useWorkspace } from "../workspace-state";
import {
  Badge,
  DateRange,
  Icon,
  OutletSelect,
  PageHeading,
  TransactionTable,
} from "../components";
import { rupiah } from "../model";

/** Displays revenue summaries and exports filtered transactions as CSV. */
export default function RevenuePage() {
  const { data, outletFilter, setOutletFilter, from, setFrom, to, setTo } =
    useWorkspace();
  const outlets = data.outlets.filter(
    (outlet) => outletFilter === "all" || outlet.id === outletFilter,
  );
  const scopedTransactions = data.transactions.filter(
    (transaction) =>
      (outletFilter === "all" || transaction.outletId === outletFilter) &&
      transaction.date >= from &&
      transaction.date <= to,
  );
  const scopedTables = data.tables.filter(
    (table) => outletFilter === "all" || table.outletId === outletFilter,
  );
  const total = scopedTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const revenueRows = outlets.map((outlet) => ({
    ...outlet,
    amount: scopedTransactions
      .filter((transaction) => transaction.outletId === outlet.id)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  }));
  const average = scopedTransactions.length
    ? total / scopedTransactions.length
    : 0;

  function exportCsv() {
    const outletName = (id: string) =>
      data.outlets.find((outlet) => outlet.id === id)?.name ?? "Outlet dihapus";
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@\-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const rows = [
      [
        "ID",
        "Tanggal",
        "Outlet",
        "Pelanggan",
        "Durasi (jam)",
        "Pendapatan (IDR)",
      ],
      ...scopedTransactions.map((transaction) => [
        transaction.id,
        transaction.date,
        outletName(transaction.outletId),
        transaction.customer,
        transaction.hours,
        transaction.amount,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pendapatan-${from}-${to}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <PageHeading
        title="Laporan pendapatan"
        description="Lihat pendapatan dan rincian transaksi bisnis Anda."
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
        Laporan pendapatan menggunakan data demo. Perubahan akan direset saat
        refresh.
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
            {scopedTransactions.reduce(
              (sum, transaction) => sum + transaction.hours,
              0,
            )}{" "}
            jam bermain tercatat
          </p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Rata-rata transaksi <Icon index={2} />
          </div>
          <h2>{rupiah(average)}</h2>
          <p>Dari transaksi lunas terfilter</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Outlet aktif <Icon index={1} />
          </div>
          <h2>
            {outlets.filter((outlet) => outlet.active).length}
            <span>outlet</span>
          </h2>
          <p>Siap melayani pelanggan</p>
        </article>
      </div>
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
      <section className="panel transactions">
        <div className="panel-title">
          <div>
            <h2>Rincian transaksi</h2>
            <p>{scopedTransactions.length} transaksi sesuai filter</p>
          </div>
          <button
            className="secondary"
            disabled={!scopedTransactions.length || from > to}
            onClick={exportCsv}
          >
            ↓ Ekspor CSV
          </button>
        </div>
        <TransactionTable
          transactions={scopedTransactions}
          tables={data.tables}
          outlets={data.outlets}
        />
      </section>
      <section className="panel availability">
        <div className="panel-title">
          <div>
            <h2>Kesiapan meja</h2>
            <p>Status operasional saat ini</p>
          </div>
          <Icon index={2} />
        </div>
        <div className="status-list">
          {["Tersedia", "Digunakan", "Perawatan"].map((status, index) => (
            <div key={status}>
              <span>
                <i className={`legend-dot segment-${index}`} />
                {status}
              </span>
              <strong>
                {scopedTables.filter((table) => table.status === status).length}
              </strong>
            </div>
          ))}
        </div>
        <Badge tone="gray">{scopedTables.length} total meja</Badge>
      </section>
    </>
  );
}
