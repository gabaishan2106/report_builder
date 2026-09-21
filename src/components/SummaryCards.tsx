import type { GroupSummary, GrowthResult } from '../types'
import { formatCurrency, formatExactCurrency } from '../lib/growth'
import './SummaryCards.css'

interface Props {
  totalCurrent: number
  totalPrevious: number
  totalGrowth: GrowthResult
  totalPanIndiaGrowth?: GrowthResult
  groups: GroupSummary[]
}

function GrowthBadge({ growth }: { growth: GrowthResult }) {
  if (growth.direction === 'new') {
    return <span className="growth-badge growth-new">New</span>
  }
  if (growth.direction === 'up') {
    return <span className="growth-badge growth-up">▲ {growth.percentLabel}</span>
  }
  if (growth.direction === 'down') {
    return <span className="growth-badge growth-down">▼ {growth.percentLabel}</span>
  }
  return <span className="growth-badge growth-flat">— {growth.percentLabel}</span>
}

function PanIndiaBadge({ growth }: { growth?: GrowthResult }) {
  if (!growth) return null
  const label =
    growth.direction === 'new'
      ? 'New'
      : `${growth.direction === 'up' ? '▲' : growth.direction === 'down' ? '▼' : '—'} ${growth.percentLabel}`
  return (
    <span className="pan-india-badge" title="PAN India growth for the same period">
      PAN India {label}
    </span>
  )
}

export default function SummaryCards({
  totalCurrent,
  totalPrevious,
  totalGrowth,
  totalPanIndiaGrowth,
  groups,
}: Props) {
  return (
    <div>
      <h2 className="summary-section-title">Sales Summary</h2>
      <div className="summary-card summary-card-total">
        <PanIndiaBadge growth={totalPanIndiaGrowth} />
        <div className="summary-card-label">Total Sales</div>
        <div
          className="summary-card-value"
          title={`Current: ${formatExactCurrency(totalCurrent)}  |  Previous: ${formatExactCurrency(totalPrevious)}`}
        >
          {formatCurrency(totalCurrent)}
        </div>
        <div className="summary-card-footer">
          <GrowthBadge growth={totalGrowth} />
          <span className="summary-card-vs">vs {formatCurrency(totalPrevious)}</span>
        </div>
      </div>

      <h2 className="summary-section-title">Group-wise Growth</h2>
      <div className="summary-grid">
        {groups.map((group) => (
          <div className="summary-card" key={group.groupName}>
            <PanIndiaBadge growth={group.panIndiaGrowth} />
            <div className="summary-card-label">{group.groupName}</div>
            <div
              className="summary-card-value"
              title={`Current: ${formatExactCurrency(group.current)}  |  Previous: ${formatExactCurrency(group.previous)}`}
            >
              {formatCurrency(group.current)}
            </div>
            <div className="summary-card-footer">
              <GrowthBadge growth={group.growth} />
              <span className="summary-card-vs">vs {formatCurrency(group.previous)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
