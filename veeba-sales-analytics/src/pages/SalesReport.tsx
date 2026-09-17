import { useState } from 'react'
import ReportControls from '../components/ReportControls'
import SummaryCards from '../components/SummaryCards'
import TerritoryTable from '../components/TerritoryTable'
import CustomReportBuilder from '../components/CustomReportBuilder'
import type { ComparisonMode, SalesRow } from '../types'
import {
  monthsBetween,
  shiftMonthRange,
  formatRangeLabel,
  toInputMonthValue,
} from '../lib/dateUtils'
import {
  fetchSalesRows,
  getTotalGrowth,
  aggregateByGroup,
  aggregateByTerritory,
} from '../lib/reportApi'
import { downloadRawData } from '../lib/csvExport'
import './SalesReport.css'

const today = new Date()
const defaultEnd = toInputMonthValue(today.getMonth(), today.getFullYear())
const defaultStart = toInputMonthValue(today.getMonth(), today.getFullYear())

export default function SalesReport() {
  const [startValue, setStartValue] = useState(defaultStart)
  const [endValue, setEndValue] = useState(defaultEnd)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('yoy')
  const [customStartValue, setCustomStartValue] = useState(defaultStart)
  const [customEndValue, setCustomEndValue] = useState(defaultEnd)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasReport, setHasReport] = useState(false)

  const [currentRows, setCurrentRows] = useState<SalesRow[]>([])
  const [previousRows, setPreviousRows] = useState<SalesRow[]>([])
  const [appliedCurrentRange, setAppliedCurrentRange] = useState({ startValue, endValue })
  const [appliedPreviousRange, setAppliedPreviousRange] = useState({ startValue, endValue })

  async function handleApply() {
    setLoading(true)
    setError(null)

    try {
      const currentLabels = monthsBetween(startValue, endValue)

      let previousStart = customStartValue
      let previousEnd = customEndValue

      if (comparisonMode === 'yoy') {
        const shifted = shiftMonthRange(startValue, endValue, 12)
        previousStart = shifted.startValue
        previousEnd = shifted.endValue
      } else if (comparisonMode === 'mom') {
        const shifted = shiftMonthRange(startValue, endValue, 1)
        previousStart = shifted.startValue
        previousEnd = shifted.endValue
      }

      const previousLabels = monthsBetween(previousStart, previousEnd)

      const [curr, prev] = await Promise.all([
        fetchSalesRows(currentLabels),
        fetchSalesRows(previousLabels),
      ])

      setCurrentRows(curr)
      setPreviousRows(prev)
      setAppliedCurrentRange({ startValue, endValue })
      setAppliedPreviousRange({ startValue: previousStart, endValue: previousEnd })
      setHasReport(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const totalGrowth = getTotalGrowth(currentRows, previousRows)
  const groupSummaries = aggregateByGroup(currentRows, previousRows)
  const territoryRows = aggregateByTerritory(currentRows, previousRows)

  const distinctTerritoryCount = new Set(
    currentRows.map((r) => r.territory_code ?? 'Unknown')
  ).size

  const periodLabel = `${appliedCurrentRange.startValue}_to_${appliedCurrentRange.endValue}`

  return (
    <div className="sales-report-page">
      <div className="sales-report-header">
        <div>
          <h1 className="sales-report-title">Sales Report</h1>
          <p className="sales-report-subtitle">
            Analyze sales performance across your assigned territories.
          </p>
        </div>
        <button
          type="button"
          className="sales-report-download-raw"
          onClick={() => downloadRawData(currentRows, periodLabel)}
          disabled={currentRows.length === 0}
        >
          Download Raw Data
        </button>
      </div>

      <ReportControls
        startValue={startValue}
        endValue={endValue}
        onStartChange={setStartValue}
        onEndChange={setEndValue}
        comparisonMode={comparisonMode}
        onComparisonModeChange={setComparisonMode}
        customStartValue={customStartValue}
        customEndValue={customEndValue}
        onCustomStartChange={setCustomStartValue}
        onCustomEndChange={setCustomEndValue}
        onApply={handleApply}
        loading={loading}
      />

      {error && (
        <div className="sales-report-error">
          <p className="sales-report-error-title">Unable to generate report</p>
          <p className="sales-report-error-body">
            We couldn't retrieve the sales data. Please try again.
          </p>
          <button type="button" className="sales-report-retry" onClick={handleApply}>
            Try Again
          </button>
        </div>
      )}

      {hasReport && !error && (
        <>
          <p className="sales-report-context">
            Showing: {formatRangeLabel(appliedCurrentRange.startValue, appliedCurrentRange.endValue)} vs{' '}
            {formatRangeLabel(appliedPreviousRange.startValue, appliedPreviousRange.endValue)}
            {' · '}
            {distinctTerritoryCount} Territories
          </p>

          <SummaryCards
            totalCurrent={totalGrowth.current}
            totalPrevious={totalGrowth.previous}
            totalGrowth={totalGrowth.growth}
            groups={groupSummaries}
          />

          <TerritoryTable rows={territoryRows} periodLabel={periodLabel} />

          <CustomReportBuilder currentRows={currentRows} />
        </>
      )}
    </div>
  )
}
