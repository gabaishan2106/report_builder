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
