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

const statuses = [
  { value: "Tersedia", label: "Available" },
  { value: "Digunakan", label: "In use" },
  { value: "Perawatan", label: "Maintenance" },
] as const;

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
              : "Could not load the revenue report.",
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
        "Date",
        "Outlet",
        "Customer",
        "Duration (hours)",
        "Revenue (IDR)",
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
    link.download = `revenue-${from || "all"}-${to || "all"}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const metrics = report?.metrics;
  const tableCount = (status: string) =>
    metrics?.tablesByStatus.find((row) => row.status === status)?.count ?? 0;

  return (
    <>
      <PageHeading
        title="Revenue reports"
        description="Review your business revenue and transaction details."
        action={
          <div className="date-note">
            <span className="calendar-icon">▦</span>
            <span>
              LIVE DATA<small>Backend payment data</small>
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
          Start date must not be after end date.
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
          aria-label="Loading revenue report"
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
            Reports are calculated from successful payments saved in the backend.
          </p>
          <div className="stats-grid">
            <article className="stat-card highlight">
              <div className="stat-label">
                Total revenue <Icon index={3} />
              </div>
              <h2>{rupiah(Number(metrics?.revenueIdr ?? 0))}</h2>
              <p>
                <span className="stat-dot" /> Paid transactions during this period
              </p>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                Paid transactions <Icon index={3} />
              </div>
              <h2>
                {metrics?.paidTransactionCount ?? 0}
                <span>transactions</span>
              </h2>
              <p>{metrics?.playedHours ?? 0} playing hours recorded</p>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                Average transaction <Icon index={2} />
              </div>
              <h2>{rupiah(metrics?.averageTransactionIdr ?? 0)}</h2>
              <p>For filtered paid transactions</p>
            </article>
            <article className="stat-card">
              <div className="stat-label">
                Active outlets <Icon index={1} />
              </div>
              <h2>
                {metrics?.activeOutletCount ?? 0}
                <span>outlet</span>
              </h2>
              <p>Ready to welcome customers</p>
            </article>
          </div>
          <section className="panel revenue-panel">
            <div className="panel-title">
              <div>
                <h2>Revenue by outlet</h2>
                <p>Contribution during the selected period</p>
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
                <p className="empty">No outlets yet.</p>
              )}
            </div>
            <div className="panel-foot">
              Revenue comes from successful payments, not table status.
            </div>
          </section>
          <section className="panel transactions">
            <div className="panel-title">
              <div>
                <h2>Transaction details</h2>
                <p>
                  {report?.transactions.length ?? 0} transactions matching filters
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
                ↓ Export CSV
              </button>
            </div>
            <div className="table-scroll">
              <table role="table" aria-label="Revenue transaction details">
                <thead role="rowgroup">
                  <tr role="row">
                    <th scope="col">Transaction / customer</th>
                    <th scope="col">Outlet</th>
                    <th scope="col">Date</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Revenue</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {report?.transactions.map((transaction) => (
                    <tr key={transaction.id} role="row">
                      <td role="cell" data-label="Transaction / customer">
                        <strong>{transaction.customer}</strong>
                        <small>
                          {transaction.id} · {transaction.tableName}
                        </small>
                      </td>
                      <td role="cell" data-label="Outlet">
                        {transaction.outletName.replace("MahjongHu ", "")}
                      </td>
                      <td role="cell" data-label="Date">
                        {new Intl.DateTimeFormat("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        }).format(new Date(transaction.settledAt))}
                      </td>
                      <td role="cell" data-label="Duration">
                        {transaction.hours} hours
                      </td>
                      <td role="cell" data-label="Revenue" className="money">
                        {rupiah(Number(transaction.amountIdr))}
                      </td>
                      <td role="cell" data-label="Status">
                        <Badge>Paid</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report?.transactions.length && (
                <div className="empty">
                  No successful payments during this period.
                </div>
              )}
            </div>
          </section>
          <section className="panel availability">
            <div className="panel-title">
              <div>
                <h2>Table availability</h2>
                <p>Current operational status</p>
              </div>
              <Icon index={2} />
            </div>
            <div className="status-list">
              {statuses.map(({ value, label }, index) => (
                <div key={value}>
                  <span>
                    <i className={`legend-dot segment-${index}`} />
                    {label}
                  </span>
                  <strong>{tableCount(value)}</strong>
                </div>
              ))}
            </div>
            <Badge tone="gray">{metrics?.tableCount ?? 0} total tables</Badge>
          </section>
        </>
      )}
    </>
  );
}
