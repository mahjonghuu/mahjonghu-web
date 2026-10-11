import type { ReactNode } from "react";
import type { Outlet, MahjongTable, Transaction } from "./model";
import { rupiah } from "./model";

const paths = [
  "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  "M3 10h18L19 3H5z M5 10v11h14V10 M9 21v-7h6v7",
  "M3 5h18v12H3z M6 17v4 M18 17v4 M3 9h18",
  "M4 21V12h4v9 M10 21V7h4v14 M16 21V3h4v18",
  "M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2 M16 2v4 M8 2v4 M3 10h18 M8 14h3",
];

/** Renders one of the workspace's inline SVG navigation icons. */
export function Icon({ index = 0 }: { index?: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[index]} />
    </svg>
  );
}

/** Status badge used by workspace summaries and records. */
export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge ${tone}`}>
      <span />
      {children}
    </span>
  );
}

/** Shared heading for each dashboard route. */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">MAHJONGHU WORKSPACE</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Outlet filter for demo-data dashboard pages. */
export function OutletSelect({
  outlets,
  value,
  onChange,
}: {
  outlets: Outlet[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-field">
      <Icon index={1} />
      <select
        aria-label="Filter outlet"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">Semua outlet</option>
        {outlets.map((outlet) => (
          <option key={outlet.id} value={outlet.id}>
            {outlet.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Shared date-range controls for dashboard and revenue views. */
export function DateRange({
  from,
  to,
  setFrom,
  setTo,
}: {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
}) {
  return (
    <div className="date-range">
      <label>
        Dari
        <input
          aria-label="Tanggal mulai"
          type="date"
          value={from}
          max={to}
          onChange={(event) => setFrom(event.target.value)}
        />
      </label>
      <span>—</span>
      <label>
        Sampai
        <input
          aria-label="Tanggal akhir"
          type="date"
          value={to}
          min={from}
          onChange={(event) => setTo(event.target.value)}
        />
      </label>
    </div>
  );
}

/** Renders paid transactions as a responsive, labeled table. */
export function TransactionTable({
  transactions,
  tables,
  outlets,
  limit,
}: {
  transactions: Transaction[];
  tables: MahjongTable[];
  outlets: Outlet[];
  limit?: number;
}) {
  const outletName = (id: string) =>
    outlets.find((outlet) => outlet.id === id)?.name ?? "Outlet dihapus";
  return (
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
          {transactions.slice(0, limit).map((transaction) => (
            <tr key={transaction.id} role="row">
              <td role="cell" data-label="Transaksi / pelanggan">
                <strong>{transaction.customer}</strong>
                <small>
                  {transaction.id} ·{" "}
                  {
                    tables.find((table) => table.id === transaction.tableId)
                      ?.name
                  }
                </small>
              </td>
              <td role="cell" data-label="Outlet">
                {outletName(transaction.outletId).replace("MahjongHu ", "")}
              </td>
              <td role="cell" data-label="Tanggal">
                {new Date(`${transaction.date}T12:00:00`).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </td>
              <td role="cell" data-label="Durasi">
                {transaction.hours} jam
              </td>
              <td role="cell" data-label="Pendapatan" className="money">
                {rupiah(transaction.amount)}
              </td>
              <td role="cell" data-label="Status">
                <Badge>Lunas</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!transactions.length && (
        <div className="empty">
          Tidak ada transaksi pada outlet dan periode ini.
        </div>
      )}
    </div>
  );
}
