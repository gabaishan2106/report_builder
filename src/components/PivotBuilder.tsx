import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { SalesRow, FieldConfigRow, PivotFilter, GrowthResult } from '../types'
import { formatCurrency, calculateGrowth } from '../lib/growth'
import { computePivot, getDistinctFieldValues } from '../lib/pivotEngine'
import './PivotBuilder.css'

interface Props {
  currentRows: SalesRow[] // despite the name, callers may pass combined current+comparison rows
}

const COLUMN_FIELD_OPTIONS = [
  { field: 'financial_year', label: 'Financial Year' },
  { field: 'month', label: 'Month' },
]

export default function PivotBuilder({ currentRows }: Props) {
  const [fields, setFields] = useState<FieldConfigRow[]>([])
  const [loadingFields, setLoadingFields] = useState(true)

  const [rowFields, setRowFields] = useState<string[]>([])
  const [columnFields, setColumnFields] = useState<string[]>(['month'])
  const [filters, setFilters] = useState<PivotFilter[]>([])
  const [valueField, setValueField] = useState<'amount' | 'qty'>('amount')

  const [pivotResult, setPivotResult] = useState<ReturnType<typeof computePivot> | null>(null)

  const [growthColA, setGrowthColA] = useState('')
  const [growthColB, setGrowthColB] = useState('')
  const [growthResults, setGrowthResults] = useState<Map<string, GrowthResult> | null>(null)

  useEffect(() => {
    supabase
      .from('field_config')
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        setLoadingFields(false)
        if (!error && data) setFields(data as FieldConfigRow[])
      })
  }, [])

  function toggleRowField(fieldName: string) {
    setRowFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    )
  }

  function toggleColumnField(fieldName: string) {
    setColumnFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    )
  }

  function addFilter() {
    if (fields.length === 0) return
    setFilters((prev) => [
      ...prev,
      { id: `f${Date.now()}`, field: fields[0].field_name, selectedValues: [] },
    ])
  }

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id))
  }

  function updateFilterField(id: string, fieldName: string) {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, field: fieldName, selectedValues: [] } : f))
    )
  }

  function toggleFilterValue(id: string, value: string) {
    setFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const has = f.selectedValues.includes(value)
        return {
          ...f,
          selectedValues: has
            ? f.selectedValues.filter((v) => v !== value)
            : [...f.selectedValues, value],
        }
      })
    )
  }

  function runPivot() {
    const result = computePivot(currentRows, rowFields, columnFields, filters, valueField)
    setPivotResult(result)
    setGrowthResults(null)
    setGrowthColA('')
    setGrowthColB('')
  }

  function addGrowthColumn() {
    if (!pivotResult || !growthColA || !growthColB) return
    const map = new Map<string, GrowthResult>()
    for (const row of pivotResult.rows) {
      const current = row.values[growthColA] ?? 0
      const previous = row.values[growthColB] ?? 0
      map.set(row.rowKey, calculateGrowth(current, previous))
    }
    setGrowthResults(map)
  }

  function resetAll() {
    setRowFields([])
    setColumnFields(['month'])
    setFilters([])
    setValueField('amount')
    setPivotResult(null)
    setGrowthResults(null)
  }

  const rowFieldLabel = (fieldName: string) =>
    fields.find((f) => f.field_name === fieldName)?.display_label ?? fieldName

  const filterValueOptions = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const filter of filters) {
      if (!map.has(filter.field)) {
        map.set(filter.field, getDistinctFieldValues(currentRows, filter.field))
      }
    }
    return map
  }, [filters, currentRows])

  return (
    <div className="pivot-builder-card">
      <h2 className="pivot-builder-title">Pivot Builder</h2>
      <p className="pivot-builder-description">
        Pick fields for Rows and Filters, choose which period fields form Columns, then
        run the pivot. A growth column between any two periods is optional — nothing is
        added automatically.
      </p>

      {loadingFields ? (
        <p className="pivot-builder-loading">Loading available fields…</p>
      ) : (
        <>
          {/* ROWS */}
          <div className="pivot-zone">
            <label className="pivot-zone-label">Rows</label>
            <div className="pivot-chip-group">
              {fields.map((f) => {
                const idx = rowFields.indexOf(f.field_name)
                return (
                  <button
                    key={f.field_name}
                    type="button"
                    className={'pivot-chip' + (idx >= 0 ? ' pivot-chip-active' : '')}
                    onClick={() => toggleRowField(f.field_name)}
                  >
                    {idx >= 0 && <span className="pivot-chip-order">{idx + 1}</span>}
                    {f.display_label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* COLUMNS */}
          <div className="pivot-zone">
            <label className="pivot-zone-label">Columns (period fields)</label>
            <div className="pivot-chip-group">
              {COLUMN_FIELD_OPTIONS.map((opt) => {
                const idx = columnFields.indexOf(opt.field)
                return (
                  <button
                    key={opt.field}
                    type="button"
                    className={'pivot-chip' + (idx >= 0 ? ' pivot-chip-active' : '')}
                    onClick={() => toggleColumnField(opt.field)}
                  >
                    {idx >= 0 && <span className="pivot-chip-order">{idx + 1}</span>}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* FILTERS */}
          <div className="pivot-zone">
            <label className="pivot-zone-label">Filters</label>
            {filters.map((filter) => (
              <div className="pivot-filter-row" key={filter.id}>
                <select
                  className="pivot-select"
                  value={filter.field}
                  onChange={(e) => updateFilterField(filter.id, e.target.value)}
                >
                  {fields.map((f) => (
                    <option key={f.field_name} value={f.field_name}>
                      {f.display_label}
                    </option>
                  ))}
                </select>
                <div className="pivot-filter-values">
                  {(filterValueOptions.get(filter.field) ?? []).map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={
                        'pivot-chip pivot-chip-small' +
                        (filter.selectedValues.includes(val) ? ' pivot-chip-active' : '')
                      }
                      onClick={() => toggleFilterValue(filter.id, val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="pivot-filter-remove"
                  onClick={() => removeFilter(filter.id)}
                  aria-label="Remove filter"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="pivot-add-filter" onClick={addFilter}>
              + Add Filter
            </button>
          </div>

          {/* VALUE FIELD */}
          <div className="pivot-zone">
            <label className="pivot-zone-label">Value</label>
            <select
              className="pivot-select"
              value={valueField}
              onChange={(e) => setValueField(e.target.value as 'amount' | 'qty')}
            >
              <option value="amount">Amount</option>
              <option value="qty">Quantity</option>
            </select>
          </div>

          <div className="pivot-actions">
            <button type="button" className="pivot-run" onClick={runPivot}>
              Run Pivot
            </button>
            <button type="button" className="pivot-reset" onClick={resetAll}>
              Reset
            </button>
          </div>

          {/* RESULT TABLE */}
          {pivotResult && (
            <>
              <div className="pivot-result-scroll">
                <table className="pivot-result-table">
                  <thead>
                    <tr>
                      {(rowFields.length > 0 ? rowFields : ['All']).map((f) => (
                        <th key={f}>{rowFields.length > 0 ? rowFieldLabel(f) : 'All'}</th>
                      ))}
                      {pivotResult.columns.map((col) => (
                        <th key={col} className="pivot-col-right">
                          {col}
                        </th>
                      ))}
                      {growthResults && <th className="pivot-col-right">Growth</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotResult.rows.map((row) => (
                      <tr key={row.rowKey}>
                        {row.labelParts.map((part, i) => (
                          <td key={i}>{part}</td>
                        ))}
                        {pivotResult.columns.map((col) => (
                          <td key={col} className="pivot-col-right">
                            {valueField === 'amount'
                              ? formatCurrency(row.values[col] ?? 0)
                              : (row.values[col] ?? 0).toLocaleString('en-IN')}
                          </td>
                        ))}
                        {growthResults && (
                          <td className="pivot-col-right">
                            {(() => {
                              const g = growthResults.get(row.rowKey)
                              if (!g) return '—'
                              if (g.direction === 'new')
                                return <span className="growth-badge growth-new">New</span>
                              if (g.direction === 'up')
                                return <span className="growth-badge growth-up">▲ {g.percentLabel}</span>
                              if (g.direction === 'down')
                                return <span className="growth-badge growth-down">▼ {g.percentLabel}</span>
                              return <span className="growth-badge growth-flat">— {g.percentLabel}</span>
                            })()}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GROWTH COLUMN CONTROLS */}
              <div className="pivot-growth-controls">
                <span className="pivot-zone-label">Add growth column (optional)</span>
                <select
                  className="pivot-select"
                  value={growthColA}
                  onChange={(e) => setGrowthColA(e.target.value)}
                >
                  <option value="">Current column…</option>
                  {pivotResult.columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <span className="pivot-growth-vs">vs</span>
                <select
                  className="pivot-select"
                  value={growthColB}
                  onChange={(e) => setGrowthColB(e.target.value)}
                >
                  <option value="">Comparison column…</option>
                  {pivotResult.columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="pivot-add-growth"
                  onClick={addGrowthColumn}
                  disabled={!growthColA || !growthColB}
                >
                  Add Growth Column
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
