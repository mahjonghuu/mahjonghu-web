"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DateRange, Icon, OutletSelect, PageHeading } from "./components";
import { rupiah } from "./model";
import { getDashboardSummary, type DashboardSummary } from "@/lib/dashboard";
import { useWorkspace } from "./workspace-state";

const tableStatuses = ["Tersedia", "Digunakan", "Perawatan"] as const;

/** Displays backend-calculated operational and payment aggregates. */
export default function DashboardPage() {
  const { outletFilter, setOutletFilter, from, setFrom, to, setTo } =
    useWorkspace();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [settledKey, setSettledKey] = useState("");
  const [error, setError] = useState("");
  const requestKey = JSON.stringify([from, to, outletFilter]);

  const loading = settledKey !== requestKey;
  useEffect(() => {
    let active = true;
    getDashboardSummary({ from, to, outletId: outletFilter })
      .then((result) => {
        if (active) setError("");
        if (active) setSummary(result);
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Ringkasan tidak dapat dimuat.",
          );
      })
      .finally(() => {
        if (active) setSettledKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [from, to, outletFilter, requestKey]);

  const metrics = summary?.metrics;
  const tableCount = (status: string) =>
    metrics?.tablesByStatus.find((row) => row.status === status)?.count ?? 0;

  return (
    <>
      <PageHeading
        title="Ringkasan bisnis"
        description="Pantau performa bisnis, dari satu tempat."
        action={
          <div className="date-note">
            <span className="calendar-icon">▦</span> DATA LIVE
            <small>Data operasional</small>
          </div>
        }
      />
      <div className="filterbar">
        <OutletSelect
          outlets={summary?.outlets ?? []}
          value={outletFilter}
          onChange={setOutletFilter}
        />
        <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
      </div>
      {from && to && from > to && (
        <p className="notice error" role="alert">
          Tanggal mulai tidak boleh melewati tanggal akhir.
        </p>
      )}
      {!loading && error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="dashboard-skeleton" role="status" aria-label="Memuat dashboard" aria-busy="true">
          <div className="dashboard-skeleton-stats">
            {[0, 1, 2, 3].map((item) => <div className="dashboard-skeleton-card" key={item}><i /><b /><span /></div>)}
          </div>
          <div className="dashboard-skeleton-bento">
            <div className="dashboard-skeleton-panel dashboard-skeleton-revenue"><i /><span /><span /><span /><span /></div>
            <div className="dashboard-skeleton-panel dashboard-skeleton-availability"><i /><b /><span /><span /><span /></div>
          </div>
          <div className="dashboard-skeleton-panel dashboard-skeleton-transactions"><i /><span /><span /><span /></div>
        </div>
      ) : (
        <>
      <div className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-label">
            Total pendapatan <Icon index={3} />
          </div>
          <h2>{rupiah(Number(metrics?.revenueIdr ?? 0))}</h2>
          <p>
            <span className="stat-dot" /> Pembayaran berhasil dalam periode
          </p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Transaksi lunas <Icon index={3} />
          </div>
          <h2>
            {metrics?.paidTransactionCount ?? 0}
            <span>transaksi</span>
          </h2>
          <p>{metrics?.playedHours ?? 0} jam bermain tercatat</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Meja digunakan <Icon index={2} />
          </div>
          <h2>
            {metrics?.occupiedTableCount ?? 0}
            <span>/ {metrics?.tableCount ?? 0} meja</span>
          </h2>
          <p>Status operasional saat ini</p>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            Outlet aktif <Icon index={1} />
          </div>
          <h2>
            {metrics?.activeOutletCount ?? 0}
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
            {summary?.revenueByOutlet.map((outlet, index) => (
              <div className="revenue-row" key={outlet.id}>
                <div>
                  <span>
                    <span className="outlet-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {outlet.name.replace("MahjongHu ", "")}
                  </span>
                  <strong>{rupiah(Number(outlet.amountIdr))}</strong>
                </div>
                <div className="bar-track">
                  <div style={{ width: `${outlet.barPercent}%` }} />
                </div>
              </div>
            ))}
            {!loading && !summary?.revenueByOutlet.length && (
              <p className="empty">Belum ada outlet.</p>
            )}
          </div>
          <div className="panel-foot">
            Pendapatan dijumlahkan dari pembayaran berhasil di backend.
          </div>
        </section>
        <section className="panel availability">
          <div className="panel-title">
            <div>
              <h2>Kesiapan meja</h2>
              <p>Status operasional terkini dari backend</p>
            </div>
            <Icon index={2} />
          </div>
          <div className="availability-total">
            <strong>{metrics?.availableTableCount ?? 0}</strong>
            <span>
              meja siap
              <br />
              untuk bermain
            </span>
          </div>
          <div className="segmented-bar">
            {tableStatuses.map((status, index) => (
              <div
                key={status}
                className={`segment segment-${index}`}
                style={{ flex: tableCount(status) }}
              />
            ))}
          </div>
          <div className="status-list">
            {tableStatuses.map((status, index) => (
              <div key={status}>
                <span>
                  <i className={`legend-dot segment-${index}`} />
                  {status}
                </span>
                <strong>{tableCount(status)}</strong>
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
            <p>Pembayaran berhasil terakhir di outlet Anda</p>
          </div>
          <Link className="secondary" href="/dashboard/revenue">
            Lihat laporan ↗
          </Link>
        </div>
        <div className="table-scroll">
          <table role="table" aria-label="Transaksi">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col">Transaksi / pelanggan</th>
                <th scope="col">Outlet</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Durasi</th>
                <th scope="col">Pendapatan</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {summary?.transactions.map((transaction) => (
                <tr key={transaction.id} role="row">
                  <td role="cell" data-label="Transaksi / pelanggan">
                    <strong>{transaction.customer}</strong>
                    <small>
                      {transaction.id} · {transaction.tableName}
                    </small>
                  </td>
                  <td role="cell" data-label="Outlet">
                    {transaction.outletName.replace("MahjongHu ", "")}
                  </td>
                  <td role="cell" data-label="Tanggal">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(transaction.settledAt))}
                  </td>
                  <td role="cell" data-label="Durasi">
                    {transaction.hours} jam
                  </td>
                  <td role="cell" data-label="Pendapatan" className="money">
                    {rupiah(Number(transaction.amountIdr))}
                  </td>
                  <td role="cell" data-label="Status">
                    <span className="badge green">
                      <span />
                      Lunas
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !summary?.transactions.length && (
            <div className="empty">
              Tidak ada pembayaran berhasil pada periode ini.
            </div>
          )}
        </div>
      </section>
        </>
      )}
    </>
  );
}
