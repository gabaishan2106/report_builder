import type { Session } from '@supabase/supabase-js'
import { useReport } from '../context/ReportContext'
import { useUserProfile, roleCanFilterByArea } from '../lib/useAuth'
import ReportControls from '../components/ReportControls'
import SummaryCards from '../components/SummaryCards'
import TerritoryTable from '../components/TerritoryTable'
import AsmAreaFilter from '../components/AsmAreaFilter'
import { formatRangeLabel } from '../lib/dateUtils'
import { downloadRawData } from '../lib/csvExport'
import './SalesReport.css'

interface Props {
  session: Session | null
}

export default function SalesReport({ session }: Props) {
  const {
    filteredCurrentRows, filteredPreviousRows, territoryRows, groupSummaries,
    totalGrowth, totalPanIndiaGrowth,
    appliedCurrentRange, appliedPreviousRange,
    hasReport, error, applyReport,
    selectedAsmAreas, setSelectedAsmAreas, availableAsmAreas,
  } = useReport()

  const { role } = useUserProfile(session)
  const showAreaFilter = roleCanFilterByArea(role) && availableAsmAreas.length > 1

  const distinctTerritoryCount = new Set(
    filteredCurrentRows.map((r) => r.territory_code ?? 'Unknown')
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
          onClick={() => downloadRawData(filteredCurrentRows, filteredPreviousRows, periodLabel)}
          disabled={filteredCurrentRows.length === 0 && filteredPreviousRows.length === 0}
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
          <div className="sales-report-context-row">
            <p className="sales-report-context">
              Showing: {formatRangeLabel(appliedCurrentRange.startValue, appliedCurrentRange.endValue)} vs{' '}
              {formatRangeLabel(appliedPreviousRange.startValue, appliedPreviousRange.endValue)}
              {' · '}
              {distinctTerritoryCount} Territories
            </p>
            {showAreaFilter && (
              <AsmAreaFilter
                areas={availableAsmAreas}
                selected={selectedAsmAreas}
                onChange={setSelectedAsmAreas}
              />
            )}
          </div>

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
