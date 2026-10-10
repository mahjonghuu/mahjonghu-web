# MahjongHu Web

Next.js App Router frontend for the MahjongHu mahjong booking business.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the public entry page or http://localhost:3000/dashboard for the internal frontend proof of concept.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Dashboard PoC plan and implementation

1. Keep the public entry point separate from the internal workspace. Provide responsive sidebar navigation between dashboard, outlets, tables, and revenue reports.
2. Manage outlets with names, cities, addresses, and operational status. Support creation, editing, deletion, and search.
3. Manage tables per outlet with names, hourly prices, and available/in-use/maintenance status. Support creation, editing, deletion, and outlet filtering.
4. Derive dashboard metrics and revenue reports from the same data. Include inclusive date-range and outlet filters, paid transaction details, per-outlet revenue, and CSV export.
5. Keep the PoC entirely client-side using React state. Verify the interaction flows in a browser at desktop and mobile sizes.

All five steps are implemented. Navigation switches views within `/dashboard`; these views are not separate URLs. There are no additional UI or state-management dependencies.

### Responsive workspace

- At widths up to 950px, navigation moves above the content, filters stack, and transaction/table rows become labeled cards. All columns and actions remain accessible without horizontal scrolling.
- At widths up to 400px, metrics, date fields, and record details use a single column. Larger mobile/tablet screens use two columns where space permits.
- Long outlet names and addresses wrap inside their containers. Native inputs can shrink to fit, use 16px text on mobile to avoid focus-triggered iOS zoom, and dialogs are constrained to the dynamic viewport height with vertical scrolling.
- Desktop retains the sidebar and tabular presentation. Table headers and explicit table roles remain available to assistive technology in the mobile card presentation.
- Browser verification covered all four views at 320, 360, 390, 430, 768, 820, 950, 951, 1024, and 1440px, plus maximum-length outlet fields and a table form at 320 × 568px. No page-level horizontal overflow was observed; mobile/tablet record containers also fit without horizontal scrolling. Device-specific Safari behavior still requires testing on an actual iOS device.

## Demo data and state

- `app/dashboard/model.ts` defines outlets, tables, paid transactions, and deterministic seed data.
- `app/dashboard/page.tsx` owns shared in-memory state, management forms, navigation, and derived reports.
- `public/logo.webp` is the supplied original. `public/logo-transparent.webp` removes its black background while preserving the artwork with alpha transparency; the dashboard and browser icon use this variant. Keep the original file unchanged.
- The seed contains 3 outlets, 12 tables, and 24 paid transactions from October 3–10, 2026. The initial report range is October 1–10, 2026; total revenue is IDR 5,850,000.
- Navigating between workspace views preserves edits. Refreshing or leaving the workspace resets them. No local storage, database, or backend API is used.
- The outlet filter is shared across views. Search is reset when changing views. Date filters apply to revenue and transactions, not current operational table counts.
- Table status changes do not create payments. Revenue comes only from seeded paid transactions. Historical amounts are unaffected by subsequent price changes.
- Outlet names must be unique; table names must be unique within an outlet. Whitespace-only required fields and nonpositive or fractional rupiah rates are rejected.
- Outlets with tables or transaction history cannot be deleted. Tables in use or referenced by transactions cannot be deleted. Unreferenced records can be deleted after confirmation.
- Outlets with tables in use cannot be deactivated. Tables cannot be marked in use at inactive outlets. A table's outlet cannot be changed after creation, preserving its historical relationship.
- CSV exports include only transactions matching the current outlet and date filters, with whole-number IDR amounts.

## Security and scope

This is an explicitly labeled demo, **not an authenticated staff application**. Do not deploy it with real customer, financial, or operational data. Production requires server-side authentication, role-based authorization, persistent storage, and authoritative booking/payment/availability integration. Public booking and real payment processing are outside this dashboard PoC.
