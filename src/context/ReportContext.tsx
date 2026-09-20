import { createContext, useContext, useState, type ReactNode } from 'react'
import type { PeriodMode, CustomCompareMode, SalesRow, GroupSummary, GrowthResult, TerritoryRow } from '../types'
import {
  monthsBetween,
  shiftMonthRange,
  toInputMonthValue,
  getLastCompletedMonthValue,
  getFYStartValue,
} from '../lib/dateUtils'
import {
  fetchSalesRows,
  getTotalGrowth,
  aggregateByGroup,
  aggregateByTerritory,
  fetchTerritoryDirectory,
  attachTerritoryDirectory,
  fetchPanIndiaTotal,
  fetchPanIndiaByGroup,
} from '../lib/reportApi'
import { calculateGrowth } from '../lib/growth'

const today = new Date()
const defaultMonth = toInputMonthValue(today.getMonth(), today.getFullYear())
const defaultLastCompleted = getLastCompletedMonthValue()

interface ReportContextValue {
  // Mode + inputs
  periodMode: PeriodMode
  setPeriodMode: (m: PeriodMode) => void
  ytdAsOf: string
  setYtdAsOf: (v: string) => void
  momMonth: string
  setMomMonth: (v: string) => void
  yoyMonth: string
  setYoyMonth: (v: string) => void
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
  customCompareMode: CustomCompareMode
  setCustomCompareMode: (m: CustomCompareMode) => void
  customCompareStart: string
  setCustomCompareStart: (v: string) => void
  customCompareEnd: string
  setCustomCompareEnd: (v: string) => void

  // State
  loading: boolean
  error: string | null
  hasReport: boolean
  currentRows: SalesRow[]
  previousRows: SalesRow[]
  territoryRows: TerritoryRow[]
  groupSummaries: GroupSummary[]
  totalGrowth: { current: number; previous: number; growth: GrowthResult } | null
  totalPanIndiaGrowth: GrowthResult | undefined
  appliedCurrentRange: { startValue: string; endValue: string }
  appliedPreviousRange: { startValue: string; endValue: string }

  applyReport: () => Promise<void>
}

