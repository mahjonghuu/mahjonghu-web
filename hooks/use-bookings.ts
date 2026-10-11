"use client";

import { useCallback, useEffect, useState } from "react";
import { bookingApi, type BookingRecord } from "@/lib/booking";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Booking tidak dapat dimuat.";

/** Loads persisted booking records and exposes refresh/error state for the dashboard. */
export function useBookings() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setError("");
    setRefreshing(true);
    try {
      setBookings(await bookingApi.list());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    bookingApi
      .list()
      .then((records) => {
        if (mounted) setBookings(records);
      })
      .catch((requestError: unknown) => {
        if (mounted) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { bookings, loading, error, refreshing, refresh };
}
