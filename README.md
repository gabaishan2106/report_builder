# Veeba Sales Analytics

A self-service sales report web app for Veeba Foods' sales team — built as a
phased project on React + TypeScript + Vite, backed by Supabase (Postgres +
Auth + Row Level Security).

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase project's URL and
   **anon** key (Project Settings → API in the Supabase dashboard).

   Important: use the `anon` key here, never the `service_role` key. RLS
   enforces what each logged-in user can see; the service_role key stays
   only in the backend Python upload script.

3. Run the dev server:
   ```
   npm run dev
   ```
   Opens at http://localhost:5173

## What's built (all phases)

- **Phase 1 — Login:** email/password via Supabase Auth, forgot-password flow,
  session persistence (`src/pages/Login.tsx`, `src/lib/useAuth.ts`)
- **Phase 2 — Report controls:** month-range period picker + comparison mode
  toggle (Last Year Same Period / Last Month Same Period / Custom)
  (`src/components/ReportControls.tsx`)
- **Phase 3 — Total Sales:** total current vs. comparison period, computed
  from fetched rows (`src/lib/reportApi.ts` → `getTotalGrowth`)
- **Phase 4 — Territory table + RLS:** search, sort, pagination, sticky
  header, right-aligned values — RLS on `sales_data` means each user only
  ever receives rows for territories they're allowed to see; no frontend
  authorization logic exists (`src/components/TerritoryTable.tsx`)
- **Phase 5 — Comparison/growth logic:** shared growth rules (up/down/flat/
  "New", never Infinity/undefined) used by both summary cards and the table
  (`src/lib/growth.ts`)
- **Phase 6 — Downloads:** "Download Raw Data" (unaggregated rows for the
  period) and "Download Territory Summary" (the aggregated table), both
  client-side CSV generation (`src/lib/csvExport.ts`)
- **Phase 7 — Custom Report Builder:** a separate, collapsible advanced
  section that lets you group the loaded period's data by any field from
  `field_config` and view totals — sits alongside the fixed report, doesn't
  replace it (`src/components/CustomReportBuilder.tsx`)

## Important note on date granularity

`sales_data.month` stores monthly buckets as text (`"Apr-25"` format), not
full dates. So the period pickers use `<input type="month">` rather than
day-level date pickers — this matches the actual data granularity. All the
month-label parsing/shifting logic lives in `src/lib/dateUtils.ts`.

## Design tokens

Centralized in `src/styles/tokens.css` as CSS variables (colors, font,
layout) — every component reuses these, so the whole app stays visually
consistent even as more pages get added.

## Known simplifications (worth revisiting later)

- Pagination is client-side (fine at current data volumes; would need
  server-side pagination if `sales_data` grows very large)
- The Custom Report Builder (Phase 7) aggregates only within whatever the
  main report's "current period" already loaded — it doesn't run a separate
  query yet
- No dedicated loading skeletons yet (a plain "Generating…" state is used
  instead) — can be added as a polish pass

## Phase 8 — Debug fixes + upgrades (this round)

**Bug fixes:**
- First-attempt "Unable to generate report" for new logins — `runReport()` in
  `SalesReport.tsx` now silently retries once after 600ms if the first
  attempt fails, since this was a session-not-fully-attached race right
  after login, not a real data problem.
- Empty "Group by" dropdown in Custom Report Builder — almost certainly the
  same RLS-enabled-with-no-policy bug found earlier, this time on
  `field_config`. See `db_migration_phase8.sql`.
- Mobile navigation — `NavBar.tsx` now shows a hamburger icon under 768px
  that opens a slide-in drawer with the same nav links, instead of just
  hiding them with nowhere to go.

**Upgrades:**
- Sales Summary: Total Sales is now its own standalone card under a "Sales
  Summary" heading; the group cards sit under a separate "Group-wise
  Growth" heading below it.
- PAN India growth badge: every card (Total + each group) now shows a small
  badge in the top-right corner with the company-wide (not territory-scoped)
  growth for the same period, via two new security-definer SQL functions
  (`get_pan_india_total`, `get_pan_india_by_group`) that only ever return
  aggregated sums — never row-level detail — so they're safe to expose to
  every authenticated user regardless of their own RLS scope.
- Territory table: pagination removed in favor of an internally scrolling
  table (both vertical and horizontal), sticky header preserved.
- Territory table: added ASM Area and BDE Name columns. BDE Name is pulled
  via a join from `territory_assignment` → `hierarchy`. Search now matches
  either territory code or ASM area.
- Vacant/Direct territories: `territory_assignment` gained a `status` column
  (`assigned` / `vacant` / `direct`). When a territory is `vacant`, the BDE
  Name column always shows "Vacant" — even though internally the
  `employee_code` may point to whichever higher-level manager is covering
  it, so no senior person's name is ever shown in their place.
- Growth % is now a separate sortable column on the territory table
  (previously only ₹ Change was sortable).

**Run `db_migration_phase8.sql` in SQL Editor before testing any of this** —
none of it works until the field_config fix, the new status column, and the
PAN India functions exist in the database.

## Phase 9 — Period redesign + Reports page

- **Report Period redesign:** replaced the old range+toggle UI with four
  tabs matching standard reporting terms:
  - **YTD** — FY start (April) through a chosen "as of" month (defaults to
    the last completed month), vs. the same span last year
  - **MoM** — a single month vs. the month right before it
  - **YoY** — a single month vs. the same month last year
  - **Custom Range** — the original Start/End month pickers, kept
    specifically for multi-month spans like quarters, with "Last Year Same
    Period" or a fully custom comparison range
  All the date-shifting math lives in `ReportContext.tsx`'s `computeRanges()`.
- **Custom Report Builder moved to its own page** (`/reports`, `Reports.tsx`),
  no longer squeezed below Territory Performance on the Dashboard. Both
  pages now share loaded report data via `ReportContext` (`context/
  ReportContext.tsx`) rather than each fetching independently — apply a
  report on the Dashboard, then switch to Reports and build a custom
  breakdown of that same data.
- Added `react-router-dom` routing (`/` = Dashboard/SalesReport, `/reports`
  = Reports) and `vercel.json` with a SPA rewrite rule so refreshing `/reports`
  directly doesn't 404 on Vercel.
- NavBar's Dashboard/Reports links are now real, active-state-aware routes;
  Customers/Data/Admin remain visibly disabled placeholders (grayed out,
  non-clickable) rather than dead `href="#"` links, since those pages don't
  exist yet.
