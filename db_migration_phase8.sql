-- ============================================
-- FIX 1: field_config likely has the same RLS-with-no-policy bug
-- ============================================
select relname, relrowsecurity from pg_class where relname = 'field_config';
-- If relrowsecurity = true, run this:
alter table field_config disable row level security;
grant select on field_config to authenticated;

-- ============================================
-- FIX 2: territory_assignment — add status column
-- (assigned / vacant / direct), positioned after territory_code
-- ============================================
alter table territory_assignment
  add column status text not null default 'assigned'
  check (status in ('assigned', 'vacant', 'direct'));

-- Note: Postgres doesn't support reordering columns after creation.
-- The column will be added at the end physically, but since all our
-- queries select by name (not position), this has no functional impact.
-- If you want the visual column order in the Table Editor to match,
-- you'd need to recreate the table — not necessary for the app to work.

-- ============================================
-- FIX 3: PAN India aggregate functions (company-wide, bypasses RLS)
-- These only ever return SUMMED totals, never row-level detail,
-- so they're safe to expose to every authenticated user regardless
-- of their own territory access.
-- ============================================
create or replace function get_pan_india_total(month_labels text[])
returns numeric
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0) from sales_data where month = any(month_labels);
$$;

grant execute on function get_pan_india_total(text[]) to authenticated;

create or replace function get_pan_india_by_group(month_labels text[])
returns table(group_name text, total numeric)
language sql
security definer
set search_path = public
as $$
  select coalesce(sd.group_name, 'Unassigned') as group_name, sum(sd.amount) as total
  from sales_data sd
  where sd.month = any(month_labels)
  group by coalesce(sd.group_name, 'Unassigned');
$$;

grant execute on function get_pan_india_by_group(text[]) to authenticated;

-- ============================================
-- Example: marking a territory vacant, covered temporarily by a higher-up
-- ============================================
-- update territory_assignment
-- set status = 'vacant', employee_code = 'THE_ASM_OR_HIGHER_COVERING_IT'
-- where territory_code = 'THE_VACANT_TERRITORY';
