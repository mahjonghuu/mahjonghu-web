"use client";

import { useRef, useState, type FormEvent } from "react";
import { Badge, Icon, OutletSelect, PageHeading } from "../components";
import { rupiah, type MahjongTable } from "../model";
import { useWorkspace } from "../workspace-state";

/** Manages demo table state shared with the dashboard until refresh. */
export default function TablePage() {
  const { data, setData, outletFilter, setOutletFilter } = useWorkspace();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<MahjongTable | null | undefined>(
    undefined,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const scopedTables = data.tables.filter(
    (table) => outletFilter === "all" || table.outletId === outletFilter,
  );
  const tableRows = scopedTables.filter((table) => {
    const outlet = data.outlets.find((item) => item.id === table.outletId);
    return `${table.name} ${outlet?.name ?? "Outlet dihapus"}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  function openEditor(table?: MahjongTable) {
    setError("");
    setEditor(table ?? null);
    dialog.current?.showModal();
  }

  function closeEditor() {
    dialog.current?.close();
    setEditor(undefined);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor === undefined) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const outletId = String(fields.get("outletId") ?? "");
    const rate = Number(fields.get("rate"));
    const status = String(fields.get("status")) as MahjongTable["status"];
    if (!name) {
      setError("Nama meja tidak boleh kosong.");
      return;
    }
    if (
      !data.outlets.some((outlet) => outlet.id === outletId) ||
      !Number.isSafeInteger(rate) ||
      rate <= 0
    ) {
      setError("Pilih outlet dan isi tarif rupiah bulat lebih dari nol.");
      return;
    }
    if (
      status === "Digunakan" &&
      !data.outlets.find((outlet) => outlet.id === outletId)?.active
    ) {
      setError("Meja tidak dapat digunakan di outlet nonaktif.");
      return;
    }
    if (
      data.tables.some(
        (table) =>
          table.id !== editor?.id &&
          table.outletId === outletId &&
          table.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("Nama meja sudah digunakan di outlet ini.");
      return;
    }

    const record: MahjongTable = {
      id: editor?.id ?? crypto.randomUUID(),
      name,
      outletId,
      rate,
      status,
    };
    setData((current) => ({
      ...current,
      tables: editor
        ? current.tables.map((table) =>
            table.id === record.id ? record : table,
          )
        : [...current.tables, record],
    }));
    setMessage("Perubahan berhasil disimpan di sesi demo.");
    closeEditor();
  }

  function removeTable(table: MahjongTable) {
    if (
      table.status === "Digunakan" ||
      data.transactions.some((transaction) => transaction.tableId === table.id)
    ) {
      setMessage(
        "Meja digunakan atau memiliki riwayat transaksi dan tidak dapat dihapus. Gunakan status perawatan bila tidak tersedia.",
      );
      return;
    }
    if (!window.confirm(`Hapus ${table.name}?`)) return;
    setData((current) => ({
      ...current,
      tables: current.tables.filter((item) => item.id !== table.id),
    }));
    setMessage("Meja berhasil dihapus.");
  }

  const outletName = (id: string) =>
    data.outlets.find((outlet) => outlet.id === id)?.name ?? "Outlet dihapus";

  return (
    <>
      <PageHeading
        title="Manajemen meja"
        description="Setiap meja, setiap outlet. Semua dalam kendali."
        action={
          <button
            className="primary"
            disabled={!data.outlets.length}
            onClick={() => openEditor()}
          >
            ＋ Tambah meja
          </button>
        }
      />
      <div className="filterbar">
        <OutletSelect
          outlets={data.outlets}
          value={outletFilter}
          onChange={setOutletFilter}
        />
        <input
          className="search"
          aria-label="Cari meja"
          placeholder="Cari meja…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
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
      {error && editor === undefined && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <p className="field-help">
        Dashboard, meja, dan laporan masih menggunakan data demo.
      </p>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Daftar meja</h2>
            <p>
              {tableRows.length} meja sesuai filter · perubahan status tidak
              membuat transaksi
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
              {tableRows.map((table) => (
                <tr key={table.id} role="row">
                  <td role="cell" data-label="Nama meja">
                    <strong className="table-name">
                      <span className="table-icon">
                        <Icon index={2} />
                      </span>
                      {table.name}
                    </strong>
                  </td>
                  <td role="cell" data-label="Outlet">
                    {outletName(table.outletId)}
                    {!data.outlets.find(
                      (outlet) => outlet.id === table.outletId,
                    )?.active && <small>Outlet nonaktif</small>}
                  </td>
                  <td role="cell" data-label="Tarif / jam" className="money">
                    {rupiah(table.rate)}
                  </td>
                  <td role="cell" data-label="Status">
                    <Badge
                      tone={
                        table.status === "Tersedia"
                          ? "green"
                          : table.status === "Digunakan"
                            ? "blue"
                            : "amber"
                      }
                    >
                      {table.status}
                    </Badge>
                  </td>
                  <td role="cell" data-label="Aksi">
                    <div className="row-actions">
                      <button
                        className="secondary"
                        onClick={() => openEditor(table)}
                      >
                        Edit
                        <span className="sr-only">
                          {` ${table.name} ${outletName(table.outletId)}`}
                        </span>
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => removeTable(table)}
                      >
                        Hapus
                        <span className="sr-only"> {table.name}</span>
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
      <dialog
        ref={dialog}
        className="editor-dialog"
        onCancel={() => setEditor(undefined)}
      >
        {editor !== undefined && (
          <form onSubmit={save} key={editor?.id ?? "new-table"}>
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h2>{editor ? "Edit meja" : "Tambah meja"}</h2>
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
              Nama meja
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={editor?.name}
                autoFocus
                placeholder="Meja 05"
              />
            </label>
            <label>
              Outlet
              <select
                name="outletId"
                defaultValue={
                  editor?.outletId ??
                  (outletFilter !== "all" ? outletFilter : data.outlets[0]?.id)
                }
                disabled={Boolean(editor)}
              >
                {data.outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              {editor && (
                <>
                  <input
                    type="hidden"
                    name="outletId"
                    value={editor.outletId}
                  />
                  <p className="field-help">
                    Outlet meja tidak dapat dipindah untuk menjaga konsistensi
                    riwayat.
                  </p>
                </>
              )}
            </label>
            <label>
              Tarif per jam (Rp)
              <input
                name="rate"
                type="number"
                required
                min="1"
                max="1000000000"
                step="1"
                defaultValue={editor?.rate ?? 75000}
              />
            </label>
            <label>
              Status meja
              <select name="status" defaultValue={editor?.status ?? "Tersedia"}>
                <option>Tersedia</option>
                <option>Digunakan</option>
                <option>Perawatan</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              Data meja demo hanya tersimpan selama sesi ini.
            </p>
            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={closeEditor}>
                Batal
              </button>
              <button type="submit" className="primary">
                Simpan perubahan
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
