import { useReport } from '../context/ReportContext'
import CustomReportBuilder from '../components/CustomReportBuilder'
import './Reports.css'

export default function Reports() {
  const { currentRows, hasReport, appliedCurrentRange } = useReport()

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1 className="reports-title">Reports</h1>
        <p className="reports-subtitle">
          Build a custom breakdown of your currently loaded Sales Report period using
          any allowed field.
        </p>
      </div>

      {!hasReport ? (
        <div className="reports-empty">
          <p className="reports-empty-title">No report loaded yet</p>
          <p className="reports-empty-body">
            Go to the Dashboard, pick a period, and click Apply Report — this page will
            then let you build a custom breakdown of that same data.
          </p>
        </div>
      ) : (
        <>
          <p className="reports-context">
            Using data from: {appliedCurrentRange.startValue} to {appliedCurrentRange.endValue}
          </p>
          <CustomReportBuilder currentRows={currentRows} defaultExpanded standalone />
        </>
      )}
    </div>
  )
}
