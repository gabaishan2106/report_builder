import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { FieldConfigRow, SalesRow } from '../types'
import { formatCurrency } from '../lib/growth'
import './CustomReportBuilder.css'

interface Props {
  currentRows: SalesRow[]
  defaultExpanded?: boolean
  standalone?: boolean
}

export default function CustomReportBuilder({ currentRows, defaultExpanded = false, standalone = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [fields, setFields] = useState<FieldConfigRow[]>([])
  const [groupByField, setGroupByField] = useState<string>('')
  const [valueField, setValueField] = useState<'amount' | 'qty'>('amount')
  const [loadingFields, setLoadingFields] = useState(false)

  useEffect(() => {
    if (!expanded || fields.length > 0) return

    setLoadingFields(true)
    supabase
      .from('field_config')
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        setLoadingFields(false)
        if (!error && data) {
          setFields(data as FieldConfigRow[])
          if (data.length > 0) setGroupByField(data[0].field_name)
        }
      })
  }, [expanded, fields.length])

  const pivotRows = useMemo(() => {
    if (!groupByField) return []

    const totals = new Map<string, number>()
    for (const row of currentRows) {
      const key = String((row as unknown as Record<string, unknown>)[groupByField] ?? 'Unassigned')
      const value = valueField === 'amount' ? row.amount ?? 0 : row.qty ?? 0
      totals.set(key, (totals.get(key) ?? 0) + value)
    }

    return Array.from(totals.entries())
      .map(([key, total]) => ({ key, total }))
      .sort((a, b) => b.total - a.total)
  }, [currentRows, groupByField, valueField])

  return (
    <div className="pivot-card">
      {!standalone && (
        <button
          type="button"
          className="pivot-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          <span>Custom Report Builder</span>
          <span className="pivot-toggle-icon">{expanded ? '−' : '+'}</span>
        </button>
      )}

      {expanded && (
        <div className="pivot-body">
          <p className="pivot-description">
            Build a custom breakdown of the currently loaded period using any allowed
            field. This is separate from the fixed Territory Performance view above.
          </p>

          {loadingFields ? (
            <p className="pivot-loading">Loading available fields…</p>
          ) : (
            <>
              <div className="pivot-controls">
                <div className="pivot-field">
                  <label className="pivot-label">Group by</label>
                  <select
                    className="pivot-select"
                    value={groupByField}
                    onChange={(e) => setGroupByField(e.target.value)}
                  >
                    {fields.map((f) => (
                      <option key={f.field_name} value={f.field_name}>
                        {f.display_label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pivot-field">
                  <label className="pivot-label">Value</label>
                  <select
                    className="pivot-select"
                    value={valueField}
                    onChange={(e) => setValueField(e.target.value as 'amount' | 'qty')}
                  >
                    <option value="amount">Amount</option>
                    <option value="qty">Quantity</option>
                  </select>
                </div>
              </div>

              <div className="pivot-table-scroll">
                <table className="pivot-table">
                  <thead>
                    <tr>
                      <th>{fields.find((f) => f.field_name === groupByField)?.display_label ?? 'Group'}</th>
                      <th className="pivot-col-right">
                        {valueField === 'amount' ? 'Amount' : 'Quantity'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pivotRows.map((r) => (
                      <tr key={r.key}>
                        <td>{r.key}</td>
                        <td className="pivot-col-right">
                          {valueField === 'amount' ? formatCurrency(r.total) : r.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
