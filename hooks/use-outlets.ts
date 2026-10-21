"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { outletApi, type OutletApiRecord, type RateTier } from "@/lib/outlet";
import type { Outlet } from "@/app/dashboard/model";

const toOutlet = (outlet: OutletApiRecord): Outlet => ({
  id: String(outlet.id),
  name: outlet.name,
  city: outlet.city,
  address: outlet.address,
  active: Boolean(outlet.active ?? outlet.isActive),
  visibility: outlet.visibility,
  openingHour: Number(outlet.openingHour ?? 12),
  closingHour: Number(outlet.closingHour ?? 22),
  tableCount: Number(outlet.tableCount ?? 0),
  rate: outlet.rate,
  rateTiers: outlet.rateTiers,
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
  const [tierRows, setTierRows] = useState<{ id: number; durationHours: string; rate: string }[]>([]);
  const nextTierId = useRef(0);

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
            cause instanceof Error ? cause.message : "Failed to load outlets.",
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
    setTierRows((outlet?.rateTiers ?? []).map((tier) => ({
      id: nextTierId.current++,
      durationHours: String(tier.durationHours),
      rate: String(tier.rate),
    })));
    dialog.current?.showModal();
  }

  function closeEditor() {
    dialog.current?.close();
    setEditor(undefined);
  }

  function addTier() {
    setTierRows((rows) => [...rows, { id: nextTierId.current++, durationHours: "", rate: "" }]);
  }

  function updateTier(id: number, field: "durationHours" | "rate", value: string) {
    setTierRows((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  function removeTier(id: number) {
    setTierRows((rows) => rows.filter((row) => row.id !== id));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editor === undefined) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const city = String(fields.get("city") ?? "").trim();
    const address = String(fields.get("address") ?? "").trim();
    const openingHour = Number(fields.get("openingHour"));
    const closingHour = Number(fields.get("closingHour"));
    const active = fields.get("active") === "true";
    const visibility = String(fields.get("visibility"));
    const rateText = String(fields.get("rate") ?? "").trim();
    const rate = Number(rateText);
    if (
      !name ||
      (visibility !== "public" && visibility !== "private") ||
      !city ||
      !address ||
      !Number.isInteger(openingHour) ||
      !Number.isInteger(closingHour) ||
      openingHour < 0 ||
      openingHour > 23 ||
      closingHour < 0 ||
      closingHour > 24 ||
      closingHour === openingHour ||
      !rateText ||
      !Number.isSafeInteger(rate) ||
      rate <= 0 ||
      rate > 1000000000
    ) {
      setError("Complete the outlet details, choose different opening and closing times, and enter a positive whole-number hourly rate (up to Rp 1,000,000,000).");
      return;
    }
    const rateTiers: RateTier[] = [];
    const thresholds = new Set<number>();
    for (const row of tierRows) {
      const durationHours = Number(row.durationHours);
      const tierRate = Number(row.rate);
      if (!row.durationHours.trim() || !row.rate.trim() ||
          !Number.isSafeInteger(durationHours) || durationHours < 2 || durationHours > 10 ||
          !Number.isSafeInteger(tierRate) || tierRate <= 0 || tierRate > 1000000000) {
        setError("Each tier needs a whole duration from 2 to 10 hours and a positive whole-number hourly rate (up to Rp 1,000,000,000).");
        return;
      }
      if (thresholds.has(durationHours)) {
        setError("Each duration threshold can only appear once.");
        return;
      }
      thresholds.add(durationHours);
      rateTiers.push({ durationHours, rate: tierRate });
    }
    rateTiers.sort((a, b) => a.durationHours - b.durationHours);

    if (
      outlets.some(
        (outlet) =>
          outlet.id !== editor?.id &&
          outlet.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("Outlet name is already in use.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const input = { name, city, address, active, visibility: visibility as "public" | "private", openingHour, closingHour, rate, rateTiers };
      if (editor) await outletApi.update(editor.id, input);
      else await outletApi.create(input);
      await refreshOutlets();
      setMessage("Outlet saved.");
      closeEditor();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to save outlet.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function archive(outlet: Outlet) {
    if (!window.confirm(`Archive ${outlet.name}?`)) return;
    setError("");
    try {
      await outletApi.archive(outlet.id);
      await refreshOutlets();
      if (filter === outlet.id) setFilter("all");
      setMessage("Outlet archived.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to archive outlet.",
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
    tierRows,
    addTier,
    updateTier,
    removeTier,
    archive,
    setEditor,
  };
}
