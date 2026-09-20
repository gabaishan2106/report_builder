import { useReport } from '../context/ReportContext'
import ReportControls from '../components/ReportControls'
import SummaryCards from '../components/SummaryCards'
import TerritoryTable from '../components/TerritoryTable'
import { formatRangeLabel } from '../lib/dateUtils'
import { downloadRawData } from '../lib/csvExport'
import './SalesReport.css'

export default function SalesReport() {
  const {
    currentRows, previousRows, territoryRows, groupSummaries,
    totalGrowth, totalPanIndiaGrowth,
    appliedCurrentRange, appliedPreviousRange,
    hasReport, error, applyReport,
  } = useReport()

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
          onClick={() => downloadRawData(currentRows, previousRows, periodLabel)}
          disabled={currentRows.length === 0 && previousRows.length === 0}
        >
          Download Raw Data
        </button>
      </div>

      <ReportControls />

      {error && (
        <div className="sales-report-error">
          <p className="sales-report-error-title">Unable to generate report</p>
          <p className="sales-report-error-body">
            We couldn't retrieve the sales data. Please try again.
          </p>
          <button type="button" className="sales-report-retry" onClick={applyReport}>
            Try Again
          </button>
        </div>
      )}

      {hasReport && !error && totalGrowth && (
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
            totalPanIndiaGrowth={totalPanIndiaGrowth}
            groups={groupSummaries}
          />

          <TerritoryTable rows={territoryRows} periodLabel={periodLabel} />
        </>
      )}
    </div>
  )
}
