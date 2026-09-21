import type { GrowthResult } from '../types'

/**
 * Growth display rules (per spec):
 * - previous = 0 and current > 0  -> "New"
 * - previous = 0 and current = 0  -> "—"
 * - percent > 0  -> "↑ +X.X%"
 * - percent < 0  -> "↓ -X.X%"
 * - percent = 0  -> "— 0.0%"
 * Never returns Infinity/NaN/undefined.
 */
export function calculateGrowth(current: number, previous: number): GrowthResult {
  const changeValue = current - previous

  if (previous === 0 && current > 0) {
    return { direction: 'new', percentLabel: '', percentValue: Number.POSITIVE_INFINITY, changeValue }
  }
  if (previous === 0 && current === 0) {
    return { direction: 'flat', percentLabel: '0.0%', percentValue: 0, changeValue: 0 }
  }

  const percent = (changeValue / previous) * 100

  if (!Number.isFinite(percent)) {
    return { direction: 'flat', percentLabel: '0.0%', percentValue: 0, changeValue }
  }

  const rounded = Math.abs(percent).toFixed(1)

  if (percent > 0) {
    return { direction: 'up', percentLabel: `+${rounded}%`, percentValue: percent, changeValue }
  }
  if (percent < 0) {
    return { direction: 'down', percentLabel: `-${rounded}%`, percentValue: percent, changeValue }
  }
  return { direction: 'flat', percentLabel: '0.0%', percentValue: 0, changeValue }
}

/** Full precision currency, for tooltips — no Cr/L abbreviation. */
export function formatExactCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatCurrency(value: number): string {
  // Indian numbering (lakhs/crores) matches the spec's ₹ examples
  if (Math.abs(value) >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)} Cr`
  }
  if (Math.abs(value) >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
