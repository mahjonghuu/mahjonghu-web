"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { outletApi, type OutletApiRecord } from "@/lib/outlet";
import type { Outlet } from "@/app/dashboard/model";

const toOutlet = (outlet: OutletApiRecord): Outlet => ({
  id: String(outlet.id),
  name: outlet.name,
  city: outlet.city,
  address: outlet.address,
  active: Boolean(outlet.active ?? outlet.isActive),
  tableCount: Number(outlet.tableCount ?? 0),
  occupiedTableCount: Number(outlet.occupiedTableCount ?? 0),
});

/** Owns outlet loading, filtering, editing, and API mutations. */
export function useOutlets() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState<Outlet | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let cancelled = false;
    void outletApi
      .list()
      .then((records) => {
        if (!cancelled) setOutlets(records.map(toOutlet));
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error ? cause.message : "Gagal memuat outlet.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshOutlets() {
    setOutlets((await outletApi.list()).map(toOutlet));
  }

  function openEditor(outlet?: Outlet) {
    setError("");
    setEditor(outlet ?? null);
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
    const city = String(fields.get("city") ?? "").trim();
    const address = String(fields.get("address") ?? "").trim();
    const active = fields.get("active") === "true";
    if (!name || !city || !address) {
      setError("Nama, kota, dan alamat wajib diisi.");
      return;
    }
    if (
      outlets.some(
        (outlet) =>
          outlet.id !== editor?.id &&
          outlet.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("Nama outlet sudah digunakan.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const input = { name, city, address, active };
      if (editor) await outletApi.update(editor.id, input);
      else await outletApi.create(input);
      await refreshOutlets();
      setMessage("Outlet berhasil disimpan.");
      closeEditor();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menyimpan outlet.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archive(outlet: Outlet) {
    if (!window.confirm(`Arsipkan ${outlet.name}?`)) return;
    setError("");
    try {
      await outletApi.archive(outlet.id);
      await refreshOutlets();
      if (filter === outlet.id) setFilter("all");
      setMessage("Outlet berhasil diarsipkan.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal mengarsipkan outlet.",
      );
    }
  }

  const filteredOutlets = outlets.filter(
    (outlet) =>
      (filter === "all" || outlet.id === filter) &&
      `${outlet.name} ${outlet.city} ${outlet.address}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return {
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
  };
}
