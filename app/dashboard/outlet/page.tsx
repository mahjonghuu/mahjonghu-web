"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { outletApi, type OutletAccessRecord } from "@/lib/outlet";
import { Badge, Icon, PageHeading } from "../components";
import { useOutlets } from "@/hooks/use-outlets";

/** Owner controls for listing, granting, and revoking member access. */
function AccessManager({ outletId }: { outletId: string }) {
  const [grants, setGrants] = useState<OutletAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    outletApi
      .access(outletId)
      .then((records) => {
        if (active) setGrants(records);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Gagal memuat akses.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [outletId]);

  async function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const expiry = String(fields.get("expiresAt") ?? "");
    const expiryDate = expiry ? new Date(expiry) : null;
    if (
      expiryDate &&
      (!Number.isFinite(expiryDate.getTime()) ||
        expiryDate.getTime() <= Date.now())
    ) {
      setError("Masa berlaku harus di masa depan.");
      return;
    }
    const expiresAt = expiryDate?.toISOString();
    setSaving(true);
    setError("");
    try {
      await outletApi.grantAccess(outletId, email, expiresAt);
      setGrants(await outletApi.access(outletId));
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal memberikan akses.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function revoke(userId: string) {
    setSaving(true);
    setError("");
    try {
      await outletApi.revokeAccess(outletId, userId);
      setGrants(await outletApi.access(outletId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal mencabut akses.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="access-manager">
      <p className="field-help">
        Hanya pelanggan yang membuat booking perlu akses; teman yang ikut tidak
        perlu login.
      </p>
      <form onSubmit={(event) => void grant(event)}>
        <label>
          Email anggota{" "}
          <input
            name="email"
            type="email"
            required
            placeholder="anggota@email.com"
          />
        </label>
        <label>
          Berlaku sampai (opsional){" "}
          <input name="expiresAt" type="datetime-local" />
        </label>
        <button className="secondary" type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Berikan akses"}
        </button>
      </form>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Memuat daftar anggota…</p>
      ) : error && !grants.length ? null : grants.length ? (
        <ul>
          {grants.map((entry) => (
            <li key={entry.userId}>
              <span>
                {entry.email} ·{" "}
                {entry.expiresAt
                  ? `Sampai ${new Date(entry.expiresAt).toLocaleString("id-ID")}`
                  : "Tanpa batas waktu"}
              </span>
              <button
                className="delete-button"
                type="button"
                disabled={saving}
                onClick={() => void revoke(entry.userId)}
                aria-label={`Cabut akses ${entry.email}`}
              >
                Cabut
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Belum ada anggota dengan akses.</p>
      )}
    </div>
  );
}

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
  const [accessOutletId, setAccessOutletId] = useState<string | null>(null);
  const accessDialog = useRef<HTMLDialogElement>(null);

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
                <Badge
                  tone={outlet.visibility === "private" ? "gray" : "green"}
                >
                  {outlet.visibility === "private"
                    ? "Khusus anggota"
                    : "Publik"}
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
                <button
                  className="secondary"
                  onClick={() => {
                    setAccessOutletId(outlet.id);
                    accessDialog.current?.showModal();
                  }}
                >
                  Kelola akses
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
        ref={accessDialog}
        className="editor-dialog access-dialog"
        aria-labelledby="access-dialog-title"
        onClose={() => setAccessOutletId(null)}
      >
        {accessOutletId && (
          <div className="access-dialog-inner">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h2 id="access-dialog-title">
                  Akses anggota · {outlets.find((outlet) => outlet.id === accessOutletId)?.name}
                </h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => accessDialog.current?.close()}
                aria-label="Tutup akses anggota"
              >
                ×
              </button>
            </div>
            <AccessManager key={accessOutletId} outletId={accessOutletId} />
          </div>
        )}
      </dialog>
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
            <label>
              Visibilitas
              <select
                name="visibility"
                defaultValue={editor?.visibility ?? "public"}
              >
                <option value="public">Publik — semua pelanggan</option>
                <option value="private">Privat — anggota terdaftar</option>
              </select>
            </label>
            <label>
              Jam buka
              <select
                name="openingHour"
                defaultValue={String(editor?.openingHour ?? 12)}
                required
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jam tutup
              <select
                name="closingHour"
                defaultValue={String(editor?.closingHour ?? 22)}
                required
              >
                {Array.from({ length: 24 }, (_, index) => index + 1).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {String(hour % 24).padStart(2, "0")}:00
                    </option>
                  ),
                )}
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
