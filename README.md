# MahjongHu Web

Next.js App Router frontend for the MahjongHu mahjong booking business. Public and owner-facing interface copy is in English; booking prices remain in Indonesian rupiah and times use Jakarta time.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 for the public entry page. Dashboard routes under `/dashboard` require an owner account created by a trusted backend administrator; sign in at `/dashboard/login`.

The public footer's website inquiry link identifies FlowPOS and opens a prefilled WhatsApp conversation.

Private outlets appear on the public booking page only after a granted
customer signs in using the emailed one-time code. The owner dashboard's
outlet editor controls visibility; the separate "Manage access" dialog handles
per-customer grants, optional expiry, and revocation. Long grant lists scroll
inside the dialog instead of stretching outlet cards. Only the booking customer
needs a grant; fellow players do not need accounts. Public outlets remain
bookable without customer login.
The backend requires `RESEND_API_KEY` and a verified `EMAIL_FROM` sender for
member email delivery; see the backend README for configuration.

The owner login screen uses a responsive split layout on desktop and a stacked layout on mobile. Its warm neutral background, white form card, and green actions retain the existing palette; the form still authenticates against `POST /auth/login`.

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Public booking preview

- The public page fetches active outlets, their shared one-hour rates, and duration thresholds from `GET /outlets/public`, and their tables from `GET /tables/public`. City filters, table counts, table names, and starting prices use those API responses.
- Public outlet cards all use the same local mahjong SVG illustration; descriptions/amenities are not supplied by the API and are not presented as live outlet details.
- Each outlet's opening and closing hours are configured in the dashboard outlet editor. A closing hour earlier than opening (for example, 13:00–04:00) means the following calendar day; 00:00 (24) remains the end of the same day. The public booking grid treats the selected date as the opening date, includes one-hour slots after midnight on the next day, and checkout validates the same local-time bounds. Equal opening and closing hours are not supported.
- After a date is selected, the booking schedule queries `GET /bookings/availability` for each future one-hour slot. Unavailable slots cannot be selected. Consecutive selected hours on one table form a session: its entire duration uses the outlet's effective hourly rate from the highest configured threshold at or below that duration. If no longer-duration threshold applies, the one-hour rate applies. Each table session is priced independently using the same outlet price schedule.
- Selecting slots is an availability preview. Submitting the `/payment` contact form creates one atomic backend hold per table session and one aggregate DOKU Checkout; each hold and the DOKU payment page expire after 15 minutes.
- `/payment` displays the estimated booking cost and collects guest name, phone, and email before redirecting to DOKU. The backend recalculates the final price from current tiers at checkout; a price change after the preview may change the charged amount. The backend selects separate sandbox or production credentials; `NEXT_PUBLIC_DOKU_ENV` defaults to `dev` and must be set to `prod` at build time for production.
- The owner outlet editor requires a one-hour base rate and supports optional hourly-rate thresholds for durations from 2 to 10 hours. Every table within that outlet shares the schedule; table management cannot change prices. Leaving a duration unset carries forward the most recent rate; removing every threshold restores the base rate for all durations. Changes affect future checkouts, not persisted booking amounts.
- DOKU returns customers to `/payment/result/<reference>`. That page polls the backend's verified notification status and shows payment and booking details. DOKU `FAILED` notifications remain pending to allow another payment method; an unpaid order becomes expired at 15 minutes.
- The hero's **Check my booking** link opens `/cek-booking`. Guests enter only the phone number used at checkout; `POST /bookings/lookup` returns all matching reservations with outlet, table, start time, duration, and effective booking status. Indonesian `0`, `62`, and `+62` prefixes and phone spacing are normalized. Nonmatching numbers show an empty state, and expired pending holds display as expired. The public response omits names, contact details, booking references, and payment details. Phone-only lookup does not verify phone ownership: anyone who knows a customer's number can see those limited reservation details.
- Booking selections are kept in session storage when returning to the booking page. DOKU success can restore an expired hold only if payment occurred within the 15-minute deadline and the slot has not been rebooked; late or conflicting payments are flagged for manual review.
- For customer cancellation requests after payment, set `NEXT_PUBLIC_OWNER_WHATSAPP` to the owner's WhatsApp number in international format (for example `6281234567890`, without a `+`) before building/deploying the web app. The payment result page then offers a prefilled WhatsApp message with booking references for confirmed future reservations. Without a configured valid number, no WhatsApp link is shown. Customers do not cancel bookings directly in the public area.

## Dashboard PoC plan and implementation

