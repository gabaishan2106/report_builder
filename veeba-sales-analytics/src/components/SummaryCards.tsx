import type { GroupSummary, GrowthResult } from '../types'
import { formatCurrency } from '../lib/growth'
import './SummaryCards.css'

interface Props {
  totalCurrent: number
  totalPrevious: number
  totalGrowth: GrowthResult
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

export default function SummaryCards({ totalCurrent, totalPrevious, totalGrowth, groups }: Props) {
  return (
    <div>
      <h2 className="summary-section-title">Sales Summary</h2>
      <div className="summary-grid">
        <div className="summary-card summary-card-total">
          <div className="summary-card-label">Total Sales</div>
          <div className="summary-card-value">{formatCurrency(totalCurrent)}</div>
          <div className="summary-card-footer">
            <GrowthBadge growth={totalGrowth} />
            <span className="summary-card-vs">vs {formatCurrency(totalPrevious)}</span>
          </div>
        </div>

        {groups.map((group) => (
          <div className="summary-card" key={group.groupName}>
            <div className="summary-card-label">{group.groupName}</div>
            <div className="summary-card-value">{formatCurrency(group.current)}</div>
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
