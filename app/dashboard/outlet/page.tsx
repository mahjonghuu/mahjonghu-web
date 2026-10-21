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
            cause instanceof Error ? cause.message : "Could not load access.",
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
      setError("Expiry must be in the future.");
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
        cause instanceof Error ? cause.message : "Could not grant access.",
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
        cause instanceof Error ? cause.message : "Could not revoke access.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="access-manager">
      <p className="field-help">
        Only customers making a booking need access; accompanying guests do not
        need to sign in.
      </p>
      <form onSubmit={(event) => void grant(event)}>
        <label>
          Member email{" "}
          <input
            name="email"
            type="email"
            required
            placeholder="member@email.com"
          />
        </label>
        <label>
          Expires at (optional){" "}
          <input name="expiresAt" type="datetime-local" />
        </label>
        <button className="secondary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Grant access"}
        </button>
      </form>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading members…</p>
      ) : error && !grants.length ? null : grants.length ? (
        <ul>
          {grants.map((entry) => (
            <li key={entry.userId}>
              <span>
                {entry.email} ·{" "}
                {entry.expiresAt
                  ? `Until ${new Date(entry.expiresAt).toLocaleString("en-US")}`
                  : "No expiry"}
              </span>
              <button
                className="delete-button"
                type="button"
                disabled={saving}
                onClick={() => void revoke(entry.userId)}
                aria-label={`Revoke access for ${entry.email}`}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No members have access yet.</p>
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
        title="Outlet management"
        description="Manage locations and operations across all your outlets."
        action={
          <button className="primary" onClick={() => openEditor()}>
            ＋ Add outlet
          </button>
        }
      />
      <div className="filterbar">
        <label className="select-field">
          <Icon index={1} />
          <select
            aria-label="Filter outlets"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All outlets</option>
            {outlets.map((outlet) => (
              <option value={outlet.id} key={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
        <input
          className="search"
          aria-label="Search outlets"
          placeholder="Search outlets…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss notification"
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
        Outlet management is connected to the local API. Table records and
        reports also use backend data.
      </p>
      <div className="outlet-grid">
        {loading && <p className="panel empty">Loading outlets from API…</p>}
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
                  {outlet.active ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  tone={outlet.visibility === "private" ? "gray" : "green"}
                >
                  {outlet.visibility === "private"
                    ? "Members only"
                    : "Public"}
                </Badge>
              </div>
              <h2>{outlet.name}</h2>
              <p>{outlet.address}</p>
              <div className="outlet-detail">
                <span>
                  <Icon index={2} /> {outlet.tableCount ?? 0} tables
                </span>
                <span>{outlet.occupiedTableCount ?? 0} in use</span>
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
                  Manage access
                </button>
                <button className="text-button" disabled>
                  Tables not connected
                </button>
                <button
                  className="delete-button"
                  aria-label={`Archive ${outlet.name}`}
                  onClick={() => void archive(outlet)}
                >
                  Archive
                </button>
              </div>
            </div>
          </article>
        ))}
        {!loading && !filteredOutlets.length && (
          <div className="panel empty">
            No outlets found. Add an outlet or change your search.
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
                  Member access · {outlets.find((outlet) => outlet.id === accessOutletId)?.name}
                </h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => accessDialog.current?.close()}
                aria-label="Close member access"
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
                <h2>{editor ? "Edit outlet" : "Add outlet"}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={closeEditor}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <label>
              Outlet name
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
              City
              <input
                name="city"
                required
                maxLength={80}
                defaultValue={editor?.city}
                placeholder="Jakarta Pusat"
              />
            </label>
            <label>
              Address
              <textarea
                name="address"
                required
                maxLength={240}
                rows={3}
                defaultValue={editor?.address}
                placeholder="Full outlet address"
              />
            </label>
            <label>
              Operational status
              <select
                name="active"
                defaultValue={String(editor?.active ?? true)}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label>
              Visibility
              <select
                name="visibility"
                defaultValue={editor?.visibility ?? "public"}
              >
                <option value="public">Public — all customers</option>
                <option value="private">Private — registered members</option>
              </select>
            </label>
            <label>
              Opening hour
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
              Closing hour
              <select
                name="closingHour"
                defaultValue={String(editor?.closingHour ?? 22)}
                required
              >
                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                  <option key={hour} value={hour}>
                    {String(hour % 24).padStart(2, "0")}:00
                    {hour === 24 ? " (end of day)" : hour === 0 ? " (next day if after opening)" : " (next day if before opening)"}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              Outlet changes are saved through the local API.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeEditor}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
