import { useMemo, useState } from 'react'
import type { TerritoryRow } from '../types'
import { formatCurrency } from '../lib/growth'
import { downloadTerritorySummary } from '../lib/csvExport'
import './TerritoryTable.css'

interface Props {
  rows: TerritoryRow[]
  periodLabel: string
}

type SortKey = 'territoryCode' | 'current' | 'previous' | 'changeValue'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 15

export default function TerritoryTable({ rows, periodLabel }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('current')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const base = term
      ? rows.filter((r) => r.territoryCode.toLowerCase().includes(term))
      : rows

    const sorted = [...base].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'territoryCode') {
        cmp = a.territoryCode.localeCompare(b.territoryCode)
      } else if (sortKey === 'changeValue') {
        cmp = a.growth.changeValue - b.growth.changeValue
      } else {
        cmp = a[sortKey] - b[sortKey]
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [rows, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="territory-card">
      <div className="territory-header">
        <div>
          <h2 className="territory-title">Territory Performance</h2>
          <p className="territory-subtitle">
            Sales performance across your accessible territories.
          </p>
        </div>
        <div className="territory-count">{rows.length} Territories</div>
      </div>

      <input
        type="text"
        className="territory-search"
        placeholder="Search territory code..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
      />

      {rows.length === 0 ? (
        <div className="territory-empty">
          <p className="territory-empty-title">No sales data found</p>
          <p className="territory-empty-body">
            There's no sales data available for the selected period and your assigned
            territories.
          </p>
        </div>
      ) : (
        <>
          <div className="territory-table-scroll">
            <table className="territory-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('territoryCode')}>
                    Territory{sortIndicator('territoryCode')}
                  </th>
                  <th className="territory-col-right" onClick={() => toggleSort('current')}>
                    Current Period{sortIndicator('current')}
                  </th>
                  <th className="territory-col-right" onClick={() => toggleSort('previous')}>
                    Comparison Period{sortIndicator('previous')}
                  </th>
                  <th className="territory-col-right" onClick={() => toggleSort('changeValue')}>
                    Change{sortIndicator('changeValue')}
                  </th>
                  <th className="territory-col-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.territoryCode}>
                    <td>{row.territoryCode}</td>
                    <td className="territory-col-right">{formatCurrency(row.current)}</td>
                    <td className="territory-col-right">{formatCurrency(row.previous)}</td>
                    <td className="territory-col-right">
                      {row.growth.changeValue >= 0 ? '+' : ''}
                      {formatCurrency(row.growth.changeValue)}
                    </td>
                    <td className="territory-col-right">
                      {row.growth.direction === 'new' ? (
                        <span className="growth-badge growth-new">New</span>
                      ) : row.growth.direction === 'up' ? (
                        <span className="growth-badge growth-up">▲ {row.growth.percentLabel}</span>
                      ) : row.growth.direction === 'down' ? (
                        <span className="growth-badge growth-down">▼ {row.growth.percentLabel}</span>
                      ) : (
                        <span className="growth-badge growth-flat">— {row.growth.percentLabel}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="territory-footer">
            <div className="territory-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>

            <button
              type="button"
              className="territory-download"
              onClick={() => downloadTerritorySummary(filtered, periodLabel)}
            >
              Download Territory Summary
            </button>
          </div>
        </>
      )}
    </div>
  )
}
