import { useReport } from '../context/ReportContext'
import type { PeriodMode, CustomCompareMode } from '../types'
import './ReportControls.css'

const MODE_TABS: { mode: PeriodMode; label: string }[] = [
  { mode: 'ytd', label: 'YTD' },
  { mode: 'mom', label: 'MoM' },
  { mode: 'yoy', label: 'YoY' },
  { mode: 'custom', label: 'Custom Range' },
]

export default function ReportControls() {
  const {
    periodMode, setPeriodMode,
    ytdAsOf, setYtdAsOf,
    momMonth, setMomMonth,
    yoyMonth, setYoyMonth,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    customCompareMode, setCustomCompareMode,
    customCompareStart, setCustomCompareStart,
    customCompareEnd, setCustomCompareEnd,
    loading, applyReport,
  } = useReport()

  return (
    <div className="report-controls-card">
      <h2 className="report-controls-title">Report Period</h2>

      <div className="report-controls-toggle-group">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            className={
              'report-controls-toggle' +
              (periodMode === tab.mode ? ' report-controls-toggle-active' : '')
            }
            onClick={() => setPeriodMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="report-controls-body">
        {periodMode === 'ytd' && (
          <div className="report-controls-field">
            <label className="report-controls-label">As of month (defaults to last completed month)</label>
            <input
              type="month"
              className="report-controls-input"
              value={ytdAsOf}
              onChange={(e) => setYtdAsOf(e.target.value)}
            />
            <p className="report-controls-hint">
              Compares FY start through this month vs. the same span last year.
            </p>
          </div>
        )}

        {periodMode === 'mom' && (
          <div className="report-controls-field">
            <label className="report-controls-label">Month</label>
            <input
              type="month"
              className="report-controls-input"
              value={momMonth}
              onChange={(e) => setMomMonth(e.target.value)}
            />
            <p className="report-controls-hint">Compares this month vs. the month right before it.</p>
          </div>
        )}

        {periodMode === 'yoy' && (
          <div className="report-controls-field">
            <label className="report-controls-label">Month</label>
            <input
              type="month"
              className="report-controls-input"
              value={yoyMonth}
              onChange={(e) => setYoyMonth(e.target.value)}
            />
            <p className="report-controls-hint">Compares this month vs. the same month last year.</p>
          </div>
        )}

        {periodMode === 'custom' && (
          <>
            <div className="report-controls-row">
              <div className="report-controls-field">
                <label className="report-controls-label">Start Month</label>
                <input
                  type="month"
                  className="report-controls-input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="report-controls-field">
                <label className="report-controls-label">End Month</label>
                <input
                  type="month"
                  className="report-controls-input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>

            <label className="report-controls-label" style={{ marginTop: 16 }}>
              Compare With
            </label>
            <div className="report-controls-toggle-group">
              {(['yoy', 'custom'] as CustomCompareMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={
                    'report-controls-toggle' +
                    (customCompareMode === m ? ' report-controls-toggle-active' : '')
                  }
                  onClick={() => setCustomCompareMode(m)}
                >
                  {m === 'yoy' ? 'Last Year Same Period' : 'Custom'}
                </button>
              ))}
            </div>

            {customCompareMode === 'custom' && (
              <div className="report-controls-row" style={{ marginTop: 16 }}>
                <div className="report-controls-field">
                  <label className="report-controls-label">Comparison Start Month</label>
                  <input
                    type="month"
                    className="report-controls-input"
                    value={customCompareStart}
                    onChange={(e) => setCustomCompareStart(e.target.value)}
                  />
                </div>
                <div className="report-controls-field">
                  <label className="report-controls-label">Comparison End Month</label>
                  <input
                    type="month"
                    className="report-controls-input"
                    value={customCompareEnd}
                    onChange={(e) => setCustomCompareEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="report-controls-apply"
        onClick={applyReport}
        disabled={loading}
      >
        {loading ? 'Generating…' : 'Apply Report'}
      </button>
    </div>
  )
}