1. Keep the public entry point separate from the internal workspace. Provide responsive sidebar navigation between dashboard, bookings, outlets, tables, and revenue reports.
2. Manage outlets with names, cities, addresses, and operational status through the PostgreSQL-backed outlet API.
3. Display persisted booking records in the owner dashboard; dashboard overview and revenue report aggregates come from backend APIs. Table management remains demo data.
4. Persisted dashboard and revenue-report views are implemented; table-management data remains client-side demo data.
5. Verify API flows while preserving clear demo-only boundaries for unconnected modules.

Dashboard navigation uses nested routes at `/dashboard`, `/dashboard/booking`, `/dashboard/outlet`, `/dashboard/table`, and `/dashboard/revenue`. The overview requests backend-computed metrics from `GET /dashboard/summary`; outlet management and booking records also load from backend APIs.

### Responsive workspace

- At widths up to 950px, navigation moves above the content, filters stack, and transaction/table rows become labeled cards. All columns and actions remain accessible without horizontal scrolling.
- At widths up to 400px, metrics, date fields, and record details use a single column. Larger mobile/tablet screens use two columns where space permits.
- Long outlet names and addresses wrap inside their containers. Native inputs can shrink to fit, use 16px text on mobile to avoid focus-triggered iOS zoom, and dialogs are constrained to the dynamic viewport height with vertical scrolling.
- Desktop retains the sidebar and tabular presentation. Table headers and explicit table roles remain available to assistive technology in the mobile card presentation.
- The five dashboard routes were smoke-tested at 390px with no page-level horizontal overflow; table changes remained in shared in-memory state across navigation. Test iOS Safari separately for device-specific behavior.

## Demo data and state

- `app/dashboard/model.ts` retains display types and sample data used by the still-demo table-management route.
- `app/dashboard/layout.tsx` provides shared navigation and dashboard filter state.
- `app/dashboard/booking/page.tsx` lists persisted records from `GET /bookings` and lets the owner cancel a confirmed booking via `PATCH /bookings/:id/cancel`; the server allows cancellation only before its start time. The action releases the slot, but never initiates a refund. Owner and customer arrange any refund manually outside the app. The overview and revenue report still use backend payment aggregates; cancelled bookings do not erase settled charges.
- Set `NEXT_PUBLIC_API_URL` to the backend origin when it is not `http://localhost:3001`; an unset or blank value falls back to `http://localhost:3001`. Restart Next.js after changing this build-time variable. The backend needs its PostgreSQL schema migrated and must allow the frontend origin through `WEB_ORIGIN`.
- Outlet list, create, edit, and archive requests use `GET`, `POST`, `PATCH`, and `DELETE /outlets`; booking records load through the dashboard-only `GET /bookings` endpoint.
- Table management remains demo-only; dashboard occupancy and payment totals, per-outlet revenue, transaction details, and report CSV source rows come from the backend.
- `public/logo.webp` is the supplied original. `public/logo-transparent.webp` removes its black background while preserving the artwork with alpha transparency; the dashboard and browser icon use this variant. Keep the original file unchanged.
- The demo transaction seed remains in `app/dashboard/model.ts` for the table-management demo; the revenue report queries persisted payments.
- The outlet form validates required fields; the backend rejects duplicate active names. Outlet archival is blocked while tables or booking history reference the outlet.
- Table status changes do not create payments. Table management remains demo-only; the revenue summary and CSV source records come from successful backend payments.
- Revenue CSV exports include only backend payments matching the selected outlet and settlement date range.

## Security and scope

Dashboard login is handled by backend `POST /auth/login`, which sets an eight-hour `HttpOnly`, `SameSite=Strict` JWT cookie; the token is not exposed to client JavaScript. `proxy.ts` validates that session with backend `GET /auth/me` before serving any `/dashboard` route except `/dashboard/login`. Browser API requests include the cookie, and backend guards enforce owner authorization independently. Logout clears the cookie through `POST /auth/logout`. Keep the web app and API same-site, configure credentialed CORS using `WEB_ORIGIN`, and set backend `OWNER_COOKIE_DOMAIN` to their shared parent domain if the API uses a separate subdomain (for `mahjonghuu.com` and `api.mahjonghuu.com`, use `mahjonghuu.com`). Otherwise the login succeeds on the API but the dashboard proxy cannot see its cookie and redirects back to login. Owner provisioning and `JWT_SECRET` setup are documented in `../mahjonghu-backend/README.md`. There is no public registration or role-promotion flow. Table management remains demo data; the public booking page remains frontend-only.

The login route does not mount the workspace data provider; owner-only outlet, table, and booking requests start only after entering an authenticated dashboard route.
