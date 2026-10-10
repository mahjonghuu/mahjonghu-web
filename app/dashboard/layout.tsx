"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge, Icon } from "./components";
import { WorkspaceProvider } from "./workspace-state";
import "./workspace.css";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: 0 },
  { label: "Outlet", href: "/dashboard/outlet", icon: 1 },
  { label: "Meja", href: "/dashboard/table", icon: 2 },
  { label: "Laporan pendapatan", href: "/dashboard/revenue", icon: 3 },
];

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
        <nav aria-label="Navigasi internal">
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
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-dot" /> MODE DEMO
            <h3>Ruang untuk eksplorasi.</h3>
            <p>
              Semua data hanya untuk demo. Perubahan akan direset saat refresh.
            </p>
          </div>
          <div className="profile">
            <span className="avatar">AD</span>
            <div>
              <strong>Admin Demo</strong>
              <small>Workspace administrator</small>
            </div>
            <span className="profile-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            <strong>{active.label}</strong>
          </div>
          <div className="topbar-right">
            <Badge>Frontend PoC</Badge>
            <span className="avatar small-avatar">AD</span>
          </div>
        </header>
        <main className="main-content">
          {children}
          <footer className="workspace-footer">
            <span>
              © 2026 MahjongHu. A little strategy, a lot of possibilities.
            </span>
            <span>
              <span className="demo-dot" /> Demo workspace · data nonpersisten
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

/** Keeps dashboard navigation and demo data mounted across route changes. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardShell>{children}</DashboardShell>
    </WorkspaceProvider>
  );
}
