import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Excludes checkout and all payment result routes from search results. */
export const metadata: Metadata = {
  title: "Booking Payment",
  description: "Complete payment for your MahjongHu table booking.",
  robots: { index: false, follow: false },
};

/** Preserves the existing payment flow while providing server-rendered metadata. */
export default function PaymentLayout({ children }: { children: ReactNode }) {
  return children;
}
