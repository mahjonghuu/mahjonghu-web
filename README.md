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
2. Manage outlets with names, cities, addresses, and operational status through the PostgreSQL-backed outlet API.
3. Keep table management, dashboard metrics, and revenue reports as demo data until their backend modules are connected.
4. Once booking and payment APIs exist, derive availability and reports from persisted operational/payment records.
5. Verify outlet API flows while preserving clear demo-only boundaries for unconnected modules.

Navigation switches views within `/dashboard`; these views are not separate URLs. The outlet management view persists through the backend API. The dashboard, table management, and revenue report still use in-memory demo data.

### Responsive workspace

- At widths up to 950px, navigation moves above the content, filters stack, and transaction/table rows become labeled cards. All columns and actions remain accessible without horizontal scrolling.
- At widths up to 400px, metrics, date fields, and record details use a single column. Larger mobile/tablet screens use two columns where space permits.
- Long outlet names and addresses wrap inside their containers. Native inputs can shrink to fit, use 16px text on mobile to avoid focus-triggered iOS zoom, and dialogs are constrained to the dynamic viewport height with vertical scrolling.
- Desktop retains the sidebar and tabular presentation. Table headers and explicit table roles remain available to assistive technology in the mobile card presentation.
- Browser verification covered all four views at 320, 360, 390, 430, 768, 820, 950, 951, 1024, and 1440px, plus maximum-length outlet fields and a table form at 320 × 568px. No page-level horizontal overflow was observed; mobile/tablet record containers also fit without horizontal scrolling. Device-specific Safari behavior still requires testing on an actual iOS device.

## Demo data and state

- `app/dashboard/model.ts` defines outlet, table, and paid-transaction shapes plus the sample data for still-demo modules.
- `app/dashboard/page.tsx` connects outlet CRUD to the backend and retains in-memory table and transaction state.
- Set `NEXT_PUBLIC_API_URL` to the backend origin when it is not `http://localhost:3001`. The backend needs its PostgreSQL schema migrated and must allow the frontend origin through `WEB_ORIGIN`.
- Outlet list, create, edit, and archive requests use `GET`, `POST`, `PATCH`, and `DELETE /outlets`; these outlet changes persist in PostgreSQL. Table counts on outlet cards come from the backend.
- The table-management and revenue-report screens remain demo-only: their 12 sample tables and 24 sample transactions do not come from the outlet API. Their outlet filter/data remain the local demo dataset and do not imply backend table or payment integration.
- `public/logo.webp` is the supplied original. `public/logo-transparent.webp` removes its black background while preserving the artwork with alpha transparency; the dashboard and browser icon use this variant. Keep the original file unchanged.
- The demo transaction seed spans October 3–10, 2026; the initial report range is October 1–10, 2026. These demo totals are not PostgreSQL financial records.
- The outlet form validates required fields; the backend rejects duplicate active names. Outlet archival is blocked while tables or booking history reference the outlet.
- Table status changes do not create payments. The table and revenue demo screens remain client-side until those backend modules are implemented.
- CSV exports include only the demo transactions matching the current local outlet and date filters.

## Security and scope

The outlet CRUD API is unauthenticated and restricted to a backend listening on `127.0.0.1` in local development. It must not be exposed or deployed before owner authentication is implemented. Tables and reports are still demo data, not operational records. Production requires server-side role authorization, persistent storage, and authoritative booking/payment/availability integration. Public booking and real payment processing are outside this PoC phase.
