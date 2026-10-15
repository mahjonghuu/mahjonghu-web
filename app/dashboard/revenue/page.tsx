"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  DateRange,
  Icon,
  OutletSelect,
  PageHeading,
} from "../components";
import { rupiah } from "../model";
import { getRevenueReport, type RevenueReport } from "@/lib/revenue";
import { useWorkspace } from "../workspace-state";

const statuses = ["Tersedia", "Digunakan", "Perawatan"] as const;

/** Displays backend-calculated revenue aggregates and exports matching payments. */
export default function RevenuePage() {
  const { outletFilter, setOutletFilter, from, setFrom, to, setTo } =
    useWorkspace();
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [settledKey, setSettledKey] = useState("");
  const [error, setError] = useState("");
  const requestKey = JSON.stringify([from, to, outletFilter]);
  const loading = settledKey !== requestKey;

  useEffect(() => {
    let active = true;
    getRevenueReport({ from, to, outletId: outletFilter })
      .then((result) => {
        if (!active) return;
        setError("");
        setReport(result);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Laporan pendapatan tidak dapat dimuat.",
          );
        }
      })
      .finally(() => {
        if (active) setSettledKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [from, to, outletFilter, requestKey]);

  function exportCsv() {
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@\\-]/, "'$&")
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
      ...(report?.transactions ?? []).map((transaction) => [
        transaction.id,
        transaction.settledAt,
        transaction.outletName,
        transaction.customer,
        transaction.hours,
        transaction.amountIdr,
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
    link.download = `pendapatan-${from || "semua"}-${to || "semua"}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const metrics = report?.metrics;
  const tableCount = (status: string) =>
    metrics?.tablesByStatus.find((row) => row.status === status)?.count ?? 0;

  return (
    <>
      <PageHeading
        title="Laporan pendapatan"
        description="Lihat pendapatan dan rincian transaksi bisnis Anda."
        action={
          <div className="date-note">
            <span className="calendar-icon">▦</span>
            <span>
              DATA LIVE<small>Data pembayaran backend</small>
            </span>
          </div>
        }
      />
      <div className="filterbar">
        <OutletSelect
          outlets={report?.outlets ?? []}
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
        <div
          className="dashboard-skeleton"
          role="status"
          aria-label="Memuat laporan pendapatan"
          aria-busy="true"
        >
          <div className="dashboard-skeleton-stats">
            {[0, 1, 2, 3].map((item) => (
              <div className="dashboard-skeleton-card" key={item}>
                <i />
                <b />
                <span />
              </div>
            ))}
          </div>
          <div className="dashboard-skeleton-panel dashboard-skeleton-revenue">
            <i />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="dashboard-skeleton-panel dashboard-skeleton-transactions">
            <i />
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : (
        <>
          <p className="field-help">
            Laporan dihitung dari pembayaran berhasil yang tersimpan di backend.
          </p>
          <div className="stats-grid">
            <article className="stat-card highlight">
              <div className="stat-label">
                Total pendapatan <Icon index={3} />
              </div>
              <h2>{rupiah(Number(metrics?.revenueIdr ?? 0))}</h2>
              <p>
                <span className="stat-dot" /> Transaksi lunas dalam periode
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
                Rata-rata transaksi <Icon index={2} />
              </div>
              <h2>{rupiah(metrics?.averageTransactionIdr ?? 0)}</h2>
              <p>Dari transaksi lunas terfilter</p>
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
          <section className="panel revenue-panel">
            <div className="panel-title">
              <div>
                <h2>Pendapatan per outlet</h2>
                <p>Kontribusi pada periode terpilih</p>
              </div>
              <span className="subtle-label">IDR</span>
            </div>
            <div className="revenue-bars">
              {report?.revenueByOutlet.map((outlet, index) => (
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
              {!report?.revenueByOutlet.length && (
                <p className="empty">Belum ada outlet.</p>
              )}
            </div>
            <div className="panel-foot">
              Pendapatan berasal dari pembayaran berhasil, bukan status meja.
            </div>
          </section>
          <section className="panel transactions">
            <div className="panel-title">
              <div>
                <h2>Rincian transaksi</h2>
                <p>
                  {report?.transactions.length ?? 0} transaksi sesuai filter
                </p>
              </div>
              <button
                className="secondary"
                disabled={
                  !report?.transactions.length ||
                  Boolean(from && to && from > to)
                }
                onClick={exportCsv}
              >
                ↓ Ekspor CSV
              </button>
            </div>
            <div className="table-scroll">
              <table role="table" aria-label="Rincian transaksi pendapatan">
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
                  {report?.transactions.map((transaction) => (
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
                        <Badge>Lunas</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report?.transactions.length && (
                <div className="empty">
                  Tidak ada pembayaran berhasil pada periode ini.
                </div>
              )}
            </div>
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
              {statuses.map((status, index) => (
                <div key={status}>
                  <span>
                    <i className={`legend-dot segment-${index}`} />
                    {status}
                  </span>
                  <strong>{tableCount(status)}</strong>
                </div>
              ))}
            </div>
            <Badge tone="gray">{metrics?.tableCount ?? 0} total meja</Badge>
          </section>
        </>
      )}
    </>
  );
}
