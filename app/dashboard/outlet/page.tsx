"use client";

import { Badge, Icon, PageHeading } from "../components";
import { useOutlets } from "@/hooks/use-outlets";

/** Lists and manages outlets through the backend API. */
export default function OutletPage() {
  const {
    outlets,
    filteredOutlets,
    loading,
    saving,
    query,
    setQuery,
    filter,
    setFilter,
    editor,
    message,
    setMessage,
    error,
    dialog,
    openEditor,
    closeEditor,
    save,
    archive,
    setEditor,
  } = useOutlets();

  return (
    <>
      <PageHeading
        title="Manajemen outlet"
        description="Kelola lokasi dan operasional seluruh outlet Anda."
        action={
          <button className="primary" onClick={() => openEditor()}>
            ＋ Tambah outlet
          </button>
        }
      />
      <div className="filterbar">
        <label className="select-field">
          <Icon index={1} />
          <select
            aria-label="Filter outlet"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Semua outlet</option>
            {outlets.map((outlet) => (
              <option value={outlet.id} key={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
        <input
          className="search"
          aria-label="Cari outlet"
          placeholder="Cari outlet…"
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
        Manajemen outlet terhubung ke API lokal. Data meja dan laporan masih
        demo.
      </p>
      <div className="outlet-grid">
        {loading && <p className="panel empty">Memuat outlet dari API…</p>}
        {filteredOutlets.map((outlet, index) => (
          <article className="panel outlet-card" key={outlet.id}>
            <div className={`outlet-art art-${index % 3}`}>
              <span className="art-grid" />
              <span className="art-symbol">胡</span>
              <span className="art-caption">
                MAHJONGHU / {outlet.city.toUpperCase()}
              </span>
            </div>
            <div className="outlet-card-body">
              <div className="outlet-card-top">
                <span className="eyebrow">{outlet.city}</span>
                <Badge tone={outlet.active ? "green" : "gray"}>
                  {outlet.active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <h2>{outlet.name}</h2>
              <p>{outlet.address}</p>
              <div className="outlet-detail">
                <span>
                  <Icon index={2} /> {outlet.tableCount ?? 0} meja
                </span>
                <span>{outlet.occupiedTableCount ?? 0} digunakan</span>
              </div>
              <div className="card-actions">
                <button
                  className="secondary"
                  onClick={() => openEditor(outlet)}
                >
                  Edit outlet
                </button>
                <button className="text-button" disabled>
                  Meja belum terhubung
                </button>
                <button
                  className="delete-button"
                  aria-label={`Arsipkan ${outlet.name}`}
                  onClick={() => void archive(outlet)}
                >
                  Arsipkan
                </button>
              </div>
            </div>
          </article>
        ))}
        {!loading && !filteredOutlets.length && (
          <div className="panel empty">
            Tidak ada outlet. Tambahkan outlet baru atau ubah pencarian.
          </div>
        )}
      </div>
      <dialog
        ref={dialog}
        className="editor-dialog"
        onCancel={() => setEditor(undefined)}
      >
        {editor !== undefined && (
          <form onSubmit={save} key={editor?.id ?? "new-outlet"}>
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h2>{editor ? "Edit outlet" : "Tambah outlet"}</h2>
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
              Nama outlet
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={editor?.name}
                autoFocus
                placeholder="MahjongHu Menteng"
              />
            </label>
            <label>
              Kota
              <input
                name="city"
                required
                maxLength={80}
                defaultValue={editor?.city}
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
                defaultValue={editor?.address}
                placeholder="Alamat lengkap outlet"
              />
            </label>
            <label>
              Status operasional
              <select
                name="active"
                defaultValue={String(editor?.active ?? true)}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              Perubahan outlet disimpan melalui API lokal.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeEditor}
                disabled={saving}
              >
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
