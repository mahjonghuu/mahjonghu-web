"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { employeeApi, type EmployeeRecord } from "../lib/employee";
import { useWorkspace } from "../app/dashboard/workspace-state";

/** Loads employee records and owns create, reassign, and activation mutations. */
export function useEmployees() {
  const { data } = useWorkspace();
  const outlets = data.outlets;
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [outletFilter, setOutletFilter] = useState("all");
  const [editor, setEditor] = useState<EmployeeRecord | null | undefined>(
    undefined,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  async function refresh() {
    setEmployees(await employeeApi.list());
  }

  useEffect(() => {
    let active = true;
    employeeApi
      .list()
      .then((records) => {
        if (active) setEmployees(records);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to load employees.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    if (outletFilter !== "all" && employee.outletId !== outletFilter) {
      return false;
    }
    return `${employee.email} ${employee.outletName}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  function openEditor(employee?: EmployeeRecord) {
    setError("");
    setEditor(employee ?? null);
    dialog.current?.showModal();
  }

  function closeEditor() {
    dialog.current?.close();
    setEditor(undefined);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor === undefined) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    const outletId = String(fields.get("outletId") ?? "");
    const isActive = fields.get("isActive") === "on";
    if (!email) {
      setError("Enter the employee email.");
      return;
    }
    if (!outlets.some((outlet) => outlet.id === outletId)) {
      setError("Select an outlet.");
      return;
    }
    if (!editor && password.length < 8) {
      setError("The temporary password must be at least 8 characters.");
      return;
    }
    if (password && password.length > 72) {
      setError("The password must be at most 72 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editor) {
        await employeeApi.update(editor.id, {
          email,
          outletId,
          isActive,
          ...(password ? { password } : {}),
        });
        setMessage("Employee access updated.");
      } else {
        await employeeApi.create({ email, password, outletId });
        setMessage("Employee access created.");
      }
      await refresh();
      closeEditor();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to save employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(employee: EmployeeRecord) {
    if (!window.confirm(`Deactivate ${employee.email}?`)) return;
    setError("");
    try {
      await employeeApi.deactivate(employee.id);
      await refresh();
      setMessage("Employee access deactivated.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to deactivate employee.",
      );
    }
  }

  async function reactivate(employee: EmployeeRecord) {
    setError("");
    try {
      await employeeApi.update(employee.id, { isActive: true });
      await refresh();
      setMessage("Employee access reactivated.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to reactivate employee.",
      );
    }
  }

  return {
    outlets,
    employees,
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
  };
}
