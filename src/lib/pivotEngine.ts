import type { SalesRow, PivotFilter, PivotRowResult } from '../types'
import { parseMonthLabel } from './dateUtils'

export function getFieldValue(row: SalesRow, fieldName: string): string {
  const value = (row as unknown as Record<string, unknown>)[fieldName]
  return value === null || value === undefined || value === '' ? 'Unassigned' : String(value)
}

export function getDistinctFieldValues(rows: SalesRow[], fieldName: string): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    set.add(getFieldValue(row, fieldName))
  }
  return Array.from(set).sort()
}

export function applyFilters(rows: SalesRow[], filters: PivotFilter[]): SalesRow[] {
  const activeFilters = filters.filter((f) => f.selectedValues.length > 0)
  if (activeFilters.length === 0) return rows

  return rows.filter((row) =>
    activeFilters.every((f) => f.selectedValues.includes(getFieldValue(row, f.field)))
  )
}

/**
 * Sorts column keys sensibly: month parts sort chronologically (via
 * parseMonthLabel), everything else sorts alphabetically. Keys are
 * compared part-by-part (columns can be composite, e.g. "FY2627 | Apr-26").
 */
export function sortColumnKeys(colKeys: string[]): string[] {
  function sortTokenFor(part: string): [number, number, string] {
    const parsed = parseMonthLabel(part)
    if (parsed) {
      return [1, parsed.year * 12 + parsed.month, part]
    }
    return [0, 0, part]
  }

  return [...colKeys].sort((a, b) => {
    const aParts = a.split(' | ')
    const bParts = b.split(' | ')
    const len = Math.max(aParts.length, bParts.length)
    for (let i = 0; i < len; i++) {
      const aTok = sortTokenFor(aParts[i] ?? '')
      const bTok = sortTokenFor(bParts[i] ?? '')
      if (aTok[0] !== bTok[0]) return aTok[0] - bTok[0]
      if (aTok[0] === 1 && aTok[1] !== bTok[1]) return aTok[1] - bTok[1]
      const strCmp = aTok[2].localeCompare(bTok[2])
      if (strCmp !== 0) return strCmp
    }
    return 0
  })
}

export interface PivotResult {
  rows: PivotRowResult[]
  columns: string[]
}

/**
 * Core pivot computation: groups filtered rows by rowFields (composite key,
 * in the order given — supports multi-field row grouping), cross-tabs by
 * columnFields (fixed to financial_year/month elsewhere, but generic here),
 * and sums valueField into each (rowKey, colKey) cell.
 */
export function computePivot(
  rows: SalesRow[],
  rowFields: string[],
  columnFields: string[],
  filters: PivotFilter[],
  valueField: 'amount' | 'qty'
): PivotResult {
  const filtered = applyFilters(rows, filters)

  const rowLabelParts = new Map<string, string[]>()
  const cells = new Map<string, Map<string, number>>()
  const colKeySet = new Set<string>()

  for (const row of filtered) {
    const rParts = rowFields.length > 0 ? rowFields.map((f) => getFieldValue(row, f)) : ['All']
    const rowKey = rParts.join(' | ')
    rowLabelParts.set(rowKey, rParts)

    const cParts = columnFields.length > 0 ? columnFields.map((f) => getFieldValue(row, f)) : ['Total']
    const colKey = cParts.join(' | ')
    colKeySet.add(colKey)

    if (!cells.has(rowKey)) cells.set(rowKey, new Map())
    const rowCells = cells.get(rowKey)!
    const value = valueField === 'amount' ? row.amount ?? 0 : row.qty ?? 0
    rowCells.set(colKey, (rowCells.get(colKey) ?? 0) + value)
  }

  const sortedColumns = sortColumnKeys(Array.from(colKeySet))

  const resultRows: PivotRowResult[] = Array.from(rowLabelParts.entries())
    .map(([rowKey, labelParts]) => {
      const rowCells = cells.get(rowKey)!
      const values: Record<string, number> = {}
      for (const col of sortedColumns) {
        values[col] = rowCells.get(col) ?? 0
      }
      return { rowKey, labelParts, values }
    })
    .sort((a, b) => a.rowKey.localeCompare(b.rowKey))

  return { rows: resultRows, columns: sortedColumns }
}
