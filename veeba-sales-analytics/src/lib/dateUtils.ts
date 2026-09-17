const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Parses a "MMM-YY" label like "Apr-25" into { month: 0-11, year: 2025 } */
export function parseMonthLabel(label: string): { month: number; year: number } | null {
  const match = /^([A-Za-z]{3})-(\d{2})$/.exec(label.trim())
  if (!match) return null
  const monthIdx = MONTH_ABBR.findIndex(
    (m) => m.toLowerCase() === match[1].toLowerCase()
  )
  if (monthIdx === -1) return null
  const year = 2000 + parseInt(match[2], 10)
  return { month: monthIdx, year }
}

/** Formats { month: 0-11, year } back into "MMM-YY" */
export function formatMonthLabel(month: number, year: number): string {
  const yy = String(year % 100).padStart(2, '0')
  return `${MONTH_ABBR[month]}-${yy}`
}

/** Converts an <input type="month"> value ("2026-04") into { month, year } */
export function parseInputMonthValue(value: string): { month: number; year: number } | null {
  const [yearStr, monthStr] = value.split('-')
  if (!yearStr || !monthStr) return null
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) - 1 }
}

/** Converts { month, year } into an <input type="month"> value ("2026-04") */
export function toInputMonthValue(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/** Returns an absolute month index for easy arithmetic/sorting */
function toAbsoluteIndex(month: number, year: number): number {
  return year * 12 + month
}

function fromAbsoluteIndex(index: number): { month: number; year: number } {
  return { month: ((index % 12) + 12) % 12, year: Math.floor(index / 12) }
}

/** All "MMM-YY" labels between start and end (inclusive), given input-month values */
export function monthsBetween(startValue: string, endValue: string): string[] {
  const start = parseInputMonthValue(startValue)
  const end = parseInputMonthValue(endValue)
  if (!start || !end) return []

  const startIdx = toAbsoluteIndex(start.month, start.year)
  const endIdx = toAbsoluteIndex(end.month, end.year)
  const labels: string[] = []

  for (let i = Math.min(startIdx, endIdx); i <= Math.max(startIdx, endIdx); i++) {
    const { month, year } = fromAbsoluteIndex(i)
    labels.push(formatMonthLabel(month, year))
  }
  return labels
}

/**
 * Shifts a month range back by `monthsBack` months.
 * Used for "Last Year Same Period" (monthsBack = 12) and
 * "Last Month Same Period" (monthsBack = 1).
 */
export function shiftMonthRange(
  startValue: string,
  endValue: string,
  monthsBack: number
): { startValue: string; endValue: string } {
  const start = parseInputMonthValue(startValue)
  const end = parseInputMonthValue(endValue)
  if (!start || !end) return { startValue, endValue }

  const shiftedStartIdx = toAbsoluteIndex(start.month, start.year) - monthsBack
  const shiftedEndIdx = toAbsoluteIndex(end.month, end.year) - monthsBack

  const shiftedStart = fromAbsoluteIndex(shiftedStartIdx)
  const shiftedEnd = fromAbsoluteIndex(shiftedEndIdx)

  return {
    startValue: toInputMonthValue(shiftedStart.month, shiftedStart.year),
    endValue: toInputMonthValue(shiftedEnd.month, shiftedEnd.year),
  }
}

/** Human-readable label for a month range, e.g. "Apr 2026 – Aug 2026" */
export function formatRangeLabel(startValue: string, endValue: string): string {
  const start = parseInputMonthValue(startValue)
  const end = parseInputMonthValue(endValue)
  if (!start || !end) return ''

  const fullMonth = (m: number) =>
    new Date(2000, m, 1).toLocaleString('en-US', { month: 'short' })

  return `${fullMonth(start.month)} ${start.year} – ${fullMonth(end.month)} ${end.year}`
}
