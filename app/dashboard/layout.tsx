"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api";
import type { ReactNode } from "react";
import { Icon } from "./components";
import { WorkspaceProvider } from "./workspace-state";
import "./workspace.css";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: 0 },
  { label: "Bookings", href: "/dashboard/booking", icon: 4 },
  { label: "Outlets", href: "/dashboard/outlet", icon: 1 },
  { label: "Tables", href: "/dashboard/table", icon: 2 },
  { label: "Revenue reports", href: "/dashboard/revenue", icon: 3 },
];

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active =
    navigation.find((item) => item.href === pathname) ?? navigation[0];

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Image
            className="brand-logo"
            src="/logo-transparent.webp"
            alt="MahjongHu"
            width={96}
            height={96}
            priority
          />
          <span className="brand-wordmark">
            MahjongHu
            <small>BUSINESS SPACE</small>
          </span>
        </Link>
        <div className="workspace-label">
          WORKSPACE <span>PRO</span>
        </div>
        <nav aria-label="Internal navigation">
          {navigation.map((item) => {
            const selected = item.href === active.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${selected ? " selected" : ""}`}
                aria-current={selected ? "page" : undefined}
              >
                <Icon index={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            <strong>{active.label}</strong>
          </div>
          <div className="topbar-right">
            <button
              type="button"
              onClick={() => {
                void apiRequest<{ loggedOut: boolean }>("/auth/logout", {
                  method: "POST",
                })
                  .catch(() => undefined)
                  .finally(() => {
                    router.replace("/dashboard/login");
                    router.refresh();
                  });
              }}
>
              Log out
            </button>
          </div>
        </header>
        <main className="main-content">
          {children}
          <footer className="workspace-footer">
            <span>
              © 2026 MahjongHu. A little strategy, a lot of possibilities.
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

/** Provides dashboard navigation and shared workspace state across routes. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <WorkspaceProvider>
      {pathname === "/dashboard/login" ? (
        children
      ) : (
        <DashboardShell>{children}</DashboardShell>
      )}
    </WorkspaceProvider>
  );
}
