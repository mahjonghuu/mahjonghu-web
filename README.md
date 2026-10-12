# MahjongHu Web

Next.js App Router frontend for the MahjongHu mahjong booking business.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the public entry page. Dashboard routes under `/dashboard` require an owner account created by a trusted backend administrator; sign in at `/dashboard/login`.

The owner login screen uses a responsive split layout on desktop and a stacked layout on mobile. Its warm neutral background, white form card, and green actions retain the existing palette; the form still authenticates against `POST /auth/login`.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Public booking preview

- The public page fetches active outlets from `GET /outlets/public` and their tables and hourly rates from `GET /tables/public`. City filters, table counts, table names, and minimum hourly prices use those API responses.
- Outlet photos remain illustrative local imagery; descriptions/amenities are not supplied by the API and are not presented as live outlet details.
- After a date is selected, the booking schedule queries `GET /bookings/availability` for each future one-hour slot. Unavailable slots cannot be selected; table-specific rates are used in estimates.
- The schedule is an availability preview only. It does not create a booking hold or persist a reservation or payment.
- Schedule cells are keyboard-operable buttons in a semantic table. On narrow screens the grid scrolls horizontally with sticky table labels, and the summary moves below the schedule without page-level horizontal overflow. Schedule styling lives in `app/booking-schedule.module.css`; landing-page styling remains in `app/page.module.css`. The Tailwind Turbopack loader targets `globals.css` so native CSS Modules retain their class exports.
- The public `/payment` page presents the selected outlet, date, table sessions, and estimated rental total alongside name, phone, and email fields. It is a responsive preview, not a checkout: the contact fields are not submitted, and no booking or payment is created. Without a selection, the page links back to the schedule. The schedule selection is kept in session storage when returning to the booking page.
- Local outlet photos are illustrative restaurant interiors from Unsplash, not photographs of actual MahjongHu branches: photo IDs `1517248135467-4c7edcad34c4`, `1559339352-11d035aa65de`, and `1552566626-52f8b828add9`.

## Dashboard PoC plan and implementation

1. Keep the public entry point separate from the internal workspace. Provide responsive sidebar navigation between dashboard, bookings, outlets, tables, and revenue reports.
2. Manage outlets with names, cities, addresses, and operational status through the PostgreSQL-backed outlet API.
3. Display persisted booking records in the owner dashboard; table management, dashboard metrics, and revenue reports remain demo data until their backend modules are connected.
4. Derive availability and reports from persisted operational/payment records as those integrations are completed.
5. Verify API flows while preserving clear demo-only boundaries for unconnected modules.

Dashboard navigation uses nested routes at `/dashboard`, `/dashboard/booking`, `/dashboard/outlet`, `/dashboard/table`, and `/dashboard/revenue`. The shared route layout owns the sidebar, top bar, and in-memory demo state; outlet management and booking records load from backend APIs.

### Responsive workspace

- At widths up to 950px, navigation moves above the content, filters stack, and transaction/table rows become labeled cards. All columns and actions remain accessible without horizontal scrolling.
- At widths up to 400px, metrics, date fields, and record details use a single column. Larger mobile/tablet screens use two columns where space permits.
- Long outlet names and addresses wrap inside their containers. Native inputs can shrink to fit, use 16px text on mobile to avoid focus-triggered iOS zoom, and dialogs are constrained to the dynamic viewport height with vertical scrolling.
- Desktop retains the sidebar and tabular presentation. Table headers and explicit table roles remain available to assistive technology in the mobile card presentation.
- The five dashboard routes were smoke-tested at 390px with no page-level horizontal overflow; table changes remained in shared in-memory state across navigation. Test iOS Safari separately for device-specific behavior.

## Demo data and state

- `app/dashboard/model.ts` defines outlet, table, and paid-transaction shapes plus the sample data for still-demo modules.
- `app/dashboard/layout.tsx` provides shared navigation and in-memory state across the dashboard routes.
- `app/dashboard/booking/page.tsx` reads persisted booking records from `GET /bookings`; `app/dashboard/table/page.tsx` and `app/dashboard/revenue/page.tsx` remain demo-only.
- Set `NEXT_PUBLIC_API_URL` to the backend origin when it is not `http://localhost:3001`; an unset or blank value falls back to `http://localhost:3001`. Restart Next.js after changing this build-time variable. The backend needs its PostgreSQL schema migrated and must allow the frontend origin through `WEB_ORIGIN`.
- Outlet list, create, edit, and archive requests use `GET`, `POST`, `PATCH`, and `DELETE /outlets`; booking records load through the dashboard-only `GET /bookings` endpoint.
- The table-management and revenue-report screens remain demo-only: their 12 sample tables and 24 sample transactions do not come from the backend.
- `public/logo.webp` is the supplied original. `public/logo-transparent.webp` removes its black background while preserving the artwork with alpha transparency; the dashboard and browser icon use this variant. Keep the original file unchanged.
- The demo transaction seed spans October 3–10, 2026; the initial report range is October 1–10, 2026. These demo totals are not PostgreSQL financial records.
- The outlet form validates required fields; the backend rejects duplicate active names. Outlet archival is blocked while tables or booking history reference the outlet.
- Table status changes do not create payments. Table management, revenue summaries, and CSV exports remain client-side demo data.
- CSV exports include only the demo transactions matching the current local outlet and date filters.

## Security and scope

Dashboard login is handled by backend `POST /auth/login`, which sets an eight-hour `HttpOnly`, `SameSite=Strict` JWT cookie; the token is not exposed to client JavaScript. `proxy.ts` validates that session with backend `GET /auth/me` before serving any `/dashboard` route except `/dashboard/login`. Browser API requests include the cookie, and backend guards enforce owner authorization independently. Logout clears the cookie through `POST /auth/logout`. Keep the web app and API same-site and configure credentialed CORS using `WEB_ORIGIN`; owner provisioning and `JWT_SECRET` setup are documented in `../mahjonghu-backend/README.md`. There is no public registration or role-promotion flow. Table management and reports remain demo data; the public booking page remains a frontend-only preview.
