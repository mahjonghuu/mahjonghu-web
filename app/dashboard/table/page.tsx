"use client";

import { Badge, Icon, OutletSelect, PageHeading } from "../components";
import { useTables } from "../../../hooks/use-tables";
import { rupiah } from "../model";

/** Manages persistent table records from the backend API. */
export default function TablePage() {
  const {
    outlets,
    scopedTables,
    tableRows,
    outletFilter,
    setOutletFilter,
    loading,
    saving,
    query,
    setQuery,
    editor,
    setEditor,
    message,
    setMessage,
    error,
    dialog,
    openEditor,
    closeEditor,
    save,
    removeTable,
    outletName,
  } = useTables();
  return (
    <>
      <PageHeading
        title="Manajemen meja"
        description="Setiap meja, setiap outlet. Semua dalam kendali."
        action={
          <button
            className="primary"
            disabled={!outlets.length || loading}
            onClick={() => openEditor()}
          >
            ＋ Tambah meja
          </button>
        }
      />
      <div className="filterbar">
        <OutletSelect
          outlets={outlets}
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
        Data meja dan status operasional dimuat dari API backend.
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
              {loading ? (
                <tr>
                  <td colSpan={5}>Memuat meja…</td>
                </tr>
              ) : (
                tableRows.map((table) => (
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
                      {!outlets.find((outlet) => outlet.id === table.outletId)
                        ?.active && <small>Outlet nonaktif</small>}
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
                ))
              )}
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
                  (outletFilter !== "all" ? outletFilter : outlets[0]?.id)
                }
                disabled={Boolean(editor)}
              >
                {outlets.map((outlet) => (
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
              <select
                name="status"
                defaultValue={editor?.status ?? "Tersedia"}
                disabled={editor?.status === "Digunakan"}
              >
                <option>Tersedia</option>
                {editor?.status === "Digunakan" && <option>Digunakan</option>}
                <option>Perawatan</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              Status Digunakan mengikuti reservasi aktif. Meja dengan riwayat
              reservasi tidak dapat dihapus.
            </p>
            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={closeEditor}>
                Batal
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan perubahan"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
