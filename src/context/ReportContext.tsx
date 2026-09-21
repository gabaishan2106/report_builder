import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import type { PeriodMode, CustomCompareMode, SalesRow, GroupSummary, GrowthResult, TerritoryRow, TerritoryDirectoryEntry } from '../types'
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

  // ASM Area filter (client-side, applies on top of already-loaded data)
  selectedAsmAreas: string[]
  setSelectedAsmAreas: (areas: string[]) => void
  availableAsmAreas: string[]

  // State
  loading: boolean
  error: string | null
  hasReport: boolean
  currentRows: SalesRow[] // unfiltered — used for Pivot Builder (needs full period data)
  previousRows: SalesRow[]
  filteredCurrentRows: SalesRow[] // area-filtered — used for cards/table/downloads
  filteredPreviousRows: SalesRow[]
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

  const [selectedAsmAreas, setSelectedAsmAreas] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasReport, setHasReport] = useState(false)

  const [currentRows, setCurrentRows] = useState<SalesRow[]>([])
  const [previousRows, setPreviousRows] = useState<SalesRow[]>([])
  const [territoryDirectory, setTerritoryDirectory] = useState<Map<string, TerritoryDirectoryEntry>>(new Map())
  const [panIndiaCurrentByGroup, setPanIndiaCurrentByGroup] = useState<Map<string, number>>(new Map())
  const [panIndiaPreviousByGroup, setPanIndiaPreviousByGroup] = useState<Map<string, number>>(new Map())
  const [totalPanIndiaGrowth, setTotalPanIndiaGrowth] = useState<GrowthResult | undefined>(undefined)
  const [appliedCurrentRange, setAppliedCurrentRange] = useState({ startValue: defaultMonth, endValue: defaultMonth })
  const [appliedPreviousRange, setAppliedPreviousRange] = useState({ startValue: defaultMonth, endValue: defaultMonth })

  // Reset the area filter whenever a new report is applied — old selections
  // may not exist in the newly loaded period's data.
  function resetAreaFilterAndApply() {
    setSelectedAsmAreas([])
  }

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

      // Directory covers every territory in the unfiltered superset, so
      // narrowing by area filter afterward never needs a re-fetch.
      const allTerritoryCodes = Array.from(
        new Set([...curr, ...prev].map((r) => r.territory_code ?? 'Unknown'))
      )
      const directory = await fetchTerritoryDirectory(allTerritoryCodes)

      const [panIndiaCurrentTotal, panIndiaPreviousTotal, panCurrByGroup, panPrevByGroup] =
        await Promise.all([
          fetchPanIndiaTotal(currentLabels),
          fetchPanIndiaTotal(previousLabels),
          fetchPanIndiaByGroup(currentLabels),
          fetchPanIndiaByGroup(previousLabels),
        ])

      setCurrentRows(curr)
      setPreviousRows(prev)
      setTerritoryDirectory(directory)
      setPanIndiaCurrentByGroup(panCurrByGroup)
      setPanIndiaPreviousByGroup(panPrevByGroup)
      setTotalPanIndiaGrowth(calculateGrowth(panIndiaCurrentTotal, panIndiaPreviousTotal))
      setAppliedCurrentRange({ startValue: currentStart, endValue: currentEnd })
      setAppliedPreviousRange({ startValue: previousStart, endValue: previousEnd })
      setHasReport(true)
      setError(null)
      resetAreaFilterAndApply()
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

  // Distinct ASM areas available in the currently loaded period.
  const availableAsmAreas = useMemo(() => {
    const set = new Set<string>()
    for (const row of currentRows) {
      if (row.asm_area) set.add(row.asm_area)
    }
    for (const row of previousRows) {
      if (row.asm_area) set.add(row.asm_area)
    }
    return Array.from(set).sort()
  }, [currentRows, previousRows])

  // Area-filtered rows — this is what cards/table/downloads use.
  const filteredCurrentRows = useMemo(() => {
    if (selectedAsmAreas.length === 0) return currentRows
    return currentRows.filter((r) => r.asm_area && selectedAsmAreas.includes(r.asm_area))
  }, [currentRows, selectedAsmAreas])

  const filteredPreviousRows = useMemo(() => {
    if (selectedAsmAreas.length === 0) return previousRows
    return previousRows.filter((r) => r.asm_area && selectedAsmAreas.includes(r.asm_area))
  }, [previousRows, selectedAsmAreas])

  const territoryRows = useMemo(() => {
    const raw = aggregateByTerritory(filteredCurrentRows, filteredPreviousRows)
    return attachTerritoryDirectory(raw, territoryDirectory)
  }, [filteredCurrentRows, filteredPreviousRows, territoryDirectory])

  const groupSummaries = useMemo(() => {
    const groups = aggregateByGroup(filteredCurrentRows, filteredPreviousRows)
    return groups.map((g) => {
      const panCurrent = panIndiaCurrentByGroup.get(g.groupName) ?? 0
      const panPrevious = panIndiaPreviousByGroup.get(g.groupName) ?? 0
      return { ...g, panIndiaGrowth: calculateGrowth(panCurrent, panPrevious) }
    })
  }, [filteredCurrentRows, filteredPreviousRows, panIndiaCurrentByGroup, panIndiaPreviousByGroup])

  const totalGrowth = useMemo(() => {
    if (!hasReport) return null
    return getTotalGrowth(filteredCurrentRows, filteredPreviousRows)
  }, [filteredCurrentRows, filteredPreviousRows, hasReport])

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
    selectedAsmAreas, setSelectedAsmAreas, availableAsmAreas,
    loading, error, hasReport,
    currentRows, previousRows,
    filteredCurrentRows, filteredPreviousRows,
    territoryRows, groupSummaries,
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
