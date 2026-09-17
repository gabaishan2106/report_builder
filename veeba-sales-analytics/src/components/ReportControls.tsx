import type { ComparisonMode } from '../types'
import './ReportControls.css'

interface Props {
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  comparisonMode: ComparisonMode
  onComparisonModeChange: (mode: ComparisonMode) => void
  customStartValue: string
  customEndValue: string
  onCustomStartChange: (value: string) => void
  onCustomEndChange: (value: string) => void
  onApply: () => void
  loading: boolean
}

const COMPARISON_OPTIONS: { mode: ComparisonMode; label: string }[] = [
  { mode: 'yoy', label: 'Last Year Same Period' },
  { mode: 'mom', label: 'Last Month Same Period' },
  { mode: 'custom', label: 'Custom' },
]

export default function ReportControls({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  comparisonMode,
  onComparisonModeChange,
  customStartValue,
  customEndValue,
  onCustomStartChange,
  onCustomEndChange,
  onApply,
  loading,
}: Props) {
  return (
    <div className="report-controls-card">
      <h2 className="report-controls-title">Report Period</h2>

      <div className="report-controls-row">
        <div className="report-controls-field">
          <label className="report-controls-label">Start Month</label>
          <input
            type="month"
            className="report-controls-input"
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
          />
        </div>
        <div className="report-controls-field">
          <label className="report-controls-label">End Month</label>
          <input
            type="month"
            className="report-controls-input"
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </div>
      </div>

      <label className="report-controls-label" style={{ marginTop: 20 }}>
        Compare With
      </label>
      <div className="report-controls-toggle-group">
        {COMPARISON_OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            className={
              'report-controls-toggle' +
              (comparisonMode === opt.mode ? ' report-controls-toggle-active' : '')
            }
            onClick={() => onComparisonModeChange(opt.mode)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {comparisonMode === 'custom' && (
        <div className="report-controls-row" style={{ marginTop: 16 }}>
          <div className="report-controls-field">
            <label className="report-controls-label">Comparison Start Month</label>
            <input
              type="month"
              className="report-controls-input"
              value={customStartValue}
              onChange={(e) => onCustomStartChange(e.target.value)}
            />
          </div>
          <div className="report-controls-field">
            <label className="report-controls-label">Comparison End Month</label>
            <input
              type="month"
              className="report-controls-input"
              value={customEndValue}
              onChange={(e) => onCustomEndChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className="report-controls-apply"
        onClick={onApply}
        disabled={loading}
      >
        {loading ? 'Generating…' : 'Apply Report'}
      </button>
    </div>
  )
}
