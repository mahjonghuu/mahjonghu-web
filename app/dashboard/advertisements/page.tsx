"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  advertisementApi,
  type AdvertisementRecord,
} from "@/lib/advertisements";
import { prepareImageUpload } from "@/lib/image-upload";
import { Badge, PageHeading } from "../components";
import styles from "./advertisements.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

function AdvertisementEditor({
  record,
  onClose,
  onSaved,
}: {
  record: AdvertisementRecord | null;
  onClose: () => void;
  onSaved: (record: AdvertisementRecord) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const imageRequest = useRef(0);
  const savingLock = useRef(false);
  const processingLock = useRef(false);
  const [upload, setUpload] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const preview = upload ?? record?.imageUrl;

  useEffect(() => {
    active.current = true;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => {
      active.current = false;
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    if (savingLock.current) return;
    imageRequest.current++;
    onClose();
  }

  async function changeImage(file: File | undefined) {
    if (!file || savingLock.current || processingLock.current) return;
    const request = ++imageRequest.current;
    processingLock.current = true;
    setProcessing(true);
    setError("");
    try {
      const image = await prepareImageUpload(file);
      if (active.current && request === imageRequest.current) setUpload(image);
    } catch (cause) {
      if (active.current && request === imageRequest.current) {
        setError(errorMessage(cause, "Could not prepare the image."));
      }
    } finally {
      if (active.current && request === imageRequest.current) {
        processingLock.current = false;
        setProcessing(false);
      }
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingLock.current || processingLock.current) return;
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    const startsOn = String(fields.get("startsOn") ?? "");
    const endsOn = String(fields.get("endsOn") ?? "");
    if (!title || title.length > 80) {
      setError("Enter a title between 1 and 80 characters.");
      return;
    }
    if (!isCalendarDate(startsOn) || !isCalendarDate(endsOn)) {
      setError("Choose a valid start date and end date.");
      return;
    }
    if (endsOn < startsOn) {
      setError("The end date must be the same as or after the start date.");
      return;
    }
    if (!record && !upload) {
      setError("Choose an image and wait for it to finish processing.");
      return;
    }
    savingLock.current = true;
    setSaving(true);
    setError("");
    try {
      const details = { title, startsOn, endsOn };
      const saved = record
        ? await advertisementApi.update(record.id, {
            ...details,
            ...(upload ? { image: upload } : {}),
          })
        : await advertisementApi.create({ ...details, image: upload! });
      if (active.current) onSaved(saved);
    } catch (cause) {
      if (active.current) {
        setError(errorMessage(cause, "Could not save the advertisement."));
      }
    } finally {
      savingLock.current = false;
      if (active.current) setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="advertisement-editor-title"
      aria-describedby="advertisement-schedule-help"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <form
        onSubmit={(event) => void save(event)}
        aria-busy={saving || processing}
      >
        <div className={styles.dialogHeading}>
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h2 id="advertisement-editor-title">
              {record ? "Edit advertisement" : "Add advertisement"}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close advertisement editor"
            disabled={saving}
            onClick={close}
          >
            ×
          </button>
        </div>
        <label className={styles.field}>
          Title
          <input
            name="title"
            type="text"
            required
            maxLength={80}
            defaultValue={record?.title ?? ""}
            disabled={saving}
            autoFocus
          />
        </label>
        <div className={styles.dateFields}>
          <label className={styles.field}>
            Start date
            <input
              name="startsOn"
              type="date"
              required
              min="0001-01-01"
              max="9999-12-31"
              defaultValue={record?.startsOn ?? ""}
              disabled={saving}
              aria-describedby="advertisement-schedule-help"
            />
          </label>
          <label className={styles.field}>
            End date
            <input
              name="endsOn"
              type="date"
              required
              min="0001-01-01"
              max="9999-12-31"
              defaultValue={record?.endsOn ?? ""}
              disabled={saving}
              aria-describedby="advertisement-schedule-help"
            />
          </label>
        </div>
        <p id="advertisement-schedule-help" className={styles.help}>
          Both dates are inclusive in Asia/Jakarta (UTC+7). A same-day schedule
          is allowed. The server determines when the advertisement is active.
        </p>
        <label className={styles.field}>
          {record ? "Replace image (optional)" : "Image (required)"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={!record && !upload}
            disabled={saving || processing}
            aria-describedby="advertisement-image-help"
            onChange={(event) => {
              void changeImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <p id="advertisement-image-help" className={styles.help}>
          JPEG, PNG, or WebP up to 10 MiB. Images are resized to at most 1600px
          and compressed to at most 512 KiB before upload. Posters are displayed
          in full, without cropping.{" "}
          {record && "Keep the current image by not choosing a replacement."}
        </p>
        {processing && <p role="status">Processing image…</p>}
        {preview && (
          <div className={styles.editorPreview}>
            <Image
              src={preview}
              alt="Advertisement image preview"
              fill
              unoptimized
              sizes="(max-width: 650px) 90vw, 560px"
              className={styles.image}
            />
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <button
            type="button"
            className="secondary"
            disabled={saving}
            onClick={close}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary"
            disabled={saving || processing || (!record && !upload)}
          >
            {saving
              ? "Saving…"
              : record
                ? "Save changes"
                : "Create advertisement"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/** Owner workspace for creating, scheduling, updating, and deleting advertisements. */
export default function AdvertisementsPage() {
  const [records, setRecords] = useState<AdvertisementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editor, setEditor] = useState<
    AdvertisementRecord | null | undefined
  >();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const active = useRef(false);
  const deleteLock = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void advertisementApi
      .list()
      .then((result) => {
        if (!cancelled) setRecords(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(errorMessage(cause, "Could not load advertisements."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  function openEditor(record: AdvertisementRecord | null) {
    if (deleteLock.current || loading) return;
    setMessage("");
    setEditor(record);
  }

  async function remove(record: AdvertisementRecord) {
    if (deleteLock.current || loading) return;
    if (
      !window.confirm(
        `Delete advertisement “${record.title}”? This cannot be undone.`,
      )
    )
      return;
    deleteLock.current = true;
    setDeletingId(record.id);
    setError("");
    setMessage("");
    try {
      await advertisementApi.remove(record.id);
      if (active.current) {
        setRecords((current) =>
          current.filter((item) => item.id !== record.id),
        );
        setMessage("Advertisement deleted.");
      }
    } catch (cause) {
      if (active.current)
        setError(errorMessage(cause, "Could not delete the advertisement."));
    } finally {
      deleteLock.current = false;
      if (active.current) setDeletingId(null);
    }
  }

  return (
    <section className={styles.page}>
      <PageHeading
        title="Advertisements"
        description="Schedule image announcements for the public homepage."
        action={
          <button
            className="primary"
            type="button"
            disabled={loading || Boolean(deletingId)}
            onClick={() => openEditor(null)}
          >
            ＋ Add advertisement
          </button>
        }
      />
      <div className={styles.scheduleNote}>
        <p>
          Schedules include both the start and end date in Asia/Jakarta (UTC+7).
          Active advertisements appear in the homepage popup; scheduled and
          expired ones stay hidden.
        </p>
        <button
          className="secondary"
          type="button"
          disabled={loading || Boolean(deletingId)}
          onClick={() => {
            setError("");
            setLoading(true);
            setReload((value) => value + 1);
          }}
        >
          {loading ? "Loading…" : "Refresh list"}
        </button>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className={styles.empty} role="status">
          Loading advertisements…
        </p>
      )}
      {!loading && !records.length && !error && (
        <div className={styles.empty}>
          <h2>No advertisements yet</h2>
          <p>
            Add an image and schedule its inclusive display dates to get
            started.
          </p>
        </div>
      )}
      {!loading && records.length > 0 && (
        <div className={styles.grid}>
          {records.map((record) => (
            <article className={styles.card} key={record.id}>
              <div className={styles.cardPreview}>
                <Image
                  src={record.imageUrl}
                  alt={record.title}
                  fill
                  unoptimized
                  sizes="(max-width: 650px) 90vw, (max-width: 1200px) 45vw, 360px"
                  className={styles.image}
                />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <h2>{record.title}</h2>
                  <Badge
                    tone={
                      record.status === "active"
                        ? "green"
                        : record.status === "scheduled"
                          ? "blue"
                          : "gray"
                    }
                  >
                    {record.status === "active"
                      ? "Active"
                      : record.status === "scheduled"
                        ? "Scheduled"
                        : "Expired"}
                  </Badge>
                </div>
                <dl className={styles.schedule}>
                  <div>
                    <dt>Starts on</dt>
                    <dd>
                      <time dateTime={record.startsOn}>
                        {dateFormatter.format(
                          new Date(`${record.startsOn}T00:00:00Z`),
                        )}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>Ends on</dt>
                    <dd>
                      <time dateTime={record.endsOn}>
                        {dateFormatter.format(
                          new Date(`${record.endsOn}T00:00:00Z`),
                        )}
                      </time>
                    </dd>
                  </div>
                </dl>
                <p className={styles.help}>Inclusive dates · Asia/Jakarta</p>
                <div className={styles.cardActions}>
                  <button
                    className="secondary"
                    type="button"
                    disabled={Boolean(deletingId)}
                    onClick={() => openEditor(record)}
                    aria-label={`Edit ${record.title}`}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    type="button"
                    disabled={Boolean(deletingId)}
                    onClick={() => void remove(record)}
                    aria-label={`Delete ${record.title}`}
                  >
                    {deletingId === record.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editor !== undefined && (
        <AdvertisementEditor
          record={editor}
          onClose={() => setEditor(undefined)}
          onSaved={(saved) => {
            setRecords((current) =>
              editor
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [saved, ...current],
            );
            setMessage(
              editor ? "Advertisement updated." : "Advertisement created.",
            );
            setEditor(undefined);
          }}
        />
      )}
    </section>
  );
}