const ReportContext = createContext<ReportContextValue | null>(null)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('ytd')
  const [ytdAsOf, setYtdAsOf] = useState(defaultLastCompleted)
  const [momMonth, setMomMonth] = useState(defaultLastCompleted)
  const [yoyMonth, setYoyMonth] = useState(defaultLastCompleted)
  const [customStart, setCustomStart] = useState(defaultMonth)
  const [customEnd, setCustomEnd] = useState(defaultMonth)
  const [customCompareMode, setCustomCompareMode] = useState<CustomCompareMode>('yoy')
  const [customCompareStart, setCustomCompareStart] = useState(defaultMonth)
  const [customCompareEnd, setCustomCompareEnd] = useState(defaultMonth)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasReport, setHasReport] = useState(false)

  const [currentRows, setCurrentRows] = useState<SalesRow[]>([])
  const [previousRows, setPreviousRows] = useState<SalesRow[]>([])
  const [territoryRows, setTerritoryRows] = useState<TerritoryRow[]>([])
  const [groupSummaries, setGroupSummaries] = useState<GroupSummary[]>([])
  const [totalGrowth, setTotalGrowth] = useState<{ current: number; previous: number; growth: GrowthResult } | null>(null)
  const [totalPanIndiaGrowth, setTotalPanIndiaGrowth] = useState<GrowthResult | undefined>(undefined)
  const [appliedCurrentRange, setAppliedCurrentRange] = useState({ startValue: defaultMonth, endValue: defaultMonth })
  const [appliedPreviousRange, setAppliedPreviousRange] = useState({ startValue: defaultMonth, endValue: defaultMonth })

  function computeRanges() {
    if (periodMode === 'ytd') {
      const currentStart = getFYStartValue(ytdAsOf)
      const currentEnd = ytdAsOf
      const shifted = shiftMonthRange(currentStart, currentEnd, 12)
      return { currentStart, currentEnd, previousStart: shifted.startValue, previousEnd: shifted.endValue }
    }
    if (periodMode === 'mom') {
      const shifted = shiftMonthRange(momMonth, momMonth, 1)
      return { currentStart: momMonth, currentEnd: momMonth, previousStart: shifted.startValue, previousEnd: shifted.endValue }
    }
    if (periodMode === 'yoy') {
      const shifted = shiftMonthRange(yoyMonth, yoyMonth, 12)
      return { currentStart: yoyMonth, currentEnd: yoyMonth, previousStart: shifted.startValue, previousEnd: shifted.endValue }
    }
    // custom
    if (customCompareMode === 'yoy') {
      const shifted = shiftMonthRange(customStart, customEnd, 12)
      return { currentStart: customStart, currentEnd: customEnd, previousStart: shifted.startValue, previousEnd: shifted.endValue }
    }
    return { currentStart: customStart, currentEnd: customEnd, previousStart: customCompareStart, previousEnd: customCompareEnd }
  }

  async function runReport(isRetry: boolean): Promise<void> {
    const { currentStart, currentEnd, previousStart, previousEnd } = computeRanges()
    const currentLabels = monthsBetween(currentStart, currentEnd)
    const previousLabels = monthsBetween(previousStart, previousEnd)

    try {
      const [curr, prev] = await Promise.all([
        fetchSalesRows(currentLabels),
        fetchSalesRows(previousLabels),
      ])

      const territoryRowsRaw = aggregateByTerritory(curr, prev)
      const territoryCodes = territoryRowsRaw.map((r) => r.territoryCode)
      const directory = await fetchTerritoryDirectory(territoryCodes)
      const territoryRowsWithNames = attachTerritoryDirectory(territoryRowsRaw, directory)

      const groups = aggregateByGroup(curr, prev)
      const [panIndiaCurrentTotal, panIndiaPreviousTotal, panIndiaCurrentByGroup, panIndiaPreviousByGroup] =
        await Promise.all([
          fetchPanIndiaTotal(currentLabels),
          fetchPanIndiaTotal(previousLabels),
          fetchPanIndiaByGroup(currentLabels),
          fetchPanIndiaByGroup(previousLabels),
        ])

      const groupsWithPanIndia: GroupSummary[] = groups.map((g) => {
        const panCurrent = panIndiaCurrentByGroup.get(g.groupName) ?? 0
        const panPrevious = panIndiaPreviousByGroup.get(g.groupName) ?? 0
        return { ...g, panIndiaGrowth: calculateGrowth(panCurrent, panPrevious) }
      })

      setCurrentRows(curr)
      setPreviousRows(prev)
      setTerritoryRows(territoryRowsWithNames)
      setGroupSummaries(groupsWithPanIndia)
      setTotalGrowth(getTotalGrowth(curr, prev))
      setTotalPanIndiaGrowth(calculateGrowth(panIndiaCurrentTotal, panIndiaPreviousTotal))
      setAppliedCurrentRange({ startValue: currentStart, endValue: currentEnd })
      setAppliedPreviousRange({ startValue: previousStart, endValue: previousEnd })
      setHasReport(true)
      setError(null)
    } catch (err) {
      if (!isRetry) {
        await sleep(600)
        return runReport(true)
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  async function applyReport() {
    setLoading(true)
    await runReport(false)
    setLoading(false)
  }

  const value: ReportContextValue = {
    periodMode, setPeriodMode,
    ytdAsOf, setYtdAsOf,
    momMonth, setMomMonth,
    yoyMonth, setYoyMonth,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    customCompareMode, setCustomCompareMode,
    customCompareStart, setCustomCompareStart,
    customCompareEnd, setCustomCompareEnd,
    loading, error, hasReport,
    currentRows, previousRows, territoryRows, groupSummaries,
    totalGrowth, totalPanIndiaGrowth,
    appliedCurrentRange, appliedPreviousRange,
    applyReport,
  }

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>
}

export function useReport() {
  const ctx = useContext(ReportContext)
  if (!ctx) throw new Error('useReport must be used within a ReportProvider')
  return ctx
}
