"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  advertisementApi,
  type AdvertisementRecord,
} from "../lib/advertisements";
import styles from "./advertisement-popup.module.css";

/** Shows active homepage advertisements once per mounted page visit. */
export default function AdvertisementPopup() {
  const [advertisements, setAdvertisements] = useState<AdvertisementRecord[]>(
    [],
  );
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [failedImageId, setFailedImageId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    let current = true;
    advertisementApi
      .publicList()
      .then((records) => {
        if (current) setAdvertisements(records);
      })
      .catch(() => {
        // Advertisements must never interrupt venue discovery or booking.
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dismissed || advertisements.length === 0 || !dialog) return;

    const previousFocus = document.activeElement;
    const body = document.body;
    const root = document.documentElement;
    const bodyOverflow = body.style.overflow;
    const rootOverflow = root.style.overflow;

    if (!dialog.open) dialog.showModal();
    body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      body.style.overflow = bodyOverflow;
      root.style.overflow = rootOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [advertisements.length, dismissed]);

  const advertisement = advertisements[index];
  if (!advertisement) return null;

  function navigate(direction: number) {
    setIndex(
      (current) =>
        (current + direction + advertisements.length) % advertisements.length,
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        setDismissed(true);
      }}
      onKeyDown={(event) => {
        if (advertisements.length < 2) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title} aria-live="polite">
          {advertisement.title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          className={styles.button}
          onClick={() => setDismissed(true)}
        >
          Close
        </button>
      </header>
      <div className={styles.imageFrame}>
        {failedImageId === advertisement.id ? (
          <p className={styles.imageError} role="status">
            This advertisement image could not be loaded. You can close this
            window and continue booking.
          </p>
        ) : (
          <Image
            key={advertisement.id}
            src={advertisement.imageUrl}
            alt={advertisement.title}
            fill
            unoptimized
            sizes="(max-width: 720px) 100vw, 960px"
            className={styles.image}
            onError={() => setFailedImageId(advertisement.id)}
          />
        )}
      </div>
      {advertisements.length > 1 && (
        <nav className={styles.navigation} aria-label="Advertisements">
          <button
            type="button"
            className={styles.button}
            aria-keyshortcuts="ArrowLeft"
            onClick={() => navigate(-1)}
          >
            Previous
          </button>
          <p className={styles.count} aria-live="polite" aria-atomic="true">
            {index + 1} of {advertisements.length}
          </p>
          <button
            type="button"
            className={styles.button}
            aria-keyshortcuts="ArrowRight"
            onClick={() => navigate(1)}
          >
            Next
          </button>
        </nav>
      )}
    </dialog>
  );
}
