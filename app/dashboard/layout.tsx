import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardLayoutClient from "./dashboard-layout-client";

/** Keeps staff routes out of search results without changing authentication. */
export const metadata: Metadata = {
  title: "Staff Dashboard",
  description:
    "MahjongHu staff workspace for managing venues, tables and bookings.",
  robots: { index: false, follow: false },
};

/** Adds server metadata around the existing client-side workspace and login shell. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
