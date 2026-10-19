"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DateRange, Icon, OutletSelect, PageHeading } from "./components";
import { rupiah } from "./model";
import { getDashboardSummary, type DashboardSummary } from "@/lib/dashboard";
import { useWorkspace } from "./workspace-state";

const tableStatuses = [
  { value: "Tersedia", label: "Available" },
  { value: "Digunakan", label: "In use" },
  { value: "Perawatan", label: "Maintenance" },
] as const;

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
              : "Could not load the summary.",
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
        title="Business overview"
        description="Track your business performance in one place."
        action={
          <div className="date-note">
            <span className="calendar-icon">▦</span> LIVE DATA
            <small>Operational data</small>
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
          Start date must not be after end date.
        </p>
      )}
      {!loading && error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="dashboard-skeleton" role="status" aria-label="Loading dashboard" aria-busy="true">
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
            Total revenue <Icon index={3} />
          </div>
          <h2>{rupiah(Number(metrics?.revenueIdr ?? 0))}</h2>
          <p>
            <span className="stat-dot" /> Successful payments during this period
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
            Tables in use <Icon index={2} />
          </div>
          <h2>
            {metrics?.occupiedTableCount ?? 0}
            <span>/ {metrics?.tableCount ?? 0} tables</span>
          </h2>
          <p>Current operational status</p>
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
      <div className="insights-grid">
        <section className="panel revenue-panel">
          <div className="panel-title">
            <div>
              <h2>Revenue by outlet</h2>
              <p>Contribution during the selected period</p>
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
              <p className="empty">No outlets yet.</p>
            )}
          </div>
          <div className="panel-foot">
            Revenue is calculated from successful backend payments.
          </div>
        </section>
        <section className="panel availability">
          <div className="panel-title">
            <div>
              <h2>Table availability</h2>
              <p>Current operational status from the backend</p>
            </div>
            <Icon index={2} />
          </div>
          <div className="availability-total">
            <strong>{metrics?.availableTableCount ?? 0}</strong>
            <span>
              tables ready
              <br />
              to play
            </span>
          </div>
          <div className="segmented-bar">
            {tableStatuses.map(({ value }, index) => (
              <div
                key={value}
                className={`segment segment-${index}`}
                style={{ flex: tableCount(value) }}
              />
            ))}
          </div>
          <div className="status-list">
            {tableStatuses.map(({ value, label }, index) => (
              <div key={value}>
                <span>
                  <i className={`legend-dot segment-${index}`} />
                  {label}
                </span>
                <strong>{tableCount(value)}</strong>
              </div>
            ))}
          </div>
          <Link className="text-button" href="/dashboard/table">
            Manage all tables <span>↗</span>
          </Link>
        </section>
      </div>
      <section className="panel transactions">
        <div className="panel-title">
          <div>
            <h2>Recent transactions</h2>
            <p>Latest successful payments at your outlets</p>
          </div>
          <Link className="secondary" href="/dashboard/revenue">
            View reports ↗
          </Link>
        </div>
        <div className="table-scroll">
          <table role="table" aria-label="Transactions">
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
              {summary?.transactions.map((transaction) => (
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
                    <span className="badge green">
                      <span />
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !summary?.transactions.length && (
            <div className="empty">
              No successful payments during this period.
            </div>
          )}
        </div>
      </section>
        </>
      )}
    </>
  );
}
