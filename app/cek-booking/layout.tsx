import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Prevents the guest booking lookup from appearing in search results. */
export const metadata: Metadata = {
  title: "Check Your Booking",
  description: "Look up the status of your MahjongHu table reservations.",
  robots: { index: false, follow: false },
};

/** Adds metadata without changing the guest reservation lookup. */
export default function CheckBookingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
