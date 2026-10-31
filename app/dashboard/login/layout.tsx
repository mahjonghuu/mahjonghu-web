import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Labels the staff login separately while retaining the dashboard noindex policy. */
export const metadata: Metadata = {
  title: "Staff Login",
  description: "Sign in to the MahjongHu staff workspace.",
  robots: { index: false, follow: false },
};

/** Preserves the existing login page and authentication routing. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
