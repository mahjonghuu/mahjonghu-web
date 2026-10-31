import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Gives payment outcomes an appropriate title without making them indexable. */
export const metadata: Metadata = {
  title: "Payment Status",
  description: "View the payment status of your MahjongHu booking.",
  robots: { index: false, follow: false },
};

/** Leaves reference-based payment status handling unchanged. */
export default function PaymentResultLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
