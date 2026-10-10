"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  outletApi,
  type OutletApiRecord,
} from "../../lib/outlet";
import { initialData, rupiah, type Outlet, type MahjongTable } from "./model";
import "./workspace.css";

type View = "Dashboard" | "Outlet" | "Meja" | "Laporan pendapatan";
const views: View[] = ["Dashboard", "Outlet", "Meja", "Laporan pendapatan"];
const paths = [
  "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  "M3 10h18L19 3H5z M5 10v11h14V10 M9 21v-7h6v7",
  "M3 5h18v12H3z M6 17v4 M18 17v4 M3 9h18",
  "M4 21V12h4v9 M10 21V7h4v14 M16 21V3h4v18",
];
function Icon({ index = 0 }: { index?: number }) {
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
function Badge({
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

const mapOutlet = (o: OutletApiRecord): Outlet => ({
  id: String(o.id),
  name: o.name,
  city: o.city,
  address: o.address,
  active: Boolean(o.active ?? o.isActive),
  tableCount: Number(o.tableCount ?? 0),
  occupiedTableCount: Number(o.occupiedTableCount ?? 0),
});

/** Outlet management uses the local API; other workspace modules remain demo data. */
export default function Dashboard() {
  const [data, setData] = useState(initialData);
  const [remoteOutlets, setRemoteOutlets] = useState<Outlet[]>([]);
  const [outletLoading, setOutletLoading] = useState(true);
  const [outletSaving, setOutletSaving] = useState(false);
  const [view, setView] = useState<View>("Dashboard");
  const [outletFilter, setOutletFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-10");
  const [editor, setEditor] = useState<
    | { kind: "outlet"; item?: Outlet }
    | { kind: "table"; item?: MahjongTable }
    | null
  >(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOutlets() {
      try {
        const records = await outletApi.list();
        const apiOutlets = records.map(mapOutlet);
        if (!cancelled) setRemoteOutlets(apiOutlets);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Gagal memuat outlet.");
      } finally {
        if (!cancelled) setOutletLoading(false);
      }
    }
    void loadOutlets();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshOutlets() {
    const records = await outletApi.list();
    setRemoteOutlets(records.map(mapOutlet));
  }

  const outlets = view === "Outlet" ? remoteOutlets : data.outlets;
  const { tables, transactions } = data;
  const scopedTables = tables.filter(
    (t) => outletFilter === "all" || t.outletId === outletFilter,
  );
  const scopedTransactions = transactions.filter(
    (t) =>
      (outletFilter === "all" || t.outletId === outletFilter) &&
      t.date >= from &&
      t.date <= to,
  );
  const total = scopedTransactions.reduce((sum, t) => sum + t.amount, 0);
  const occupied = scopedTables.filter((t) => t.status === "Digunakan").length;
  const outletName = (id: string) =>
    outlets.find((o) => o.id === id)?.name ?? "Outlet dihapus";

  function navigate(next: View) {
    if (view === "Outlet" || next === "Outlet") setOutletFilter("all");
    setView(next);
    setQuery("");
    setMessage("");
  }

  function openEditor(next: NonNullable<typeof editor>) {
    setError("");
    setEditor(next);
    dialog.current?.showModal();
  }

  function closeEditor() {
    dialog.current?.close();
    setEditor(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    if (!name) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (editor.kind === "outlet") {
      const city = String(fields.get("city") ?? "").trim();
      const address = String(fields.get("address") ?? "").trim();
      if (!city || !address) {
        setError("Kota dan alamat wajib diisi.");
        return;
      }
      if (
        outlets.some(
          (o) =>
            o.id !== editor.item?.id &&
            o.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        setError("Nama outlet sudah digunakan.");
        return;
      }
      const active = fields.get("active") === "true";
      if (
        !active &&
        tables.some(
          (t) => t.outletId === editor.item?.id && t.status === "Digunakan",
        )
      ) {
        setError("Selesaikan penggunaan meja sebelum menonaktifkan outlet.");
        return;
      }
      setOutletSaving(true);
      setError("");
      try {
        const input = { name, city, address, active };
        if (editor.item) {
          await outletApi.update(editor.item.id, input);
        } else {
          await outletApi.create(input);
        }
        await refreshOutlets();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menyimpan outlet.");
        setOutletSaving(false);
        return;
      }
      setOutletSaving(false);
    } else {
      const outletId = String(fields.get("outletId"));
      const rate = Number(fields.get("rate"));
      const status = String(fields.get("status")) as MahjongTable["status"];
      if (
        !outlets.some((o) => o.id === outletId) ||
        !Number.isSafeInteger(rate) ||
        rate <= 0
      ) {
        setError("Pilih outlet dan isi tarif rupiah bulat lebih dari nol.");
        return;
      }
      if (
        status === "Digunakan" &&
        !outlets.find((o) => o.id === outletId)?.active
      ) {
        setError("Meja tidak dapat digunakan di outlet nonaktif.");
        return;
      }
      if (
        tables.some(
          (t) =>
            t.id !== editor.item?.id &&
            t.outletId === outletId &&
            t.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        setError("Nama meja sudah digunakan di outlet ini.");
        return;
      }
      const record: MahjongTable = {
        id: editor.item?.id ?? crypto.randomUUID(),
        name,
        outletId,
        rate,
        status,
      };
      setData((d) => ({
        ...d,
        tables: editor.item
          ? d.tables.map((t) => (t.id === record.id ? record : t))
          : [...d.tables, record],
      }));
    }
    setMessage(
      editor.kind === "outlet"
        ? "Outlet berhasil disimpan."
        : "Perubahan berhasil disimpan di sesi demo.",
    );
    closeEditor();
  }
  async function removeOutlet(outlet: Outlet) {
    if (!window.confirm(`Arsipkan ${outlet.name}?`)) return;
    setError("");
    try {
      await outletApi.archive(outlet.id);
      await refreshOutlets();
      if (outletFilter === outlet.id) setOutletFilter("all");
      setMessage("Outlet berhasil diarsipkan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengarsipkan outlet.");
    }
  }
  function removeTable(table: MahjongTable) {
    if (
      table.status === "Digunakan" ||
      transactions.some((t) => t.tableId === table.id)
    ) {
      setMessage(
        "Meja digunakan atau memiliki riwayat transaksi dan tidak dapat dihapus. Gunakan status perawatan bila tidak tersedia.",
      );
      return;
    }
    if (!window.confirm(`Hapus ${table.name}?`)) return;
    setData((d) => ({
      ...d,
      tables: d.tables.filter((t) => t.id !== table.id),
    }));
    setMessage("Meja berhasil dihapus.");
  }
  function exportCsv() {
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
      ...scopedTransactions.map((t) => [
        t.id,
        t.date,
        outletName(t.outletId),
        t.customer,
        t.hours,
        t.amount,
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
  const tableRows = scopedTables.filter((t) =>
    `${t.name} ${outletName(t.outletId)}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const outletRows = outlets.filter(
    (o) =>
      (outletFilter === "all" || o.id === outletFilter) &&
      `${o.name} ${o.city} ${o.address}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const revenueRows = outlets
    .filter((o) => outletFilter === "all" || o.id === outletFilter)
    .map((o) => ({
      ...o,
      amount: scopedTransactions
        .filter((t) => t.outletId === o.id)
        .reduce((sum, t) => sum + t.amount, 0),
    }));
  function transactionTable(limit?: number) {
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
            {scopedTransactions.slice(0, limit).map((t) => (
              <tr key={t.id} role="row">
                <td role="cell" data-label="Transaksi / pelanggan">
                  <strong>{t.customer}</strong>
                  <small>
                    {t.id} · {tables.find((m) => m.id === t.tableId)?.name}
                  </small>
                </td>
                <td role="cell" data-label="Outlet">
                  {outletName(t.outletId).replace("MahjongHu ", "")}
                </td>
                <td role="cell" data-label="Tanggal">
                  {new Date(`${t.date}T12:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td role="cell" data-label="Durasi">
                  {t.hours} jam
                </td>
                <td role="cell" data-label="Pendapatan" className="money">
                  {rupiah(t.amount)}
                </td>
                <td role="cell" data-label="Status">
                  <Badge>Lunas</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!scopedTransactions.length && (
          <div className="empty">
            Tidak ada transaksi pada outlet dan periode ini.
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Image
            className="brand-logo"
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={96}
            height={96}
            priority
          />
          <span className="brand-wordmark">
            MahjongHu
            <small>BUSINESS SPACE</small>
          </span>
        </Link>
        <div className="workspace-label">
          WORKSPACE <span>PRO</span>
        </div>
        <nav aria-label="Navigasi internal">
          {views.map((name, index) => (
            <button
              key={name}
              className={view === name ? "nav-item selected" : "nav-item"}
              onClick={() => navigate(name)}
              aria-current={view === name ? "page" : undefined}
            >
              <Icon index={index} />
              {name}
              {name === "Outlet" && (
                <span className="nav-count">{remoteOutlets.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-dot" /> MODE DEMO
            <h3>Ruang untuk eksplorasi.</h3>
            <p>
              Semua data hanya untuk demo. Perubahan akan direset saat refresh.
            </p>
          </div>
          <div className="profile">
            <span className="avatar">AD</span>
            <div>
              <strong>Admin Demo</strong>
              <small>Workspace administrator</small>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <Badge>Frontend PoC</Badge>
            <span className="avatar small-avatar">AD</span>
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">MAHJONGHU WORKSPACE</p>
              <h1>
                {view === "Dashboard"
                  ? "Ringkasan bisnis"
                  : view === "Outlet"
                    ? "Manajemen outlet"
                    : view === "Meja"
                      ? "Manajemen meja"
                      : "Laporan pendapatan"}
              </h1>
              <p>
                {view === "Dashboard"
                  ? "Pantau performa bisnis, dari satu tempat."
                  : view === "Outlet"
                    ? "Kelola lokasi dan operasional seluruh outlet Anda."
                    : view === "Meja"
                      ? "Setiap meja, setiap outlet. Semua dalam kendali."
                      : "Lihat pendapatan dan rincian transaksi bisnis Anda."}
              </p>
            </div>
            {view === "Outlet" || view === "Meja" ? (
              <button
                className="primary"
                disabled={view === "Meja" && !outlets.length}
                onClick={() =>
                  openEditor({ kind: view === "Outlet" ? "outlet" : "table" })
                }
              >
                ＋ Tambah {view.toLowerCase()}
              </button>
            ) : (
              <div className="date-note">
                <span className="calendar-icon">▦</span>
                <span>
                  DATA DEMO<small>Oktober 2026</small>
                </span>
              </div>
            )}
          </div>
          <div className="filterbar">
            <label className="select-field">
              <Icon index={1} />
              <select
                aria-label="Filter outlet"
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
              >
                <option value="all">Semua outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            {view === "Dashboard" || view === "Laporan pendapatan" ? (
              <div className="date-range">
                <label>
                  Dari
                  <input
                    aria-label="Tanggal mulai"
                    type="date"
                    value={from}
                    max={to}
                    onChange={(e) => setFrom(e.target.value)}
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
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <input
                className="search"
                aria-label={`Cari ${view.toLowerCase()}`}
                placeholder={`Cari ${view.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
          </div>
          {from > to &&
            (view === "Dashboard" || view === "Laporan pendapatan") && (
              <p className="notice error" role="alert">
                Tanggal mulai tidak boleh melewati tanggal akhir.
              </p>
            )}
          {message && (
            <div className="notice" role="status">
              {message}
              <button
                onClick={() => setMessage("")}
                aria-label="Tutup pemberitahuan"
              >
                ×
              </button>
            </div>
          )}
          {error && !editor && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <p className="field-help">
            {view === "Outlet"
              ? "Manajemen outlet terhubung ke API lokal. Dashboard, meja, dan laporan masih menggunakan data demo."
              : "Dashboard, meja, dan laporan masih menggunakan data demo."}
          </p>
          {(view === "Dashboard" || view === "Laporan pendapatan") && (
            <>
              <div className="stats-grid">
                <article className="stat-card highlight">
                  <div className="stat-label">
                    Total pendapatan
                    <Icon index={3} />
                  </div>
                  <h2>{rupiah(total)}</h2>
                  <p>
                    <span className="stat-dot" /> Transaksi lunas dalam periode
                  </p>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Transaksi lunas
                    <Icon index={3} />
                  </div>
                  <h2>
                    {scopedTransactions.length}
                    <span>transaksi</span>
                  </h2>
                  <p>
                    {scopedTransactions.reduce((sum, t) => sum + t.hours, 0)}{" "}
                    jam bermain tercatat
                  </p>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    {view === "Dashboard"
                      ? "Meja digunakan"
                      : "Rata-rata transaksi"}
                    <Icon index={2} />
                  </div>
                  <h2>
                    {view === "Dashboard"
                      ? occupied
                      : rupiah(
                          scopedTransactions.length
                            ? total / scopedTransactions.length
                            : 0,
                        )}
                    {view === "Dashboard" && (
                      <span>/ {scopedTables.length} meja</span>
                    )}
                  </h2>
                  <p>
                    {view === "Dashboard"
                      ? "Status operasional saat ini"
                      : "Dari transaksi lunas terfilter"}
                  </p>
                </article>
                <article className="stat-card">
                  <div className="stat-label">
                    Outlet aktif
                    <Icon index={1} />
                  </div>
                  <h2>
                    {
                      outlets.filter(
                        (o) =>
                          o.active &&
                          (outletFilter === "all" || o.id === outletFilter),
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
                    {revenueRows.map((o, i) => (
                      <div className="revenue-row" key={o.id}>
                        <div>
                          <span>
                            <span className="outlet-number">0{i + 1}</span>
                            {o.name.replace("MahjongHu ", "")}
                          </span>
                          <strong>{rupiah(o.amount)}</strong>
                        </div>
                        <div className="bar-track">
                          <div
                            style={{
                              width: `${total ? (o.amount / Math.max(...revenueRows.map((r) => r.amount), 1)) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {!revenueRows.length && (
                      <p className="empty">Belum ada outlet.</p>
                    )}
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
                          (t) =>
                            t.status === "Tersedia" &&
                            outlets.find((o) => o.id === t.outletId)?.active,
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
                    {["Tersedia", "Digunakan", "Perawatan"].map((s, i) => (
                      <div
                        key={s}
                        className={`segment segment-${i}`}
                        style={{
                          flex: scopedTables.filter((t) => t.status === s)
                            .length,
                        }}
                      />
                    ))}
                  </div>
                  <div className="status-list">
                    {["Tersedia", "Digunakan", "Perawatan"].map((s, i) => (
                      <div key={s}>
                        <span>
                          <i className={`legend-dot segment-${i}`} />
                          {s}
                        </span>
                        <strong>
                          {scopedTables.filter((t) => t.status === s).length}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Meja")}
                  >
                    Kelola semua meja <span>↗</span>
                  </button>
                </section>
              </div>
              <section className="panel transactions">
                <div className="panel-title">
                  <div>
                    <h2>
                      {view === "Dashboard"
                        ? "Transaksi terbaru"
                        : "Rincian transaksi"}
                    </h2>
                    <p>
                      {view === "Dashboard"
                        ? "Aktivitas pembayaran terakhir di outlet Anda"
                        : `${scopedTransactions.length} transaksi sesuai filter`}
                    </p>
                  </div>
                  <button
                    className="secondary"
                    disabled={
                      view === "Laporan pendapatan" &&
                      (!scopedTransactions.length || from > to)
                    }
                    onClick={() =>
                      view === "Dashboard"
                        ? navigate("Laporan pendapatan")
                        : exportCsv()
                    }
                  >
                    {view === "Dashboard" ? "Lihat laporan ↗" : "↓ Ekspor CSV"}
                  </button>
                </div>
                {transactionTable(view === "Dashboard" ? 5 : undefined)}
              </section>
            </>
          )}
          {view === "Outlet" && (
            <div className="outlet-grid">
              <>
                {outletLoading && (
                  <p className="panel empty">Memuat outlet dari API…</p>
                )}
                {outletRows.map((o, i) => (
                  <article className="panel outlet-card" key={o.id}>
                    <div className={`outlet-art art-${i % 3}`}>
                      <span className="art-grid" />
                      <span className="art-symbol">胡</span>
                      <span className="art-caption">
                        MAHJONGHU / {o.city.toUpperCase()}
                      </span>
                    </div>
                    <div className="outlet-card-body">
                      <div className="outlet-card-top">
                        <span className="eyebrow">{o.city}</span>
                        <Badge tone={o.active ? "green" : "gray"}>
                          {o.active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <h2>{o.name}</h2>
                      <p>{o.address}</p>
                      <div className="outlet-detail">
                        <span>
                          <Icon index={2} />
                          {o.tableCount ?? 0} meja
                        </span>
                        <span>{o.occupiedTableCount ?? 0} digunakan</span>
                      </div>
                      <div className="card-actions">
                        <button
                          className="secondary"
                          onClick={() =>
                            openEditor({ kind: "outlet", item: o })
                          }
                        >
                          Edit outlet
                        </button>
                        <button className="text-button" disabled>
                          Meja belum terhubung
                        </button>
                        <button
                          className="delete-button"
                          aria-label={`Hapus ${o.name}`}
                          onClick={() => removeOutlet(o)}
                        >
                          Arsipkan
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!outletLoading && !outletRows.length && (
                  <div className="panel empty">
                    Tidak ada outlet. Tambahkan outlet baru atau ubah pencarian.
                  </div>
                )}
              </>
            </div>
          )}
          {view === "Meja" && (
            <section className="panel">
              <div className="panel-title">
                <div>
                  <h2>Daftar meja</h2>
                  <p>
                    {tableRows.length} meja sesuai filter · perubahan status
                    tidak membuat transaksi
                  </p>
                </div>
                <Badge tone="gray">{scopedTables.length} total meja</Badge>
              </div>
              <div className="table-scroll">
                <table role="table" aria-label="Daftar meja">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col">Nama meja</th>
                      <th scope="col">Outlet</th>
                      <th scope="col">Tarif / jam</th>
                      <th scope="col">Status</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {tableRows.map((t) => (
                      <tr key={t.id} role="row">
                        <td role="cell" data-label="Nama meja">
                          <strong className="table-name">
                            <span className="table-icon">
                              <Icon index={2} />
                            </span>
                            {t.name}
                          </strong>
                        </td>
                        <td role="cell" data-label="Outlet">
                          {outletName(t.outletId)}
                          {!outlets.find((o) => o.id === t.outletId)
                            ?.active && <small>Outlet nonaktif</small>}
                        </td>
                        <td
                          role="cell"
                          data-label="Tarif / jam"
                          className="money"
                        >
                          {rupiah(t.rate)}
                        </td>
                        <td role="cell" data-label="Status">
                          <Badge
                            tone={
                              t.status === "Tersedia"
                                ? "green"
                                : t.status === "Digunakan"
                                  ? "blue"
                                  : "amber"
                            }
                          >
                            {t.status}
                          </Badge>
                        </td>
                        <td role="cell" data-label="Aksi">
                          <div className="row-actions">
                            <button
                              className="secondary"
                              onClick={() =>
                                openEditor({ kind: "table", item: t })
                              }
                            >
                              Edit
                              <span className="sr-only">
                                {" "}
                                {t.name} {outletName(t.outletId)}
                              </span>
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => removeTable(t)}
                            >
                              Hapus
                              <span className="sr-only">
                                {" "}
                                {t.name} {outletName(t.outletId)}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!tableRows.length && (
                  <div className="empty">
                    Tidak ada meja. Tambahkan meja atau ubah pencarian.
                  </div>
                )}
              </div>
            </section>
          )}
          <footer className="workspace-footer">
            <span>
              © 2026 MahjongHu. A little strategy, a lot of possibilities.
            </span>
            <span>
              <span className="demo-dot" /> Demo workspace · data nonpersisten
            </span>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialog}
        className="editor-dialog"
        onCancel={() => setEditor(null)}
      >
        {editor && (
          <form
            onSubmit={save}
            key={`${editor.kind}-${editor.item?.id ?? "new"}`}
          >
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h2>
                  {editor.item ? "Edit" : "Tambah"}{" "}
                  {editor.kind === "outlet" ? "outlet" : "meja"}
                </h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={closeEditor}
                aria-label="Tutup form"
              >
                ×
              </button>
            </div>
            <label>
              Nama {editor.kind === "outlet" ? "outlet" : "meja"}
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={editor.item?.name}
                autoFocus
                placeholder={
                  editor.kind === "outlet" ? "MahjongHu Menteng" : "Meja 05"
                }
              />
            </label>
            {editor.kind === "outlet" ? (
              <>
                <label>
                  Kota
                  <input
                    name="city"
                    required
                    maxLength={80}
                    defaultValue={editor.item?.city}
                    placeholder="Jakarta Pusat"
                  />
                </label>
                <label>
                  Alamat
                  <textarea
                    name="address"
                    required
                    maxLength={240}
                    rows={3}
                    defaultValue={editor.item?.address}
                    placeholder="Alamat lengkap outlet"
                  />
                </label>
                <label>
                  Status operasional
                  <select
                    name="active"
                    defaultValue={String(editor.item?.active ?? true)}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label>
                  Outlet
                  <select
                    name="outletId"
                    defaultValue={
                      editor.item?.outletId ??
                      (outletFilter !== "all" ? outletFilter : outlets[0]?.id)
                    }
                    disabled={Boolean(editor.item)}
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  {editor.item && (
                    <input
                      type="hidden"
                      name="outletId"
                      value={editor.item.outletId}
                    />
                  )}
                </label>
                {editor.item && (
                  <p className="field-help">
                    Outlet meja tidak dapat dipindah untuk menjaga konsistensi
                    riwayat.
                  </p>
                )}
                <label>
                  Tarif per jam (Rp)
                  <input
                    name="rate"
                    type="number"
                    required
                    min="1"
                    max="1000000000"
                    step="1"
                    defaultValue={editor.item?.rate ?? 75000}
                  />
                </label>
                <label>
                  Status meja
                  <select
                    name="status"
                    defaultValue={editor.item?.status ?? "Tersedia"}
                  >
                    <option>Tersedia</option>
                    <option>Digunakan</option>
                    <option>Perawatan</option>
                  </select>
                </label>
              </>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              {editor.kind === "outlet"
                ? "Perubahan outlet disimpan melalui API backend lokal."
                : "Data meja demo hanya tersimpan selama sesi ini."}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeEditor}
                disabled={outletSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="primary"
                disabled={editor.kind === "outlet" && outletSaving}
              >
                {outletSaving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
