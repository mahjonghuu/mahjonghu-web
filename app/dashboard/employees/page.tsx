"use client";

import { Badge, Icon, OutletSelect, PageHeading } from "../components";
import { useEmployees } from "../../../hooks/use-employees";

/** Owner controls for provisioning employees and assigning one outlet each. */
export default function EmployeesPage() {
  const {
    outlets,
    filteredEmployees,
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
    deactivate,
    reactivate,
  } = useEmployees();

  return (
    <>
      <PageHeading
        title="Employee access"
        description="Give each employee an account and exactly one outlet."
        action={
          <button
            className="primary"
            disabled={!outlets.length || loading}
            onClick={() => openEditor()}
          >
            ＋ Add employee
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
          aria-label="Search employees"
          placeholder="Search employees…"
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
        Employees can view customer booking history for their assigned outlet
        only. Deactivated accounts keep their history.
      </p>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Employees</h2>
            <p>
              {filteredEmployees.length} accounts matching filters · one outlet
              per employee
            </p>
          </div>
          <Badge tone="gray">{filteredEmployees.length} employees</Badge>
        </div>
        <div className="table-scroll">
          <table role="table" aria-label="Employees">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col">Employee</th>
                <th scope="col">Outlet</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {loading ? (
                <tr>
                  <td colSpan={4}>Loading employees…</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} role="row">
                    <td role="cell" data-label="Employee">
                      <strong className="table-name">
                        <span className="table-icon">
                          <Icon index={5} />
                        </span>
                        {employee.email}
                      </strong>
                    </td>
                    <td role="cell" data-label="Outlet">
                      {employee.outletName}
                      {!outlets.find(
                        (outlet) => outlet.id === employee.outletId,
                      )?.active && <small>Inactive outlet</small>}
                    </td>
                    <td role="cell" data-label="Status">
                      <Badge tone={employee.isActive ? "green" : "gray"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td role="cell" data-label="Actions">
                      <div className="row-actions">
                        <button
                          className="secondary"
                          onClick={() => openEditor(employee)}
                        >
                          Edit
                          <span className="sr-only"> {employee.email}</span>
                        </button>
                        {employee.isActive ? (
                          <button
                            className="delete-button"
                            onClick={() => void deactivate(employee)}
                          >
                            Deactivate
                            <span className="sr-only"> {employee.email}</span>
                          </button>
                        ) : (
                          <button
                            className="secondary"
                            onClick={() => void reactivate(employee)}
                          >
                            Reactivate
                            <span className="sr-only"> {employee.email}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && !filteredEmployees.length && (
            <div className="empty">
              No employees found. Add an employee or change your filters.
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
          <form onSubmit={save} key={editor?.id ?? "new-employee"}>
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h2>{editor ? "Edit employee" : "Add employee"}</h2>
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
              Employee email
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue={editor?.email}
                autoFocus
                placeholder="employee@example.com"
              />
            </label>
            <label>
              {editor ? "New password (optional)" : "Temporary password"}
              <input
                name="password"
                type="password"
                required={!editor}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                placeholder={
                  editor
                    ? "Leave blank to keep the current password"
                    : "At least 8 characters"
                }
              />
              <span className="field-help">
                Share this password with the employee. It is hashed before
                storage.
              </span>
            </label>
            <label>
              Outlet
              <select
                name="outletId"
                required
                defaultValue={
                  editor?.outletId ??
                  (outletFilter !== "all" ? outletFilter : outlets[0]?.id)
                }
              >
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <span className="field-help">
                Moving an employee immediately changes the outlet they can
                access.
              </span>
            </label>
            {editor && (
              <label>
                <span>
                  <input
                    name="isActive"
                    type="checkbox"
                    defaultChecked={editor.isActive}
                  />{" "}
                  Account active
                </span>
              </label>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
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
