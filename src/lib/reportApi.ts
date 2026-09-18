import { supabase } from './supabaseClient'
import type { SalesRow, GroupSummary, TerritoryRow } from '../types'
import { calculateGrowth } from './growth'

const PAGE_SIZE = 1000

/**
 * Fetches sales_data rows for the given list of month labels.
 * RLS on sales_data means this automatically returns only rows the
 * logged-in user is allowed to see (their hierarchy's territories) —
 * no manual filtering by territory is needed on the frontend.
 *
 * PostgREST caps any single request at 1000 rows by default, so this
 * pages through with .range() until a page comes back short (meaning
 * we've reached the end) rather than trusting one request to return
 * everything.
 */
export async function fetchSalesRows(monthLabels: string[]): Promise<SalesRow[]> {
  if (monthLabels.length === 0) return []

  const allRows: SalesRow[] = []
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('sales_data')
      .select('*')
      .in('month', monthLabels)
      .range(from, to)

    if (error) {
      throw new Error(error.message)
    }

    const page = (data ?? []) as SalesRow[]
    allRows.push(...page)

    if (page.length < PAGE_SIZE) {
      break
    }
    from += PAGE_SIZE
  }

  return allRows
}

function sumAmount(rows: SalesRow[]): number {
  return rows.reduce((total, row) => total + (row.amount ?? 0), 0)
}

export function getTotalGrowth(currentRows: SalesRow[], previousRows: SalesRow[]) {
  const current = sumAmount(currentRows)
  const previous = sumAmount(previousRows)
  return { current, previous, growth: calculateGrowth(current, previous) }
}

/** Groups rows by group_name and computes growth per group. Purely data-driven — never hardcoded. */
export function aggregateByGroup(
  currentRows: SalesRow[],
  previousRows: SalesRow[]
): GroupSummary[] {
  const currentByGroup = new Map<string, number>()
  const previousByGroup = new Map<string, number>()

  for (const row of currentRows) {
    const key = row.group_name ?? 'Unassigned'
    currentByGroup.set(key, (currentByGroup.get(key) ?? 0) + (row.amount ?? 0))
  }
  for (const row of previousRows) {
    const key = row.group_name ?? 'Unassigned'
    previousByGroup.set(key, (previousByGroup.get(key) ?? 0) + (row.amount ?? 0))
  }

  const allGroupNames = new Set([...currentByGroup.keys(), ...previousByGroup.keys()])

  return Array.from(allGroupNames)
    .map((groupName) => {
      const current = currentByGroup.get(groupName) ?? 0
      const previous = previousByGroup.get(groupName) ?? 0
      return { groupName, current, previous, growth: calculateGrowth(current, previous) }
    })
    .sort((a, b) => b.current - a.current)
}

/** Groups rows by territory_code and computes growth per territory. */
export function aggregateByTerritory(
  currentRows: SalesRow[],
  previousRows: SalesRow[]
): TerritoryRow[] {
  const currentByTerritory = new Map<string, number>()
  const previousByTerritory = new Map<string, number>()

  for (const row of currentRows) {
    const key = row.territory_code ?? 'Unknown'
    currentByTerritory.set(key, (currentByTerritory.get(key) ?? 0) + (row.amount ?? 0))
  }
  for (const row of previousRows) {
    const key = row.territory_code ?? 'Unknown'
    previousByTerritory.set(key, (previousByTerritory.get(key) ?? 0) + (row.amount ?? 0))
  }

  const allTerritories = new Set([
    ...currentByTerritory.keys(),
    ...previousByTerritory.keys(),
  ])

  return Array.from(allTerritories).map((territoryCode) => {
    const current = currentByTerritory.get(territoryCode) ?? 0
    const previous = previousByTerritory.get(territoryCode) ?? 0
    return { territoryCode, current, previous, growth: calculateGrowth(current, previous) }
  })
}
