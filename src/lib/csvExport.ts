import type { SalesRow, TerritoryRow } from '../types'

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Downloads unaggregated sales_data rows for the selected period (RLS-scoped already). */
export function downloadRawData(rows: SalesRow[], periodLabel: string) {
  if (rows.length === 0) return

  const columns: (keyof SalesRow)[] = [
    'seller_code', 'seller_name', 'buyer_name', 'buyer_code',
    'financial_year', 'month', 'item_code', 'item_name',
    'qty', 'amount', 'territory_code', 'asm_area',
    'group_name', 'category', 'top_25', 'club',
  ]

  const header = columns.join(',')
  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col])).join(',')
  )

  const csv = [header, ...lines].join('\n')
  triggerDownload(csv, `sales_data_raw_${periodLabel}.csv`)
}

/** Downloads the aggregated territory-level table shown on screen. */
export function downloadTerritorySummary(rows: TerritoryRow[], periodLabel: string) {
  if (rows.length === 0) return

  const header = 'Territory,Current Period,Comparison Period,Change,Growth %'
  const lines = rows.map((row) =>
    [
      escapeCsvValue(row.territoryCode),
      row.current,
      row.previous,
      row.growth.changeValue,
      row.growth.direction === 'new' ? 'New' : row.growth.percentLabel,
    ].join(',')
  )

  const csv = [header, ...lines].join('\n')
  triggerDownload(csv, `territory_summary_${periodLabel}.csv`)
}
