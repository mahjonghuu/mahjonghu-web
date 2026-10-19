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
        title="Table management"
        description="Every table, every outlet. All under your control."
        action={
          <button
            className="primary"
            disabled={!outlets.length || loading}
            onClick={() => openEditor()}
          >
            ＋ Add table
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
          aria-label="Search tables"
          placeholder="Search tables…"
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
        Table records and operational statuses are loaded from the backend API.
      </p>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Tables</h2>
            <p>
              {tableRows.length} tables matching filters · changing status does
              not create a transaction
            </p>
          </div>
          <Badge tone="gray">{scopedTables.length} total tables</Badge>
        </div>
        <div className="table-scroll">
          <table role="table" aria-label="Tables">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col">Table name</th>
                <th scope="col">Outlet</th>
                <th scope="col">Rate / hour</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading tables…</td>
                </tr>
              ) : (
                tableRows.map((table) => (
                  <tr key={table.id} role="row">
                    <td role="cell" data-label="Table name">
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
                        ?.active && <small>Inactive outlet</small>}
                    </td>
                    <td role="cell" data-label="Rate / hour" className="money">
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
                        {table.status === "Tersedia" ? "Available" : table.status === "Digunakan" ? "In use" : "Maintenance"}
                      </Badge>
                    </td>
                    <td role="cell" data-label="Actions">
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
                          Delete
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
              No tables found. Add a table or change your search.
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
                <h2>{editor ? "Edit table" : "Add table"}</h2>
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
              Table name
              <input
                name="name"
                required
                maxLength={80}
                defaultValue={editor?.name}
                autoFocus
                placeholder="Table 05"
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
                    A table cannot be moved to another outlet to preserve
                    booking history.
                  </p>
                </>
              )}
            </label>
            <label>
              Hourly rate (Rp)
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
              Table status
              <select
                name="status"
                defaultValue={editor?.status ?? "Tersedia"}
                disabled={editor?.status === "Digunakan"}
              >
                <option value="Tersedia">Available</option>
                {editor?.status === "Digunakan" && <option value="Digunakan">In use</option>}
                <option value="Perawatan">Maintenance</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <p className="field-help">
              In-use status follows active reservations. Tables with booking
              history cannot be deleted.
            </p>
            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={closeEditor}>
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
