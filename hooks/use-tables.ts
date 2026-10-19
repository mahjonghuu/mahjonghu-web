"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { outletApi } from "../lib/outlet";
import { tableApi } from "../lib/table";
import type { Outlet, MahjongTable } from "../app/dashboard/model";
import { useWorkspace } from "../app/dashboard/workspace-state";

/** Loads persistent table/outlet records and manages table mutations. */
export function useTables() {
  const { outletFilter, setOutletFilter } = useWorkspace();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [tables, setTables] = useState<MahjongTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<MahjongTable | null | undefined>(
    undefined,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  async function refresh() {
    const [outletRecords, tableRecords] = await Promise.all([
      outletApi.list(),
      tableApi.list(),
    ]);
    setOutlets(
      outletRecords.map((outlet) => ({
        id: String(outlet.id),
        name: outlet.name,
        city: outlet.city,
        address: outlet.address,
        active: Boolean(outlet.active ?? outlet.isActive),
        visibility: outlet.visibility,
        openingHour: Number(outlet.openingHour ?? 12),
        closingHour: Number(outlet.closingHour ?? 22),
      })),
    );
    setTables(tableRecords);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([outletApi.list(), tableApi.list()])
      .then(([outletRecords, tableRecords]) => {
        if (cancelled) return;
        setOutlets(
          outletRecords.map((outlet) => ({
            id: String(outlet.id),
            name: outlet.name,
            city: outlet.city,
            address: outlet.address,
            active: Boolean(outlet.active ?? outlet.isActive),
            visibility: outlet.visibility,
            openingHour: Number(outlet.openingHour ?? 12),
            closingHour: Number(outlet.closingHour ?? 22),
          })),
        );
        setTables(tableRecords);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error ? cause.message : "Failed to load tables.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scopedTables = tables.filter(
    (table) => outletFilter === "all" || table.outletId === outletFilter,
  );
  const tableRows = scopedTables.filter((table) => {
    const outlet = outlets.find((item) => item.id === table.outletId);
    return `${table.name} ${outlet?.name ?? "Deleted outlet"}`
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

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor === undefined) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const outletId = String(fields.get("outletId") ?? "");
    const rate = Number(fields.get("rate"));
    const status = String(
      fields.get("status") ??
        (editor?.status === "Digunakan" ? "Digunakan" : ""),
    );
    if (!name) {
      setError("Table name cannot be empty.");
      return;
    }
    if (
      !outlets.some((outlet) => outlet.id === outletId) ||
      !Number.isSafeInteger(rate) ||
      rate <= 0
    ) {
      setError(
        "Select an outlet and enter a positive whole-number rate in rupiah.",
      );
      return;
    }
    if (status === "Digunakan" && editor?.status !== "Digunakan") {
      setError("Occupied status is determined by active reservations.");
      return;
    }
    if (
      status !== "Tersedia" &&
      status !== "Perawatan" &&
      status !== "Digunakan"
    ) {
      setError("Invalid table status.");
      return;
    }
    setSaving(true);
    const editableStatus =
      status === "Tersedia" || status === "Perawatan" ? status : undefined;
    setError("");
    try {
      const input: {
        name: string;
        rate: number;
        status?: "Tersedia" | "Perawatan";
      } = { name, rate };
      if (editableStatus) input.status = editableStatus;
      if (editor) await tableApi.update(editor.id, input);
      else if (editableStatus)
        await tableApi.create({ ...input, status: editableStatus, outletId });
      await refresh();
      setMessage("Table changes saved.");
      closeEditor();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to save table.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeTable(table: MahjongTable) {
    if (table.status === "Digunakan") {
      setMessage("This table is occupied and cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete ${table.name}?`)) return;
    setError("");
    try {
      await tableApi.archive(table.id);
      await refresh();
      setMessage("Table deleted.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to delete table.",
      );
    }
  }

  const outletName = (id: string) =>
    outlets.find((outlet) => outlet.id === id)?.name ?? "Deleted outlet";

  return {
    outlets,
    tables,
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
  };
}
