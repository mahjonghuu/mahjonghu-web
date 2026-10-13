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
            openingHour: Number(outlet.openingHour ?? 12),
            closingHour: Number(outlet.closingHour ?? 22),
          })),
        );
        setTables(tableRecords);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error ? cause.message : "Gagal memuat meja.",
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
      setError("Nama meja tidak boleh kosong.");
      return;
    }
    if (
      !outlets.some((outlet) => outlet.id === outletId) ||
      !Number.isSafeInteger(rate) ||
      rate <= 0
    ) {
      setError("Pilih outlet dan isi tarif rupiah bulat lebih dari nol.");
      return;
    }
    if (status === "Digunakan" && editor?.status !== "Digunakan") {
      setError("Status Digunakan ditentukan oleh reservasi aktif.");
      return;
    }
    if (
      status !== "Tersedia" &&
      status !== "Perawatan" &&
      status !== "Digunakan"
    ) {
      setError("Status meja tidak valid.");
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
      setMessage("Perubahan meja berhasil disimpan.");
      closeEditor();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan meja.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeTable(table: MahjongTable) {
    if (table.status === "Digunakan") {
      setMessage("Meja sedang digunakan dan tidak dapat dihapus.");
      return;
    }
    if (!window.confirm(`Hapus ${table.name}?`)) return;
    setError("");
    try {
      await tableApi.archive(table.id);
      await refresh();
      setMessage("Meja berhasil dihapus.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menghapus meja.",
      );
    }
  }

  const outletName = (id: string) =>
    outlets.find((outlet) => outlet.id === id)?.name ?? "Outlet dihapus";

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
